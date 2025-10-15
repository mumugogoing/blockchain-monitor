import React, { useState, useEffect } from 'react';
import { Card, Space, Typography, Table, Tag, Switch, message, Spin, Select, Button } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined, SyncOutlined } from '@ant-design/icons';
import { getCommonTradingPairs, getArbitrageForPairs, type TradingPairArbitrage } from '@/api/cex-arbitrage';
import type { ColumnsType } from 'antd/es/table';

const { Text } = Typography;
const { Option } = Select;

const CexArbitrageMonitor: React.FC = () => {
  const [arbitrageData, setArbitrageData] = useState<TradingPairArbitrage[]>([]);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(30); // in seconds
  const [lastUpdateTime, setLastUpdateTime] = useState<string>('');
  const [commonPairs, setCommonPairs] = useState<string[]>([]);
  const [loadingPairs, setLoadingPairs] = useState(false);

  // Default trading pairs to monitor - expanded list
  const defaultPairs = [
    'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'XRPUSDT', 'ADAUSDT', 'SOLUSDT', 'DOGEUSDT', 'DOTUSDT', 'MATICUSDT', 'LTCUSDT',
    'TRXUSDT', 'AVAXUSDT', 'LINKUSDT', 'ATOMUSDT', 'UNIUSDT', 'ETCUSDT', 'XLMUSDT', 'NEARUSDT', 'APTUSDT', 'FILUSDT',
    'ALGOUSDT', 'VETUSDT', 'ICPUSDT', 'ARBUSDT', 'OPUSDT', 'INJUSDT', 'MKRUSDT', 'AAVEUSDT', 'GRTUSDT', 'SHIBUSDT'
  ];

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
      const data = await getArbitrageForPairs(pairs);
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

  const columns: ColumnsType<TradingPairArbitrage> = [
    {
      title: '交易对',
      dataIndex: 'symbol',
      key: 'symbol',
      width: 120,
      fixed: 'left',
      render: (symbol: string, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{symbol}</Text>
          {record.exchangeCount && (
            <Text type="secondary" style={{ fontSize: '11px' }}>
              {record.exchangeCount}/7 交易所
            </Text>
          )}
        </Space>
      ),
    },
    {
      title: '币安',
      dataIndex: ['prices', 'binance'],
      key: 'binance',
      width: 110,
      render: (price?: number) => price ? price.toFixed(6) : '-',
    },
    {
      title: 'OKX',
      dataIndex: ['prices', 'okx'],
      key: 'okx',
      width: 110,
      render: (price?: number) => price ? price.toFixed(6) : '-',
    },
    {
      title: 'Gate',
      dataIndex: ['prices', 'gate'],
      key: 'gate',
      width: 110,
      render: (price?: number) => price ? price.toFixed(6) : '-',
    },
    {
      title: 'Bybit',
      dataIndex: ['prices', 'bybit'],
      key: 'bybit',
      width: 110,
      render: (price?: number) => price ? price.toFixed(6) : '-',
    },
    {
      title: 'Bitget',
      dataIndex: ['prices', 'bitget'],
      key: 'bitget',
      width: 110,
      render: (price?: number) => price ? price.toFixed(6) : '-',
    },
    {
      title: '火币',
      dataIndex: ['prices', 'huobi'],
      key: 'huobi',
      width: 110,
      render: (price?: number) => price ? price.toFixed(6) : '-',
    },
    {
      title: 'MEXC',
      dataIndex: ['prices', 'mexc'],
      key: 'mexc',
      width: 110,
      render: (price?: number) => price ? price.toFixed(6) : '-',
    },
    {
      title: '价差',
      key: 'priceDiff',
      width: 180,
      render: (_, record) => renderPriceDiff(record),
    },
    {
      title: '套利机会',
      key: 'arbitrage',
      width: 200,
      fixed: 'right',
      render: (_, record) => renderArbitrageOpportunity(record),
    },
  ];

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
      <Table
        columns={columns}
        dataSource={arbitrageData}
        rowKey="symbol"
        loading={loading}
        pagination={{ pageSize: 10 }}
        scroll={{ x: 1400 }}
        size="small"
      />
      <div style={{ marginTop: '16px' }}>
        <Space direction="vertical" size="small">
          <Text type="secondary" style={{ fontSize: '12px' }}>
            说明: 以币安 {commonPairs.length || defaultPairs.length} 个交易对为基准，检查在其他交易所（OKX、Gate、Bybit、Bitget、火币、MEXC）的价格差异，优先显示在多个交易所都可交易的币种
          </Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            套利机会: 当价差 &gt; 0.5% 时显示，可在低价交易所买入，高价交易所卖出
          </Text>
        </Space>
      </div>
    </Card>
  );
};

export default CexArbitrageMonitor;
