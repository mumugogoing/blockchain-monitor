import React, { useState, useEffect } from 'react';
import { Card, Space, Typography, Statistic, Row, Col, Tag, Switch, message, Spin, Select, InputNumber } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import { getTokenPriceData, getCEXSymbol, type TokenPrice } from '@/api/cex-prices';
import { getDEXPrice } from '@/api/dex-prices';

const { Text } = Typography;
const { Option } = Select;

interface PriceMonitorProps {
  // No props needed - component manages its own state
}

const PriceMonitor: React.FC<PriceMonitorProps> = () => {
  const [priceData, setPriceData] = useState<TokenPrice[]>([]);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(30); // in seconds
  const [lastUpdateTime, setLastUpdateTime] = useState<string>('');

  // Tokens to monitor - focusing on major Stacks tokens with CEX listings
  const tokensToMonitor = [
    { token: 'STX', dexPair: 'STX-USDC' },
    { token: 'sBTC', dexPair: 'STX-SBTC' },
    { token: 'aeUSDC', dexPair: 'STX-AEUSDC' },
    { token: 'USDA', dexPair: 'USDA-AEUSDC' },
  ];

  const fetchPrices = async () => {
    setLoading(true);
    try {
      const pricePromises = tokensToMonitor.map(async ({ token, dexPair }) => {
        const cexSymbol = getCEXSymbol(token);
        const dexPrice = await getDEXPrice(dexPair);
        return await getTokenPriceData(token, cexSymbol, dexPrice ?? undefined);
      });

      const prices = await Promise.all(pricePromises);
      setPriceData(prices);
      setLastUpdateTime(new Date().toLocaleTimeString('zh-CN'));
    } catch (error) {
      message.error('获取价格数据失败');
      console.error('Price fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrices();
  }, []);

  useEffect(() => {
    let interval: number | undefined;
    if (autoRefresh) {
      interval = window.setInterval(() => {
        fetchPrices();
      }, refreshInterval * 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, refreshInterval]);

  const renderPriceDiff = (priceDiff?: number, priceDiffPercent?: number) => {
    if (priceDiff === undefined || priceDiffPercent === undefined) {
      return <Text type="secondary">-</Text>;
    }

    const isPositive = priceDiff > 0;
    const color = isPositive ? 'green' : 'red';
    const icon = isPositive ? <ArrowUpOutlined /> : <ArrowDownOutlined />;

    return (
      <Space>
        <Tag color={color} icon={icon}>
          {priceDiff.toFixed(4)}
        </Tag>
        <Text style={{ color: isPositive ? '#52c41a' : '#ff4d4f' }}>
          {priceDiffPercent.toFixed(2)}%
        </Text>
      </Space>
    );
  };

  const renderArbitrageOpportunity = (priceDiffPercent?: number) => {
    if (!priceDiffPercent) return null;
    
    const absPercent = Math.abs(priceDiffPercent);
    if (absPercent < 0.5) return null; // Only show if difference > 0.5%
    
    const direction = priceDiffPercent > 0 ? 'DEX买入 → CEX卖出' : 'CEX买入 → DEX卖出';
    return (
      <Tag color={absPercent > 2 ? 'gold' : 'blue'}>
        套利机会: {direction}
      </Tag>
    );
  };

  return (
    <Card 
      title={
        <Space>
          <Text strong>价格监控与套利机会</Text>
          {lastUpdateTime && <Text type="secondary" style={{ fontSize: '12px' }}>最后更新: {lastUpdateTime}</Text>}
        </Space>
      }
      style={{ marginBottom: '20px' }}
      extra={
        <Space>
          <Text>自动刷新</Text>
          <Switch
            checked={autoRefresh}
            onChange={setAutoRefresh}
            checkedChildren="开启"
            unCheckedChildren="关闭"
            size="small"
          />
          <InputNumber
            min={1}
            max={86400}
            value={refreshInterval}
            onChange={(value) => setRefreshInterval(value || 30)}
            style={{ width: '80px' }}
            disabled={!autoRefresh}
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
            <Option value={600}>10分钟</Option>
            <Option value={1800}>30分钟</Option>
            <Option value={3600}>1小时</Option>
            <Option value={43200}>12小时</Option>
            <Option value={86400}>24小时</Option>
          </Select>
          {loading && <Spin size="small" />}
        </Space>
      }
    >
      <Row gutter={[16, 16]}>
        {priceData.map((data) => (
          <Col span={12} key={data.token}>
            <Card size="small" hoverable>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Space>
                  <Text strong style={{ fontSize: '16px' }}>{data.token}</Text>
                  {renderArbitrageOpportunity(data.priceDiffPercent)}
                </Space>
                
                <Row gutter={16}>
                  <Col span={12}>
                    <Statistic
                      title="CEX平均价"
                      value={data.averageCexPrice ?? '-'}
                      precision={6}
                      valueStyle={{ fontSize: '14px' }}
                      suffix="USDT"
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic
                      title="DEX价格"
                      value={data.dexPrice ?? '未获取'}
                      precision={6}
                      valueStyle={{ fontSize: '14px' }}
                      suffix={data.dexPrice ? 'USDT' : ''}
                    />
                  </Col>
                </Row>

                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                  <Text type="secondary" style={{ fontSize: '12px' }}>价差:</Text>
                  {renderPriceDiff(data.priceDiff, data.priceDiffPercent)}
                </Space>

                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                  <Text type="secondary" style={{ fontSize: '12px' }}>各交易所价格:</Text>
                  <Space wrap>
                    {data.cexPrices.binance && (
                      <Tag>币安: {data.cexPrices.binance.toFixed(6)}</Tag>
                    )}
                    {data.cexPrices.okx && (
                      <Tag>OKX: {data.cexPrices.okx.toFixed(6)}</Tag>
                    )}
                    {data.cexPrices.gate && (
                      <Tag>Gate: {data.cexPrices.gate.toFixed(6)}</Tag>
                    )}
                    {data.cexPrices.bitget && (
                      <Tag>Bitget: {data.cexPrices.bitget.toFixed(6)}</Tag>
                    )}
                    {data.cexPrices.mexc && (
                      <Tag>MEXC: {data.cexPrices.mexc.toFixed(6)}</Tag>
                    )}
                    {data.cexPrices.huobi && (
                      <Tag>Huobi: {data.cexPrices.huobi.toFixed(6)}</Tag>
                    )}
                    {data.cexPrices.bybit && (
                      <Tag>Bybit: {data.cexPrices.bybit.toFixed(6)}</Tag>
                    )}
                  </Space>
                </Space>
              </Space>
            </Card>
          </Col>
        ))}
      </Row>
    </Card>
  );
};

export default PriceMonitor;
