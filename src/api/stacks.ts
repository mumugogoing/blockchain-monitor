import axios from 'axios';

// Stacks 公共API基础URL - 使用 Hiro API (免费)
const STACKS_API_BASE = 'https://api.mainnet.hiro.so';

// 交易缓存，防止重复显示和遗漏
const transactionCache = new Map<string, StacksTransaction>();
const MAX_CACHE_SIZE = 1000;

export interface StacksTransaction {
  tx_id: string;
  tx_type: string;
  tx_status: string;
  block_height: number;
  burn_block_time: number;
  sender_address: string;
  fee_rate: string;
  nonce: number;
  contract_call?: {
    contract_id: string;
    function_name: string;
    function_args?: unknown[];
  };
  token_transfer?: {
    recipient_address: string;
    amount: string;
    memo: string;
  };
}

export interface StacksTransactionResponse {
  limit: number;
  offset: number;
  total: number;
  results: StacksTransaction[];
}

/**
 * 获取最新的 Stacks 交易（带缓存防止遗漏）
 * @param limit 每页数量
 * @param offset 偏移量
 */
export const getStacksTransactions = async (
  limit: number = 20,
  offset: number = 0
): Promise<StacksTransactionResponse> => {
  try {
    const response = await axios.get(`${STACKS_API_BASE}/extended/v1/tx`, {
      params: {
        limit,
        offset,
      },
      timeout: 15000,
    });
    
    // 缓存交易以防止遗漏
    const data = response.data as StacksTransactionResponse;
    data.results.forEach(tx => {
      if (!transactionCache.has(tx.tx_id)) {
        transactionCache.set(tx.tx_id, tx);
        
        // 限制缓存大小
        if (transactionCache.size > MAX_CACHE_SIZE) {
          const firstKey = transactionCache.keys().next().value;
          if (firstKey) transactionCache.delete(firstKey);
        }
      }
    });
    
    return data;
  } catch (error) {
    console.error('获取 Stacks 交易失败:', error);
    throw error;
  }
};

/**
 * 获取缓存的交易数量
 */
export const getCachedTransactionCount = (): number => {
  return transactionCache.size;
};

/**
 * 获取特定地址的交易
 * @param address 地址
 * @param limit 每页数量
 * @param offset 偏移量
 */
export const getAddressTransactions = async (
  address: string,
  limit: number = 20,
  offset: number = 0
): Promise<StacksTransactionResponse> => {
  try {
    const response = await axios.get(
      `${STACKS_API_BASE}/extended/v1/address/${address}/transactions`,
      {
        params: {
          limit,
          offset,
        },
        timeout: 15000,
      }
    );
    return response.data;
  } catch (error) {
    console.error('获取地址交易失败:', error);
    throw error;
  }
};

/**
 * 解析交易类型为中文
 */
export const parseStacksTransactionType = (type: string): string => {
  const typeMap: Record<string, string> = {
    token_transfer: '代币转账',
    contract_call: '合约调用',
    smart_contract: '智能合约',
    coinbase: 'Coinbase',
    poison_microblock: '毒微块',
    tenure_change: '任期变更',
  };
  return typeMap[type] || type;
};

/**
 * 解析交易状态为中文
 */
export const parseStacksTransactionStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    success: '成功',
    pending: '待处理',
    abort_by_response: '响应中止',
    abort_by_post_condition: '后置条件中止',
  };
  return statusMap[status] || status;
};

/**
 * 格式化地址
 */
export const formatStacksAddress = (address: string): string => {
  if (!address || address.length < 10) return address;
  return `${address.slice(0, 8)}...${address.slice(-6)}`;
};

/**
 * 格式化时间戳
 */
