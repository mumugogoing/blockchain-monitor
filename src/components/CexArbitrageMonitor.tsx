import React, { useState, useEffect } from 'react';
import { Card, Space, Typography, Table, Tag, Switch, message, Spin, Select, Button, Checkbox, Input, Drawer } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined, SyncOutlined, SettingOutlined } from '@ant-design/icons';
import { getCommonTradingPairs, getArbitrageForPairs, type TradingPairArbitrage } from '@/api/cex-arbitrage';
import type { ColumnsType } from 'antd/es/table';
import type { CheckboxChangeEvent } from 'antd/es/checkbox';

const { Text } = Typography;
const { Option } = Select;
const { Search } = Input;

// Exchange configuration
interface ExchangeConfig {
  key: string;
  name: string;
  enabled: boolean;
}

const CexArbitrageMonitor: React.FC = () => {
  const [arbitrageData, setArbitrageData] = useState<TradingPairArbitrage[]>([]);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(30); // in seconds
  const [lastUpdateTime, setLastUpdateTime] = useState<string>('');
  const [commonPairs, setCommonPairs] = useState<Array<{symbol: string; marketCapRank?: number}>>([]);
  const [loadingPairs, setLoadingPairs] = useState(false);
  const [settingsDrawerVisible, setSettingsDrawerVisible] = useState(false);
  const [tokenSearchText, setTokenSearchText] = useState('');
  
  // Exchange selection state
  const [exchanges, setExchanges] = useState<ExchangeConfig[]>([
    { key: 'binance', name: '币安', enabled: true },
    { key: 'okx', name: 'OKX', enabled: true },
    { key: 'gate', name: 'Gate', enabled: true },
    { key: 'bybit', name: 'Bybit', enabled: true },
    { key: 'bitget', name: 'Bitget', enabled: true },
    { key: 'huobi', name: '火币', enabled: true },
    { key: 'mexc', name: 'MEXC', enabled: true },
  ]);
  
  // Load saved preferences from localStorage
  useEffect(() => {
    const savedExchanges = localStorage.getItem('cex-arbitrage-exchanges');
    if (savedExchanges) {
      try {
        const parsed = JSON.parse(savedExchanges);
        setExchanges(parsed);
      } catch (e) {
        console.error('Failed to parse saved exchanges:', e);
      }
    }
  }, []);

  // Default trading pairs to monitor - expanded list
  const defaultPairs = [
    'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'XRPUSDT', 'ADAUSDT', 'SOLUSDT', 'DOGEUSDT', 'DOTUSDT', 'MATICUSDT', 'LTCUSDT',
    'TRXUSDT', 'AVAXUSDT', 'LINKUSDT', 'ATOMUSDT', 'UNIUSDT', 'ETCUSDT', 'XLMUSDT', 'NEARUSDT', 'APTUSDT', 'FILUSDT',
    'ALGOUSDT', 'VETUSDT', 'ICPUSDT', 'ARBUSDT', 'OPUSDT', 'INJUSDT', 'MKRUSDT', 'AAVEUSDT', 'GRTUSDT', 'SHIBUSDT'
  ].map(symbol => ({ symbol, marketCapRank: undefined }));

  // Handle exchange toggle
  const handleExchangeToggle = (key: string, checked: boolean) => {
    const newExchanges = exchanges.map(ex => 
      ex.key === key ? { ...ex, enabled: checked } : ex
    );
    setExchanges(newExchanges);
    localStorage.setItem('cex-arbitrage-exchanges', JSON.stringify(newExchanges));
  };

  // Get enabled exchanges
  const getEnabledExchanges = () => {
    return exchanges.filter(ex => ex.enabled).map(ex => ex.key);
  };

  const fetchCommonPairs = async () => {
    setLoadingPairs(true);
    try {
      const pairs = await getCommonTradingPairs();
      if (pairs.length > 0) {
        setCommonPairs(pairs);
        message.success(`找到 ${pairs.length} 个共同交易对`);
      } else {
        setCommonPairs(defaultPairs);
        message.info('使用默认交易对');
      }
    } catch (error) {
      console.error('Failed to fetch common pairs:', error);
      setCommonPairs(defaultPairs);
      message.warning('获取共同交易对失败，使用默认交易对');
    } finally {
      setLoadingPairs(false);
    }
  };

  const fetchArbitrageData = async () => {
    setLoading(true);
    try {
      const pairs = commonPairs.length > 0 ? commonPairs : defaultPairs;
      const enabledExchanges = getEnabledExchanges();
      const data = await getArbitrageForPairs(pairs, enabledExchanges);
      setArbitrageData(data);
      setLastUpdateTime(new Date().toLocaleTimeString('zh-CN'));
    } catch (error) {
      message.error('获取套利数据失败');
      console.error('Arbitrage fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommonPairs();
  }, []);

  useEffect(() => {
    if (commonPairs.length > 0) {
      fetchArbitrageData();
    }
  }, [commonPairs]);

  // Re-fetch arbitrage data when enabled exchanges change
  useEffect(() => {
    if (commonPairs.length > 0) {
      fetchArbitrageData();
    }
  }, [exchanges]);

  useEffect(() => {
    let interval: number | undefined;
    if (autoRefresh && commonPairs.length > 0) {
      interval = window.setInterval(() => {
        fetchArbitrageData();
      }, refreshInterval * 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, refreshInterval, commonPairs]);

  const renderPriceDiff = (record: TradingPairArbitrage) => {
    if (!record.priceDiff || !record.priceDiffPercent) {
      return <Text type="secondary">-</Text>;
    }

    const isSignificant = record.priceDiffPercent > 0.5;
    const color = isSignificant ? 'gold' : 'default';

    return (
      <Space>
        <Tag color={color}>
          {record.priceDiff.toFixed(6)}
        </Tag>
        <Text type={isSignificant ? 'warning' : 'secondary'}>
          {record.priceDiffPercent.toFixed(2)}%
        </Text>
      </Space>
    );
  };

  const renderArbitrageOpportunity = (record: TradingPairArbitrage) => {
    if (!record.priceDiffPercent || record.priceDiffPercent < 0.5) {
      return <Text type="secondary">无</Text>;
    }

    const getExchangeName = (exchange: string) => {
      const names: Record<string, string> = {
        binance: '币安',
        okx: 'OKX',
        gate: 'Gate',
        bitget: 'Bitget',
        mexc: 'MEXC',
        huobi: '火币',
        bybit: 'Bybit',
      };
      return names[exchange] || exchange;
    };

    return (
      <Space direction="vertical" size="small">
        <Tag color="green" icon={<ArrowDownOutlined />}>
          {getExchangeName(record.lowestExchange || '')} 买入: {record.lowestPrice?.toFixed(6)}
        </Tag>
        <Tag color="red" icon={<ArrowUpOutlined />}>
          {getExchangeName(record.highestExchange || '')} 卖出: {record.highestPrice?.toFixed(6)}
        </Tag>
      </Space>
    );
  };

  // Generate columns dynamically based on enabled exchanges
  const getColumns = (): ColumnsType<TradingPairArbitrage> => {
    const enabledExchangeKeys = getEnabledExchanges();
    
    const baseColumns: ColumnsType<TradingPairArbitrage> = [
      {
        title: '交易对',
        dataIndex: 'symbol',
        key: 'symbol',
        width: 140,
        fixed: 'left',
        sorter: (a, b) => a.symbol.localeCompare(b.symbol),
        render: (symbol: string, record) => (
          <Space direction="vertical" size={0}>
            <Text strong>{symbol}</Text>
            {record.marketCapRank && (
              <Text type="success" style={{ fontSize: '11px' }}>
                市值排名: #{record.marketCapRank}
              </Text>
            )}
            {record.exchangeCount && (
              <Text type="secondary" style={{ fontSize: '11px' }}>
                {record.exchangeCount}/{exchanges.length} 交易所
              </Text>
            )}
          </Space>
        ),
      },
    ];

    const exchangeColumns: ColumnsType<TradingPairArbitrage> = [];
    
    if (enabledExchangeKeys.includes('binance')) {
      exchangeColumns.push({
        title: '币安',
        dataIndex: ['prices', 'binance'],
        key: 'binance',
        width: 110,
        sorter: (a, b) => (a.prices.binance || 0) - (b.prices.binance || 0),
        render: (price?: number) => price ? price.toFixed(6) : '-',
      });
    }
    
    if (enabledExchangeKeys.includes('okx')) {
      exchangeColumns.push({
        title: 'OKX',
        dataIndex: ['prices', 'okx'],
        key: 'okx',
        width: 110,
        sorter: (a, b) => (a.prices.okx || 0) - (b.prices.okx || 0),
        render: (price?: number) => price ? price.toFixed(6) : '-',
      });
    }
    
    if (enabledExchangeKeys.includes('gate')) {
      exchangeColumns.push({
        title: 'Gate',
        dataIndex: ['prices', 'gate'],
        key: 'gate',
        width: 110,
        sorter: (a, b) => (a.prices.gate || 0) - (b.prices.gate || 0),
        render: (price?: number) => price ? price.toFixed(6) : '-',
      });
    }
    
    if (enabledExchangeKeys.includes('bybit')) {
      exchangeColumns.push({
        title: 'Bybit',
        dataIndex: ['prices', 'bybit'],
        key: 'bybit',
        width: 110,
        sorter: (a, b) => (a.prices.bybit || 0) - (b.prices.bybit || 0),
        render: (price?: number) => price ? price.toFixed(6) : '-',
      });
    }
    
    if (enabledExchangeKeys.includes('bitget')) {
      exchangeColumns.push({
        title: 'Bitget',
        dataIndex: ['prices', 'bitget'],
        key: 'bitget',
        width: 110,
        sorter: (a, b) => (a.prices.bitget || 0) - (b.prices.bitget || 0),
        render: (price?: number) => price ? price.toFixed(6) : '-',
      });
    }
    
    if (enabledExchangeKeys.includes('huobi')) {
      exchangeColumns.push({
        title: '火币',
        dataIndex: ['prices', 'huobi'],
        key: 'huobi',
        width: 110,
        sorter: (a, b) => (a.prices.huobi || 0) - (b.prices.huobi || 0),
        render: (price?: number) => price ? price.toFixed(6) : '-',
      });
    }
    
    if (enabledExchangeKeys.includes('mexc')) {
      exchangeColumns.push({
        title: 'MEXC',
        dataIndex: ['prices', 'mexc'],
        key: 'mexc',
        width: 110,
        sorter: (a, b) => (a.prices.mexc || 0) - (b.prices.mexc || 0),
        render: (price?: number) => price ? price.toFixed(6) : '-',
      });
    }

    const summaryColumns: ColumnsType<TradingPairArbitrage> = [
      {
        title: '价差 %',
        key: 'priceDiffPercent',
        dataIndex: 'priceDiffPercent',
        width: 100,
        sorter: (a, b) => (a.priceDiffPercent || 0) - (b.priceDiffPercent || 0),
        defaultSortOrder: 'descend',
        render: (_, record) => renderPriceDiff(record),
      },
      {
        title: '1000 USDT 利润',
        key: 'profit1000',
        width: 110,
        sorter: (a, b) => {
          const profitA = a.priceDiffPercent ? (1000 * (a.priceDiffPercent / 100)) : 0;
          const profitB = b.priceDiffPercent ? (1000 * (b.priceDiffPercent / 100)) : 0;
          return profitA - profitB;
        },
        render: (_, record) => {
          if (!record.priceDiffPercent || record.priceDiffPercent < 0.1) {
            return <Text type="secondary">-</Text>;
          }
          const profit = 1000 * (record.priceDiffPercent / 100);
          return (
            <Text type={profit > 5 ? 'success' : 'secondary'} strong={profit > 5}>
              ${profit.toFixed(2)}
            </Text>
          );
        },
      },
      {
        title: '10000 USDT 利润',
        key: 'profit10000',
        width: 120,
        sorter: (a, b) => {
          const profitA = a.priceDiffPercent ? (10000 * (a.priceDiffPercent / 100)) : 0;
          const profitB = b.priceDiffPercent ? (10000 * (b.priceDiffPercent / 100)) : 0;
          return profitA - profitB;
        },
        render: (_, record) => {
          if (!record.priceDiffPercent || record.priceDiffPercent < 0.1) {
            return <Text type="secondary">-</Text>;
          }
          const profit = 10000 * (record.priceDiffPercent / 100);
          return (
            <Text type={profit > 50 ? 'success' : 'secondary'} strong={profit > 50}>
              ${profit.toFixed(2)}
            </Text>
          );
        },
      },
      {
        title: '套利机会',
        key: 'arbitrage',
        width: 200,
        fixed: 'right',
        render: (_, record) => renderArbitrageOpportunity(record),
      },
    ];

    return [...baseColumns, ...exchangeColumns, ...summaryColumns];
  };

  return (
    <Card
      title={
        <Space>
          <Text strong>CEX 跨交易所套利监控</Text>
          {lastUpdateTime && <Text type="secondary" style={{ fontSize: '12px' }}>最后更新: {lastUpdateTime}</Text>}
        </Space>
      }
      extra={
        <Space>
          <Button
            icon={<SettingOutlined />}
            onClick={() => setSettingsDrawerVisible(true)}
            size="small"
          >
            设置
          </Button>
          <Button
            icon={<SyncOutlined />}
            onClick={fetchCommonPairs}
            loading={loadingPairs}
            size="small"
          >
            刷新交易对
          </Button>
          <Text>自动刷新</Text>
          <Switch
            checked={autoRefresh}
            onChange={setAutoRefresh}
            checkedChildren="开启"
            unCheckedChildren="关闭"
            size="small"
          />
          <Select
            value={refreshInterval}
            onChange={setRefreshInterval}
            style={{ width: '100px' }}
            disabled={!autoRefresh}
            size="small"
          >
            <Option value={1}>1秒</Option>
            <Option value={3}>3秒</Option>
            <Option value={5}>5秒</Option>
            <Option value={10}>10秒</Option>
            <Option value={30}>30秒</Option>
            <Option value={60}>1分钟</Option>
            <Option value={300}>5分钟</Option>
            <Option value={600}>10分钟</Option>
          </Select>
          {loading && <Spin size="small" />}
        </Space>
      }
    >
      {/* Settings Drawer */}
      <Drawer
        title="监控设置"
        placement="right"
        onClose={() => setSettingsDrawerVisible(false)}
        open={settingsDrawerVisible}
        width={400}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          {/* Exchange Selection */}
          <div>
            <Text strong style={{ display: 'block', marginBottom: '12px' }}>
              选择交易所
            </Text>
            <Space direction="vertical" style={{ width: '100%' }}>
              {exchanges.map(exchange => (
                <Checkbox
                  key={exchange.key}
                  checked={exchange.enabled}
                  onChange={(e: CheckboxChangeEvent) => handleExchangeToggle(exchange.key, e.target.checked)}
                >
                  {exchange.name}
                </Checkbox>
              ))}
            </Space>
          </div>

          {/* Token Search/Filter */}
          <div>
            <Text strong style={{ display: 'block', marginBottom: '12px' }}>
              筛选代币
            </Text>
            <Search
              placeholder="搜索代币符号 (如: BTC, ETH)"
              allowClear
              value={tokenSearchText}
              onChange={(e) => setTokenSearchText(e.target.value)}
              style={{ width: '100%' }}
            />
            <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginTop: '8px' }}>
              支持模糊搜索，留空显示所有代币
            </Text>
          </div>
        </Space>
      </Drawer>

      <Table
        columns={getColumns()}
        dataSource={arbitrageData.filter(item => {
          // Filter by token search text
          if (tokenSearchText) {
            return item.symbol.toLowerCase().includes(tokenSearchText.toLowerCase());
          }
          return true;
        })}
        rowKey="symbol"
        loading={loading}
        pagination={{
          pageSize: 20,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 个交易对`,
          pageSizeOptions: ['10', '20', '50', '100', '200'],
        }}
        scroll={{ x: 1800 }}
        size="small"
      />
      <div style={{ marginTop: '16px' }}>
        <Space direction="vertical" size="small">
          <Text type="secondary" style={{ fontSize: '12px' }}>
            说明: 以币安为基准，监控市值前1000的代币（共 {commonPairs.length} 个交易对），实时检查在其他交易所（OKX、Gate、Bybit、Bitget、火币、MEXC）的价格差异
          </Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            套利机会: 当价差 &gt; 0.5% 时显示，可在低价交易所买入，高价交易所卖出
          </Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            利润计算: 显示投入1000 USDT和10000 USDT时的理论利润（未扣除手续费和滑点）
          </Text>
          <Text type="warning" style={{ fontSize: '12px' }}>
            注意: 市值排名数据来自 CoinGecko，优先显示市值靠前的代币，每次刷新交易对列表会重新获取最新市值排名。表格支持点击列标题进行排序。
          </Text>
          <Text type="success" style={{ fontSize: '12px' }}>
            提示: 点击右上角的"设置"按钮可以选择要监控的交易所和筛选特定代币。
          </Text>
        </Space>
      </div>
    </Card>
  );
};

export default CexArbitrageMonitor;
