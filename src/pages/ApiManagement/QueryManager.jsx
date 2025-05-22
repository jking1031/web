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
  Grid,
  Alert,
  CircularProgress,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tabs,
  Tab,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  PlayArrow as TestIcon,
  FileCopy as DuplicateIcon,
  Code as CodeIcon,
  ExpandMore as ExpandMoreIcon,
  Storage as StorageIcon,
  TableChart as TableChartIcon,
  Save as SaveIcon,
  Refresh as RefreshIcon,
  FormatListBulleted as ListIcon
} from '@mui/icons-material';
import JsonEditor from '../../../components/JsonEditor/JsonEditor';
import dbService, { DB_EVENTS, DB_STATUS } from '../../../services/dbService';

/**
 * 查询管理组件
 * 用于管理和测试数据库查询
 */
const QueryManager = () => {
  const [dataSources, setDataSources] = useState([]);
  const [queries, setQueries] = useState([]);
  const [selectedQuery, setSelectedQuery] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isTestDialogOpen, setIsTestDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [testParams, setTestParams] = useState('{}');
  const [testResult, setTestResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [activeTab, setActiveTab] = useState(0);
  const [tableInfo, setTableInfo] = useState([]);
  const [selectedTable, setSelectedTable] = useState('');
  const [tableColumns, setTableColumns] = useState([]);
  const [savedQueries, setSavedQueries] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);

  // 加载数据源和查询配置
  useEffect(() => {
    loadDataSources();
    loadQueries();
    loadSavedQueries();
  }, [refreshKey]);

  // 处理标签页切换
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);

    // 如果切换到数据库浏览标签页，加载表信息
    if (newValue === 1) {
      loadTableInfo();
    }
  };

  // 加载数据源配置
  const loadDataSources = () => {
    try {
      // 从本地存储获取数据源配置
      const savedDataSources = localStorage.getItem('dataSources');
      if (savedDataSources) {
        setDataSources(JSON.parse(savedDataSources));
      }
    } catch (error) {
      console.error('获取数据源配置失败:', error);
    }
  };

  // 加载查询配置
  const loadQueries = () => {
    try {
      // 从本地存储获取查询配置
      const savedQueries = localStorage.getItem('dataQueries');
      if (savedQueries) {
        setQueries(JSON.parse(savedQueries));
      } else {
        setQueries([]);
        localStorage.setItem('dataQueries', JSON.stringify([]));
      }
    } catch (error) {
      console.error('获取查询配置失败:', error);
    }
  };

  // 加载保存的查询结果
  const loadSavedQueries = () => {
    try {
      const saved = localStorage.getItem('savedQueryResults');
      if (saved) {
        setSavedQueries(JSON.parse(saved));
      } else {
        setSavedQueries([]);
      }
    } catch (error) {
      console.error('加载保存的查询结果失败:', error);
      setSavedQueries([]);
    }
  };

  // 保存查询结果
  const saveQueryResult = (name, result) => {
    try {
      const newSavedQuery = {
        id: `saved-${Date.now()}`,
        name: name || `查询结果 ${new Date().toLocaleString()}`,
        query: selectedQuery ? selectedQuery.sql : testQuery,
        params: testParams,
        result: result,
        timestamp: Date.now()
      };

      const updatedSavedQueries = [newSavedQuery, ...savedQueries];
      // 最多保存20条查询结果
      if (updatedSavedQueries.length > 20) {
        updatedSavedQueries.pop();
      }

      setSavedQueries(updatedSavedQueries);
      localStorage.setItem('savedQueryResults', JSON.stringify(updatedSavedQueries));

      return newSavedQuery.id;
    } catch (error) {
      console.error('保存查询结果失败:', error);
      return null;
    }
  };

  // 加载表信息
  const loadTableInfo = async () => {
    if (dataSources.length === 0) return;

    // 使用默认数据源
    const defaultDataSource = dataSources.find(ds => ds.isDefault) || dataSources[0];
    if (!defaultDataSource) return;

    setIsLoading(true);

    try {
      const dataSourceConfig = {
        type: defaultDataSource.type,
        host: defaultDataSource.host,
        port: defaultDataSource.port,
        database: defaultDataSource.database,
        username: defaultDataSource.username,
        password: defaultDataSource.password
      };

      // 获取表列表
      const tables = await dbService.query(
        dataSourceConfig,
        'SHOW TABLES'
      );

      if (tables && tables.length > 0) {
        // 提取表名
        const tableList = tables.map(table => {
          // 获取第一个属性的值作为表名
          return Object.values(table)[0];
        });

        setTableInfo(tableList);

        // 如果有表，默认选择第一个
        if (tableList.length > 0 && !selectedTable) {
          setSelectedTable(tableList[0]);
          loadTableColumns(tableList[0], dataSourceConfig);
        }
      }
    } catch (error) {
      console.error('加载表信息失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 加载表列信息
  const loadTableColumns = async (tableName, config) => {
    if (!tableName || !config) return;

    setIsLoading(true);

    try {
      // 获取表结构
      const columns = await dbService.query(
        config,
        `DESCRIBE ${tableName}`
      );

      if (columns && columns.length > 0) {
        setTableColumns(columns);
      } else {
        setTableColumns([]);
      }
    } catch (error) {
      console.error(`加载表 ${tableName} 的列信息失败:`, error);
      setTableColumns([]);
    } finally {
      setIsLoading(false);
    }
  };

  // 处理表选择
  const handleTableSelect = (tableName) => {
    setSelectedTable(tableName);

    // 获取默认数据源
    const defaultDataSource = dataSources.find(ds => ds.isDefault) || dataSources[0];
    if (!defaultDataSource) return;

    const dataSourceConfig = {
      type: defaultDataSource.type,
      host: defaultDataSource.host,
      port: defaultDataSource.port,
      database: defaultDataSource.database,
      username: defaultDataSource.username,
      password: defaultDataSource.password
    };

    // 加载表列信息
    loadTableColumns(tableName, dataSourceConfig);
  };

  // 生成查询SQL
  const generateSelectSQL = () => {
    if (!selectedTable || tableColumns.length === 0) return '';

    const columnNames = tableColumns.map(col => col.Field).join(', ');
    return `SELECT ${columnNames} FROM ${selectedTable} LIMIT 100`;
  };

  // 保存查询配置
  const saveQueries = (newQueries) => {
    try {
      localStorage.setItem('dataQueries', JSON.stringify(newQueries));
      setQueries(newQueries);
    } catch (error) {
      console.error('保存查询配置失败:', error);
    }
  };

  // 打开添加查询对话框
  const handleOpenDialog = (query = null) => {
    if (query) {
      setSelectedQuery({
        ...query
      });
    } else {
      // 创建新查询
      setSelectedQuery({
        id: `query-${Date.now()}`,
        name: '',
        description: '',
        dataSourceId: dataSources.find(ds => ds.isDefault)?.id || '',
        sql: '',
        parameters: []
      });
    }

    setIsDialogOpen(true);
    setFormErrors({});
  };

  // 关闭查询对话框
  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedQuery(null);
  };

  // 处理查询表单字段变更
  const handleFormChange = (field, value) => {
    setSelectedQuery({
      ...selectedQuery,
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

  // 验证查询表单
  const validateForm = () => {
    const errors = {};

    if (!selectedQuery.name) {
      errors.name = '查询名称不能为空';
    }

    if (!selectedQuery.dataSourceId) {
      errors.dataSourceId = '必须选择数据源';
    }

    if (!selectedQuery.sql) {
      errors.sql = 'SQL语句不能为空';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // 保存查询
  const handleSaveQuery = () => {
    if (!validateForm()) {
      return;
    }

    // 检查是否是编辑现有查询
    const existingIndex = queries.findIndex(q => q.id === selectedQuery.id);

    let newQueries = [...queries];
    if (existingIndex >= 0) {
      // 更新现有查询
      newQueries[existingIndex] = selectedQuery;
    } else {
      // 添加新查询
      newQueries.push(selectedQuery);
    }

    // 保存查询配置
    saveQueries(newQueries);

    // 关闭对话框
    handleCloseDialog();
  };

  // 打开测试对话框
  const handleOpenTestDialog = (query) => {
    setSelectedQuery(query);
    setTestParams('{}');
    setTestResult(null);
    setIsTestDialogOpen(true);
  };

  // 关闭测试对话框
  const handleCloseTestDialog = () => {
    setIsTestDialogOpen(false);
    setSelectedQuery(null);
    setTestResult(null);
  };

  // 处理测试参数变更
  const handleTestParamsChange = (value) => {
    setTestParams(value);
  };

  // 测试查询
  const handleTestQuery = async () => {
    if (!selectedQuery) return;

    setIsLoading(true);
    setTestResult(null);

    try {
      // 获取数据源信息
      const dataSource = dataSources.find(ds => ds.id === selectedQuery.dataSourceId);
      if (!dataSource) {
        throw new Error('找不到数据源');
      }

      // 解析测试参数
      let params = [];
      try {
        const parsedParams = JSON.parse(testParams);
        // 如果是对象，转换为数组
        if (parsedParams && typeof parsedParams === 'object' && !Array.isArray(parsedParams)) {
          params = Object.values(parsedParams);
        } else if (Array.isArray(parsedParams)) {
          params = parsedParams;
        }
      } catch (error) {
        throw new Error(`参数解析错误: ${error.message}`);
      }

      // 显示测试中状态
      setTestResult({
        testing: true,
        message: '正在执行SQL查询...'
      });

      // 构建数据源配置
      const dataSourceConfig = {
        type: dataSource.type,
        host: dataSource.host,
        port: dataSource.port,
        database: dataSource.database,
        username: dataSource.username,
        password: dataSource.password
      };

      // 记录开始时间
      const startTime = Date.now();

      // 使用数据库服务执行查询
      const queryResult = await dbService.query(dataSourceConfig, selectedQuery.sql, params);

      // 计算执行时间
      const executionTime = Date.now() - startTime;

      // 分析结果
      const rowCount = Array.isArray(queryResult) ? queryResult.length : 0;

      setTestResult({
        success: true,
        data: queryResult,
        executionTime: executionTime,
        rowCount: rowCount,
        testing: false,
        message: `查询成功，返回 ${rowCount} 条记录，耗时 ${executionTime} 毫秒`
      });
    } catch (error) {
      console.error('测试查询失败:', error);

      setTestResult({
        success: false,
        error: error.message || '测试查询失败',
        testing: false
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 打开删除确认对话框
  const handleOpenDeleteDialog = (query) => {
    setSelectedQuery(query);
    setIsDeleteDialogOpen(true);
  };

  // 关闭删除确认对话框
  const handleCloseDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
    setSelectedQuery(null);
  };

  // 删除查询
  const handleDeleteQuery = () => {
    if (!selectedQuery) return;

    // 过滤掉要删除的查询
    const newQueries = queries.filter(q => q.id !== selectedQuery.id);

    // 保存查询配置
    saveQueries(newQueries);

    // 关闭对话框
    handleCloseDeleteDialog();
  };

  // 复制查询
  const handleDuplicateQuery = (query) => {
    const newQuery = {
      ...query,
      id: `query-${Date.now()}`,
      name: `${query.name} (复制)`
    };

    const newQueries = [...queries, newQuery];

    // 保存查询配置
    saveQueries(newQueries);
  };

  return (
    <Box sx={{ p: 0 }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab label="查询管理" icon={<CodeIcon />} iconPosition="start" />
          <Tab label="数据库浏览" icon={<StorageIcon />} iconPosition="start" />
          <Tab label="保存的结果" icon={<ListIcon />} iconPosition="start" />
        </Tabs>
      </Box>

      {/* 查询管理标签页 */}
      {activeTab === 0 && (
        <>
          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h5">SQL查询管理</Typography>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
              disabled={dataSources.length === 0}
            >
              添加SQL查询
            </Button>
          </Box>

          {dataSources.length === 0 ? (
            <Alert severity="warning" sx={{ mb: 2 }}>
              请先添加数据源才能创建查询
            </Alert>
          ) : null}
        </>
      )}

      {/* 数据库浏览标签页 */}
      {activeTab === 1 && (
        <>
          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h5">数据库浏览</Typography>
            <Button
              variant="outlined"
              color="primary"
              startIcon={<RefreshIcon />}
              onClick={loadTableInfo}
              disabled={dataSources.length === 0 || isLoading}
            >
              刷新表信息
            </Button>
          </Box>

          {dataSources.length === 0 ? (
            <Alert severity="warning" sx={{ mb: 2 }}>
              请先添加数据源才能浏览数据库
            </Alert>
          ) : (
            <Grid container spacing={2}>
              <Grid item xs={12} md={3}>
                <Paper sx={{ p: 2, height: '100%' }}>
                  <Typography variant="subtitle1" gutterBottom>
                    数据表
                  </Typography>
                  {isLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                      <CircularProgress size={24} />
                    </Box>
                  ) : tableInfo.length > 0 ? (
                    <List dense component="nav">
                      {tableInfo.map(table => (
                        <ListItem
                          button
                          key={table}
                          selected={selectedTable === table}
                          onClick={() => handleTableSelect(table)}
                        >
                          <ListItemIcon>
                            <TableChartIcon />
                          </ListItemIcon>
                          <ListItemText primary={table} />
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Typography variant="body2" color="textSecondary">
                      没有找到数据表
                    </Typography>
                  )}
                </Paper>
              </Grid>

              <Grid item xs={12} md={9}>
                <Paper sx={{ p: 2 }}>
                  {selectedTable ? (
                    <>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="subtitle1">
                          表结构: {selectedTable}
                        </Typography>
                        <Button
                          variant="contained"
                          color="primary"
                          startIcon={<CodeIcon />}
                          onClick={() => {
                            const sql = generateSelectSQL();
                            // 创建新查询
                            setSelectedQuery({
                              id: `query-${Date.now()}`,
                              name: `查询 ${selectedTable}`,
                              description: `从 ${selectedTable} 表查询数据`,
                              dataSourceId: dataSources.find(ds => ds.isDefault)?.id || dataSources[0]?.id,
                              sql: sql,
                              parameters: []
                            });
                            setIsDialogOpen(true);
                            setFormErrors({});
                          }}
                          disabled={!selectedTable || tableColumns.length === 0}
                        >
                          生成查询
                        </Button>
                      </Box>

                      {isLoading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                          <CircularProgress size={24} />
                        </Box>
                      ) : tableColumns.length > 0 ? (
                        <TableContainer>
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell>字段名</TableCell>
                                <TableCell>类型</TableCell>
                                <TableCell>可为空</TableCell>
                                <TableCell>键</TableCell>
                                <TableCell>默认值</TableCell>
                                <TableCell>额外</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {tableColumns.map((column, index) => (
                                <TableRow key={index}>
                                  <TableCell>{column.Field}</TableCell>
                                  <TableCell>{column.Type}</TableCell>
                                  <TableCell>{column.Null}</TableCell>
                                  <TableCell>{column.Key}</TableCell>
                                  <TableCell>{column.Default === null ? 'NULL' : column.Default}</TableCell>
                                  <TableCell>{column.Extra}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      ) : (
                        <Typography variant="body2" color="textSecondary">
                          没有找到表结构信息
                        </Typography>
                      )}
                    </>
                  ) : (
                    <Typography variant="body2" color="textSecondary">
                      请从左侧选择一个表
                    </Typography>
                  )}
                </Paper>
              </Grid>
            </Grid>
          )}
        </>
      )}

      {/* 保存的结果标签页 */}
      {activeTab === 2 && (
        <>
          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h5">保存的查询结果</Typography>
          </Box>

          {savedQueries.length === 0 ? (
            <Alert severity="info" sx={{ mb: 2 }}>
              没有保存的查询结果
            </Alert>
          ) : (
            <Grid container spacing={2}>
              {savedQueries.map(savedQuery => (
                <Grid item xs={12} key={savedQuery.id}>
                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography>{savedQuery.name}</Typography>
                      <Typography variant="caption" sx={{ ml: 2, color: 'text.secondary' }}>
                        {new Date(savedQuery.timestamp).toLocaleString()}
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Grid container spacing={2}>
                        <Grid item xs={12}>
                          <Typography variant="subtitle2">SQL查询:</Typography>
                          <Paper sx={{ p: 1, bgcolor: '#f5f5f5' }}>
                            <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{savedQuery.query}</pre>
                          </Paper>
                        </Grid>

                        <Grid item xs={12}>
                          <Typography variant="subtitle2">查询结果:</Typography>
                          {Array.isArray(savedQuery.result) && savedQuery.result.length > 0 ? (
                            <TableContainer component={Paper} variant="outlined">
                              <Table size="small">
                                <TableHead>
                                  <TableRow>
                                    {Object.keys(savedQuery.result[0]).map(key => (
                                      <TableCell key={key}>{key}</TableCell>
                                    ))}
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {savedQuery.result.map((row, rowIndex) => (
                                    <TableRow key={rowIndex}>
                                      {Object.values(row).map((value, colIndex) => (
                                        <TableCell key={colIndex}>
                                          {value === null ? 'NULL' : String(value)}
                                        </TableCell>
                                      ))}
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </TableContainer>
                          ) : (
                            <Typography variant="body2" color="textSecondary">
                              没有结果数据
                            </Typography>
                          )}
                        </Grid>
                      </Grid>
                    </AccordionDetails>
                  </Accordion>
                </Grid>
              ))}
            </Grid>
          )}
        </>
      )}

      {activeTab === 0 && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>名称</TableCell>
                <TableCell>描述</TableCell>
                <TableCell>数据源</TableCell>
                <TableCell>SQL</TableCell>
                <TableCell>操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {queries.length > 0 ? (
                queries.map((query) => (
                  <TableRow key={query.id}>
                    <TableCell>{query.name}</TableCell>
                    <TableCell>{query.description}</TableCell>
                    <TableCell>
                      {dataSources.find(ds => ds.id === query.dataSourceId)?.name || '未知数据源'}
                    </TableCell>
                    <TableCell>
                      <Tooltip title={query.sql}>
                        <Typography sx={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {query.sql}
                        </Typography>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <IconButton size="small" onClick={() => handleOpenTestDialog(query)}>
                        <TestIcon />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleOpenDialog(query)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleDuplicateQuery(query)}>
                        <DuplicateIcon />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleOpenDeleteDialog(query)}>
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    没有找到查询
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* 查询编辑对话框 */}
      <Dialog open={isDialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedQuery && queries.some(q => q.id === selectedQuery.id) ? '编辑查询' : '添加查询'}
        </DialogTitle>
        <DialogContent>
          {selectedQuery && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="查询名称"
                  fullWidth
                  value={selectedQuery.name}
                  onChange={(e) => handleFormChange('name', e.target.value)}
                  error={!!formErrors.name}
                  helperText={formErrors.name}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth error={!!formErrors.dataSourceId}>
                  <InputLabel>数据源</InputLabel>
                  <Select
                    value={selectedQuery.dataSourceId}
                    onChange={(e) => handleFormChange('dataSourceId', e.target.value)}
                    label="数据源"
                  >
                    {dataSources.map(dataSource => (
                      <MenuItem key={dataSource.id} value={dataSource.id}>
                        {dataSource.name}
                      </MenuItem>
                    ))}
                  </Select>
                  {formErrors.dataSourceId && (
                    <Typography color="error" variant="caption">
                      {formErrors.dataSourceId}
                    </Typography>
                  )}
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="描述"
                  fullWidth
                  value={selectedQuery.description}
                  onChange={(e) => handleFormChange('description', e.target.value)}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="SQL语句"
                  fullWidth
                  multiline
                  rows={6}
                  value={selectedQuery.sql}
                  onChange={(e) => handleFormChange('sql', e.target.value)}
                  error={!!formErrors.sql}
                  helperText={formErrors.sql}
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>取消</Button>
          <Button onClick={handleSaveQuery} variant="contained" color="primary">
            保存
          </Button>
        </DialogActions>
      </Dialog>

      {/* 查询测试对话框 */}
      <Dialog open={isTestDialogOpen} onClose={handleCloseTestDialog} maxWidth="md" fullWidth>
        <DialogTitle>测试SQL查询: {selectedQuery?.name}</DialogTitle>
        <DialogContent>
          {selectedQuery && (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      查询信息
                    </Typography>
                    <Grid container spacing={1}>
                      <Grid item xs={12}>
                        <Typography variant="body2">
                          <strong>数据库:</strong> {dataSources.find(ds => ds.id === selectedQuery.dataSourceId)?.name || '未知数据源'}
                        </Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="body2">
                          <strong>描述:</strong> {selectedQuery.description || '无描述'}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="subtitle1" gutterBottom>
                    SQL语句:
                  </Typography>
                  <Paper sx={{ p: 2, mb: 2, bgcolor: '#f5f5f5' }}>
                    <pre style={{ margin: 0, whiteSpace: 'pre-wrap', overflow: 'auto', maxHeight: '150px' }}>{selectedQuery.sql}</pre>
                  </Paper>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="subtitle1" gutterBottom>
                    参数 (JSON格式):
                  </Typography>
                  <JsonEditor
                    value={testParams}
                    onChange={handleTestParamsChange}
                    height="150px"
                  />
                </Grid>
              </Grid>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', my: 3 }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleTestQuery}
                  disabled={isLoading}
                  startIcon={isLoading ? <CircularProgress size={20} /> : <TestIcon />}
                >
                  {isLoading ? '执行中...' : '执行SQL查询'}
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
                  <Alert
                    severity={testResult.success ? 'success' : 'error'}
                    sx={{ mb: 2 }}
                    action={
                      testResult.success && (
                        <Typography variant="body2">
                          耗时: {testResult.executionTime}ms
                        </Typography>
                      )
                    }
                  >
                    {testResult.success
                      ? testResult.message || '查询成功'
                      : `查询失败: ${testResult.error}`}
                  </Alert>

                  {testResult.success && testResult.data && (
                    <Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="subtitle1">
                          查询结果:
                        </Typography>
                        <Box>
                          <Button
                            variant="outlined"
                            color="primary"
                            startIcon={<SaveIcon />}
                            onClick={() => {
                              const name = prompt('请输入保存名称:', `${selectedQuery.name} 结果`);
                              if (name) {
                                saveQueryResult(name, testResult.data);
                                alert('查询结果已保存');
                              }
                            }}
                            size="small"
                            sx={{ mr: 1 }}
                          >
                            保存结果
                          </Button>
                          {Array.isArray(testResult.data) && (
                            <Typography variant="body2" component="span">
                              共 {testResult.data.length} 条记录
                            </Typography>
                          )}
                        </Box>
                      </Box>

                      {Array.isArray(testResult.data) && testResult.data.length > 0 ? (
                        <TableContainer component={Paper} sx={{ maxHeight: '300px' }}>
                          <Table stickyHeader size="small">
                            <TableHead>
                              <TableRow>
                                {Object.keys(testResult.data[0]).map((key) => (
                                  <TableCell key={key}>{key}</TableCell>
                                ))}
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {testResult.data.map((row, rowIndex) => (
                                <TableRow key={rowIndex}>
                                  {Object.keys(testResult.data[0]).map((key) => (
                                    <TableCell key={`${rowIndex}-${key}`}>
                                      {typeof row[key] === 'object'
                                        ? JSON.stringify(row[key])
                                        : String(row[key])}
                                    </TableCell>
                                  ))}
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      ) : (
                        <Paper sx={{ p: 2, maxHeight: '300px', overflow: 'auto' }}>
                          <pre>{JSON.stringify(testResult.data, null, 2)}</pre>
                        </Paper>
                      )}
                    </Box>
                  )}
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框 */}
      <Dialog open={isDeleteDialogOpen} onClose={handleCloseDeleteDialog}>
        <DialogTitle>删除查询</DialogTitle>
        <DialogContent>
          <Typography>
            确定要删除查询 "{selectedQuery?.name}" 吗？此操作不可撤销。
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>取消</Button>
          <Button onClick={handleDeleteQuery} color="error">
            删除
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default QueryManager;
