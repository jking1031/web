import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  TextField,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Tooltip,
  CircularProgress,
  Divider,
  Alert,
  Switch,
  FormControlLabel,
  Checkbox
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Refresh as RefreshIcon,
  Save as SaveIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  ArrowBack as ArrowBackIcon,
  DataObject as DataObjectIcon
} from '@mui/icons-material';
import apiManager from '../../services/apiManager';
import JsonEditor from '../../components/JsonEditor/JsonEditor';

/**
 * API数据页面组件
 * 用于显示和管理API数据字段
 */
const ApiDataPage = ({ apiKey, onBack }) => {
  const [api, setApi] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [testParams, setTestParams] = useState('{}');
  const [testResult, setTestResult] = useState(null);
  const [fields, setFields] = useState([]);
  const [selectedField, setSelectedField] = useState(null);
  const [isFieldDialogOpen, setIsFieldDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isTestingApi, setIsTestingApi] = useState(false);
  const [autoDetectFields, setAutoDetectFields] = useState(true);

  // 加载API配置和字段
  useEffect(() => {
    loadApiAndFields();
  }, [apiKey]);

  // 加载API配置和字段
  const loadApiAndFields = async () => {
    try {
      setLoading(true);
      setError(null);

      // 获取API配置
      const apiConfig = apiManager.registry.get(apiKey);
      if (!apiConfig) {
        throw new Error(`找不到API: ${apiKey}`);
      }

      setApi(apiConfig);

      // 获取保存的字段配置
      const savedFields = localStorage.getItem(`api_fields_${apiKey}`);
      if (savedFields) {
        setFields(JSON.parse(savedFields));
      } else {
        setFields([]);
      }
    } catch (error) {
      console.error('加载API配置失败:', error);
      setError(error.message || '加载API配置失败');
    } finally {
      setLoading(false);
    }
  };

  // 保存字段配置
  const saveFields = (newFields) => {
    try {
      localStorage.setItem(`api_fields_${apiKey}`, JSON.stringify(newFields));
      setFields(newFields);
    } catch (error) {
      console.error('保存字段配置失败:', error);
    }
  };

  // 测试API并自动检测字段
  const testApiAndDetectFields = async () => {
    try {
      setIsTestingApi(true);
      setTestResult(null);

      // 解析测试参数
      let params = {};
      try {
        params = JSON.parse(testParams);
      } catch (error) {
        setTestResult({
          success: false,
          error: `参数解析错误: ${error.message}`
        });
        setIsTestingApi(false);
        return;
      }

      // 测试API
      const result = await apiManager.test(apiKey, params);
      setTestResult(result);

      // 如果测试成功且启用了自动检测字段
      if (result.success && autoDetectFields) {
        detectFields(result.data);
      }
    } catch (error) {
      setTestResult({
        success: false,
        error: error.message
      });
    } finally {
      setIsTestingApi(false);
    }
  };

  // 自动检测字段
  const detectFields = (data) => {
    try {
      // 使用 apiFieldManager 的自动检测功能
      const detectedFields = apiManager.fieldManager.detectFields(apiKey, data, { save: false });

      // 如果检测到字段，直接使用
      if (detectedFields && detectedFields.length > 0) {
        // 更新字段列表
        saveFields(detectedFields);
        return;
      }

      // 如果没有检测到字段，使用旧的检测方法作为备份
      // 如果数据是数组，使用第一个元素
      const sampleData = Array.isArray(data) ? data[0] : data;

      if (!sampleData || typeof sampleData !== 'object') {
        console.warn('无法检测字段: 数据不是对象');
        return;
      }

      // 提取字段
      const manualDetectedFields = Object.keys(sampleData).map(key => {
        // 检查是否已存在该字段
        const existingField = fields.find(f => f.key === key);
        if (existingField) {
          return existingField;
        }

        // 创建新字段
        const value = sampleData[key];
        const type = typeof value;

        return {
          id: `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          key,
          label: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          type: type === 'number' ? 'number' : 'text',
          unit: type === 'number' ? '个' : '',
          visible: true,
          color: getRandomColor()
        };
      });

      // 更新字段列表
      saveFields(manualDetectedFields);
    } catch (error) {
      console.error('检测字段失败:', error);
    }
  };

  // 生成随机颜色
  const getRandomColor = () => {
    const colors = [
      '#2196F3', '#4CAF50', '#FF9800', '#E91E63', '#9C27B0',
      '#673AB7', '#3F51B5', '#00BCD4', '#009688', '#FFC107'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  // 处理测试参数变更
  const handleTestParamsChange = (value) => {
    setTestParams(value);
  };

  // 打开字段编辑对话框
  const handleOpenFieldDialog = (field = null) => {
    if (field) {
      setSelectedField({ ...field });
    } else {
      setSelectedField({
        id: `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        key: '',
        label: '',
        type: 'text',
        unit: '',
        visible: true,
        color: getRandomColor()
      });
    }
    setIsFieldDialogOpen(true);
  };

  // 关闭字段编辑对话框
  const handleCloseFieldDialog = () => {
    setIsFieldDialogOpen(false);
    setSelectedField(null);
  };

  // 保存字段
  const handleSaveField = () => {
    if (!selectedField || !selectedField.key || !selectedField.label) {
      return;
    }

    // 检查是否是编辑现有字段
    const existingIndex = fields.findIndex(f => f.id === selectedField.id);

    let newFields = [...fields];
    if (existingIndex >= 0) {
      // 更新现有字段
      newFields[existingIndex] = selectedField;
    } else {
      // 添加新字段
      newFields.push(selectedField);
    }

    // 保存字段配置
    saveFields(newFields);

    // 关闭对话框
    handleCloseFieldDialog();
  };

  // 打开删除确认对话框
  const handleOpenDeleteDialog = (field) => {
    setSelectedField(field);
    setIsDeleteDialogOpen(true);
  };

  // 关闭删除确认对话框
  const handleCloseDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
    setSelectedField(null);
  };

  // 删除字段
  const handleDeleteField = () => {
    if (!selectedField) return;

    // 过滤掉要删除的字段
    const newFields = fields.filter(f => f.id !== selectedField.id);

    // 保存字段配置
    saveFields(newFields);

    // 关闭对话框
    handleCloseDeleteDialog();
  };

  // 切换字段可见性
  const handleToggleFieldVisibility = (fieldId) => {
    const newFields = fields.map(field => {
      if (field.id === fieldId) {
        return { ...field, visible: !field.visible };
      }
      return field;
    });

    saveFields(newFields);
  };

  // 处理字段表单变更
  const handleFieldFormChange = (field, value) => {
    setSelectedField({
      ...selectedField,
      [field]: value
    });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">{error}</Alert>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={onBack}
          sx={{ mt: 2 }}
        >
          返回
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      {/* 标题和返回按钮 */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={onBack}
          sx={{ mr: 2 }}
        >
          返回
        </Button>
        <Typography variant="h5">
          API数据管理: {api.name}
        </Typography>
      </Box>

      {/* API信息 */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>API信息</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="body2" color="textSecondary">URL:</Typography>
            <Typography variant="body1">{api.url}</Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="body2" color="textSecondary">方法:</Typography>
            <Chip
              label={api.method}
              color={
                api.method === 'GET' ? 'success' :
                api.method === 'POST' ? 'primary' :
                api.method === 'PUT' ? 'warning' :
                api.method === 'DELETE' ? 'error' : 'default'
              }
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="body2" color="textSecondary">状态:</Typography>
            <Chip
              label={api.enabled ? '启用' : '禁用'}
              color={api.enabled ? 'success' : 'default'}
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="body2" color="textSecondary">描述:</Typography>
            <Typography variant="body1">{api.description || '无描述'}</Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* 测试API和字段检测 */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>测试API和字段检测</Typography>

        <Box sx={{ mb: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={autoDetectFields}
                onChange={(e) => setAutoDetectFields(e.target.checked)}
              />
            }
            label="自动检测字段"
          />
          <Typography variant="body2" color="textSecondary">
            启用后，测试API时将自动检测并添加字段
          </Typography>
        </Box>

        <Typography variant="subtitle1" gutterBottom>
          参数 (JSON格式):
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
            onClick={testApiAndDetectFields}
            disabled={isTestingApi}
            startIcon={isTestingApi ? <CircularProgress size={20} /> : <RefreshIcon />}
          >
            {isTestingApi ? '测试中...' : '测试API'}
          </Button>
        </Box>

        {testResult && (
          <Box sx={{ mt: 2 }}>
            <Alert severity={testResult.success ? 'success' : 'error'} sx={{ mb: 2 }}>
              {testResult.success ? 'API测试成功' : `API测试失败: ${testResult.error}`}
            </Alert>

            {testResult.success && testResult.data && (
              <Box>
                <Typography variant="subtitle1" gutterBottom>
                  响应数据:
                </Typography>
                <Paper sx={{ p: 2, maxHeight: '300px', overflow: 'auto' }}>
                  <pre>{JSON.stringify(testResult.data, null, 2)}</pre>
                </Paper>
              </Box>
            )}
          </Box>
        )}
      </Paper>

      {/* 字段管理 */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">字段管理</Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => handleOpenFieldDialog()}
          >
            添加字段
          </Button>
        </Box>

        {fields.length === 0 ? (
          <Alert severity="info" sx={{ mb: 2 }}>
            没有配置字段。请测试API自动检测字段，或手动添加字段。
          </Alert>
        ) : (
          <Grid container spacing={2}>
            {fields.map(field => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={field.id}>
                <Card sx={{
                  bgcolor: field.visible ? '#fff' : '#f5f5f5',
                  borderLeft: `4px solid ${field.color}`
                }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                        {field.label}
                      </Typography>
                      <Chip
                        label={field.type}
                        size="small"
                        color={field.type === 'number' ? 'primary' : 'default'}
                      />
                    </Box>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      字段键名: {field.key}
                    </Typography>
                    {field.unit && (
                      <Typography variant="body2" color="textSecondary">
                        单位: {field.unit}
                      </Typography>
                    )}
                  </CardContent>
                  <CardActions>
                    <IconButton size="small" onClick={() => handleToggleFieldVisibility(field.id)}>
                      {field.visible ? <VisibilityIcon /> : <VisibilityOffIcon />}
                    </IconButton>
                    <IconButton size="small" onClick={() => handleOpenFieldDialog(field)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleOpenDeleteDialog(field)}>
                      <DeleteIcon />
                    </IconButton>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Paper>

      {/* 字段编辑对话框 */}
      <Dialog open={isFieldDialogOpen} onClose={handleCloseFieldDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedField && fields.some(f => f.id === selectedField.id) ? '编辑字段' : '添加字段'}
        </DialogTitle>
        <DialogContent>
          {selectedField && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="字段键名"
                  fullWidth
                  value={selectedField.key}
                  onChange={(e) => handleFieldFormChange('key', e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="显示名称"
                  fullWidth
                  value={selectedField.label}
                  onChange={(e) => handleFieldFormChange('label', e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>类型</InputLabel>
                  <Select
                    value={selectedField.type}
                    onChange={(e) => handleFieldFormChange('type', e.target.value)}
                    label="类型"
                  >
                    <MenuItem value="text">文本</MenuItem>
                    <MenuItem value="number">数字</MenuItem>
                    <MenuItem value="date">日期</MenuItem>
                    <MenuItem value="boolean">布尔值</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="单位"
                  fullWidth
                  value={selectedField.unit}
                  onChange={(e) => handleFieldFormChange('unit', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>颜色</InputLabel>
                  <Select
                    value={selectedField.color}
                    onChange={(e) => handleFieldFormChange('color', e.target.value)}
                    label="颜色"
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
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={selectedField.visible}
                      onChange={(e) => handleFieldFormChange('visible', e.target.checked)}
                    />
                  }
                  label="可见"
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseFieldDialog}>取消</Button>
          <Button onClick={handleSaveField} variant="contained" color="primary">
            保存
          </Button>
        </DialogActions>
      </Dialog>

      {/* 删除确认对话框 */}
      <Dialog open={isDeleteDialogOpen} onClose={handleCloseDeleteDialog}>
        <DialogTitle>删除字段</DialogTitle>
        <DialogContent>
          <Typography>
            确定要删除字段 "{selectedField?.label}" 吗？此操作不可撤销。
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>取消</Button>
          <Button onClick={handleDeleteField} color="error">
            删除
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ApiDataPage;
