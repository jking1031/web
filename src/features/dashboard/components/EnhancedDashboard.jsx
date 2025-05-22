import React, { useEffect, useState } from 'react';
import { Box, Typography, Button, Grid, FormControl, Select, MenuItem, IconButton, Tooltip } from '@mui/material';
import { AppstoreOutlined, UserOutlined, ClockCircleOutlined } from '@ant-design/icons';
import ProductionStats from './ProductionStats';
import EnhancedTrendChart from './EnhancedTrendChart';
import DailyProcessAnalysis from './DailyProcessAnalysis';

/**
 * 增强版仪表盘组件
 * 集成生产数据统计、趋势图和工艺分析卡片
 */
const EnhancedDashboard = () => {
  const [refreshMode, setRefreshMode] = useState('realtime'); // 'realtime' 或 'periodic'
  const [refreshInterval, setRefreshInterval] = useState(10); // 默认10分钟

  // 刷新间隔选项（分钟）
  const intervalOptions = [10, 15, 30, 60, 90, 120];

  // 处理刷新模式切换
  const handleRefreshModeChange = (event) => {
    setRefreshMode(event.target.value);
  };

  // 处理刷新间隔切换
  const handleIntervalChange = (event) => {
    setRefreshInterval(event.target.value);
  };

  useEffect(() => {
    // 移除不必要的日志输出
    return () => {
      // 清理工作
    };
  }, []);

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5">仪表盘</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <Select
              value={refreshMode}
              onChange={handleRefreshModeChange}
              displayEmpty
            >
              <MenuItem value="realtime">实时更新</MenuItem>
              <MenuItem value="periodic">定时更新</MenuItem>
            </Select>
          </FormControl>
          {refreshMode === 'periodic' && (
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <Select
                value={refreshInterval}
                onChange={handleIntervalChange}
                displayEmpty
              >
                {intervalOptions.map(interval => (
                  <MenuItem key={interval} value={interval}>
                    {interval}分钟
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <ProductionStats />
        </Grid>
        <Grid item xs={12}>
          <EnhancedTrendChart />
        </Grid>
        <Grid item xs={12}>
          <DailyProcessAnalysis />
        </Grid>
      </Grid>
    </Box>
  );
};

export default EnhancedDashboard;
