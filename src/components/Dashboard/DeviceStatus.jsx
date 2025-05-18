import React, { useState, useEffect } from 'react';
import { Card, CardContent, Typography, Grid, Box, CircularProgress, Chip, Tooltip, Button } from '@mui/material';
import { DashboardOutlined, CheckCircleOutlined, WarningOutlined, CloseCircleOutlined, DisconnectOutlined, ReloadOutlined } from '@ant-design/icons';
import moment from 'moment';

/**
 * 设备状态卡片组件
 * 显示设备状态信息，暂时使用模拟数据
 */
const DeviceStatus = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deviceStats, setDeviceStats] = useState({
    online: 0,
    offline: 0,
    warning: 0,
    error: 0,
    devices: []
  });
  const [activeStatus, setActiveStatus] = useState('all'); // 'all', 'online', 'offline', 'warning', 'error'
  const [lastUpdated, setLastUpdated] = useState(null);

  // 获取设备状态数据
  useEffect(() => {
    const fetchDeviceStatus = async () => {
      try {
        // 移除不必要的日志输出
        setLoading(true);

        // 暂时使用模拟数据
        // 后期可以替换为实际API调用
        setTimeout(() => {
          const mockData = generateMockDeviceData();
          setDeviceStats(mockData);
          setLastUpdated(new Date());
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error('[DeviceStatus] 获取设备状态数据错误:', error.message);
        setError('获取数据失败: ' + (error.message || '未知错误'));
        setLoading(false);
      }
    };

    fetchDeviceStatus();

    // 设置定时器，每分钟更新一次数据
    const timer = setInterval(fetchDeviceStatus, 60000);

    // 清理函数
    return () => {
      // 清理资源
      clearInterval(timer);
    };
  }, []);

  // 生成模拟设备数据
  const generateMockDeviceData = () => {
    const deviceTypes = ['水泵', '阀门', '传感器', '控制器', '监测仪'];
    const locations = ['进水口', '出水口', '沉淀池', '曝气池', '消毒池', '污泥池'];
    const statuses = ['online', 'offline', 'warning', 'error'];

    // 生成随机设备数量
    const onlineCount = Math.floor(Math.random() * 20) + 30;
    const offlineCount = Math.floor(Math.random() * 5) + 3;
    const warningCount = Math.floor(Math.random() * 5) + 2;
    const errorCount = Math.floor(Math.random() * 3) + 1;

    // 生成设备列表
    const devices = [];
    const totalDevices = onlineCount + offlineCount + warningCount + errorCount;

    for (let i = 1; i <= totalDevices; i++) {
      const deviceType = deviceTypes[Math.floor(Math.random() * deviceTypes.length)];
      const location = locations[Math.floor(Math.random() * locations.length)];

      // 根据设备数量分配状态
      let status;
      if (i <= onlineCount) {
        status = 'online';
      } else if (i <= onlineCount + offlineCount) {
        status = 'offline';
      } else if (i <= onlineCount + offlineCount + warningCount) {
        status = 'warning';
      } else {
        status = 'error';
      }

      devices.push({
        id: i,
        name: `${deviceType}${i}`,
        type: deviceType,
        location,
        status,
        lastUpdate: new Date(Date.now() - Math.floor(Math.random() * 86400000)).toLocaleString()
      });
    }

    return {
      online: onlineCount,
      offline: offlineCount,
      warning: warningCount,
      error: errorCount,
      devices
    };
  };

  // 获取状态图标和颜色
  const getStatusInfo = (status) => {
    switch (status) {
      case 'online':
        return { icon: <CheckCircleOutlined />, color: '#52c41a', text: '在线' };
      case 'offline':
        return { icon: <DisconnectOutlined />, color: '#8c8c8c', text: '离线' };
      case 'warning':
        return { icon: <WarningOutlined />, color: '#faad14', text: '警告' };
      case 'error':
        return { icon: <CloseCircleOutlined />, color: '#f5222d', text: '错误' };
      default:
        return { icon: <DisconnectOutlined />, color: '#8c8c8c', text: '未知' };
    }
  };

  if (loading) {
    return (
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ p: 2, bgcolor: '#ffebee', borderRadius: 1, color: '#d32f2f' }}>
            <Typography variant="body1">{error}</Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  // 处理状态卡片点击
  const handleStatusCardClick = (status) => {
    setActiveStatus(status === activeStatus ? 'all' : status);
  };

  // 手动刷新数据
  const handleRefresh = () => {
    const mockData = generateMockDeviceData();
    setDeviceStats(mockData);
    setLastUpdated(new Date());
  };

  // 获取过滤后的设备列表
  const getFilteredDevices = () => {
    if (activeStatus === 'all') {
      return deviceStats.devices.slice(0, 8);
    }
    return deviceStats.devices
      .filter(device => device.status === activeStatus)
      .slice(0, 8);
  };

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <DashboardOutlined style={{ fontSize: 24, marginRight: 8, color: '#2E7D32' }} />
            <Typography variant="h6">设备状态</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {lastUpdated && (
              <Typography variant="caption" color="textSecondary" sx={{ mr: 1 }}>
                最后更新: {moment(lastUpdated).format('YYYY-MM-DD HH:mm:ss')}
              </Typography>
            )}
            <Tooltip title="刷新数据">
              <Button
                size="small"
                startIcon={<ReloadOutlined />}
                onClick={handleRefresh}
                disabled={loading}
              >
                刷新
              </Button>
            </Tooltip>
          </Box>
        </Box>

        <Grid container spacing={1} sx={{ mb: 2 }}>
          <Grid item xs={3}>
            <Card
              variant="outlined"
              sx={{
                bgcolor: activeStatus === 'online' ? '#f6ffed' : '#f9f9f9',
                borderColor: activeStatus === 'online' ? '#b7eb8f' : '#e8e8e8',
                cursor: 'pointer',
                transition: 'all 0.3s',
                '&:hover': {
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  borderColor: '#b7eb8f'
                }
              }}
              onClick={() => handleStatusCardClick('online')}
            >
              <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
                <Typography variant="h5" sx={{ color: '#52c41a', fontWeight: 'bold', textAlign: 'center' }}>
                  {deviceStats.online}
                </Typography>
                <Typography variant="body2" sx={{ color: '#52c41a', textAlign: 'center' }}>
                  在线
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={3}>
            <Card
              variant="outlined"
              sx={{
                bgcolor: activeStatus === 'offline' ? '#f9f9f9' : '#f9f9f9',
                borderColor: activeStatus === 'offline' ? '#d9d9d9' : '#e8e8e8',
                cursor: 'pointer',
                transition: 'all 0.3s',
                '&:hover': {
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  borderColor: '#d9d9d9'
                }
              }}
              onClick={() => handleStatusCardClick('offline')}
            >
              <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
                <Typography variant="h5" sx={{ color: '#8c8c8c', fontWeight: 'bold', textAlign: 'center' }}>
                  {deviceStats.offline}
                </Typography>
                <Typography variant="body2" sx={{ color: '#8c8c8c', textAlign: 'center' }}>
                  离线
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={3}>
            <Card
              variant="outlined"
              sx={{
                bgcolor: activeStatus === 'warning' ? '#fffbe6' : '#f9f9f9',
                borderColor: activeStatus === 'warning' ? '#ffe58f' : '#e8e8e8',
                cursor: 'pointer',
                transition: 'all 0.3s',
                '&:hover': {
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  borderColor: '#ffe58f'
                }
              }}
              onClick={() => handleStatusCardClick('warning')}
            >
              <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
                <Typography variant="h5" sx={{ color: '#faad14', fontWeight: 'bold', textAlign: 'center' }}>
                  {deviceStats.warning}
                </Typography>
                <Typography variant="body2" sx={{ color: '#faad14', textAlign: 'center' }}>
                  警告
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={3}>
            <Card
              variant="outlined"
              sx={{
                bgcolor: activeStatus === 'error' ? '#fff2f0' : '#f9f9f9',
                borderColor: activeStatus === 'error' ? '#ffccc7' : '#e8e8e8',
                cursor: 'pointer',
                transition: 'all 0.3s',
                '&:hover': {
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  borderColor: '#ffccc7'
                }
              }}
              onClick={() => handleStatusCardClick('error')}
            >
              <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
                <Typography variant="h5" sx={{ color: '#f5222d', fontWeight: 'bold', textAlign: 'center' }}>
                  {deviceStats.error}
                </Typography>
                <Typography variant="body2" sx={{ color: '#f5222d', textAlign: 'center' }}>
                  错误
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Grid container spacing={1}>
          {getFilteredDevices().map(device => {
            const statusInfo = getStatusInfo(device.status);

            return (
              <Grid item xs={6} sm={4} md={3} key={device.id}>
                <Card variant="outlined" sx={{
                  height: '100%',
                  borderColor: statusInfo.color,
                  transition: 'all 0.3s',
                  '&:hover': {
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  }
                }}>
                  <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                      <Typography variant="subtitle2">{device.name}</Typography>
                      <Chip
                        size="small"
                        icon={statusInfo.icon}
                        label={statusInfo.text}
                        sx={{
                          color: statusInfo.color,
                          borderColor: statusInfo.color,
                          bgcolor: 'transparent',
                          height: '20px',
                          '& .MuiChip-label': {
                            padding: '0 4px'
                          },
                          '& .MuiChip-icon': {
                            fontSize: '14px'
                          }
                        }}
                        variant="outlined"
                      />
                    </Box>
                    <Typography variant="body2" color="textSecondary" noWrap>
                      {device.location}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      </CardContent>
    </Card>
  );
};

export default DeviceStatus;
