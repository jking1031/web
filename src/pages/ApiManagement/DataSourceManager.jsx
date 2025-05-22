import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Tooltip,
  Grid,
  Alert,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Badge,
  Tabs,
  Tab,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  PlayArrow as TestIcon,
  FileCopy as DuplicateIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  ExpandMore as ExpandMoreIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
  Storage as StorageIcon,
  Code as CodeIcon
} from '@mui/icons-material';
import JsonEditor from '../../../components/JsonEditor/JsonEditor';
import dbService, { DB_EVENTS, DB_STATUS, DB_TYPES } from '../../../services/dbService';
import { EventEmitter } from '../../utils/EventEmitter';

/**
 * 数据源管理组件
 * 用于管理和测试系统中的数据库连接
 */
const DataSourceManager = () => {
  const [dataSources, setDataSources] = useState([]);
  const [selectedDataSource, setSelectedDataSource] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isTestDialogOpen, setIsTestDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [testQuery, setTestQuery] = useState('SELECT 1 AS test');
  const [testResult, setTestResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [connectionStatuses, setConnectionStatuses] = useState({});
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);

  // 数据库类型选项
  const dbTypeOptions = [
    { value: 'mariadb', label: 'MariaDB' },
    { value: 'mysql', label: 'MySQL' },
    { value: 'postgres', label: 'PostgreSQL' },
    { value: 'mssql', label: 'Microsoft SQL Server' },
    { value: 'oracle', label: 'Oracle' },
    { value: 'sqlite', label: 'SQLite' }
  ];

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
      setConnectionStatuses(prev => ({
        ...prev,
        [dataSource.id]: event.newStatus
      }));
    }
  }, [dataSources]);

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
          // 内联检查连接状态，避免依赖循环
          const config = {
            type: ds.type,
            host: ds.host,
            port: ds.port,
            database: ds.database,
            username: ds.username,
            password: ds.password
          };

          const status = dbService.getConnectionStatus(config);

          setConnectionStatuses(prev => ({
            ...prev,
            [ds.id]: status
          }));
        });
      } else {
        // 默认数据源
        const defaultDataSources = [
          {
            id: '1',
            name: 'MariaDB默认数据源',
            type: 'mariadb',
            host: 'localhost',
            port: 3306,
            database: 'zziot',
            username: 'root',
            password: '',
            isDefault: true,
            // 高级选项
            connectionLimit: 10,
            queueLimit: 0,
            connectTimeout: 10000,
            timezone: 'local',
            charset: 'utf8mb4',
            dateStrings: true
          }
        ];
        setDataSources(defaultDataSources);
        localStorage.setItem('dataSources', JSON.stringify(defaultDataSources));
      }
    } catch (error) {
      console.error('获取数据源配置失败:', error);
    }
  }, []);

  // 初始化
  useEffect(() => {
    loadDataSources();

    // 监听数据库连接状态变化
    const statusChangedListener = EventEmitter.addEventListener(
      DB_EVENTS.STATUS_CHANGED,
      handleConnectionStatusChanged
    );

    // 定期刷新连接状态
    const statusInterval = setInterval(() => {
      dataSources.forEach(ds => {
        checkConnectionStatus(ds);
      });
    }, 30000); // 每30秒刷新一次

    return () => {
      EventEmitter.removeEventListener(statusChangedListener);
      clearInterval(statusInterval);
    };
  }, [loadDataSources, dataSources, handleConnectionStatusChanged]);



  // 手动刷新连接状态
  const refreshConnectionStatuses = () => {
    dataSources.forEach(ds => {
      checkConnectionStatus(ds);
    });
    setRefreshKey(prev => prev + 1);
  };





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

    setConnectionStatuses(prev => ({
      ...prev,
      [dataSource.id]: status
    }));
  }, []);

  // 保存数据源配置
  const saveDataSources = (newDataSources) => {
    try {
      localStorage.setItem('dataSources', JSON.stringify(newDataSources));
      setDataSources(newDataSources);
    } catch (error) {
      console.error('保存数据源配置失败:', error);
    }
  };

  // 打开添加数据源对话框
  const handleOpenDialog = (dataSource = null) => {
    if (dataSource) {
      setSelectedDataSource({
        ...dataSource
      });
      setShowAdvancedOptions(!!dataSource.connectionLimit); // 如果有高级选项，则显示高级选项面板
    } else {
      // 创建新数据源
      setSelectedDataSource({
        id: `ds-${Date.now()}`,
        name: '',
        type: 'mariadb',
        host: 'localhost',
        port: 3306,
        database: '',
        username: '',
        password: '',
        isDefault: false,
        // 高级选项默认值
        connectionLimit: 10,
        queueLimit: 0,
        connectTimeout: 10000,
        timezone: 'local',
        charset: 'utf8mb4',
        dateStrings: true
      });
      setShowAdvancedOptions(false);
    }

    setIsDialogOpen(true);
    setFormErrors({});
    setActiveTab(0); // 重置为基本信息标签页
  };

  // 关闭数据源对话框
  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedDataSource(null);
  };

  // 处理数据源表单字段变更
  const handleFormChange = (field, value) => {
    setSelectedDataSource({
      ...selectedDataSource,
      [field]: value
    });

    // 清除字段错误
    if (formErrors[field]) {
      setFormErrors({
        ...formErrors,
        [field]: null
      });
    }
  };

  // 验证数据源表单
  const validateForm = () => {
    const errors = {};

    if (!selectedDataSource.name) {
      errors.name = '数据源名称不能为空';
    }

    if (!selectedDataSource.host) {
      errors.host = '主机地址不能为空';
    }

    if (!selectedDataSource.port) {
      errors.port = '端口不能为空';
    } else if (isNaN(selectedDataSource.port)) {
      errors.port = '端口必须是数字';
    }

    if (!selectedDataSource.database) {
      errors.database = '数据库名称不能为空';
    }

    if (!selectedDataSource.username) {
      errors.username = '用户名不能为空';
    }

    // 验证高级选项
    if (showAdvancedOptions) {
      if (selectedDataSource.connectionLimit && (isNaN(selectedDataSource.connectionLimit) || selectedDataSource.connectionLimit < 1)) {
        errors.connectionLimit = '连接池大小必须是大于0的数字';
      }

      if (selectedDataSource.queueLimit && isNaN(selectedDataSource.queueLimit)) {
        errors.queueLimit = '队列限制必须是数字';
      }

      if (selectedDataSource.connectTimeout && (isNaN(selectedDataSource.connectTimeout) || selectedDataSource.connectTimeout < 1000)) {
        errors.connectTimeout = '连接超时必须是大于1000的数字（毫秒）';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // 处理标签页切换
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // 保存数据源
  const handleSaveDataSource = () => {
    if (!validateForm()) {
      return;
    }

    // 如果设置为默认，将其他数据源的默认状态设为false
    let newDataSources = [...dataSources];
    if (selectedDataSource.isDefault) {
      newDataSources = newDataSources.map(ds => ({
        ...ds,
        isDefault: false
      }));
    }

    // 检查是否是编辑现有数据源
    const existingIndex = newDataSources.findIndex(ds => ds.id === selectedDataSource.id);

    if (existingIndex >= 0) {
      // 更新现有数据源
      newDataSources[existingIndex] = selectedDataSource;
    } else {
      // 添加新数据源
      newDataSources.push(selectedDataSource);
    }

    // 如果没有默认数据源，将第一个设为默认
    if (!newDataSources.some(ds => ds.isDefault)) {
      newDataSources[0].isDefault = true;
    }

    // 保存数据源配置
    saveDataSources(newDataSources);

    // 关闭对话框
    handleCloseDialog();
  };

  // 打开测试对话框
  const handleOpenTestDialog = (dataSource) => {
    setSelectedDataSource(dataSource);
    setTestQuery('SELECT 1 AS test');
    setTestResult(null);
    setIsTestDialogOpen(true);
  };

  // 关闭测试对话框
  const handleCloseTestDialog = () => {
    setIsTestDialogOpen(false);
    setSelectedDataSource(null);
    setTestResult(null);
  };

  // 处理测试查询变更
  const handleTestQueryChange = (e) => {
    setTestQuery(e.target.value);
  };

  // 测试数据源连接
  const handleTestConnection = async () => {
    if (!selectedDataSource) return;

    setIsLoading(true);
    setTestResult(null);

    try {
      // 构建数据源配置
      const dataSourceConfig = {
        type: selectedDataSource.type,
        host: selectedDataSource.host,
        port: selectedDataSource.port,
        database: selectedDataSource.database,
        username: selectedDataSource.username,
        password: selectedDataSource.password
      };

      // 显示测试中状态
      setTestResult({
        testing: true,
        message: '正在测试连接...'
      });

      // 第一步：测试连接
      const connectionTestResult = await dbService.testConnection(dataSourceConfig);

      // 如果连接测试失败，直接返回错误
      if (!connectionTestResult.success) {
        setTestResult({
          success: false,
          error: connectionTestResult.message,
          errorStage: '连接测试',
          testing: false,
          responseTime: connectionTestResult.responseTime
        });
        return;
      }

      // 更新测试状态
      setTestResult({
        testing: true,
        connectionTest: {
          success: true,
          message: '数据库连接成功',
          details: connectionTestResult.data,
          responseTime: connectionTestResult.responseTime
        },
        message: '正在执行查询测试...'
      });

      // 第二步：测试查询
      try {
        const startTime = Date.now();
        const queryResult = await dbService.query(dataSourceConfig, testQuery);
        const queryTime = Date.now() - startTime;

        // 设置最终测试结果
        setTestResult({
          success: true,
          connectionTest: {
            success: true,
            message: '数据库连接成功',
            details: connectionTestResult.data,
            responseTime: connectionTestResult.responseTime
          },
          queryTest: {
            success: true,
            message: '查询执行成功',
            data: queryResult,
            rowCount: queryResult.length,
            queryTime
          },
          testing: false
        });
      } catch (queryError) {
        // 查询测试失败
        setTestResult({
          success: false,
          connectionTest: {
            success: true,
            message: '数据库连接成功',
            details: connectionTestResult.data,
            responseTime: connectionTestResult.responseTime
          },
          error: queryError.message,
          errorStage: '查询测试',
          testing: false
        });
      }
    } catch (error) {
      console.error('测试数据源连接失败:', error);

      // 确定错误阶段和消息
      let errorStage = '连接测试';
      let errorMessage = error.message || '测试连接失败';

      if (testResult && testResult.connectionTest && testResult.connectionTest.success) {
        errorStage = '查询测试';
      }

      setTestResult({
        success: false,
        error: errorMessage,
        errorStage: errorStage,
        testing: false
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 打开删除确认对话框
  const handleOpenDeleteDialog = (dataSource) => {
    setSelectedDataSource(dataSource);
    setIsDeleteDialogOpen(true);
  };

  // 关闭删除确认对话框
  const handleCloseDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
    setSelectedDataSource(null);
  };

  // 删除数据源
  const handleDeleteDataSource = () => {
    if (!selectedDataSource) return;

    // 不允许删除默认数据源
    if (selectedDataSource.isDefault) {
      alert('不能删除默认数据源');
      handleCloseDeleteDialog();
      return;
    }

    // 过滤掉要删除的数据源
    const newDataSources = dataSources.filter(ds => ds.id !== selectedDataSource.id);

    // 如果删除后没有默认数据源，将第一个设为默认
    if (newDataSources.length > 0 && !newDataSources.some(ds => ds.isDefault)) {
      newDataSources[0].isDefault = true;
    }

    // 保存数据源配置
    saveDataSources(newDataSources);

    // 关闭对话框
    handleCloseDeleteDialog();
  };

  // 设置为默认数据源
  const handleSetAsDefault = (dataSource) => {
    // 更新数据源的默认状态
    const newDataSources = dataSources.map(ds => ({
      ...ds,
      isDefault: ds.id === dataSource.id
    }));

    // 保存数据源配置
    saveDataSources(newDataSources);
  };

  return (
    <Box sx={{ p: 0 }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5">数据库配置</Typography>
        <Box>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<RefreshIcon />}
            onClick={refreshConnectionStatuses}
            sx={{ mr: 1 }}
          >
            刷新连接状态
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            添加数据库
          </Button>
        </Box>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>名称</TableCell>
              <TableCell>类型</TableCell>
              <TableCell>主机</TableCell>
              <TableCell>端口</TableCell>
              <TableCell>数据库</TableCell>
              <TableCell>用户名</TableCell>
              <TableCell>状态</TableCell>
              <TableCell>操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {dataSources.length > 0 ? (
              dataSources.map((dataSource) => (
                <TableRow key={dataSource.id}>
                  <TableCell>{dataSource.name}</TableCell>
                  <TableCell>
                    {dbTypeOptions.find(opt => opt.value === dataSource.type)?.label || dataSource.type}
                  </TableCell>
                  <TableCell>{dataSource.host}</TableCell>
                  <TableCell>{dataSource.port}</TableCell>
                  <TableCell>{dataSource.database}</TableCell>
                  <TableCell>{dataSource.username}</TableCell>
                  <TableCell>
                    {connectionStatuses[dataSource.id] ? (
                      <Tooltip title={
                        connectionStatuses[dataSource.id].status === DB_STATUS.CONNECTED
                          ? '连接正常'
                          : connectionStatuses[dataSource.id].status === DB_STATUS.ERROR
                            ? `连接错误: ${connectionStatuses[dataSource.id].error}`
                            : connectionStatuses[dataSource.id].status === DB_STATUS.CONNECTING
                              ? '正在连接...'
                              : '未连接'
                      }>
                        <Chip
                          label={
                            connectionStatuses[dataSource.id].status === DB_STATUS.CONNECTED
                              ? '已连接'
                              : connectionStatuses[dataSource.id].status === DB_STATUS.ERROR
                                ? '错误'
                                : connectionStatuses[dataSource.id].status === DB_STATUS.CONNECTING
                                  ? '连接中'
                                  : '未连接'
                          }
                          color={
                            connectionStatuses[dataSource.id].status === DB_STATUS.CONNECTED
                              ? 'success'
                              : connectionStatuses[dataSource.id].status === DB_STATUS.ERROR
                                ? 'error'
                                : connectionStatuses[dataSource.id].status === DB_STATUS.CONNECTING
                                  ? 'warning'
                                  : 'default'
                          }
                          size="small"
                          icon={
                            connectionStatuses[dataSource.id].status === DB_STATUS.CONNECTED
                              ? <CheckCircleIcon fontSize="small" />
                              : connectionStatuses[dataSource.id].status === DB_STATUS.ERROR
                                ? <CancelIcon fontSize="small" />
                                : null
                          }
                        />
                      </Tooltip>
                    ) : (
                      <Chip
                        label="未知"
                        color="default"
                        size="small"
                      />
                    )}
                    {dataSource.isDefault && (
                      <Chip
                        label="默认"
                        color="primary"
                        size="small"
                        sx={{ ml: 1 }}
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    <IconButton size="small" onClick={() => handleOpenTestDialog(dataSource)}>
                      <TestIcon />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleOpenDialog(dataSource)}>
                      <EditIcon />
                    </IconButton>
                    {!dataSource.isDefault && (
                      <IconButton size="small" onClick={() => handleSetAsDefault(dataSource)}>
                        <CheckCircleIcon />
                      </IconButton>
                    )}
                    {!dataSource.isDefault && (
                      <IconButton size="small" onClick={() => handleOpenDeleteDialog(dataSource)}>
                        <DeleteIcon />
                      </IconButton>
                    )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  没有找到数据源
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* 数据源编辑对话框 */}
      <Dialog open={isDialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedDataSource && dataSources.some(ds => ds.id === selectedDataSource.id) ? '编辑数据源' : '添加数据源'}
        </DialogTitle>
        <DialogContent>
          {selectedDataSource && (
            <>
              <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                <Tabs value={activeTab} onChange={handleTabChange}>
                  <Tab label="基本信息" icon={<StorageIcon />} iconPosition="start" />
                  <Tab label="高级选项" icon={<SettingsIcon />} iconPosition="start" />
                </Tabs>
              </Box>

              {/* 基本信息标签页 */}
              {activeTab === 0 && (
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="数据源名称"
                      fullWidth
                      value={selectedDataSource.name}
                      onChange={(e) => handleFormChange('name', e.target.value)}
                      error={!!formErrors.name}
                      helperText={formErrors.name}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>数据库类型</InputLabel>
                      <Select
                        value={selectedDataSource.type}
                        onChange={(e) => handleFormChange('type', e.target.value)}
                        label="数据库类型"
                      >
                        {dbTypeOptions.map(option => (
                          <MenuItem key={option.value} value={option.value}>
                            {option.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="主机地址"
                      fullWidth
                      value={selectedDataSource.host}
                      onChange={(e) => handleFormChange('host', e.target.value)}
                      error={!!formErrors.host}
                      helperText={formErrors.host}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="端口"
                      fullWidth
                      type="number"
                      value={selectedDataSource.port}
                      onChange={(e) => handleFormChange('port', parseInt(e.target.value) || '')}
                      error={!!formErrors.port}
                      helperText={formErrors.port}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      label="数据库名称"
                      fullWidth
                      value={selectedDataSource.database}
                      onChange={(e) => handleFormChange('database', e.target.value)}
                      error={!!formErrors.database}
                      helperText={formErrors.database}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="用户名"
                      fullWidth
                      value={selectedDataSource.username}
                      onChange={(e) => handleFormChange('username', e.target.value)}
                      error={!!formErrors.username}
                      helperText={formErrors.username}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="密码"
                      fullWidth
                      type="password"
                      value={selectedDataSource.password}
                      onChange={(e) => handleFormChange('password', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={selectedDataSource.isDefault}
                          onChange={(e) => handleFormChange('isDefault', e.target.checked)}
                        />
                      }
                      label="设为默认数据源"
                    />
                  </Grid>
                </Grid>
              )}

              {/* 高级选项标签页 */}
              {activeTab === 1 && (
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Alert severity="info" sx={{ mb: 2 }}>
                      高级选项用于配置数据库连接的性能和行为。如果不确定，请保留默认值。
                    </Alert>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="连接池大小"
                      fullWidth
                      type="number"
                      value={selectedDataSource.connectionLimit || 10}
                      onChange={(e) => handleFormChange('connectionLimit', parseInt(e.target.value) || 10)}
                      error={!!formErrors.connectionLimit}
                      helperText={formErrors.connectionLimit || '最大并发连接数'}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="队列限制"
                      fullWidth
                      type="number"
                      value={selectedDataSource.queueLimit || 0}
                      onChange={(e) => handleFormChange('queueLimit', parseInt(e.target.value) || 0)}
                      error={!!formErrors.queueLimit}
                      helperText={formErrors.queueLimit || '0表示无限制'}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="连接超时(毫秒)"
                      fullWidth
                      type="number"
                      value={selectedDataSource.connectTimeout || 10000}
                      onChange={(e) => handleFormChange('connectTimeout', parseInt(e.target.value) || 10000)}
                      error={!!formErrors.connectTimeout}
                      helperText={formErrors.connectTimeout || '建立连接的超时时间'}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>时区</InputLabel>
                      <Select
                        value={selectedDataSource.timezone || 'local'}
                        onChange={(e) => handleFormChange('timezone', e.target.value)}
                        label="时区"
                      >
                        <MenuItem value="local">本地时区</MenuItem>
                        <MenuItem value="+08:00">UTC+8 (北京时间)</MenuItem>
                        <MenuItem value="Z">UTC</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>字符集</InputLabel>
                      <Select
                        value={selectedDataSource.charset || 'utf8mb4'}
                        onChange={(e) => handleFormChange('charset', e.target.value)}
                        label="字符集"
                      >
                        <MenuItem value="utf8mb4">utf8mb4 (推荐)</MenuItem>
                        <MenuItem value="utf8">utf8</MenuItem>
                        <MenuItem value="latin1">latin1</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={selectedDataSource.dateStrings === undefined ? true : selectedDataSource.dateStrings}
                          onChange={(e) => handleFormChange('dateStrings', e.target.checked)}
                        />
                      }
                      label="日期以字符串形式返回"
                    />
                  </Grid>
                </Grid>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>取消</Button>
          <Button onClick={handleSaveDataSource} variant="contained" color="primary">
            保存
          </Button>
        </DialogActions>
      </Dialog>

      {/* 数据源测试对话框 */}
      <Dialog open={isTestDialogOpen} onClose={handleCloseTestDialog} maxWidth="md" fullWidth>
        <DialogTitle>测试数据库连接: {selectedDataSource?.name}</DialogTitle>
        <DialogContent>
          {selectedDataSource && (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      数据库信息
                    </Typography>
                    <Grid container spacing={1}>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2">
                          <strong>类型:</strong> {dbTypeOptions.find(opt => opt.value === selectedDataSource.type)?.label || selectedDataSource.type}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2">
                          <strong>主机:</strong> {selectedDataSource.host}:{selectedDataSource.port}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2">
                          <strong>数据库:</strong> {selectedDataSource.database}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2">
                          <strong>用户名:</strong> {selectedDataSource.username}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="subtitle1" gutterBottom>
                    测试SQL查询
                  </Typography>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    value={testQuery}
                    onChange={handleTestQueryChange}
                    sx={{ mb: 2 }}
                    placeholder="输入SQL查询语句，例如: SELECT 1 AS test"
                  />
                </Grid>
              </Grid>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleTestConnection}
                  disabled={isLoading}
                  startIcon={isLoading ? <CircularProgress size={20} /> : <TestIcon />}
                >
                  {isLoading ? '测试中...' : '测试数据库连接'}
                </Button>

                <Button
                  variant="outlined"
                  onClick={handleCloseTestDialog}
                >
                  关闭
                </Button>
              </Box>

              {testResult && testResult.testing && (
                <Box sx={{ mt: 2, mb: 2 }}>
                  <Alert severity="info" sx={{ mb: 2 }}>
                    <CircularProgress size={16} sx={{ mr: 1 }} />
                    {testResult.message}
                  </Alert>
                </Box>
              )}

              {testResult && !testResult.testing && (
                <Box sx={{ mt: 2 }}>
                  {/* 连接测试结果 */}
                  {testResult.connectionTest ? (
                    <Alert
                      severity={testResult.connectionTest.success ? 'success' : 'error'}
                      sx={{ mb: 2 }}
                    >
                      {testResult.connectionTest.message}
                    </Alert>
                  ) : testResult.errorStage === '连接测试' ? (
                    <Alert severity="error" sx={{ mb: 2 }}>
                      连接失败: {testResult.error}
                    </Alert>
                  ) : null}

                  {/* 查询测试结果 */}
                  {testResult.queryTest ? (
                    <Box>
                      <Alert
                        severity={testResult.queryTest.success ? 'success' : 'error'}
                        sx={{ mb: 2 }}
                      >
                        {testResult.queryTest.message}
                      </Alert>

                      <Typography variant="subtitle1" gutterBottom>
                        查询结果:
                      </Typography>
                      <Paper sx={{ p: 2, maxHeight: '300px', overflow: 'auto' }}>
                        <pre>{JSON.stringify(testResult.queryTest.data, null, 2)}</pre>
                      </Paper>
                    </Box>
                  ) : testResult.errorStage === '查询测试' ? (
                    <Alert severity="error" sx={{ mb: 2 }}>
                      查询失败: {testResult.error}
                    </Alert>
                  ) : null}
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框 */}
      <Dialog open={isDeleteDialogOpen} onClose={handleCloseDeleteDialog}>
        <DialogTitle>删除数据源</DialogTitle>
        <DialogContent>
          <Typography>
            确定要删除数据源 "{selectedDataSource?.name}" 吗？此操作不可撤销。
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>取消</Button>
          <Button onClick={handleDeleteDataSource} color="error">
            删除
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DataSourceManager;
