import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import Login from './components/Login';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './components/AppLayout';
import StacksMonitor from './views/stacks';
import StarknetMonitor from './views/StarknetMonitor';
import authService from './services/auth';

const App: React.FC = () => {
  return (
    <ConfigProvider locale={zhCN}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route
            path="/stacks"
            element={
              <ProtectedRoute requiredRole={['super', 'stx']}>
                <AppLayout>
                  <StacksMonitor />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/starknet"
            element={
              <ProtectedRoute requiredRole={['super', 'stark']}>
                <AppLayout>
                  <StarknetMonitor />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/"
            element={
              authService.isAuthenticated() ? (
                <Navigate to="/stacks" replace />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  );
};

export default App;
