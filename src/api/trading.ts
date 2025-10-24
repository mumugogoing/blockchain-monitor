// Trading API - OKX Wallet SDK integration

// Trading configuration
export interface TradingConfig {
  enabled: boolean;
  maxSlippage: number; // percentage
  minLiquidity: number; // USD
  minWinRate: number; // percentage (e.g., 80 for 80%)
  maxTradeAmount: number; // USD
  useOKXWallet: boolean; // if false, use private key
  privateKey?: string;
  riskControlEnabled: boolean;
}

// Trade execution result
export interface TradeResult {
  success: boolean;
  transactionHash?: string;
  error?: string;
  timestamp: number;
}

// Default trading configuration
export const defaultTradingConfig: TradingConfig = {
  enabled: false,
  maxSlippage: 5,
  minLiquidity: 10000,
  minWinRate: 80,
  maxTradeAmount: 100,
  useOKXWallet: true,
  riskControlEnabled: true,
};

/**
 * 获取交易配置
 */
export const getTradingConfig = (): TradingConfig => {
  const stored = localStorage.getItem('trading_config');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error('解析交易配置失败:', e);
    }
  }
  return defaultTradingConfig;
};

/**
 * 保存交易配置
 */
export const saveTradingConfig = (config: TradingConfig): void => {
  localStorage.setItem('trading_config', JSON.stringify(config));
};

/**
 * 风控检查
 */
export const performRiskControl = (
  _tokenAddress: string,
  liquidity: number,
  winRate: number,
  config: TradingConfig
): { passed: boolean; reason?: string } => {
  if (!config.riskControlEnabled) {
    return { passed: true };
  }
  
  // 检查流动性
  if (liquidity < config.minLiquidity) {
    return {
      passed: false,
      reason: `流动性不足: $${liquidity.toFixed(2)} < $${config.minLiquidity}`,
    };
  }
  
  // 检查胜率
  if (winRate < config.minWinRate) {
    return {
      passed: false,
      reason: `胜率不足: ${winRate.toFixed(2)}% < ${config.minWinRate}%`,
    };
  }
  
  return { passed: true };
};

/**
 * 执行 Solana 交易 (使用 OKX Wallet 或私钥)
 */
export const executeSolanaTrade = async (
  tokenAddress: string,
  amount: number,
  isBuy: boolean = true,
  config: TradingConfig
): Promise<TradeResult> => {
  try {
    if (!config.enabled) {
      return {
        success: false,
        error: '交易功能未启用',
        timestamp: Date.now(),
      };
    }
    
    // 检查交易金额
    if (amount > config.maxTradeAmount) {
      return {
        success: false,
        error: `交易金额超过限制: $${amount} > $${config.maxTradeAmount}`,
        timestamp: Date.now(),
      };
    }
    
    // 使用 OKX Wallet
    if (config.useOKXWallet) {
      // Check if OKX Wallet is available
      if (typeof window !== 'undefined' && (window as any).okxwallet) {
        const okxwallet = (window as any).okxwallet;
        
        try {
          // Connect to OKX Wallet
          const accounts = await okxwallet.solana.connect();
          
          if (!accounts || accounts.length === 0) {
            return {
              success: false,
              error: '未连接到 OKX 钱包',
              timestamp: Date.now(),
            };
          }
          
          // 这里需要实际的交易逻辑
          // 由于需要与 DEX 路由器交互，这里只提供框架
          console.log('使用 OKX Wallet 执行交易:', {
            tokenAddress,
            amount,
            isBuy,
            account: accounts[0],
          });
          
          return {
            success: false,
            error: 'OKX Wallet 交易功能待实现 - 需要集成 Jupiter 或 Raydium SDK',
            timestamp: Date.now(),
          };
        } catch (error: any) {
          return {
            success: false,
            error: `OKX Wallet 交易失败: ${error.message}`,
            timestamp: Date.now(),
          };
        }
      } else {
        return {
          success: false,
          error: '未检测到 OKX Wallet',
          timestamp: Date.now(),
        };
      }
    } else {
      // 使用私钥
      if (!config.privateKey) {
        return {
          success: false,
          error: '未配置私钥',
          timestamp: Date.now(),
        };
      }
      
      return {
        success: false,
        error: '私钥交易功能待实现 - 需要集成 Jupiter 或 Raydium SDK',
        timestamp: Date.now(),
      };
    }
  } catch (error: any) {
    console.error('执行 Solana 交易失败:', error);
    return {
      success: false,
      error: error.message || '交易执行失败',
      timestamp: Date.now(),
    };
  }
};

