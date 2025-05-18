import React, { useEffect, useState } from 'react';
import { Admin, Resource, ListGuesser, EditGuesser, ShowGuesser, Layout } from 'react-admin';
import { Box, Typography, CircularProgress } from '@mui/material';
import simpleDataProvider from './simpleDataProvider';
import simpleAuthProvider from './simpleAuthProvider';
import EnhancedDashboard from '../../components/Dashboard/EnhancedDashboard';
import styles from './AdminDashboard.module.scss';

// 自定义空侧边栏组件
const EmptySidebar = () => <div style={{ display: 'none' }}></div>;

// 自定义空AppBar组件
const EmptyAppBar = () => <div style={{ display: 'none' }}></div>;

// 自定义布局组件，不显示侧边栏和顶部栏
const CustomLayout = (props) => <Layout {...props} sidebar={EmptySidebar} appBar={EmptyAppBar} />;

/**
 * 独立的React-Admin仪表盘页面
 */
const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('AdminDashboard: 组件挂载');

    // 设置页面标题
    document.title = '仪表盘 - 正泽物联';

    // 模拟加载过程
    const timer = setTimeout(() => {
      console.log('AdminDashboard: 加载完成');
      setLoading(false);
    }, 1000);

    return () => {
      console.log('AdminDashboard: 组件卸载');
      clearTimeout(timer);
    };
  }, []);

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <CircularProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>
          加载仪表盘...
        </Typography>
      </div>
    );
  }

  return (
    <div className={styles.adminContainer}>
      <Admin
        dataProvider={simpleDataProvider}
        authProvider={simpleAuthProvider}
        dashboard={EnhancedDashboard}
        layout={CustomLayout}
        requireAuth={false}
        disableTelemetry
      >
        <Resource
          name="posts"
          list={ListGuesser}
          edit={EditGuesser}
          show={ShowGuesser}
          options={{ label: '文章' }}
        />
        <Resource
          name="users"
          list={ListGuesser}
          edit={EditGuesser}
          show={ShowGuesser}
          options={{ label: '用户' }}
        />
      </Admin>
    </div>
  );
};

export default AdminDashboard;
