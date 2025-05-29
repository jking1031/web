import React from 'react';
import { DatabaseOutlined, LineChartOutlined, FileTextOutlined } from '@ant-design/icons';
import HistoryDataPage from './pages/HistoryDataPage';
import DailyReportPage from './pages/DailyReportPage';

const routes = [
  {
    path: 'history-data',
    name: '历史数据查询',
    component: HistoryDataPage,
    icon: <LineChartOutlined />,
  },
  {
    path: 'daily-report',
    name: '日报查询',
    component: DailyReportPage,
    icon: <FileTextOutlined />,
  },
];

export default routes; 