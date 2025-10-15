import axios from 'axios';

// CEX API endpoints
const BINANCE_API = 'https://api.binance.com/api/v3';
const OKX_API = 'https://www.okx.com/api/v5';
const GATE_API = 'https://api.gate.io/api/v4';  // Changed from api.gateio.ws to api.gate.io for better global accessibility
const BITGET_API = 'https://api.bitget.com/api/v2';
const MEXC_API = 'https://api.mexc.com/api/v3';
const HUOBI_API = 'https://api.huobi.pro';
const BYBIT_API = 'https://api.bybit.com/v5';

export interface TokenPrice {
  token: string;
  cexPrices: {
    binance?: number;
    okx?: number;
    gate?: number;
    bitget?: number;
    mexc?: number;
    huobi?: number;
    bybit?: number;
  };
  dexPrice?: number;
  averageCexPrice?: number;
  priceDiff?: number;
  priceDiffPercent?: number;
}

/**
 * Get price from Binance
 */
export const getBinancePrice = async (symbol: string): Promise<number | null> => {
  try {
    const response = await axios.get(`${BINANCE_API}/ticker/price`, {
      params: { symbol: symbol.toUpperCase() },
      timeout: 5000,
    });
    return parseFloat(response.data.price);
  } catch (error) {
    console.error(`Binance price fetch failed for ${symbol}:`, error);
    return null;
  }
};

/**
 * Get price from OKX
 */
export const getOKXPrice = async (symbol: string): Promise<number | null> => {
  try {
    const response = await axios.get(`${OKX_API}/market/ticker`, {
      params: { instId: symbol.toUpperCase() },
      timeout: 5000,
    });
    if (response.data.data && response.data.data.length > 0) {
      return parseFloat(response.data.data[0].last);
    }
    return null;
  } catch (error) {
    console.error(`OKX price fetch failed for ${symbol}:`, error);
    return null;
  }
};

/**
 * Get price from Gate.io
 */
export const getGatePrice = async (symbol: string): Promise<number | null> => {
  try {
    const response = await axios.get(`${GATE_API}/spot/tickers`, {
      params: { currency_pair: symbol.toUpperCase() },
      timeout: 5000,
    });
    if (response.data && response.data.length > 0) {
      return parseFloat(response.data[0].last);
    }
    return null;
  } catch (error) {
    console.error(`Gate price fetch failed for ${symbol}:`, error);
    return null;
  }
};

/**
 * Get price from Bitget
 */
export const getBitgetPrice = async (symbol: string): Promise<number | null> => {
  try {
    const response = await axios.get(`${BITGET_API}/spot/market/tickers`, {
      params: { symbol: symbol.toUpperCase() },
      timeout: 5000,
    });
    if (response.data.data && response.data.data.length > 0) {
      return parseFloat(response.data.data[0].lastPr);
    }
    return null;
  } catch (error) {
    console.error(`Bitget price fetch failed for ${symbol}:`, error);
    return null;
  }
};

/**
 * Get price from MEXC
 */
export const getMEXCPrice = async (symbol: string): Promise<number | null> => {
  try {
    const response = await axios.get(`${MEXC_API}/ticker/price`, {
      params: { symbol: symbol.toUpperCase() },
      timeout: 5000,
    });
    return parseFloat(response.data.price);
  } catch (error) {
    console.error(`MEXC price fetch failed for ${symbol}:`, error);
    return null;
  }
};

/**
 * Get price from Huobi
 */
export const getHuobiPrice = async (symbol: string): Promise<number | null> => {
  try {
    const response = await axios.get(`${HUOBI_API}/market/detail/merged`, {
      params: { symbol: symbol.toLowerCase() },
      timeout: 5000,
    });
    if (response.data.tick) {
      return parseFloat(response.data.tick.close);
    }
    return null;
  } catch (error) {
    console.error(`Huobi price fetch failed for ${symbol}:`, error);
    return null;
  }
};

/**
 * Get price from Bybit
 */
