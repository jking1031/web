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
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Checkbox,
  TextField,
  Divider,
  Paper,
  Alert
} from '@mui/material';
import {
  BarChartOutlined,
  PlusOutlined,
  SettingOutlined,
  EditOutlined,
  DeleteOutlined,
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
import api from '../../api/interceptors';
import apiManager from '../../services/apiManager';
import { useAuth } from '../../context/AuthContext';

/**
 * 生产数据统计组件
 * 显示自定义数据卡片，由管理员配置
 */
const ProductionStats = () => {
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
  const [editingCard, setEditingCard] = useState(null);

  // API相关状态
  const [availableApis, setAvailableApis] = useState([]);
  const [selectedApiKey, setSelectedApiKey] = useState('');
  const [apiFields, setApiFields] = useState([]);

  // 加载保存的卡片配置
  const loadSavedCards = () => {
    try {
      const savedCards = localStorage.getItem('productionStatsCards');
      if (savedCards) {
        setCards(JSON.parse(savedCards));
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

      // 从API管理系统获取字段配置
      const savedFields = localStorage.getItem(`api_fields_${apiKey}`);
      if (savedFields) {
        setApiFields(JSON.parse(savedFields));
        return;
      }

      // 如果没有保存的字段配置，尝试调用API获取示例数据
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
    } catch (error) {
      console.error('[ProductionStats] 加载API字段失败:', error);
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

  // 获取所有卡片数据
  const fetchAllData = async () => {
    setLoading(true);
    setError(null);

    try {
      const newData = {};
      const apiCalls = [];
      const uniqueApis = [...new Set(cards.map(card => card.apiKey))];

      // 为每个唯一的API创建一个调用
      for (const apiKey of uniqueApis) {
        apiCalls.push(
          apiManager.call(apiKey)
            .then(result => {
              newData[apiKey] = result;
            })
            .catch(error => {
              console.error(`[ProductionStats] 获取API ${apiKey} 数据失败:`, error);
              newData[apiKey] = null;
            })
        );
      }

      // 等待所有API调用完成
      await Promise.all(apiCalls);

      setData(newData);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('[ProductionStats] 获取数据失败:', error);
      setError('获取数据失败: ' + (error.message || '未知错误'));
    } finally {
      setLoading(false);
    }
  };

  // 手动刷新数据
  const handleRefresh = () => {
    fetchAllData();
  };

  // 处理添加/编辑卡片对话框
  const handleOpenAddCardDialog = (card = null) => {
    if (card) {
      setEditingCard(card);
    } else {
      setEditingCard({
        id: null,
        apiKey: '',
        fieldKey: '',
        title: '',
        unit: '',
        color: '#2196F3'
      });
      // 打开API选择对话框
      setIsApiSelectDialogOpen(true);
      return;
    }
    setIsAddCardDialogOpen(true);
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
          id: `card_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        }
      ];
    }

    saveCards(newCards);
    handleCloseAddCardDialog();
    fetchAllData();
  };

  // 删除卡片
  const handleDeleteCard = (cardId) => {
    const newCards = cards.filter(card => card.id !== cardId);
    saveCards(newCards);
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
    if (!data[card.apiKey]) {
      return '加载中...';
    }

    const value = data[card.apiKey][card.fieldKey];
    if (value === undefined || value === null) {
      return '无数据';
    }

    if (typeof value === 'number') {
      return value.toLocaleString();
    }

    return value.toString();
  };

  // 初始化
  useEffect(() => {
    loadAvailableApis();
    loadSavedCards();
  }, []);

  // 当卡片配置变更时，获取数据
  useEffect(() => {
    if (cards.length > 0) {
      fetchAllData();
    } else {
      setLoading(false);
    }
  }, [cards]);

  return (
    <>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <AppstoreOutlined style={{ fontSize: 24, marginRight: 8, color: '#2E7D32' }} />
              <Typography variant="h6">生产数据卡片</Typography>
            </Box>
            <Box>
              {isAdmin && (
                <Tooltip title="添加数据卡片">
                  <IconButton
                    size="small"
                    onClick={() => handleOpenAddCardDialog()}
                    sx={{ mr: 1 }}
                  >
                    <PlusOutlined />
                  </IconButton>
                </Tooltip>
              )}
              <Tooltip title={lastUpdated ? `最后更新: ${moment(lastUpdated).format('YYYY-MM-DD HH:mm')}` : '未更新'}>
                <Button
                  size="small"
                  startIcon={<ReloadOutlined />}
                  onClick={handleRefresh}
                  disabled={loading}
                >
                  刷新
                </Button>
              </Tooltip>
            </Box>
          </Box>

          {loading && cards.length === 0 ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Box sx={{ p: 2, bgcolor: '#ffebee', borderRadius: 1, color: '#d32f2f' }}>
              <Typography variant="body1">{error}</Typography>
            </Box>
          ) : cards.length === 0 ? (
            <Paper sx={{ p: 3, textAlign: 'center', bgcolor: '#f5f5f5' }}>
              <Typography variant="body1" color="textSecondary" gutterBottom>
                没有配置数据卡片
              </Typography>
              {isAdmin ? (
                <Button
                  variant="outlined"
                  startIcon={<PlusOutlined />}
                  onClick={() => handleOpenAddCardDialog()}
                  sx={{ mt: 1 }}
                >
                  添加数据卡片
                </Button>
              ) : (
                <Typography variant="body2" color="textSecondary">
                  请联系管理员添加数据卡片
                </Typography>
              )}
            </Paper>
          ) : (
            <Grid container spacing={2}>
              {cards.map(card => (
                <Grid item xs={6} sm={4} md={3} lg={3} key={card.id}>
                  <Card variant="outlined" sx={{
                    bgcolor: '#f5f5f5',
                    transition: 'all 0.3s',
                    '&:hover': {
                      boxShadow: `0 4px 8px rgba(0,0,0,0.1)`,
                      transform: 'translateY(-2px)',
                      borderColor: card.color
                    },
                    position: 'relative'
                  }}>
                    {isAdmin && (
                      <Box sx={{ position: 'absolute', top: 5, right: 5 }}>
                        <Tooltip title="编辑卡片">
                          <IconButton size="small" onClick={() => handleOpenAddCardDialog(card)}>
                            <EditOutlined style={{ fontSize: 14 }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="删除卡片">
                          <IconButton size="small" onClick={() => handleDeleteCard(card.id)}>
                            <DeleteOutlined style={{ fontSize: 14 }} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    )}
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Box sx={{ color: card.color }}>
                          {getIconForField(card.fieldKey)}
                        </Box>
                        <Typography variant="body2" color="textSecondary">{card.title}</Typography>
                      </Box>
                      <Typography variant="h5" sx={{ fontWeight: 'bold', color: card.color }}>
                        {getCardValue(card)} {card.unit}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}

          {loading && cards.length > 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <CircularProgress size={24} />
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
        <DialogTitle>{editingCard?.id ? '编辑数据卡片' : '添加数据卡片'}</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={2}>
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
              <Grid item xs={12} sm={6}>
                <TextField
                  label="显示名称"
                  fullWidth
                  value={editingCard?.title || ''}
                  onChange={(e) => setEditingCard({
                    ...editingCard,
                    title: e.target.value
                  })}
                />
              </Grid>
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
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAddCardDialog}>取消</Button>
          <Button
            onClick={handleSaveCard}
            variant="contained"
            color="primary"
            disabled={!editingCard?.fieldKey || !editingCard?.title}
          >
            保存
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ProductionStats;
