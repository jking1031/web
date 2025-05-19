/**
 * API 调用类组件示例
 * 展示如何在类组件中使用 API 调用系统
 */
import React, { Component } from 'react';
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
import { withApi, withSingleApi } from '../../hocs/withApi';

/**
 * 单个 API 调用类组件示例
 */
class SingleApiClassExample extends Component {
  componentDidMount() {
    // 组件挂载时调用 API
    this.props.getUserInfo();
  }
  
  render() {
    const { apiData, apiLoading, apiErrors } = this.props;
    const data = apiData.getUserInfo;
    const loading = apiLoading.getUserInfo;
    const error = apiErrors.getUserInfo;
    
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            单个 API 调用类组件示例
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
            onClick={() => this.props.getUserInfo()}
            disabled={loading}
          >
            刷新数据
          </Button>
        </CardActions>
      </Card>
    );
  }
}

// 使用 withApi 高阶组件包装类组件
const EnhancedSingleApiClassExample = withApi({
  getUserInfo: 'getUserInfo'
})(SingleApiClassExample);

/**
 * 多个 API 调用类组件示例
 */
class MultipleApisClassExample extends Component {
  componentDidMount() {
    // 组件挂载时批量调用 API
    this.props.batchCallApis([
      { key: 'getDeviceStatus', params: {} },
      { key: 'getNotifications', params: {} }
    ]);
  }
  
  render() {
    const { apiData, batchLoading, apiErrors } = this.props;
    
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            多个 API 调用类组件示例
          </Typography>
          
          {batchLoading && <CircularProgress size={24} />}
          
          {Object.keys(apiErrors).length > 0 && (
            <Alert severity="error" sx={{ mt: 2 }}>
              部分 API 调用失败
            </Alert>
          )}
          
          <Grid container spacing={2} sx={{ mt: 2 }}>
            {Object.entries(apiData).map(([key, data]) => (
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
            onClick={() => this.props.batchCallApis([
              { key: 'getDeviceStatus', params: {} },
              { key: 'getNotifications', params: {} }
            ])}
            disabled={batchLoading}
          >
            刷新数据
          </Button>
        </CardActions>
      </Card>
    );
  }
}

// 使用 withApi 高阶组件包装类组件
const EnhancedMultipleApisClassExample = withApi({})(MultipleApisClassExample);

/**
 * 使用 withSingleApi 高阶组件的示例
 */
class SimpleSingleApiExample extends Component {
  componentDidMount() {
    // 组件挂载时调用 API
    this.props.api();
  }
  
  render() {
    const { apiData, apiLoading, apiErrors } = this.props;
    const data = apiData.api;
    const loading = apiLoading.api;
    const error = apiErrors.api;
    
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            简化的单个 API 调用示例
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
                设备状态:
              </Typography>
              <pre>{JSON.stringify(data, null, 2)}</pre>
            </Box>
          )}
        </CardContent>
        
        <CardActions>
          <Button 
            variant="contained" 
            onClick={() => this.props.api()}
            disabled={loading}
          >
            刷新数据
          </Button>
        </CardActions>
      </Card>
    );
  }
}

// 使用 withSingleApi 高阶组件包装类组件
const EnhancedSimpleSingleApiExample = withSingleApi('getDeviceStatus')(SimpleSingleApiExample);

/**
 * API 调用类组件示例
 */
class ApiClassExample extends Component {
  render() {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          API 调用类组件示例
        </Typography>
        
        <Typography variant="body1" paragraph>
          这个页面展示了如何在类组件中使用 API 调用系统。
        </Typography>
        
        <Divider sx={{ my: 3 }} />
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <EnhancedSingleApiClassExample />
          </Grid>
          
          <Grid item xs={12} md={4}>
            <EnhancedMultipleApisClassExample />
          </Grid>
          
          <Grid item xs={12} md={4}>
            <EnhancedSimpleSingleApiExample />
          </Grid>
        </Grid>
      </Box>
    );
  }
}

export default ApiClassExample;
