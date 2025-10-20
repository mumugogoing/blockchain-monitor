import React, { useState } from 'react';
import {
  Modal,
  Card,
  Descriptions,
  Button,
  Space,
  Tag,
  InputNumber,
  Select,
  Form,
  message,
  Alert,
  Divider,
  Typography,
} from 'antd';
import {
  ThunderboltOutlined,
  WarningOutlined,
  RocketOutlined,
} from '@ant-design/icons';

const { Text } = Typography;
const { Option } = Select;

export interface FrontRunTransaction {
  txId: string;
  address: string;
  addressLabel: string;
  platform: string;
  swapInfo: string;
  timestamp: string;
  fee: string;
}

interface FrontRunActionPanelProps {
  visible: boolean;
  transaction: FrontRunTransaction | null;
  onClose: () => void;
  onExecute?: (params: FrontRunParams) => Promise<void>;
}

export interface FrontRunParams {
  action: 'same' | 'opposite' | 'custom';
  multiplier: number;
  customAmount?: number;
  slippage: number;
  priority: 'low' | 'medium' | 'high' | 'ultra';
}

const FrontRunActionPanel: React.FC<FrontRunActionPanelProps> = ({
  visible,
  transaction,
  onClose,
  onExecute,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [action, setAction] = useState<'same' | 'opposite' | 'custom'>('same');

  const handleExecute = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const params: FrontRunParams = {
        action: values.action,
        multiplier: values.multiplier || 1,
        customAmount: values.customAmount,
        slippage: values.slippage,
        priority: values.priority,
      };

      if (onExecute) {
        await onExecute(params);
      } else {
        // 模拟执行
        await new Promise(resolve => setTimeout(resolve, 1500));
        message.success('抢先交易已提交！正在等待执行...');
      }

      onClose();
    } catch (error: any) {
      message.error(error.message || '执行失败');
    } finally {
      setLoading(false);
    }
  };

  const getPriorityFeeMultiplier = (priority: string): number => {
    const multipliers = {
      low: 1.2,
      medium: 1.5,
      high: 2.0,
      ultra: 3.0,
    };
    return multipliers[priority as keyof typeof multipliers] || 1.5;
  };

  const calculateEstimatedFee = (): string => {
    if (!transaction) return '0';
    const baseFee = parseFloat(transaction.fee);
    const priority = form.getFieldValue('priority') || 'medium';
    const multiplier = getPriorityFeeMultiplier(priority);
    return (baseFee * multiplier).toFixed(6);
  };

  return (
    <Modal
      title={
        <Space>
          <ThunderboltOutlined style={{ color: '#ff4d4f' }} />
          <Text strong style={{ color: '#ff4d4f' }}>订单压制 / 抢先交易</Text>
        </Space>
      }
      open={visible}
      onCancel={onClose}
      width={700}
      footer={[
        <Button key="cancel" onClick={onClose}>
          取消
        </Button>,
        <Button
          key="execute"
          type="primary"
          danger
          icon={<RocketOutlined />}
          loading={loading}
          onClick={handleExecute}
        >
          立即执行抢先交易
        </Button>,
      ]}
    >
      {transaction && (
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          {/* 警告提示 */}
          <Alert
            message="高风险操作警告"
            description="抢先交易是一种高风险操作，可能导致资金损失。请确保您了解相关风险并谨慎操作。"
            type="warning"
            showIcon
            icon={<WarningOutlined />}
          />

          {/* 目标交易信息 */}
          <Card title="目标交易信息" size="small">
            <Descriptions column={1} size="small">
              <Descriptions.Item label="监控地址">
                <Space>
                  <Tag color="red">{transaction.addressLabel}</Tag>
                  <Text copyable={{ text: transaction.address }} code>
                    {transaction.address.slice(0, 10)}...{transaction.address.slice(-8)}
                  </Text>
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="交易平台">
                <Tag color="purple">{transaction.platform}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="交易信息">
                <Text strong style={{ color: '#1890ff' }}>
                  {transaction.swapInfo}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="交易时间">
                {transaction.timestamp}
              </Descriptions.Item>
              <Descriptions.Item label="手续费">
                {transaction.fee} STX
              </Descriptions.Item>
            </Descriptions>
          </Card>

          <Divider>抢先交易配置</Divider>

          {/* 配置表单 */}
          <Form
            form={form}
            layout="vertical"
            initialValues={{
              action: 'same',
              multiplier: 1,
              slippage: 0.5,
              priority: 'high',
            }}
          >
            <Form.Item
              name="action"
              label="交易策略"
              rules={[{ required: true }]}
            >
              <Select onChange={setAction}>
                <Option value="same">
                  <Space>
                    <Tag color="green">跟单</Tag>
                    执行相同方向的交易（抢在前面）
                  </Space>
                </Option>
                <Option value="opposite">
                  <Space>
                    <Tag color="orange">反向</Tag>
                    执行相反方向的交易（对冲）
                  </Space>
                </Option>
                <Option value="custom">
                  <Space>
                    <Tag color="blue">自定义</Tag>
                    自定义交易金额和方向
                  </Space>
                </Option>
              </Select>
            </Form.Item>

            {action !== 'custom' && (
              <Form.Item
                name="multiplier"
                label="交易倍数"
                tooltip="相对于目标交易的倍数，例如 2 表示交易量是目标的 2 倍"
                rules={[{ required: true }]}
              >
                <InputNumber
                  min={0.1}
                  max={10}
                  step={0.1}
                  style={{ width: '100%' }}
                  addonAfter="倍"
                />
              </Form.Item>
            )}

            {action === 'custom' && (
              <Form.Item
                name="customAmount"
                label="自定义金额"
                rules={[{ required: true, message: '请输入交易金额' }]}
              >
                <InputNumber
                  min={0}
                  style={{ width: '100%' }}
                  placeholder="输入交易金额"
                  addonAfter="STX"
                />
              </Form.Item>
            )}

            <Form.Item
              name="slippage"
              label="滑点容忍度"
              tooltip="允许的最大价格滑点百分比"
              rules={[{ required: true }]}
            >
              <InputNumber
                min={0.1}
                max={10}
                step={0.1}
                style={{ width: '100%' }}
                addonAfter="%"
              />
            </Form.Item>

            <Form.Item
              name="priority"
              label="优先级"
              tooltip="更高的优先级意味着更高的手续费，但更可能抢先成交"
              rules={[{ required: true }]}
            >
              <Select>
                <Option value="low">
                  <Space>
                    <Tag color="default">低</Tag>
                    手续费 1.2x
                  </Space>
                </Option>
                <Option value="medium">
                  <Space>
                    <Tag color="blue">中</Tag>
                    手续费 1.5x
                  </Space>
                </Option>
                <Option value="high">
                  <Space>
                    <Tag color="orange">高</Tag>
                    手续费 2.0x
                  </Space>
                </Option>
                <Option value="ultra">
                  <Space>
                    <Tag color="red">极高</Tag>
                    手续费 3.0x
                  </Space>
                </Option>
              </Select>
            </Form.Item>
          </Form>

          {/* 预估信息 */}
          <Card title="预估信息" size="small">
            <Descriptions column={2} size="small">
              <Descriptions.Item label="预估手续费">
                <Text strong>{calculateEstimatedFee()} STX</Text>
              </Descriptions.Item>
              <Descriptions.Item label="执行时间">
                <Text type="secondary">约 5-10 秒</Text>
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {/* 风险提示 */}
          <Alert
            message="执行前请再次确认"
            description={
              <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
                <li>确保您的钱包有足够的余额支付交易和手续费</li>
                <li>抢先交易不保证一定成功，可能因网络延迟等原因失败</li>
                <li>市场波动可能导致实际成交价格与预期不符</li>
                <li>请谨慎设置交易金额，避免过度投入</li>
              </ul>
            }
            type="info"
            showIcon
          />
        </Space>
      )}
    </Modal>
  );
};

export default FrontRunActionPanel;
