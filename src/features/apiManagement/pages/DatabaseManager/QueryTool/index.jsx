import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  Divider,
  TextField,
  IconButton,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  Grid,
  Chip,
  Card,
  CardContent,
  CardActions,
  FormControlLabel,
  Switch
} from '@mui/material';
import {
  PlayArrow as ExecuteIcon,
  Save as SaveIcon,
  History as HistoryIcon,
  Bookmark as BookmarkIcon,
  BookmarkBorder as BookmarkBorderIcon,
  Clear as ClearIcon,
  GetApp as DownloadIcon,
  MoreVert as MoreIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Add as AddIcon,
  Storage as DatabaseIcon,
  Code as CodeIcon,
  Settings as SettingsIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useDatabase } from '../utils/DatabaseContext';

// 简单的SQL编辑器组件
const SqlEditor = ({ value, onChange, placeholder, error }) => {
  return (
    <TextField
      fullWidth
      multiline
      rows={8}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      error={!!error}
      helperText={error}
      variant="outlined"
      sx={{
        fontFamily: 'monospace',
        '& .MuiInputBase-input': {
          fontFamily: 'monospace',
        }
      }}
    />
  );
};

/**
 * 查询工具组件
 * 用于执行SQL查询并显示结果
 */
const QueryTool = () => {
  const {
    dbConnections,
    activeConnection,
    setActiveConnectionById,
    queryHistory,
    savedQueries,
    addOrUpdateConnection,
    deleteConnection,
    testConnection,
    executeQuery,
    addQueryHistory,
    saveQuery,
    updateSavedQuery,
    deleteSavedQuery
  } = useDatabase();

  // 状态
  const [sql, setSql] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [queryResult, setQueryResult] = useState(null);
  const [queryError, setQueryError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [historyAnchorEl, setHistoryAnchorEl] = useState(null);
  const [savedAnchorEl, setSavedAnchorEl] = useState(null);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [connectionDialogOpen, setConnectionDialogOpen] = useState(false);
  const [queryName, setQueryName] = useState('');
  const [queryDescription, setQueryDescription] = useState('');
  const [selectedConnectionId, setSelectedConnectionId] = useState('');
  const [selectedConnection, setSelectedConnection] = useState(null);
  const [connectionFormErrors, setConnectionFormErrors] = useState({});
  const [testResult, setTestResult] = useState(null);
  const [isTesting, setIsTesting] = useState(false);
  const [queryParams, setQueryParams] = useState([]);
  const [paramDialogOpen, setParamDialogOpen] = useState(false);
  const [currentParam, setCurrentParam] = useState({ name: '', type: 'string', defaultValue: '' });
  const [paramFormErrors, setParamFormErrors] = useState({});

  // 引用
  const sqlEditorRef = useRef(null);

  // 初始化
  useEffect(() => {
    if (activeConnection) {
      setSelectedConnectionId(activeConnection.id);
    } else if (dbConnections.length > 0) {
      const defaultConnection = dbConnections.find(conn => conn.isDefault) || dbConnections[0];
      setSelectedConnectionId(defaultConnection.id);
      setActiveConnectionById(defaultConnection.id);
    }
  }, [activeConnection, dbConnections, setActiveConnectionById]);

  // 处理连接变更
  const handleConnectionChange = (event) => {
    const connectionId = event.target.value;
    setSelectedConnectionId(connectionId);
    setActiveConnectionById(connectionId);
  };

  // 处理SQL变更
  const handleSqlChange = (value) => {
    setSql(value);
    setQueryError(null);
  };

  // 处理标签页切换
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // 处理页码变更
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  // 处理每页行数变更
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // 执行查询
  const executeQueryHandler = async () => {
    if (!sql.trim()) {
      setQueryError('SQL查询不能为空');
      return;
    }

    if (!selectedConnectionId) {
      setQueryError('请选择数据库连接');
      return;
    }

    const connection = dbConnections.find(conn => conn.id === selectedConnectionId);
    if (!connection) {
      setQueryError('数据库连接不存在');
      return;
    }

    setIsExecuting(true);
    setQueryError(null);
    setQueryResult(null);

    try {
      // 替换查询参数
      let processedSql = sql;
      let processedParams = [];

      if (queryParams.length > 0) {
        // 使用命名参数替换
        queryParams.forEach(param => {
          const paramPlaceholder = `:${param.name}`;
          if (processedSql.includes(paramPlaceholder)) {
            // 替换为?占位符
            processedSql = processedSql.replace(new RegExp(paramPlaceholder, 'g'), '?');
            // 添加参数值
            processedParams.push(param.defaultValue);
          }
        });
      }

      // 执行查询
      const startTime = Date.now();
      const result = await executeQuery(connection, processedSql, processedParams);
      const endTime = Date.now();

      // 设置查询结果
      setQueryResult({
        rows: result.rows || [],
        fields: result.fields || [],
        executionTime: endTime - startTime,
        rowCount: result.rows?.length || 0,
        timestamp: new Date().toISOString()
      });

      // 添加到查询历史
      addQueryHistory({
        id: `query-${Date.now()}`,
        sql,
        params: queryParams,
        connectionId: connection.id,
        connectionName: connection.name,
        timestamp: new Date().toISOString(),
        executionTime: endTime - startTime,
        rowCount: result.rows?.length || 0
      });

      // 重置页码
      setPage(0);
    } catch (error) {
      console.error('执行查询失败:', error);
      setQueryError(error.message);
    } finally {
      setIsExecuting(false);
    }
  };

  // 清除查询
  const clearQuery = () => {
    setSql('');
    setQueryResult(null);
    setQueryError(null);
  };

  // 打开历史菜单
  const handleHistoryClick = (event) => {
    setHistoryAnchorEl(event.currentTarget);
  };

  // 关闭历史菜单
  const handleHistoryClose = () => {
    setHistoryAnchorEl(null);
  };

  // 打开保存的查询菜单
  const handleSavedClick = (event) => {
    setSavedAnchorEl(event.currentTarget);
  };

  // 关闭保存的查询菜单
  const handleSavedClose = () => {
    setSavedAnchorEl(null);
  };

  // 从历史中加载查询
  const loadQueryFromHistory = (query) => {
    setSql(query.sql);
    if (query.params) {
      setQueryParams(query.params);
    }
    if (query.connectionId) {
      setSelectedConnectionId(query.connectionId);
      setActiveConnectionById(query.connectionId);
    }
    handleHistoryClose();
  };

  // 从保存的查询中加载
  const loadSavedQuery = (query) => {
    setSql(query.sql);
    if (query.params) {
      setQueryParams(query.params);
    }
    if (query.connectionId) {
      setSelectedConnectionId(query.connectionId);
      setActiveConnectionById(query.connectionId);
    }
    handleSavedClose();
  };

  // 打开保存查询对话框
  const handleOpenSaveDialog = () => {
    if (!sql.trim()) {
      setQueryError('SQL查询不能为空');
      return;
    }
    setQueryName('');
    setQueryDescription('');
    setSaveDialogOpen(true);
  };

  // 关闭保存查询对话框
  const handleCloseSaveDialog = () => {
    setSaveDialogOpen(false);
  };

  // 保存查询
  const handleSaveQuery = () => {
    if (!queryName.trim()) {
      return;
    }

    saveQuery({
      id: `saved-${Date.now()}`,
      name: queryName,
      description: queryDescription,
      sql,
      params: queryParams,
      connectionId: selectedConnectionId,
      connectionName: dbConnections.find(conn => conn.id === selectedConnectionId)?.name,
      timestamp: new Date().toISOString()
    });

    setSaveDialogOpen(false);
  };

  // 删除保存的查询
  const handleDeleteSavedQuery = (queryId) => {
    deleteSavedQuery(queryId);
  };

  // 导出查询结果为CSV
  const exportToCsv = () => {
    if (!queryResult || !queryResult.rows || queryResult.rows.length === 0) {
      return;
    }

    // 获取字段名
    const fields = queryResult.fields.map(field => field.name || '');

    // 构建CSV内容
    let csvContent = fields.join(',') + '\n';

    // 添加数据行
    queryResult.rows.forEach(row => {
      const values = fields.map(field => {
        const value = row[field];
        // 处理特殊字符
        if (value === null || value === undefined) {
          return '';
        } else if (typeof value === 'string') {
          return `"${value.replace(/"/g, '""')}"`;
        } else {
          return value;
        }
      });
      csvContent += values.join(',') + '\n';
    });

    // 创建下载链接
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `query-result-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 打开数据库连接对话框
  const handleOpenConnectionDialog = (connection = null) => {
    if (connection) {
      setSelectedConnection({
        ...connection
      });
    } else {
      // 创建新连接
      setSelectedConnection({
        id: `conn-${Date.now()}`,
        name: '',
        host: 'localhost',
        port: 3306,
        database: '',
        username: '',
        password: '',
        isDefault: false
      });
    }

    setConnectionFormErrors({});
    setConnectionDialogOpen(true);
  };

  // 关闭数据库连接对话框
  const handleCloseConnectionDialog = () => {
    setConnectionDialogOpen(false);
    setSelectedConnection(null);
    setTestResult(null);
  };

  // 处理连接表单字段变更
  const handleConnectionFormChange = (field, value) => {
    setSelectedConnection({
      ...selectedConnection,
      [field]: field === 'port' ? (value ? parseInt(value) : '') : value
    });

    // 清除字段错误
    if (connectionFormErrors[field]) {
      setConnectionFormErrors({
        ...connectionFormErrors,
        [field]: null
      });
    }
  };

  // 验证连接表单
  const validateConnectionForm = () => {
    const errors = {};

    if (!selectedConnection.name) {
      errors.name = '连接名称不能为空';
    }

    if (!selectedConnection.host) {
      errors.host = '主机地址不能为空';
    }

    if (!selectedConnection.port) {
      errors.port = '端口不能为空';
    } else if (isNaN(selectedConnection.port)) {
      errors.port = '端口必须是数字';
    }

    if (!selectedConnection.database) {
      errors.database = '数据库名称不能为空';
    }

    if (!selectedConnection.username) {
      errors.username = '用户名不能为空';
    }

    setConnectionFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // 保存数据库连接
  const handleSaveConnection = () => {
    if (!validateConnectionForm()) {
      return;
    }

    // 保存连接配置
    addOrUpdateConnection(selectedConnection);

    // 关闭对话框
    handleCloseConnectionDialog();
  };

  // 测试数据库连接
  const handleTestConnection = async () => {
    if (!validateConnectionForm()) {
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      const result = await testConnection(selectedConnection);
      setTestResult({
        success: result.success,
        message: result.message,
        data: result.data,
        version: result.version,
        responseTime: result.responseTime
      });
    } catch (error) {
      setTestResult({
        success: false,
        message: `连接测试失败: ${error.message}`,
        error: error.message
      });
    } finally {
      setIsTesting(false);
    }
  };

  // 打开参数对话框
  const handleOpenParamDialog = (param = null) => {
    if (param) {
      setCurrentParam({ ...param });
    } else {
      setCurrentParam({ name: '', type: 'string', defaultValue: '' });
    }

    setParamFormErrors({});
    setParamDialogOpen(true);
  };

  // 关闭参数对话框
  const handleCloseParamDialog = () => {
    setParamDialogOpen(false);
  };

  // 处理参数表单字段变更
  const handleParamFormChange = (field, value) => {
    setCurrentParam({
      ...currentParam,
      [field]: value
    });

    // 清除字段错误
    if (paramFormErrors[field]) {
      setParamFormErrors({
        ...paramFormErrors,
        [field]: null
      });
    }
  };

  // 验证参数表单
  const validateParamForm = () => {
    const errors = {};

    if (!currentParam.name) {
      errors.name = '参数名称不能为空';
    } else if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(currentParam.name)) {
      errors.name = '参数名称必须以字母开头，只能包含字母、数字和下划线';
    } else {
      // 检查是否有重名参数（编辑时除外）
      const existingParam = queryParams.find(p => p.name === currentParam.name);
      if (existingParam && !queryParams.some(p => p === currentParam)) {
        errors.name = '参数名称已存在';
      }
    }

    if (!currentParam.type) {
      errors.type = '参数类型不能为空';
    }

    setParamFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // 保存参数
  const handleSaveParam = () => {
    if (!validateParamForm()) {
      return;
    }

    // 检查是否是编辑现有参数
    const existingIndex = queryParams.findIndex(p => p.name === currentParam.name);

    if (existingIndex >= 0) {
      // 更新现有参数
      const newParams = [...queryParams];
      newParams[existingIndex] = currentParam;
      setQueryParams(newParams);
    } else {
      // 添加新参数
      setQueryParams([...queryParams, currentParam]);
    }

    // 关闭对话框
    handleCloseParamDialog();
  };

  // 删除参数
  const handleDeleteParam = (paramName) => {
    setQueryParams(queryParams.filter(p => p.name !== paramName));
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* 顶部工具栏 */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <FormControl fullWidth variant="outlined" size="small" sx={{ mr: 1 }}>
                <InputLabel id="connection-select-label">数据库连接</InputLabel>
                <Select
                  labelId="connection-select-label"
                  value={selectedConnectionId}
                  onChange={handleConnectionChange}
                  label="数据库连接"
                >
                  {dbConnections.map((conn) => (
                    <MenuItem key={conn.id} value={conn.id}>
                      {conn.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Tooltip title="管理数据库连接">
                <IconButton
                  color="primary"
                  onClick={() => handleOpenConnectionDialog()}
                  size="small"
                >
                  <SettingsIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                color="primary"
                startIcon={<HistoryIcon />}
                onClick={handleHistoryClick}
                sx={{ mr: 1 }}
                size="small"
              >
                历史
              </Button>
              <Button
                variant="outlined"
                color="primary"
                startIcon={<BookmarkIcon />}
                onClick={handleSavedClick}
                sx={{ mr: 1 }}
                size="small"
              >
                已保存
              </Button>
              <Button
                variant="outlined"
                color="inherit"
                startIcon={<ClearIcon />}
                onClick={clearQuery}
                sx={{ mr: 1 }}
                size="small"
              >
                清除
              </Button>
              <Button
                variant="outlined"
                color="primary"
                startIcon={<SaveIcon />}
                onClick={handleOpenSaveDialog}
                sx={{ mr: 1 }}
                size="small"
              >
                保存
              </Button>
              <Button
                variant="contained"
                color="primary"
                startIcon={isExecuting ? <CircularProgress size={20} /> : <ExecuteIcon />}
                onClick={executeQueryHandler}
                disabled={isExecuting}
                size="small"
              >
                执行
              </Button>
            </Box>
          </Grid>
        </Grid>

        {/* 查询参数 */}
        {queryParams.length > 0 && (
          <Box sx={{ mt: 2, mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              查询参数
            </Typography>
            <Grid container spacing={1}>
              {queryParams.map((param) => (
                <Grid item key={param.name}>
                  <Chip
                    label={`${param.name}: ${param.defaultValue}`}
                    onDelete={() => handleDeleteParam(param.name)}
                    onClick={() => handleOpenParamDialog(param)}
                    color="primary"
                    variant="outlined"
                  />
                </Grid>
              ))}
              <Grid item>
                <Chip
                  label="添加参数"
                  onClick={() => handleOpenParamDialog()}
                  color="primary"
                  icon={<AddIcon />}
                />
              </Grid>
            </Grid>
          </Box>
        )}

        <Box sx={{ mt: 2 }} ref={sqlEditorRef}>
          <SqlEditor
            value={sql}
            onChange={handleSqlChange}
            placeholder="输入SQL查询..."
            error={queryError}
          />
        </Box>
      </Paper>

      {/* 查询结果 */}
      <Paper sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={handleTabChange}>
            <Tab label="结果" />
            <Tab label="消息" />
          </Tabs>
        </Box>

        <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2 }}>
          {/* 结果标签页 */}
          {activeTab === 0 && (
            <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              {isExecuting ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                  <CircularProgress />
                </Box>
              ) : queryError ? (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {queryError}
                </Alert>
              ) : queryResult ? (
                <>
                  <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2">
                      查询完成，返回 {queryResult.rowCount} 行，耗时 {queryResult.executionTime} ms
                    </Typography>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<DownloadIcon />}
                      onClick={exportToCsv}
                      disabled={queryResult.rowCount === 0}
                    >
                      导出CSV
                    </Button>
                  </Box>

                  {queryResult.rowCount > 0 ? (
                    <>
                      <TableContainer sx={{ flexGrow: 1 }}>
                        <Table stickyHeader size="small">
                          <TableHead>
                            <TableRow>
                              {queryResult.fields.map((field, index) => (
                                <TableCell key={index}>
                                  {field.name}
                                </TableCell>
                              ))}
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {queryResult.rows
                              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                              .map((row, rowIndex) => (
                                <TableRow key={rowIndex}>
                                  {queryResult.fields.map((field, colIndex) => (
                                    <TableCell key={colIndex}>
                                      {row[field.name] === null ? (
                                        <span style={{ color: '#999' }}>NULL</span>
                                      ) : (
                                        String(row[field.name])
                                      )}
                                    </TableCell>
                                  ))}
                                </TableRow>
                              ))}
                          </TableBody>
                        </Table>
                      </TableContainer>

                      <TablePagination
                        rowsPerPageOptions={[10, 25, 50, 100]}
                        component="div"
                        count={queryResult.rowCount}
                        rowsPerPage={rowsPerPage}
                        page={page}
                        onPageChange={handleChangePage}
                        onRowsPerPageChange={handleChangeRowsPerPage}
                      />
                    </>
                  ) : (
                    <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
                      查询未返回任何数据
                    </Typography>
                  )}
                </>
              ) : (
                <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
                  输入SQL查询并点击执行按钮
                </Typography>
              )}
            </Box>
          )}

          {/* 消息标签页 */}
          {activeTab === 1 && (
            <Box>
              {queryError ? (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {queryError}
                </Alert>
              ) : queryResult ? (
                <Alert severity="success" sx={{ mb: 2 }}>
                  查询成功，返回 {queryResult.rowCount} 行，耗时 {queryResult.executionTime} ms
                </Alert>
              ) : null}
            </Box>
          )}
        </Box>
      </Paper>

      {/* 历史查询菜单 */}
      <Menu
        anchorEl={historyAnchorEl}
        open={Boolean(historyAnchorEl)}
        onClose={handleHistoryClose}
        PaperProps={{
          style: {
            maxHeight: 300,
            width: 400,
          },
        }}
      >
        {queryHistory.length > 0 ? (
          queryHistory.map((query) => (
            <MenuItem key={query.id} onClick={() => loadQueryFromHistory(query)}>
              <Box sx={{ width: '100%' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" noWrap sx={{ maxWidth: 250 }}>
                    {query.sql.substring(0, 50)}{query.sql.length > 50 ? '...' : ''}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    {new Date(query.timestamp).toLocaleString()}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', mt: 0.5 }}>
                  <Chip
                    label={query.connectionName}
                    size="small"
                    sx={{ mr: 1 }}
                  />
                  <Chip
                    label={`${query.rowCount} 行`}
                    size="small"
                    sx={{ mr: 1 }}
                  />
                  <Chip
                    label={`${query.executionTime} ms`}
                    size="small"
                  />
                </Box>
              </Box>
            </MenuItem>
          ))
        ) : (
          <MenuItem disabled>
            <Typography variant="body2" color="textSecondary">
              没有查询历史
            </Typography>
          </MenuItem>
        )}
      </Menu>

      {/* 保存的查询菜单 */}
      <Menu
        anchorEl={savedAnchorEl}
        open={Boolean(savedAnchorEl)}
        onClose={handleSavedClose}
        PaperProps={{
          style: {
            maxHeight: 300,
            width: 400,
          },
        }}
      >
        {savedQueries.length > 0 ? (
          savedQueries.map((query) => (
            <MenuItem key={query.id}>
              <Box sx={{ width: '100%' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" noWrap sx={{ maxWidth: 250 }}>
                    {query.name}
                  </Typography>
                  <Box>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        loadSavedQuery(query);
                      }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSavedQuery(query.id);
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
                {query.description && (
                  <Typography variant="caption" color="textSecondary" noWrap>
                    {query.description}
                  </Typography>
                )}
                <Box sx={{ display: 'flex', mt: 0.5 }}>
                  <Chip
                    label={query.connectionName}
                    size="small"
                    sx={{ mr: 1 }}
                  />
                  <Typography variant="caption" color="textSecondary">
                    {new Date(query.timestamp).toLocaleString()}
                  </Typography>
                </Box>
              </Box>
            </MenuItem>
          ))
        ) : (
          <MenuItem disabled>
            <Typography variant="body2" color="textSecondary">
              没有保存的查询
            </Typography>
          </MenuItem>
        )}
      </Menu>

      {/* 保存查询对话框 */}
      <Dialog
        open={saveDialogOpen}
        onClose={handleCloseSaveDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>保存查询</DialogTitle>
        <DialogContent>
          <TextField
            label="查询名称"
            fullWidth
            value={queryName}
            onChange={(e) => setQueryName(e.target.value)}
            margin="normal"
            required
          />
          <TextField
            label="描述"
            fullWidth
            multiline
            rows={2}
            value={queryDescription}
            onChange={(e) => setQueryDescription(e.target.value)}
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseSaveDialog} color="inherit">
            取消
          </Button>
          <Button
            onClick={handleSaveQuery}
            color="primary"
            variant="contained"
            disabled={!queryName.trim()}
          >
            保存
          </Button>
        </DialogActions>
      </Dialog>

      {/* 数据库连接对话框 */}
      <Dialog
        open={connectionDialogOpen}
        onClose={handleCloseConnectionDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {selectedConnection?.id.startsWith('conn-') ? '添加数据库连接' : '编辑数据库连接'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid sx={{ gridColumn: 'span 12' }}>
              <TextField
                label="连接名称"
                fullWidth
                value={selectedConnection?.name || ''}
                onChange={(e) => handleConnectionFormChange('name', e.target.value)}
                error={!!connectionFormErrors.name}
                helperText={connectionFormErrors.name}
                margin="normal"
              />
            </Grid>
            <Grid sx={{ gridColumn: { xs: 'span 12', sm: 'span 8' } }}>
              <TextField
                label="主机地址"
                fullWidth
                value={selectedConnection?.host || ''}
                onChange={(e) => handleConnectionFormChange('host', e.target.value)}
                error={!!connectionFormErrors.host}
                helperText={connectionFormErrors.host}
                margin="normal"
              />
            </Grid>
            <Grid sx={{ gridColumn: { xs: 'span 12', sm: 'span 4' } }}>
              <TextField
                label="端口"
                fullWidth
                type="number"
                value={selectedConnection?.port || ''}
                onChange={(e) => handleConnectionFormChange('port', e.target.value)}
                error={!!connectionFormErrors.port}
                helperText={connectionFormErrors.port}
                margin="normal"
              />
            </Grid>
            <Grid sx={{ gridColumn: 'span 12' }}>
              <TextField
                label="数据库名称"
                fullWidth
                value={selectedConnection?.database || ''}
                onChange={(e) => handleConnectionFormChange('database', e.target.value)}
                error={!!connectionFormErrors.database}
                helperText={connectionFormErrors.database}
                margin="normal"
              />
            </Grid>
            <Grid sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
              <TextField
                label="用户名"
                fullWidth
                value={selectedConnection?.username || ''}
                onChange={(e) => handleConnectionFormChange('username', e.target.value)}
                error={!!connectionFormErrors.username}
                helperText={connectionFormErrors.username}
                margin="normal"
              />
            </Grid>
            <Grid sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
              <TextField
                label="密码"
                fullWidth
                type="password"
                value={selectedConnection?.password || ''}
                onChange={(e) => handleConnectionFormChange('password', e.target.value)}
                margin="normal"
              />
            </Grid>
            <Grid sx={{ gridColumn: 'span 12' }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={selectedConnection?.isDefault || false}
                    onChange={(e) => handleConnectionFormChange('isDefault', e.target.checked)}
                  />
                }
                label="设为默认连接"
              />
            </Grid>
          </Grid>

          {testResult && (
            <Box sx={{ mt: 2 }}>
              <Alert severity={testResult.success ? 'success' : 'error'}>
                {testResult.message}
              </Alert>
              {testResult.success && testResult.version && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  数据库版本: {testResult.version}
                </Typography>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseConnectionDialog} color="inherit">
            取消
          </Button>
          <Button
            onClick={handleTestConnection}
            color="primary"
            disabled={isTesting}
            startIcon={isTesting ? <CircularProgress size={20} /> : <RefreshIcon />}
          >
            测试连接
          </Button>
          <Button
            onClick={handleSaveConnection}
            color="primary"
            variant="contained"
          >
            保存
          </Button>
        </DialogActions>
      </Dialog>

      {/* 参数对话框 */}
      <Dialog
        open={paramDialogOpen}
        onClose={handleCloseParamDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {currentParam.name ? '编辑参数' : '添加参数'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
              <TextField
                label="参数名称"
                fullWidth
                value={currentParam.name}
                onChange={(e) => handleParamFormChange('name', e.target.value)}
                error={!!paramFormErrors.name}
                helperText={paramFormErrors.name || '参数名称，用于在SQL中使用 :参数名'}
                margin="normal"
              />
            </Grid>
            <Grid sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
              <FormControl fullWidth margin="normal" error={!!paramFormErrors.type}>
                <InputLabel id="param-type-label">参数类型</InputLabel>
                <Select
                  labelId="param-type-label"
                  value={currentParam.type}
                  onChange={(e) => handleParamFormChange('type', e.target.value)}
                  label="参数类型"
                >
                  <MenuItem value="string">字符串</MenuItem>
                  <MenuItem value="number">数字</MenuItem>
                  <MenuItem value="boolean">布尔值</MenuItem>
                  <MenuItem value="date">日期</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid sx={{ gridColumn: 'span 12' }}>
              <TextField
                label="默认值"
                fullWidth
                value={currentParam.defaultValue}
                onChange={(e) => handleParamFormChange('defaultValue', e.target.value)}
                margin="normal"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseParamDialog} color="inherit">
            取消
          </Button>
          <Button
            onClick={handleSaveParam}
            color="primary"
            variant="contained"
          >
            保存
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default QueryTool;