import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
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
  Divider,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  PlayArrow as TestIcon,
  FileCopy as DuplicateIcon,
  Refresh as RefreshIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Storage as StorageIcon,
  Code as CodeIcon,
  DataObject as DataObjectIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import apiManager from '../../services/apiManager';
import JsonEditor from '../../components/JsonEditor/JsonEditor';
import { useAuth } from '../../context/AuthContext';

import ApiDataPage from './ApiDataPage';

/**
 * API管理组件
 * 用于管理和测试系统中的所有API
 */
const ApiManagement = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [apis, setApis] = useState({});
  const [filteredApis, setFilteredApis] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedApi, setSelectedApi] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isTestDialogOpen, setIsTestDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [testParams, setTestParams] = useState('{}');
  const [testResult, setTestResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [showDataPage, setShowDataPage] = useState(false);
  const [selectedApiForData, setSelectedApiForData] = useState(null);

  // 检查管理员权限
  useEffect(() => {
    if (!isAdmin) {
      // 使用MUI的Alert组件而不是Antd的message
      // 避免在页面刷新时出现"message is not a function"错误
      console.error('用户没有管理员权限');
      navigate('/');
    }
  }, [isAdmin, navigate]);

  // 加载API配置
  useEffect(() => {
    loadApis();
  }, []);

  // 根据搜索词和当前标签过滤API
  useEffect(() => {
    if (activeTab <= 4) {
      filterApis();
    }
  }, [apis, searchTerm, activeTab]);

  // 加载API配置
  const loadApis = () => {
    try {
      const allApis = apiManager.registry.getAll();

      // 验证返回的数据是否为有效对象
      if (allApis && typeof allApis === 'object' && !Array.isArray(allApis)) {
        setApis(allApis);
        console.log(`成功加载 ${Object.keys(allApis).length} 个API配置`);
      } else {
        console.error('API配置格式无效', allApis);
        // 设置为空对象，避免页面崩溃
        setApis({});
      }
    } catch (error) {
      console.error('加载API配置失败:', error);
      // 设置为空对象，避免页面崩溃
      setApis({});
    }
  };

  // 过滤API
  const filterApis = () => {
    try {
      const categories = ['system', 'data', 'device', 'custom'];
      const currentCategory = activeTab < categories.length ? categories[activeTab] : null;

      let filtered = {};

      // 确保apis是有效对象
      if (apis && typeof apis === 'object' && !Array.isArray(apis)) {
        Object.keys(apis).forEach(key => {
          try {
            const api = apis[key];

            // 确保api是有效对象
            if (!api || typeof api !== 'object') {
              console.warn(`无效的API配置: ${key}`, api);
              return;
            }

            // 按分类过滤
            if (currentCategory && api.category !== currentCategory) {
              return;
            }

            // 按搜索词过滤
            if (searchTerm &&
                !key.toLowerCase().includes(searchTerm.toLowerCase()) &&
                !(api.name && api.name.toLowerCase().includes(searchTerm.toLowerCase())) &&
                !(api.description && api.description.toLowerCase().includes(searchTerm.toLowerCase()))) {
              return;
            }

            filtered[key] = api;
          } catch (itemError) {
            console.error(`处理API项目时出错: ${key}`, itemError);
          }
        });
      } else {
        console.warn('过滤API时发现无效的APIs对象', apis);
      }

      setFilteredApis(filtered);
    } catch (error) {
      console.error('过滤API失败:', error);
      setFilteredApis({});
    }
  };

  // 处理标签切换
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // 处理搜索
  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
  };

  // 打开API编辑对话框
  const handleOpenDialog = (apiKey = null) => {
    if (apiKey) {
      setSelectedApi({
        key: apiKey,
        ...apis[apiKey]
      });
    } else {
      // 创建新API
      const categories = ['system', 'data', 'device', 'custom'];
      const currentCategory = activeTab < categories.length ? categories[activeTab] : 'custom';

      setSelectedApi({
        key: '',
        name: '',
        url: '',
        method: 'GET',
        category: currentCategory,
        enabled: true,
        timeout: 15000,
        retries: 0,
        cacheTime: 0,
        description: '',
        headers: {}
      });
    }

    setIsDialogOpen(true);
    setFormErrors({});
  };

  // 关闭API编辑对话框
  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedApi(null);
  };

  // 处理API表单字段变更
  const handleApiFormChange = (field, value) => {
    setSelectedApi({
      ...selectedApi,
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

  // 验证API表单
  const validateApiForm = () => {
    const errors = {};

    if (!selectedApi.key) {
      errors.key = 'API键名不能为空';
    } else if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(selectedApi.key)) {
      errors.key = 'API键名只能包含字母、数字和下划线，且必须以字母开头';
    }

    if (!selectedApi.name) {
      errors.name = 'API名称不能为空';
    }

    if (!selectedApi.url) {
      errors.url = 'API URL不能为空';
    }

    if (!selectedApi.method) {
      errors.method = 'API方法不能为空';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // 保存API配置
  const handleSaveApi = () => {
    if (!validateApiForm()) {
      return;
    }

    const { key, ...config } = selectedApi;

    // 检查是否是新API
    const isNewApi = !apis[key];

    // 保存API配置
    if (isNewApi) {
      apiManager.registry.register(key, config);
    } else {
      apiManager.registry.update(key, config);
    }

    // 重新加载API配置
    loadApis();

    // 关闭对话框
    handleCloseDialog();
  };

  // 打开API测试对话框
  const handleOpenTestDialog = (apiKey) => {
    setSelectedApi({
      key: apiKey,
      ...apis[apiKey]
    });
    setTestParams('{}');
    setTestResult(null);
    setIsTestDialogOpen(true);
  };

  // 关闭API测试对话框
  const handleCloseTestDialog = () => {
    setIsTestDialogOpen(false);
    setSelectedApi(null);
    setTestResult(null);
  };

  // 处理测试参数变更
  const handleTestParamsChange = (value) => {
    setTestParams(value);
  };

  // 测试API
  const handleTestApi = async () => {
    if (!selectedApi) return;

    setIsLoading(true);
    setTestResult(null);

    try {
      // 解析测试参数
      let params = {};
      try {
        params = JSON.parse(testParams);
      } catch (error) {
        setTestResult({
          success: false,
          error: `参数解析错误: ${error.message}`
        });
        setIsLoading(false);
        return;
      }

      // 测试API
      const result = await apiManager.test(selectedApi.key, params);
      setTestResult(result);
    } catch (error) {
      setTestResult({
        success: false,
        error: error.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 打开删除确认对话框
  const handleOpenDeleteDialog = (apiKey) => {
    setSelectedApi({
      key: apiKey,
      ...apis[apiKey]
    });
    setIsDeleteDialogOpen(true);
  };

  // 关闭删除确认对话框
  const handleCloseDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
    setSelectedApi(null);
  };

  // 删除API
  const handleDeleteApi = () => {
    if (!selectedApi) return;

    // 删除API配置
    apiManager.registry.remove(selectedApi.key);

    // 重新加载API配置
    loadApis();

    // 关闭对话框
    handleCloseDeleteDialog();
  };

  // 复制API
  const handleDuplicateApi = (apiKey) => {
    const api = apis[apiKey];
    if (!api) return;

    // 生成新的API键名
    let newKey = `${apiKey}_copy`;
    let counter = 1;
    while (apis[newKey]) {
      newKey = `${apiKey}_copy_${counter}`;
      counter++;
    }

    // 复制API配置
    apiManager.registry.register(newKey, { ...api, name: `${api.name} (复制)` });

    // 重新加载API配置
    loadApis();
  };

  // 打开API数据页面
  const handleOpenDataPage = (apiKey) => {
    setSelectedApiForData(apiKey);
    setShowDataPage(true);
  };

  // 关闭API数据页面
  const handleCloseDataPage = () => {
    setShowDataPage(false);
    setSelectedApiForData(null);
  };

  return (
    <Box sx={{ p: 3 }}>
      {showDataPage ? (
        <ApiDataPage
          apiKey={selectedApiForData}
          onBack={handleCloseDataPage}
        />
      ) : (
        <>
          <Typography variant="h4" gutterBottom>API管理</Typography>

          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <TextField
              label="搜索API"
              variant="outlined"
              size="small"
              value={searchTerm}
              onChange={handleSearch}
              sx={{ width: 300 }}
            />

            <Box>
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={() => handleOpenDialog()}
                sx={{ mr: 1 }}
              >
                添加API
              </Button>

              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={loadApis}
              >
                刷新
              </Button>
            </Box>
          </Box>

          <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 2 }}>
            <Tab label="系统API" />
            <Tab label="数据查询API" />
            <Tab label="设备控制API" />
            <Tab label="用户自定义API" />
            <Tab label="全部API" />
          </Tabs>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>API键名</TableCell>
                  <TableCell>名称</TableCell>
                  <TableCell>URL</TableCell>
                  <TableCell>方法</TableCell>
                  <TableCell>状态</TableCell>
                  <TableCell>操作</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Object.keys(filteredApis).length > 0 ? (
                  Object.keys(filteredApis).map((key) => (
                    <TableRow key={key}>
                      <TableCell>{key}</TableCell>
                      <TableCell>{filteredApis[key].name}</TableCell>
                      <TableCell>{filteredApis[key].url}</TableCell>
                      <TableCell>
                        <Chip
                          label={filteredApis[key].method}
                          color={
                            filteredApis[key].method === 'GET' ? 'success' :
                            filteredApis[key].method === 'POST' ? 'primary' :
                            filteredApis[key].method === 'PUT' ? 'warning' :
                            filteredApis[key].method === 'DELETE' ? 'error' : 'default'
                          }
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={filteredApis[key].enabled ? '启用' : '禁用'}
                          color={filteredApis[key].enabled ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Tooltip title="数据管理">
                          <IconButton size="small" onClick={() => handleOpenDataPage(key)}>
                            <DataObjectIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="测试">
                          <IconButton size="small" onClick={() => handleOpenTestDialog(key)}>
                            <TestIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="编辑">
                          <IconButton size="small" onClick={() => handleOpenDialog(key)}>
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="复制">
                          <IconButton size="small" onClick={() => handleDuplicateApi(key)}>
                            <DuplicateIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="删除">
                          <IconButton size="small" onClick={() => handleOpenDeleteDialog(key)}>
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      没有找到API
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}

      {/* API编辑对话框 */}
      <Dialog open={isDialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedApi && apis[selectedApi.key] ? '编辑API' : '添加API'}
        </DialogTitle>
        <DialogContent>
          {selectedApi && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="API键名"
                  fullWidth
                  value={selectedApi.key}
                  onChange={(e) => handleApiFormChange('key', e.target.value)}
                  error={!!formErrors.key}
                  helperText={formErrors.key}
                  disabled={!!apis[selectedApi.key]} // 禁止编辑已存在的API键名
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="API名称"
                  fullWidth
                  value={selectedApi.name}
                  onChange={(e) => handleApiFormChange('name', e.target.value)}
                  error={!!formErrors.name}
                  helperText={formErrors.name}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="API URL"
                  fullWidth
                  value={selectedApi.url}
                  onChange={(e) => handleApiFormChange('url', e.target.value)}
                  error={!!formErrors.url}
                  helperText={formErrors.url}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth error={!!formErrors.method}>
                  <InputLabel>请求方法</InputLabel>
                  <Select
                    value={selectedApi.method}
                    onChange={(e) => handleApiFormChange('method', e.target.value)}
                    label="请求方法"
                  >
                    <MenuItem value="GET">GET</MenuItem>
                    <MenuItem value="POST">POST</MenuItem>
                    <MenuItem value="PUT">PUT</MenuItem>
                    <MenuItem value="DELETE">DELETE</MenuItem>
                    <MenuItem value="PATCH">PATCH</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>分类</InputLabel>
                  <Select
                    value={selectedApi.category}
                    onChange={(e) => handleApiFormChange('category', e.target.value)}
                    label="分类"
                  >
                    <MenuItem value="system">系统API</MenuItem>
                    <MenuItem value="data">数据查询API</MenuItem>
                    <MenuItem value="device">设备控制API</MenuItem>
                    <MenuItem value="custom">用户自定义API</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="超时时间 (毫秒)"
                  fullWidth
                  type="number"
                  value={selectedApi.timeout}
                  onChange={(e) => handleApiFormChange('timeout', parseInt(e.target.value) || 0)}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="重试次数"
                  fullWidth
                  type="number"
                  value={selectedApi.retries}
                  onChange={(e) => handleApiFormChange('retries', parseInt(e.target.value) || 0)}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="缓存时间 (秒)"
                  fullWidth
                  type="number"
                  value={selectedApi.cacheTime}
                  onChange={(e) => handleApiFormChange('cacheTime', parseInt(e.target.value) || 0)}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="描述"
                  fullWidth
                  multiline
                  rows={2}
                  value={selectedApi.description}
                  onChange={(e) => handleApiFormChange('description', e.target.value)}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={selectedApi.enabled}
                      onChange={(e) => handleApiFormChange('enabled', e.target.checked)}
                    />
                  }
                  label="启用"
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>取消</Button>
          <Button onClick={handleSaveApi} variant="contained" color="primary">
            保存
          </Button>
        </DialogActions>
      </Dialog>

      {/* API测试对话框 */}
      <Dialog open={isTestDialogOpen} onClose={handleCloseTestDialog} maxWidth="md" fullWidth>
        <DialogTitle>测试API: {selectedApi?.name}</DialogTitle>
        <DialogContent>
          {selectedApi && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                URL: {selectedApi.url}
              </Typography>
              <Typography variant="subtitle2" gutterBottom>
                方法: {selectedApi.method}
              </Typography>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle1" gutterBottom>
                请求参数 (JSON格式)
              </Typography>

              <JsonEditor
                value={testParams}
                onChange={handleTestParamsChange}
                height="150px"
              />

              <Box sx={{ mt: 2, mb: 2 }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleTestApi}
                  disabled={isLoading}
                  startIcon={isLoading ? <CircularProgress size={20} /> : <TestIcon />}
                >
                  {isLoading ? '测试中...' : '测试API'}
                </Button>
              </Box>

              {testResult && (
                <Box sx={{ mt: 2 }}>
                  <Divider sx={{ my: 2 }} />

                  <Typography variant="subtitle1" gutterBottom>
                    测试结果
                  </Typography>

                  <Alert severity={testResult.success ? 'success' : 'error'} sx={{ mb: 2 }}>
                    {testResult.success ? '请求成功' : `请求失败: ${testResult.error || '未知错误'}`}
                  </Alert>

                  <Typography variant="body2" gutterBottom>
                    响应时间: {testResult.responseTime}ms
                  </Typography>

                  {testResult.status && (
                    <Typography variant="body2" gutterBottom>
                      状态码: {testResult.status} {testResult.statusText}
                    </Typography>
                  )}

                  {testResult.data && (
                    <>
                      <Typography variant="subtitle2" gutterBottom sx={{ mt: 1 }}>
                        响应数据:
                      </Typography>
                      <Paper sx={{ p: 2, bgcolor: '#f5f5f5', maxHeight: '300px', overflow: 'auto' }}>
                        <pre>{JSON.stringify(testResult.data, null, 2)}</pre>
                      </Paper>
                    </>
                  )}
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseTestDialog}>关闭</Button>
        </DialogActions>
      </Dialog>

      {/* 删除确认对话框 */}
      <Dialog open={isDeleteDialogOpen} onClose={handleCloseDeleteDialog}>
        <DialogTitle>删除API</DialogTitle>
        <DialogContent>
          <Typography>
            确定要删除API "{selectedApi?.name}" 吗？此操作不可撤销。
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>取消</Button>
          <Button onClick={handleDeleteApi} color="error">
            删除
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ApiManagement;
