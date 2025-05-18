import React, { useState, useEffect, useRef } from 'react';
import { useDataProvider, Title, Loading, Error } from 'react-admin';
import { Card, CardContent, CardHeader, Grid, Box, Typography, Paper } from '@mui/material';
import { Line, Area, Column, Pie } from '@ant-design/charts';
import {
  BarChartOutlined,
  LineChartOutlined,
  PieChartOutlined,
  AlertOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  StopOutlined
} from '@ant-design/icons';
import axios from 'axios';
import styles from './Dashboard.module.scss';

const Dashboard = () => {
  const dataProvider = useDataProvider();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState();
  const [stats, setStats] = useState({
    monthlyProduction: [],
    deviceStatus: { online: 0, offline: 0, warning: 0, error: 0 },
    alarms: [],
    realtimeTrends: []
  });

  // 获取仪表盘数据
  useEffect(() => {
    console.log('Dashboard: 初始化仪表盘数据');
    // 使用ref避免重复请求
    const isMounted = useRef(true);

    const fetchDashboardData = async () => {
      // 如果组件已卸载，不执行请求
      if (!isMounted.current) return;

      try {
        console.log('Dashboard: 开始获取数据');
        setLoading(true);

        // 使用dataProvider获取数据
        // 获取月度生产统计
        const monthlyStats = await dataProvider.getMonthlyStats();
        console.log('Dashboard: 获取到月度统计数据', monthlyStats);

        // 处理月度统计数据，转换为图表所需格式
        const monthlyProduction = monthlyStats.monthlyData || generateMockMonthlyData();

        // 获取设备状态
        const deviceStatus = await dataProvider.getDeviceStatus();
        console.log('Dashboard: 获取到设备状态数据', deviceStatus);

        // 获取告警信息
        const alarms = await dataProvider.getAlerts();
        console.log('Dashboard: 获取到告警信息', alarms);

        // 获取实时趋势数据
        const realtimeTrends = generateMockTrendData();

        // 如果组件已卸载，不更新状态
        if (!isMounted.current) return;

        console.log('Dashboard: 数据获取成功，更新状态');
        setStats({
          monthlyProduction,
          deviceStatus,
          alarms,
          realtimeTrends
        });

        // 确保设置loading为false
        setTimeout(() => {
          if (isMounted.current) {
            console.log('Dashboard: 设置加载状态为false');
            setLoading(false);
          }
        }, 500);
      } catch (err) {
        console.error('Dashboard: 获取仪表盘数据失败:', err);

        // 如果组件已卸载，不更新状态
        if (!isMounted.current) return;

        setError(err);

        // 使用模拟数据作为回退
        console.log('Dashboard: 使用模拟数据作为回退');
        const fallbackData = {
          monthlyProduction: generateMockMonthlyData(),
          deviceStatus: dataProvider.generateMockDeviceStatus(),
          alarms: dataProvider.generateMockAlerts(),
          realtimeTrends: generateMockTrendData()
        };

        setStats(fallbackData);
        setLoading(false);
      }
    };

    // 初始加载数据
    fetchDashboardData();

    // 设置定时刷新
    const refreshInterval = setInterval(() => {
      console.log('Dashboard: 定时刷新数据');
      fetchDashboardData();
    }, 60000); // 每分钟刷新一次

    // 清理函数
    return () => {
      console.log('Dashboard: 组件卸载，清理资源');
      isMounted.current = false;
      clearInterval(refreshInterval);
    };
  }, [dataProvider]); // 依赖dataProvider，确保它变化时重新获取数据

  // 处理月度统计数据
  const processMonthlyStats = (stats) => {
    if (!stats || Object.keys(stats).length === 0) {
      return generateMockMonthlyData();
    }

    try {
      // 从统计数据中提取月度生产数据
      const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
      const currentMonth = new Date().getMonth();

      // 创建过去12个月的数据
      return months.map((month, index) => {
        // 计算实际月份（当前月份往前推）
        const actualMonthIndex = (currentMonth - 11 + index + 12) % 12;
        const actualMonth = months[actualMonthIndex];

        // 使用实际数据或生成随机数据
        return {
          month: actualMonth,
          产量: stats.totalProcessing_out || Math.floor(Math.random() * 1000) + 500,
          目标: 800
        };
      });
    } catch (error) {
      console.error('处理月度统计数据失败:', error);
      return generateMockMonthlyData();
    }
  };

  // 获取实时趋势数据
  const fetchRealtimeTrends = async () => {
    try {
      // 使用您的API获取实时趋势数据
      const response = await axios.post('https://nodered.jzz77.cn:9003/custom-query', {
        dbName: 'nodered',
        tableName: 'gt_data',
        fields: ['timestamp', 'flow_in', 'flow_out', 'pressure'],
        limit: 100,
        orderBy: 'timestamp',
        orderDir: 'DESC'
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      // 如果API不可用，使用模拟数据
      if (!response.data || !response.data.length) {
        return generateMockTrendData();
      }

      // 处理数据格式
      const formattedData = [];
      response.data.forEach(item => {
        if (item.flow_in !== undefined) {
          formattedData.push({
            timestamp: new Date(item.timestamp).toLocaleString(),
            value: item.flow_in,
            type: '进水流量'
          });
        }
        if (item.flow_out !== undefined) {
          formattedData.push({
            timestamp: new Date(item.timestamp).toLocaleString(),
            value: item.flow_out,
            type: '出水流量'
          });
        }
        if (item.pressure !== undefined) {
          formattedData.push({
            timestamp: new Date(item.timestamp).toLocaleString(),
            value: item.pressure,
            type: '压力'
          });
        }
      });

      return formattedData.reverse(); // 反转以便按时间顺序显示
    } catch (error) {
      console.error('获取实时趋势数据失败:', error);
      // 返回模拟数据
      return generateMockTrendData();
    }
  };

  // 生成模拟月度数据
  const generateMockMonthlyData = () => {
    const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
    return months.map(month => ({
      month,
      产量: Math.floor(Math.random() * 1000) + 500,
      目标: 800
    }));
  };

  // 生成模拟告警数据
  const generateMockAlarms = () => {
    const alarmTypes = ['设备离线', '温度过高', '压力异常', '流量过大', '水位过高'];
    const devices = ['水泵1号', '水泵2号', '阀门控制器', '水位传感器', '压力传感器'];
    const levels = ['警告', '严重', '紧急'];

    return Array(5).fill().map((_, i) => ({
      id: i + 1,
      type: alarmTypes[Math.floor(Math.random() * alarmTypes.length)],
      device: devices[Math.floor(Math.random() * devices.length)],
      level: levels[Math.floor(Math.random() * levels.length)],
      timestamp: new Date(Date.now() - Math.floor(Math.random() * 86400000)).toLocaleString(),
      status: Math.random() > 0.5 ? '已处理' : '未处理'
    }));
  };

  // 生成模拟趋势数据
  const generateMockTrendData = () => {
    const data = [];
    const now = new Date();

    for (let i = 0; i < 100; i++) {
      const timestamp = new Date(now.getTime() - (99 - i) * 600000).toLocaleString();

      data.push({
        timestamp,
        value: Math.sin(i / 10) * 20 + 50 + Math.random() * 5,
        type: '进水流量'
      });

      data.push({
        timestamp,
        value: Math.sin(i / 10 + 1) * 15 + 40 + Math.random() * 5,
        type: '出水流量'
      });

      data.push({
        timestamp,
        value: Math.sin(i / 15) * 0.5 + 2.5 + Math.random() * 0.2,
        type: '压力'
      });
    }

    return data;
  };

  // 自定义加载状态显示
  if (loading) {
    console.log('Dashboard: 显示加载状态');
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <Typography variant="h5" color="primary" sx={{ mb: 2 }}>
          正在加载仪表盘数据...
        </Typography>
      </Box>
    );
  }

  // 自定义错误状态显示
  if (error) {
    console.error('Dashboard: 显示错误状态', error);
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h5" color="error" sx={{ mb: 2 }}>
          加载仪表盘数据失败
        </Typography>
        <Typography variant="body1">
          {error.message || '发生未知错误，请稍后重试'}
        </Typography>
      </Box>
    );
  }

  return (
    <Box className={styles.dashboard}>
      <Title title="仪表盘" />

      <Grid container spacing={3}>
        {/* 月度生产统计 */}
        <Grid item xs={12} md={8}>
          <Card className={styles.card}>
            <CardHeader
              title="月度生产统计"
              avatar={<BarChartOutlined />}
            />
            <CardContent>
              <Column
                data={stats.monthlyProduction}
                xField="month"
                yField="产量"
                seriesField="type"
                isGroup={true}
                columnWidthRatio={0.8}
                label={{
                  position: 'top',
                }}
                meta={{
                  产量: {
                    alias: '月产量',
                  },
                  目标: {
                    alias: '目标产量',
                  },
                }}
                height={300}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* 设备状态 */}
        <Grid item xs={12} md={4}>
          <Card className={styles.card}>
            <CardHeader
              title="设备状态"
              avatar={<PieChartOutlined />}
            />
            <CardContent>
              <Pie
                data={[
                  { type: '在线', value: stats.deviceStatus.online, color: '#52c41a' },
                  { type: '离线', value: stats.deviceStatus.offline, color: '#8c8c8c' },
                  { type: '警告', value: stats.deviceStatus.warning, color: '#faad14' },
                  { type: '错误', value: stats.deviceStatus.error, color: '#f5222d' },
                ]}
                angleField="value"
                colorField="type"
                radius={0.8}
                innerRadius={0.6}
                label={{
                  type: 'inner',
                  offset: '-50%',
                  content: '{value}',
                  style: {
                    textAlign: 'center',
                    fontSize: 14,
                  },
                }}
                interactions={[{ type: 'element-selected' }, { type: 'element-active' }]}
                height={300}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* 实时趋势 */}
        <Grid item xs={12}>
          <Card className={styles.card}>
            <CardHeader
              title="实时趋势"
              avatar={<LineChartOutlined />}
            />
            <CardContent>
              <Line
                data={stats.realtimeTrends}
                xField="timestamp"
                yField="value"
                seriesField="type"
                point={{
                  size: 3,
                  shape: 'circle',
                }}
                smooth={true}
                animation={{
                  appear: {
                    animation: 'path-in',
                    duration: 1000,
                  },
                }}
                height={400}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* 告警信息 */}
        <Grid item xs={12}>
          <Card className={styles.card}>
            <CardHeader
              title="告警信息"
              avatar={<AlertOutlined />}
            />
            <CardContent>
              <Box className={styles.alarmList}>
                {stats.alarms.map((alarm) => (
                  <Paper key={alarm.id} className={styles.alarmItem} elevation={1}>
                    <Box className={styles.alarmIcon}>
                      {alarm.level === '紧急' && <StopOutlined style={{ color: '#f5222d' }} />}
                      {alarm.level === '严重' && <WarningOutlined style={{ color: '#faad14' }} />}
                      {alarm.level === '警告' && <AlertOutlined style={{ color: '#1890ff' }} />}
                    </Box>
                    <Box className={styles.alarmContent}>
                      <Typography variant="subtitle1">{alarm.type}</Typography>
                      <Typography variant="body2">设备: {alarm.device}</Typography>
                      <Typography variant="body2">时间: {alarm.timestamp}</Typography>
                    </Box>
                    <Box className={styles.alarmStatus}>
                      {alarm.status === '已处理' ? (
                        <CheckCircleOutlined style={{ color: '#52c41a' }} />
                      ) : (
                        <Typography variant="body2" color="error">未处理</Typography>
                      )}
                    </Box>
                  </Paper>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
