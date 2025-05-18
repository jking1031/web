import React, { Component } from 'react';
import { Alert, Button, Typography, Box, Paper } from '@mui/material';
import { ReplayOutlined, HomeOutlined } from '@mui/icons-material';

/**
 * 错误边界组件
 * 捕获子组件树中的 JavaScript 错误，并显示备用 UI
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    // 更新 state 使下一次渲染显示错误 UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // 记录错误信息
    console.error('错误边界捕获到错误:', error, errorInfo);
    this.setState({ errorInfo });
    
    // 可以在这里将错误信息发送到错误报告服务
    // logErrorToService(error, errorInfo);
  }

  handleReset = () => {
    // 重置错误状态
    this.setState({ hasError: false, error: null, errorInfo: null });
    
    // 尝试重新加载组件
    if (this.props.onReset) {
      this.props.onReset();
    }
  }

  handleGoHome = () => {
    // 导航到首页
    window.location.href = '/';
  }

  render() {
    if (this.state.hasError) {
      // 渲染错误 UI
      return (
        <Box sx={{ p: 3, maxWidth: '800px', margin: '0 auto', mt: 4 }}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Alert severity="error" sx={{ mb: 2 }}>
              <Typography variant="h6" component="div">
                页面出现错误
              </Typography>
            </Alert>
            
            <Typography variant="body1" sx={{ mb: 2 }}>
              很抱歉，页面加载过程中出现了问题。您可以尝试以下操作：
            </Typography>
            
            <Box sx={{ mb: 3 }}>
              <Button 
                variant="contained" 
                color="primary" 
                startIcon={<ReplayOutlined />}
                onClick={this.handleReset}
                sx={{ mr: 2 }}
              >
                重试
              </Button>
              
              <Button 
                variant="outlined" 
                startIcon={<HomeOutlined />}
                onClick={this.handleGoHome}
              >
                返回首页
              </Button>
            </Box>
            
            {this.props.showDetails && (
              <Box sx={{ mt: 3, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                <Typography variant="subtitle2" color="error">
                  错误详情:
                </Typography>
                <Typography variant="body2" component="pre" sx={{ 
                  whiteSpace: 'pre-wrap', 
                  overflow: 'auto',
                  maxHeight: '200px',
                  fontSize: '0.75rem'
                }}>
                  {this.state.error && this.state.error.toString()}
                  {this.state.errorInfo && this.state.errorInfo.componentStack}
                </Typography>
              </Box>
            )}
          </Paper>
        </Box>
      );
    }

    // 正常渲染子组件
    return this.props.children;
  }
}

export default ErrorBoundary;
