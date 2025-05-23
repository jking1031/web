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
  ToggleButtonGroup,
  ToggleButton,
  Paper,
  Divider
} from '@mui/material';
import {
  ReloadOutlined,
  LineChartOutlined,
  RadarChartOutlined
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
  VisualMapComponent,
  RadarComponent
} from 'echarts/components';
import { LineChart, RadarChart } from 'echarts/charts';
import { UniversalTransition } from 'echarts/features';
import { CanvasRenderer } from 'echarts/renderers';
import moment from 'moment';
import apiManager from '../../../services/api/core/apiManager';
import styles from './EnhancedTrendChart.module.scss'; // 统一使用同一个样式文件

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
  VisualMapComponent,
  RadarComponent,
  LineChart,
  RadarChart,
  CanvasRenderer,
  UniversalTransition
]);

// 定义主题色，与EnhancedTrendChart保持一致
const THEME_COLOR = '#2E7D32';

/**
 * 多视图趋势图组件
 * 支持折线图和雷达图多种视图
 */
const RealtimeTrendChart = ({ refreshMode = 'realtime', refreshInterval = 10 }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState([]);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });
  const [zoomEnabled, setZoomEnabled] = useState(false); // 默认关闭缩放功能
  const [chartType, setChartType] = useState('line'); // 默认显示折线图
  const [selectedIndicator, setSelectedIndicator] = useState(null); // 当前选中的指标
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  // 检查并注册API
  const checkAndRegisterApi = async () => {
    try {
      // 检查API是否已注册
      const api = apiManager.registry.get('getRealtimeTrendData');
      
      if (!api) {
        console.log('[RealtimeTrendChart] 注册getRealtimeTrendData API...');
        
        // 注册API
        await apiManager.registry.register('getRealtimeTrendData', {
          name: '获取实时趋势数据',
          url: 'https://nodered.jzz77.cn:9003/api/getRealtimeTrendData',
          method: 'GET',
          category: 'data',
          status: 'enabled',
          description: '获取实时的趋势数据',
          timeout: 10000,
          retries: 1,
          cacheTime: 30000, // 30秒缓存
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        console.log('[RealtimeTrendChart] API注册成功');
      }
      
      return true;
    } catch (error) {
      console.error('[RealtimeTrendChart] API注册失败:', error);
      setError('API初始化失败，请刷新页面重试');
      return false;
    }
  };

  // 获取趋势数据
  const fetchTrendData = async () => {
    try {
      setLoading(true);
      setError(null);

      // 确保API已注册
      await checkAndRegisterApi();

      // 构建请求参数
      const params = {
        startTime: moment().subtract(7, 'days').format('YYYY-MM-DD HH:mm:ss'),
        endTime: moment().format('YYYY-MM-DD HH:mm:ss')
      };

      console.log('[RealtimeTrendChart] 请求参数:', JSON.stringify(params, null, 2));

      // 调用API
      const result = await apiManager.call('getRealtimeTrendData', params);

      console.log('[RealtimeTrendChart] API返回的原始数据:', result);

      if (result.success && Array.isArray(result.data)) {
        // 处理数据，转换为新格式
        const formattedData = transformDataToNewFormat(result.data);
        setData(formattedData);
      } else {
        // 使用示例数据进行开发测试
        const sampleData = [
          {"name":"进水流量 (m³/d)","data":[{"time":"2025-05-16 00:00:00","value":7069},{"time":"2025-05-17 00:00:00","value":7286},{"time":"2025-05-18 00:00:00","value":6889},{"time":"2025-05-19 00:00:00","value":7125},{"time":"2025-05-20 00:00:00","value":7192},{"time":"2025-05-21 00:00:00","value":7266},{"time":"2025-05-22 00:00:00","value":7212}]},
          {"name":"出水流量 (m³/d)","data":[{"time":"2025-05-16 00:00:00","value":6602},{"time":"2025-05-17 00:00:00","value":6928},{"time":"2025-05-18 00:00:00","value":6511},{"time":"2025-05-19 00:00:00","value":6690},{"time":"2025-05-20 00:00:00","value":6692},{"time":"2025-05-21 00:00:00","value":6956},{"time":"2025-05-22 00:00:00","value":6826}]},
          {"name":"进水COD平均值","data":[{"time":"2025-05-16 00:00:00","value":241},{"time":"2025-05-17 00:00:00","value":156},{"time":"2025-05-18 00:00:00","value":127},{"time":"2025-05-19 00:00:00","value":135},{"time":"2025-05-20 00:00:00","value":151},{"time":"2025-05-21 00:00:00","value":193},{"time":"2025-05-22 00:00:00","value":181.15}]},
          {"name":"进水COD最大值","data":[{"time":"2025-05-16 00:00:00","value":563},{"time":"2025-05-17 00:00:00","value":170},{"time":"2025-05-18 00:00:00","value":147},{"time":"2025-05-19 00:00:00","value":191},{"time":"2025-05-20 00:00:00","value":203},{"time":"2025-05-21 00:00:00","value":300},{"time":"2025-05-22 00:00:00","value":337}]},
          {"name":"进水氨氮平均值","data":[{"time":"2025-05-16 00:00:00","value":29.2},{"time":"2025-05-17 00:00:00","value":34.69},{"time":"2025-05-18 00:00:00","value":27.73},{"time":"2025-05-19 00:00:00","value":24.16},{"time":"2025-05-20 00:00:00","value":27.75},{"time":"2025-05-21 00:00:00","value":31.72},{"time":"2025-05-22 00:00:00","value":27.13}]},
          {"name":"出水COD平均值","data":[{"time":"2025-05-16 00:00:00","value":6.78},{"time":"2025-05-17 00:00:00","value":7.69},{"time":"2025-05-18 00:00:00","value":9.93},{"time":"2025-05-19 00:00:00","value":8.56},{"time":"2025-05-20 00:00:00","value":8.18},{"time":"2025-05-21 00:00:00","value":7.45},{"time":"2025-05-22 00:00:00","value":9.22}]},
          {"name":"出水氨氮平均值","data":[{"time":"2025-05-16 00:00:00","value":0.028},{"time":"2025-05-17 00:00:00","value":0.024},{"time":"2025-05-18 00:00:00","value":0.02},{"time":"2025-05-19 00:00:00","value":0.022},{"time":"2025-05-20 00:00:00","value":0.03},{"time":"2025-05-21 00:00:00","value":0.02},{"time":"2025-05-22 00:00:00","value":0.02}]},
          {"name":"出水总磷平均值","data":[{"time":"2025-05-16 00:00:00","value":0.105},{"time":"2025-05-17 00:00:00","value":0.098},{"time":"2025-05-18 00:00:00","value":0.098},{"time":"2025-05-19 00:00:00","value":0.091},{"time":"2025-05-20 00:00:00","value":0.097},{"time":"2025-05-21 00:00:00","value":0.188},{"time":"2025-05-22 00:00:00","value":0.151}]},
          {"name":"出水总氮平均值","data":[{"time":"2025-05-16 00:00:00","value":6.66},{"time":"2025-05-17 00:00:00","value":5.364},{"time":"2025-05-18 00:00:00","value":7.69},{"time":"2025-05-19 00:00:00","value":8.536},{"time":"2025-05-20 00:00:00","value":6.45},{"time":"2025-05-21 00:00:00","value":8.094},{"time":"2025-05-22 00:00:00","value":7.81}]},
          {"name":"碳源投加量 (L/d)","data":[{"time":"2025-05-16 00:00:00","value":906.2},{"time":"2025-05-17 00:00:00","value":436},{"time":"2025-05-18 00:00:00","value":2034},{"time":"2025-05-19 00:00:00","value":2073},{"time":"2025-05-20 00:00:00","value":2002},{"time":"2025-05-21 00:00:00","value":1841},{"time":"2025-05-22 00:00:00","value":1842}]},
          {"name":"除磷剂投加量 (L/d)","data":[{"time":"2025-05-16 00:00:00","value":828},{"time":"2025-05-17 00:00:00","value":691},{"time":"2025-05-18 00:00:00","value":432},{"time":"2025-05-19 00:00:00","value":460},{"time":"2025-05-20 00:00:00","value":605},{"time":"2025-05-21 00:00:00","value":954},{"time":"2025-05-22 00:00:00","value":979}]},
          {"name":"消毒剂投加量 (L/d)","data":[{"time":"2025-05-16 00:00:00","value":72},{"time":"2025-05-17 00:00:00","value":54},{"time":"2025-05-18 00:00:00","value":60},{"time":"2025-05-19 00:00:00","value":60},{"time":"2025-05-20 00:00:00","value":54},{"time":"2025-05-21 00:00:00","value":54},{"time":"2025-05-22 00:00:00","value":54}]},
          {"name":"污泥产量 (吨/d)","data":[{"time":"2025-05-16 00:00:00","value":6.81},{"time":"2025-05-17 00:00:00","value":6.39},{"time":"2025-05-18 00:00:00","value":6.32},{"time":"2025-05-19 00:00:00","value":8.93},{"time":"2025-05-20 00:00:00","value":0},{"time":"2025-05-21 00:00:00","value":9.19},{"time":"2025-05-22 00:00:00","value":8.12}]}
        ];
        setData(sampleData);
      }
    } catch (error) {
      console.error('[RealtimeTrendChart] 获取实时趋势数据失败:', error);
      setError(error.message);
      setNotification({
        open: true,
        message: `获取实时趋势数据失败: ${error.message}`,
        severity: 'error'
      });

      // 使用示例数据进行失败后展示
      const sampleData = [
        {"name":"进水流量 (m³/d)","data":[{"time":"2025-05-16 00:00:00","value":7069},{"time":"2025-05-17 00:00:00","value":7286}]},
        {"name":"出水流量 (m³/d)","data":[{"time":"2025-05-16 00:00:00","value":6602},{"time":"2025-05-17 00:00:00","value":6928}]}
      ];
      setData(sampleData);
    } finally {
      setLoading(false);
    }
  };

  // 将旧数据格式转换为新格式
  const transformDataToNewFormat = (oldData) => {
    if (!Array.isArray(oldData) || oldData.length === 0) {
      return [];
    }

    // 获取所有指标
    const indicatorKeys = Object.keys(oldData[0]).filter(key => key !== 'time');
    
    // 为每个指标创建数据系列
    return indicatorKeys.map(indicatorKey => {
      return {
        name: indicatorKey,
        data: oldData.map(item => ({
          time: item.time,
          value: item[indicatorKey]
        }))
      };
    });
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

  // 准备折线图数据
  const prepareLineChartData = (seriesData) => {
    if (!Array.isArray(seriesData) || seriesData.length === 0) {
      return { xAxis: [], series: [] };
    }

    // 提取日期作为X轴
    const allDates = new Set();
    seriesData.forEach(series => {
      series.data.forEach(item => {
        if (item.time) {
          allDates.add(item.time.split(' ')[0]); // 只取日期部分
        }
      });
    });

    // 按日期排序
    const xAxis = Array.from(allDates).sort();

    // 生成每个系列的数据
    const series = seriesData.map(s => {
      // 创建日期到值的映射
      const dateValueMap = {};
      s.data.forEach(item => {
        if (item.time) {
          const date = item.time.split(' ')[0];
          dateValueMap[date] = item.value;
        }
      });

      // 为每个日期找到对应的值
      const values = xAxis.map(date => {
        return dateValueMap[date] !== undefined ? dateValueMap[date] : null;
      });

      return {
        name: s.name,
        type: 'line',
        data: values,
        // 只有当前选中的指标或未选中任何指标时才高亮显示
        emphasis: {
          focus: 'series',
          itemStyle: {
            shadowBlur: 10
          }
        },
        // 当有选中指标时，非选中指标降低透明度
        itemStyle: {
          opacity: selectedIndicator ? (selectedIndicator === s.name ? 1 : 0.25) : 1
        },
        // 为选中的指标设置粗线
        lineStyle: selectedIndicator === s.name ? { width: 4 } : undefined,
        // 设置符号大小
        symbolSize: selectedIndicator === s.name ? 8 : 6,
        // 添加标记点（与EnhancedTrendChart保持一致）
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
      };
    });

    // 使用统一的颜色方案
    const colorPalette = [
      '#5470c6', '#91cc75', '#fac858', '#ee6666', 
      '#73c0de', '#3ba272', '#fc8452', '#9a60b4',
      '#ea7ccc', '#60c0dd', '#4caf50', '#ff9800'
    ];

    series.forEach((s, index) => {
      const colorIndex = index % colorPalette.length;
      s.itemStyle = { ...s.itemStyle, color: colorPalette[colorIndex] };
    });

    return { xAxis, series };
  };

  // 准备雷达图数据
  const prepareRadarChartData = (seriesData) => {
    if (!Array.isArray(seriesData) || seriesData.length === 0) {
      return { indicator: [], series: [] };
    }

    // 获取所有日期，并排序
    const allDates = new Set();
    seriesData.forEach(series => {
      series.data.forEach(item => {
        if (item.time) {
          allDates.add(item.time.split(' ')[0]); // 只取日期部分
        }
      });
    });
    const dates = Array.from(allDates).sort();

    // 过滤选中的指标或者显示前5个指标
    let filteredSeries;
    if (selectedIndicator) {
      filteredSeries = seriesData.filter(s => s.name === selectedIndicator);
    } else {
      // 如果系列太多，默认只显示前5个
      filteredSeries = seriesData.slice(0, 5);
    }

    // 设置雷达图的指标
    const indicator = dates.map(date => ({
      name: date,
      max: null  // 将在后面根据数据设置
    }));

    // 为每个系列准备数据
    const radarData = filteredSeries.map(s => {
      // 创建日期到值的映射
      const dateValueMap = {};
      s.data.forEach(item => {
        if (item.time) {
          const date = item.time.split(' ')[0];
          dateValueMap[date] = item.value;
        }
      });

      // 获取该系列所有值
      const values = dates.map(date => {
        return dateValueMap[date] !== undefined ? dateValueMap[date] : 0;
      });

      return {
        name: s.name,
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

    // 计算每个指标的最大值，用于雷达图刻度
    const maxValues = {};
    filteredSeries.forEach(s => {
      s.data.forEach(item => {
        if (item.time) {
          const date = item.time.split(' ')[0];
          const value = item.value;
          if (value !== undefined && value !== null) {
            maxValues[date] = Math.max(maxValues[date] || 0, value * 1.2); // 增加20%的余量
          }
        }
      });
    });

    // 设置指标的最大值
    indicator.forEach(ind => {
      ind.max = maxValues[ind.name] || 100;
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
      // 清除现有图表
      if (chartInstance.current) {
        chartInstance.current.dispose();
      }
      
      const chart = echarts.init(chartRef.current);
      let option;
      
      if (chartType === 'line') {
        // 折线图
        const { xAxis, series } = prepareLineChartData(data);
        
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
              let result = `${params[0].axisValue}<br/>`;
              params.forEach(param => {
                if (param.value !== null) {
                  const marker = `<span style="display:inline-block;margin-right:5px;border-radius:10px;width:10px;height:10px;background-color:${param.color};"></span>`;
                  result += `${marker}${param.seriesName}: ${formatValue(param.value)}<br/>`;
                }
              });
              return result;
            }
          },
          legend: {
            data: series.map(s => s.name),
            top: 0, // 上移图例
            left: 'center', // 居中显示
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
            width: '80%' // 限制图例宽度，为工具栏留出空间
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
            top: 25 // 将工具栏下移，避免与图例重叠
          },
          grid: {
            top: '80px', // 调整网格顶部距离
            left: '3%',
            right: '4%',
            bottom: '3%',
            containLabel: true
          },
          xAxis: {
            type: 'category',
            boundaryGap: false,
            data: xAxis,
            axisLabel: {
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
          series: series
        };
      } else {
        // 雷达图
        const { indicator, series } = prepareRadarChartData(data);
        
        option = {
          
          tooltip: {
            trigger: 'item'
          },
          legend: {
            data: series[0].data.map(item => item.name),
            top: 10, // 上移图例
            left: 'center', // 居中显示
            type: 'scroll',
            textStyle: {
              fontSize: 12
            }
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
          if (params.componentType === 'series') {
            // 在折线图模式下，切换选中的指标
            if (chartType === 'line') {
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
          }
        });
      } catch (error) {
        console.error('[RealtimeTrendChart] 图表渲染错误:', error);
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

  // 监听数据变化和图表类型变化，更新图表
  useEffect(() => {
    if (data.length > 0) {
      initChart();
    }
  }, [data, chartType, selectedIndicator, zoomEnabled]);

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

    // 设置刷新间隔
    const interval = refreshMode === 'realtime' ? 300000 : refreshInterval * 60000; // 实时模式5分钟，周期模式使用用户设置的间隔
    const refreshTimer = setInterval(() => {
      fetchTrendData();
    }, interval);

    return () => {
      clearInterval(refreshTimer);
    };
  }, [refreshMode, refreshInterval]);

  // 刷新数据
  const handleRefresh = () => {
    fetchTrendData();
  };

  // 处理缩放开关变化
  const handleZoomToggle = (event) => {
    setZoomEnabled(event.target.checked);
  };

  return (
    <Box className={styles.enhancedTrendChart}>
      <Paper elevation={0} sx={{ borderRadius: '8px', overflow: 'hidden', mb: 1, border: '1px solid #e0e0e0' }}>
        <Box className={styles.header} sx={{ p: 1.5, backgroundColor: '#f9f9f9' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {chartType === 'line' && <LineChartOutlined style={{ fontSize: 20, marginRight: 8, color: THEME_COLOR }} />}
            {chartType === 'radar' && <RadarChartOutlined style={{ fontSize: 20, marginRight: 8, color: THEME_COLOR }} />}
            <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
              {chartType === 'line' ? '生产数据趋势图' : '生产数据雷达图'}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ToggleButtonGroup
              value={chartType}
              exclusive
              onChange={handleChartTypeChange}
              size="small"
              aria-label="图表类型"
              sx={{ mr: 2 }}
            >
              <ToggleButton value="line" aria-label="折线图">
                <Tooltip title="折线图">
                  <LineChartOutlined />
                </Tooltip>
              </ToggleButton>
              <ToggleButton value="radar" aria-label="雷达图">
                <Tooltip title="雷达图">
                  <RadarChartOutlined />
                </Tooltip>
              </ToggleButton>
            </ToggleButtonGroup>
            
            {chartType === 'line' && (
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
            )}
            <Tooltip title="刷新">
              <IconButton
                size="small"
                onClick={handleRefresh}
                disabled={loading}
                sx={{ 
                  color: '#666',
                  '&:hover': { color: THEME_COLOR },
                  '&.Mui-disabled': { color: '#ccc' }
                }}
              >
                <ReloadOutlined />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {loading ? (
          <Box className={styles.loading} sx={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CircularProgress sx={{ color: THEME_COLOR }} />
          </Box>
        ) : error ? (
          <Box sx={{ p: 2 }}>
            <Alert severity="error" className={styles.error}>
              {error}
            </Alert>
          </Box>
        ) : (
          <Box sx={{ p: 2 }}>
            <div
              ref={chartRef}
              style={{
                width: '100%',
                height: '400px',
                minHeight: '400px'
              }}
            />
          </Box>
        )}
      </Paper>

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

export default RealtimeTrendChart; 