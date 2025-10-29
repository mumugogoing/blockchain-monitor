import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Form, 
  Input, 
  Button, 
  Space, 
  Typography, 
  Switch, 
  message, 
  Collapse, 
  Alert,
  Divider,
  Tag,
  Modal
} from 'antd';
import { 
  KeyOutlined, 
  SaveOutlined, 
  DeleteOutlined, 
  EyeInvisibleOutlined, 
  EyeOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  LockOutlined
} from '@ant-design/icons';
import settingsService, { type ExchangeCredentials, type ApiResponse, DEFAULT_BASE_URLS } from '@/services/settings';

const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;

// 交易所信息
const EXCHANGES = [
  { key: 'binance', name: '币安 (Binance)', color: '#F0B90B' },
  { key: 'okx', name: 'OKX', color: '#000000' },
  { key: 'gate', name: 'Gate.io', color: '#2354E6' },
  { key: 'bybit', name: 'Bybit', color: '#F7A600' },
  { key: 'bitget', name: 'Bitget', color: '#00D9D9' },
  { key: 'huobi', name: '火币 (Huobi)', color: '#2B4AFF' },
  { key: 'mexc', name: 'MEXC', color: '#00B897' },
];

interface ExchangeFormProps {
  exchangeKey: string;
  exchangeName: string;
  exchangeColor: string;
}

