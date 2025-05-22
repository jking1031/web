import React, { useState, useEffect, useRef } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  IconButton,
  Tooltip,
  Alert,
  Snackbar,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  ReloadOutlined,
  SettingOutlined,
  LineChartOutlined
} from '@ant-design/icons';
import * as echarts from 'echarts/core';
import {
  TitleComponent,
  ToolboxComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  DataZoomComponent,
  MarkLineComponent,
  MarkPointComponent
} from 'echarts/components';
import { LineChart } from 'echarts/charts';
import { UniversalTransition } from 'echarts/features';
import { CanvasRenderer } from 'echarts/renderers';
import moment from 'moment';
import apiManager from '../../../services/api/core/apiManager';
import styles from './EnhancedTrendChart.module.scss';

// 注册 ECharts 组件
echarts.use([
  TitleComponent,
  ToolboxComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  DataZoomComponent,
  MarkLineComponent,
  MarkPointComponent,
  LineChart,
  CanvasRenderer,
  UniversalTransition
]);

/**
 * 趋势图组件
 * 显示生产数据趋势
 */
const EnhancedTrendChart = ({ refreshMode = 'realtime', refreshInterval = 10 }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState([]);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });
  const [zoomEnabled, setZoomEnabled] = useState(true);
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  // 获取趋势数据
  const fetchTrendData = async () => {
    try {
      setLoading(true);
      setError(null);

      // 构建请求参数
      const params = {
        startTime: moment().subtract(24, 'hours').format('YYYY-MM-DD HH:mm:ss'),
        endTime: moment().format('YYYY-MM-DD HH:mm:ss'),
        interval: '1h',
        fields: ['flow_in', 'flow_out', 'pressure', 'temperature']
      };

      console.log('[EnhancedTrendChart] 请求参数:', JSON.stringify(params, null, 2));

      // 使用API管理系统获取数据
      const result = await apiManager.call('getTrendData', params);

      // 打印API返回的原始数据（前5条）
      console.log('[EnhancedTrendChart] API返回的原始数据(前5条):', 
        Array.isArray(result.data) ? result.data.slice(0, 5) : result.data
      );

      console.log('[EnhancedTrendChart] API返回数据格式:', {
        success: result.success,
        dataFormat: Array.isArray(result.data) ? '数组格式' : '非数组格式',
        dataStructure: Array.isArray(result.data) && result.data.length > 0 ? 
          `每个数据点包含字段: ${Object.keys(result.data[0]).join(', ')}` : '无数据',
        sampleData: Array.isArray(result.data) && result.data.length > 0 ? 
          `示例数据点: ${JSON.stringify(result.data[0], null, 2)}` : '无数据',
        totalDataPoints: Array.isArray(result.data) ? result.data.length : 0
      });

      if (result.success) {
        // 处理数据
        const processedData = processTrendData(result.data);
        
        // 打印处理后的数据（每个系列的前3条）
        console.log('[EnhancedTrendChart] 处理后的数据(每个系列前3条):', 
          processedData.map(series => ({
            name: series.name,
            data: series.data.slice(0, 3)
          }))
        );

        console.log('[EnhancedTrendChart] 处理后的数据格式:', {
          seriesFormat: processedData.map(series => ({
            name: series.name,
            dataFormat: `[时间戳, 数值] 格式，共 ${series.data.length} 个数据点`,
            sampleData: series.data.slice(0, 2).map(d => ({
              time: d.time,
              value: d.value
            }))
          }))
        });
        setData(processedData);
      } else {
        throw new Error(result.error || '获取数据失败');
      }
    } catch (error) {
      console.error('[EnhancedTrendChart] 获取趋势数据失败:', error);
      setError(error.message);
      setNotification({
        open: true,
        message: `获取数据失败: ${error.message}`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // 处理趋势数据
  const processTrendData = (rawData) => {
    if (!Array.isArray(rawData)) {
      console.error('[EnhancedTrendChart] 原始数据格式错误:', rawData);
      return [];
    }

    // API返回的数据已经是正确的格式，直接使用
    return rawData.map(series => ({
      name: series.name,
      type: 'line',
      emphasis: {
        focus: 'series'
      },
      data: series.data.map(d => [d.time, d.value]), // 保留时间数据
      markPoint: {
        data: [
          { type: 'max', name: '最大值' },
          { type: 'min', name: '最小值' }
        ]
      },
      markLine: {
        data: [
          { type: 'average', name: '平均值' }
        ]
      }
    }));
  };

  // 获取字段显示名称
  const getFieldName = (field) => {
    const fieldNames = {
      flow_in: '进水流量',
      flow_out: '出水流量',
      pressure: '压力',
      temperature: '温度'
    };
    return fieldNames[field] || field;
  };

  // 初始化图表
  const initChart = () => {
    if (chartRef.current && data.length > 0) {
      const chart = echarts.init(chartRef.current);
      
      const option = {
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'cross',
            label: {
              backgroundColor: '#6a7985'
            }
          },
          formatter: function(params) {
            const time = new Date(params[0].value[0]);
            const formattedTime = time.toLocaleString('zh-CN', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit'
            });
            let result = `${formattedTime}<br/>`;
            params.forEach(param => {
              result += `${param.seriesName}: ${param.value[1]}<br/>`;
            });
            return result;
          }
        },
        legend: {
          data: data.map(item => item.name),
          top: 0,
          padding: [0, 0, 0, 0]
        },
        toolbox: {
          feature: {
            saveAsImage: {},
            dataZoom: {
              yAxisIndex: 'none'
            },
            restore: {}
          },
          top: 0,
          right: 0
        },
        grid: {
          top: '40px',
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true
        },
        dataZoom: [
          {
            type: 'inside',
            start: 0,
            end: 100,
            zoomLock: !zoomEnabled
          },
          {
            start: 0,
            end: 100
          }
        ],
        xAxis: {
          type: 'time',
          boundaryGap: false,
          axisLabel: {
            formatter: function(value) {
              const date = new Date(value);
              return date.toLocaleString('zh-CN', {
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
              });
            },
            rotate: 45
          }
        },
        yAxis: {
          type: 'value',
          axisLabel: {
            formatter: '{value}'
          }
        },
        series: data
      };

      chart.setOption(option);
      chartInstance.current = chart;
    }
  };

  // 监听数据变化，更新图表
  useEffect(() => {
    if (data.length > 0) {
      initChart();
    }
  }, [data]);

  // 监听窗口大小变化
  useEffect(() => {
    const handleResize = () => {
      chartInstance.current?.resize();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chartInstance.current?.dispose();
    };
  }, []);

  // 初始加载数据
  useEffect(() => {
    fetchTrendData();

    // 根据刷新模式设置定时器
    const interval = refreshMode === 'realtime' ? 300000 : refreshInterval * 60000; // 实时模式5分钟，周期模式使用用户设置的间隔
    const refreshTimer = setInterval(() => {
      fetchTrendData();
    }, interval);

    // 组件卸载时清除定时器
    return () => {
      clearInterval(refreshTimer);
    };
  }, [refreshMode, refreshInterval]); // 添加refreshMode和refreshInterval作为依赖项

  // 刷新数据
  const handleRefresh = () => {
    fetchTrendData();
  };

  // 处理缩放开关变化
  const handleZoomToggle = (event) => {
    setZoomEnabled(event.target.checked);
    if (chartInstance.current) {
      chartInstance.current.setOption({
        dataZoom: [
          {
            type: 'inside',
            zoomLock: !event.target.checked
          }
        ]
      });
    }
  };

      return (
    <Box className={styles.enhancedTrendChart}>
      <Box className={styles.header}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <LineChartOutlined style={{ fontSize: 20, marginRight: 8, color: '#2E7D32' }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
            生产数据趋势
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FormControlLabel
            control={
              <Switch
                checked={zoomEnabled}
                onChange={handleZoomToggle}
                size="small"
              />
            }
            label="启用缩放"
          />
          <Tooltip title="刷新">
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

        {loading ? (
        <Box className={styles.loading}>
            <CircularProgress />
          </Box>
      ) : error ? (
        <Alert severity="error" className={styles.error}>
          {error}
        </Alert>
      ) : (
        <Card className={styles.trendChartCard}>
          <CardContent>
            <div
              ref={chartRef}
              style={{
                width: '100%',
                height: '400px',
                minHeight: '300px'
              }}
            />
          </CardContent>
        </Card>
      )}

        <Snackbar
          open={notification.open}
          autoHideDuration={6000}
          onClose={() => setNotification({ ...notification, open: false })}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert
            onClose={() => setNotification({ ...notification, open: false })}
            severity={notification.severity}
            sx={{ width: '100%' }}
          >
            {notification.message}
          </Alert>
        </Snackbar>
          </Box>
  );
};

export default EnhancedTrendChart;
