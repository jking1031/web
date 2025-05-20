import React, { useEffect } from 'react';
import { Box, Typography, Button, Grid } from '@mui/material';
import { AppstoreOutlined, UserOutlined } from '@ant-design/icons';
import ProductionStats from './ProductionStats';
import TrendDataStats from './TrendDataStats';
import DeviceStatus from './DeviceStatus';

/**
 * 增强版仪表盘组件
 * 集成生产数据统计、趋势图和设备状态卡片
 */
const EnhancedDashboard = () => {
  useEffect(() => {
    // 移除不必要的日志输出
    return () => {
      // 清理工作
    };
  }, []);

  return (
    <Box sx={{
      p: 3,
      maxHeight: 'calc(100vh - 64px)', // 减去顶部导航栏的高度
      overflowY: 'auto', // 添加垂直滚动
      '&::-webkit-scrollbar': {
        width: '8px',
      },
      '&::-webkit-scrollbar-thumb': {
        backgroundColor: 'rgba(0,0,0,0.2)',
        borderRadius: '4px',
      },
      '&::-webkit-scrollbar-track': {
        backgroundColor: 'rgba(0,0,0,0.05)',
      }
    }}>
      {/* 生产数据统计 */}
      <ProductionStats />

      {/* 实时趋势数据 */}
      <TrendDataStats />

      {/* 设备状态 */}
      <DeviceStatus />
    </Box>
  );
};

export default EnhancedDashboard;
