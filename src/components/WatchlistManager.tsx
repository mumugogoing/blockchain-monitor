import React, { useState, useEffect } from 'react';
import {
  Modal,
  Table,
  Button,
  Input,
  Form,
  Space,
  Popconfirm,
  Switch,
  Tag,
  message,
  Tooltip,
  Upload,
  Typography,
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  DownloadOutlined,
  UploadOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import {
  getWatchlistAddresses,
  addWatchlistAddress,
  removeWatchlistAddress,
  updateWatchlistAddress,
  toggleWatchlistAddress,
  exportWatchlist,
  importWatchlist,
  clearWatchlist,
  type WatchlistAddress,
} from '../services/watchlist';

const { TextArea } = Input;
const { Text } = Typography;

interface WatchlistManagerProps {
  visible: boolean;
  onClose: () => void;
}

const WatchlistManager: React.FC<WatchlistManagerProps> = ({ visible, onClose }) => {
  const [addresses, setAddresses] = useState<WatchlistAddress[]>([]);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [currentAddress, setCurrentAddress] = useState<WatchlistAddress | null>(null);
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();

  // 加载地址列表
  const loadAddresses = () => {
    setAddresses(getWatchlistAddresses());
  };

  useEffect(() => {
    if (visible) {
      loadAddresses();
    }
  }, [visible]);

  // 添加地址
  const handleAdd = async () => {
    try {
      const values = await form.validateFields();
      addWatchlistAddress(values.address, values.label, values.notes);
      message.success('地址已添加到监控列表');
      form.resetFields();
      setAddModalVisible(false);
      loadAddresses();
    } catch (error: any) {
      if (error.message) {
        message.error(error.message);
      }
    }
  };

  // 删除地址
  const handleDelete = (id: string) => {
    removeWatchlistAddress(id);
    message.success('地址已从监控列表移除');
    loadAddresses();
  };

  // 切换启用状态
  const handleToggle = (id: string) => {
    toggleWatchlistAddress(id);
    loadAddresses();
  };

  // 编辑地址
  const handleEdit = (record: WatchlistAddress) => {
    setCurrentAddress(record);
    editForm.setFieldsValue({
      label: record.label,
      notes: record.notes,
    });
    setEditModalVisible(true);
  };

  // 保存编辑
  const handleSaveEdit = async () => {
    if (!currentAddress) return;
    
    try {
      const values = await editForm.validateFields();
      updateWatchlistAddress(currentAddress.id, {
        label: values.label,
        notes: values.notes,
      });
      message.success('地址信息已更新');
      setEditModalVisible(false);
      setCurrentAddress(null);
      editForm.resetFields();
      loadAddresses();
    } catch (error) {
      message.error('更新失败');
    }
  };

  // 导出列表
  const handleExport = () => {
    const data = exportWatchlist();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `watchlist_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    message.success('监控列表已导出');
  };

  // 导入列表
  const handleImport = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result as string;
        importWatchlist(data);
        message.success('监控列表已导入');
        loadAddresses();
      } catch (error: any) {
        message.error(error.message || '导入失败');
      }
    };
    reader.readAsText(file);
    return false; // 阻止自动上传
  };

  // 清空列表
  const handleClear = () => {
    clearWatchlist();
    message.success('监控列表已清空');
    loadAddresses();
  };

  const columns: ColumnsType<WatchlistAddress> = [
    {
      title: '状态',
      dataIndex: 'enabled',
      key: 'enabled',
      width: 80,
      render: (enabled: boolean, record) => (
        <Tooltip title={enabled ? '点击禁用' : '点击启用'}>
          <Switch
            checked={enabled}
            onChange={() => handleToggle(record.id)}
            checkedChildren={<EyeOutlined />}
            unCheckedChildren={<EyeInvisibleOutlined />}
          />
        </Tooltip>
      ),
    },
    {
      title: '标签',
      dataIndex: 'label',
      key: 'label',
      width: 150,
      render: (label: string, record) => (
        <Tag color={record.enabled ? 'blue' : 'default'}>{label}</Tag>
      ),
    },
    {
      title: '地址',
      dataIndex: 'address',
      key: 'address',
      ellipsis: true,
      render: (address: string) => (
        <Tooltip title={address}>
          <Text copyable={{ text: address }} style={{ fontFamily: 'monospace' }}>
            {address.length > 20 ? `${address.slice(0, 10)}...${address.slice(-8)}` : address}
          </Text>
        </Tooltip>
      ),
    },
    {
      title: '备注',
      dataIndex: 'notes',
      key: 'notes',
      ellipsis: true,
      render: (notes?: string) => (
        <Text type="secondary">{notes || '-'}</Text>
      ),
    },
    {
      title: '添加时间',
      dataIndex: 'addedAt',
      key: 'addedAt',
      width: 180,
      render: (date: string) => new Date(date).toLocaleString('zh-CN'),
    },
    {
      title: '操作',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个地址吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="删除"
            cancelText="取消"
          >
            <Button
              type="link"
              size="small"
              danger
              icon={<DeleteOutlined />}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Modal
        title="地址监控列表管理"
        open={visible}
        onCancel={onClose}
        width={1000}
        footer={null}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <Space wrap>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setAddModalVisible(true)}
            >
              添加地址
            </Button>
            <Button
              icon={<DownloadOutlined />}
              onClick={handleExport}
              disabled={addresses.length === 0}
            >
              导出列表
            </Button>
            <Upload
              accept=".json"
              showUploadList={false}
              beforeUpload={handleImport}
            >
              <Button icon={<UploadOutlined />}>导入列表</Button>
            </Upload>
            <Popconfirm
              title="确定要清空所有监控地址吗？"
              onConfirm={handleClear}
              okText="清空"
              cancelText="取消"
            >
              <Button danger disabled={addresses.length === 0}>
                清空列表
              </Button>
            </Popconfirm>
          </Space>

          <Table
            columns={columns}
            dataSource={addresses}
            rowKey="id"
            pagination={{
              pageSize: 10,
              showTotal: (total) => `共 ${total} 个监控地址`,
            }}
            size="small"
          />
        </Space>
      </Modal>

      {/* 添加地址弹窗 */}
      <Modal
        title="添加监控地址"
        open={addModalVisible}
        onCancel={() => {
          setAddModalVisible(false);
          form.resetFields();
        }}
        onOk={handleAdd}
        okText="添加"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="address"
            label="地址"
            rules={[
              { required: true, message: '请输入地址' },
              { min: 10, message: '地址长度不能少于10个字符' },
            ]}
          >
            <Input placeholder="输入要监控的地址" />
          </Form.Item>
          <Form.Item
            name="label"
            label="标签"
            rules={[{ required: true, message: '请输入标签' }]}
          >
            <Input placeholder="给地址起个名字，例如：大户A" />
          </Form.Item>
          <Form.Item name="notes" label="备注">
            <TextArea
              rows={3}
              placeholder="可选：添加备注信息"
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* 编辑地址弹窗 */}
      <Modal
        title="编辑监控地址"
        open={editModalVisible}
        onCancel={() => {
          setEditModalVisible(false);
          setCurrentAddress(null);
          editForm.resetFields();
        }}
        onOk={handleSaveEdit}
        okText="保存"
        cancelText="取消"
      >
        <Form form={editForm} layout="vertical">
          <Form.Item
            name="label"
            label="标签"
            rules={[{ required: true, message: '请输入标签' }]}
          >
            <Input placeholder="给地址起个名字" />
          </Form.Item>
          <Form.Item name="notes" label="备注">
            <TextArea
              rows={3}
              placeholder="可选：添加备注信息"
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default WatchlistManager;
