import React from 'react';
import { Box, Grid } from '@mui/material';
import ProductionStats from './ProductionStats';
import EnhancedTrendChart from './EnhancedTrendChart';
import RealtimeTrendChart from './RealtimeTrendChart';
import DailyProcessAnalysis from './DailyProcessAnalysis';

/**
 * 增强版仪表盘组件
 * 集成生产数据统计、趋势图和工艺分析卡片
 * 每个组件负责自己的更新
 */
const EnhancedDashboard = () => {
  return (
    <Box>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <ProductionStats />
        </Grid>
        <Grid item xs={12} md={6}>
          <EnhancedTrendChart />
        </Grid>
        <Grid item xs={12} md={6}>
          <RealtimeTrendChart />
        </Grid>
        <Grid item xs={12}>
          <DailyProcessAnalysis />
        </Grid>
      </Grid>
    </Box>
  );
};

export default EnhancedDashboard;
