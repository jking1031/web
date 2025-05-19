import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Button,
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
  IconButton,
  Tooltip,
  Divider,
  Paper,
  FormHelperText,
  Alert,
  Snackbar
} from '@mui/material';
import {
  LineChartOutlined,
  SettingOutlined,
  ReloadOutlined,
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  CloseOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined
} from '@ant-design/icons';
import { Line } from '@ant-design/charts';
import moment from 'moment';
import api from '../../../api/interceptors';
import apiManager from '../../../services/apiManager';
import { Resizable } from 're-resizable';
import TrendChartItem from './TrendChartItem';
import styles from './EnhancedTrendChart.module.scss';
import { useAuth } from '../../../context/AuthContext';
import AdminCheck from '../../../components/Auth/AdminCheck';

/**
 * 增强版趋势图组件
 * 支持多个趋势图，用户可以添加、删除和配置趋势图
 */
const EnhancedTrendChart = () => {
  // 趋势图列表
  const [trendCharts, setTrendCharts] = useState([]);
  // 数据源列表
  const [dataSources, setDataSources] = useState([]);
  // 查询命令列表
  const [queryCommands, setQueryCommands] = useState([]);
  // 加载状态
  const [loading, setLoading] = useState(true);
  // 添加/编辑对话框
  const [dialogOpen, setDialogOpen] = useState(false);
  // 当前编辑的趋势图
  const [currentTrend, setCurrentTrend] = useState(null);
  // 全局设置对话框
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  // 可用API列表
  const [availableApis, setAvailableApis] = useState([]);
  // 通知消息
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });
  // 全局设置
  const [globalSettings, setGlobalSettings] = useState({
    layout: 'grid', // grid, flex
    columns: 2,
    autoResize: true,
    defaultHeight: 400,
    defaultWidth: 500,
    refreshInterval: 60000 // 1分钟
  });
  // 定时器引用
  const timersRef = useRef({});

  // 初始化 - 加载数据源、查询命令、API列表和趋势图配置
  useEffect(() => {
    loadDataSources();
    loadQueryCommands();
    loadAvailableApis();
    loadTrendCharts();
  }, []);

  // 加载数据源
  const loadDataSources = () => {
    try {
      const savedDataSources = localStorage.getItem('dataSources');
      if (savedDataSources) {
        setDataSources(JSON.parse(savedDataSources));
      } else {
        setDataSources([]);
      }
    } catch (error) {
      console.error('加载数据源失败:', error);
      setDataSources([]);
    }
  };

  // 加载查询命令
  const loadQueryCommands = () => {
    try {
      const savedQueries = localStorage.getItem('dataQueries');
      if (savedQueries) {
        // 只加载启用的查询命令
        const queries = JSON.parse(savedQueries);
        setQueryCommands(queries.filter(q => q.enabled));
      } else {
        setQueryCommands([]);
      }
    } catch (error) {
      console.error('[EnhancedTrendChart] 加载查询命令失败:', error);
      setQueryCommands([]);
    }
  };

  // 加载可用API列表
  const loadAvailableApis = () => {
    try {
      // 从API管理系统获取所有API
      const allApis = apiManager.registry.getAll();

      // 过滤出数据类别的API
      const dataApis = Object.entries(allApis)
        .filter(([key, api]) =>
          api.category === apiManager.API_CATEGORIES.DATA ||
          key.toLowerCase().includes('data') ||
          key.toLowerCase().includes('trend')
        )
        .map(([key, api]) => ({
          key,
          name: api.name || key,
          description: api.description || '',
          url: api.url,
          method: api.method
        }));

      setAvailableApis(dataApis);
      console.log(`[EnhancedTrendChart] 已加载 ${dataApis.length} 个可用API`);
    } catch (error) {
      console.error('[EnhancedTrendChart] 加载API列表失败:', error);
      setAvailableApis([]);
    }
  };

  // 加载趋势图配置
  const loadTrendCharts = () => {
    try {
      const savedTrendCharts = localStorage.getItem('trendCharts');
      if (savedTrendCharts) {
        setTrendCharts(JSON.parse(savedTrendCharts));
      } else {
        setTrendCharts([]);
      }

      // 加载全局设置
      const savedSettings = localStorage.getItem('trendChartsSettings');
      if (savedSettings) {
        setGlobalSettings(JSON.parse(savedSettings));
      }
    } catch (error) {
      console.error('[EnhancedTrendChart] 加载趋势图配置失败:', error);
      setTrendCharts([]);
    } finally {
      setLoading(false);
    }
  };

  // 保存趋势图配置
  const saveTrendCharts = (charts) => {
    try {
      localStorage.setItem('trendCharts', JSON.stringify(charts));
    } catch (error) {
      console.error('[EnhancedTrendChart] 保存趋势图配置失败:', error);
    }
  };

  // 保存全局设置
  const saveGlobalSettings = (settings) => {
    try {
      localStorage.setItem('trendChartsSettings', JSON.stringify(settings));
      setGlobalSettings(settings);
    } catch (error) {
      console.error('[EnhancedTrendChart] 保存全局设置失败:', error);
    }
  };

  // 打开添加趋势图对话框
  const handleAddTrend = () => {
    setCurrentTrend({
      id: `trend-${Date.now()}`,
      title: '新趋势图',
      queryId: queryCommands.length > 0 ? queryCommands[0].id : '',
      height: globalSettings.defaultHeight,
      width: globalSettings.defaultWidth,
      autoScale: true,
      showLegend: true,
      data: [],
      // API配置
      apiConfig: {
        useApi: true, // 默认使用API系统
        apiKey: 'getTrendData', // 使用API管理系统中注册的API
        fields: ['flow_in', 'flow_out', 'pressure'],
        interval: '1h',
        timeRange: 24, // 24小时
        timeout: 15000,
        headers: {},
        customParams: {
          deviceId: '1', // 默认设备ID
          type: 'realtime' // 默认数据类型
        }
      }
    });
    setDialogOpen(true);
  };

  // 打开编辑趋势图对话框
  const handleEditTrend = (trend) => {
    // 使用深拷贝，避免直接修改原对象
    const trendCopy = JSON.parse(JSON.stringify(trend));
    setCurrentTrend(trendCopy);
    setDialogOpen(true);
  };

  // 关闭对话框
  const handleCloseDialog = () => {
    setDialogOpen(false);
    // 延迟清除currentTrend，避免对话框关闭动画过程中的不必要渲染
    setTimeout(() => {
      setCurrentTrend(null);
    }, 300);
  };

  // 保存趋势图
  const handleSaveTrend = () => {
    if (!currentTrend) return;

    // 验证标题
    if (!currentTrend.title || currentTrend.title.trim() === '') {
      alert('请输入趋势图标题');
      return;
    }

    // 确保API配置正确
    if (currentTrend.apiConfig?.useApi && !currentTrend.apiConfig.apiKey) {
      alert('请选择有效的API');
      return;
    }

    // 创建深拷贝，避免引用问题
    const updatedTrend = JSON.parse(JSON.stringify(currentTrend));

    let newTrendCharts = [...trendCharts];
    const existingIndex = newTrendCharts.findIndex(t => t.id === updatedTrend.id);

    if (existingIndex >= 0) {
      // 更新现有趋势图
      newTrendCharts[existingIndex] = updatedTrend;
    } else {
      // 添加新趋势图
      newTrendCharts.push(updatedTrend);
    }

    // 更新状态并保存到localStorage
    setTrendCharts(newTrendCharts);
    saveTrendCharts(newTrendCharts);

    // 关闭对话框
    setDialogOpen(false);
    setCurrentTrend(null);
  };

  // 删除趋势图
  const handleDeleteTrend = (id) => {
    const newTrendCharts = trendCharts.filter(t => t.id !== id);
    setTrendCharts(newTrendCharts);
    saveTrendCharts(newTrendCharts);

    // 清除定时器
    if (timersRef.current[id]) {
      clearInterval(timersRef.current[id]);
      delete timersRef.current[id];
    }
  };

  // 打开全局设置对话框
  const handleOpenSettings = () => {
    setSettingsDialogOpen(true);
  };

  // 关闭全局设置对话框
  const handleCloseSettings = () => {
    setSettingsDialogOpen(false);
  };

  // 保存全局设置
  const handleSaveSettings = () => {
    // 保存全局设置
    saveGlobalSettings(globalSettings);

    // 更新所有趋势图的刷新间隔
    // 清除所有现有的定时器
    Object.keys(timersRef.current).forEach(id => {
      clearInterval(timersRef.current[id]);
      delete timersRef.current[id];
    });

    // 重新设置所有趋势图的定时器
    trendCharts.forEach(trend => {
      timersRef.current[trend.id] = setInterval(() => {
        // 这里不直接调用fetchData，因为它是TrendChartItem组件内部的函数
        // 而是在下一次渲染时，TrendChartItem组件会接收到新的refreshInterval
      }, globalSettings.refreshInterval);
    });

    // 提示用户设置已保存
    alert('设置已保存，刷新间隔已应用到所有趋势图。其他设置将在下次添加趋势图时生效。');

    // 关闭对话框
    setSettingsDialogOpen(false);
  };

  // 处理趋势图大小调整
  const handleResizeStop = (id, size) => {
    const newTrendCharts = trendCharts.map(t => {
      if (t.id === id) {
        return { ...t, width: size.width, height: size.height };
      }
      return t;
    });
    setTrendCharts(newTrendCharts);
    saveTrendCharts(newTrendCharts);
  };

  // 渲染趋势图列表
  const renderTrendCharts = () => {
    if (trendCharts.length === 0) {
      return (
        <Box sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '200px',
          border: '1px dashed #ccc',
          borderRadius: 1,
          backgroundColor: '#f9f9f9'
        }}>
          <Typography variant="body1" color="textSecondary">
            暂无趋势图，请点击"添加趋势图"按钮添加
          </Typography>
        </Box>
      );
    }

    return (
      <Grid container spacing={2} sx={{ mt: 1 }}>
        {trendCharts.map(trend => (
          <Grid item key={trend.id} xs={12} md={globalSettings.layout === 'grid' ? 12 / globalSettings.columns : 12}>
            <TrendChartItem
              trend={trend}
              dataSources={dataSources}
              queryCommands={queryCommands}
              onEdit={() => handleEditTrend(trend)}
              onDelete={() => handleDeleteTrend(trend.id)}
              onResize={(size) => handleResizeStop(trend.id, size)}
              refreshInterval={globalSettings.refreshInterval}
              timersRef={timersRef}
            />
          </Grid>
        ))}
      </Grid>
    );
  };

  const { isAdmin } = useAuth();

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <LineChartOutlined style={{ fontSize: 24, marginRight: 8, color: '#2E7D32' }} />
            <Typography variant="h6">实时趋势</Typography>
          </Box>
          <Box>
            <AdminCheck silent>
              <Button
                startIcon={<PlusOutlined />}
                onClick={handleAddTrend}
                sx={{ mr: 1 }}
              >
                添加趋势图
              </Button>
              <Button
                startIcon={<SettingOutlined />}
                onClick={handleOpenSettings}
              >
                显示设置
              </Button>
            </AdminCheck>
          </Box>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
            <CircularProgress />
          </Box>
        ) : (
          renderTrendCharts()
        )}

        {/* 通知消息 */}
        <Snackbar
          open={notification.open}
          autoHideDuration={6000}
          onClose={() => setNotification({ ...notification, open: false })}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert
            onClose={() => setNotification({ ...notification, open: false })}
            severity={notification.severity}
            sx={{ width: '100%' }}
          >
            {notification.message}
          </Alert>
        </Snackbar>
      </CardContent>

      {/* 添加/编辑趋势图对话框 */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{currentTrend?.id.startsWith('trend-') ? '添加趋势图' : '编辑趋势图'}</DialogTitle>
        <DialogContent>
          {currentTrend && (
            <Box sx={{ mt: 2 }}>
              <TextField
                label="标题"
                value={currentTrend.title || ''}
                onChange={(e) => setCurrentTrend({ ...currentTrend, title: e.target.value })}
                fullWidth
                margin="normal"
                required
              />

              <FormControl fullWidth margin="normal">
                <InputLabel>数据来源</InputLabel>
                <Select
                  value={currentTrend.apiConfig?.useApi ? 'api' : 'query'}
                  onChange={(e) => {
                    const useApi = e.target.value === 'api';
                    setCurrentTrend({
                      ...currentTrend,
                      apiConfig: {
                        ...currentTrend.apiConfig,
                        useApi
                      }
                    });
                  }}
                  label="数据来源"
                >
                  <MenuItem value="query">系统设置中的查询命令</MenuItem>
                  <MenuItem value="api">直接使用API</MenuItem>
                </Select>
              </FormControl>

              {!currentTrend.apiConfig?.useApi && (
                <FormControl fullWidth margin="normal">
                  <InputLabel>查询命令</InputLabel>
                  <Select
                    value={currentTrend.queryId || ''}
                    onChange={(e) => setCurrentTrend({ ...currentTrend, queryId: e.target.value })}
                    label="查询命令"
                    disabled={queryCommands.length === 0}
                  >
                    {queryCommands.length === 0 ? (
                      <MenuItem value="">
                        <em>没有可用的查询命令</em>
                      </MenuItem>
                    ) : (
                      queryCommands.map(query => (
                        <MenuItem key={query.id} value={query.id}>
                          {query.name}
                        </MenuItem>
                      ))
                    )}
                  </Select>
                </FormControl>
              )}

              {currentTrend.apiConfig?.useApi && (
                <>
                  <FormControl fullWidth margin="normal">
                    <InputLabel>API选择</InputLabel>
                    <Select
                      value={currentTrend.apiConfig?.apiKey || 'getTrendData'}
                      onChange={(e) => {
                        setCurrentTrend({
                          ...currentTrend,
                          apiConfig: {
                            ...currentTrend.apiConfig,
                            apiKey: e.target.value
                          }
                        });
                      }}
                      label="API选择"
                    >
                      {availableApis.length === 0 ? (
                        <MenuItem value="getTrendData">获取趋势数据 (getTrendData)</MenuItem>
                      ) : (
                        availableApis.map(api => (
                          <MenuItem key={api.key} value={api.key}>
                            {api.name} ({api.key})
                          </MenuItem>
                        ))
                      )}
                    </Select>
                    <FormHelperText>
                      选择API管理系统中注册的API
                      {availableApis.length === 0 && ' - 未找到可用API，请先在API管理页面注册API'}
                    </FormHelperText>
                  </FormControl>

                  {/* 显示所选API的详细信息 */}
                  {currentTrend.apiConfig?.apiKey && (
                    <Box sx={{ mt: 1, p: 1, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                      <Typography variant="caption" color="textSecondary">
                        API详情: {
                          availableApis.find(api => api.key === currentTrend.apiConfig?.apiKey)?.description ||
                          '获取数据API'
                        }
                      </Typography>
                    </Box>
                  )}

                  <TextField
                    label="数据字段"
                    value={currentTrend.apiConfig?.fields?.join(', ') || ''}
                    onChange={(e) => setCurrentTrend({
                      ...currentTrend,
                      apiConfig: {
                        ...currentTrend.apiConfig,
                        fields: e.target.value.split(',').map(f => f.trim())
                      }
                    })}
                    fullWidth
                    margin="normal"
                    helperText="多个字段用逗号分隔，例如：flow_in, flow_out, pressure"
                  />

                  <FormControl fullWidth margin="normal">
                    <InputLabel>数据间隔</InputLabel>
                    <Select
                      value={currentTrend.apiConfig?.interval || '1h'}
                      onChange={(e) => setCurrentTrend({
                        ...currentTrend,
                        apiConfig: {
                          ...currentTrend.apiConfig,
                          interval: e.target.value
                        }
                      })}
                      label="数据间隔"
                    >
                      <MenuItem value="1m">1分钟</MenuItem>
                      <MenuItem value="5m">5分钟</MenuItem>
                      <MenuItem value="15m">15分钟</MenuItem>
                      <MenuItem value="30m">30分钟</MenuItem>
                      <MenuItem value="1h">1小时</MenuItem>
                      <MenuItem value="6h">6小时</MenuItem>
                      <MenuItem value="12h">12小时</MenuItem>
                      <MenuItem value="1d">1天</MenuItem>
                    </Select>
                  </FormControl>

                  <FormControl fullWidth margin="normal">
                    <InputLabel>时间范围</InputLabel>
                    <Select
                      value={currentTrend.apiConfig?.timeRange || 24}
                      onChange={(e) => setCurrentTrend({
                        ...currentTrend,
                        apiConfig: {
                          ...currentTrend.apiConfig,
                          timeRange: e.target.value
                        }
                      })}
                      label="时间范围"
                    >
                      <MenuItem value={6}>最近6小时</MenuItem>
                      <MenuItem value={12}>最近12小时</MenuItem>
                      <MenuItem value={24}>最近24小时</MenuItem>
                      <MenuItem value={48}>最近2天</MenuItem>
                      <MenuItem value={72}>最近3天</MenuItem>
                      <MenuItem value={168}>最近7天</MenuItem>
                    </Select>
                  </FormControl>

                  <TextField
                    label="超时时间 (毫秒)"
                    type="number"
                    value={currentTrend.apiConfig?.timeout || 15000}
                    onChange={(e) => setCurrentTrend({
                      ...currentTrend,
                      apiConfig: {
                        ...currentTrend.apiConfig,
                        timeout: parseInt(e.target.value)
                      }
                    })}
                    fullWidth
                    margin="normal"
                    helperText="API请求超时时间，单位毫秒"
                  />

                  <TextField
                    label="自定义参数 (JSON)"
                    value={JSON.stringify(currentTrend.apiConfig?.customParams || {}, null, 2)}
                    onChange={(e) => {
                      try {
                        const customParams = JSON.parse(e.target.value);
                        setCurrentTrend({
                          ...currentTrend,
                          apiConfig: {
                            ...currentTrend.apiConfig,
                            customParams
                          }
                        });
                      } catch (error) {
                        // 解析错误，不更新
                        console.error('[EnhancedTrendChart] JSON解析错误:', error.message);
                      }
                    }}
                    fullWidth
                    margin="normal"
                    multiline
                    rows={3}
                    helperText="自定义参数，JSON格式，例如：{ 'deviceId': '123' }"
                  />

                  <TextField
                    label="自定义请求头 (JSON)"
                    value={JSON.stringify(currentTrend.apiConfig?.headers || {}, null, 2)}
                    onChange={(e) => {
                      try {
                        const headers = JSON.parse(e.target.value);
                        setCurrentTrend({
                          ...currentTrend,
                          apiConfig: {
                            ...currentTrend.apiConfig,
                            headers
                          }
                        });
                      } catch (error) {
                        // 解析错误，不更新
                        console.error('[EnhancedTrendChart] JSON解析错误:', error.message);
                      }
                    }}
                    fullWidth
                    margin="normal"
                    multiline
                    rows={3}
                    helperText="自定义请求头，JSON格式，例如：{ 'Authorization': 'Bearer token' }"
                  />
                </>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>取消</Button>
          {currentTrend?.apiConfig?.useApi && currentTrend.apiConfig?.apiKey && (
            <Button
              onClick={() => {
                // 创建测试函数
                const testApi = async () => {
                  try {
                    // 显示测试中提示
                    setNotification({
                      open: true,
                      message: '正在测试API，请稍候...',
                      severity: 'info'
                    });

                    // 构建API请求参数
                    const apiParams = {
                      startTime: moment().subtract(1, 'hours').format('YYYY-MM-DD HH:mm:ss'),
                      endTime: moment().format('YYYY-MM-DD HH:mm:ss'),
                      interval: currentTrend.apiConfig.interval || '1h',
                      fields: currentTrend.apiConfig.fields || ['flow_in', 'flow_out', 'pressure']
                    };

                    // 合并自定义参数
                    if (currentTrend.apiConfig.customParams) {
                      Object.assign(apiParams, currentTrend.apiConfig.customParams);
                    }

                    console.log(`测试API: ${currentTrend.apiConfig.apiKey}`, {
                      params: apiParams
                    });

                    // 使用API管理系统测试API
                    const result = await apiManager.test(currentTrend.apiConfig.apiKey, apiParams);

                    console.log('API测试结果:', result);

                    if (result.success) {
                      // 显示测试成功结果
                      setNotification({
                        open: true,
                        message: `API测试成功！数据长度: ${Array.isArray(result.data) ? result.data.length : '非数组'}`,
                        severity: 'success'
                      });
                    } else {
                      throw new Error(result.error || '未知错误');
                    }
                  } catch (error) {
                    console.error('API测试失败:', error);
                    setNotification({
                      open: true,
                      message: `API测试失败: ${error.message || '未知错误'}`,
                      severity: 'error'
                    });
                  }
                };

                // 执行测试
                testApi();
              }}
              color="secondary"
            >
              测试API
            </Button>
          )}
          <Button onClick={handleSaveTrend} variant="contained" color="primary">保存</Button>
        </DialogActions>
      </Dialog>

      {/* 全局设置对话框 */}
      <Dialog open={settingsDialogOpen} onClose={handleCloseSettings} maxWidth="sm" fullWidth>
        <DialogTitle>趋势图显示设置</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <FormControl fullWidth margin="normal">
              <InputLabel>布局方式</InputLabel>
              <Select
                value={globalSettings.layout}
                onChange={(e) => setGlobalSettings({ ...globalSettings, layout: e.target.value })}
                label="布局方式"
              >
                <MenuItem value="grid">网格布局</MenuItem>
                <MenuItem value="flex">流式布局</MenuItem>
              </Select>
            </FormControl>

            {globalSettings.layout === 'grid' && (
              <FormControl fullWidth margin="normal">
                <InputLabel>每行列数</InputLabel>
                <Select
                  value={globalSettings.columns}
                  onChange={(e) => setGlobalSettings({ ...globalSettings, columns: e.target.value })}
                  label="每行列数"
                >
                  <MenuItem value={1}>1列</MenuItem>
                  <MenuItem value={2}>2列</MenuItem>
                  <MenuItem value={3}>3列</MenuItem>
                  <MenuItem value={4}>4列</MenuItem>
                </Select>
              </FormControl>
            )}

            <FormControl fullWidth margin="normal">
              <InputLabel>刷新间隔</InputLabel>
              <Select
                value={globalSettings.refreshInterval}
                onChange={(e) => setGlobalSettings({ ...globalSettings, refreshInterval: e.target.value })}
                label="刷新间隔"
              >
                <MenuItem value={10000}>10秒</MenuItem>
                <MenuItem value={30000}>30秒</MenuItem>
                <MenuItem value={60000}>1分钟</MenuItem>
                <MenuItem value={300000}>5分钟</MenuItem>
                <MenuItem value={600000}>10分钟</MenuItem>
                <MenuItem value={1800000}>30分钟</MenuItem>
                <MenuItem value={3600000}>1小时</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="默认高度"
              type="number"
              value={globalSettings.defaultHeight}
              onChange={(e) => setGlobalSettings({ ...globalSettings, defaultHeight: parseInt(e.target.value) })}
              fullWidth
              margin="normal"
            />

            <TextField
              label="默认宽度"
              type="number"
              value={globalSettings.defaultWidth}
              onChange={(e) => setGlobalSettings({ ...globalSettings, defaultWidth: parseInt(e.target.value) })}
              fullWidth
              margin="normal"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseSettings}>取消</Button>
          <Button onClick={handleSaveSettings} variant="contained" color="primary">保存</Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default EnhancedTrendChart;
