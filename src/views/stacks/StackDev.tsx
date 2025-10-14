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

const { Title, Text } = Typography;
const { Option } = Select;

interface StxTx {
  tx_id: string;
  nonce: number;
  fee_rate: string;
  sender_address: string;
  sponsored: boolean;
  post_condition_mode: string;
  post_conditions: any[];
  anchor_mode: string;
  tx_status: string;
  receipt_time: number;
  receipt_time_iso: string;
  tx_type: string;
  contract_call?: {
    contract_id: string;
    function_name: string;
    function_signature: string;
    function_args: {
      hex: string;
      repr: string;
      name: string;
      type: string;
    }[];
  };
}

interface MonitorData {
  id: string;
  timestamp: string;
  type: string;
  status: string;
  platform: string;
  swapInfo: string;
  address: string;
  contractId: string;
  fee: string;
}

const StxDevMonitor: React.FC = () => {
  const [data, setData] = useState<MonitorData[]>([]);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(1000); // 默认1000毫秒
  const [lastUpdateTime, setLastUpdateTime] = useState<string>('');
  const [searchText, setSearchText] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [ws, setWs] = useState<WebSocket | null>(null);

  // 解析交易类型为中文
  const parseTransactionType = (type: string): string => {
    const typeMap: Record<string, string> = {
      token_transfer: '代币转账',
      contract_call: '合约调用',
      smart_contract: '智能合约',
      coinbase: 'Coinbase',
    };
    return typeMap[type] || type;
  };

  // 解析交易状态为中文
  const parseTransactionStatus = (status: string): string => {
    const statusMap: Record<string, string> = {
      success: '成功',
      pending: '待处理',
      abort_by_response: '响应中止',
      abort_by_post_condition: '后置条件中止',
    };
    return statusMap[status] || status;
  };

  // 格式化地址
  const formatAddress = (address: string): string => {
    if (!address || address.length < 10) return address;
    return `${address.slice(0, 8)}...${address.slice(-6)}`;
  };

  // 格式化时间戳
  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  // 解析合约平台
  const parseContractPlatform = (contractId: string): string => {
    if (!contractId) return '未知';

    const platformMap: Record<string, string> = {
      'SM1793C4R5PZ4NS4VQ4WMP7SKKYVH8JZEWSZ9HCCR.xyk-core-v-1-1': 'XYK',
      'SM1793C4R5PZ4NS4VQ4WMP7SKKYVH8JZEWSZ9HCCR.xyk-core-v-1-2': 'XYK',
      'SPQC38PW542EQJ5M11CR25P7BS1CA6QT4TBXGB3M.stableswap-stx-ststx-v-1-2': 'STX-STSTX',
      'SP102V8P0F7JX67ARQ77WEA3D3CFB5XW39REDT0AM.amm-pool-v2-01': 'ALEX',
    };

    return platformMap[contractId] || '其他';
  };

  // 解析swap信息
  const parseSwapInfo = (tx: StxTx): string => {
    if (!tx.contract_call) return '';

    const { contract_id, function_name, function_args } = tx.contract_call;

    // XYK swap
    if (contract_id.includes('xyk-core')) {
      try {
        const tokenX = function_args[1]?.repr?.split('-')[1] || '';
        const tokenY = function_args[2]?.repr?.split('-')[1] || '';
        const dx = function_args[3]?.repr?.split('u')[1] || '';
        const dy = function_args[4]?.repr?.split('u')[1] || '';
        
        const dxValue = (parseInt(dx) / 1000000).toFixed(4);
        const dyValue = (parseInt(dy) / 1000000).toFixed(4);
        
        if (function_name === 'swap-y-for-x') {
          return `${dyValue} ${tokenY} ==> ${dxValue} ${tokenX}`;
        } else {
          return `${dxValue} ${tokenX} ==> ${dyValue} ${tokenY}`;
        }
      } catch (e) {
        return '解析失败';
      }
    }

    // STX-STSTX swap
    if (contract_id.includes('stableswap-stx-ststx')) {
      try {
        const dx = function_args[2]?.repr?.split('u')[1] || '';
        const dy = function_args[3]?.repr?.split('u')[1] || '';
        
        const dxValue = (parseInt(dx) / 1000000).toFixed(4);
        const dyValue = (parseInt(dy) / 1000000).toFixed(4);
        
        if (function_name === 'swap-y-for-x') {
          return `${dyValue} STSTX ==> ${dxValue} STX`;
        } else {
          return `${dxValue} STX ==> ${dyValue} STSTX`;
        }
      } catch (e) {
        return '解析失败';
      }
    }

    // ALEX swap
    if (contract_id.includes('amm-pool-v2-01')) {
      try {
        const tokenX = function_args[0]?.repr?.split('-')[1] || '';
        const tokenY = function_args[1]?.repr?.split('-')[1] || '';
        const dx = function_args[3]?.repr?.split('u')[1] || '';
        const dy = function_args[4]?.repr?.split('u')[1] || '';
        
        const dxValue = (parseInt(dx) / 100000000).toFixed(4);
        const dyValue = (parseInt(dy) / 100000000).toFixed(4);
        
        if (function_name === 'swap-y-for-x') {
          return `${dyValue} ${tokenY} ==> ${dxValue} ${tokenX}`;
        } else {
          return `${dxValue} ${tokenX} ==> ${dyValue} ${tokenY}`;
        }
      } catch (e) {
        return '解析失败';
      }
    }

    return `${function_name}`;
  };

  // 连接WebSocket
  useEffect(() => {
    let websocket: WebSocket | null = null;
    let reconnectTimeout: NodeJS.Timeout | null = null;
    let isManuallyClosed = false;
    
    const connect = () => {
      // 获取当前页面的协议，构建WebSocket地址
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.hostname;
      const port = window.location.port ? window.location.port : (window.location.protocol === 'https:' ? '443' : '80');
      
      // 构建WebSocket地址
      // 在生产环境中，后端通常在同一个域名但不同的端口上
      let wsUrl;
      if (process.env.NODE_ENV === 'development') {
        // 开发环境使用8080端口
        wsUrl = `${protocol}//${host}:8080/ws`;
      } else {
        // 生产环境使用8080端口（Docker部署时）
        wsUrl = `${protocol}//${host}:8080/ws`;
      }
      
      console.log('Attempting to connect to WebSocket:', wsUrl);
      websocket = new WebSocket(wsUrl);
      
      websocket.onopen = () => {
        console.log('Connected to WebSocket');
        setLoading(false);
        message.success('WebSocket连接成功');
      };

      websocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          // 处理连接成功消息
          if (data.type === 'connection') {
            console.log('Connection message:', data.message);
            return;
          }
          
          // 处理交易数据
          const tx: StxTx = data;
          const monitorData: MonitorData = {
            id: tx.tx_id,
            timestamp: formatTimestamp(tx.receipt_time_iso),
            type: parseTransactionType(tx.tx_type),
            status: parseTransactionStatus(tx.tx_status),
            platform: tx.contract_call ? parseContractPlatform(tx.contract_call.contract_id) : '-',
            swapInfo: parseSwapInfo(tx),
            address: tx.sender_address,
            contractId: tx.contract_call ? tx.contract_call.contract_id : '-',
            fee: tx.fee_rate ? (parseInt(tx.fee_rate) / 1000000).toFixed(6) : '0',
          };

          // 添加到数据列表开头
          setData(prevData => [monitorData, ...prevData.slice(0, 99)]); // 限制最多100条记录
          setLastUpdateTime(new Date().toLocaleTimeString('zh-CN'));
        } catch (error) {
          console.error('Error parsing message:', error);
        }
      };

      websocket.onerror = (error) => {
        console.error('WebSocket error:', error);
        if (!isManuallyClosed) {
          message.error('WebSocket连接错误: ' + (error as Error).message);
        }
      };

      websocket.onclose = (event) => {
        if (!isManuallyClosed) {
          console.log('WebSocket disconnected:', event.reason);
          message.warning('WebSocket连接已断开');
          
          // 尝试重连，但只在非手动关闭的情况下
          if (reconnectTimeout) {
            clearTimeout(reconnectTimeout);
          }
          reconnectTimeout = setTimeout(() => {
            console.log('Attempting to reconnect...');
            connect();
          }, 3000);
        }
      };

      setWs(websocket);
    };

    connect();

    return () => {
      isManuallyClosed = true;
      if (websocket) {
        websocket.close();
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
    };
  }, []);

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
            <Text copyable={{ text: address }}>{formatAddress(address)}</Text>
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
              <Text copyable={{ text: contractId }}>{formatAddress(contractId)}</Text>
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
    
    const matchPlatform = selectedPlatforms.length === 0 || selectedPlatforms.includes(item.platform);
    
    return matchSearch && matchPlatform;
  });

  return (
    <div style={{ padding: '20px' }}>
      {/* 页面标题 */}
      <Card size="small" style={{ marginBottom: '10px' }}>
        <Title level={3} style={{ margin: 0 }}>Stacks 实时监控</Title>
        <Text type="secondary" style={{ fontSize: '12px' }}>实时监控 Stacks 网络上的交易活动</Text>
      </Card>

      {/* 统计信息 */}
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
              title="最后更新"
              value={lastUpdateTime || '未更新'}
              valueStyle={{ fontSize: '14px' }}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card size="small">
            <Space direction="horizontal" style={{ width: '100%' }} size="small">
              <Text style={{ fontSize: '12px' }}>自动刷新</Text>
              <Switch
                checked={autoRefresh}
                onChange={setAutoRefresh}
                size="small"
              />
              <InputNumber
                min={100} // 最小值改为100毫秒
                max={3600000}
                value={refreshInterval}
                onChange={(value) => setRefreshInterval(value || 100)} // 默认值改为100
                style={{ width: '80px' }}
                disabled={!autoRefresh}
                size="small"
              />
              <Text style={{ fontSize: '12px' }}>毫秒</Text>
              <Button
                type="primary"
                icon={<ReloadOutlined />}
                onClick={() => window.location.reload()}
                size="small"
              >
                重新连接
              </Button>
            </Space>
          </Card>
        </Col>
      </Row>

      {/* 操作栏和筛选 */}
      <Card size="small" style={{ marginBottom: '10px' }}>
        <Space direction="vertical" style={{ width: '100%' }} size="small">
          <Space wrap size="small">
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
                setSelectedPlatforms([]);
              }}
              size="small"
            >
              清除筛选
            </Button>
          </Space>
          
          <Space wrap size="small">
            <Text style={{ fontSize: '12px' }}>平台:</Text>
            <Select
              mode="multiple"
              placeholder="选择平台"
              value={selectedPlatforms}
              onChange={setSelectedPlatforms}
              style={{ minWidth: 150 }}
              size="small"
            >
              <Option value="XYK">XYK</Option>
              <Option value="STX-STSTX">STX-STSTX</Option>
              <Option value="ALEX">ALEX</Option>
              <Option value="其他">其他</Option>
            </Select>
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
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
            pageSizeOptions: ['10', '20', '50', '100'],
          }}
          scroll={{ x: 1400 }}
          size="small"
        />
      </Card>
    </div>
  );
};

export default StxDevMonitor;