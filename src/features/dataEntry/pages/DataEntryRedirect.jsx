import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Spin } from 'antd';

/**
 * 数据填报中心重定向组件
 * 由于旧的数据填报中心已删除，此组件会自动将用户重定向到新的表单列表页面
 */
const DataEntryRedirect = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // 使用短暂延迟以显示加载状态，然后重定向到表单列表页面
    const timer = setTimeout(() => {
      navigate('/forms/list', { replace: true });
    }, 1000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column',
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '80vh'
    }}>
      <Spin size="large" />
      <p style={{ marginTop: 20 }}>正在跳转到表单系统...</p>
    </div>
  );
};

export default DataEntryRedirect; 