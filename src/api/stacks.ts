import axios from 'axios';

// Stacks 公共API基础URL - 使用 Hiro API (免费)
const STACKS_API_BASE = 'https://api.mainnet.hiro.so';

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
 * 获取最新的 Stacks 交易
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
    return response.data;
  } catch (error) {
    console.error('获取 Stacks 交易失败:', error);
    throw error;
  }
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
    // Arkadiko
    'SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR.arkadiko': 'Arkadiko',
    // Stackswap
    'SP1Z92MPDQEWZXW36VX71Q25HKF5K2EPCJ304F275.stackswap': 'Stackswap',
    // Bitflow
    'SP3MBWGMCVC9KZ5DTAYFMG1D0AEJCR7NENTM3FTK5.bitflow': 'Bitflow',
    'SP2XD7417HGPRTREMKF748VNEQPDRR0RMANB7X1NK.bitflow-router': 'Bitflow',
    // Velar
    'SP1Y5YSTAHZ88XYK1VPDH24GY0HPX5J4JECTMY4A1.velar': 'Velar',
    'SP1Y5YSTAHZ88XYK1VPDH24GY0HPX5J4JECTMY4A1.univ2-core': 'Velar',
    'SP1Y5YSTAHZ88XYK1VPDH24GY0HPX5J4JECTMY4A1.univ2-router': 'Velar',
    // Zest Protocol
    'SP2VCQJGH7PHP2DJK7Z0V48AGBHQAW3R3ZW1QF4N.zest': 'Zest Protocol',
    'SP2VCQJGH7PHP2DJK7Z0V48AGBHQAW3R3ZW1QF4N.pool-v1-0': 'Zest Protocol',
    // STX包装和代币
    'SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR.wrapped-stx': 'STX包装',
    'SP3DX3H4FEYZJZ586MFBS25ZW3HZDMEW92260R2PR.Wrapped-Bitcoin': 'xBTC',
    // LNSwap
    'SP3MBWGMCVC9KZ5DTAYFMG1D0AEJCR7NENTM3FTK5.lnswap': 'LNSwap',
    // CatamaranSwap
    'SP2C1WREHGM75C7TGFAEJPFKTFTEGZKF6DFT6E2GE.catamaran-swap': 'CatamaranSwap',
  };
  
  for (const [key, value] of Object.entries(platformMap)) {
    if (contractId.includes(key)) {
      return value;
    }
  }
  
  // 提取合约名称
  const parts = contractId.split('.');
  if (parts.length > 1) {
    return parts[1].slice(0, 20);
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
    return contractName.slice(0, 10).toUpperCase();
  }
  
  return tokenId.slice(0, 10).toUpperCase();
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
  
  if (!tx.contract_call || !tx.contract_call.function_args) {
    return '';
  }
  
  const functionName = tx.contract_call.function_name || '';
  const args = tx.contract_call.function_args;
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
    
    // 从合约ID推断可能的代币
    if (contractId.includes('alex')) {
      fromToken = fromToken || 'ALEX';
    } else if (contractId.includes('velar')) {
      fromToken = fromToken || 'VELAR';
    } else if (contractId.includes('bitflow')) {
      fromToken = fromToken || 'BFT';
    }
    
    // 解析函数参数
    args.forEach((arg: any, index: number) => {
      if (typeof arg === 'object' && arg !== null) {
        const argStr = JSON.stringify(arg);
        
        // 尝试提取代币信息
        if (argStr.includes('token') || argStr.includes('asset')) {
          const tokenMatch = argStr.match(/([a-zA-Z0-9-]+)/g);
          if (tokenMatch && tokenMatch.length > 0) {
            if (!fromToken) {
              fromToken = parseTokenSymbol(tokenMatch.join(''));
            } else if (!toToken) {
              toToken = parseTokenSymbol(tokenMatch.join(''));
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
        } else if (symbol && !toToken) {
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
    
    // 如果没有找到代币，使用通用标识
    if (!fromToken && !toToken && (fromAmount || toAmount)) {
      fromToken = 'Token A';
      toToken = 'Token B';
    }
    
    // 构建swap信息字符串
    if (fromToken && toToken) {
      if (fromAmount && toAmount) {
        return `${fromAmount} ${fromToken} ==> ${toAmount} ${toToken}`;
      } else if (fromAmount) {
        return `${fromAmount} ${fromToken} ==> ${toToken}`;
      } else if (toAmount) {
        return `${fromToken} ==> ${toAmount} ${toToken}`;
      } else {
        return `${fromToken} ==> ${toToken}`;
      }
    } else if (fromToken && fromAmount) {
      return `${fromAmount} ${fromToken} (swap)`;
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
    return converted.toFixed(2);
  }
  
  // 如果金额较小，保留更多小数位
  if (num < 1) {
    return num.toFixed(6);
  }
  
  return num.toFixed(2);
};