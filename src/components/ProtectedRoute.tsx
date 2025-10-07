import React from 'react';
import { Navigate } from 'react-router-dom';
import authService, { UserRole } from '@/services/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole | UserRole[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  const isAuthenticated = authService.isAuthenticated();
  
  // 如果未登录，重定向到登录页
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  // 如果需要特定角色且用户没有权限，显示无权限页面
  if (requiredRole && !authService.hasAccess(requiredRole)) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <h1>403 - 无权限访问</h1>
        <p>您没有权限访问此页面</p>
      </div>
    );
  }
  
  return <>{children}</>;
};

export default ProtectedRoute;
