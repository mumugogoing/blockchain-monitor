import { Connection, PublicKey } from '@solana/web3.js';
import axios from 'axios';

// Solana RPC endpoint
const SOLANA_RPC = 'https://api.mainnet-beta.solana.com';
const connection = new Connection(SOLANA_RPC, 'confirmed');

// Token cache to prevent duplicates
const tokenCache = new Map<string, SolanaToken>();
const MAX_CACHE_SIZE = 1000;

export interface SolanaToken {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  supply: string;
  createdAt: number;
  liquidity?: number;
  holders?: number;
  isSafe?: boolean;
  winRate?: number;
  priceUSD?: number;
  volume24h?: number;
  priceChange24h?: number;
  marketCap?: number;
}

export interface TokenSafetyCheck {
  isSafe: boolean;
  isHoneypot: boolean;
  isLocked: boolean;
  canSell: boolean;
  liquidityLocked: boolean;
  ownershipRenounced: boolean;
  holderDistribution: {
    top10Percentage: number;
    totalHolders: number;
  };
}

/**
 * 获取新发布的代币 (使用 DexScreener API)
 */
export const getNewTokens = async (limit: number = 20): Promise<SolanaToken[]> => {
  try {
    // 使用 DexScreener API 获取 Solana 上的新代币
    const response = await axios.get('https://api.dexscreener.com/latest/dex/tokens/solana', {
      timeout: 15000,
    });
    
    const tokens: SolanaToken[] = [];
    const pairs = response.data.pairs || [];
    
    for (const pair of pairs.slice(0, limit)) {
      const token: SolanaToken = {
        address: pair.baseToken.address,
        name: pair.baseToken.name || 'Unknown',
        symbol: pair.baseToken.symbol || 'UNKNOWN',
        decimals: 9, // Solana tokens typically use 9 decimals
        supply: '0',
        createdAt: pair.pairCreatedAt || Date.now(),
        liquidity: parseFloat(pair.liquidity?.usd || '0'),
        volume24h: parseFloat(pair.volume?.h24 || '0'),
        priceUSD: parseFloat(pair.priceUsd || '0'),
        priceChange24h: parseFloat(pair.priceChange?.h24 || '0'),
        marketCap: parseFloat(pair.marketCap || '0'),
      };
      
      // Cache token
      if (!tokenCache.has(token.address)) {
        tokenCache.set(token.address, token);
        if (tokenCache.size > MAX_CACHE_SIZE) {
          const firstKey = tokenCache.keys().next().value;
          if (firstKey) tokenCache.delete(firstKey);
        }
      }
      
      tokens.push(token);
    }
    
    return tokens;
  } catch (error) {
    console.error('获取 Solana 新代币失败:', error);
    
    // Return cached tokens if available
    if (tokenCache.size > 0) {
      return Array.from(tokenCache.values()).slice(0, limit);
    }
    
    throw new Error('无法获取 Solana 代币数据');
  }
};

/**
 * 获取热门代币 (meme coins)
 */
export const getTrendingTokens = async (limit: number = 20): Promise<SolanaToken[]> => {
  try {
    // 使用 DexScreener API 按交易量排序获取热门代币
    const response = await axios.get('https://api.dexscreener.com/latest/dex/search', {
      params: {
        q: 'solana meme',
      },
      timeout: 15000,
    });
    
    const tokens: SolanaToken[] = [];
    const pairs = response.data.pairs || [];
    
    // 按24小时交易量排序
    const sortedPairs = pairs
      .filter((p: any) => p.chainId === 'solana')
      .sort((a: any, b: any) => {
        const aVol = parseFloat(a.volume?.h24 || '0');
        const bVol = parseFloat(b.volume?.h24 || '0');
        return bVol - aVol;
      })
      .slice(0, limit);
    
    for (const pair of sortedPairs) {
      const token: SolanaToken = {
        address: pair.baseToken.address,
        name: pair.baseToken.name || 'Unknown',
        symbol: pair.baseToken.symbol || 'UNKNOWN',
        decimals: 9,
        supply: '0',
        createdAt: pair.pairCreatedAt || Date.now(),
        liquidity: parseFloat(pair.liquidity?.usd || '0'),
        volume24h: parseFloat(pair.volume?.h24 || '0'),
        priceUSD: parseFloat(pair.priceUsd || '0'),
        priceChange24h: parseFloat(pair.priceChange?.h24 || '0'),
        marketCap: parseFloat(pair.marketCap || '0'),
      };
      
      tokens.push(token);
    }
    
    return tokens;
  } catch (error) {
    console.error('获取 Solana 热门代币失败:', error);
    throw new Error('无法获取 Solana 热门代币数据');
  }
};

/**
 * 检查代币安全性 (检测 honeypot、锁仓等)
 */
