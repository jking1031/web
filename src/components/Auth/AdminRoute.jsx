import React, { useEffect, useRef } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Spin, Result, Button } from 'antd';

/**
 * 管理员保护路由组件，确保只有管理员才能访问
 * @param {Object} props - 组件属性
 * @param {React.ReactNode} props.children - 子组件
 * @returns {JSX.Element} 渲染的组件
 */
const AdminRoute = ({ children }) => {
  const { isLoggedIn, loading, isAdmin, checkAdminStatus } = useAuth();
  const location = useLocation();

  // 使用useRef创建一个在渲染之间持久存在的引用
  const hasCheckedRef = useRef(false);

  // 组件挂载时检查管理员状态，但只在首次渲染时执行
  useEffect(() => {
    // 只有在未检查过且用户已登录的情况下才检查
    if (isLoggedIn && !loading && !hasCheckedRef.current) {
      // 标记为已检查，防止重复调用
      hasCheckedRef.current = true;

      // 检查管理员状态
      checkAdminStatus();
    }
  }, [isLoggedIn, loading]);

  // 如果正在加载，显示加载中
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: '#f0f2f5'
      }}>
        <Spin size="large" tip="加载中..." />
      </div>
    );
  }

  // 如果未登录，重定向到登录页面
  if (!isLoggedIn) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 如果已登录但不是管理员，显示无权限页面
  if (!isAdmin) {
    return (
      <Result
        status="403"
        title="无权限"
        subTitle="抱歉，您没有访问此页面的权限。"
        extra={
          <Button type="primary" onClick={() => window.history.back()}>
            返回
          </Button>
        }
      />
    );
  }

  // 如果已登录且是管理员，渲染子组件
  return children;
};

export default AdminRoute;
