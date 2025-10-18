import { encryptData, decryptData, generateUserKey } from '@/utils/crypto';
import authService from './auth';

// 交易所配置接口
export interface ExchangeCredentials {
  apiKey: string;
  secretKey: string;
  baseURL?: string;
  enabled: boolean;
}

// 所有交易所的配置
export interface ExchangeSettings {
  binance?: ExchangeCredentials;
  okx?: ExchangeCredentials;
  gate?: ExchangeCredentials;
  bybit?: ExchangeCredentials;
  bitget?: ExchangeCredentials;
  huobi?: ExchangeCredentials;
  mexc?: ExchangeCredentials;
}

// 默认的 BaseURL
export const DEFAULT_BASE_URLS: Record<string, string> = {
  binance: 'https://api.binance.com',
  okx: 'https://www.okx.com',
  gate: 'https://api.gate.io',
  bybit: 'https://api.bybit.com',
  bitget: 'https://api.bitget.com',
  huobi: 'https://api.huobi.pro',
  mexc: 'https://api.mexc.com',
};

// 设置服务类
class SettingsService {
  private static instance: SettingsService;
  private storageKey = 'exchange_settings';

  private constructor() {}

  static getInstance(): SettingsService {
    if (!SettingsService.instance) {
      SettingsService.instance = new SettingsService();
    }
    return SettingsService.instance;
  }

  /**
   * 获取当前用户的加密密钥
   */
  private getUserEncryptionKey(): string {
    const user = authService.getCurrentUser();
    if (!user) {
      throw new Error('用户未登录');
    }
    return generateUserKey(user.username);
  }

  /**
   * 保存交易所配置（加密存储）
   */
  async saveExchangeSettings(settings: ExchangeSettings): Promise<void> {
    try {
      const user = authService.getCurrentUser();
      if (!user) {
        throw new Error('用户未登录');
      }

      const encryptionKey = this.getUserEncryptionKey();
      const jsonData = JSON.stringify(settings);
      const encryptedData = await encryptData(jsonData, encryptionKey);
      
      // 使用用户特定的键存储
      const userStorageKey = `${this.storageKey}_${user.username}`;
      localStorage.setItem(userStorageKey, encryptedData);
    } catch (error) {
      console.error('保存配置失败:', error);
      throw error;
    }
  }

  /**
   * 获取交易所配置（解密）
   */
  async getExchangeSettings(): Promise<ExchangeSettings> {
    try {
      const user = authService.getCurrentUser();
      if (!user) {
        return {};
      }

      const userStorageKey = `${this.storageKey}_${user.username}`;
      const encryptedData = localStorage.getItem(userStorageKey);
      
      if (!encryptedData) {
        return {};
      }

      const encryptionKey = this.getUserEncryptionKey();
      const decryptedData = await decryptData(encryptedData, encryptionKey);
      return JSON.parse(decryptedData) as ExchangeSettings;
    } catch (error) {
      console.error('获取配置失败:', error);
      // 如果解密失败，返回空配置
      return {};
    }
  }

  /**
   * 获取特定交易所的配置
   */
  async getExchangeCredentials(exchange: string): Promise<ExchangeCredentials | null> {
    const settings = await this.getExchangeSettings();
    return settings[exchange as keyof ExchangeSettings] || null;
  }

  /**
   * 更新特定交易所的配置
   */
  async updateExchangeCredentials(
    exchange: string,
    credentials: ExchangeCredentials
  ): Promise<void> {
    const settings = await this.getExchangeSettings();
    settings[exchange as keyof ExchangeSettings] = credentials;
    await this.saveExchangeSettings(settings);
  }

  /**
   * 删除特定交易所的配置
   */
  async deleteExchangeCredentials(exchange: string): Promise<void> {
    const settings = await this.getExchangeSettings();
    delete settings[exchange as keyof ExchangeSettings];
    await this.saveExchangeSettings(settings);
  }

  /**
   * 清除所有配置
   */
  clearAllSettings(): void {
    const user = authService.getCurrentUser();
    if (user) {
      const userStorageKey = `${this.storageKey}_${user.username}`;
      localStorage.removeItem(userStorageKey);
    }
  }

  /**
   * 验证 API Key 格式（基本验证）
   */
  validateApiKey(apiKey: string): boolean {
    // API Key 通常是 64 字符的十六进制字符串或类似格式
    return apiKey.length >= 16 && apiKey.length <= 128;
  }

  /**
   * 验证 Secret Key 格式（基本验证）
   */
  validateSecretKey(secretKey: string): boolean {
    return secretKey.length >= 16 && secretKey.length <= 128;
  }

  /**
   * 获取默认 BaseURL
   */
  getDefaultBaseURL(exchange: string): string {
    return DEFAULT_BASE_URLS[exchange] || '';
  }
}

export default SettingsService.getInstance();
