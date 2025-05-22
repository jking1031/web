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
  FormHelperText,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Tooltip,
  Grid,
  Divider,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Card,
  CardContent,
  CardActions,
  Snackbar
} from '@mui/material';
import { ApiOutlined, InfoCircleOutlined } from '@ant-design/icons';
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
  DataObject as DataObjectIcon,
  Link as LinkIcon,
  Check as CheckIcon,
  CloudUpload as CloudUploadIcon,
  CloudDownload as CloudDownloadIcon,
  Settings as SettingsIcon,
  ContentCopy as ContentCopyIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { ApiManager, BaseUrlManager } from '../../services/api';
import JsonEditor from '../../components/JsonEditor/JsonEditor';
import { useAuth } from '../../context/AuthContext';

import ApiDataPage from './ApiDataPage';
import BaseUrlManager from './components/BaseUrlManager';
import ApiSyncTool from '../../components/ApiSyncTool/ApiSyncTool';
import ApiDbSyncTool from '../../components/ApiDbSyncTool/ApiDbSyncTool';

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
  const [baseUrls, setBaseUrls] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  // 显示消息提示
  const showSnackbar = (message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  // 关闭消息提示
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

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
    loadBaseUrls();
  }, []);

  // 根据搜索词和当前标签过滤API
  useEffect(() => {
    if (activeTab <= 4) {
      filterApis();
    }
  }, [apis, searchTerm, activeTab]);

  // 加载基础URL
  const loadBaseUrls = () => {
    try {
      const urls = BaseUrlManager.getAll();
      setBaseUrls(urls);
    } catch (error) {
      console.error('获取基础URL失败:', error);
    }
  };

  // 加载API配置
  const loadApis = () => {
    try {
      const allApis = ApiManager.registry.getAll();

      // 验证返回的数据
      if (allApis) {
        if (Array.isArray(allApis)) {
          // 如果是数组格式，转换为对象格式
          const apisObject = {};
          allApis.forEach(api => {
            if (api && api.key) {
              const { key, ...config } = api;
              apisObject[key] = config;
            }
          });
          setApis(apisObject);
          console.log(`成功加载 ${Object.keys(apisObject).length} 个API配置`);
        } else if (typeof allApis === 'object') {
          // 如果已经是对象格式，直接使用
          setApis(allApis);
          console.log(`成功加载 ${Object.keys(allApis).length} 个API配置`);
        } else {
          console.error('API配置格式无效', allApis);
          // 设置为空对象，避免页面崩溃
          setApis({});
        }
      } else {
        console.error('API配置为空');
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
      if (apis && typeof apis === 'object') {
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
      const api = apis[apiKey];
      // 尝试从URL中提取baseUrl和path
      let baseUrl = '';
      let path = '';

      if (api.url) {
        try {
          // 尝试匹配基础URL
          const foundBaseUrl = baseUrls.find(base => api.url.startsWith(base.url));
          if (foundBaseUrl) {
            baseUrl = foundBaseUrl.url;
            path = api.url.substring(baseUrl.length);
          } else {
            // 尝试从URL中提取域名部分作为baseUrl
            const urlMatch = api.url.match(/^(https?:\/\/[^/]+)/i);
            if (urlMatch) {
              baseUrl = urlMatch[1];
              path = api.url.substring(baseUrl.length);
            }
          }

          // 确保路径始终以/开头
          if (path && !path.startsWith('/')) {
            path = `/${path}`;
          }
        } catch (error) {
          console.error('解析URL失败:', error);
        }
      }

      // 如果API已有baseUrl和path属性，优先使用它们
      setSelectedApi({
        key: apiKey,
        ...api,
        baseUrl: api.baseUrl || baseUrl,
        path: api.path || path
      });
    } else {
      // 创建新API
      const categories = ['system', 'data', 'device', 'custom'];
      const currentCategory = activeTab < categories.length ? categories[activeTab] : 'custom';

      // 获取默认基础URL
      const defaultBaseUrl = baseUrls.find(url => url.isDefault);
      const baseUrl = defaultBaseUrl ? defaultBaseUrl.url : '';

      setSelectedApi({
        key: '',
        name: '',
        url: baseUrl,
        baseUrl: baseUrl,
        path: '',
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
    // 创建更新对象
    const updates = { [field]: value };

    // 特殊处理URL相关字段，确保三个字段的一致性
    if (field === 'baseUrl') {
      // 如果更新基础URL，同时更新完整URL
      if (selectedApi.path) {
        updates.url = value + selectedApi.path;
      } else {
        updates.url = value;
      }
    } else if (field === 'path') {
      // 如果更新路径，同时更新完整URL
      if (selectedApi.baseUrl) {
        updates.url = selectedApi.baseUrl + value;
      } else {
        updates.url = value;
      }
    } else if (field === 'url') {
      // 如果直接更新URL，尝试解析baseUrl和path
      try {
        // 尝试匹配基础URL
        const foundBaseUrl = baseUrls.find(base => value.startsWith(base.url));
        if (foundBaseUrl) {
          updates.baseUrl = foundBaseUrl.url;
          updates.path = value.substring(foundBaseUrl.url.length);

          // 确保路径始终以/开头
          if (updates.path && !updates.path.startsWith('/')) {
            updates.path = `/${updates.path}`;
          }
        } else {
          // 尝试从URL中提取域名部分作为baseUrl
          const urlMatch = value.match(/^(https?:\/\/[^/]+)/i);
          if (urlMatch) {
            updates.baseUrl = urlMatch[1];
            updates.path = value.substring(urlMatch[1].length);

            // 确保路径始终以/开头
            if (updates.path && !updates.path.startsWith('/')) {
              updates.path = `/${updates.path}`;
            }
          }
        }
      } catch (error) {
        console.error('解析URL失败:', error);
      }
    }

    // 批量更新状态
    setSelectedApi(prev => ({
      ...prev,
      ...updates
    }));

    // 清除字段错误
    if (formErrors[field]) {
      setFormErrors(prev => ({
        ...prev,
        [field]: null
      }));
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

    if (!selectedApi.baseUrl) {
      errors.baseUrl = '基础URL不能为空';
    }

    if (!selectedApi.method) {
      errors.method = 'API方法不能为空';
    }

    // 验证URL格式
    if (selectedApi.url && !selectedApi.url.match(/^https?:\/\/.+/i)) {
      errors.url = 'URL必须以http://或https://开头';
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
      ApiManager.registry.register(key, config);
    } else {
      ApiManager.registry.update(key, config);
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
      const result = await ApiManager.test(selectedApi.key, params);
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
    ApiManager.registry.remove(selectedApi.key);

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
    ApiManager.registry.register(newKey, { ...api, name: `${api.name} (复制)` });

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
          <Paper
            elevation={0}
            sx={{
              p: 3,
              mb: 3,
              borderRadius: 2,
              background: 'linear-gradient(135deg, #2E7D32 0%, #388E3C 100%)',
              color: 'white'
            }}
          >
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>API管理系统</Typography>
            <Typography variant="body1">
              集中管理、测试和监控系统中的所有API，提高开发效率和代码质量
            </Typography>
            <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                提示: 使用 Hash 模式 URL 访问此页面:
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  fontFamily: 'monospace',
                  bgcolor: 'rgba(255,255,255,0.2)',
                  px: 1,
                  py: 0.5,
                  borderRadius: 1
                }}
              >
                /#/api-management
              </Typography>
            </Box>
          </Paper>

          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <TextField
              label="搜索API"
              variant="outlined"
              size="small"
              value={searchTerm}
              onChange={handleSearch}
              sx={{
                width: { xs: '100%', sm: 300 },
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2
                }
              }}
              placeholder="搜索API名称、键名或描述..."
              InputProps={{
                startAdornment: (
                  <Box component="span" sx={{ color: 'action.active', mr: 1 }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="8"></circle>
                      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                  </Box>
                ),
              }}
            />

            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={() => handleOpenDialog()}
                sx={{
                  borderRadius: 2,
                  backgroundColor: '#2E7D32',
                  '&:hover': {
                    backgroundColor: '#388E3C',
                  }
                }}
              >
                添加API
              </Button>
              <Button
                variant="outlined"
                startIcon={<LinkIcon />}
                onClick={() => setActiveTab(5)}
                sx={{
                  borderRadius: 2,
                  borderColor: '#2E7D32',
                  color: '#2E7D32',
                  '&:hover': {
                    borderColor: '#388E3C',
                    backgroundColor: 'rgba(56, 142, 60, 0.04)',
                  }
                }}
              >
                管理基础URL
              </Button>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={loadApis}
                sx={{
                  borderRadius: 2,
                  borderColor: '#2E7D32',
                  color: '#2E7D32',
                  '&:hover': {
                    borderColor: '#388E3C',
                    backgroundColor: 'rgba(56, 142, 60, 0.04)',
                  }
                }}
              >
                刷新
              </Button>
            </Box>
          </Box>

          <Paper sx={{ mb: 3, borderRadius: 2, overflow: 'hidden' }}>
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              variant="scrollable"
              scrollButtons="auto"
              sx={{
                borderBottom: 1,
                borderColor: 'divider',
                '& .MuiTab-root': {
                  py: 2,
                  px: 3,
                  fontWeight: 'medium',
                  textTransform: 'none',
                  minWidth: 120,
                  color: '#666',
                  '&.Mui-selected': {
                    color: '#2E7D32',
                    fontWeight: 'bold'
                  }
                },
                '& .MuiTabs-indicator': {
                  backgroundColor: '#2E7D32',
                  height: 3
                }
              }}
            >
              <Tab label="系统API" icon={<CodeIcon sx={{ fontSize: 18 }} />} iconPosition="start" />
              <Tab label="数据查询API" icon={<StorageIcon sx={{ fontSize: 18 }} />} iconPosition="start" />
              <Tab label="设备控制API" icon={<SettingsIcon sx={{ fontSize: 18 }} />} iconPosition="start" />
              <Tab label="用户自定义API" icon={<DataObjectIcon sx={{ fontSize: 18 }} />} iconPosition="start" />
              <Tab label="全部API" icon={<ApiOutlined sx={{ fontSize: 18 }} />} iconPosition="start" />
              <Tab label="基础URL管理" icon={<LinkIcon sx={{ fontSize: 18 }} />} iconPosition="start" />
              <Tab label="API同步工具" icon={<RefreshIcon sx={{ fontSize: 18 }} />} iconPosition="start" />
            </Tabs>
          </Paper>

          {activeTab === 5 ? (
            <BaseUrlManager />
          ) : activeTab === 6 ? (
            <Box sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>系统工具</Typography>
              <ApiDbSyncTool onApiUpdated={loadApis} />
              <ApiSyncTool />
            </Box>
          ) : (
            <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
              <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', bgcolor: '#f9f9f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                  {activeTab === 0 && "系统API列表"}
                  {activeTab === 1 && "数据查询API列表"}
                  {activeTab === 2 && "设备控制API列表"}
                  {activeTab === 3 && "用户自定义API列表"}
                  {activeTab === 4 && "全部API列表"}
                </Typography>
                <Chip
                  label={`${Object.keys(filteredApis).length} 个API`}
                  size="small"
                  sx={{
                    bgcolor: '#e8f5e9',
                    color: '#2E7D32',
                    fontWeight: 'medium'
                  }}
                />
              </Box>
              <TableContainer>
                <Table>
                  <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>API键名</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>名称</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>URL</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>方法</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>状态</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>操作</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Object.keys(filteredApis).length > 0 ? (
                      Object.keys(filteredApis).map((key) => (
                        <TableRow
                          key={key}
                          hover
                          sx={{
                            '&:hover': {
                              backgroundColor: '#f5f5f5',
                            }
                          }}
                        >
                          <TableCell>
                            <Tooltip title="API键名，用于在代码中引用此API">
                              <Box sx={{ fontFamily: 'monospace', fontWeight: 'medium', color: '#0D47A1' }}>
                                {key}
                              </Box>
                            </Tooltip>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ fontWeight: 'medium' }}>
                              {filteredApis[key].name}
                            </Box>
                            {filteredApis[key].description && (
                              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                                {filteredApis[key].description}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Tooltip title={filteredApis[key].url}>
                              <Box sx={{
                                maxWidth: 250,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                fontFamily: 'monospace',
                                fontSize: '0.875rem'
                              }}>
                                {filteredApis[key].url}
                              </Box>
                            </Tooltip>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={filteredApis[key].method}
                              size="small"
                              sx={{
                                fontWeight: 'bold',
                                bgcolor:
                                  filteredApis[key].method === 'GET' ? '#e3f2fd' :
                                  filteredApis[key].method === 'POST' ? '#e8f5e9' :
                                  filteredApis[key].method === 'PUT' ? '#fff8e1' :
                                  filteredApis[key].method === 'DELETE' ? '#ffebee' :
                                  '#f5f5f5',
                                color:
                                  filteredApis[key].method === 'GET' ? '#0d47a1' :
                                  filteredApis[key].method === 'POST' ? '#2e7d32' :
                                  filteredApis[key].method === 'PUT' ? '#ff8f00' :
                                  filteredApis[key].method === 'DELETE' ? '#c62828' :
                                  '#616161'
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            {filteredApis[key].status === 'enabled' ? (
                              <Chip
                                label="启用"
                                color="success"
                                size="small"
                                sx={{ fontWeight: 'medium' }}
                              />
                            ) : filteredApis[key].status === 'deprecated' ? (
                              <Chip
                                label="已弃用"
                                color="warning"
                                size="small"
                                sx={{ fontWeight: 'medium' }}
                              />
                            ) : (
                              <Chip
                                label="禁用"
                                color="default"
                                size="small"
                                sx={{ fontWeight: 'medium' }}
                              />
                            )}
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                              <Tooltip title="数据管理">
                                <IconButton
                                  size="small"
                                  onClick={() => handleOpenDataPage(key)}
                                  sx={{
                                    color: '#2196f3',
                                    '&:hover': { bgcolor: '#e3f2fd' }
                                  }}
                                >
                                  <DataObjectIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="测试API">
                                <IconButton
                                  size="small"
                                  onClick={() => handleOpenTestDialog(key)}
                                  sx={{
                                    color: '#4caf50',
                                    '&:hover': { bgcolor: '#e8f5e9' }
                                  }}
                                >
                                  <TestIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="编辑API">
                                <IconButton
                                  size="small"
                                  onClick={() => handleOpenDialog(key)}
                                  sx={{
                                    color: '#ff9800',
                                    '&:hover': { bgcolor: '#fff8e1' }
                                  }}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="复制API">
                                <IconButton
                                  size="small"
                                  onClick={() => handleDuplicateApi(key)}
                                  sx={{
                                    color: '#9c27b0',
                                    '&:hover': { bgcolor: '#f3e5f5' }
                                  }}
                                >
                                  <DuplicateIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="删除API">
                                <IconButton
                                  size="small"
                                  onClick={() => handleOpenDeleteDialog(key)}
                                  sx={{
                                    color: '#f44336',
                                    '&:hover': { bgcolor: '#ffebee' }
                                  }}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                            <ApiOutlined sx={{ fontSize: 48, color: '#bdbdbd' }} />
                            <Typography variant="h6" color="text.secondary">
                              没有找到API
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {searchTerm ? '尝试使用不同的搜索词或清除搜索' : '点击"添加API"按钮创建新的API'}
                            </Typography>
                            {searchTerm && (
                              <Button
                                variant="outlined"
                                size="small"
                                onClick={() => setSearchTerm('')}
                                sx={{ mt: 1 }}
                              >
                                清除搜索
                              </Button>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          )}
        </>
      )}

      {/* API编辑对话框 */}
      <Dialog open={isDialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle sx={{
          borderBottom: '1px solid #e0e0e0',
          bgcolor: '#f9f9f9',
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}>
          {selectedApi && apis[selectedApi.key] ? (
            <>
              <EditIcon sx={{ color: '#ff9800' }} />
              编辑API: {selectedApi.name}
            </>
          ) : (
            <>
              <AddIcon sx={{ color: '#2E7D32' }} />
              添加新API
            </>
          )}
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          {selectedApi && (
            <>
              <Alert
                severity="info"
                sx={{ mb: 3 }}
                icon={<InfoCircleOutlined />}
              >
                <Typography variant="subtitle2">API配置说明</Typography>
                <ul style={{ margin: '4px 0 0 0', paddingLeft: 16 }}>
                  <li>API键名是唯一标识符，用于在代码中引用此API</li>
                  <li>基础URL可以从下拉列表中选择，也可以直接输入完整URL</li>
                  <li>请求方法决定了API的调用方式，GET用于获取数据，POST用于提交数据</li>
                  <li>分类用于组织和管理API，便于查找和使用</li>
                </ul>
              </Alert>

              <Paper variant="outlined" sx={{ p: 3, mb: 3, borderRadius: 2 }}>
                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'medium', color: '#2E7D32', mb: 2 }}>
                  基本信息
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="API键名"
                      fullWidth
                      value={selectedApi.key}
                      onChange={(e) => handleApiFormChange('key', e.target.value)}
                      error={!!formErrors.key}
                      helperText={formErrors.key || "唯一标识符，用于在代码中引用此API"}
                      disabled={!!apis[selectedApi.key]} // 禁止编辑已存在的API键名
                      InputProps={{
                        startAdornment: (
                          <Box component="span" sx={{ color: 'action.active', mr: 1 }}>
                            <CodeIcon fontSize="small" />
                          </Box>
                        ),
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="API名称"
                      fullWidth
                      value={selectedApi.name}
                      onChange={(e) => handleApiFormChange('name', e.target.value)}
                      error={!!formErrors.name}
                      helperText={formErrors.name || "API的显示名称，便于识别"}
                      InputProps={{
                        startAdornment: (
                          <Box component="span" sx={{ color: 'action.active', mr: 1 }}>
                            <ApiOutlined fontSize="small" />
                          </Box>
                        ),
                      }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      API URL 构建
                    </Typography>

                    <Paper variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 1 }}>
                      <Grid container spacing={2}>
                        <Grid item xs={12}>
                          <FormControl fullWidth error={!!formErrors.baseUrl}>
                            <InputLabel>基础URL</InputLabel>
                            <Select
                              value={selectedApi.baseUrl || ""}
                              onChange={(e) => {
                                const newBaseUrl = e.target.value;
                                if (newBaseUrl) {
                                  // 更新基础URL
                                  const updates = { baseUrl: newBaseUrl };

                                  // 保持现有路径或设置为空路径
                                  const currentPath = selectedApi.path || '';

                                  // 同时更新完整URL
                                  updates.url = newBaseUrl + currentPath;

                                  // 批量更新状态，确保一致性
                                  setSelectedApi(prev => ({
                                    ...prev,
                                    ...updates
                                  }));

                                  // 清除相关错误
                                  if (formErrors.baseUrl || formErrors.url) {
                                    setFormErrors(prev => ({
                                      ...prev,
                                      baseUrl: null,
                                      url: null
                                    }));
                                  }
                                }
                              }}
                              label="基础URL"
                              displayEmpty
                              renderValue={(selected) => {
                                if (!selected) {
                                  return <em>选择基础URL</em>;
                                }

                                const selectedBaseUrl = baseUrls.find(url => url.url === selected);
                                if (selectedBaseUrl) {
                                  return (
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                      <Typography variant="body2" sx={{ mr: 1 }}>{selectedBaseUrl.name}:</Typography>
                                      <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                                        {selected}
                                      </Typography>
                                    </Box>
                                  );
                                }

                                return selected;
                              }}
                              MenuProps={{
                                PaperProps: {
                                  style: {
                                    maxHeight: 300
                                  }
                                }
                              }}
                            >
                              <MenuItem value="" disabled>
                                <em>选择基础URL</em>
                              </MenuItem>
                              {baseUrls.map((baseUrl) => (
                                <MenuItem key={baseUrl.id} value={baseUrl.url}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
                                    <Typography variant="body2">{baseUrl.name}</Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                      <Typography variant="caption" sx={{ color: 'text.secondary', fontFamily: 'monospace' }}>
                                        {baseUrl.url}
                                      </Typography>
                                      {baseUrl.isDefault && (
                                        <Chip
                                          label="默认"
                                          size="small"
                                          color="success"
                                          sx={{ ml: 1, height: 20, fontSize: '0.7rem' }}
                                        />
                                      )}
                                    </Box>
                                  </Box>
                                </MenuItem>
                              ))}
                              <Divider />
                              <Box sx={{ p: 1 }}>
                                <Button
                                  size="small"
                                  startIcon={<AddIcon />}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveTab(5);
                                    handleCloseDialog();
                                  }}
                                  fullWidth
                                >
                                  管理基础URL
                                </Button>
                              </Box>
                            </Select>
                            <FormHelperText>
                              {formErrors.baseUrl || "选择一个基础URL作为API的根地址"}
                            </FormHelperText>
                          </FormControl>
                        </Grid>

                        <Grid item xs={12}>
                          <TextField
                            label="API路径"
                            fullWidth
                            value={selectedApi.path || ""}
                            onChange={(e) => {
                              // 确保路径始终以/开头
                              let newPath = e.target.value;
                              if (newPath && !newPath.startsWith('/')) {
                                newPath = `/${newPath}`;
                              }

                              // 创建更新对象
                              const updates = { path: newPath };

                              // 同时更新完整URL
                              if (selectedApi.baseUrl) {
                                updates.url = selectedApi.baseUrl + newPath;
                              } else {
                                updates.url = newPath;
                              }

                              // 批量更新状态，确保一致性
                              setSelectedApi(prev => ({
                                ...prev,
                                ...updates
                              }));
                            }}
                            placeholder="/api/resource/{id}"
                            helperText="API路径，以/开头，可包含路径参数如 {id}"
                            InputProps={{
                              startAdornment: (
                                <Box component="span" sx={{ color: 'action.active', mr: 1 }}>
                                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                                  </svg>
                                </Box>
                              ),
                            }}
                          />
                        </Grid>

                        <Grid item xs={12}>
                          <Box sx={{ mt: 1 }}>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                              完整URL预览
                            </Typography>
                            <Paper
                              sx={{
                                p: 2,
                                bgcolor: '#f5f5f5',
                                borderRadius: 1,
                                fontFamily: 'monospace',
                                fontSize: '0.875rem',
                                position: 'relative',
                                minHeight: '56px',
                                display: 'flex',
                                alignItems: 'center',
                                overflow: 'hidden'
                              }}
                            >
                              <Box sx={{
                                width: 'calc(100% - 40px)',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                              }}>
                                {selectedApi.baseUrl ? (
                                  <>
                                    <Box
                                      component="span"
                                      sx={{
                                        color: '#2E7D32',
                                        fontWeight: 'medium',
                                        display: 'inline'
                                      }}
                                    >
                                      {selectedApi.baseUrl}
                                    </Box>
                                    <Box
                                      component="span"
                                      sx={{
                                        color: '#0D47A1',
                                        fontWeight: 'medium',
                                        display: 'inline'
                                      }}
                                    >
                                      {selectedApi.path || ''}
                                    </Box>
                                  </>
                                ) : (
                                  <Box component="span" sx={{ color: 'text.secondary' }}>
                                    请先选择基础URL并输入API路径
                                  </Box>
                                )}
                              </Box>
                              <Tooltip title="复制完整URL">
                                <span>
                                  <IconButton
                                    size="small"
                                    sx={{
                                      position: 'absolute',
                                      right: 8,
                                      color: 'action.active'
                                    }}
                                    onClick={() => {
                                      if (selectedApi.url) {
                                        navigator.clipboard.writeText(selectedApi.url);
                                        showSnackbar('URL已复制到剪贴板', 'success');
                                      }
                                    }}
                                    disabled={!selectedApi.url}
                                  >
                                    <ContentCopyIcon fontSize="small" />
                                  </IconButton>
                                </span>
                              </Tooltip>
                            </Paper>
                            {selectedApi.url && (
                              <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Typography variant="caption" color="text.secondary" sx={{
                                  display: 'block',
                                  maxWidth: 'calc(100% - 100px)',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap'
                                }}>
                                  完整URL: {selectedApi.url}
                                </Typography>
                                <Button
                                  size="small"
                                  variant="text"
                                  color="primary"
                                  onClick={() => {
                                    if (selectedApi.url) {
                                      navigator.clipboard.writeText(selectedApi.url);
                                      showSnackbar('URL已复制到剪贴板', 'success');
                                    }
                                  }}
                                  startIcon={<ContentCopyIcon fontSize="small" />}
                                >
                                  复制
                                </Button>
                              </Box>
                            )}
                          </Box>
                        </Grid>
                      </Grid>
                    </Paper>

                    <TextField
                      label="完整API URL"
                      fullWidth
                      value={selectedApi.url || ""}
                      onChange={(e) => {
                        const newUrl = e.target.value;

                        // 创建更新对象
                        const updates = { url: newUrl };

                        // 尝试从URL中提取baseUrl和path
                        try {
                          // 尝试匹配基础URL
                          const foundBaseUrl = baseUrls.find(base => newUrl.startsWith(base.url));
                          if (foundBaseUrl) {
                            updates.baseUrl = foundBaseUrl.url;
                            updates.path = newUrl.substring(foundBaseUrl.url.length);

                            // 确保路径始终以/开头
                            if (updates.path && !updates.path.startsWith('/')) {
                              updates.path = `/${updates.path}`;
                            }
                          } else {
                            // 尝试从URL中提取域名部分作为baseUrl
                            const urlMatch = newUrl.match(/^(https?:\/\/[^/]+)/i);
                            if (urlMatch) {
                              updates.baseUrl = urlMatch[1];
                              updates.path = newUrl.substring(urlMatch[1].length);

                              // 确保路径始终以/开头
                              if (updates.path && !updates.path.startsWith('/')) {
                                updates.path = `/${updates.path}`;
                              }
                            } else {
                              // 如果无法解析为有效URL，则清除baseUrl和path
                              updates.baseUrl = '';
                              updates.path = '';
                            }
                          }
                        } catch (error) {
                          console.error('解析URL失败:', error);
                        }

                        // 批量更新状态，确保一致性
                        setSelectedApi(prev => ({
                          ...prev,
                          ...updates
                        }));

                        // 清除URL相关错误
                        if (formErrors.url) {
                          setFormErrors(prev => ({
                            ...prev,
                            url: null
                          }));
                        }
                      }}
                      error={!!formErrors.url}
                      helperText={formErrors.url || "完整的API请求地址，包含协议、主机名和路径"}
                      InputProps={{
                        startAdornment: (
                          <Box component="span" sx={{ color: 'action.active', mr: 1 }}>
                            <LinkIcon fontSize="small" />
                          </Box>
                        ),
                      }}
                    />
                  </Grid>
                </Grid>
              </Paper>

              <Paper variant="outlined" sx={{ p: 3, mb: 3, borderRadius: 2 }}>
                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'medium', color: '#2E7D32', mb: 2 }}>
                  请求配置
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth error={!!formErrors.method}>
                      <InputLabel>请求方法</InputLabel>
                      <Select
                        value={selectedApi.method}
                        onChange={(e) => handleApiFormChange('method', e.target.value)}
                        label="请求方法"
                      >
                        <MenuItem value="GET">
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Chip
                              label="GET"
                              size="small"
                              sx={{
                                mr: 1,
                                bgcolor: '#e3f2fd',
                                color: '#0d47a1',
                                fontWeight: 'bold'
                              }}
                            />
                            <Typography variant="body2">获取数据</Typography>
                          </Box>
                        </MenuItem>
                        <MenuItem value="POST">
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Chip
                              label="POST"
                              size="small"
                              sx={{
                                mr: 1,
                                bgcolor: '#e8f5e9',
                                color: '#2e7d32',
                                fontWeight: 'bold'
                              }}
                            />
                            <Typography variant="body2">提交数据</Typography>
                          </Box>
                        </MenuItem>
                        <MenuItem value="PUT">
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Chip
                              label="PUT"
                              size="small"
                              sx={{
                                mr: 1,
                                bgcolor: '#fff8e1',
                                color: '#ff8f00',
                                fontWeight: 'bold'
                              }}
                            />
                            <Typography variant="body2">更新数据</Typography>
                          </Box>
                        </MenuItem>
                        <MenuItem value="DELETE">
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Chip
                              label="DELETE"
                              size="small"
                              sx={{
                                mr: 1,
                                bgcolor: '#ffebee',
                                color: '#c62828',
                                fontWeight: 'bold'
                              }}
                            />
                            <Typography variant="body2">删除数据</Typography>
                          </Box>
                        </MenuItem>
                        <MenuItem value="PATCH">
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Chip
                              label="PATCH"
                              size="small"
                              sx={{
                                mr: 1,
                                bgcolor: '#e0f7fa',
                                color: '#0097a7',
                                fontWeight: 'bold'
                              }}
                            />
                            <Typography variant="body2">部分更新</Typography>
                          </Box>
                        </MenuItem>
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
                        <MenuItem value="system">
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <CodeIcon fontSize="small" sx={{ mr: 1, color: '#0d47a1' }} />
                            <Typography variant="body2">系统API</Typography>
                          </Box>
                        </MenuItem>
                        <MenuItem value="data">
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <StorageIcon fontSize="small" sx={{ mr: 1, color: '#2e7d32' }} />
                            <Typography variant="body2">数据查询API</Typography>
                          </Box>
                        </MenuItem>
                        <MenuItem value="device">
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <SettingsIcon fontSize="small" sx={{ mr: 1, color: '#ff8f00' }} />
                            <Typography variant="body2">设备控制API</Typography>
                          </Box>
                        </MenuItem>
                        <MenuItem value="custom">
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <DataObjectIcon fontSize="small" sx={{ mr: 1, color: '#9c27b0' }} />
                            <Typography variant="body2">用户自定义API</Typography>
                          </Box>
                        </MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </Paper>

              <Paper variant="outlined" sx={{ p: 3, mb: 3, borderRadius: 2 }}>
                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'medium', color: '#2E7D32', mb: 2 }}>
                  高级设置
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      label="超时时间 (毫秒)"
                      fullWidth
                      type="number"
                      value={selectedApi.timeout}
                      onChange={(e) => handleApiFormChange('timeout', parseInt(e.target.value) || 0)}
                      helperText="请求超时时间，默认15000毫秒"
                      InputProps={{
                        startAdornment: (
                          <Box component="span" sx={{ color: 'action.active', mr: 1 }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="10"></circle>
                              <polyline points="12 6 12 12 16 14"></polyline>
                            </svg>
                          </Box>
                        ),
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      label="重试次数"
                      fullWidth
                      type="number"
                      value={selectedApi.retries}
                      onChange={(e) => handleApiFormChange('retries', parseInt(e.target.value) || 0)}
                      helperText="请求失败后的重试次数"
                      InputProps={{
                        startAdornment: (
                          <Box component="span" sx={{ color: 'action.active', mr: 1 }}>
                            <RefreshIcon fontSize="small" />
                          </Box>
                        ),
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      label="缓存时间 (秒)"
                      fullWidth
                      type="number"
                      value={selectedApi.cacheTime}
                      onChange={(e) => handleApiFormChange('cacheTime', parseInt(e.target.value) || 0)}
                      helperText="响应数据的缓存时间，0表示不缓存"
                      InputProps={{
                        startAdornment: (
                          <Box component="span" sx={{ color: 'action.active', mr: 1 }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                            </svg>
                          </Box>
                        ),
                      }}
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
                      helperText="API的详细描述，包括用途、参数说明等"
                      InputProps={{
                        startAdornment: (
                          <Box component="span" sx={{ color: 'action.active', mr: 1, mt: 1 }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="21" y1="10" x2="3" y2="10"></line>
                              <line x1="21" y1="6" x2="3" y2="6"></line>
                              <line x1="21" y1="14" x2="3" y2="14"></line>
                              <line x1="21" y1="18" x2="3" y2="18"></line>
                            </svg>
                          </Box>
                        ),
                      }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={selectedApi.enabled}
                          onChange={(e) => handleApiFormChange('enabled', e.target.checked)}
                          color="success"
                        />
                      }
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography variant="body1" sx={{ mr: 1 }}>启用API</Typography>
                          <Chip
                            label={selectedApi.enabled ? "已启用" : "已禁用"}
                            size="small"
                            color={selectedApi.enabled ? "success" : "default"}
                            sx={{ fontWeight: 'medium' }}
                          />
                        </Box>
                      }
                    />
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, ml: 4 }}>
                      禁用的API将不会被系统调用，但配置仍会保留
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ borderTop: '1px solid #e0e0e0', p: 2 }}>
          <Button
            onClick={handleCloseDialog}
            sx={{
              borderRadius: 2,
              color: '#2E7D32',
              '&:hover': {
                backgroundColor: 'rgba(46, 125, 50, 0.04)',
              }
            }}
          >
            取消
          </Button>
          <Button
            onClick={handleSaveApi}
            variant="contained"
            color="primary"
            startIcon={<SaveIcon />}
            sx={{
              borderRadius: 2,
              backgroundColor: '#2E7D32',
              '&:hover': {
                backgroundColor: '#388E3C',
              }
            }}
          >
            保存
          </Button>
        </DialogActions>
      </Dialog>

      {/* API测试对话框 */}
      <Dialog open={isTestDialogOpen} onClose={handleCloseTestDialog} maxWidth="md" fullWidth>
        <DialogTitle sx={{
          borderBottom: '1px solid #e0e0e0',
          bgcolor: '#f9f9f9',
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}>
          <TestIcon sx={{ color: '#2E7D32' }} />
          测试API: {selectedApi?.name}
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          {selectedApi && (
            <Box>
              <Paper variant="outlined" sx={{ p: 2, mb: 3, borderRadius: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={8}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      请求URL
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{
                        fontFamily: 'monospace',
                        bgcolor: '#f5f5f5',
                        p: 1,
                        borderRadius: 1,
                        overflowX: 'auto'
                      }}
                    >
                      {selectedApi.url}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      请求方法
                    </Typography>
                    <Chip
                      label={selectedApi.method}
                      sx={{
                        fontWeight: 'bold',
                        bgcolor:
                          selectedApi.method === 'GET' ? '#e3f2fd' :
                          selectedApi.method === 'POST' ? '#e8f5e9' :
                          selectedApi.method === 'PUT' ? '#fff8e1' :
                          selectedApi.method === 'DELETE' ? '#ffebee' :
                          '#f5f5f5',
                        color:
                          selectedApi.method === 'GET' ? '#0d47a1' :
                          selectedApi.method === 'POST' ? '#2e7d32' :
                          selectedApi.method === 'PUT' ? '#ff8f00' :
                          selectedApi.method === 'DELETE' ? '#c62828' :
                          '#616161'
                      }}
                    />
                  </Grid>
                </Grid>
              </Paper>

              <Tabs value={0} sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}>
                <Tab
                  label="请求参数"
                  sx={{
                    textTransform: 'none',
                    fontWeight: 'medium'
                  }}
                />
              </Tabs>

              <Paper variant="outlined" sx={{ p: 2, mb: 3, borderRadius: 2 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  请求参数 (JSON格式)
                </Typography>
                <JsonEditor
                  value={testParams}
                  onChange={handleTestParamsChange}
                  height="150px"
                />
              </Paper>

              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleTestApi}
                  disabled={isLoading}
                  startIcon={isLoading ? <CircularProgress size={20} /> : <TestIcon />}
                  sx={{
                    borderRadius: 2,
                    px: 4,
                    py: 1,
                    backgroundColor: '#2E7D32',
                    '&:hover': {
                      backgroundColor: '#388E3C',
                    }
                  }}
                >
                  {isLoading ? '测试中...' : '发送请求'}
                </Button>
              </Box>

              {testResult && (
                <Box>
                  <Divider sx={{ my: 3 }}>
                    <Chip
                      label="响应结果"
                      sx={{
                        fontWeight: 'medium',
                        bgcolor: testResult.success ? '#e8f5e9' : '#ffebee',
                        color: testResult.success ? '#2e7d32' : '#c62828'
                      }}
                    />
                  </Divider>

                  <Paper
                    variant="outlined"
                    sx={{
                      p: 2,
                      mb: 3,
                      borderRadius: 2,
                      borderColor: testResult.success ? '#81c784' : '#e57373',
                      bgcolor: testResult.success ? 'rgba(46, 125, 50, 0.04)' : 'rgba(198, 40, 40, 0.04)'
                    }}
                  >
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <Alert
                          severity={testResult.success ? 'success' : 'error'}
                          sx={{ mb: 2 }}
                          variant="filled"
                        >
                          {testResult.success ? '请求成功' : `请求失败: ${testResult.error || '未知错误'}`}
                        </Alert>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          响应时间
                        </Typography>
                        <Chip
                          label={`${testResult.responseTime}ms`}
                          size="small"
                          sx={{ fontWeight: 'medium' }}
                        />
                      </Grid>
                      {testResult.status && (
                        <Grid item xs={12} sm={6}>
                          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            状态码
                          </Typography>
                          <Chip
                            label={`${testResult.status} ${testResult.statusText}`}
                            size="small"
                            color={testResult.status >= 200 && testResult.status < 300 ? 'success' : 'error'}
                            sx={{ fontWeight: 'medium' }}
                          />
                        </Grid>
                      )}
                    </Grid>
                  </Paper>

                  {testResult.data && (
                    <Paper variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        响应数据
                      </Typography>
                      <Paper sx={{ p: 2, bgcolor: '#f5f5f5', maxHeight: '300px', overflow: 'auto', borderRadius: 1 }}>
                        <pre style={{ margin: 0 }}>{JSON.stringify(testResult.data, null, 2)}</pre>
                      </Paper>
                    </Paper>
                  )}
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ borderTop: '1px solid #e0e0e0', p: 2 }}>
          <Button
            onClick={handleCloseTestDialog}
            sx={{
              borderRadius: 2,
              color: '#2E7D32',
              '&:hover': {
                backgroundColor: 'rgba(46, 125, 50, 0.04)',
              }
            }}
          >
            关闭
          </Button>
          {testResult && (
            <Button
              variant="outlined"
              onClick={() => {
                setTestResult(null);
                setTestParams('{}');
              }}
              sx={{
                borderRadius: 2,
                borderColor: '#2E7D32',
                color: '#2E7D32',
                '&:hover': {
                  borderColor: '#388E3C',
                  backgroundColor: 'rgba(56, 142, 60, 0.04)',
                }
              }}
            >
              清除结果
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* 删除确认对话框 */}
      <Dialog open={isDeleteDialogOpen} onClose={handleCloseDeleteDialog}>
        <DialogTitle sx={{
          borderBottom: '1px solid #e0e0e0',
          bgcolor: '#f9f9f9',
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}>
          <DeleteIcon sx={{ color: '#f44336' }} />
          删除API
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="subtitle2">
              此操作不可撤销，请谨慎操作！
            </Typography>
          </Alert>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography>
              您确定要删除以下API吗？
            </Typography>
            {selectedApi && (
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      API键名
                    </Typography>
                    <Typography variant="body1" sx={{ fontFamily: 'monospace', fontWeight: 'medium' }}>
                      {selectedApi.key}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      API名称
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                      {selectedApi.name}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">
                      URL
                    </Typography>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                      {selectedApi.url}
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ borderTop: '1px solid #e0e0e0', p: 2 }}>
          <Button
            onClick={handleCloseDeleteDialog}
            sx={{
              borderRadius: 2,
              color: '#2E7D32',
              '&:hover': {
                backgroundColor: 'rgba(46, 125, 50, 0.04)',
              }
            }}
          >
            取消
          </Button>
          <Button
            onClick={handleDeleteApi}
            variant="contained"
            color="error"
            startIcon={<DeleteIcon />}
            sx={{
              borderRadius: 2
            }}
          >
            确认删除
          </Button>
        </DialogActions>
      </Dialog>

      {/* 消息提示 */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        message={snackbar.message}
        severity={snackbar.severity}
      />
    </Box>
  );
};

export default ApiManagement;
