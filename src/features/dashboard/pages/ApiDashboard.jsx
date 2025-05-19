/**
 * API 仪表盘页面
 * 展示如何在实际应用中使用 API 调用系统
 */
import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  Card, 
  CardContent, 
  CardHeader,
  CircularProgress, 
  Alert,
  Chip,
  Divider,
  Button,
  IconButton,
  Tooltip,
  useTheme
} from '@mui/material';
import { 
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import { useApis } from '../../hooks/useApi';
import { formatApiResponse } from '../../utils/apiUtils';

/**
 * 设备状态卡片组件
 */
const DeviceStatusCard = ({ data, loading, error, onRefresh }) => {
  const theme = useTheme();
  
  // 格式化设备状态数据
  const formatDeviceStatus = (data) => {
    if (!data) return { online: 0, offline: 0, warning: 0, total: 0 };
    
    return {
      online: data.onlineCount || 0,
      offline: data.offlineCount || 0,
      warning: data.warningCount || 0,
      total: data.totalCount || 0
    };
  };
  
  const deviceStatus = formatDeviceStatus(data);
  
  return (
    <Card>
      <CardHeader 
        title="设备状态" 
        action={
          <IconButton onClick={onRefresh} disabled={loading}>
            <RefreshIcon />
          </IconButton>
        }
      />
      <CardContent>
        {loading && <CircularProgress size={24} />}
        
        {error && (
          <Alert severity="error">
            加载失败: {error.message}
          </Alert>
        )}
        
        {data && (
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Paper 
                sx={{ 
                  p: 2, 
                  textAlign: 'center',
                  bgcolor: theme.palette.success.light,
                  color: theme.palette.success.contrastText
                }}
              >
                <Typography variant="h4">{deviceStatus.online}</Typography>
                <Typography variant="body2">在线设备</Typography>
              </Paper>
            </Grid>
            
            <Grid item xs={6}>
              <Paper 
                sx={{ 
                  p: 2, 
                  textAlign: 'center',
                  bgcolor: theme.palette.error.light,
                  color: theme.palette.error.contrastText
                }}
              >
                <Typography variant="h4">{deviceStatus.offline}</Typography>
                <Typography variant="body2">离线设备</Typography>
              </Paper>
            </Grid>
            
            <Grid item xs={6}>
              <Paper 
                sx={{ 
                  p: 2, 
                  textAlign: 'center',
                  bgcolor: theme.palette.warning.light,
                  color: theme.palette.warning.contrastText
                }}
              >
                <Typography variant="h4">{deviceStatus.warning}</Typography>
                <Typography variant="body2">告警设备</Typography>
              </Paper>
            </Grid>
            
            <Grid item xs={6}>
              <Paper 
                sx={{ 
                  p: 2, 
                  textAlign: 'center',
                  bgcolor: theme.palette.info.light,
                  color: theme.palette.info.contrastText
                }}
              >
                <Typography variant="h4">{deviceStatus.total}</Typography>
                <Typography variant="body2">设备总数</Typography>
              </Paper>
            </Grid>
          </Grid>
        )}
      </CardContent>
    </Card>
  );
};

/**
 * 通知卡片组件
 */
const NotificationsCard = ({ data, loading, error, onRefresh }) => {
  // 格式化通知数据
  const formatNotifications = (data) => {
    if (!data || !Array.isArray(data)) return [];
    
    return data.slice(0, 5).map(notification => ({
      id: notification.id,
      title: notification.title,
      message: notification.message,
      type: notification.type || 'info',
      time: new Date(notification.createdAt).toLocaleString()
    }));
  };
  
  const notifications = formatNotifications(data);
  
  return (
    <Card>
      <CardHeader 
        title="最新通知" 
        action={
          <IconButton onClick={onRefresh} disabled={loading}>
            <RefreshIcon />
          </IconButton>
        }
      />
      <CardContent>
        {loading && <CircularProgress size={24} />}
        
        {error && (
          <Alert severity="error">
            加载失败: {error.message}
          </Alert>
        )}
        
        {data && (
          <Box>
            {notifications.length === 0 ? (
              <Typography variant="body1" sx={{ textAlign: 'center', py: 2 }}>
                暂无通知
              </Typography>
            ) : (
              notifications.map((notification, index) => (
                <Box key={notification.id} sx={{ mb: 2 }}>
                  {index > 0 && <Divider sx={{ my: 1 }} />}
                  
                  <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                    {notification.type === 'warning' && (
                      <WarningIcon color="warning" sx={{ mr: 1 }} />
                    )}
                    
                    {notification.type === 'error' && (
                      <ErrorIcon color="error" sx={{ mr: 1 }} />
                    )}
                    
                    {notification.type === 'success' && (
                      <CheckCircleIcon color="success" sx={{ mr: 1 }} />
                    )}
                    
                    {notification.type === 'info' && (
                      <NotificationsIcon color="info" sx={{ mr: 1 }} />
                    )}
                    
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle2">
                        {notification.title}
                      </Typography>
                      
                      <Typography variant="body2" color="text.secondary">
                        {notification.message}
                      </Typography>
                      
                      <Typography variant="caption" color="text.secondary">
                        {notification.time}
                      </Typography>
                    </Box>
                    
                    <Chip 
                      label={
                        notification.type === 'warning' ? '警告' :
                        notification.type === 'error' ? '错误' :
                        notification.type === 'success' ? '成功' : '信息'
                      }
                      size="small"
                      color={
                        notification.type === 'warning' ? 'warning' :
                        notification.type === 'error' ? 'error' :
                        notification.type === 'success' ? 'success' : 'info'
                      }
                    />
                  </Box>
                </Box>
              ))
            )}
            
            <Button 
              variant="outlined" 
              fullWidth 
              sx={{ mt: 2 }}
              startIcon={<NotificationsIcon />}
            >
              查看全部通知
            </Button>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

/**
 * 趋势数据卡片组件
 */
const TrendDataCard = ({ data, loading, error, onRefresh }) => {
  // 这里可以添加趋势图表的实现
  // 例如使用 recharts 或 chart.js
  
  return (
    <Card>
      <CardHeader 
        title="趋势数据" 
        action={
          <IconButton onClick={onRefresh} disabled={loading}>
            <RefreshIcon />
          </IconButton>
        }
      />
      <CardContent>
        {loading && <CircularProgress size={24} />}
        
        {error && (
          <Alert severity="error">
            加载失败: {error.message}
          </Alert>
        )}
        
        {data && (
          <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography variant="body1">
              这里将显示趋势图表
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

/**
 * API 仪表盘页面
 */
const ApiDashboard = () => {
  // 使用 useApis Hook 调用多个 API
  const { 
    results, 
    loading, 
    errors, 
    execute 
  } = useApis([
    { key: 'getDeviceStatus', params: {} },
    { key: 'getNotifications', params: {} },
    { key: 'getTrendData', params: { timeRange: 'day' } }
  ], { 
    autoLoad: true,
    parallel: true
  });
  
  // 刷新单个 API 数据
  const refreshApi = (apiKey) => {
    execute([{ key: apiKey, params: {} }]);
  };
  
  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          仪表盘
        </Typography>
        
        <Button 
          variant="contained" 
          startIcon={<RefreshIcon />}
          onClick={() => execute()}
        >
          刷新所有数据
        </Button>
      </Box>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <DeviceStatusCard 
            data={results.getDeviceStatus}
            loading={loading && !results.getDeviceStatus}
            error={errors.getDeviceStatus}
            onRefresh={() => refreshApi('getDeviceStatus')}
          />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <NotificationsCard 
            data={results.getNotifications}
            loading={loading && !results.getNotifications}
            error={errors.getNotifications}
            onRefresh={() => refreshApi('getNotifications')}
          />
        </Grid>
        
        <Grid item xs={12}>
          <TrendDataCard 
            data={results.getTrendData}
            loading={loading && !results.getTrendData}
            error={errors.getTrendData}
            onRefresh={() => refreshApi('getTrendData')}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default ApiDashboard;