export const getBybitPrice = async (symbol: string): Promise<number | null> => {
  try {
    const response = await axios.get(`${BYBIT_API}/market/tickers`, {
      params: { category: 'spot', symbol: symbol.toUpperCase() },
      timeout: 5000,
    });
    if (response.data.result && response.data.result.list && response.data.result.list.length > 0) {
      return parseFloat(response.data.result.list[0].lastPrice);
    }
    return null;
  } catch (error) {
    console.error(`Bybit price fetch failed for ${symbol}:`, error);
    return null;
  }
};

/**
 * Get all CEX prices for a token
 */
export const getAllCEXPrices = async (symbol: string): Promise<TokenPrice['cexPrices']> => {
  const [binance, okx, gate, bitget, mexc, huobi, bybit] = await Promise.all([
    getBinancePrice(symbol),
    getOKXPrice(symbol),
    getGatePrice(symbol),
    getBitgetPrice(symbol),
    getMEXCPrice(symbol),
    getHuobiPrice(symbol),
    getBybitPrice(symbol),
  ]);

  return {
    binance: binance ?? undefined,
    okx: okx ?? undefined,
    gate: gate ?? undefined,
    bitget: bitget ?? undefined,
    mexc: mexc ?? undefined,
    huobi: huobi ?? undefined,
    bybit: bybit ?? undefined,
  };
};

/**
 * Calculate average CEX price
 */
export const calculateAverageCEXPrice = (cexPrices: TokenPrice['cexPrices']): number | undefined => {
  const prices = Object.values(cexPrices).filter((p): p is number => p !== undefined);
  if (prices.length === 0) return undefined;
  return prices.reduce((sum, price) => sum + price, 0) / prices.length;
};

/**
 * Get token price data with CEX and DEX comparison
 */
export const getTokenPriceData = async (
  token: string,
  cexSymbol: string,
  dexPrice?: number
): Promise<TokenPrice> => {
  const cexPrices = await getAllCEXPrices(cexSymbol);
  const averageCexPrice = calculateAverageCEXPrice(cexPrices);
  
  let priceDiff: number | undefined;
  let priceDiffPercent: number | undefined;
  let normalizedDexPrice: number | undefined = dexPrice;
  
  // Normalize DEX price for comparison
  if (dexPrice !== undefined && averageCexPrice !== undefined) {
    // For stablecoins, DEX price should be close to 1.0
    if (['aeUSDC', 'USDA', 'USDC', 'sUSDT', 'USDT'].includes(token)) {
      // Stablecoins should be ~1.0, normalize to USDT
      normalizedDexPrice = 1.0;
    } else {
      normalizedDexPrice = dexPrice;
    }
    
    priceDiff = normalizedDexPrice - averageCexPrice;
    priceDiffPercent = (priceDiff / averageCexPrice) * 100;
  }
  
  return {
    token,
    cexPrices,
    dexPrice: normalizedDexPrice,
    averageCexPrice,
    priceDiff,
    priceDiffPercent,
  };
};

/**
 * Token symbol mapping for CEX
 * Maps DEX tokens to their CEX equivalents
 * Note: aeUSDC, USDA, USDC, USDT, sUSDT are all stable coins ≈ $1
 *       sBTC, xBTC, aBTC are all Bitcoin equivalents
 */
export const getCEXSymbol = (token: string): string => {
  const symbolMap: Record<string, string> = {
    'STX': 'STXUSDT',
    // Bitcoin equivalents - all map to BTC
    'SBTC': 'BTCUSDT',
    'sBTC': 'BTCUSDT',
    'xBTC': 'BTCUSDT',
    'aBTC': 'BTCUSDT',
    // Stablecoin equivalents - all map to USDT
    'aeUSDC': 'USDTUSDT',  // Changed from USDCUSDT to USDTUSDT for better liquidity
    'USDA': 'USDTUSDT',     // Changed from USDAUSDT
    'USDC': 'USDTUSDT',
    'sUSDT': 'USDTUSDT',
    'USDT': 'USDTUSDT',
    // Other tokens
    'ALEX': 'ALEXUSDT',
    'VELAR': 'VELARUSDT',
    'WELSH': 'WELSHUSDT',
    'DIKO': 'DIKOUSDT',
    'DOG': 'DOGUSDT',  // Added DOG token
  };
  
  return symbolMap[token] || `${token}USDT`;
};
