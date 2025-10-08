import axios from 'axios';

const STACKS_API_BASE = 'https://api.mainnet.hiro.so';
const ALEX_API_BASE = 'https://api.alexgo.io/v2/public';
const BITFLOW_API_BASE = 'https://app.bitflow.finance/api/sdk';

interface AlexPool {
  token_x: string;
  token_y: string;
  balance_x: number;
  balance_y: number;
}

interface AlexPoolsResponse {
  pools: AlexPool[];
}

interface BitflowPoolData {
  balance_x: number;
  balance_y: number;
}

interface BitflowPoolResponse {
  data: {
    sbtc?: BitflowPoolData;
    [key: string]: any;
  };
}

interface BitflowQuoteResponse {
  amountOut: number;
  route: any[];
  priceImpact: number;
}

/**
 * Get DEX price from Alex pools
 */
const getAlexPrice = async (tokenX: string, tokenY: string): Promise<number | null> => {
  try {
    const response = await axios.get<AlexPoolsResponse>(`${ALEX_API_BASE}/pools`, {
      timeout: 5000,
    });
    
    if (response.data && response.data.pools) {
      const pool = response.data.pools.find(
        (p) => p.token_x === tokenX && p.token_y === tokenY
      );
      
      if (pool && pool.balance_x > 0 && pool.balance_y > 0) {
        return pool.balance_y / pool.balance_x;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Failed to fetch Alex price:', error);
    return null;
  }
};

/**
 * Get DEX price from Bitflow Quote API
 * This provides more accurate pricing by simulating an actual swap
 */
const getBitflowQuotePrice = async (
  tokenXId: string,
  tokenYId: string,
  amount: number = 1000000 // Default 1 STX in microSTX
): Promise<number | null> => {
  try {
    const response = await axios.get<BitflowQuoteResponse>(
      `${BITFLOW_API_BASE}/quote-for-route`,
      {
        params: {
          tokenXId,
          tokenYId,
          amount,
          timestamp: Date.now(),
        },
        timeout: 10000,
      }
    );
    
    if (response.data && response.data.amountOut) {
      // Calculate price: amountOut / amountIn
      return response.data.amountOut / amount;
    }
    
    return null;
  } catch (error) {
    console.error(`Failed to fetch Bitflow quote for ${tokenXId}/${tokenYId}:`, error);
    return null;
  }
};

/**
 * Get DEX price from Bitflow/XYK pools (fallback method)
 */
const getBitflowPrice = async (contractAddress: string): Promise<number | null> => {
  try {
    const response = await axios.get<BitflowPoolResponse>(
      `${BITFLOW_API_BASE}/get-pool-by-contract`,
      {
        params: { contract: contractAddress },
        timeout: 5000,
      }
    );
    
    if (response.data && response.data.data) {
      const poolData = response.data.data.sbtc || response.data.data;
      if (poolData && poolData.balance_x > 0 && poolData.balance_y > 0) {
        return poolData.balance_y / poolData.balance_x;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Failed to fetch Bitflow price:', error);
    return null;
  }
};

/**
 * Get DEX price from Stacks contract calls
 */
export const getDEXPrice = async (tokenPair: string): Promise<number | null> => {
  try {
    // Map token pairs to their DEX sources
    switch (tokenPair) {
      case 'STX-USDC':
      case 'STX-AEUSDC':
        // Use Bitflow Quote API for STX/aeUSDC (1 STX = ? aeUSDC)
        const stxAeusdcPrice = await getBitflowQuotePrice('token-stx', 'token-aeusdc', 1000000);
        if (stxAeusdcPrice) return stxAeusdcPrice;
        
        // Fallback to Alex
        const alexStxPrice = await getAlexPrice('token-wstx', 'token-susdt');
        if (alexStxPrice) return alexStxPrice;
        
        // Last fallback to XYK pool
        return await getBitflowPrice('sm1793c4r5pz4ns4vq4wmp7skkyvh8jzewsz9hccr.xyk-pool-stx-aeusdc-v-1-2');
        
      case 'STX-SBTC':
        // Use Bitflow Quote API for STX/sBTC
        const stxSbtcPrice = await getBitflowQuotePrice('token-stx', 'token-sbtc', 3000000000);
        if (stxSbtcPrice) {
          // Convert to BTC price (STX price in BTC terms)
          // We need to get the BTC/USD price to normalize this
          return stxSbtcPrice;
        }
        
        // Fallback to Bitflow/XYK for sBTC-STX
        const bitflowSbtcPrice = await getBitflowPrice('sm1793c4r5pz4ns4vq4wmp7skkyvh8jzewsz9hccr.xyk-pool-sbtc-stx-v-1-1');
        if (bitflowSbtcPrice) return bitflowSbtcPrice;
        
        // Try Alex as fallback
        return await getAlexPrice('token-wstx', 'token-sbtc');
        
      case 'USDA-AEUSDC':
        // Use Bitflow Quote API for USDA/aeUSDC
        const usdaPrice = await getBitflowQuotePrice('token-usda', 'token-aeusdc', 1000000);
        if (usdaPrice) return usdaPrice;
        
        // Try XYK stableswap
        return await getBitflowPrice('spqc38pw542eqj5m11cr25p7bs1ca6qt4tbxgb3m.stableswap-usda-aeusdc-v-1-4');
      
      case 'DOG-STX':
        // Use Bitflow Quote API for DOG/STX
        const dogStxPrice = await getBitflowQuotePrice('token-dog', 'token-stx', 526489688400);
        if (dogStxPrice) return dogStxPrice;
        return null;
        
      case 'DOG-SBTC':
        // Use Bitflow Quote API for DOG/sBTC
        const dogSbtcPrice = await getBitflowQuotePrice('token-dog', 'token-sbtc', 526489688400);
        if (dogSbtcPrice) return dogSbtcPrice;
        return null;
        
      default:
        console.log(`DEX price fetch for ${tokenPair} - no configuration found`);
        return null;
    }
  } catch (error) {
    console.error(`DEX price fetch failed for ${tokenPair}:`, error);
    return null;
  }
};

/**
 * Get pool reserves from XYK DEX
 */
export const getXYKPoolReserves = async (
  contractAddress: string,
  contractName: string
): Promise<{ reserveX: number; reserveY: number } | null> => {
  try {
    const response = await axios.post(
      `${STACKS_API_BASE}/v2/contracts/call-read/${contractAddress}/${contractName}/get-pool-details`,
      {
        sender: contractAddress,
        arguments: [],
      },
      {
        timeout: 10000,
      }
    );
    
    // Parse the response to extract reserves
    // This is a placeholder - actual parsing depends on the contract's response format
    if (response.data && response.data.result) {
      // Example parsing - adjust based on actual contract response
      return {
        reserveX: 0,
        reserveY: 0,
      };
    }
    
    return null;
  } catch (error) {
    console.error('Failed to get XYK pool reserves:', error);
    return null;
  }
};

/**
 * Calculate price from pool reserves
 */
export const calculatePriceFromReserves = (
  reserveX: number,
  reserveY: number,
  decimalsX: number = 6,
  decimalsY: number = 6
): number => {
  const adjustedX = reserveX / Math.pow(10, decimalsX);
  const adjustedY = reserveY / Math.pow(10, decimalsY);
  
  if (adjustedX === 0) return 0;
  return adjustedY / adjustedX;
};

/**
 * Common DEX pool configurations
 */
export const DEX_POOLS: Record<string, { address: string; name: string; tokenX: string; tokenY: string }> = {
  'STX-AEUSDC': {
    address: 'SM1793C4R5PZ4NS4VQ4WMP7SKKYVH8JZEWSZ9HCCR',
    name: 'xyk-pool-stx-aeusdc-v-1-2',
    tokenX: 'STX',
    tokenY: 'aeUSDC',
  },
  'STX-SBTC': {
    address: 'SM1793C4R5PZ4NS4VQ4WMP7SKKYVH8JZEWSZ9HCCR',
    name: 'xyk-pool-sbtc-stx-v-1-1',
    tokenX: 'STX',
    tokenY: 'sBTC',
  },
  'USDA-AEUSDC': {
    address: 'SPQC38PW542EQJ5M11CR25P7BS1CA6QT4TBXGB3M',
    name: 'stableswap-usda-aeusdc-v-1-4',
    tokenX: 'USDA',
    tokenY: 'aeUSDC',
  },
};
