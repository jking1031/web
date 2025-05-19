import React from 'react';
import { Admin, Resource, Layout } from 'react-admin';
import DeviceList from './DeviceList';
import AlarmList from './AlarmList';
import StatisticsList from './StatisticsList';
import CustomQueryList from './CustomQueryList';
import SimpleDashboard from './SimpleDashboard';
import dataProvider from '../../services/dataProvider';
import authProvider from '../../services/authProvider';
import { createTheme } from '@mui/material/styles';

// 自定义主题
const theme = createTheme({
  palette: {
    primary: {
      main: '#2E7D32', // 深绿色
    },
    secondary: {
      main: '#388E3C', // 稍浅的绿色
    },
    background: {
      default: '#f5f5f5',
    },
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#2E7D32',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#fff',
          borderRight: '1px solid #e0e0e0',
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          '&.Mui-selected': {
            backgroundColor: 'rgba(46, 125, 50, 0.1)',
            '&:hover': {
              backgroundColor: 'rgba(46, 125, 50, 0.2)',
            },
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          backgroundColor: '#f5f5f5',
          fontWeight: 'bold',
        },
      },
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 500,
    },
    h2: {
      fontWeight: 500,
    },
    h3: {
      fontWeight: 500,
    },
    h4: {
      fontWeight: 500,
    },
    h5: {
      fontWeight: 500,
    },
    h6: {
      fontWeight: 500,
    },
  },
});

// 自定义布局
const CustomLayout = (props) => {
  return (
    <Layout
      {...props}
    />
  );
};

// 主应用组件
const AdminApp = () => {
  console.log('AdminApp: 渲染React-Admin应用');

  return (
    <Admin
      dataProvider={dataProvider}
      authProvider={authProvider}
      dashboard={SimpleDashboard}
      theme={theme}
      layout={CustomLayout}
      requireAuth={false} // 禁用内置认证检查，我们使用外部认证
      disableTelemetry // 禁用遥测
    >
      <Resource name="devices" list={DeviceList} options={{ label: '设备管理' }} />
      <Resource name="alarms" list={AlarmList} options={{ label: '告警管理' }} />
      <Resource name="statistics" list={StatisticsList} options={{ label: '统计数据' }} />
      <Resource name="custom-queries" list={CustomQueryList} options={{ label: '自定义查询' }} />
    </Admin>
  );
};

export default AdminApp;
