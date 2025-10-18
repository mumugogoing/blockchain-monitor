import React from 'react';
import { Layout, Menu, Button, Space, Typography } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  LogoutOutlined, 
  DashboardOutlined,
  UserOutlined,
  SettingOutlined
} from '@ant-design/icons';
import authService from '@/services/auth';

const { Header, Content } = Layout;
const { Text } = Typography;

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = authService.getCurrentUser();

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  // 根据用户角色生成菜单项
  const getMenuItems = () => {
    const items = [];
    
    if (user?.role === 'super' || user?.role === 'stx') {
      items.push({
        key: '/stacks-dev',
        icon: <DashboardOutlined />,
        label: 'STX 实时监控',
      });
      items.push({
        key: '/cex-arbitrage',
        icon: <DashboardOutlined />,
        label: 'CEX 套利监控',
      });
    }
    
    if (user?.role === 'super' || user?.role === 'stark') {
      items.push({
        key: '/starknet',
        icon: <DashboardOutlined />,
        label: 'Starknet 监控',
      });
    }
    
    // 所有用户都可以访问设置
    items.push({
      key: '/settings',
      icon: <SettingOutlined />,
      label: '设置',
    });
    
    return items;
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        background: '#001529',
        padding: '0 24px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <div style={{ color: 'white', fontSize: '18px', fontWeight: 'bold' }}>
            区块链监控系统
          </div>
          <Menu
            theme="dark"
            mode="horizontal"
            selectedKeys={[location.pathname]}
            items={getMenuItems()}
            onClick={({ key }) => navigate(key)}
            style={{ flex: 1, minWidth: 0, background: 'transparent' }}
          />
        </div>
        
        <Space>
          <Space>
            <UserOutlined style={{ color: 'white' }} />
            <Text style={{ color: 'white' }}>
              {user?.username} ({user?.role === 'super' ? '管理员' : user?.role === 'stx' ? 'STX' : 'Starknet'})
            </Text>
          </Space>
          <Button 
            type="text" 
            icon={<LogoutOutlined />}
            onClick={handleLogout}
            style={{ color: 'white' }}
          >
            登出
          </Button>
        </Space>
      </Header>
      
      <Content style={{ padding: '24px', background: '#f0f2f5' }}>
        {children}
      </Content>
    </Layout>
  );
};

export default AppLayout;
