import React, { useState, useEffect } from 'react';
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
  Divider,
  Alert,
  CircularProgress,
  Snackbar
} from '@mui/material';
import { InfoCircleOutlined } from '@ant-design/icons';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Check as CheckIcon,
  CloudUpload as CloudUploadIcon,
  CloudDownload as CloudDownloadIcon,
  Settings as SettingsIcon,
  Link as LinkIcon,
  Save as SaveIcon,
  Code as CodeIcon
} from '@mui/icons-material';
import baseUrlManager from "../../../services/api/managers/baseUrlManager";
import axios from 'axios';

/**
 * 基础URL管理组件
 * 用于管理API基础URL
 */
const BaseUrlManager = () => {
  const [baseUrls, setBaseUrls] = useState([]);
  const [selectedBaseUrl, setSelectedBaseUrl] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isTestDialogOpen, setIsTestDialogOpen] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  // 加载基础URL
  useEffect(() => {
    fetchBaseUrls();
  }, []);

  // 获取基础URL
  const fetchBaseUrls = () => {
    try {
      const urls = baseUrlManager.getAll();
      setBaseUrls(urls);
    } catch (error) {
      console.error('获取基础URL失败:', error);
      showSnackbar('获取基础URL失败', 'error');
    }
  };

  // 显示消息提示
  const showSnackbar = (message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  // 关闭消息提示
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // 打开创建基础URL对话框
  const handleOpenDialog = (baseUrl = null) => {
    if (baseUrl) {
      setSelectedBaseUrl(baseUrl);
    } else {
      setSelectedBaseUrl({
        id: '',
        name: '',
        url: '',
        description: '',
        isDefault: false
      });
    }
    setIsDialogOpen(true);
    setFormErrors({});
  };

  // 关闭基础URL对话框
  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedBaseUrl(null);
  };

  // 处理基础URL表单字段变更
  const handleFormChange = (field, value) => {
    setSelectedBaseUrl({
      ...selectedBaseUrl,
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

  // 验证基础URL表单
  const validateForm = () => {
    const errors = {};

    if (!selectedBaseUrl.id) {
      errors.id = 'ID不能为空';
    } else if (!/^[a-zA-Z0-9_-]+$/.test(selectedBaseUrl.id)) {
      errors.id = 'ID只能包含字母、数字、下划线和连字符';
    }

    if (!selectedBaseUrl.name) {
      errors.name = '名称不能为空';
    }

    if (!selectedBaseUrl.url) {
      errors.url = 'URL不能为空';
    } else if (!/^https?:\/\/.+/.test(selectedBaseUrl.url)) {
      errors.url = 'URL必须以http://或https://开头';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // 保存基础URL
  const handleSaveBaseUrl = () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      let success = false;
      const isNewBaseUrl = !baseUrls.find(url => url.id === selectedBaseUrl.id);

      if (isNewBaseUrl) {
        success = baseUrlManager.add(selectedBaseUrl);
        if (success) {
          showSnackbar('基础URL创建成功', 'success');
        } else {
          showSnackbar('基础URL创建失败', 'error');
        }
      } else {
        success = baseUrlManager.update(selectedBaseUrl.id, selectedBaseUrl);
        if (success) {
          showSnackbar('基础URL更新成功', 'success');
        } else {
          showSnackbar('基础URL更新失败', 'error');
        }
      }

      if (success) {
        fetchBaseUrls();
        handleCloseDialog();
      }
    } catch (error) {
      console.error('保存基础URL失败:', error);
      showSnackbar('保存基础URL失败', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // 打开删除确认对话框
  const handleOpenDeleteDialog = (baseUrl) => {
    setSelectedBaseUrl(baseUrl);
    setIsDeleteDialogOpen(true);
  };

  // 关闭删除确认对话框
  const handleCloseDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
    setSelectedBaseUrl(null);
  };

  // 删除基础URL
  const handleDeleteBaseUrl = () => {
    if (!selectedBaseUrl) return;

    setIsLoading(true);

    try {
      const success = baseUrlManager.remove(selectedBaseUrl.id);
      if (success) {
        showSnackbar('基础URL删除成功', 'success');
        fetchBaseUrls();
      } else {
        showSnackbar('基础URL删除失败', 'error');
      }
    } catch (error) {
      console.error('删除基础URL失败:', error);
      showSnackbar('删除基础URL失败', 'error');
    } finally {
      setIsLoading(false);
      handleCloseDeleteDialog();
    }
  };

  // 设置默认基础URL
  const handleSetDefault = (id) => {
    setIsLoading(true);

    try {
      const success = baseUrlManager.setDefault(id);
      if (success) {
        showSnackbar('默认基础URL设置成功', 'success');
        fetchBaseUrls();
      } else {
        showSnackbar('默认基础URL设置失败', 'error');
      }
    } catch (error) {
      console.error('设置默认基础URL失败:', error);
      showSnackbar('设置默认基础URL失败', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // 测试基础URL连接
  const handleTestConnection = async (baseUrl) => {
    setIsLoading(true);
    setTestResult(null);
    setSelectedBaseUrl(baseUrl);
    setIsTestDialogOpen(true);

    try {
      // 构建测试URL
      const testUrl = `${baseUrl.url}/health`;

      // 发送请求
      const startTime = Date.now();
      const response = await axios.get(testUrl, {
        timeout: 5000,
        validateStatus: () => true // 允许任何状态码
      });
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      // 设置测试结果
      setTestResult({
        success: response.status >= 200 && response.status < 300,
        status: response.status,
        statusText: response.statusText,
        responseTime,
        data: response.data
      });
    } catch (error) {
      setTestResult({
        success: false,
        error: error.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 关闭测试对话框
  const handleCloseTestDialog = () => {
    setIsTestDialogOpen(false);
    setSelectedBaseUrl(null);
    setTestResult(null);
  };

  return (
    <Box>
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 3,
          borderRadius: 2,
          background: 'linear-gradient(135deg, #1565C0 0%, #1976D2 100%)',
          color: 'white'
        }}
      >
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>基础URL管理</Typography>
        <Typography variant="body1">
          管理API的基础URL，用于构建完整的API请求地址，提高API管理的灵活性和可维护性
        </Typography>
      </Paper>

      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Alert
          severity="info"
          icon={<InfoCircleOutlined />}
          sx={{
            flex: 1,
            minWidth: '300px',
            '& .MuiAlert-message': {
              width: '100%'
            }
          }}
        >
          <Typography variant="subtitle2">基础URL说明</Typography>
          <ul style={{ margin: '4px 0 0 0', paddingLeft: 16 }}>
            <li>基础URL是API的根地址，用于构建完整的API请求地址</li>
            <li>默认基础URL将被用作系统默认API请求地址</li>
            <li>可以通过测试连接功能验证基础URL的可用性</li>
          </ul>
        </Alert>

        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
            sx={{
              borderRadius: 2,
              backgroundColor: '#1976D2',
              '&:hover': {
                backgroundColor: '#1565C0',
              }
            }}
          >
            添加基础URL
          </Button>
          <Button
            variant="outlined"
            startIcon={<CloudDownloadIcon />}
            sx={{
              borderRadius: 2,
              borderColor: '#1976D2',
              color: '#1976D2',
              '&:hover': {
                borderColor: '#1565C0',
                backgroundColor: 'rgba(21, 101, 192, 0.04)',
              }
            }}
            onClick={() => {
              // 导出基础URL功能
              try {
                const jsonStr = JSON.stringify(baseUrls, null, 2);
                const blob = new Blob([jsonStr], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `base-urls-${new Date().toISOString().slice(0, 10)}.json`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
                showSnackbar('基础URL导出成功', 'success');
              } catch (error) {
                console.error('导出基础URL失败:', error);
                showSnackbar('导出基础URL失败', 'error');
              }
            }}
          >
            导出
          </Button>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchBaseUrls}
            sx={{
              borderRadius: 2,
              borderColor: '#1976D2',
              color: '#1976D2',
              '&:hover': {
                borderColor: '#1565C0',
                backgroundColor: 'rgba(21, 101, 192, 0.04)',
              }
            }}
          >
            刷新
          </Button>
        </Box>
      </Box>

      <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', bgcolor: '#f9f9f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
            基础URL列表
          </Typography>
          <Chip
            label={`${baseUrls.length} 个基础URL`}
            size="small"
            sx={{
              bgcolor: '#e3f2fd',
              color: '#1565C0',
              fontWeight: 'medium'
            }}
          />
        </Box>
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: '#f5f5f5' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>ID</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>名称</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>URL</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>状态</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {baseUrls.length > 0 ? (
                baseUrls.map((baseUrl) => (
                  <TableRow
                    key={baseUrl.id}
                    hover
                    sx={{
                      '&:hover': {
                        backgroundColor: '#f5f5f5',
                      },
                      backgroundColor: baseUrl.isDefault ? 'rgba(25, 118, 210, 0.04)' : 'inherit'
                    }}
                  >
                    <TableCell>
                      <Tooltip title="唯一标识符，用于在代码中引用此基础URL">
                        <Box sx={{ fontFamily: 'monospace', fontWeight: 'medium', color: '#1565C0' }}>
                          {baseUrl.id}
                        </Box>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ fontWeight: 'medium' }}>
                        {baseUrl.name}
                      </Box>
                      {baseUrl.description && (
                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                          {baseUrl.description}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Tooltip title={baseUrl.url}>
                        <Box sx={{
                          maxWidth: 250,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          fontFamily: 'monospace',
                          fontSize: '0.875rem'
                        }}>
                          {baseUrl.url}
                        </Box>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      {baseUrl.isDefault ? (
                        <Chip
                          label="默认"
                          color="primary"
                          size="small"
                          sx={{ fontWeight: 'medium' }}
                        />
                      ) : (
                        <Chip
                          label="普通"
                          color="default"
                          size="small"
                          variant="outlined"
                          sx={{ fontWeight: 'medium' }}
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Tooltip title="测试连接">
                          <IconButton
                            size="small"
                            onClick={() => handleTestConnection(baseUrl)}
                            sx={{
                              color: '#2196f3',
                              '&:hover': { bgcolor: '#e3f2fd' }
                            }}
                          >
                            <LinkIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="设为默认">
                          <IconButton
                            size="small"
                            onClick={() => handleSetDefault(baseUrl.id)}
                            disabled={baseUrl.isDefault}
                            sx={{
                              color: baseUrl.isDefault ? '#1976D2' : 'action.disabled',
                              '&:hover': { bgcolor: '#e3f2fd' }
                            }}
                          >
                            <CheckIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="编辑">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenDialog(baseUrl)}
                            sx={{
                              color: '#ff9800',
                              '&:hover': { bgcolor: '#fff8e1' }
                            }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="删除">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenDeleteDialog(baseUrl)}
                            disabled={baseUrl.isDefault}
                            sx={{
                              color: baseUrl.isDefault ? 'action.disabled' : '#f44336',
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
                  <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                      <LinkIcon sx={{ fontSize: 48, color: '#bdbdbd' }} />
                      <Typography variant="h6" color="text.secondary">
                        没有找到基础URL
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        点击"添加基础URL"按钮创建新的基础URL
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* 基础URL编辑对话框 */}
      <Dialog open={isDialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle sx={{
          borderBottom: '1px solid #e0e0e0',
          bgcolor: '#f9f9f9',
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}>
          {selectedBaseUrl && baseUrls.find(url => url.id === selectedBaseUrl.id) ? (
            <>
              <EditIcon sx={{ color: '#ff9800' }} />
              编辑基础URL: {selectedBaseUrl.name}
            </>
          ) : (
            <>
              <AddIcon sx={{ color: '#1976D2' }} />
              添加新基础URL
            </>
          )}
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          {selectedBaseUrl && (
            <>
              <Alert
                severity="info"
                sx={{ mb: 3 }}
                icon={<InfoCircleOutlined />}
              >
                <Typography variant="subtitle2">基础URL配置说明</Typography>
                <ul style={{ margin: '4px 0 0 0', paddingLeft: 16 }}>
                  <li>基础URL是API的根地址，用于构建完整的API请求地址</li>
                  <li>ID是唯一标识符，用于在代码中引用此基础URL</li>
                  <li>URL应包含协议和主机名，例如：https://nodered.jzz77.cn:9003</li>
                  <li>设置为默认的基础URL将被用作系统默认API请求地址</li>
                </ul>
              </Alert>

              <Paper variant="outlined" sx={{ p: 3, mb: 3, borderRadius: 2 }}>
                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'medium', color: '#1976D2', mb: 2 }}>
                  基本信息
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="ID"
                      fullWidth
                      value={selectedBaseUrl.id}
                      onChange={(e) => handleFormChange('id', e.target.value)}
                      error={!!formErrors.id}
                      helperText={formErrors.id || "唯一标识符，用于在代码中引用此基础URL"}
                      disabled={!!baseUrls.find(url => url.id === selectedBaseUrl.id)} // 禁止编辑已存在的ID
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
                      label="名称"
                      fullWidth
                      value={selectedBaseUrl.name}
                      onChange={(e) => handleFormChange('name', e.target.value)}
                      error={!!formErrors.name}
                      helperText={formErrors.name || "基础URL的显示名称，便于识别"}
                      InputProps={{
                        startAdornment: (
                          <Box component="span" sx={{ color: 'action.active', mr: 1 }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                              <polyline points="9 22 9 12 15 12 15 22"></polyline>
                            </svg>
                          </Box>
                        ),
                      }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      label="URL"
                      fullWidth
                      value={selectedBaseUrl.url}
                      onChange={(e) => handleFormChange('url', e.target.value)}
                      error={!!formErrors.url}
                      helperText={formErrors.url || 'URL应包含协议和主机名，例如：https://nodered.jzz77.cn:9003'}
                      InputProps={{
                        startAdornment: (
                          <Box component="span" sx={{ color: 'action.active', mr: 1 }}>
                            <LinkIcon fontSize="small" />
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
                      value={selectedBaseUrl.description || ''}
                      onChange={(e) => handleFormChange('description', e.target.value)}
                      helperText="基础URL的详细描述，包括用途、环境等信息"
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
                          checked={selectedBaseUrl.isDefault}
                          onChange={(e) => handleFormChange('isDefault', e.target.checked)}
                          color="primary"
                        />
                      }
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography variant="body1" sx={{ mr: 1 }}>设为默认</Typography>
                          <Chip
                            label={selectedBaseUrl.isDefault ? "已设为默认" : "非默认"}
                            size="small"
                            color={selectedBaseUrl.isDefault ? "primary" : "default"}
                            sx={{ fontWeight: 'medium' }}
                          />
                        </Box>
                      }
                    />
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, ml: 4 }}>
                      每次只能有一个默认基础URL，设置新的默认URL会取消其他URL的默认状态
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>

              {selectedBaseUrl && baseUrls.find(url => url.id === selectedBaseUrl.id) && (
                <Paper variant="outlined" sx={{ p: 3, borderRadius: 2, bgcolor: '#f9f9f9' }}>
                  <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'medium', color: '#1976D2', mb: 2 }}>
                    连接测试
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="body2">
                      测试此基础URL的连接状态，验证URL是否可访问
                    </Typography>
                    <Button
                      variant="outlined"
                      color="primary"
                      startIcon={<LinkIcon />}
                      onClick={() => handleTestConnection(selectedBaseUrl)}
                      size="small"
                      sx={{
                        borderRadius: 2,
                        borderColor: '#1976D2',
                        color: '#1976D2',
                        '&:hover': {
                          borderColor: '#1565C0',
                          backgroundColor: 'rgba(21, 101, 192, 0.04)',
                        }
                      }}
                    >
                      测试连接
                    </Button>
                  </Box>
                </Paper>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ borderTop: '1px solid #e0e0e0', p: 2 }}>
          <Button
            onClick={handleCloseDialog}
            sx={{
              borderRadius: 2,
              color: '#1976D2',
              '&:hover': {
                backgroundColor: 'rgba(25, 118, 210, 0.04)',
              }
            }}
          >
            取消
          </Button>
          <Button
            onClick={handleSaveBaseUrl}
            variant="contained"
            color="primary"
            disabled={isLoading}
            startIcon={<SaveIcon />}
            sx={{
              borderRadius: 2,
              backgroundColor: '#1976D2',
              '&:hover': {
                backgroundColor: '#1565C0',
              }
            }}
          >
            {isLoading ? '保存中...' : '保存'}
          </Button>
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
          删除基础URL
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="subtitle2">
              此操作不可撤销，请谨慎操作！
            </Typography>
          </Alert>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography>
              您确定要删除以下基础URL吗？
            </Typography>
            {selectedBaseUrl && (
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      ID
                    </Typography>
                    <Typography variant="body1" sx={{ fontFamily: 'monospace', fontWeight: 'medium' }}>
                      {selectedBaseUrl.id}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      名称
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                      {selectedBaseUrl.name}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">
                      URL
                    </Typography>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                      {selectedBaseUrl.url}
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>
            )}
            <Typography variant="body2" color="error">
              注意：删除基础URL可能会影响使用此URL的API配置。
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ borderTop: '1px solid #e0e0e0', p: 2 }}>
          <Button
            onClick={handleCloseDeleteDialog}
            sx={{
              borderRadius: 2,
              color: '#1976D2',
              '&:hover': {
                backgroundColor: 'rgba(25, 118, 210, 0.04)',
              }
            }}
          >
            取消
          </Button>
          <Button
            onClick={handleDeleteBaseUrl}
            variant="contained"
            color="error"
            startIcon={<DeleteIcon />}
            disabled={isLoading}
            sx={{
              borderRadius: 2
            }}
          >
            确认删除
          </Button>
        </DialogActions>
      </Dialog>

      {/* 测试结果对话框 */}
      <Dialog open={isTestDialogOpen} onClose={handleCloseTestDialog} maxWidth="md" fullWidth>
        <DialogTitle sx={{
          borderBottom: '1px solid #e0e0e0',
          bgcolor: '#f9f9f9',
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}>
          <LinkIcon sx={{ color: '#2196f3' }} />
          测试基础URL连接
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          {selectedBaseUrl && (
            <Box>
              <Paper variant="outlined" sx={{ p: 2, mb: 3, borderRadius: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={8}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      测试URL
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
                      {selectedBaseUrl.url}/health
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      基础URL名称
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                      {selectedBaseUrl.name}
                      {selectedBaseUrl.isDefault && (
                        <Chip
                          label="默认"
                          size="small"
                          color="primary"
                          sx={{ ml: 1 }}
                        />
                      )}
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>

              {isLoading ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', my: 5, gap: 2 }}>
                  <CircularProgress size={60} thickness={4} />
                  <Typography variant="h6" color="text.secondary">
                    正在测试连接...
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    请稍候，正在尝试连接到基础URL
                  </Typography>
                </Box>
              ) : testResult ? (
                <Box>
                  <Divider sx={{ my: 3 }}>
                    <Chip
                      label="测试结果"
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
                      p: 3,
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
                          {testResult.success ? '连接成功' : `连接失败: ${testResult.error || '未知错误'}`}
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
                    <Paper variant="outlined" sx={{ p: 3, mb: 2, borderRadius: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        响应数据
                      </Typography>
                      <Paper sx={{ p: 2, bgcolor: '#f5f5f5', maxHeight: '300px', overflow: 'auto', borderRadius: 1 }}>
                        <pre style={{ margin: 0 }}>{JSON.stringify(testResult.data, null, 2)}</pre>
                      </Paper>
                    </Paper>
                  )}
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', my: 5, gap: 2 }}>
                  <LinkIcon sx={{ fontSize: 60, color: '#bdbdbd' }} />
                  <Typography variant="h6" color="text.secondary">
                    准备测试连接
                  </Typography>
                  <Typography variant="body2" color="text.secondary" align="center">
                    点击"测试连接"按钮开始测试基础URL的连接状态<br />
                    测试将向URL发送请求并验证响应
                  </Typography>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<LinkIcon />}
                    onClick={() => handleTestConnection(selectedBaseUrl)}
                    sx={{
                      mt: 2,
                      borderRadius: 2,
                      backgroundColor: '#1976D2',
                      '&:hover': {
                        backgroundColor: '#1565C0',
                      }
                    }}
                  >
                    开始测试
                  </Button>
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
              color: '#1976D2',
              '&:hover': {
                backgroundColor: 'rgba(25, 118, 210, 0.04)',
              }
            }}
          >
            关闭
          </Button>
          {testResult && (
            <Button
              onClick={() => handleTestConnection(selectedBaseUrl)}
              variant="outlined"
              color="primary"
              startIcon={<RefreshIcon />}
              disabled={isLoading}
              sx={{
                borderRadius: 2,
                borderColor: '#1976D2',
                color: '#1976D2',
                '&:hover': {
                  borderColor: '#1565C0',
                  backgroundColor: 'rgba(21, 101, 192, 0.04)',
                }
              }}
            >
              {isLoading ? '测试中...' : '重新测试'}
            </Button>
          )}
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

export default BaseUrlManager;
