import React from 'react';
import { Result, Button } from 'antd';
import { useAuth } from '../../context/AuthContext';

/**
 * 管理员权限检查组件
 * 用于在组件内部检查管理员权限，非管理员显示无权限提示
 * 
 * @param {Object} props - 组件属性
 * @param {React.ReactNode} props.children - 子组件，只有管理员才能看到
 * @param {React.ReactNode} props.fallback - 可选，非管理员显示的内容，默认为无权限提示
 * @param {boolean} props.silent - 可选，是否静默处理（不显示无权限提示，直接不渲染内容）
 * @returns {JSX.Element} 渲染的组件
 */
const AdminCheck = ({ children, fallback, silent = false }) => {
  const { isAdmin } = useAuth();

  // 如果是管理员，直接渲染子组件
  if (isAdmin) {
    return children;
  }

  // 如果提供了自定义的fallback内容，则显示fallback
  if (fallback) {
    return fallback;
  }

  // 如果是静默模式，则不渲染任何内容
  if (silent) {
    return null;
  }

  // 默认显示无权限提示
  return (
    <Result
      status="403"
      title="无权限"
      subTitle="抱歉，您没有访问此功能的权限。"
      extra={
        <Button type="primary" onClick={() => window.history.back()}>
          返回
        </Button>
      }
    />
  );
};

export default AdminCheck;
