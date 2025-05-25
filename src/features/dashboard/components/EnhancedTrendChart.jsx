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
  FormControlLabel,
  Paper,
  Divider,
  ToggleButtonGroup,
  ToggleButton,
  Button
} from '@mui/material';
import {
  ReloadOutlined,
  SettingOutlined,
  LineChartOutlined,
  RadarChartOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined
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
  MarkPointComponent,
  RadarComponent
} from 'echarts/components';
import { LineChart, RadarChart } from 'echarts/charts';
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
  RadarComponent,
  LineChart,
  RadarChart,
  CanvasRenderer,
  UniversalTransition
]);

// 定义主题色
const THEME_COLOR = '#2E7D32';

/**
 * 趋势图组件
 * 显示生产数据趋势
 */
const EnhancedTrendChart = ({ refreshMode = 'realtime', refreshInterval = 10 }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState([]);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });
  const [zoomEnabled, setZoomEnabled] = useState(false);
  const [chartType, setChartType] = useState('line'); // 默认为折线图
  const [selectedIndicator, setSelectedIndicator] = useState(null); // 当前选中的指标
  const [fullscreen, setFullscreen] = useState(false); // 全屏状态
  const chartRef = useRef(null);
  const chartInstance = useRef(null);
  const containerRef = useRef(null); // 用于全屏

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

  // 格式化数据值显示
  const formatValue = (value) => {
    if (value === undefined || value === null) return '-';
    
    if (typeof value !== 'number') {
      return value.toString();
    }
    
    if (value > 1000000) {
      return (value / 1000000).toFixed(2) + 'M';
    } else if (value > 1000) {
      return (value / 1000).toFixed(1) + 'k';
    } else if (value < 0.01) {
      return value.toExponential(1);
    } else if (value > 100) {
      return Math.round(value);
    } else {
      return value.toFixed(2);
    }
  };

  // 准备雷达图数据
  const prepareRadarChartData = () => {
    if (!Array.isArray(data) || data.length === 0) {
      return { indicator: [], series: [] };
    }

    // 获取所有时间点，作为雷达图的维度
    const allTimes = new Set();
    data.forEach(series => {
      series.data.forEach(item => {
        if (Array.isArray(item) && item.length > 0) {
          allTimes.add(item[0]);
        }
      });
    });

    // 按时间排序
    const times = Array.from(allTimes).sort();
    
    // 如果时间点太多，取最近的几个时间点
    const recentTimes = times.slice(-8); // 最多取8个时间点，避免雷达图太复杂
    
    // 过滤选中的指标或者显示前5个指标
    let filteredSeries;
    if (selectedIndicator) {
      filteredSeries = data.filter(s => s.name === selectedIndicator);
    } else {
      filteredSeries = data.slice(0, 5); // 最多显示5个指标
    }

    // 设置雷达图的指标（时间点）
    const indicator = recentTimes.map(time => {
      const date = new Date(time);
      return {
        name: date.toLocaleString('zh-CN', {
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        }),
        max: null // 将在后面设置
      };
    });

    // 准备雷达图数据
    const radarData = filteredSeries.map(series => {
      // 创建时间到值的映射
      const timeValueMap = {};
      series.data.forEach(item => {
        if (Array.isArray(item) && item.length > 1) {
          timeValueMap[item[0]] = item[1];
        }
      });

      // 获取该系列在每个时间点的值
      const values = recentTimes.map(time => {
        return timeValueMap[time] !== undefined ? timeValueMap[time] : 0;
      });

      return {
        name: series.name,
        value: values,
        symbolSize: 5,
        lineStyle: {
          width: 2
        },
        areaStyle: {
          opacity: 0.3
        }
      };
    });

    // 计算每个时间点的最大值
    const maxValues = {};
    filteredSeries.forEach(series => {
      series.data.forEach(item => {
        if (Array.isArray(item) && item.length > 1 && recentTimes.includes(item[0])) {
          const time = item[0];
          const value = item[1];
          if (value !== undefined && value !== null) {
            maxValues[time] = Math.max(maxValues[time] || 0, value * 1.2); // 增加20%余量
          }
        }
      });
    });

    // 设置每个指标的最大值
    indicator.forEach((ind, index) => {
      ind.max = maxValues[recentTimes[index]] || 100;
    });

    return {
      indicator,
      series: [{
        type: 'radar',
        data: radarData
      }]
    };
  };

  // 初始化图表
  const initChart = () => {
    if (chartRef.current && data.length > 0) {
      if (chartInstance.current) {
        chartInstance.current.dispose();
      }
      
      const chart = echarts.init(chartRef.current);
      let option;
      
      if (chartType === 'line') {
        // 折线图配置
        option = {
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
                result += `${param.seriesName}: ${formatValue(param.value[1])}<br/>`;
              });
              return result;
            }
          },
          legend: {
            data: data.map(item => item.name),
            top: 0,
            left: 'center',
            type: 'scroll',
            pageButtonPosition: 'end',
            selector: ['all', 'inverse'],
            selectorLabel: {
              all: '全选',
              inverse: '反选'
            },
            textStyle: {
              fontSize: 12
            },
            width: '80%'
          },
          toolbox: {
            feature: {
              saveAsImage: {},
              dataZoom: {
                yAxisIndex: 'none'
              },
              restore: {}
            },
            right: 20,
            top: 25
          },
          grid: {
            top: '80px',
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
              end: 100,
              show: zoomEnabled
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
              rotate: 30
            }
          },
          yAxis: {
            type: 'value',
            axisLabel: {
              formatter: function(value) {
                return formatValue(value);
              }
            }
          },
          series: data.map(series => ({
            ...series,
            itemStyle: {
              opacity: selectedIndicator ? (selectedIndicator === series.name ? 1 : 0.25) : 1
            },
            lineStyle: selectedIndicator === series.name ? { width: 4 } : undefined
          }))
        };
      } else {
        // 雷达图配置
        const { indicator, series } = prepareRadarChartData();
        
        option = {
          tooltip: {
            trigger: 'item'
          },
          legend: {
            data: series[0].data.map(item => item.name),
            top: 0,
            left: 'center',
            type: 'scroll',
            textStyle: {
              fontSize: 12
            },
            width: '80%'
          },
          radar: {
            indicator: indicator,
            radius: '60%',
            center: ['50%', '55%'],
            splitNumber: 5,
            name: {
              formatter: '{value}',
              textStyle: {
                color: '#333'
              }
            },
            splitArea: {
              areaStyle: {
                color: ['rgba(114, 172, 209, 0.1)', 'rgba(114, 172, 209, 0.2)'],
                shadowColor: 'rgba(0, 0, 0, 0.2)',
                shadowBlur: 10
              }
            },
            axisName: {
              color: '#333',
              fontSize: 12
            }
          },
          series: series
        };
      }

      // 安全地设置选项
      try {
        chart.setOption(option);
        chartInstance.current = chart;
        
        // 添加事件处理
        chart.on('click', function(params) {
          if (params.componentType === 'series' && chartType === 'line') {
            const newSelected = selectedIndicator === params.seriesName ? null : params.seriesName;
            setSelectedIndicator(newSelected);
            
            if (newSelected) {
              setNotification({
                open: true,
                message: `已选中指标：${params.seriesName}`,
                severity: 'info'
              });
            }
          }
        });
      } catch (error) {
        console.error('[EnhancedTrendChart] 图表渲染错误:', error);
        setError('图表渲染失败: ' + error.message);
      }
    }
  };

  // 处理图表类型变更
  const handleChartTypeChange = (event, newType) => {
    if (newType) {
      setChartType(newType);
    }
  };

  // 监听数据变化，更新图表
  useEffect(() => {
    if (data.length > 0) {
      initChart();
    }
  }, [data, zoomEnabled, chartType, selectedIndicator]);

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
  };

  // 切换全屏显示
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    
    if (!document.fullscreenElement) {
      // 进入全屏
      containerRef.current.requestFullscreen().catch(err => {
        console.error('无法进入全屏模式:', err);
        setNotification({
          open: true,
          message: `无法进入全屏模式: ${err.message}`,
          severity: 'error'
        });
      });
    } else {
      // 退出全屏
      document.exitFullscreen().catch(err => {
        console.error('无法退出全屏模式:', err);
        setNotification({
          open: true,
          message: `无法退出全屏模式: ${err.message}`,
          severity: 'error'
        });
      });
    }
  };

  // 监听全屏状态变化
  useEffect(() => {
    const handleFullscreenChange = () => {
      setFullscreen(!!document.fullscreenElement);
      
      // 全屏状态变化后，需要调整图表大小
      setTimeout(() => {
        if (chartInstance.current) {
          chartInstance.current.resize && chartInstance.current.resize();
        }
      }, 300);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // 监听全屏状态变化重新调整图表
  useEffect(() => {
    if (chartInstance.current) {
      setTimeout(() => {
        chartInstance.current.resize && chartInstance.current.resize();
      }, 300);
    }
  }, [fullscreen]);

  return (
    <Paper 
      elevation={3}
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        position: 'relative',
        ...(fullscreen ? {
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 9999,
          padding: '20px',
          backgroundColor: '#fff'
        } : {})
      }}
      ref={containerRef}
    >
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        p: 1, 
        borderBottom: '1px solid #eee'
      }}>
        <Typography variant="h6" component="div" sx={{ display: 'flex', alignItems: 'center' }}>
          <LineChartOutlined style={{ marginRight: 8, color: THEME_COLOR }} />
          生产趋势分析
          {loading && <CircularProgress size={20} sx={{ ml: 1 }} />}
        </Typography>
        <Box>
          <Tooltip title="刷新数据">
            <IconButton size="small" onClick={handleRefresh} disabled={loading}>
              <ReloadOutlined />
            </IconButton>
          </Tooltip>
          <Tooltip title={zoomEnabled ? "禁用缩放" : "启用缩放"}>
            <FormControlLabel
              control={
                <Switch
                  checked={zoomEnabled}
                  onChange={handleZoomToggle}
                  size="small"
                  color="primary"
                />
              }
              label="缩放"
              sx={{ mx: 1, '& .MuiFormControlLabel-label': { fontSize: '0.8rem' } }}
            />
          </Tooltip>
          <ToggleButtonGroup
            value={chartType}
            exclusive
            onChange={handleChartTypeChange}
            size="small"
            sx={{ mx: 1 }}
          >
            <ToggleButton value="line">
              <Tooltip title="折线图">
                <LineChartOutlined />
              </Tooltip>
            </ToggleButton>
            <ToggleButton value="radar">
              <Tooltip title="雷达图">
                <RadarChartOutlined />
              </Tooltip>
            </ToggleButton>
          </ToggleButtonGroup>
          <Tooltip title={fullscreen ? "退出全屏" : "全屏显示"}>
            <IconButton size="small" onClick={toggleFullscreen}>
              {fullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* 全屏时的侧边控制面板 */}
      {fullscreen && (
        <Box sx={{
          position: 'absolute',
          top: 70,
          left: 20,
          zIndex: 1000,
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          padding: '10px',
          borderRadius: '4px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
          maxWidth: '200px'
        }}>
          <Typography variant="subtitle2" gutterBottom>图表控制</Typography>
          <Divider sx={{ my: 1 }} />
          
          <Typography variant="body2" gutterBottom>图表类型</Typography>
          <ToggleButtonGroup
            value={chartType}
            exclusive
            onChange={handleChartTypeChange}
            size="small"
            sx={{ mb: 2, display: 'flex' }}
          >
            <ToggleButton value="line" sx={{ flex: 1 }}>
              <LineChartOutlined /> 折线图
            </ToggleButton>
            <ToggleButton value="radar" sx={{ flex: 1 }}>
              <RadarChartOutlined /> 雷达图
            </ToggleButton>
          </ToggleButtonGroup>
          
          <FormControlLabel
            control={
              <Switch
                checked={zoomEnabled}
                onChange={handleZoomToggle}
                size="small"
                color="primary"
              />
            }
            label="启用缩放"
            sx={{ mb: 2, display: 'block' }}
          />
          
          <Button 
            variant="outlined" 
            size="small" 
            startIcon={<ReloadOutlined />} 
            onClick={handleRefresh}
            disabled={loading}
            sx={{ mr: 1, mb: 1 }}
          >
            刷新
          </Button>
          
          <Button 
            variant="outlined" 
            size="small" 
            startIcon={<FullscreenExitOutlined />} 
            onClick={toggleFullscreen}
            sx={{ mb: 1 }}
          >
            退出全屏
          </Button>
        </Box>
      )}

      <Box 
        sx={{ 
          flexGrow: 1, 
          p: 1, 
          position: 'relative',
          height: fullscreen ? 'calc(100vh - 80px)' : '400px' 
        }}
      >
        {error && (
          <Alert severity="error" sx={{ mb: 1 }}>
            {error}
          </Alert>
        )}
        <div 
          ref={chartRef} 
          style={{ 
            width: '100%', 
            height: '100%' 
          }} 
        />
      </Box>

      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={() => setNotification(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setNotification(prev => ({ ...prev, open: false }))} 
          severity={notification.severity}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Paper>
  );
};

export default EnhancedTrendChart;