export const formatStacksTimestamp = (timestamp: number): string => {
  const date = new Date(timestamp * 1000);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

/**
 * 解析合约调用平台
 */
export const parseContractPlatform = (contractId: string): string => {
  if (!contractId) return '未知';
  
  // 常见的 Stacks DeFi 平台合约
  const platformMap: Record<string, string> = {
    // ALEX
    'SP3K8BC0PPEVCV7NZ6QSRWPQ2JE9E5B6N3PA0KBR9.alex': 'ALEX',
    'SP3K8BC0PPEVCV7NZ6QSRWPQ2JE9E5B6N3PA0KBR9.amm-swap-pool': 'ALEX',
    'SP3K8BC0PPEVCV7NZ6QSRWPQ2JE9E5B6N3PA0KBR9.amm-pool-v2-01': 'ALEX',
    'SP3K8BC0PPEVCV7NZ6QSRWPQ2JE9E5B6N3PA0KBR9.swap-helper': 'ALEX',
    'SP102V8P0F7JX67ARQ77WEA3D3CFB5XW39REDT0AM.amm-pool-v2-01': 'ALEX',
    'SPQC38PW542EQJ5M11CR25P7BS1CA6QT4TBXGB3M.wrapper-alex-v-2-1': 'ALEX',
    // Arkadiko
    'SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR.arkadiko': 'Arkadiko',
    'SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR.arkadiko-swap': 'Arkadiko',
    'SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR.arkadiko-swap-v2-1': 'Arkadiko',
    'SPQC38PW542EQJ5M11CR25P7BS1CA6QT4TBXGB3M.wrapper-arkadiko-v-1-1': 'Arkadiko',
    // Stackswap
    'SP1Z92MPDQEWZXW36VX71Q25HKF5K2EPCJ304F275.stackswap': 'Stackswap',
    'SP1Z92MPDQEWZXW36VX71Q25HKF5K2EPCJ304F275.stackswap-swap-v5k': 'Stackswap',
    // Bitflow
    'SP3MBWGMCVC9KZ5DTAYFMG1D0AEJCR7NENTM3FTK5.bitflow': 'Bitflow',
    'SP2XD7417HGPRTREMKF748VNEQPDRR0RMANB7X1NK.bitflow-router': 'Bitflow',
    'SP2XD7417HGPRTREMKF748VNEQPDRR0RMANB7X1NK.bitflow-swap': 'Bitflow',
    'SP2XD7417HGPRTREMKF748VNEQPDRR0RMANB7X1NK.bitflow-core': 'Bitflow',
    'SP2XD7417HGPRTREMKF748VNEQPDRR0RMANB7X1NK.bitflow-vault': 'Bitflow',
    'SP2XD7417HGPRTREMKF748VNEQPDRR0RMANB7X1NK.bitflow-amm': 'Bitflow',
    'SP2XD7417HGPRTREMKF748VNEQPDRR0RMANB7X1NK.bitflow-pool': 'Bitflow',
    'SP3MBWGMCVC9KZ5DTAYFMG1D0AEJCR7NENTM3FTK5.bitflow-v2': 'Bitflow',
    'SP3MBWGMCVC9KZ5DTAYFMG1D0AEJCR7NENTM3FTK5.bitflow-router': 'Bitflow',
    'SP3MBWGMCVC9KZ5DTAYFMG1D0AEJCR7NENTM3FTK5.bitflow-swap': 'Bitflow',
    // Velar
    'SP1Y5YSTAHZ88XYK1VPDH24GY0HPX5J4JECTMY4A1.velar': 'Velar',
    'SP1Y5YSTAHZ88XYK1VPDH24GY0HPX5J4JECTMY4A1.univ2-core': 'Velar',
    'SP1Y5YSTAHZ88XYK1VPDH24GY0HPX5J4JECTMY4A1.univ2-router': 'Velar',
    'SP1Y5YSTAHZ88XYK1VPDH24GY0HPX5J4JECTMY4A1.univ2-path2': 'Velar',
    'SP1Y5YSTAHZ88XYK1VPDH24GY0HPX5J4JECTMY4A1.univ2-share-fee-to': 'Velar',
    // XYK
    'SM1793C4R5PZ4NS4VQ4WMP7SKKYVH8JZEWSZ9HCCR.xyk-core-v-1-1': 'XYK',
    'SM1793C4R5PZ4NS4VQ4WMP7SKKYVH8JZEWSZ9HCCR.xyk-core-v-1-2': 'XYK',
    'SM1793C4R5PZ4NS4VQ4WMP7SKKYVH8JZEWSZ9HCCR.xyk-pool-sbtc-stx-v-1-1': 'XYK',
    'SM1793C4R5PZ4NS4VQ4WMP7SKKYVH8JZEWSZ9HCCR.xyk-pool-stx-aeusdc-v-1-2': 'XYK',
    'SPQC38PW542EQJ5M11CR25P7BS1CA6QT4TBXGB3M.stableswap-usda-aeusdc-v-1-4': 'XYK',
    // Zest Protocol
    'SP2VCQJGH7PHP2DJK7Z0V48AGBHQAW3R3ZW1QF4N.zest': 'Zest Protocol',
    'SP2VCQJGH7PHP2DJK7Z0V48AGBHQAW3R3ZW1QF4N.pool-v1-0': 'Zest Protocol',
    // STX包装和代币
    'SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR.wrapped-stx': 'STX包装',
    'SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR.wrapped-stx-token': 'wSTX',
    'SP3DX3H4FEYZJZ586MFBS25ZW3HZDMEW92260R2PR.Wrapped-Bitcoin': 'xBTC',
    'SP3Y2ZSH8P7D50B0VBTSX11S7XSG24M1VB9YFQA4K.token-aeusdc': 'aeUSDC',
    'SP102V8P0F7JX67ARQ77WEA3D3CFB5XW39REDT0AM.token-wstx-v2': 'wSTX',
    'SP102V8P0F7JX67ARQ77WEA3D3CFB5XW39REDT0AM.token-wnyc': 'NYC',
    'SP102V8P0F7JX67ARQ77WEA3D3CFB5XW39REDT0AM.token-waeusdc': 'aeUSDC',
    'SP1E0XBN9T4B10E9QMR7XMFJPMA19D77WY3KP2QKC.token-wststx': 'stSTX',
    'SP1E0XBN9T4B10E9QMR7XMFJPMA19D77WY3KP2QKC.token-wusdh': 'USDH',
    'SP1E0XBN9T4B10E9QMR7XMFJPMA19D77WY3KP2QKC.token-wsbtc': 'sBTC',
    'SM1793C4R5PZ4NS4VQ4WMP7SKKYVH8JZEWSZ9HCCR.token-stx-v-1-2': 'STX',
    'SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token': 'sBTC',
    'SP2XD7417HGPRTREMKF748VNEQPDRR0RMANB7X1NK.token-abtc': 'aBTC',
    'SP2XD7417HGPRTREMKF748VNEQPDRR0RMANB7X1NK.token-susdt': 'sUSDT',
    'SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR.usda-token': 'USDA',
    // LNSwap
    'SP3MBWGMCVC9KZ5DTAYFMG1D0AEJCR7NENTM3FTK5.lnswap': 'LNSwap',
    'SP3MBWGMCVC9KZ5DTAYFMG1D0AEJCR7NENTM3FTK5.lnswap-v2': 'LNSwap',
    // CatamaranSwap
    'SP2C1WREHGM75C7TGFAEJPFKTFTEGZKF6DFT6E2GE.catamaran-swap': 'CatamaranSwap',
    // STX.CITY (Citycoins DEX)
    'SP2H8PY27SEZ03MWRKS5XABZYQN17ETGQS3527SA5.stxcity-swap': 'STX.CITY',
    // LISA (Liquidity Protocol)
    'SM1793C4R5PZ4NS4VQ4WMP7SKKYVH8JZEWSZ9HCCR.lisa-swap': 'LISA',
    // DeFi on Stacks
    'SPJW1XE278YMCEYMXB8ZFGJMH8ZVAAEDP2S2PJYG.defi-swap': 'DeFi on Stacks',
  };
  
  for (const [key, value] of Object.entries(platformMap)) {
    if (contractId.includes(key)) {
      return value;
    }
  }
  
  // 通过模式匹配识别平台 - 处理未在platformMap中列出的合约变体
  const contractLower = contractId.toLowerCase();
  if (contractLower.includes('bitflow')) {
    return 'Bitflow';
  }
  if (contractLower.includes('alex') || contractLower.includes('amm-')) {
    return 'ALEX';
  }
  if (contractLower.includes('velar') || contractLower.includes('univ2')) {
    return 'Velar';
  }
  if (contractLower.includes('arkadiko')) {
    return 'Arkadiko';
  }
  if (contractLower.includes('stackswap')) {
    return 'Stackswap';
  }
  if (contractLower.includes('xyk')) {
    return 'XYK';
  }
  
  // 提取合约名称
  const parts = contractId.split('.');
  if (parts.length > 1) {
    // 返回完整合约名称而不是裁剪
    return parts[1];
  }
  
  return '其他平台';
};

/**
 * 格式化 STX 金额 (从微 STX 转换)
 */
export const formatSTXAmount = (amount: string | number): string => {
  const amountNum = typeof amount === 'string' ? parseInt(amount, 10) : amount;
  return (amountNum / 1000000).toFixed(6);
};

/**
 * 解析代币符号
 */
export const parseTokenSymbol = (tokenId: string): string => {
  if (!tokenId) return '';
  
  const tokenMap: Record<string, string> = {
    'stx': 'STX',
    'wrapped-stx': 'wSTX',
    'xbtc': 'xBTC',
    'aeusdc': 'aeUSDC',
    'susdt': 'sUSDT',
    'welsh': 'WELSH',
    'ststx': 'stSTX',
    'velar': 'VELAR',
    'bitflow': 'BFT',
    'alex': 'ALEX',
    'diko': 'DIKO',
    'auto-alex': 'atALEX',
    'usda': 'USDA',
    'xusd': 'xUSD',
    'stx-stx': 'STX',
    'token-stx': 'STX',
    'wrapped-bitcoin': 'xBTC',
    'token-wstx': 'wSTX',
    'token-susdt': 'sUSDT',
    'token-abtc': 'aBTC',
    'token-wsbtc': 'sBTC',
    'sbtc-token': 'sBTC',
    'token-wnyc': 'NYC',
    'token-waeusdc': 'aeUSDC',
    'token-wststx': 'stSTX',
    'token-wusdh': 'USDH',
    'usda-token': 'USDA',
    'mia': 'MIA',
    'nyc': 'NYC',
    'banana': 'BANANA',
    'leo': 'LEO',
    'roo': 'ROO',
    'slime': 'SLIME',
  };
  
  const lower = tokenId.toLowerCase();
  for (const [key, value] of Object.entries(tokenMap)) {
    if (lower.includes(key)) {
      return value;
    }
  }
  
  // 尝试从合约ID中提取代币名称
  const parts = tokenId.split('.');
  if (parts.length > 1) {
    const contractName = parts[1];
    // 提取代币名称，通常在最后
    const tokenParts = contractName.split('::');
    if (tokenParts.length > 1) {
      return tokenParts[tokenParts.length - 1].toUpperCase();
    }
    
    // 尝试从合约名称中提取代币符号
    // 例如: token-aeusdc -> aeusdc, wrapped-bitcoin -> bitcoin
    if (contractName.startsWith('token-')) {
      return contractName.substring(6).toUpperCase();
    }
    if (contractName.startsWith('wrapped-')) {
      return contractName.substring(8).toUpperCase();
    }
    
    // 返回完整的合约名称而不是裁剪
    return contractName.toUpperCase();
  }
  
  return tokenId.toUpperCase();
};

/**
 * 解析交易的swap信息
 * 尝试从合约调用参数中提取交易对和金额信息
 */
export const parseSwapInfo = (tx: StacksTransaction): string => {
  // 处理代币转账
  if (tx.token_transfer && tx.token_transfer.amount) {
    const amount = formatAmount(tx.token_transfer.amount);
    return `${amount} STX (转账)`;
  }
  
  if (!tx.contract_call) {
    return '';
  }
  
  const functionName = tx.contract_call.function_name || '';
  const args = tx.contract_call.function_args || [];
  const contractId = tx.contract_call.contract_id || '';
  
  // 检查是否为swap相关函数
  const isSwapFunction = 
    functionName.includes('swap') || 
    functionName.includes('exchange') ||
    functionName.includes('trade') ||
    functionName.includes('route');
  
  if (!isSwapFunction) {
    return '';
  }
  
  try {
    // 尝试解析参数
    let fromToken = '';
    let toToken = '';
    let fromAmount = '';
    let toAmount = '';
    const tokenContracts: string[] = [];
    
    // 解析函数参数
    args.forEach((arg: any) => {
      if (typeof arg === 'object' && arg !== null) {
        const argStr = JSON.stringify(arg);
        
        // 尝试提取代币合约信息 (principal类型)
        if (arg.principal || argStr.includes('principal')) {
          const principalMatch = argStr.match(/[A-Z0-9]{28,}\.[a-zA-Z0-9-]+/g);
          if (principalMatch && principalMatch.length > 0) {
            principalMatch.forEach((contract: string) => {
              if (!tokenContracts.includes(contract)) {
                tokenContracts.push(contract);
              }
            });
          }
        }
        
        // 尝试提取代币信息
        if (argStr.includes('token') || argStr.includes('asset')) {
          const tokenMatch = argStr.match(/([a-zA-Z0-9-]+)/g);
          if (tokenMatch && tokenMatch.length > 0) {
            const tokenStr = tokenMatch.join('');
            const symbol = parseTokenSymbol(tokenStr);
            if (symbol && !fromToken) {
              fromToken = symbol;
            } else if (symbol && !toToken && symbol !== fromToken) {
              toToken = symbol;
            }
          }
        }
        
        // 尝试提取金额信息
        if (arg.uint || arg.int) {
          const amount = arg.uint || arg.int;
          if (!fromAmount) {
            fromAmount = formatAmount(amount);
          } else if (!toAmount) {
            toAmount = formatAmount(amount);
          }
        }
      } else if (typeof arg === 'string') {
        // 字符串参数可能包含代币信息
        const symbol = parseTokenSymbol(arg);
        if (symbol && !fromToken) {
          fromToken = symbol;
        } else if (symbol && !toToken && symbol !== fromToken) {
          toToken = symbol;
        }
      } else if (typeof arg === 'number') {
        // 数字参数可能是金额
        if (!fromAmount) {
          fromAmount = formatAmount(arg.toString());
        } else if (!toAmount) {
          toAmount = formatAmount(arg.toString());
        }
      }
    });
    
    // 从提取的合约地址中解析代币符号
    if (tokenContracts.length >= 1 && !fromToken) {
      fromToken = parseTokenSymbol(tokenContracts[0]);
    }
    if (tokenContracts.length >= 2 && !toToken) {
      toToken = parseTokenSymbol(tokenContracts[1]);
    }
    
    // 如果还没有代币信息，从合约ID推断
    if (!fromToken || !toToken) {
      if (contractId.includes('alex')) {
        fromToken = fromToken || 'STX';
        toToken = toToken || 'ALEX';
      } else if (contractId.includes('velar')) {
        fromToken = fromToken || 'STX';
        toToken = toToken || 'VELAR';
      } else if (contractId.includes('bitflow')) {
        fromToken = fromToken || 'STX';
        toToken = toToken || 'BFT';
      }
    }
    
    // 如果没有找到代币，使用通用标识
    if (!fromToken && !toToken && (fromAmount || toAmount)) {
      fromToken = 'Token A';
      toToken = 'Token B';
    }
    
    // 构建swap信息字符串 - 使用小写格式以匹配示例 "3000 stx==>1853 aeusdc"
    if (fromToken && toToken) {
      const fromTokenLower = fromToken.toLowerCase();
      const toTokenLower = toToken.toLowerCase();
      if (fromAmount && toAmount) {
        return `${fromAmount} ${fromTokenLower}==>${toAmount} ${toTokenLower}`;
      } else if (fromAmount) {
        return `${fromAmount} ${fromTokenLower}==>${toTokenLower}`;
      } else if (toAmount) {
        return `${fromTokenLower}==>${toAmount} ${toTokenLower}`;
      } else {
        return `${fromTokenLower}==>${toTokenLower}`;
      }
    } else if (fromToken && fromAmount) {
      return `${fromAmount} ${fromToken.toLowerCase()} (swap)`;
    }
    
    // 如果无法提取详细信息，至少标记为swap
    if (isSwapFunction) {
      return `Swap (${functionName})`;
    }
    
    return '';
  } catch (error) {
    console.error('解析swap信息失败:', error);
    return '';
  }
};

/**
 * 格式化金额（智能处理不同精度）
 */
const formatAmount = (amount: string): string => {
  const num = parseFloat(amount);
  if (isNaN(num)) return amount;
  
  // 如果金额很大，可能是微单位，需要转换
  if (num > 1000000) {
    const converted = num / 1000000;
    // 根据大小决定精度
    if (converted >= 1000) {
      return converted.toFixed(0);
    } else if (converted >= 1) {
      return converted.toFixed(2);
    } else {
      return converted.toFixed(6);
    }
  }
  
  // 如果金额较小，保留更多小数位
  if (num < 1) {
    return num.toFixed(6);
  }
  
  // 中等金额
  if (num >= 1000) {
    return num.toFixed(0);
  }
  
  return num.toFixed(2);
};