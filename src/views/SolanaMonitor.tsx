import React, { useState, useEffect } from 'react';
import { Table, Card, Tag, Space, Button, message, Select, Modal, InputNumber, Switch } from 'antd';
import { ReloadOutlined, SafetyCertificateOutlined, ThunderboltOutlined, SettingOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import {
  getNewTokens,
  getTrendingTokens,
  checkTokenSafety,
  evaluateWinRate,
  formatSolanaAddress,
  formatPrice,
  formatMarketCap,
  type SolanaToken,
} from '../api/solana';
import {
  getTradingConfig,
  saveTradingConfig,
  performRiskControl,
  executeSolanaTrade,
  isOKXWalletAvailable,
  connectOKXWallet,
  type TradingConfig,
} from '../api/trading';

const { Option } = Select;

const SolanaMonitor: React.FC = () => {
  const [tokens, setTokens] = useState<SolanaToken[]>([]);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(30);
  const [viewMode, setViewMode] = useState<'new' | 'trending'>('trending');
  const [tradingConfig, setTradingConfig] = useState<TradingConfig>(getTradingConfig());
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [okxWalletAvailable, setOkxWalletAvailable] = useState(false);

  useEffect(() => {
    fetchTokens();
    setOkxWalletAvailable(isOKXWalletAvailable());
  }, [viewMode]);

  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    
    if (autoRefresh) {
      intervalId = setInterval(() => {
        fetchTokens();
      }, refreshInterval * 1000);
    }
    
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [autoRefresh, refreshInterval, viewMode]);

  const fetchTokens = async () => {
    setLoading(true);
    try {
      const fetchedTokens = viewMode === 'new' 
        ? await getNewTokens(20)
        : await getTrendingTokens(20);
      
      // 为每个代币检查安全性和评估胜率
      const tokensWithAnalysis = await Promise.all(
        fetchedTokens.map(async (token) => {
          try {
            const safetyCheck = await checkTokenSafety(token.address);
            const winRate = await evaluateWinRate(token, safetyCheck, 24);
            
            return {
              ...token,
              isSafe: safetyCheck.isSafe,
              winRate,
            };
          } catch (error) {
            console.error(`分析代币 ${token.symbol} 失败:`, error);
            return {
              ...token,
              isSafe: false,
              winRate: 0,
            };
          }
        })
      );
      
      setTokens(tokensWithAnalysis);
      message.success('刷新成功');
    } catch (error: any) {
      message.error(error.message || '获取代币数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleTrade = async (token: SolanaToken) => {
    if (!tradingConfig.enabled) {
      message.warning('交易功能未启用，请在设置中启用');
      return;
    }
    
    // 风控检查
    const riskCheck = performRiskControl(
      token.address,
      token.liquidity || 0,
      token.winRate || 0,
      tradingConfig
    );
    
    if (!riskCheck.passed) {
      message.error(`风控未通过: ${riskCheck.reason}`);
      return;
    }
    
    // 确认交易
    Modal.confirm({
      title: '确认交易',
      content: (
        <div>
          <p>代币: {token.symbol}</p>
          <p>价格: {formatPrice(token.priceUSD || 0)}</p>
          <p>胜率: {token.winRate?.toFixed(2)}%</p>
          <p>交易金额: ${tradingConfig.maxTradeAmount}</p>
        </div>
      ),
      onOk: async () => {
        const result = await executeSolanaTrade(
          token.address,
          tradingConfig.maxTradeAmount,
          true,
          tradingConfig
        );
        
        if (result.success) {
          message.success(`交易成功! TX: ${result.transactionHash}`);
        } else {
          message.error(`交易失败: ${result.error}`);
        }
      },
    });
  };

  const handleConnectWallet = async () => {
    const result = await connectOKXWallet();
    if (result.success) {
      message.success('OKX Wallet 连接成功');
      setOkxWalletAvailable(true);
    } else {
      message.error(result.error || '连接失败');
    }
  };

  const handleSaveSettings = () => {
    saveTradingConfig(tradingConfig);
    message.success('设置已保存');
    setSettingsVisible(false);
  };

  const columns: ColumnsType<SolanaToken> = [
    {
      title: '代币',
      dataIndex: 'symbol',
      key: 'symbol',
      fixed: 'left',
      width: 120,
      render: (symbol: string, record: SolanaToken) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>{symbol}</div>
          <div style={{ fontSize: '12px', color: '#888' }}>{record.name}</div>
          <div style={{ fontSize: '10px', color: '#aaa' }}>
            {formatSolanaAddress(record.address)}
          </div>
        </div>
      ),
    },
    {
      title: '价格',
      dataIndex: 'priceUSD',
      key: 'priceUSD',
      width: 100,
      render: (price: number) => (
        <span>${formatPrice(price)}</span>
      ),
    },
    {
      title: '24h 变化',
      dataIndex: 'priceChange24h',
      key: 'priceChange24h',
      width: 100,
      render: (change: number) => (
        <Tag color={change >= 0 ? 'green' : 'red'}>
          {change >= 0 ? '+' : ''}{change.toFixed(2)}%
        </Tag>
      ),
    },
    {
      title: '流动性',
      dataIndex: 'liquidity',
      key: 'liquidity',
      width: 120,
      render: (liquidity: number) => formatMarketCap(liquidity),
    },
    {
      title: '24h 交易量',
      dataIndex: 'volume24h',
      key: 'volume24h',
      width: 120,
      render: (volume: number) => formatMarketCap(volume),
    },
    {
      title: '市值',
      dataIndex: 'marketCap',
      key: 'marketCap',
      width: 120,
      render: (marketCap: number) => formatMarketCap(marketCap),
    },
    {
      title: '安全性',
      dataIndex: 'isSafe',
      key: 'isSafe',
      width: 100,
      render: (isSafe: boolean) => (
        <Tag color={isSafe ? 'green' : 'red'} icon={<SafetyCertificateOutlined />}>
          {isSafe ? '安全' : '风险'}
        </Tag>
      ),
    },
    {
      title: '胜率',
      dataIndex: 'winRate',
      key: 'winRate',
      width: 100,
      sorter: (a, b) => (a.winRate || 0) - (b.winRate || 0),
      render: (winRate: number) => {
        const color = winRate >= 80 ? 'green' : winRate >= 60 ? 'orange' : 'red';
        return (
          <Tag color={color}>
            {winRate.toFixed(1)}%
          </Tag>
        );
      },
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      width: 150,
      render: (_, record: SolanaToken) => (
        <Space>
          {record.winRate && record.winRate >= tradingConfig.minWinRate && record.isSafe && (
            <Button
              type="primary"
              size="small"
              icon={<ThunderboltOutlined />}
              onClick={() => handleTrade(record)}
              disabled={!tradingConfig.enabled}
            >
              交易
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card
        title={
          <Space>
            <span>Solana Meme Coin 监控</span>
            {okxWalletAvailable ? (
              <Tag color="green">OKX Wallet 已连接</Tag>
            ) : (
              <Button size="small" onClick={handleConnectWallet}>
                连接 OKX Wallet
              </Button>
            )}
          </Space>
        }
        extra={
          <Space>
            <Select
              value={viewMode}
              onChange={setViewMode}
              style={{ width: 120 }}
            >
              <Option value="new">新发代币</Option>
              <Option value="trending">热门代币</Option>
            </Select>
            
            <Select
              value={refreshInterval}
              onChange={setRefreshInterval}
              style={{ width: 120 }}
              disabled={!autoRefresh}
            >
              <Option value={10}>10秒</Option>
              <Option value={30}>30秒</Option>
              <Option value={60}>1分钟</Option>
              <Option value={120}>2分钟</Option>
              <Option value={300}>5分钟</Option>
            </Select>
            
            <Switch
              checked={autoRefresh}
              onChange={setAutoRefresh}
              checkedChildren="自动"
              unCheckedChildren="手动"
            />
            
            <Button
              icon={<ReloadOutlined />}
              onClick={fetchTokens}
              loading={loading}
            >
              刷新
            </Button>
            
            <Button
              icon={<SettingOutlined />}
              onClick={() => setSettingsVisible(true)}
            >
              交易设置
            </Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={tokens}
          rowKey="address"
          loading={loading}
          scroll={{ x: 1200 }}
          pagination={{
            pageSize: 20,
            showTotal: (total) => `共 ${total} 个代币`,
          }}
        />
      </Card>

      <Modal
        title="交易设置"
        open={settingsVisible}
        onOk={handleSaveSettings}
        onCancel={() => setSettingsVisible(false)}
        width={600}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <div>
            <label>启用交易功能:</label>
            <Switch
              checked={tradingConfig.enabled}
              onChange={(checked) => setTradingConfig({ ...tradingConfig, enabled: checked })}
              style={{ marginLeft: 10 }}
            />
          </div>
          
          <div>
            <label>最小胜率 (%):</label>
            <InputNumber
              value={tradingConfig.minWinRate}
              onChange={(value) => setTradingConfig({ ...tradingConfig, minWinRate: value || 80 })}
              min={0}
              max={100}
              style={{ marginLeft: 10, width: 100 }}
            />
          </div>
          
          <div>
            <label>最小流动性 ($):</label>
            <InputNumber
              value={tradingConfig.minLiquidity}
              onChange={(value) => setTradingConfig({ ...tradingConfig, minLiquidity: value || 10000 })}
              min={0}
              style={{ marginLeft: 10, width: 150 }}
            />
          </div>
          
          <div>
            <label>最大交易金额 ($):</label>
            <InputNumber
              value={tradingConfig.maxTradeAmount}
              onChange={(value) => setTradingConfig({ ...tradingConfig, maxTradeAmount: value || 100 })}
              min={0}
              style={{ marginLeft: 10, width: 150 }}
            />
          </div>
          
          <div>
            <label>最大滑点 (%):</label>
            <InputNumber
              value={tradingConfig.maxSlippage}
              onChange={(value) => setTradingConfig({ ...tradingConfig, maxSlippage: value || 5 })}
              min={0}
              max={100}
              style={{ marginLeft: 10, width: 100 }}
            />
          </div>
          
          <div>
            <label>使用 OKX Wallet:</label>
            <Switch
              checked={tradingConfig.useOKXWallet}
              onChange={(checked) => setTradingConfig({ ...tradingConfig, useOKXWallet: checked })}
              style={{ marginLeft: 10 }}
            />
          </div>
          
          <div>
            <label>启用风控:</label>
            <Switch
              checked={tradingConfig.riskControlEnabled}
              onChange={(checked) => setTradingConfig({ ...tradingConfig, riskControlEnabled: checked })}
              style={{ marginLeft: 10 }}
            />
          </div>
        </Space>
      </Modal>
    </div>
  );
};

export default SolanaMonitor;
