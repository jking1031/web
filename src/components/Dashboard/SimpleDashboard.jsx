import React, { useEffect, useState } from 'react';
import { Card, CardContent, Typography, Grid, Box, CircularProgress } from '@mui/material';
import { DashboardOutlined, BarChartOutlined, PieChartOutlined, LineChartOutlined } from '@ant-design/icons';

/**
 * 简化版仪表盘组件，用于测试
 */
const SimpleDashboard = () => {
  console.log('SimpleDashboard: 渲染简化版仪表盘');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('SimpleDashboard: 初始化');
    // 模拟加载过程
    const timer = setTimeout(() => {
      console.log('SimpleDashboard: 加载完成');
      setLoading(false);
    }, 1000);

    return () => {
      console.log('SimpleDashboard: 组件卸载');
      clearTimeout(timer);
    };
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress color="primary" />
        <Typography variant="h6" sx={{ ml: 2 }}>
          加载仪表盘...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        仪表盘
      </Typography>

      <Grid container spacing={3}>
        {/* 月度生产统计卡片 */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <BarChartOutlined style={{ fontSize: 24, marginRight: 8, color: '#2E7D32' }} />
                <Typography variant="h6">月度生产统计</Typography>
              </Box>
              <Typography variant="body1">
                这里将显示月度生产统计数据。
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* 设备状态卡片 */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <PieChartOutlined style={{ fontSize: 24, marginRight: 8, color: '#1890ff' }} />
                <Typography variant="h6">设备状态</Typography>
              </Box>
              <Typography variant="body1">
                这里将显示设备状态数据。
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* 实时趋势卡片 */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <LineChartOutlined style={{ fontSize: 24, marginRight: 8, color: '#722ed1' }} />
                <Typography variant="h6">实时趋势</Typography>
              </Box>
              <Typography variant="body1">
                这里将显示实时趋势数据。
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* 告警信息卡片 */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <DashboardOutlined style={{ fontSize: 24, marginRight: 8, color: '#fa8c16' }} />
                <Typography variant="h6">告警信息</Typography>
              </Box>
              <Typography variant="body1">
                这里将显示告警信息数据。
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SimpleDashboard;
