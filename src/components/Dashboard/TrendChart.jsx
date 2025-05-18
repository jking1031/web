import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, Typography, Box, CircularProgress, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { LineChartOutlined, SettingOutlined, ReloadOutlined } from '@ant-design/icons';
import { Line } from '@ant-design/charts';
import moment from 'moment';
import api from '../../api/interceptors';
import apiManager from '../../services/apiManager';

/**
 * 趋势图组件
 * 显示实时趋势数据，支持定时执行API查询并保存数据
 */
const TrendChart = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState([]);
  const [config, setConfig] = useState({
    dbName: 'nodered',
    tableName: 'gt_data',
    fields: ['timestamp', 'flow_in', 'flow_out', 'pressure'],
    interval: 60000, // 默认1分钟
    title: '实时趋势',
    maxDataPoints: 1000 // 最大数据点数量
  });
  const [openDialog, setOpenDialog] = useState(false);
  const [tempConfig, setTempConfig] = useState({});
  const timerRef = useRef(null);
  const dataRef = useRef([]);

  // 加载保存的配置
  useEffect(() => {
    const savedConfig = localStorage.getItem('trendChartConfig');
    if (savedConfig) {
      try {
        const parsedConfig = JSON.parse(savedConfig);
        setConfig(prevConfig => ({ ...prevConfig, ...parsedConfig }));
        console.log('TrendChart: 加载保存的配置', parsedConfig);
      } catch (e) {
        console.error('TrendChart: 解析保存的配置失败', e);
      }
    }
  }, []);

  // 获取趋势数据
  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('TrendChart: 开始获取趋势数据', config);
        setLoading(true);

        // 构建查询参数
        const queryParams = {
          dataSource: {
            type: 'mysql',
            host: 'localhost',
            port: 3306,
            database: config.dbName,
            username: 'root',
            password: ''
          },
          sql: `SELECT ${config.fields.join(', ')} FROM ${config.tableName} ORDER BY timestamp DESC LIMIT 100`,
          parameters: {}
        };

        try {
          // 使用API管理系统的customQuery API
          const response = await apiManager.call('customQuery', queryParams);

          if (response && Array.isArray(response)) {
            console.log('TrendChart: 获取趋势数据成功', response.length);

            // 处理数据，转换为图表所需格式
            const chartData = processData(response);

            // 更新数据
            setData(chartData);
            dataRef.current = chartData;

            // 保存数据到localStorage
            saveDataToStorage(chartData);
          } else {
            throw new Error('响应数据为空或格式不正确');
          }
        } catch (apiError) {
          console.warn('TrendChart: 使用API管理系统获取数据失败，尝试直接调用API:', apiError.message);

          // 如果API管理系统调用失败，尝试直接调用API
          const directQueryParams = {
            dbName: config.dbName,
            tableName: config.tableName,
            fields: config.fields.join(','),
            limit: 100,
            orderBy: 'timestamp',
            orderDir: 'DESC'
          };

          // 发送自定义查询请求
          const response = await api.post('https://nodered.jzz77.cn:9003/custom-query', directQueryParams, {
            timeout: 10000,
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            }
          });

          if (response.data && Array.isArray(response.data)) {
            console.log('TrendChart: 直接API调用成功', response.data.length);

            // 处理数据，转换为图表所需格式
            const chartData = processData(response.data);

            // 更新数据
            setData(chartData);
            dataRef.current = chartData;

            // 保存数据到localStorage
            saveDataToStorage(chartData);
          } else {
            throw new Error('直接API调用返回的数据为空或格式不正确');
          }
        }
      } catch (error) {
        console.error('TrendChart: 获取趋势数据错误:', error);
        setError('获取数据失败: ' + (error.message || '未知错误'));

        // 使用模拟数据
        const mockData = generateMockData();
        setData(mockData);
        dataRef.current = mockData;
      } finally {
        setLoading(false);
      }
    };

    // 立即执行一次查询
    fetchData();

    // 设置定时器，定期执行查询
    timerRef.current = setInterval(fetchData, config.interval);

    // 清理函数
    return () => {
      console.log('TrendChart: 组件卸载，清理资源');
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [config.dbName, config.tableName, config.fields, config.interval]);

  // 处理数据，转换为图表所需格式
  const processData = (rawData) => {
    // 确保数据是按时间排序的
    const sortedData = [...rawData].sort((a, b) => {
      return new Date(a.timestamp) - new Date(b.timestamp);
    });

    // 限制数据点数量
    const limitedData = sortedData.slice(-config.maxDataPoints);

    // 转换为图表所需格式
    const result = [];

    limitedData.forEach(item => {
      // 跳过timestamp字段
      Object.keys(item).forEach(key => {
        if (key !== 'timestamp' && config.fields.includes(key)) {
          result.push({
            time: moment(item.timestamp).format('MM-DD HH:mm:ss'),
            value: parseFloat(item[key]),
            category: key
          });
        }
      });
    });

    return result;
  };

  // 生成模拟数据
  const generateMockData = () => {
    const result = [];
    const now = new Date();
    const categories = config.fields.filter(f => f !== 'timestamp');

    // 生成过去24小时的数据，每小时一个点
    for (let i = 0; i < 24; i++) {
      const time = new Date(now.getTime() - (23 - i) * 3600000);
      const timeStr = moment(time).format('MM-DD HH:mm:ss');

      categories.forEach(category => {
        // 生成随机值，但保持一定的连续性
        const baseValue = Math.random() * 100;
        const value = baseValue + Math.sin(i / 3) * 20;

        result.push({
          time: timeStr,
          value: parseFloat(value.toFixed(2)),
          category
        });
      });
    }

    return result;
  };

  // 保存数据到localStorage
  const saveDataToStorage = (data) => {
    try {
      // 只保存最新的数据，避免localStorage超出限制
      const dataToSave = data.slice(-500);
      localStorage.setItem('trendChartData', JSON.stringify({
        timestamp: Date.now(),
        data: dataToSave
      }));
    } catch (e) {
      console.error('TrendChart: 保存数据到localStorage失败', e);
    }
  };

  // 打开设置对话框
  const handleOpenDialog = () => {
    setTempConfig({ ...config });
    setOpenDialog(true);
  };

  // 关闭设置对话框
  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  // 保存设置
  const handleSaveConfig = () => {
    setConfig(tempConfig);
    localStorage.setItem('trendChartConfig', JSON.stringify(tempConfig));
    setOpenDialog(false);

    // 重新启动定时器
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    timerRef.current = setInterval(() => {
      // 重新获取数据
      const fetchData = async () => {
        try {
          console.log('TrendChart: 定时获取趋势数据', tempConfig);

          // 构建查询参数
          const queryParams = {
            dataSource: {
              type: 'mysql',
              host: 'localhost',
              port: 3306,
              database: tempConfig.dbName,
              username: 'root',
              password: ''
            },
            sql: `SELECT ${tempConfig.fields.join(', ')} FROM ${tempConfig.tableName} ORDER BY timestamp DESC LIMIT 100`,
            parameters: {}
          };

          // 使用API管理系统获取数据
          try {
            const response = await apiManager.call('customQuery', queryParams);
            if (response && Array.isArray(response)) {
              const chartData = processData(response);
              setData(chartData);
              dataRef.current = chartData;
              saveDataToStorage(chartData);
              setError(null);
            }
          } catch (error) {
            console.error('定时获取数据失败:', error);
            // 使用上次的数据，不显示错误
          }
        } catch (error) {
          console.error('定时器执行错误:', error);
        }
      };
      fetchData();
    }, tempConfig.interval);
  };

  // 手动刷新数据
  const handleRefresh = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    const fetchData = async () => {
      try {
        console.log('TrendChart: 手动刷新趋势数据', config);
        setLoading(true);

        // 构建查询参数
        const queryParams = {
          dataSource: {
            type: 'mysql',
            host: 'localhost',
            port: 3306,
            database: config.dbName,
            username: 'root',
            password: ''
          },
          sql: `SELECT ${config.fields.join(', ')} FROM ${config.tableName} ORDER BY timestamp DESC LIMIT 100`,
          parameters: {}
        };

        // 使用API管理系统获取数据
        try {
          const response = await apiManager.call('customQuery', queryParams);
          if (response && Array.isArray(response)) {
            const chartData = processData(response);
            setData(chartData);
            dataRef.current = chartData;
            saveDataToStorage(chartData);
            setError(null);
          } else {
            throw new Error('响应数据为空或格式不正确');
          }
        } catch (apiError) {
          console.warn('手动刷新: 使用API管理系统获取数据失败，尝试直接调用API:', apiError.message);

          // 如果API管理系统调用失败，尝试直接调用API
          const directQueryParams = {
            dbName: config.dbName,
            tableName: config.tableName,
            fields: config.fields.join(','),
            limit: 100,
            orderBy: 'timestamp',
            orderDir: 'DESC'
          };

          const response = await api.post('https://nodered.jzz77.cn:9003/custom-query', directQueryParams, {
            timeout: 10000,
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            }
          });

          if (response.data && Array.isArray(response.data)) {
            const chartData = processData(response.data);
            setData(chartData);
            dataRef.current = chartData;
            saveDataToStorage(chartData);
            setError(null);
          } else {
            throw new Error('直接API调用返回的数据为空或格式不正确');
          }
        }
      } catch (error) {
        console.error('手动刷新数据失败:', error);
        setError('刷新数据失败: ' + (error.message || '未知错误'));
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    timerRef.current = setInterval(fetchData, config.interval);
  };

  // 图表配置
  const chartConfig = {
    data,
    xField: 'time',
    yField: 'value',
    seriesField: 'category',
    yAxis: {
      title: {
        text: '数值',
      },
    },
    xAxis: {
      title: {
        text: '时间',
      },
    },
    legend: {
      position: 'top',
    },
    smooth: true,
    animation: {
      appear: {
        animation: 'path-in',
        duration: 1000,
      },
    },
    tooltip: {
      showMarkers: false,
    },
    theme: {
      colors10: ['#2E7D32', '#1890ff', '#fa8c16', '#722ed1', '#13c2c2', '#eb2f96', '#faad14', '#52c41a', '#f5222d', '#2f54eb'],
    },
  };

  if (loading && data.length === 0) {
    return (
      <Card sx={{ mb: 3, minHeight: '400px' }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <LineChartOutlined style={{ fontSize: 24, marginRight: 8, color: '#2E7D32' }} />
            <Typography variant="h6">{config.title || '实时趋势'}</Typography>
          </Box>
          <Box>
            <Button
              startIcon={<ReloadOutlined />}
              onClick={handleRefresh}
              sx={{ mr: 1 }}
            >
              刷新
            </Button>
            <Button
              startIcon={<SettingOutlined />}
              onClick={handleOpenDialog}
            >
              设置
            </Button>
          </Box>
        </Box>

        {error && (
          <Box sx={{ p: 2, bgcolor: '#ffebee', borderRadius: 1, color: '#d32f2f', mb: 2 }}>
            <Typography variant="body1">{error}</Typography>
          </Box>
        )}

        <Box sx={{ height: 400 }}>
          <Line {...chartConfig} />
        </Box>
      </CardContent>

      {/* 设置对话框 */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>趋势图设置</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              label="标题"
              value={tempConfig.title || ''}
              onChange={(e) => setTempConfig({ ...tempConfig, title: e.target.value })}
              fullWidth
              margin="normal"
            />

            <TextField
              label="数据库名称"
              value={tempConfig.dbName || ''}
              onChange={(e) => setTempConfig({ ...tempConfig, dbName: e.target.value })}
              fullWidth
              margin="normal"
            />

            <TextField
              label="表名"
              value={tempConfig.tableName || ''}
              onChange={(e) => setTempConfig({ ...tempConfig, tableName: e.target.value })}
              fullWidth
              margin="normal"
            />

            <TextField
              label="字段"
              value={tempConfig.fields ? tempConfig.fields.join(', ') : ''}
              onChange={(e) => setTempConfig({ ...tempConfig, fields: e.target.value.split(',').map(f => f.trim()) })}
              fullWidth
              margin="normal"
              helperText="多个字段用逗号分隔，必须包含timestamp字段"
            />

            <FormControl fullWidth margin="normal">
              <InputLabel>刷新间隔</InputLabel>
              <Select
                value={tempConfig.interval || 60000}
                onChange={(e) => setTempConfig({ ...tempConfig, interval: e.target.value })}
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
              label="最大数据点数量"
              type="number"
              value={tempConfig.maxDataPoints || 1000}
              onChange={(e) => setTempConfig({ ...tempConfig, maxDataPoints: parseInt(e.target.value) })}
              fullWidth
              margin="normal"
              helperText="限制显示的数据点数量，避免图表过于复杂"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>取消</Button>
          <Button onClick={handleSaveConfig} variant="contained" color="primary">保存</Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default TrendChart;
