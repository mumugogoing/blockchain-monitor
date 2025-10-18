import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import Login from './components/Login';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './components/AppLayout';
import StxDevMonitor from './views/stacks/StackDev';
import StarknetMonitor from './views/StarknetMonitor';
import CexArbitrage from './views/CexArbitrage';
import Settings from './views/Settings';
import authService from './services/auth';

const App: React.FC = () => {
  return (
    <ConfigProvider locale={zhCN}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route
            path="/stacks-dev"
            element={
              <ProtectedRoute requiredRole={['super', 'stx']}>
                <AppLayout>
                  <StxDevMonitor />
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
            path="/cex-arbitrage"
            element={
              <ProtectedRoute requiredRole={['super', 'stx']}>
                <AppLayout>
                  <CexArbitrage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/settings"
            element={
              <ProtectedRoute requiredRole={['super', 'stx', 'stark']}>
                <AppLayout>
                  <Settings />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/"
            element={
              authService.isAuthenticated() ? (
                <Navigate to="/stacks-dev" replace />
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
