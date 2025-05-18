import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Grid,
  CircularProgress,
  Alert,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import dbService from '../../services/dbService';

/**
 * 数据库测试组件
 * 用于测试数据库连接和查询
 */
const DatabaseTest = () => {
  // 数据库配置
  const [config, setConfig] = useState({
    type: 'mysql',
    host: 'nodered.jzz77.cn',
    port: 9003,
    username: 'root',
    password: '',
    database: 'test'
  });

  // 查询参数
  const [sql, setSql] = useState('SELECT 1 AS test');
  const [params, setParams] = useState('[]');

  // 状态
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [queryResult, setQueryResult] = useState(null);

  // 处理配置变更
  const handleConfigChange = (field, value) => {
    setConfig({
      ...config,
      [field]: field === 'port' ? (value ? parseInt(value) : '') : value
    });
  };

  // 测试连接
  const handleTestConnection = async () => {
    setIsLoading(true);
    setTestResult(null);

    try {
      const result = await dbService.testConnection(config);
      setTestResult(result);
    } catch (error) {
      setTestResult({
        success: false,
        message: `连接失败: ${error.message}`,
        error: error.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 执行查询
  const handleExecuteQuery = async () => {
    setIsLoading(true);
    setQueryResult(null);

    try {
      // 解析参数
      let parsedParams = [];
      try {
        parsedParams = JSON.parse(params);
      } catch (error) {
        throw new Error(`参数解析错误: ${error.message}`);
      }

      const result = await dbService.query(config, sql, parsedParams, { includeFields: true });
      setQueryResult({
        success: true,
        data: result
      });
    } catch (error) {
      setQueryResult({
        success: false,
        message: `查询失败: ${error.message}`,
        error: error.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>数据库测试</Typography>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>数据库配置</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              label="数据库类型"
              fullWidth
              value={config.type}
              onChange={(e) => handleConfigChange('type', e.target.value)}
              margin="normal"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              label="主机"
              fullWidth
              value={config.host}
              onChange={(e) => handleConfigChange('host', e.target.value)}
              margin="normal"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              label="端口"
              fullWidth
              type="number"
              value={config.port}
              onChange={(e) => handleConfigChange('port', e.target.value)}
              margin="normal"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              label="用户名"
              fullWidth
              value={config.username}
              onChange={(e) => handleConfigChange('username', e.target.value)}
              margin="normal"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              label="密码"
              fullWidth
              type="password"
              value={config.password}
              onChange={(e) => handleConfigChange('password', e.target.value)}
              margin="normal"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              label="数据库"
              fullWidth
              value={config.database}
              onChange={(e) => handleConfigChange('database', e.target.value)}
              margin="normal"
            />
          </Grid>
        </Grid>

        <Box sx={{ mt: 2 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleTestConnection}
            disabled={isLoading}
          >
            {isLoading ? <CircularProgress size={24} /> : '测试连接'}
          </Button>
        </Box>

        {testResult && (
          <Box sx={{ mt: 2 }}>
            <Alert severity={testResult.success ? 'success' : 'error'}>
              {testResult.message}
            </Alert>
            {testResult.success && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle1">连接信息:</Typography>
                <Typography>数据库版本: {testResult.version}</Typography>
                <Typography>响应时间: {testResult.responseTime}ms</Typography>
              </Box>
            )}
          </Box>
        )}
      </Paper>

      <Divider sx={{ my: 3 }} />

      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>执行SQL查询</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              label="SQL语句"
              fullWidth
              multiline
              rows={3}
              value={sql}
              onChange={(e) => setSql(e.target.value)}
              margin="normal"
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="参数 (JSON数组)"
              fullWidth
              value={params}
              onChange={(e) => setParams(e.target.value)}
              margin="normal"
              helperText="例如: [1, 'test']"
            />
          </Grid>
        </Grid>

        <Box sx={{ mt: 2 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleExecuteQuery}
            disabled={isLoading}
          >
            {isLoading ? <CircularProgress size={24} /> : '执行查询'}
          </Button>
        </Box>

        {queryResult && (
          <Box sx={{ mt: 2 }}>
            {queryResult.success ? (
              <>
                <Alert severity="success" sx={{ mb: 2 }}>
                  查询成功，返回 {queryResult.data.rows?.length || 0} 条记录
                </Alert>
                {queryResult.data.rows && queryResult.data.rows.length > 0 && (
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          {Object.keys(queryResult.data.rows[0]).map(key => (
                            <TableCell key={key}>{key}</TableCell>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {queryResult.data.rows.map((row, rowIndex) => (
                          <TableRow key={rowIndex}>
                            {Object.values(row).map((value, colIndex) => (
                              <TableCell key={colIndex}>
                                {value === null ? 'NULL' : String(value)}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </>
            ) : (
              <Alert severity="error">
                {queryResult.message}
              </Alert>
            )}
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default DatabaseTest;
