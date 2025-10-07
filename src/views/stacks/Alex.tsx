import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Tag,
  Button,
  Space,
  Switch,
  Typography,
  message,
  Input,
  Select,
} from 'antd';
import {
  ReloadOutlined,
} from '@ant-design/icons';
import { 
  calcsumdc, 
  getAbtBtcDiff, 
  getDtdhdiff,
  xykAutoSell as xykAutoSellApi,
  xykAutoBuy as xykAutoBuyApi
} from '@/api/dex/alex';

const { Title } = Typography;
const { Option } = Select;

interface LogItem {
  _uid: number;
  timestamp: string;
  type: string;
  message: string;
  txidShort?: string;
  fullTxid?: string;
  expanded?: boolean;
}

interface SumTableData {
  sumStx: string;
  sumUsd: string;
  sumBtc: string;
  [key: string]: string;
}

interface AbtcTableData {
  Abtc: string;
  Bbtc: string;
  AbtcBtcDiff: string;
}

interface DtdhTableData {
  Dtdh: string;
  Hdtd: string;
  DtdhHdtdDiff: string;
}

interface XykForm {
  amount: number;
  dx: string;
  dy: string;
  su: string;
  fee: string;
}

const StacksAlex: React.FC = () => {
  // 数据状态
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [autoRefresh2, setAutoRefresh2] = useState(false);
  const [autoRefresh3, setAutoRefresh3] = useState(false);
  const [sumDataFetchTime, setSumDataFetchTime] = useState('');
  const [abtcDataFetchTime, setAbtcDataFetchTime] = useState('');
  const [dtdhDataFetchTime, setDtdhDataFetchTime] = useState('');
  const [isFetchingSumData, setIsFetchingSumData] = useState(false);
  const [isFetchingAbtcData, setIsFetchingAbtcData] = useState(false);
  const [isFetchingDtdhData, setIsFetchingDtdhData] = useState(false);
  const [sumTableData, setSumTableData] = useState<SumTableData | null>(null);
  const [abtcTableData, setAbtcTableData] = useState<AbtcTableData | null>(null);
  const [dtdhTableData, setDtdhTableData] = useState<DtdhTableData | null>(null);
  const [otherTableData, setOtherTableData] = useState<any[]>([]);
  const [otherTableColumnsData, setOtherTableColumnsData] = useState<any[]>([]);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [showOtherData, setShowOtherData] = useState(false);

  // 交易表单
  const [xykForm1, setXykForm1] = useState<XykForm>({
    amount: 3000,
    dx: 'SM1793C4R5PZ4NS4VQ4WMP7SKKYVH8JZEWSZ9HCCR.token-stx-v-1-2',
    dy: 'SP3Y2ZSH8P7D50B0VBTSX11S7XSG24M1VB9YFQA4K.token-aeusdc',
    su: 's',
    fee: '0.124251'
  });

  const [xykForm2, setXykForm2] = useState<XykForm>({
    amount: 3000,
    dx: 'SM1793C4R5PZ4NS4VQ4WMP7SKKYVH8JZEWSZ9HCCR.token-stx-v-1-2',
    dy: 'SP3Y2ZSH8P7D50B0VBTSX11S7XSG24M1VB9YFQA4K.token-aeusdc',
    su: 's',
    fee: '0.124251'
  });

  // 日志相关
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [logPageSize, setLogPageSize] = useState(10);

  // 格式化数值
  const formatValue = (key: string, val: any) => {
    const num = Number(val);
    if (isNaN(num)) return val;
    if (key.toLowerCase().includes('btc')) {
      return num.toFixed(8);
    }
    return num.toFixed(1);
  };

  // 获取总额数据
  const fetchSumData = async () => {
    if (isFetchingSumData) return;
    setIsFetchingSumData(true);
    const startTime = Date.now();
    try {
      const res: any = await calcsumdc({});
      const sumData = {
        sumStx: res.data ? formatValue('sumStx', res.data.sumStx) : '加载中...',
        sumUsd: res.data ? formatValue('sumUsd', res.data.sumUsd) : '加载中...',
        sumBtc: res.data ? formatValue('sumBtc', res.data.sumBtc) : '加载中...'
      };
      setSumTableData(sumData);
      
      if (res.data) {
        const { sumStx, sumUsd, sumBtc, ...rest } = res.data;
        const row: any = {};
        Object.keys(rest).forEach(key => {
          row[key] = formatValue(key, rest[key]);
        });
        setOtherTableData([row]);
        
        const columns = Object.keys(rest).map(key => ({
          prop: key,
          label: key
        }));
        setOtherTableColumnsData(columns);
      }
      
      const endTime = Date.now();
      setSumDataFetchTime(`总额数据刷新花费: ${endTime - startTime}ms`);
      setFetchError(null);
    } catch (error: any) {
      const endTime = Date.now();
      setSumDataFetchTime(`总额数据刷新失败: ${endTime - startTime}ms`);
      if (error.msg) {
        setFetchError(error.msg);
      } else if (error.response?.data?.msg) {
        setFetchError(error.response.data.msg);
      } else {
        setFetchError('数据加载失败');
      }
    } finally {
      setIsFetchingSumData(false);
    }
  };

  // 获取ABTC数据
  const fetchAbtcData = async () => {
    if (isFetchingAbtcData) return;
    setIsFetchingAbtcData(true);
    const startTime = Date.now();
    try {
      const res: any = await getAbtBtcDiff({});
      const abtcData = {
        Abtc: res.data ? formatValue('Abtc', res.data.Abtc) : '加载中...',
        Bbtc: res.data ? formatValue('Bbtc', res.data.Bbtc) : '加载中...',
        AbtcBtcDiff: res.data ? formatValue('AbtcBtcDiff', res.data.AbtcBtcDiff) : '加载中...'
      };
      setAbtcTableData(abtcData);
      
      const endTime = Date.now();
      setAbtcDataFetchTime(`ABTC数据刷新花费: ${endTime - startTime}ms`);
      setFetchError(null);
    } catch (error: any) {
      const endTime = Date.now();
      setAbtcDataFetchTime(`ABTC数据刷新失败: ${endTime - startTime}ms`);
      if (error.msg) {
        setFetchError(error.msg);
      } else if (error.response?.data?.msg) {
        setFetchError(error.response.data.msg);
      } else {
        setFetchError('数据加载失败');
      }
    } finally {
      setIsFetchingAbtcData(false);
    }
  };

  // 获取DTDH数据
  const fetchDtdhData = async () => {
    if (isFetchingDtdhData) return;
    setIsFetchingDtdhData(true);
    const startTime = Date.now();
    try {
      const res: any = await getDtdhdiff({});
      const dtdhData = {
        Dtdh: res.data ? formatValue('Dtdh', res.data.Susdt) : '加载中...',
        Hdtd: res.data ? formatValue('Hdtd', res.data.Usdh) : '加载中...',
        DtdhHdtdDiff: res.data ? formatValue('DtdhHdtdDiff', res.data.SusdtUshDiff) : '加载中...'
      };
      setDtdhTableData(dtdhData);
      
      const endTime = Date.now();
      setDtdhDataFetchTime(`DTDH数据刷新花费: ${endTime - startTime}ms`);
      setFetchError(null);
    } catch (error: any) {
      const endTime = Date.now();
      setDtdhDataFetchTime(`DTDH数据刷新失败: ${endTime - startTime}ms`);
      if (error.msg) {
        setFetchError(error.msg);
      } else if (error.response?.data?.msg) {
        setFetchError(error.response.data.msg);
      } else {
        setFetchError('数据加载失败');
      }
    } finally {
      setIsFetchingDtdhData(false);
    }
  };

  // 设置自动刷新
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    if (autoRefresh) {
      intervalId = setInterval(() => {
        fetchSumData();
      }, 6000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [autoRefresh]);

  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    if (autoRefresh2) {
      intervalId = setInterval(() => {
        fetchAbtcData();
      }, 6000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [autoRefresh2]);

  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    if (autoRefresh3) {
      intervalId = setInterval(() => {
        fetchDtdhData();
      }, 6000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [autoRefresh3]);

  // 组件挂载时获取初始数据
  useEffect(() => {
    fetchSumData();
    fetchAbtcData();
    fetchDtdhData();
  }, []);

  // XYK自动卖出
  const callXykAutoSell = async () => {
    try {
      const params = {
        amount: xykForm1.amount,
        dx: xykForm1.dx,
        dy: xykForm1.dy,
        su: 's',
        fee: xykForm1.fee
      };
      const res = await xykAutoSellApi(params);
      console.log('xykAutoSell response:', res);
      message.success('卖出操作已提交');
    } catch (error: any) {
      console.error('xykAutoSell error:', error);
      message.error('卖出操作失败: ' + (error.message || '未知错误'));
    }
  };

  // XYK自动买入
  const callXykAutoBuy = async () => {
    try {
      const params = {
        amount: xykForm2.amount,
        dx: xykForm2.dx,
        dy: xykForm2.dy,
        su: 'b',
        fee: xykForm2.fee
      };
      const res = await xykAutoBuyApi(params);
      console.log('xykAutoBuy response:', res);
      message.success('买入操作已提交');
    } catch (error: any) {
      console.error('xykAutoBuy error:', error);
      message.error('买入操作失败: ' + (error.message || '未知错误'));
    }
  };

  // 切换显示其他数据
  const toggleOtherData = () => {
    setShowOtherData(!showOtherData);
  };

  // 合并表格数据
  const sumTable = {
    ...sumTableData,
    ...(showOtherData ? otherTableData[0] || {} : {})
  };

  const abtcTable = abtcTableData || {
    Abtc: '加载中...',
    Bbtc: '加载中...',
    AbtcBtcDiff: '加载中...'
  };

  const dtdhTable = dtdhTableData || {
    Dtdh: '加载中...',
    Hdtd: '加载中...',
    DtdhHdtdDiff: '加载中...'
  };

  // 分页日志
  const paginatedLogs = logs.slice(0, logPageSize);

  return (
    <div className="app-container" style={{ padding: '20px' }}>
      {/* 日志显示区域 */}
      <Title level={2} style={{ marginTop: 40 }}>实时交易日志</Title>
      <div style={{ 
        marginBottom: 10, 
        padding: 10, 
        backgroundColor: '#fff',
        borderRadius: 8,
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <small>日志推送地址：http://192.168.31.100:11000/logs</small>
        <span style={{ marginLeft: 20 }}>
          每页显示条数:
          <Select 
            value={logPageSize} 
            onChange={setLogPageSize} 
            size="small" 
            style={{ width: 80, marginLeft: 10 }}
          >
            <Option value={3}>3</Option>
            <Option value={5}>5</Option>
            <Option value={10}>10</Option>
            <Option value={50}>50</Option>
            <Option value={100}>100</Option>
          </Select>
        </span>
      </div>
      
      <div style={{ 
        maxHeight: '60vh', 
        overflowY: 'auto', 
        padding: 20, 
        backgroundColor: '#fff',
        borderRadius: 8,
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        marginBottom: 20
      }}>
        {paginatedLogs.map((log) => (
          <div 
            key={log._uid} 
            style={{ 
              padding: '10px 0', 
              borderBottom: '1px solid #eee',
              backgroundColor: log.type === 'connection' ? '#f8f9fa' : 'transparent',
              opacity: log.type === 'connection' ? 0.8 : 1
            }}
          >
            <span style={{ color: '#666', fontSize: '0.9em', marginRight: 10 }}>
              {log.timestamp}
            </span>
            <span 
              style={{ 
                fontSize: '1em', 
                fontWeight: 'bold',
                color: log.type === 'trade' ? '#2c3e50' : log.type === 'connection' ? '#42b983' : '#333'
              }}
            >
              {log.message}
              {log.type === 'trade' && log.txidShort && (
                <span 
                  style={{ 
                    display: 'inline-block',
                    padding: '2px 6px',
                    borderRadius: 4,
                    backgroundColor: '#f8f9fa',
                    marginLeft: 10,
                    cursor: 'pointer'
                  }}
                  onClick={() => {
                    const newLogs = [...logs];
                    const realIdx = newLogs.findIndex(item => item._uid === log._uid);
                    if (realIdx !== -1) {
                      newLogs[realIdx].expanded = !newLogs[realIdx].expanded;
                      setLogs(newLogs);
                    }
                  }}
                >
                  {log.expanded ? log.fullTxid : log.txidShort}
                  {!log.expanded && ' (点击查看完整ID)'}
                </span>
              )}
            </span>
          </div>
        ))}
      </div>

      {/* 总额数据表格 */}
      <Card style={{ marginBottom: 20 }}>
        <Table
          dataSource={sumTableData ? [sumTable] : []}
          pagination={false}
          bordered
          showHeader={true}
        >
          <Table.Column
            title="操作"
            key="actions"
            width={350}
            render={() => (
              <div>
                <Space>
                  <Switch
                    checked={autoRefresh}
                    onChange={setAutoRefresh}
                    checkedChildren="自动刷新"
                  />
                  <Button
                    icon={<ReloadOutlined />}
                    onClick={fetchSumData}
                    loading={isFetchingSumData}
                  />
                  <Button
                    onClick={toggleOtherData}
                    loading={isFetchingSumData}
                  >
                    {showOtherData ? '隐藏扩展' : '显示扩展'}
                  </Button>
                </Space>
                <div style={{ marginTop: 10, fontSize: '12px', color: '#666' }}>
                  {sumDataFetchTime}
                </div>
              </div>
            )}
          />
          <Table.Column
            title="sumStx"
            dataIndex="sumStx"
            key="sumStx"
            align="center"
          />
          <Table.Column
            title="sumUsd"
            dataIndex="sumUsd"
            key="sumUsd"
            align="center"
          />
          <Table.Column
            title="sumBtc"
            dataIndex="sumBtc"
            key="sumBtc"
            align="center"
          />
          {showOtherData && otherTableColumnsData.map(col => (
            <Table.Column
              key={col.prop}
              title={col.label}
              dataIndex={col.prop}
              align="center"
            />
          ))}
        </Table>
      </Card>

      {/* ABTC数据表格 */}
      <Card style={{ marginBottom: 20 }}>
        <Table
          dataSource={[abtcTable]}
          pagination={false}
          bordered
          showHeader={true}
        >
          <Table.Column
            title="操作"
            key="actions"
            width={350}
            render={() => (
              <div>
                <Space>
                  <Switch
                    checked={autoRefresh2}
                    onChange={setAutoRefresh2}
                    checkedChildren="自动刷新"
                  />
                  <Button
                    icon={<ReloadOutlined />}
                    onClick={fetchAbtcData}
                    loading={isFetchingAbtcData}
                  />
                </Space>
                <div style={{ marginTop: 10, fontSize: '12px', color: '#666' }}>
                  {abtcDataFetchTime}
                </div>
              </div>
            )}
          />
          <Table.Column
            title="Abtc"
            dataIndex="Abtc"
            key="Abtc"
            align="center"
          />
          <Table.Column
            title="Bbtc"
            dataIndex="Bbtc"
            key="Bbtc"
            align="center"
          />
          <Table.Column
            title="AbtcBtcDiff"
            dataIndex="AbtcBtcDiff"
            key="AbtcBtcDiff"
            align="center"
          />
        </Table>
      </Card>

      {/* DTDH数据表格 */}
      <Card style={{ marginBottom: 20 }}>
        <Table
          dataSource={[dtdhTable]}
          pagination={false}
          bordered
          showHeader={true}
        >
          <Table.Column
            title="操作"
            key="actions"
            width={350}
            render={() => (
              <div>
                <Space>
                  <Switch
                    checked={autoRefresh3}
                    onChange={setAutoRefresh3}
                    checkedChildren="自动刷新"
                  />
                  <Button
                    icon={<ReloadOutlined />}
                    onClick={fetchDtdhData}
                    loading={isFetchingDtdhData}
                  />
                  <Button type="primary" size="small" onClick={fetchDtdhData}>
                    刷新DTDH数据
                  </Button>
                </Space>
                <div style={{ marginTop: 10, fontSize: '12px', color: '#666' }}>
                  {dtdhDataFetchTime}
                </div>
              </div>
            )}
          />
          <Table.Column
            title="Dtdh"
            dataIndex="Dtdh"
            key="Dtdh"
            align="center"
          />
          <Table.Column
            title="Hdtd"
            dataIndex="Hdtd"
            key="Hdtd"
            align="center"
          />
          <Table.Column
            title="DtdhHdtdDiff"
            dataIndex="DtdhHdtdDiff"
            key="DtdhHdtdDiff"
            align="center"
          />
        </Table>
      </Card>

      {/* XYK自动交易表格 */}
      <Title level={2}>XYK Auto Sell</Title>
      <Card>
        <Table
          dataSource={[xykForm1, xykForm2]}
          pagination={false}
          bordered
        >
          <Table.Column
            title="金额"
            key="amount"
            render={(_, record: any, index) => (
              <Select
                value={record.amount}
                onChange={(value) => {
                  if (index === 0) {
                    setXykForm1(prev => ({ ...prev, amount: value }));
                  } else {
                    setXykForm2(prev => ({ ...prev, amount: value }));
                  }
                }}
                style={{ width: '100%' }}
                size="small"
              >
                <Option value={1000}>1000</Option>
                <Option value={2000}>2000</Option>
                <Option value={3000}>3000</Option>
              </Select>
            )}
          />
          <Table.Column
            title="DX"
            key="dx"
            render={(_, record: any, index) => (
              <Input
                value={record.dx}
                onChange={(e) => {
                  if (index === 0) {
                    setXykForm1(prev => ({ ...prev, dx: e.target.value }));
                  } else {
                    setXykForm2(prev => ({ ...prev, dx: e.target.value }));
                  }
                }}
                size="small"
              />
            )}
          />
          <Table.Column
            title="DY"
            key="dy"
            render={(_, record: any, index) => (
              <Input
                value={record.dy}
                onChange={(e) => {
                  if (index === 0) {
                    setXykForm1(prev => ({ ...prev, dy: e.target.value }));
                  } else {
                    setXykForm2(prev => ({ ...prev, dy: e.target.value }));
                  }
                }}
                size="small"
              />
            )}
          />
          <Table.Column
            title="费率"
            key="fee"
            render={(_, record: any, index) => (
              <Select
                value={record.fee}
                onChange={(value) => {
                  if (index === 0) {
                    setXykForm1(prev => ({ ...prev, fee: value }));
                  } else {
                    setXykForm2(prev => ({ ...prev, fee: value }));
                  }
                }}
                style={{ width: '100%' }}
                size="small"
              >
                <Option value={1.15}>1.15</Option>
                <Option value={2.11}>2.11</Option>
                <Option value={5.1}>5.1</Option>
              </Select>
            )}
          />
          <Table.Column
            title="方向"
            key="direction"
            width={80}
            align="center"
            render={(_, _record: any, index) => (
              <Tag color={index === 0 ? 'success' : 'warning'}>
                {index === 0 ? 'S' : 'B'}
              </Tag>
            )}
          />
          <Table.Column
            title="操作"
            key="action"
            width={120}
            align="center"
            render={(_, _record: any, index) => (
              <Button 
                type="primary" 
                size="small" 
                onClick={index === 0 ? callXykAutoSell : callXykAutoBuy}
              >
                {index === 0 ? '卖出' : '买入'}
              </Button>
            )}
          />
        </Table>
      </Card>

      {fetchError && (
        <Card style={{ marginTop: 20 }}>
          <div style={{ color: '#ff4d4f' }}>
            错误: {fetchError}
          </div>
        </Card>
      )}
    </div>
  );
};

export default StacksAlex;