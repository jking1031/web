import React, { useState } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  Alert,
  CircularProgress,
  Divider,
  Chip,
  Grid
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  CloudDownload as CloudDownloadIcon,
  Delete as DeleteIcon,
  Sync as SyncIcon
} from '@mui/icons-material';
import apiManager from "../../services/api/core/apiManager";
import { saveApiConfigsToDb, getApiConfigsFromDb, deleteApiConfigsFromDb } from '../../api/apiSyncApi';

/**
 * API数据库同步工具组件
 * 用于将API配置同步到数据库或从数据库加载API配置
 */
const ApiDbSyncTool = ({ onApiUpdated }) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [operation, setOperation] = useState('');

  // 保存API配置到数据库
  const handleSaveToDb = async () => {
    setLoading(true);
    setOperation('save');
    setResult(null);

    try {
      // 导出API配置
      const apiConfigs = apiManager.registry.exportApis();
      
      // 保存到数据库
      const response = await saveApiConfigsToDb(apiConfigs);
      
      setResult({
        success: true,
        message: `成功将 ${Object.keys(apiConfigs).length} 个API配置保存到数据库`,
        details: response
      });
      
      if (onApiUpdated) {
        onApiUpdated();
      }
    } catch (error) {
      setResult({
        success: false,
        message: '保存API配置到数据库失败',
        error: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  // 从数据库加载API配置
  const handleLoadFromDb = async () => {
    setLoading(true);
    setOperation('load');
    setResult(null);

    try {
      // 从数据库获取API配置
      const response = await getApiConfigsFromDb();
      
      if (response.success && response.data) {
        // 导入API配置
        const success = apiManager.registry.importApis(response.data, true);
        
        if (success) {
          setResult({
            success: true,
            message: `成功从数据库加载 ${Object.keys(response.data).length} 个API配置`,
            details: response
          });
          
          if (onApiUpdated) {
            onApiUpdated();
          }
        } else {
          throw new Error('导入API配置失败');
        }
      } else {
        throw new Error(response.message || '获取API配置失败');
      }
    } catch (error) {
      setResult({
        success: false,
        message: '从数据库加载API配置失败',
        error: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  // 删除数据库中的API配置
  const handleDeleteFromDb = async () => {
    setLoading(true);
    setOperation('delete');
    setResult(null);

    try {
      // 删除数据库中的API配置
      const response = await deleteApiConfigsFromDb();
      
      setResult({
        success: true,
        message: '成功删除数据库中的API配置',
        details: response
      });
    } catch (error) {
      setResult({
        success: false,
        message: '删除数据库中的API配置失败',
        error: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
      <Typography variant="h6" gutterBottom>
        API数据库同步
      </Typography>
      
      <Typography variant="body2" color="text.secondary" paragraph>
        将API配置同步到数据库或从数据库加载API配置，实现跨设备和环境的API配置共享。
      </Typography>
      
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item>
          <Button
            variant="contained"
            color="primary"
            startIcon={loading && operation === 'save' ? <CircularProgress size={20} /> : <CloudUploadIcon />}
            onClick={handleSaveToDb}
            disabled={loading}
            sx={{ borderRadius: 2 }}
          >
            保存到数据库
          </Button>
        </Grid>
        <Grid item>
          <Button
            variant="outlined"
            color="primary"
            startIcon={loading && operation === 'load' ? <CircularProgress size={20} /> : <CloudDownloadIcon />}
            onClick={handleLoadFromDb}
            disabled={loading}
            sx={{ borderRadius: 2 }}
          >
            从数据库加载
          </Button>
        </Grid>
        <Grid item>
          <Button
            variant="outlined"
            color="error"
            startIcon={loading && operation === 'delete' ? <CircularProgress size={20} /> : <DeleteIcon />}
            onClick={handleDeleteFromDb}
            disabled={loading}
            sx={{ borderRadius: 2 }}
          >
            删除数据库配置
          </Button>
        </Grid>
      </Grid>
      
      {result && (
        <Box sx={{ mt: 2 }}>
          <Divider sx={{ my: 2 }}>
            <Chip
              label="操作结果"
              sx={{
                fontWeight: 'medium',
                bgcolor: result.success ? '#e8f5e9' : '#ffebee',
                color: result.success ? '#2e7d32' : '#c62828'
              }}
            />
          </Divider>
          
          <Alert
            severity={result.success ? 'success' : 'error'}
            sx={{ mb: 2 }}
          >
            {result.message}
          </Alert>
          
          {result.error && (
            <Typography variant="body2" color="error" sx={{ mt: 1 }}>
              错误详情: {result.error}
            </Typography>
          )}
        </Box>
      )}
    </Paper>
  );
};

export default ApiDbSyncTool;
