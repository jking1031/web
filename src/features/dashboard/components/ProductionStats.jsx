import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Grid,
  Box,
  CircularProgress,
  Button,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  TextField,
  Paper,
  Alert,
  Checkbox
} from '@mui/material';
import { message } from 'antd';
import {
  BarChartOutlined,
  EditOutlined,
  ReloadOutlined,
  ExperimentOutlined,
  ThunderboltOutlined,
  EnvironmentOutlined,
  EnterOutlined,
  ExportOutlined,
  DashboardOutlined,
  AppstoreOutlined
} from '@ant-design/icons';
import moment from 'moment';
import apiManager from '../../../services/api/core/apiManager';
import { useAuth } from '../../../context/AuthContext';

/**
 * 生产数据统计组件
 * 显示自定义数据卡片，由管理员配置
 */
const ProductionStats = ({ refreshMode = 'realtime', refreshInterval = 10 }) => {
  // 使用AuthContext中的isAdmin
  const { isAdmin } = useAuth();
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [data, setData] = useState({});

  // 对话框状态
  const [isAddCardDialogOpen, setIsAddCardDialogOpen] = useState(false);
  const [isApiSelectDialogOpen, setIsApiSelectDialogOpen] = useState(false);
  const [isEditCardsDialogOpen, setIsEditCardsDialogOpen] = useState(false);
  const [editingCard, setEditingCard] = useState(null);

  // 字段配置状态
  const [fieldConfigs, setFieldConfigs] = useState({});

  // API相关状态
  const [availableApis, setAvailableApis] = useState([]);
  const [selectedApiKey, setSelectedApiKey] = useState('');
  const [apiFields, setApiFields] = useState([]);

  // 加载保存的卡片配置
  const loadSavedCards = () => {
    try {
      const savedCards = localStorage.getItem('productionStatsCards');
      if (savedCards) {
        // 解析保存的卡片配置
        const parsedCards = JSON.parse(savedCards);
        console.log('加载到的卡片配置:', parsedCards);

        // 检查是否有使用ID为13的API的卡片
        const problematicCards = parsedCards.filter(card => card.apiKey === '13');
        if (problematicCards.length > 0) {
          console.warn('发现使用不存在API (ID: 13) 的卡片:', problematicCards);

          // 移除使用不存在API的卡片
          const validCards = parsedCards.filter(card => card.apiKey !== '13');
          console.log('移除问题卡片后的配置:', validCards);

          // 保存更新后的卡片配置
          localStorage.setItem('productionStatsCards', JSON.stringify(validCards));
          setCards(validCards);
        } else {
          setCards(parsedCards);
        }
      }
    } catch (error) {
      console.error('[ProductionStats] 加载卡片配置失败:', error);
      setCards([]);
    }
  };

  // 保存卡片配置
  const saveCards = (newCards) => {
    try {
      localStorage.setItem('productionStatsCards', JSON.stringify(newCards));
      setCards(newCards);
    } catch (error) {
      console.error('[ProductionStats] 保存卡片配置失败:', error);
    }
  };

  // 加载可用的API列表
  const loadAvailableApis = () => {
    try {
      // 从API管理系统获取所有API配置
      const allApis = apiManager.registry.getAll();

      // 过滤出数据查询类API
      const dataApis = Object.keys(allApis)
        .filter(key => {
          const api = allApis[key];
          return (api.category === 'data' ||
                 api.name.includes('数据') ||
                 api.name.includes('统计'));
        })
        .map(key => ({
          key,
          name: allApis[key].name,
          url: allApis[key].url,
          method: allApis[key].method,
          enabled: allApis[key].enabled
        }));

      setAvailableApis(dataApis);
    } catch (error) {
      console.error('[ProductionStats] 加载API配置失败:', error);
      setAvailableApis([]);
    }
  };

  // 加载API字段
  const loadApiFields = async (apiKey) => {
    try {
      setApiFields([]);

      // 检查API是否存在
      if (!apiManager.registry.get(apiKey)) {
        console.error(`[ProductionStats] API不存在: ${apiKey}`);
        message.error(`API配置不存在: ${apiKey}`);
        setApiFields([]);
        return;
      }

      // 从API管理系统获取字段配置
      const savedFields = localStorage.getItem(`api_fields_${apiKey}`);
      if (savedFields) {
        setApiFields(JSON.parse(savedFields));
        return;
      }

      // 如果没有保存的字段配置，尝试调用API获取示例数据
      try {
        const apiData = await apiManager.call(apiKey);
        if (apiData && typeof apiData === 'object') {
          // 从返回的数据中提取字段
          const fields = Object.keys(apiData).map(key => {
            const value = apiData[key];
            const type = typeof value;

            return {
              id: key,
              key: key,
              label: key, // 默认使用字段名作为标签
              type: type === 'number' ? 'number' : 'string',
              unit: type === 'number' ? '' : null,
              color: getRandomColor(),
              visible: true
            };
          });

          setApiFields(fields);

          // 保存字段配置
          localStorage.setItem(`api_fields_${apiKey}`, JSON.stringify(fields));
        }
      } catch (apiError) {
        console.error(`[ProductionStats] 调用API ${apiKey} 失败:`, apiError);
        message.error(`调用API失败: ${apiError.message || '未知错误'}`);
        setApiFields([]);
      }
    } catch (error) {
      console.error('[ProductionStats] 加载API字段失败:', error);
      message.error(`加载API字段失败: ${error.message || '未知错误'}`);
      setApiFields([]);
    }
  };

  // 获取随机颜色
  const getRandomColor = () => {
    const colors = [
      '#2196F3', '#4CAF50', '#FF9800', '#E91E63', '#9C27B0',
      '#673AB7', '#3F51B5', '#00BCD4', '#009688', '#FFC107'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  // 手动刷新数据
  const handleRefresh = () => {
    // 直接调用获取概览数据的函数，而不是fetchAllData
    fetchOverviewData();
  };

  // 打开编辑卡片组对话框
  const handleOpenEditCardsDialog = () => {
    // 初始化字段配置
    if (data.getoverview) {
      const initialFieldConfigs = {};

      // 获取当前已有的卡片配置
      const existingCards = cards.reduce((acc, card) => {
        if (card.apiKey === 'getoverview') {
          acc[card.fieldKey] = {
            title: card.title,
            unit: card.unit,
            color: card.color,
            visible: true
          };
        }
        return acc;
      }, {});

      // 字段名称映射表
      const fieldNameMap = {
        totalProcessing_in: '总进水量',
        totalProcessing_out: '总出水量',
        sludgeProduction: '污泥产量',
        carbonUsage: '活性炭用量',
        phosphorusRemoval: '除磷剂用量',
        disinfectant: '消毒剂用量',
        alarmCount: '告警数量',
        offlineSites: '离线站点数',
        totalDevices: '设备总数',
        runningDevices: '运行设备数',
        electricity: '用电量',
        pacUsage: 'PAC用量',
        pamUsage: 'PAM用量'
      };

      // 字段单位映射表
      const fieldUnitMap = {
        totalProcessing_in: '吨',
        totalProcessing_out: '吨',
        sludgeProduction: '吨',
        carbonUsage: 'kg',
        phosphorusRemoval: 'kg',
        disinfectant: 'kg',
        alarmCount: '个',
        offlineSites: '个',
        totalDevices: '台',
        runningDevices: '台',
        electricity: 'kWh',
        pacUsage: 'kg',
        pamUsage: 'kg'
      };

      // 字段颜色映射表
      const fieldColorMap = {
        totalProcessing_in: '#2196F3',
        totalProcessing_out: '#4CAF50',
        sludgeProduction: '#FF9800',
        carbonUsage: '#9C27B0',
        phosphorusRemoval: '#E91E63',
        disinfectant: '#673AB7',
        alarmCount: '#F44336',
        offlineSites: '#FF5722',
        totalDevices: '#3F51B5',
        runningDevices: '#00BCD4',
        electricity: '#FFC107',
        pacUsage: '#795548',
        pamUsage: '#607D8B'
      };

      // 为每个字段创建配置
      Object.keys(data.getoverview).forEach(key => {
        initialFieldConfigs[key] = existingCards[key] || {
          title: fieldNameMap[key] || key,
          unit: fieldUnitMap[key] || '',
          color: fieldColorMap[key] || getRandomColor(),
          visible: existingCards[key] ? true : false // 默认只显示已有的卡片
        };
      });

      setFieldConfigs(initialFieldConfigs);
    }

    setIsEditCardsDialogOpen(true);
  };

  // 关闭编辑卡片组对话框
  const handleCloseEditCardsDialog = () => {
    setIsEditCardsDialogOpen(false);
  };

  // 保存卡片组配置
  const handleSaveCardConfigs = () => {
    // 根据字段配置生成卡片
    const newCards = Object.keys(fieldConfigs)
      .filter(key => fieldConfigs[key].visible)
      .map(key => ({
        id: `card_${Date.now()}_${Math.random().toString(36).substring(2, 11)}_${key}`,
        apiKey: 'getoverview',
        fieldKey: key,
        title: fieldConfigs[key].title,
        unit: fieldConfigs[key].unit,
        color: fieldConfigs[key].color
      }));

    console.log('保存新的卡片配置:', newCards);
    saveCards(newCards);
    setIsEditCardsDialogOpen(false);

    // 保存配置后立即刷新数据
    fetchOverviewData();
  };

  // 切换字段可见性
  const handleToggleFieldVisibility = (fieldKey) => {
    setFieldConfigs(prev => ({
      ...prev,
      [fieldKey]: {
        ...prev[fieldKey],
        visible: !prev[fieldKey].visible
      }
    }));
  };

  // 更新字段配置
  const handleUpdateFieldConfig = (fieldKey, property, value) => {
    setFieldConfigs(prev => ({
      ...prev,
      [fieldKey]: {
        ...prev[fieldKey],
        [property]: value
      }
    }));
  };

  const handleCloseAddCardDialog = () => {
    setIsAddCardDialogOpen(false);
    setEditingCard(null);
  };

  const handleCloseApiSelectDialog = () => {
    setIsApiSelectDialogOpen(false);
    if (!selectedApiKey) {
      setEditingCard(null);
    }
  };

  const handleApiSelected = () => {
    if (selectedApiKey) {
      loadApiFields(selectedApiKey);
      setEditingCard({
        ...editingCard,
        apiKey: selectedApiKey
      });
      setIsApiSelectDialogOpen(false);
      setIsAddCardDialogOpen(true);
    }
  };

  // 保存卡片
  const handleSaveCard = () => {
    if (!editingCard || !editingCard.apiKey || !editingCard.fieldKey || !editingCard.title) {
      return;
    }

    let newCards;

    if (editingCard.id) {
      // 更新现有卡片
      newCards = cards.map(card =>
        card.id === editingCard.id ? editingCard : card
      );
    } else {
      // 添加新卡片
      newCards = [
        ...cards,
        {
          ...editingCard,
          id: `card_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
        }
      ];
    }

    saveCards(newCards);
    handleCloseAddCardDialog();
    fetchOverviewData();
  };

  // 获取字段图标
  const getIconForField = (fieldKey) => {
    const iconMap = {
      'totalProcessing_in': <EnterOutlined style={{ marginRight: 8 }} />,
      'totalProcessing_out': <ExportOutlined style={{ marginRight: 8 }} />,
      'carbonUsage': <ExperimentOutlined style={{ marginRight: 8 }} />,
      'phosphorusRemoval': <ExperimentOutlined style={{ marginRight: 8 }} />,
      'disinfectant': <ExperimentOutlined style={{ marginRight: 8 }} />,
      'electricity': <ThunderboltOutlined style={{ marginRight: 8 }} />,
      'sludgeProduction': <EnvironmentOutlined style={{ marginRight: 8 }} />,
      'temperature': <ThunderboltOutlined style={{ marginRight: 8 }} />,
      'pressure': <DashboardOutlined style={{ marginRight: 8 }} />
    };

    return iconMap[fieldKey] || <BarChartOutlined style={{ marginRight: 8 }} />;
  };

  // 获取卡片值
  const getCardValue = (card) => {
    // 如果正在加载，显示加载中
    if (loading) {
      return '加载中...';
    }

    // 如果没有数据对象，显示加载中
    if (!data[card.apiKey]) {
      return '加载中...';
    }

    // 对于getoverview API，直接从数据中获取字段值
    if (card.apiKey === 'getoverview') {
      const value = data.getoverview[card.fieldKey];
      if (value === undefined || value === null) {
        // 如果值为空但不是因为加载中，显示无数据
        return '无数据';
      }

      if (typeof value === 'number') {
        return value.toLocaleString();
      }

      return value.toString();
    } else {
      // 对于其他API，保持原有逻辑
      const value = data[card.apiKey][card.fieldKey];
      if (value === undefined || value === null) {
        return '无数据';
      }

      if (typeof value === 'number') {
        return value.toLocaleString();
      }

      return value.toString();
    }
  };

  // 检查并注册getoverview API
  const checkAndRegisterOverviewApi = async () => {
    try {
      // 检查getoverview API是否存在
      const overviewApi = apiManager.registry.get('getoverview');

      if (!overviewApi) {
        console.log('getoverview API不存在，正在注册...');

        // 注册getoverview API
        await apiManager.registry.register('getoverview', {
          name: '获取生产概览数据',
          url: 'https://nodered.jzz77.cn:9003/api/overview',
          method: 'GET',
          category: 'data',
          status: 'enabled',
          description: '获取生产概览数据，包括进出水量、污泥产量、药剂用量等',
          timeout: 10000,
          retries: 1,
          cacheTime: 60000, // 60秒缓存
          headers: {
            'Content-Type': 'application/json'
          }
        });

        console.log('getoverview API注册成功');
      } else {
        console.log('getoverview API已存在');
      }

      return true;
    } catch (error) {
      console.error('检查/注册getoverview API失败:', error);
      message.error('初始化API失败，请刷新页面重试');
      return false;
    }
  };

  // 初始化
  useEffect(() => {
    // 等待API管理器初始化完成
    apiManager.waitForReady().then(ready => {
      if (ready) {
        checkAndRegisterOverviewApi().then(() => {
          loadAvailableApis();
          loadSavedCards();
          // 直接获取概览数据
          fetchOverviewData();
        });
      } else {
        console.error('API管理器初始化失败');
        message.error('API管理器初始化失败');
      }
    });
  }, []);

  // 获取概览数据
  const fetchOverviewData = async () => {
    setLoading(true);
    setError(null);

    try {
      // 调用getoverview API
      const response = await apiManager.call('getoverview');
      console.log('获取到概览数据:', response);

      // 处理嵌套的data字段
      let overviewData = response;
      if (response && response.success && response.data) {
        overviewData = response.data;
      }

      if (overviewData && typeof overviewData === 'object') {
        // 更新数据
        setData({
          getoverview: overviewData
        });

        // 自动生成卡片（如果没有已保存的卡片）
        if (cards.length === 0) {
          generateCardsFromData(overviewData);
        }

        setLastUpdated(new Date());
      } else {
        throw new Error('获取到的概览数据格式无效');
      }
    } catch (error) {
      console.error('[ProductionStats] 获取概览数据失败:', error);
      setError('获取概览数据失败: ' + (error.message || '未知错误'));
    } finally {
      setLoading(false);
    }
  };

  // 从数据自动生成卡片
  const generateCardsFromData = (data) => {
    if (!data || typeof data !== 'object') {
      return;
    }

    // 字段名称映射表
    const fieldNameMap = {
      totalProcessing_in: '总进水量',
      totalProcessing_out: '总出水量',
      sludgeProduction: '污泥产量',
      carbonUsage: '碳源用量',
      phosphorusRemoval: '除磷剂用量',
      disinfectant: '消毒剂用量',
      alarmCount: '告警数量',
      offlineSites: '离线站点数',
      totalDevices: '设备总数',
      runningDevices: '运行设备数',
      electricity: '用电量',
      pacUsage: 'PAC用量',
      pamUsage: 'PAM用量'
    };

    // 字段单位映射表
    const fieldUnitMap = {
      totalProcessing_in: '吨',
      totalProcessing_out: '吨',
      sludgeProduction: '吨',
      carbonUsage: 'L',
      phosphorusRemoval: 'L',
      disinfectant: 'L',
      alarmCount: '个',
      offlineSites: '个',
      totalDevices: '台',
      runningDevices: '台',
      electricity: 'kWh',
      pacUsage: 'kg',
      pamUsage: 'kg'
    };

    // 字段颜色映射表
    const fieldColorMap = {
      totalProcessing_in: '#2196F3',
      totalProcessing_out: '#4CAF50',
      sludgeProduction: '#FF9800',
      carbonUsage: '#9C27B0',
      phosphorusRemoval: '#E91E63',
      disinfectant: '#673AB7',
      alarmCount: '#F44336',
      offlineSites: '#FF5722',
      totalDevices: '#3F51B5',
      runningDevices: '#00BCD4',
      electricity: '#FFC107',
      pacUsage: '#795548',
      pamUsage: '#607D8B'
    };

    // 生成卡片
    const newCards = Object.keys(data).map(key => ({
      id: `card_${Date.now()}_${Math.random().toString(36).substring(2, 11)}_${key}`,
      apiKey: 'getoverview',
      fieldKey: key,
      title: fieldNameMap[key] || key,
      unit: fieldUnitMap[key] || '',
      color: fieldColorMap[key] || getRandomColor()
    }));

    console.log('自动生成卡片:', newCards);
    saveCards(newCards);
  };

  // 定时刷新数据
  useEffect(() => {
    // 初始加载 - 始终使用fetchOverviewData
    fetchOverviewData();

    // 根据刷新模式设置定时器
    const interval = refreshMode === 'realtime' ? 300000 : refreshInterval * 60000; // 实时模式5分钟，周期模式使用用户设置的间隔
    const timer = setInterval(() => {
      fetchOverviewData();
    }, interval);

    // 组件卸载时清除定时器
    return () => {
      clearInterval(timer);
    };
  }, [cards, refreshMode, refreshInterval]); // 添加refreshMode和refreshInterval作为依赖项

  return (
    <>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ 
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between', 
            mb: 2,
            borderBottom: '1px solid #f0f0f0',
            pb: 1
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <AppstoreOutlined style={{ fontSize: 20, marginRight: 8, color: '#2E7D32' }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>生产数据统计</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {isAdmin && (
                <Tooltip title="编辑数据卡片">
                  <IconButton
                    size="small"
                    onClick={() => handleOpenEditCardsDialog()}
                    sx={{ 
                      color: '#666',
                      '&:hover': { color: '#2E7D32' }
                    }}
                  >
                    <EditOutlined />
                  </IconButton>
                </Tooltip>
              )}
              <Tooltip title={lastUpdated ? `最后更新: ${moment(lastUpdated).format('YYYY-MM-DD HH:mm')}` : '未更新'}>
                <IconButton
                  size="small"
                  onClick={handleRefresh}
                  disabled={loading}
                  sx={{ 
                    color: '#666',
                    '&:hover': { color: '#2E7D32' },
                    '&.Mui-disabled': { color: '#ccc' }
                  }}
                >
                  <ReloadOutlined />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          {loading && cards.length === 0 ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100px' }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Box sx={{ p: 1, bgcolor: '#ffebee', borderRadius: 1, color: '#d32f2f' }}>
              <Typography variant="body2">{error}</Typography>
            </Box>
          ) : cards.length === 0 ? (
            <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#f5f5f5' }}>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                没有配置数据卡片
              </Typography>
              {isAdmin ? (
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<EditOutlined />}
                  onClick={() => handleOpenEditCardsDialog()}
                  sx={{ mt: 1 }}
                >
                  编辑数据卡片
                </Button>
              ) : (
                <Typography variant="body2" color="textSecondary">
                  请联系管理员配置数据卡片
                </Typography>
              )}
            </Paper>
          ) : (
            <Grid container spacing={1}>
              {cards.map(card => (
                <Grid item xs={6} sm={4} md={3} lg={2} key={card.id}>
                  <Card variant="outlined" sx={{
                    bgcolor: '#f5f5f5',
                    transition: 'all 0.3s',
                    '&:hover': {
                      boxShadow: `0 2px 4px rgba(0,0,0,0.1)`,
                      transform: 'translateY(-1px)',
                      borderColor: card.color
                    },
                    position: 'relative',
                    height: '100%'
                  }}>
                    <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                        <Box sx={{ color: card.color }}>
                          {getIconForField(card.fieldKey)}
                        </Box>
                        <Typography variant="caption" color="textSecondary" sx={{ fontSize: '0.75rem' }}>
                          {card.title}
                        </Typography>
                      </Box>
                      <Typography variant="h6" sx={{ 
                        fontWeight: 'bold', 
                        color: card.color,
                        fontSize: '1.1rem',
                        lineHeight: 1.2
                      }}>
                        {getCardValue(card)} {card.unit}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}

          {loading && cards.length > 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
              <CircularProgress size={20} />
            </Box>
          )}
        </CardContent>
      </Card>

      {/* API选择对话框 */}
      <Dialog open={isApiSelectDialogOpen} onClose={handleCloseApiSelectDialog} maxWidth="sm" fullWidth>
        <DialogTitle>选择数据源API</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            {availableApis.length > 0 ? (
              <FormControl fullWidth>
                <InputLabel id="api-select-label">选择API</InputLabel>
                <Select
                  labelId="api-select-label"
                  value={selectedApiKey}
                  label="选择API"
                  onChange={(e) => setSelectedApiKey(e.target.value)}
                >
                  {availableApis.map((api) => (
                    <MenuItem
                      key={api.key}
                      value={api.key}
                      disabled={!api.enabled}
                    >
                      {api.name} {!api.enabled && '(已禁用)'}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            ) : (
              <Alert severity="warning">
                没有可用的数据API。请先在API管理页面配置数据API。
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseApiSelectDialog}>取消</Button>
          <Button
            onClick={handleApiSelected}
            variant="contained"
            color="primary"
            disabled={!selectedApiKey || availableApis.length === 0}
          >
            下一步
          </Button>
        </DialogActions>
      </Dialog>

      {/* 添加/编辑卡片对话框 */}
      <Dialog open={isAddCardDialogOpen} onClose={handleCloseAddCardDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingCard?.editNameOnly ? '编辑卡片名称' :
           editingCard?.id ? '编辑数据卡片' : '添加数据卡片'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              {!editingCard?.editNameOnly && (
                <Grid item xs={12}>
                  <FormControl fullWidth disabled={!!editingCard?.id}>
                    <InputLabel id="field-select-label">选择字段</InputLabel>
                    <Select
                      labelId="field-select-label"
                      value={editingCard?.fieldKey || ''}
                      label="选择字段"
                      onChange={(e) => setEditingCard({
                        ...editingCard,
                        fieldKey: e.target.value
                      })}
                    >
                      {apiFields.map(field => (
                        <MenuItem key={field.id} value={field.key}>
                          {field.label || field.key}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              )}
              <Grid item xs={12} sm={editingCard?.editNameOnly ? 12 : 6}>
                <TextField
                  label="显示名称"
                  fullWidth
                  value={editingCard?.title || ''}
                  onChange={(e) => setEditingCard({
                    ...editingCard,
                    title: e.target.value
                  })}
                  autoFocus={!!editingCard?.editNameOnly}
                />
              </Grid>
              {!editingCard?.editNameOnly && (
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="单位"
                    fullWidth
                    value={editingCard?.unit || ''}
                    onChange={(e) => setEditingCard({
                      ...editingCard,
                      unit: e.target.value
                    })}
                  />
                </Grid>
              )}
              {!editingCard?.editNameOnly && (
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel id="color-select-label">颜色</InputLabel>
                    <Select
                      labelId="color-select-label"
                      value={editingCard?.color || '#2196F3'}
                      label="颜色"
                      onChange={(e) => setEditingCard({
                        ...editingCard,
                        color: e.target.value
                      })}
                    >
                      <MenuItem value="#2196F3">蓝色</MenuItem>
                      <MenuItem value="#4CAF50">绿色</MenuItem>
                      <MenuItem value="#FF9800">橙色</MenuItem>
                      <MenuItem value="#E91E63">粉色</MenuItem>
                      <MenuItem value="#9C27B0">紫色</MenuItem>
                      <MenuItem value="#673AB7">深紫色</MenuItem>
                      <MenuItem value="#3F51B5">靛蓝色</MenuItem>
                      <MenuItem value="#00BCD4">青色</MenuItem>
                      <MenuItem value="#009688">蓝绿色</MenuItem>
                      <MenuItem value="#FFC107">琥珀色</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              )}
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAddCardDialog}>取消</Button>
          <Button
            onClick={handleSaveCard}
            variant="contained"
            color="primary"
            disabled={!editingCard?.title || (!editingCard?.editNameOnly && !editingCard?.fieldKey)}
          >
            保存
          </Button>
        </DialogActions>
      </Dialog>

      {/* 编辑卡片组对话框 */}
      <Dialog open={isEditCardsDialogOpen} onClose={handleCloseEditCardsDialog} maxWidth="md" fullWidth>
        <DialogTitle>编辑数据卡片</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              选择要显示的数据项并编辑显示名称
            </Typography>

            <Paper variant="outlined" sx={{ mt: 2, p: 2 }}>
              <Grid container spacing={2}>
                {Object.keys(fieldConfigs).map(fieldKey => (
                  <Grid item xs={12} sm={6} md={4} key={fieldKey}>
                    <Box sx={{
                      p: 2,
                      border: '1px solid',
                      borderColor: fieldConfigs[fieldKey].visible ? fieldConfigs[fieldKey].color : '#e0e0e0',
                      borderRadius: 1,
                      opacity: fieldConfigs[fieldKey].visible ? 1 : 0.6,
                      transition: 'all 0.3s'
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Checkbox
                          checked={fieldConfigs[fieldKey].visible}
                          onChange={() => handleToggleFieldVisibility(fieldKey)}
                          sx={{
                            color: fieldConfigs[fieldKey].color,
                            '&.Mui-checked': {
                              color: fieldConfigs[fieldKey].color,
                            }
                          }}
                        />
                        <Typography variant="subtitle2">
                          {fieldKey}
                        </Typography>
                      </Box>

                      <TextField
                        label="显示名称"
                        fullWidth
                        size="small"
                        value={fieldConfigs[fieldKey].title}
                        onChange={(e) => handleUpdateFieldConfig(fieldKey, 'title', e.target.value)}
                        disabled={!fieldConfigs[fieldKey].visible}
                        sx={{ mb: 2 }}
                      />

                      <TextField
                        label="单位"
                        fullWidth
                        size="small"
                        value={fieldConfigs[fieldKey].unit}
                        onChange={(e) => handleUpdateFieldConfig(fieldKey, 'unit', e.target.value)}
                        disabled={!fieldConfigs[fieldKey].visible}
                        sx={{ mb: 2 }}
                      />

                      <FormControl fullWidth size="small" disabled={!fieldConfigs[fieldKey].visible}>
                        <InputLabel id={`color-select-${fieldKey}`}>颜色</InputLabel>
                        <Select
                          labelId={`color-select-${fieldKey}`}
                          value={fieldConfigs[fieldKey].color}
                          label="颜色"
                          onChange={(e) => handleUpdateFieldConfig(fieldKey, 'color', e.target.value)}
                        >
                          <MenuItem value="#2196F3">蓝色</MenuItem>
                          <MenuItem value="#4CAF50">绿色</MenuItem>
                          <MenuItem value="#FF9800">橙色</MenuItem>
                          <MenuItem value="#E91E63">粉色</MenuItem>
                          <MenuItem value="#9C27B0">紫色</MenuItem>
                          <MenuItem value="#673AB7">深紫色</MenuItem>
                          <MenuItem value="#3F51B5">靛蓝色</MenuItem>
                          <MenuItem value="#00BCD4">青色</MenuItem>
                          <MenuItem value="#009688">蓝绿色</MenuItem>
                          <MenuItem value="#FFC107">琥珀色</MenuItem>
                        </Select>
                      </FormControl>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditCardsDialog}>取消</Button>
          <Button
            onClick={handleSaveCardConfigs}
            variant="contained"
            color="primary"
          >
            保存
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ProductionStats;
