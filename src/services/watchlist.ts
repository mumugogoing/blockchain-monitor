/**
 * 地址监控列表管理服务
 * Address Watchlist Management Service
 */

export interface WatchlistAddress {
  id: string;
  address: string;
  label: string;
  addedAt: string;
  enabled: boolean;
  notes?: string;
}

const STORAGE_KEY = 'watchlist_addresses';

/**
 * 获取所有监控地址
 */
export const getWatchlistAddresses = (): WatchlistAddress[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Failed to load watchlist:', error);
  }
  return [];
};

/**
 * 添加监控地址
 */
export const addWatchlistAddress = (
  address: string,
  label: string,
  notes?: string
): WatchlistAddress => {
  const addresses = getWatchlistAddresses();
  
  // 检查是否已存在
  const exists = addresses.find(a => a.address.toLowerCase() === address.toLowerCase());
  if (exists) {
    throw new Error('该地址已在监控列表中');
  }
  
  const newAddress: WatchlistAddress = {
    id: `watch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    address,
    label,
    addedAt: new Date().toISOString(),
    enabled: true,
    notes,
  };
  
  addresses.push(newAddress);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(addresses));
  
  return newAddress;
};

/**
 * 删除监控地址
 */
export const removeWatchlistAddress = (id: string): void => {
  const addresses = getWatchlistAddresses();
  const filtered = addresses.filter(a => a.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
};

/**
 * 更新监控地址
 */
export const updateWatchlistAddress = (
  id: string,
  updates: Partial<Omit<WatchlistAddress, 'id' | 'addedAt'>>
): void => {
  const addresses = getWatchlistAddresses();
  const index = addresses.findIndex(a => a.id === id);
  
  if (index === -1) {
    throw new Error('地址不存在');
  }
  
  addresses[index] = {
    ...addresses[index],
    ...updates,
  };
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(addresses));
};

/**
 * 切换监控状态
 */
export const toggleWatchlistAddress = (id: string): void => {
  const addresses = getWatchlistAddresses();
  const address = addresses.find(a => a.id === id);
  
  if (address) {
    updateWatchlistAddress(id, { enabled: !address.enabled });
  }
};

/**
 * 检查地址是否在监控列表中
 */
export const isAddressWatched = (address: string): boolean => {
  const addresses = getWatchlistAddresses();
  return addresses.some(
    a => a.enabled && a.address.toLowerCase() === address.toLowerCase()
  );
};

/**
 * 获取监控的地址信息
 */
export const getWatchedAddressInfo = (address: string): WatchlistAddress | undefined => {
  const addresses = getWatchlistAddresses();
  return addresses.find(
    a => a.enabled && a.address.toLowerCase() === address.toLowerCase()
  );
};

/**
 * 清空所有监控地址
 */
export const clearWatchlist = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};

/**
 * 导出监控列表
 */
export const exportWatchlist = (): string => {
  const addresses = getWatchlistAddresses();
  return JSON.stringify(addresses, null, 2);
};

/**
 * 导入监控列表
 */
export const importWatchlist = (data: string): void => {
  try {
    const addresses = JSON.parse(data) as WatchlistAddress[];
    
    // 验证数据格式
    if (!Array.isArray(addresses)) {
      throw new Error('无效的数据格式');
    }
    
    for (const addr of addresses) {
      if (!addr.id || !addr.address || !addr.label) {
        throw new Error('数据格式不完整');
      }
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(addresses));
  } catch (error) {
    throw new Error('导入失败: ' + (error as Error).message);
  }
};