const ExchangeForm: React.FC<ExchangeFormProps> = ({ exchangeKey, exchangeName, exchangeColor }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [hasCredentials, setHasCredentials] = useState(false);
  const [lastResponse, setLastResponse] = useState<ApiResponse | null>(null);

  useEffect(() => {
    loadCredentials();
  }, [exchangeKey]);

  const loadCredentials = async () => {
    try {
      const credentials = await settingsService.getExchangeCredentials(exchangeKey);
      if (credentials) {
        form.setFieldsValue({
          apiKey: credentials.apiKey,
          secretKey: credentials.secretKey,
          baseURL: credentials.baseURL || DEFAULT_BASE_URLS[exchangeKey],
          enabled: credentials.enabled,
        });
        setHasCredentials(true);
      } else {
        form.setFieldsValue({
          baseURL: DEFAULT_BASE_URLS[exchangeKey],
          enabled: false,
        });
        setHasCredentials(false);
      }
    } catch (error) {
      console.error('加载配置失败:', error);
    }
  };

  const handleSave = async (values: any) => {
    setLoading(true);
    setLastResponse(null);
    try {
      const credentials: ExchangeCredentials = {
        apiKey: values.apiKey || '',
        secretKey: values.secretKey || '',
        baseURL: values.baseURL || DEFAULT_BASE_URLS[exchangeKey],
        enabled: values.enabled || false,
      };

      // 基本验证
      if (credentials.apiKey && !settingsService.validateApiKey(credentials.apiKey)) {
        message.warning('API Key 格式可能不正确');
      }
      if (credentials.secretKey && !settingsService.validateSecretKey(credentials.secretKey)) {
        message.warning('Secret Key 格式可能不正确');
      }

      const response = await settingsService.updateExchangeCredentials(exchangeKey, credentials);
      setLastResponse(response);
      
      if (response.success) {
        message.success(response.message);
        setHasCredentials(true);
      } else {
        message.error(response.message);
      }
    } catch (error) {
      const errorResponse: ApiResponse = {
        success: false,
        message: '保存失败: ' + (error as Error).message,
        timestamp: new Date().toISOString(),
      };
      setLastResponse(errorResponse);
      message.error(errorResponse.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除 ${exchangeName} 的配置吗？此操作不可恢复。`,
      onOk: async () => {
        setLastResponse(null);
        try {
          const response = await settingsService.deleteExchangeCredentials(exchangeKey);
          setLastResponse(response);
          
          if (response.success) {
            form.resetFields();
            form.setFieldsValue({ baseURL: DEFAULT_BASE_URLS[exchangeKey] });
            message.success(response.message);
            setHasCredentials(false);
          } else {
            message.error(response.message);
          }
        } catch (error) {
          const errorResponse: ApiResponse = {
            success: false,
            message: '删除失败: ' + (error as Error).message,
            timestamp: new Date().toISOString(),
          };
          setLastResponse(errorResponse);
          message.error(errorResponse.message);
        }
      },
    });
  };

  return (
    <Card 
      size="small" 
      title={
        <Space>
          <Tag color={exchangeColor}>{exchangeName}</Tag>
          {hasCredentials && <CheckCircleOutlined style={{ color: '#52c41a' }} />}
        </Space>
      }
      extra={
        hasCredentials && (
          <Button 
            danger 
            size="small" 
            icon={<DeleteOutlined />}
            onClick={handleDelete}
          >
            删除配置
          </Button>
        )
      }
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSave}
      >
        <Form.Item
          label="API Key"
          name="apiKey"
          rules={[{ required: false, message: '请输入 API Key' }]}
        >
          <Input.Password
            placeholder="输入您的 API Key"
            prefix={<KeyOutlined />}
            iconRender={(visible) => 
              visible ? <EyeOutlined onClick={() => setShowApiKey(!showApiKey)} /> : 
              <EyeInvisibleOutlined onClick={() => setShowApiKey(!showApiKey)} />
            }
          />
        </Form.Item>

        <Form.Item
          label="Secret Key"
          name="secretKey"
          rules={[{ required: false, message: '请输入 Secret Key' }]}
        >
          <Input.Password
            placeholder="输入您的 Secret Key"
            prefix={<LockOutlined />}
            iconRender={(visible) => 
              visible ? <EyeOutlined onClick={() => setShowSecretKey(!showSecretKey)} /> : 
              <EyeInvisibleOutlined onClick={() => setShowSecretKey(!showSecretKey)} />
            }
          />
        </Form.Item>

        <Form.Item
          label="Base URL"
          name="baseURL"
          tooltip="默认使用标准 API 地址，如有自定义需求可修改"
        >
          <Input placeholder="https://api.example.com" />
        </Form.Item>

        <Form.Item
          label="启用此交易所"
          name="enabled"
          valuePropName="checked"
        >
          <Switch checkedChildren="启用" unCheckedChildren="禁用" />
        </Form.Item>

        <Form.Item>
          <Button 
            type="primary" 
            htmlType="submit" 
            icon={<SaveOutlined />}
            loading={loading}
            block
          >
            保存配置
          </Button>
        </Form.Item>
      </Form>

      {/* 显示后端响应信息 */}
      {lastResponse && (
        <Alert
          style={{ marginTop: 16 }}
          message="操作结果"
          description={
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text strong>状态: {lastResponse.success ? '成功' : '失败'}</Text>
              <Text>消息: {lastResponse.message}</Text>
              <Text type="secondary">时间: {new Date(lastResponse.timestamp).toLocaleString('zh-CN')}</Text>
              {lastResponse.data && (
                <div>
                  <Text strong>返回数据:</Text>
                  <pre style={{ 
                    background: '#f5f5f5', 
                    padding: '8px', 
                    borderRadius: '4px',
                    marginTop: '8px',
                    fontSize: '12px'
                  }}>
                    {JSON.stringify(lastResponse.data, null, 2)}
                  </pre>
                </div>
              )}
            </Space>
          }
          type={lastResponse.success ? 'success' : 'error'}
          closable
          onClose={() => setLastResponse(null)}
        />
      )}
    </Card>
  );
};

const Settings: React.FC = () => {
  const handleClearAll = () => {
    Modal.confirm({
      title: '确认清除',
      content: '确定要清除所有交易所配置吗？此操作不可恢复。',
      onOk: () => {
        settingsService.clearAllSettings();
        message.success('所有配置已清除');
        window.location.reload();
      },
    });
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div>
            <Title level={2}>
              <KeyOutlined /> 交易所 API 配置
            </Title>
            <Paragraph type="secondary">
              在这里配置各个交易所的 API Key 和 Secret Key，用于一键套利交易功能。
            </Paragraph>
          </div>

          {/* 安全提示 */}
          <Alert
            message="安全提示"
            description={
              <Space direction="vertical" size="small">
                <Text>• 您的 API Key 和 Secret Key 将使用 AES-256-GCM 加密算法加密后存储在浏览器本地</Text>
                <Text>• 每个用户的配置相互独立，使用不同的加密密钥</Text>
                <Text>• 强烈建议只开启 API Key 的交易权限，不要开启提现权限</Text>
                <Text>• 定期更换您的 API Key 以提高安全性</Text>
                <Text>• 在公共电脑上使用后，请及时清除配置或退出登录</Text>
                <Text type="danger" strong>• 前端存储无法提供银行级别的安全保护，请谨慎使用</Text>
              </Space>
            }
            type="warning"
            showIcon
            icon={<WarningOutlined />}
          />

          {/* 使用说明 */}
          <Alert
            message="如何获取 API Key"
            description={
              <Space direction="vertical" size="small">
                <Text>1. 登录对应的交易所网站</Text>
                <Text>2. 进入账户设置 → API 管理</Text>
                <Text>3. 创建新的 API Key，只开启"现货交易"权限</Text>
                <Text>4. 复制 API Key 和 Secret Key 到下方表单</Text>
                <Text>5. 保存后即可在套利监控页面使用一键交易功能</Text>
              </Space>
            }
            type="info"
            showIcon
          />

          <Divider />

          {/* 交易所配置表单 */}
          <Collapse 
            defaultActiveKey={['binance']} 
            accordion
          >
            {EXCHANGES.map(exchange => (
              <Panel 
                header={exchange.name} 
                key={exchange.key}
              >
                <ExchangeForm 
                  exchangeKey={exchange.key}
                  exchangeName={exchange.name}
                  exchangeColor={exchange.color}
                />
              </Panel>
            ))}
          </Collapse>

          <Divider />

          {/* 危险操作 */}
          <Card 
            size="small" 
            title={
              <Text type="danger">
                <WarningOutlined /> 危险操作
              </Text>
            }
          >
            <Space>
              <Button 
                danger 
                icon={<DeleteOutlined />}
                onClick={handleClearAll}
              >
                清除所有配置
              </Button>
              <Text type="secondary">
                此操作将删除所有交易所的配置信息
              </Text>
            </Space>
          </Card>

          {/* 技术说明 */}
          <Card size="small" title="技术说明">
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <Text type="secondary">
                <strong>加密方式：</strong>AES-256-GCM（Web Crypto API）
              </Text>
              <Text type="secondary">
                <strong>密钥推导：</strong>PBKDF2 (100,000 次迭代)
              </Text>
              <Text type="secondary">
                <strong>存储位置：</strong>浏览器 LocalStorage（加密后）
              </Text>
              <Text type="secondary">
                <strong>隔离级别：</strong>用户级别隔离，不同用户使用不同密钥
              </Text>
            </Space>
          </Card>
        </Space>
      </Card>
    </div>
  );
};

export default Settings;
