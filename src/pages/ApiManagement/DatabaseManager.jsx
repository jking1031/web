import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Paper,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Storage as StorageIcon,
  Code as CodeIcon,
  Dashboard as DashboardIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  BugReport as TestIcon
} from '@mui/icons-material';
import DataSourceManager from './DataSourceManager';
import QueryManager from './QueryManager';
import dbService, { DB_EVENTS, DB_STATUS } from '../../../services/dbService';
import { EventEmitter } from '../../utils/EventEmitter';
import DatabaseTest from '../../../components/DatabaseTest/DatabaseTest';

/**
 * 数据库管理组件
 * 整合数据源管理和查询管理功能
 */
const DatabaseManager = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [dataSources, setDataSources] = useState([]);
  const [connectionStatuses, setConnectionStatuses] = useState({});
  const [dbStats, setDbStats] = useState({
    total: 0,
    connected: 0,
    error: 0,
    disconnected: 0
  });
  const [isLoading, setIsLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // 处理标签切换
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);

    // 如果切换到概览标签页，刷新数据
    if (newValue === 0) {
      loadDataSources();
    }
  };

  // 加载数据源配置
  const loadDataSources = useCallback(() => {
    try {
      // 从本地存储获取数据源配置
      const savedDataSources = localStorage.getItem('dataSources');
      if (savedDataSources) {
        const parsedDataSources = JSON.parse(savedDataSources);
        setDataSources(parsedDataSources);

        // 加载每个数据源的连接状态
        parsedDataSources.forEach(ds => {
          checkConnectionStatus(ds);
        });

        // 更新统计信息
        updateStats(parsedDataSources);
      } else {
        setDataSources([]);
        setDbStats({
          total: 0,
          connected: 0,
          error: 0,
          disconnected: 0
        });
      }
    } catch (error) {
      console.error('获取数据源配置失败:', error);
    }
  }, []);

  // 检查数据源连接状态
  const checkConnectionStatus = useCallback((dataSource) => {
    if (!dataSource) return;

    const config = {
      type: dataSource.type,
      host: dataSource.host,
      port: dataSource.port,
      database: dataSource.database,
      username: dataSource.username,
      password: dataSource.password
    };

    const status = dbService.getConnectionStatus(config);

    setConnectionStatuses(prev => {
      const newStatuses = {
        ...prev,
        [dataSource.id]: status
      };

      // 更新统计信息
      updateStatsFromStatuses(newStatuses);

      return newStatuses;
    });
  }, []);

  // 更新数据库统计信息
  const updateStats = useCallback((sources) => {
    if (!sources || sources.length === 0) {
      setDbStats({
        total: 0,
        connected: 0,
        error: 0,
        disconnected: 0
      });
      return;
    }

    // 初始化统计信息
    const stats = {
      total: sources.length,
      connected: 0,
      error: 0,
      disconnected: 0
    };

    // 统计各种状态的数量
    Object.values(connectionStatuses).forEach(status => {
      if (status) {
        if (status.status === DB_STATUS.CONNECTED) {
          stats.connected++;
        } else if (status.status === DB_STATUS.ERROR) {
          stats.error++;
        } else {
          stats.disconnected++;
        }
      }
    });

    setDbStats(stats);
  }, [connectionStatuses]);

  // 从状态更新统计信息
  const updateStatsFromStatuses = useCallback((statuses) => {
    if (!statuses) return;

    // 初始化统计信息
    const stats = {
      total: dataSources.length,
      connected: 0,
      error: 0,
      disconnected: 0
    };

    // 统计各种状态的数量
    Object.values(statuses).forEach(status => {
      if (status) {
        if (status.status === DB_STATUS.CONNECTED) {
          stats.connected++;
        } else if (status.status === DB_STATUS.ERROR) {
          stats.error++;
        } else {
          stats.disconnected++;
        }
      }
    });

    setDbStats(stats);
  }, [dataSources]);

  // 初始化
  useEffect(() => {
    loadDataSources();

    // 监听数据库连接状态变化
    const statusChangedListener = EventEmitter.addEventListener(
      DB_EVENTS.STATUS_CHANGED,
      handleConnectionStatusChanged
    );

    return () => {
      EventEmitter.removeEventListener(statusChangedListener);
    };
  }, [loadDataSources, refreshKey]);

  // 处理连接状态变化
  const handleConnectionStatusChanged = useCallback((event) => {
    // 查找对应的数据源
    const dataSource = dataSources.find(ds => {
      const config = {
        type: ds.type,
        host: ds.host,
        port: ds.port,
        database: ds.database,
        username: ds.username
      };
      const cacheKey = dbService.generateCacheKey(config);
      return cacheKey === event.cacheKey;
    });

    if (dataSource) {
      setConnectionStatuses(prev => {
        const newStatuses = {
          ...prev,
          [dataSource.id]: event.newStatus
        };

        // 更新统计信息
        updateStatsFromStatuses(newStatuses);

        return newStatuses;
      });
    }
  }, [dataSources, updateStatsFromStatuses]);

  // 测试所有数据库连接
  const testAllConnections = async () => {
    if (dataSources.length === 0) return;

    setIsLoading(true);

    try {
      // 依次测试每个数据源
      for (const ds of dataSources) {
        const config = {
          type: ds.type,
          host: ds.host,
          port: ds.port,
          database: ds.database,
          username: ds.username,
          password: ds.password
        };

        // 测试连接
        await dbService.testConnection(config);

        // 更新连接状态
        checkConnectionStatus(ds);
      }
    } catch (error) {
      console.error('测试数据库连接失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box sx={{ p: 0 }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab label="数据库概览" icon={<DashboardIcon />} iconPosition="start" />
          <Tab label="数据源配置" icon={<StorageIcon />} iconPosition="start" />
          <Tab label="查询管理" icon={<CodeIcon />} iconPosition="start" />
          <Tab label="数据库测试" icon={<TestIcon />} iconPosition="start" />
        </Tabs>
      </Box>

      {/* 数据库概览 */}
      {activeTab === 0 && (
        <Box>
          <Grid container spacing={3}>
            {/* 数据库连接状态卡片 */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardHeader
                  title="数据库连接状态"
                  action={
                    <Chip
                      label={isLoading ? '测试中...' : '测试所有连接'}
                      color="primary"
                      onClick={testAllConnections}
                      disabled={isLoading || dataSources.length === 0}
                      icon={isLoading ? <CircularProgress size={16} /> : <CheckCircleIcon />}
                    />
                  }
                />
                <Divider />
                <CardContent>
                  {dataSources.length === 0 ? (
                    <Alert severity="info">
                      没有配置数据源，请先添加数据源
                    </Alert>
                  ) : (
                    <>
                      <Grid container spacing={2} sx={{ mb: 2 }}>
                        <Grid item xs={3}>
                          <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'primary.light', color: 'white' }}>
                            <Typography variant="h4">{dbStats.total}</Typography>
                            <Typography variant="body2">总数</Typography>
                          </Paper>
                        </Grid>
                        <Grid item xs={3}>
                          <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'success.light', color: 'white' }}>
                            <Typography variant="h4">{dbStats.connected}</Typography>
                            <Typography variant="body2">已连接</Typography>
                          </Paper>
                        </Grid>
                        <Grid item xs={3}>
                          <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'error.light', color: 'white' }}>
                            <Typography variant="h4">{dbStats.error}</Typography>
                            <Typography variant="body2">错误</Typography>
                          </Paper>
                        </Grid>
                        <Grid item xs={3}>
                          <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'warning.light', color: 'white' }}>
                            <Typography variant="h4">{dbStats.disconnected}</Typography>
                            <Typography variant="body2">未连接</Typography>
                          </Paper>
                        </Grid>
                      </Grid>

                      <List>
                        {dataSources.map(ds => {
                          const status = connectionStatuses[ds.id];
                          let statusIcon = <InfoIcon color="disabled" />;
                          let statusText = '未知';
                          let statusColor = 'default';

                          if (status) {
                            if (status.status === DB_STATUS.CONNECTED) {
                              statusIcon = <CheckCircleIcon color="success" />;
                              statusText = '已连接';
                              statusColor = 'success';
                            } else if (status.status === DB_STATUS.ERROR) {
                              statusIcon = <ErrorIcon color="error" />;
                              statusText = '错误';
                              statusColor = 'error';
                            } else if (status.status === DB_STATUS.CONNECTING) {
                              statusIcon = <CircularProgress size={16} />;
                              statusText = '连接中';
                              statusColor = 'warning';
                            } else {
                              statusIcon = <WarningIcon color="warning" />;
                              statusText = '未连接';
                              statusColor = 'warning';
                            }
                          }

                          return (
                            <ListItem key={ds.id} divider>
                              <ListItemIcon>
                                <StorageIcon />
                              </ListItemIcon>
                              <ListItemText
                                primary={ds.name}
                                secondary={`${ds.host}:${ds.port}/${ds.database}`}
                              />
                              <Chip
                                icon={statusIcon}
                                label={statusText}
                                color={statusColor}
                                size="small"
                                variant="outlined"
                              />
                            </ListItem>
                          );
                        })}
                      </List>
                    </>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* 数据库查询统计卡片 */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardHeader title="数据库查询统计" />
                <Divider />
                <CardContent>
                  <List>
                    <ListItem>
                      <ListItemIcon>
                        <CodeIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="保存的查询"
                        secondary="系统中保存的SQL查询数量"
                      />
                      <Chip
                        label={localStorage.getItem('dataQueries') ? JSON.parse(localStorage.getItem('dataQueries')).length : 0}
                        color="primary"
                        size="small"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <StorageIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="保存的查询结果"
                        secondary="系统中保存的查询结果数量"
                      />
                      <Chip
                        label={localStorage.getItem('savedQueryResults') ? JSON.parse(localStorage.getItem('savedQueryResults')).length : 0}
                        color="primary"
                        size="small"
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* 数据源配置 */}
      {activeTab === 1 && (
        <DataSourceManager />
      )}

      {/* 查询管理 */}
      {activeTab === 2 && (
        <QueryManager />
      )}

      {/* 数据库测试 */}
      {activeTab === 3 && (
        <DatabaseTest />
      )}
    </Box>
  );
};

export default DatabaseManager;
