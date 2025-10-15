import React, { useState } from 'react';
import { Form, Input, Button, Card, message, Typography } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import authService from '@/services/auth';

const { Title, Text } = Typography;

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = (values: { username: string; password: string }) => {
    setLoading(true);
    const success = authService.login(values.username, values.password);
    
    if (success) {
      message.success('登录成功');
      const user = authService.getCurrentUser();
      
      // 根据用户角色导航到相应页面
      if (user?.role === 'super') {
        navigate('/stacks-dev');
      } else if (user?.role === 'stx') {
        navigate('/stacks-dev');
      } else if (user?.role === 'stark') {
        navigate('/starknet');
      }
    } else {
      message.error('用户名或密码错误');
    }
    
    setLoading(false);
  };

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <Card style={{ width: 400, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Title level={2}>区块链监控系统</Title>
          <Text type="secondary">Blockchain Monitor</Text>
        </div>
        
        <Form
          name="login"
          onFinish={onFinish}
          autoComplete="off"
          size="large"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input 
              prefix={<UserOutlined />} 
              placeholder="用户名" 
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="密码"
            />
          </Form.Item>

          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              block 
              loading={loading}
            >
              登录
            </Button>
          </Form.Item>
        </Form>

        <div style={{ marginTop: 16, fontSize: 12, color: '#999' }}>
          <Text type="secondary">测试账号:</Text>
          <div>super / super123 (管理员)</div>
          <div>stx / stx123 (STX监控)</div>
          <div>stark / stark123 (Starknet监控)</div>
        </div>
      </Card>
    </div>
  );
};

export default Login;
