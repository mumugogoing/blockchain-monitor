import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Tag,
  Button,
  Space,
  Switch,
  Typography,
  Statistic,
  Row,
  Col,
  message,
  Input,
  Select,
  Tooltip,
  InputNumber,
} from 'antd';
import {
  ReloadOutlined,
  SearchOutlined,
  LinkOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import {
  getStacksTransactions,
  parseStacksTransactionType,
  parseStacksTransactionStatus,
  formatStacksAddress,
  formatStacksTimestamp,
  parseContractPlatform,
  parseSwapInfo,
  type StacksTransaction,
} from '@/api/stacks';
import PriceMonitor from '@/components/PriceMonitor';

const { Title, Text } = Typography;
const { Option } = Select;

interface MonitorData {
  id: string;
  timestamp: string;
  type: string;
  status: string;
  platform: string;
  swapInfo: string;
  address: string;
  contractId: string; // 合约地址
  fee: string; // 手续费
}

const StacksMonitor: React.FC = () => {
  const [data, setData] = useState<MonitorData[]>([]);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(30); // 自定义刷新间隔（秒）
  const [lastUpdateTime, setLastUpdateTime] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchText, setSearchText] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]); // 平台筛选
  const [selectedContracts, setSelectedContracts] = useState<string[]>([]); // 合约筛选
  const [minAmount, setMinAmount] = useState<number | null>(null); // 最小交易金额
  const [maxAmount, setMaxAmount] = useState<number | null>(null); // 最大交易金额
  const [filterCurrency, setFilterCurrency] = useState<string>(''); // 筛选币种

  // 获取监控数据
  const fetchData = async () => {
    setLoading(true);
    try {
      const offset = (currentPage - 1) * pageSize;
      const result = await getStacksTransactions(pageSize, offset);
      
      // 转换数据格式，并过滤掉代币转账交易
      const transformedData: MonitorData[] = result.results
        .filter((tx: StacksTransaction) => tx.tx_type !== 'token_transfer') // 移除代币转账
        .map((tx: StacksTransaction) => ({
          id: tx.tx_id,
          timestamp: formatStacksTimestamp(tx.burn_block_time),
          type: parseStacksTransactionType(tx.tx_type),
          status: parseStacksTransactionStatus(tx.tx_status),
          platform: tx.contract_call ? parseContractPlatform(tx.contract_call.contract_id) : '-',
          swapInfo: parseSwapInfo(tx),
          address: tx.sender_address,
          contractId: tx.contract_call ? tx.contract_call.contract_id : '-',
          fee: tx.fee_rate ? (parseInt(tx.fee_rate) / 1000000).toFixed(6) : '0',
        }));
      
      setData(transformedData);
      setLastUpdateTime(new Date().toLocaleTimeString('zh-CN'));
      message.success('数据已更新');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '获取数据失败';
      message.error(errorMessage);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // 自动刷新
  useEffect(() => {
    fetchData();
  }, [currentPage, pageSize]);

  useEffect(() => {
    let interval: number | undefined;
    if (autoRefresh) {
      interval = window.setInterval(() => {
        fetchData();
      }, refreshInterval * 1000); // 使用自定义刷新间隔
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, refreshInterval]);

  // 表格列定义
  const columns: ColumnsType<MonitorData> = [
    {
      title: '交易ID',
      dataIndex: 'id',
      key: 'id',
      width: 150,
      render: (id: string) => (
        <Tooltip title={id}>
          <Space>
            <Text copyable={{ text: id }}>{id.substring(0, 10)}...</Text>
            <a
              href={`https://explorer.hiro.so/txid/${id}?chain=mainnet`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <LinkOutlined />
            </a>
          </Space>
        </Tooltip>
      ),
    },
    {
      title: '时间',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 180,
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: string) => (
        <Tag color="blue">{type}</Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={status === '成功' ? 'green' : status === '待处理' ? 'orange' : 'red'}>{status}</Tag>
      ),
    },
    {
      title: '平台',
      dataIndex: 'platform',
      key: 'platform',
      width: 120,
      render: (platform: string) => (
        <Tag color="purple">{platform}</Tag>
      ),
    },
    {
      title: '交易信息',
      dataIndex: 'swapInfo',
      key: 'swapInfo',
      width: 250,
      render: (swapInfo: string) => (
        swapInfo ? <Text strong style={{ color: '#1890ff' }}>{swapInfo}</Text> : <Text type="secondary">-</Text>
      ),
    },
    {
      title: '手续费',
      dataIndex: 'fee',
      key: 'fee',
      width: 120,
      render: (fee: string) => (
        <Text>{fee} STX</Text>
      ),
    },
    {
      title: '发送地址',
      dataIndex: 'address',
      key: 'address',
      width: 180,
      render: (address: string) => (
        <Tooltip title={address}>
          <Space>
            <Text copyable={{ text: address }}>{formatStacksAddress(address)}</Text>
            <a
              href={`https://explorer.hiro.so/address/${address}?chain=mainnet`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <LinkOutlined />
            </a>
          </Space>
        </Tooltip>
      ),
    },
    {
      title: '交易合约',
      dataIndex: 'contractId',
      key: 'contractId',
      width: 200,
      render: (contractId: string) => (
        contractId && contractId !== '-' ? (
          <Tooltip title={contractId}>
            <Space>
              <Text copyable={{ text: contractId }}>{formatStacksAddress(contractId)}</Text>
              <a
                href={`https://explorer.hiro.so/txid/${contractId}?chain=mainnet`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <LinkOutlined />
              </a>
            </Space>
          </Tooltip>
        ) : (
          <Text type="secondary">-</Text>
        )
      ),
    },
  ];

  // 过滤数据
  const filteredData = data.filter(item => {
    const matchSearch = !searchText || 
      item.id.toLowerCase().includes(searchText.toLowerCase()) ||
      item.address.toLowerCase().includes(searchText.toLowerCase()) ||
      item.swapInfo.toLowerCase().includes(searchText.toLowerCase());
    const matchType = selectedTypes.length === 0 || selectedTypes.includes(item.type);
    const matchStatus = selectedStatuses.length === 0 || selectedStatuses.includes(item.status);
    const matchPlatform = selectedPlatforms.length === 0 || selectedPlatforms.includes(item.platform);
    const matchContract = selectedContracts.length === 0 || selectedContracts.some(contract => item.contractId.includes(contract));
    
    // 金额筛选 - 从swapInfo中提取金额
    let matchAmount = true;
    if ((minAmount !== null || maxAmount !== null || filterCurrency) && item.swapInfo) {
      const swapParts = item.swapInfo.split('==>');
      if (swapParts.length === 2) {
        // 从第一部分提取金额和币种，如 "3000 stx"
        const fromMatch = swapParts[0].trim().match(/^([\d.]+)\s+(\w+)$/);
        // 从第二部分提取金额和币种，如 "1853 aeusdc"
        const toMatch = swapParts[1].trim().match(/^([\d.]+)\s+(\w+)$/);
        
        if (fromMatch || toMatch) {
          const fromAmount = fromMatch ? parseFloat(fromMatch[1]) : null;
          const fromCurrency = fromMatch ? fromMatch[2].toLowerCase() : '';
          const toAmount = toMatch ? parseFloat(toMatch[1]) : null;
          const toCurrency = toMatch ? toMatch[2].toLowerCase() : '';
          
          // 币种筛选 - 检查fromCurrency或toCurrency是否匹配
          if (filterCurrency) {
            const currencyLower = filterCurrency.toLowerCase();
            matchAmount = fromCurrency === currencyLower || toCurrency === currencyLower;
          }
          
          // 金额筛选 - 根据币种筛选对应的金额
          if (matchAmount && (minAmount !== null || maxAmount !== null)) {
            let targetAmount: number | null = null;
            
            if (filterCurrency) {
              // 如果指定了币种，使用对应币种的金额
              if (fromCurrency === filterCurrency.toLowerCase()) {
                targetAmount = fromAmount;
              } else if (toCurrency === filterCurrency.toLowerCase()) {
                targetAmount = toAmount;
              }
            } else {
              // 如果没有指定币种，使用第一个金额（通常是发送金额）
              targetAmount = fromAmount;
            }
            
            if (targetAmount !== null) {
              if (minAmount !== null && targetAmount < minAmount) {
                matchAmount = false;
              }
              if (maxAmount !== null && targetAmount > maxAmount) {
                matchAmount = false;
              }
            } else {
              matchAmount = false;
            }
          }
        } else {
          // 如果没有金额信息，且设置了金额筛选，则不匹配
          if (minAmount !== null || maxAmount !== null) {
            matchAmount = false;
          }
        }
      } else {
        // 如果没有符合格式的swap信息，且设置了金额筛选，则不匹配
        if (minAmount !== null || maxAmount !== null) {
          matchAmount = false;
        }
      }
    }
    
    return matchSearch && matchType && matchStatus && matchPlatform && matchContract && matchAmount;
  });

  return (
    <div style={{ padding: '20px' }}>
      {/* 页面标题 - 更紧凑 */}
      <Card size="small" style={{ marginBottom: '10px' }}>
        <Title level={3} style={{ margin: 0 }}>Stacks 监控</Title>
        <Text type="secondary" style={{ fontSize: '12px' }}>实时监控 Stacks 网络上的交易活动</Text>
      </Card>

      {/* 价格监控 - 独立自动刷新控制 */}
      <PriceMonitor />

      {/* 统计信息 - 更紧凑 */}
      <Row gutter={8} style={{ marginBottom: '10px' }}>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="显示数据数"
              value={filteredData.length}
              suffix="条"
              valueStyle={{ fontSize: '18px' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="当前页"
              value={currentPage}
              suffix={`/ ${pageSize}条/页`}
              valueStyle={{ fontSize: '18px' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="最后更新"
              value={lastUpdateTime || '未更新'}
              valueStyle={{ fontSize: '14px' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Space direction="horizontal" style={{ width: '100%' }} size="small">
              <Text style={{ fontSize: '12px' }}>自动刷新</Text>
              <Switch
                checked={autoRefresh}
                onChange={setAutoRefresh}
                size="small"
              />
              <InputNumber
                min={1}
                max={3600}
                value={refreshInterval}
                onChange={(value) => setRefreshInterval(value || 30)}
                style={{ width: '60px' }}
                disabled={!autoRefresh}
                size="small"
              />
              <Text style={{ fontSize: '12px' }}>秒</Text>
            </Space>
          </Card>
        </Col>
      </Row>

      {/* 操作栏和筛选 - 更紧凑 */}
      <Card size="small" style={{ marginBottom: '10px' }}>
        <Space direction="vertical" style={{ width: '100%' }} size="small">
          <Space wrap size="small">
            <Button
              type="primary"
              icon={<ReloadOutlined />}
              onClick={fetchData}
              loading={loading}
              size="small"
            >
              刷新
            </Button>
            <Input
              placeholder="搜索交易ID、地址或交易信息"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 300 }}
              size="small"
            />
            <Button
              onClick={() => {
                setSearchText('');
                setSelectedTypes([]);
                setSelectedStatuses([]);
                setSelectedPlatforms([]);
                setSelectedContracts([]);
                setMinAmount(null);
                setMaxAmount(null);
                setFilterCurrency('');
                setCurrentPage(1);
              }}
              size="small"
            >
              清除筛选
            </Button>
          </Space>
          
          <Space wrap size="small">
            <Text style={{ fontSize: '12px' }}>类型:</Text>
            <Select
              mode="multiple"
              placeholder="选择类型"
              value={selectedTypes}
              onChange={setSelectedTypes}
              style={{ minWidth: 150 }}
              size="small"
            >
              <Option value="合约调用">合约调用</Option>
              <Option value="智能合约">智能合约</Option>
              <Option value="Coinbase">Coinbase</Option>
            </Select>
            
            <Text style={{ fontSize: '12px' }}>状态:</Text>
            <Select
              mode="multiple"
              placeholder="选择状态"
              value={selectedStatuses}
              onChange={setSelectedStatuses}
              style={{ minWidth: 150 }}
              size="small"
            >
              <Option value="成功">成功</Option>
              <Option value="待处理">待处理</Option>
              <Option value="响应中止">响应中止</Option>
              <Option value="后置条件中止">后置条件中止</Option>
            </Select>
            
            <Text style={{ fontSize: '12px' }}>平台:</Text>
            <Select
              mode="multiple"
              placeholder="选择平台"
              value={selectedPlatforms}
              onChange={setSelectedPlatforms}
              style={{ minWidth: 150 }}
              size="small"
            >
              <Option value="ALEX">ALEX</Option>
              <Option value="Velar">Velar</Option>
              <Option value="XYK">XYK</Option>
              <Option value="Bitflow">Bitflow</Option>
              <Option value="Arkadiko">Arkadiko</Option>
              <Option value="Stackswap">Stackswap</Option>
            </Select>
            
            <Text style={{ fontSize: '12px' }}>合约:</Text>
            <Input
              placeholder="合约地址关键词"
              value={selectedContracts.join(',')}
              onChange={(e) => setSelectedContracts(e.target.value ? e.target.value.split(',').map(s => s.trim()) : [])}
              style={{ width: 150 }}
              size="small"
            />
          </Space>
          
          <Space wrap size="small">
            <Text style={{ fontSize: '12px' }}>币种:</Text>
            <Select
              placeholder="选择币种"
              value={filterCurrency}
              onChange={setFilterCurrency}
              style={{ width: 120 }}
              size="small"
              allowClear
            >
              <Option value="stx">STX</Option>
              <Option value="aeusdc">aeUSDC</Option>
              <Option value="abtc">aBTC</Option>
              <Option value="susdt">sUSDT</Option>
              <Option value="sbtc">sBTC</Option>
              <Option value="usda">USDA</Option>
              <Option value="alex">ALEX</Option>
              <Option value="velar">VELAR</Option>
            </Select>
            
            <Text style={{ fontSize: '12px' }}>金额范围:</Text>
            <InputNumber
              placeholder="最小值"
              value={minAmount}
              onChange={setMinAmount}
              style={{ width: 100 }}
              size="small"
              min={0}
            />
            <Text style={{ fontSize: '12px' }}>-</Text>
            <InputNumber
              placeholder="最大值"
              value={maxAmount}
              onChange={setMaxAmount}
              style={{ width: 100 }}
              size="small"
              min={0}
            />
            <Text type="secondary" style={{ fontSize: '11px' }}>
              (例: stx&gt;3000 且 &lt;5000)
            </Text>
          </Space>
        </Space>
      </Card>

      {/* 数据列表表格 */}
      <Card size="small">
        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey="id"
          loading={loading}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: filteredData.length,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
            onChange: (page, newPageSize) => {
              setCurrentPage(page);
              if (newPageSize) setPageSize(newPageSize);
            },
            pageSizeOptions: ['3', '5', '10', '20', '50', '100'],
          }}
          scroll={{ x: 1400 }}
          size="small"
        />
      </Card>
    </div>
  );
};

export default StacksMonitor;
