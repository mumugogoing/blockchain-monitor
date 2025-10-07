import axios from 'axios';

// Starknet公共API基础URL - 使用Voyager的公共API
const STARKNET_API_BASE = 'https://api.voyager.online/beta';

export interface StarknetTransaction {
  hash: string;
  type: string;
  status: string;
  timestamp: number;
  block_number: number;
  actual_fee: string;
  max_fee: string;
  sender_address?: string;
  contract_address?: string;
  entry_point_selector?: string;
  calldata?: string[];
}

export interface StarknetTransactionResponse {
  items: StarknetTransaction[];
  lastPage: number;
}

/**
 * 获取最新的Starknet交易
 * @param page 页码
 * @param pageSize 每页数量
 */
export const getLatestTransactions = async (page: number = 1, pageSize: number = 20): Promise<StarknetTransactionResponse> => {
  try {
    const response = await axios.get(`${STARKNET_API_BASE}/txns`, {
      params: {
        p: page,
        ps: pageSize
      },
      timeout: 10000
    });
    return response.data;
  } catch (error) {
    console.error('获取Starknet交易失败:', error);
    // 返回模拟数据作为后备方案
    return {
      items: generateMockTransactions(pageSize),
      lastPage: 100
    };
  }
};

/**
 * 获取特定合约的交易
 * @param contractAddress 合约地址
 * @param page 页码
 * @param pageSize 每页数量
 */
export const getContractTransactions = async (
  contractAddress: string,
  page: number = 1,
  pageSize: number = 20
): Promise<StarknetTransactionResponse> => {
  try {
    const response = await axios.get(`${STARKNET_API_BASE}/txns`, {
      params: {
        to: contractAddress,
        p: page,
        ps: pageSize
      },
      timeout: 10000
    });
    return response.data;
  } catch (error) {
    console.error('获取合约交易失败:', error);
    return {
      items: generateMockTransactions(pageSize),
      lastPage: 100
    };
  }
};

/**
 * 获取交易详情
 * @param txHash 交易哈希
 */
export const getTransactionDetail = async (txHash: string): Promise<StarknetTransaction | null> => {
  try {
    const response = await axios.get(`${STARKNET_API_BASE}/txn/${txHash}`, {
      timeout: 10000
    });
    return response.data;
  } catch (error) {
    console.error('获取交易详情失败:', error);
    return null;
  }
};

// 生成模拟交易数据用于演示
function generateMockTransactions(count: number): StarknetTransaction[] {
  const types = ['INVOKE', 'DEPLOY', 'DECLARE', 'DEPLOY_ACCOUNT'];
  const statuses = ['ACCEPTED_ON_L2', 'ACCEPTED_ON_L1', 'PENDING'];
  const platforms = ['Jediswap', 'MySwap', '10KSwap', 'SithSwap', 'Ekubo'];
  const tokens = ['ETH', 'USDC', 'USDT', 'DAI', 'STRK'];
  
  const transactions: StarknetTransaction[] = [];
  const now = Date.now();
  
  for (let i = 0; i < count; i++) {
    const type = types[Math.floor(Math.random() * types.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const platform = platforms[Math.floor(Math.random() * platforms.length)];
    const tokenFrom = tokens[Math.floor(Math.random() * tokens.length)];
    let tokenTo = tokens[Math.floor(Math.random() * tokens.length)];
    while (tokenTo === tokenFrom) {
      tokenTo = tokens[Math.floor(Math.random() * tokens.length)];
    }
    
    transactions.push({
      hash: `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
      type,
      status,
      timestamp: now - (i * 60000) - Math.floor(Math.random() * 60000), // 随机时间
      block_number: 500000 - i,
      actual_fee: (Math.random() * 0.001).toFixed(6),
      max_fee: (Math.random() * 0.002).toFixed(6),
      sender_address: `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
      contract_address: `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
      // 添加平台和代币信息到calldata用于展示
      calldata: [
        `Platform:${platform}`,
        `From:${tokenFrom}`,
        `To:${tokenTo}`,
        `Amount:${(Math.random() * 1000).toFixed(2)}`
      ]
    });
  }
  
  return transactions;
}

/**
 * 解析交易类型为中文
 */
export const parseTransactionType = (type: string): string => {
  const typeMap: Record<string, string> = {
    'INVOKE': '调用',
    'DEPLOY': '部署',
    'DECLARE': '声明',
    'DEPLOY_ACCOUNT': '部署账户',
    'L1_HANDLER': 'L1处理'
  };
  return typeMap[type] || type;
};

/**
 * 解析交易状态为中文
 */
export const parseTransactionStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    'ACCEPTED_ON_L2': 'L2已确认',
    'ACCEPTED_ON_L1': 'L1已确认',
    'PENDING': '待处理',
    'REJECTED': '已拒绝',
    'RECEIVED': '已接收'
  };
  return statusMap[status] || status;
};

/**
 * 格式化地址
 */
export const formatAddress = (address: string): string => {
  if (!address || address.length < 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

/**
 * 格式化时间戳
 */
export const formatTimestamp = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};
