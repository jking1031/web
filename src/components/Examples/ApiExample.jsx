/**
 * API 调用示例组件
 * 展示如何使用 API 调用系统
 */
import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Button, 
  CircularProgress, 
  Alert, 
  Divider,
  Grid,
  Card,
  CardContent,
  CardActions
} from '@mui/material';
import { useApi, useApis, usePaginatedApi } from '../../hooks/useApi';

/**
 * 单个 API 调用示例
 */
const SingleApiExample = () => {
  // 使用 useApi Hook 调用单个 API
  const { 
    data, 
    loading, 
    error, 
    execute 
  } = useApi('getUserInfo', {}, { 
    // 自动加载数据
    autoLoad: true,
    // 数据转换函数
    transformData: (data) => {
      // 可以在这里转换数据
      return data;
    }
  });
  
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          单个 API 调用示例
        </Typography>
        
        {loading && <CircularProgress size={24} />}
        
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            加载失败: {error.message}
          </Alert>
        )}
        
        {data && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle1">
              用户信息:
            </Typography>
            <pre>{JSON.stringify(data, null, 2)}</pre>
          </Box>
        )}
      </CardContent>
      
      <CardActions>
        <Button 
          variant="contained" 
          onClick={() => execute()}
          disabled={loading}
        >
          刷新数据
        </Button>
      </CardActions>
    </Card>
  );
};

/**
 * 多个 API 调用示例
 */
const MultipleApisExample = () => {
  // 使用 useApis Hook 调用多个 API
  const { 
    results, 
    loading, 
    errors, 
    execute 
  } = useApis([
    { key: 'getDeviceStatus', params: {} },
    { key: 'getNotifications', params: {} }
  ], { 
    autoLoad: true,
    parallel: true
  });
  
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          多个 API 调用示例
        </Typography>
        
        {loading && <CircularProgress size={24} />}
        
        {Object.keys(errors).length > 0 && (
          <Alert severity="error" sx={{ mt: 2 }}>
            部分 API 调用失败
          </Alert>
        )}
        
        <Grid container spacing={2} sx={{ mt: 2 }}>
          {Object.entries(results).map(([key, data]) => (
            <Grid item xs={12} md={6} key={key}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle1">
                  {key}:
                </Typography>
                <pre>{JSON.stringify(data, null, 2)}</pre>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </CardContent>
      
      <CardActions>
        <Button 
          variant="contained" 
          onClick={() => execute()}
          disabled={loading}
        >
          刷新数据
        </Button>
      </CardActions>
    </Card>
  );
};

/**
 * 分页 API 调用示例
 */
const PaginatedApiExample = () => {
  // 使用 usePaginatedApi Hook 调用分页 API
  const { 
    data, 
    loading, 
    error, 
    page, 
    pageSize, 
    total, 
    handlePageChange 
  } = usePaginatedApi('getUsers', {}, { 
    autoLoad: true,
    pageSize: 10,
    initialPage: 1
  });
  
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          分页 API 调用示例
        </Typography>
        
        {loading && <CircularProgress size={24} />}
        
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            加载失败: {error.message}
          </Alert>
        )}
        
        {data && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle1">
              用户列表 (第 {page} 页，共 {Math.ceil(total / pageSize)} 页):
            </Typography>
            <pre>{JSON.stringify(data, null, 2)}</pre>
          </Box>
        )}
      </CardContent>
      
      <CardActions>
        <Button 
          variant="outlined" 
          onClick={() => handlePageChange(page - 1)}
          disabled={loading || page <= 1}
        >
          上一页
        </Button>
        
        <Button 
          variant="outlined" 
          onClick={() => handlePageChange(page + 1)}
          disabled={loading || (total && page >= Math.ceil(total / pageSize))}
        >
          下一页
        </Button>
      </CardActions>
    </Card>
  );
};

/**
 * API 调用示例组件
 */
const ApiExample = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        API 调用示例
      </Typography>
      
      <Typography variant="body1" paragraph>
        这个页面展示了如何使用 API 调用系统。
      </Typography>
      
      <Divider sx={{ my: 3 }} />
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <SingleApiExample />
        </Grid>
        
        <Grid item xs={12} md={4}>
          <MultipleApisExample />
        </Grid>
        
        <Grid item xs={12} md={4}>
          <PaginatedApiExample />
        </Grid>
      </Grid>
    </Box>
  );
};

export default ApiExample;
