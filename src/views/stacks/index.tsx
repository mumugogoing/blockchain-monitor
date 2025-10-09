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
  const [total, setTotal] = useState(0);
  const [monitorAddress, setMonitorAddress] = useState(''); // 地址监控

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
      setTotal(result.total);
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
    return matchSearch && matchType && matchStatus && matchPlatform && matchContract;
  });

  return (
    <div style={{ padding: '20px' }}>
      {/* 页面标题 */}
      <Card style={{ marginBottom: '20px' }}>
        <Title level={2}>Stacks 监控</Title>
        <Text type="secondary">实时监控 Stacks 网络上的交易活动</Text>
      </Card>

      {/* 价格监控 - 独立自动刷新控制 */}
      <PriceMonitor />

      {/* 统计信息 */}
      <Row gutter={16} style={{ marginBottom: '20px' }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="显示数据数"
              value={filteredData.length}
              suffix="条"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="当前页"
              value={currentPage}
              suffix={`/ ${pageSize}条/页`}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="最后更新"
              value={lastUpdateTime || '未更新'}
              valueStyle={{ fontSize: '16px' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text>自动刷新</Text>
              <Switch
                checked={autoRefresh}
                onChange={setAutoRefresh}
                checkedChildren="开启"
                unCheckedChildren="关闭"
              />
              <Space.Compact style={{ width: '100%' }}>
                <InputNumber
                  min={1}
                  max={3600}
                  value={refreshInterval}
                  onChange={(value) => setRefreshInterval(value || 30)}
                  style={{ width: '70%' }}
                  disabled={!autoRefresh}
                  placeholder="秒"
                />
                <Select
                  value={refreshInterval}
                  onChange={setRefreshInterval}
                  style={{ width: '30%' }}
                  disabled={!autoRefresh}
                  popupMatchSelectWidth={120}
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
              </Space.Compact>
            </Space>
          </Card>
        </Col>
      </Row>

      {/* 操作栏和筛选 */}
      <Card style={{ marginBottom: '20px' }}>
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <Space wrap>
            <Button
              type="primary"
              icon={<ReloadOutlined />}
              onClick={fetchData}
              loading={loading}
            >
              刷新数据
            </Button>
            <Input
              placeholder="搜索交易ID、地址或交易信息"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 350 }}
            />
            <Button
              onClick={() => {
                setSearchText('');
                setSelectedTypes([]);
                setSelectedStatuses([]);
                setSelectedPlatforms([]);
                setSelectedContracts([]);
                setCurrentPage(1);
              }}
            >
              清除筛选
            </Button>
          </Space>
          
          <Space wrap>
            <Text>地址监控：</Text>
            <Input
              placeholder="输入STX地址进行监控"
              value={monitorAddress}
              onChange={(e) => setMonitorAddress(e.target.value)}
              style={{ width: 300 }}
            />
            <Button
              type="primary"
              onClick={() => {
                if (monitorAddress) {
                  setSearchText(monitorAddress);
                  message.success(`已开始监控地址: ${formatStacksAddress(monitorAddress)}`);
                  // 这里可以集成推送通知服务（如 Firebase Cloud Messaging, OneSignal 等）
                  message.info('地址交易通知功能需要配置推送服务（如 Firebase/OneSignal）');
                } else {
                  message.warning('请输入要监控的地址');
                }
              }}
            >
              开始监控
            </Button>
            <Button
              onClick={() => {
                setMonitorAddress('');
                message.info('已停止地址监控');
              }}
            >
              停止监控
            </Button>
          </Space>
          
          <Space wrap>
            <Text>类型筛选：</Text>
            <Select
              mode="multiple"
              placeholder="选择类型"
              value={selectedTypes}
              onChange={setSelectedTypes}
              style={{ minWidth: 200 }}
            >
              <Option value="合约调用">合约调用</Option>
              <Option value="智能合约">智能合约</Option>
              <Option value="Coinbase">Coinbase</Option>
            </Select>
            
            <Text style={{ marginLeft: 16 }}>状态筛选：</Text>
            <Select
              mode="multiple"
              placeholder="选择状态"
              value={selectedStatuses}
              onChange={setSelectedStatuses}
              style={{ minWidth: 200 }}
            >
              <Option value="成功">成功</Option>
              <Option value="待处理">待处理</Option>
              <Option value="响应中止">响应中止</Option>
              <Option value="后置条件中止">后置条件中止</Option>
            </Select>
            
            <Text style={{ marginLeft: 16 }}>平台筛选：</Text>
            <Select
              mode="multiple"
              placeholder="选择平台"
              value={selectedPlatforms}
              onChange={setSelectedPlatforms}
              style={{ minWidth: 200 }}
            >
              <Option value="ALEX">ALEX</Option>
              <Option value="Velar">Velar</Option>
              <Option value="XYK">XYK</Option>
              <Option value="Bitflow">Bitflow</Option>
              <Option value="Arkadiko">Arkadiko</Option>
              <Option value="Stackswap">Stackswap</Option>
            </Select>
            
            <Text style={{ marginLeft: 16 }}>合约筛选：</Text>
            <Input
              placeholder="输入合约地址关键词"
              value={selectedContracts.join(',')}
              onChange={(e) => setSelectedContracts(e.target.value ? e.target.value.split(',').map(s => s.trim()) : [])}
              style={{ minWidth: 200 }}
            />
          </Space>
        </Space>
      </Card>

      {/* 数据列表表格 */}
      <Card>
        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey="id"
          loading={loading}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: total,
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