/**
 * 执行 Base 交易 (使用 OKX Wallet 或私钥)
 */
export const executeBaseTrade = async (
  tokenAddress: string,
  amount: number,
  isBuy: boolean = true,
  config: TradingConfig
): Promise<TradeResult> => {
  try {
    if (!config.enabled) {
      return {
        success: false,
        error: '交易功能未启用',
        timestamp: Date.now(),
      };
    }
    
    // 检查交易金额
    if (amount > config.maxTradeAmount) {
      return {
        success: false,
        error: `交易金额超过限制: $${amount} > $${config.maxTradeAmount}`,
        timestamp: Date.now(),
      };
    }
    
    // 使用 OKX Wallet
    if (config.useOKXWallet) {
      // Check if OKX Wallet is available
      if (typeof window !== 'undefined' && (window as any).okxwallet) {
        const okxwallet = (window as any).okxwallet;
        
        try {
          // Request account access
          const accounts = await okxwallet.request({
            method: 'eth_requestAccounts',
          });
          
          if (!accounts || accounts.length === 0) {
            return {
              success: false,
              error: '未连接到 OKX 钱包',
              timestamp: Date.now(),
            };
          }
          
          // 这里需要实际的交易逻辑
          // 由于需要与 Uniswap V3 或其他 DEX 交互，这里只提供框架
          console.log('使用 OKX Wallet 执行 Base 交易:', {
            tokenAddress,
            amount,
            isBuy,
            account: accounts[0],
          });
          
          return {
            success: false,
            error: 'OKX Wallet Base 交易功能待实现 - 需要集成 Uniswap SDK',
            timestamp: Date.now(),
          };
        } catch (error: any) {
          return {
            success: false,
            error: `OKX Wallet 交易失败: ${error.message}`,
            timestamp: Date.now(),
          };
        }
      } else {
        return {
          success: false,
          error: '未检测到 OKX Wallet',
          timestamp: Date.now(),
        };
      }
    } else {
      // 使用私钥
      if (!config.privateKey) {
        return {
          success: false,
          error: '未配置私钥',
          timestamp: Date.now(),
        };
      }
      
      return {
        success: false,
        error: '私钥交易功能待实现 - 需要集成 Uniswap SDK',
        timestamp: Date.now(),
      };
    }
  } catch (error: any) {
    console.error('执行 Base 交易失败:', error);
    return {
      success: false,
      error: error.message || '交易执行失败',
      timestamp: Date.now(),
    };
  }
};

/**
 * 检查 OKX Wallet 是否可用
 */
export const isOKXWalletAvailable = (): boolean => {
  if (typeof window === 'undefined') return false;
  return !!(window as any).okxwallet;
};

/**
 * 连接 OKX Wallet
 */
export const connectOKXWallet = async (): Promise<{ success: boolean; error?: string }> => {
  try {
    if (!isOKXWalletAvailable()) {
      return {
        success: false,
        error: '未检测到 OKX Wallet。请安装 OKX Wallet 浏览器扩展。',
      };
    }
    
    const okxwallet = (window as any).okxwallet;
    
    // 尝试连接 Solana
    try {
      await okxwallet.solana.connect();
    } catch (e) {
      console.warn('Solana 连接失败:', e);
    }
    
    // 尝试连接 EVM (Base)
    try {
      await okxwallet.request({ method: 'eth_requestAccounts' });
    } catch (e) {
      console.warn('EVM 连接失败:', e);
    }
    
    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || '连接 OKX Wallet 失败',
    };
  }
};