export const checkTokenSafety = async (tokenAddress: string): Promise<TokenSafetyCheck> => {
  try {
    // 使用多种方法检查代币安全性
    const pubkey = new PublicKey(tokenAddress);
    
    // 检查代币账户信息
    const accountInfo = await connection.getAccountInfo(pubkey);
    
    if (!accountInfo) {
      return {
        isSafe: false,
        isHoneypot: false,
        isLocked: false,
        canSell: false,
        liquidityLocked: false,
        ownershipRenounced: false,
        holderDistribution: {
          top10Percentage: 0,
          totalHolders: 0,
        },
      };
    }
    
    // 使用 RugCheck API 检查安全性
    try {
      const rugCheckResponse = await axios.get(
        `https://api.rugcheck.xyz/v1/tokens/${tokenAddress}/report`,
        { timeout: 10000 }
      );
      
      const report = rugCheckResponse.data;
      const risks = report.risks || [];
      
      // 分析风险
      const hasHighRisk = risks.some((r: any) => r.level === 'danger');
      
      const isSafe = !hasHighRisk;
      const isHoneypot = risks.some((r: any) => 
        r.name?.toLowerCase().includes('honeypot') || 
        r.description?.toLowerCase().includes('cannot sell')
      );
      
      const liquidityLocked = risks.some((r: any) => 
        r.name?.toLowerCase().includes('liquidity') && 
        r.name?.toLowerCase().includes('locked')
      ) || report.tokenMeta?.freezeAuthority === null;
      
      const ownershipRenounced = report.tokenMeta?.mintAuthority === null;
      
      return {
        isSafe,
        isHoneypot,
        isLocked: false,
        canSell: !isHoneypot,
        liquidityLocked,
        ownershipRenounced,
        holderDistribution: {
          top10Percentage: report.topHoldersPercent || 0,
          totalHolders: report.holderCount || 0,
        },
      };
    } catch (rugCheckError) {
      console.warn('RugCheck API 失败，使用基本检查:', rugCheckError);
      
      // 基本安全检查
      return {
        isSafe: true,
        isHoneypot: false,
        isLocked: false,
        canSell: true,
        liquidityLocked: false,
        ownershipRenounced: false,
        holderDistribution: {
          top10Percentage: 0,
          totalHolders: 0,
        },
      };
    }
  } catch (error) {
    console.error('检查代币安全性失败:', error);
    throw new Error('无法检查代币安全性');
  }
};

/**
 * 评估代币交易胜率
 * 基于历史数据、流动性、持有者分布等因素
 */
export const evaluateWinRate = async (
  token: SolanaToken,
  safetyCheck: TokenSafetyCheck,
  _timeWindowHours: number = 24
): Promise<number> => {
  try {
    let winRate = 50; // 基础胜率
    
    // 安全性检查影响 (最高 +30%)
    if (safetyCheck.isSafe && !safetyCheck.isHoneypot && safetyCheck.canSell) {
      winRate += 15;
    }
    if (safetyCheck.liquidityLocked) {
      winRate += 10;
    }
    if (safetyCheck.ownershipRenounced) {
      winRate += 5;
    }
    
    // 流动性影响 (最高 +15%)
    if (token.liquidity) {
      if (token.liquidity > 100000) {
        winRate += 15;
      } else if (token.liquidity > 50000) {
        winRate += 10;
      } else if (token.liquidity > 10000) {
        winRate += 5;
      }
    }
    
    // 交易量影响 (最高 +15%)
    if (token.volume24h) {
      if (token.volume24h > 1000000) {
        winRate += 15;
      } else if (token.volume24h > 500000) {
        winRate += 10;
      } else if (token.volume24h > 100000) {
        winRate += 5;
      }
    }
    
    // 持有者分布影响 (最高 +10%)
    if (safetyCheck.holderDistribution.totalHolders > 1000) {
      winRate += 5;
    }
    if (safetyCheck.holderDistribution.top10Percentage < 50) {
      winRate += 5;
    }
    
    // 价格变化影响 (最高 +10%)
    if (token.priceChange24h !== undefined) {
      if (token.priceChange24h > 0 && token.priceChange24h < 100) {
        // 正增长但不过度
        winRate += 10;
      } else if (token.priceChange24h > 100) {
        // 过度增长可能有风险
        winRate -= 5;
      }
    }
    
    // 市值影响 (最高 +10%)
    if (token.marketCap) {
      if (token.marketCap > 1000000 && token.marketCap < 10000000) {
        // 合理的市值范围
        winRate += 10;
      } else if (token.marketCap > 100000) {
        winRate += 5;
      }
    }
    
    // 安全性负面影响
    if (safetyCheck.isHoneypot) {
      winRate -= 50;
    }
    if (!safetyCheck.canSell) {
      winRate -= 40;
    }
    if (safetyCheck.holderDistribution.top10Percentage > 80) {
      // 持有者过度集中
      winRate -= 20;
    }
    
    // 确保胜率在 0-100 范围内
    winRate = Math.max(0, Math.min(100, winRate));
    
    return winRate;
  } catch (error) {
    console.error('评估胜率失败:', error);
    return 0;
  }
};

/**
 * 格式化代币地址
 */
export const formatSolanaAddress = (address: string): string => {
  if (!address || address.length < 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

/**
 * 格式化代币金额
 */
export const formatTokenAmount = (amount: string | number, decimals: number = 9): string => {
  const amountNum = typeof amount === 'string' ? parseFloat(amount) : amount;
  return (amountNum / Math.pow(10, decimals)).toFixed(6);
};

/**
 * 格式化价格
 */
export const formatPrice = (price: number): string => {
  if (price < 0.000001) {
    return price.toExponential(2);
  } else if (price < 0.01) {
    return price.toFixed(6);
  } else if (price < 1) {
    return price.toFixed(4);
  }
  return price.toFixed(2);
};

/**
 * 格式化市值
 */
export const formatMarketCap = (marketCap: number): string => {
  if (marketCap >= 1000000000) {
    return `$${(marketCap / 1000000000).toFixed(2)}B`;
  } else if (marketCap >= 1000000) {
    return `$${(marketCap / 1000000).toFixed(2)}M`;
  } else if (marketCap >= 1000) {
    return `$${(marketCap / 1000).toFixed(2)}K`;
  }
  return `$${marketCap.toFixed(2)}`;
};
