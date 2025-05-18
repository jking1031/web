import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Tabs, 
  Tab, 
  Paper, 
  Divider,
  Button,
  IconButton,
  Tooltip,
  CircularProgress
} from '@mui/material';
import { 
  ApiOutlined, 
  DatabaseOutlined, 
  SettingOutlined, 
  FileTextOutlined,
  PlusOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';
import AdminCheck from '../../components/Auth/AdminCheck';
import ApiList from './components/ApiList';
import ApiDetail from './components/ApiDetail';
import ApiTestPanel from './components/ApiTestPanel';
import DatabaseManagement from './components/DatabaseManagement';
import QueryManagement from './components/QueryManagement';
import DocumentationPanel from './components/DocumentationPanel';
import apiManager from '../../services/apiManager';
import { useSnackbar } from 'notistack';

// 标签面板内容
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`api-management-tabpanel-${index}`}
      aria-labelledby={`api-management-tab-${index}`}
      {...other}
      style={{ height: 'calc(100vh - 200px)', overflow: 'auto' }}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

// API 管理页面
function ApiManagementPage() {
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [apis, setApis] = useState({});
  const [selectedApiKey, setSelectedApiKey] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { isAdmin } = useAuth();
  const { enqueueSnackbar } = useSnackbar();

  // 加载 API 列表
  useEffect(() => {
    const loadApis = async () => {
      setLoading(true);
      try {
        const allApis = apiManager.registry.getAll();
        setApis(allApis);
        
        // 如果没有选中的 API，默认选中第一个
        if (!selectedApiKey && Object.keys(allApis).length > 0) {
          setSelectedApiKey(Object.keys(allApis)[0]);
        }
      } catch (error) {
        console.error('加载 API 列表失败:', error);
        enqueueSnackbar('加载 API 列表失败', { variant: 'error' });
      } finally {
        setLoading(false);
      }
    };

    loadApis();
  }, [refreshTrigger, enqueueSnackbar, selectedApiKey]);

  // 处理标签切换
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // 处理 API 选择
  const handleApiSelect = (apiKey) => {
    setSelectedApiKey(apiKey);
  };

  // 处理 API 创建
  const handleApiCreate = () => {
    // 打开创建 API 对话框
    // 这里将在后续实现
  };

  // 处理 API 刷新
  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  // 处理 API 更新
  const handleApiUpdate = (apiKey, apiConfig) => {
    try {
      const success = apiManager.registry.update(apiKey, apiConfig);
      if (success) {
        enqueueSnackbar('API 更新成功', { variant: 'success' });
        handleRefresh();
      } else {
        enqueueSnackbar('API 更新失败', { variant: 'error' });
      }
    } catch (error) {
      console.error('更新 API 失败:', error);
      enqueueSnackbar(`更新 API 失败: ${error.message}`, { variant: 'error' });
    }
  };

  // 处理 API 删除
  const handleApiDelete = (apiKey) => {
    try {
      const success = apiManager.registry.remove(apiKey);
      if (success) {
        enqueueSnackbar('API 删除成功', { variant: 'success' });
        setSelectedApiKey(null);
        handleRefresh();
      } else {
        enqueueSnackbar('API 删除失败', { variant: 'error' });
      }
    } catch (error) {
      console.error('删除 API 失败:', error);
      enqueueSnackbar(`删除 API 失败: ${error.message}`, { variant: 'error' });
    }
  };

  // 处理 API 测试
  const handleApiTest = async (apiKey, params) => {
    try {
      setLoading(true);
      const result = await apiManager.test(apiKey, params);
      return result;
    } catch (error) {
      console.error('测试 API 失败:', error);
      enqueueSnackbar(`测试 API 失败: ${error.message}`, { variant: 'error' });
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminCheck>
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            API 管理
          </Typography>
          <Box>
            <Tooltip title="刷新">
              <IconButton onClick={handleRefresh} disabled={loading}>
                <ReloadOutlined />
              </IconButton>
            </Tooltip>
            {isAdmin && (
              <Tooltip title="创建 API">
                <IconButton onClick={handleApiCreate} disabled={loading} color="primary">
                  <PlusOutlined />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Box>

        <Paper sx={{ width: '100%', mb: 2 }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            indicatorColor="primary"
            textColor="primary"
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab icon={<ApiOutlined />} label="API 列表" />
            <Tab icon={<DatabaseOutlined />} label="数据库管理" />
            <Tab icon={<SettingOutlined />} label="查询管理" />
            <Tab icon={<FileTextOutlined />} label="API 文档" />
          </Tabs>
          <Divider />

          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
              <CircularProgress />
            </Box>
          )}

          <TabPanel value={tabValue} index={0}>
            <Box sx={{ display: 'flex', height: '100%' }}>
              <Box sx={{ width: 300, borderRight: '1px solid #eee', pr: 2, height: '100%', overflow: 'auto' }}>
                <ApiList 
                  apis={apis} 
                  selectedApiKey={selectedApiKey} 
                  onApiSelect={handleApiSelect} 
                />
              </Box>
              <Box sx={{ flex: 1, pl: 2, height: '100%', overflow: 'auto' }}>
                {selectedApiKey ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                    <ApiDetail 
                      apiKey={selectedApiKey} 
                      apiConfig={apis[selectedApiKey]} 
                      onUpdate={handleApiUpdate}
                      onDelete={handleApiDelete}
                      isAdmin={isAdmin}
                    />
                    <Divider sx={{ my: 2 }} />
                    <ApiTestPanel 
                      apiKey={selectedApiKey} 
                      apiConfig={apis[selectedApiKey]} 
                      onTest={handleApiTest}
                    />
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                    <Typography variant="body1" color="textSecondary">
                      请选择一个 API 或创建新的 API
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <DatabaseManagement />
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <QueryManagement />
          </TabPanel>

          <TabPanel value={tabValue} index={3}>
            <DocumentationPanel apis={apis} />
          </TabPanel>
        </Paper>
      </Container>
    </AdminCheck>
  );
}

export default ApiManagementPage;
