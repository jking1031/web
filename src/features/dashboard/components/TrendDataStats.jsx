import React, { useState, useEffect, useRef } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Button,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  TextField,
  Paper,
  Alert,
  Checkbox,
  Grid,
  Popover,
  Divider
} from '@mui/material';
import { message } from 'antd';
import {
  LineChartOutlined,
  EditOutlined,
  ReloadOutlined,
  BgColorsOutlined
} from '@ant-design/icons';
import moment from 'moment';
import { Line } from '@ant-design/charts';
import apiManager from '../../../services/apiManager';
import { useAuth } from '../../../context/AuthContext';

/**
 * 实时趋势数据组件
 * 显示实时趋势数据，支持编辑显示的数据项
 */
const TrendDataStats = () => {
  // 状态管理
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [fieldConfigs, setFieldConfigs] = useState({});
  const [selectedFields, setSelectedFields] = useState([]);
  const [chartTitle, setChartTitle] = useState('实时趋势');
  const { isAdmin } = useAuth();

  // 颜色选择器状态
  const [colorPickerAnchorEl, setColorPickerAnchorEl] = useState(null);
  const [currentEditingField, setCurrentEditingField] = useState(null);

  // 预定义的颜色选项
  const colorOptions = [
    '#2E7D32', '#1890ff', '#fa8c16', '#722ed1', '#13c2c2',
    '#eb2f96', '#faad14', '#52c41a', '#f5222d', '#2f54eb',
    '#5C6BC0', '#26A69A', '#EC407A', '#AB47BC', '#7E57C2',
    '#5C6BC0', '#42A5F5', '#29B6F6', '#26C6DA', '#26A69A',
    '#66BB6A', '#9CCC65', '#D4E157', '#FFEE58', '#FFCA28',
    '#FFA726', '#FF7043', '#8D6E63', '#BDBDBD', '#78909C'
  ];

  // 定时器引用
  const timerRef = useRef(null);

  // 初始化
  useEffect(() => {
    // 等待API管理器初始化完成
    apiManager.waitForReady().then(ready => {
      if (ready) {
        checkAndRegisterTrendDataApi().then(() => {
          // 加载保存的字段配置
          loadSavedFieldConfigs();
          // 获取趋势数据
          fetchTrendData();
        });
      } else {
        console.error('API管理器初始化失败');
        message.error('API管理器初始化失败');
      }
    });

    // 设置定时器，每60秒刷新一次数据
    timerRef.current = setInterval(() => {
      fetchTrendData();
    }, 60000);

    // 组件卸载时清除定时器
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // 检查并注册趋势数据API
  const checkAndRegisterTrendDataApi = async () => {
    try {
      // 检查getTrendData API是否存在
      const trendDataApi = apiManager.registry.get('getTrendData');

      if (!trendDataApi) {
        console.log('getTrendData API不存在，正在注册...');

        // 注册getTrendData API
        await apiManager.registry.register('getTrendData', {
          name: '获取趋势数据',
          url: 'https://nodered.jzz77.cn:9003/api/trend-data',
          method: 'POST',
          category: 'data',
          status: 'enabled',
          description: '获取历史趋势数据',
          timeout: 15000,
          retries: 1,
          cacheTime: 60000, // 60秒缓存
          headers: {
            'Content-Type': 'application/json'
          }
        });

        console.log('getTrendData API注册成功');
      } else {
        console.log('getTrendData API已存在');
      }

      return true;
    } catch (error) {
      console.error('检查/注册getTrendData API失败:', error);
      message.error('初始化API失败，请刷新页面重试');
      return false;
    }
  };

  // 加载保存的字段配置
  const loadSavedFieldConfigs = () => {
    try {
      const savedConfig = localStorage.getItem('trendDataFields');
      if (savedConfig) {
        const config = JSON.parse(savedConfig);

        // 确保所有字段都有颜色属性
        const updatedFieldConfigs = { ...config.fieldConfigs };
        Object.keys(updatedFieldConfigs).forEach((key, index) => {
          if (!updatedFieldConfigs[key].color) {
            updatedFieldConfigs[key].color = colorOptions[index % colorOptions.length];
          }
        });

        setFieldConfigs(updatedFieldConfigs);
        setSelectedFields(config.selectedFields || []);

        // 加载标题
        if (config.chartTitle) {
          setChartTitle(config.chartTitle);
        }
      } else {
        // 不设置默认字段，等待API返回数据后自动选择
        setSelectedFields([]);
      }
    } catch (error) {
      console.error('加载趋势数据字段配置失败:', error);
      setSelectedFields([]);
    }
  };

  // 保存字段配置
  const saveFieldConfigs = (configs, selected, title = chartTitle) => {
    try {
      // 确保所有字段都有颜色属性
      const updatedConfigs = { ...configs };
      Object.keys(updatedConfigs).forEach((key, index) => {
        if (!updatedConfigs[key].color) {
          updatedConfigs[key].color = colorOptions[index % colorOptions.length];
        }
      });

      localStorage.setItem('trendDataFields', JSON.stringify({
        fieldConfigs: updatedConfigs,
        selectedFields: selected,
        chartTitle: title
      }));
    } catch (error) {
      console.error('保存趋势数据字段配置失败:', error);
    }
  };

  // 获取趋势数据
  const fetchTrendData = async () => {
    setLoading(true);
    setError(null);

    try {
      // 构建API请求参数
      const apiParams = {
        startTime: moment().subtract(24, 'hours').format('YYYY-MM-DD HH:mm:ss'),
        endTime: moment().format('YYYY-MM-DD HH:mm:ss'),
        interval: '1h' // 1小时间隔
        // 不指定字段列表，让后端返回所有可用字段
      };

      console.log('获取趋势数据:', apiParams);

      try {
        // 检查API是否存在
        const trendDataApi = apiManager.registry.get('getTrendData');

        if (!trendDataApi) {
          console.warn('getTrendData API不存在，重新注册...');
          await checkAndRegisterTrendDataApi();
        }

        // 更新API配置，确保使用正确的URL
        await apiManager.registry.update('getTrendData', {
          url: 'https://nodered.jzz77.cn:9003/api/trend-data',
          useMock: false // 禁用模拟数据
        });

        // 调用getTrendData API
        const response = await apiManager.call('getTrendData', apiParams, {
          useMock: false, // 不使用模拟数据
          showError: true // 显示错误提示
        });

        console.log('获取到趋势数据:', response);

        if (response && response.success) {
          // 处理数据
          const chartData = processData(response);

          // 如果是首次加载且没有选择字段，自动选择所有字段
          if (selectedFields.length === 0 && response.data && Array.isArray(response.data)) {
            const availableFields = response.data.map(series => series.field);
            setSelectedFields(availableFields);

            // 更新字段配置
            const newFieldConfigs = {};
            response.data.forEach((series, index) => {
              if (series && series.field && series.name) {
                newFieldConfigs[series.field] = {
                  title: series.name,
                  visible: true,
                  color: colorOptions[index % colorOptions.length] // 分配颜色
                };
              }
            });

            setFieldConfigs(newFieldConfigs);
            saveFieldConfigs(newFieldConfigs, availableFields);
          } else if (response.data && Array.isArray(response.data)) {
            // 如果已有选择的字段，但有新的字段出现，也需要更新配置
            const currentFields = Object.keys(fieldConfigs);
            const newFields = response.data
              .filter(series => series && series.field && !currentFields.includes(series.field))
              .map(series => series.field);

            if (newFields.length > 0) {
              const updatedFieldConfigs = { ...fieldConfigs };

              response.data.forEach((series) => {
                if (series && series.field && newFields.includes(series.field)) {
                  // 为新字段分配颜色
                  const colorIndex = (currentFields.length + newFields.indexOf(series.field)) % colorOptions.length;
                  updatedFieldConfigs[series.field] = {
                    title: series.name,
                    visible: false, // 默认不显示新字段
                    color: colorOptions[colorIndex]
                  };
                }
              });

              setFieldConfigs(updatedFieldConfigs);
              saveFieldConfigs(updatedFieldConfigs, selectedFields);
            }
          }

          setData(chartData);
          setLastUpdated(new Date());
        } else {
          // 如果返回的数据格式不正确
          console.error('API返回的数据格式不正确:', response);
          setError('API返回的数据格式不正确，请检查API配置');
          setData([]);
        }
      } catch (apiError) {
        console.error('API调用失败:', apiError);
        setError('API调用失败: ' + (apiError.message || '未知错误'));
        setData([]);
      }
    } catch (error) {
      console.error('获取趋势数据失败:', error);
      setError('获取趋势数据失败: ' + (error.message || '未知错误'));
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  // 处理数据
  const processData = (rawData) => {
    if (!rawData || !rawData.data || !Array.isArray(rawData.data) || rawData.data.length === 0) {
      console.warn('趋势数据格式不正确或为空:', rawData);
      return [];
    }

    try {
      const result = [];

      // 遍历每个数据系列
      rawData.data.forEach(series => {
        // 检查数据系列是否有效
        if (!series || !series.name || !series.field || !Array.isArray(series.data)) {
          console.warn('跳过无效的数据系列:', series);
          return;
        }

        // 获取字段名和显示名称
        const field = series.field;
        const seriesName = series.name;

        // 如果字段配置中没有这个字段，自动添加
        if (!fieldConfigs[field]) {
          setFieldConfigs(prev => ({
            ...prev,
            [field]: {
              title: seriesName,
              visible: selectedFields.includes(field)
            }
          }));
        }

        // 只处理选中的字段
        if (!selectedFields.includes(field) && selectedFields.length > 0) {
          return;
        }

        // 处理时间序列数据
        series.data.forEach(point => {
          if (!point || !point.time || point.value === undefined) {
            return;
          }

          // 格式化时间
          let timeStr = '';
          try {
            timeStr = moment(point.time).isValid()
              ? moment(point.time).format('MM-DD HH:mm')
              : point.time.toString();
          } catch (e) {
            timeStr = point.time.toString();
          }

          // 获取字段颜色
          const fieldColor = fieldConfigs[field]?.color || colorOptions[selectedFields.indexOf(field) % colorOptions.length];

          // 添加数据点，包含颜色信息
          result.push({
            time: timeStr,
            value: point.value,
            category: fieldConfigs[field]?.title || seriesName,
            color: fieldColor
          });
        });
      });

      return result;
    } catch (error) {
      console.error('处理趋势数据失败:', error);
      return [];
    }
  };



  // 手动刷新数据
  const handleRefresh = () => {
    fetchTrendData();
  };

  // 打开编辑对话框
  const handleOpenEditDialog = () => {
    // 初始化字段配置
    const initialFieldConfigs = { ...fieldConfigs };

    // 确保所有已选字段都有配置
    selectedFields.forEach(field => {
      if (!initialFieldConfigs[field]) {
        initialFieldConfigs[field] = {
          title: field, // 使用字段名作为默认标题
          visible: true
        };
      }
    });

    setFieldConfigs(initialFieldConfigs);
    setIsEditDialogOpen(true);
  };

  // 关闭编辑对话框
  const handleCloseEditDialog = () => {
    setIsEditDialogOpen(false);
  };

  // 保存字段配置
  const handleSaveFieldConfigs = (newTitle) => {
    // 获取选中的字段
    const newSelectedFields = Object.keys(fieldConfigs).filter(key => fieldConfigs[key].visible);

    // 更新标题
    if (newTitle !== undefined) {
      setChartTitle(newTitle);
    }

    // 保存配置
    setSelectedFields(newSelectedFields);
    saveFieldConfigs(fieldConfigs, newSelectedFields, newTitle !== undefined ? newTitle : chartTitle);

    // 关闭对话框
    setIsEditDialogOpen(false);

    // 重新获取数据
    fetchTrendData();
  };

  // 全选所有字段
  const handleSelectAll = () => {
    const updatedFieldConfigs = { ...fieldConfigs };
    Object.keys(updatedFieldConfigs).forEach(key => {
      updatedFieldConfigs[key].visible = true;
    });
    setFieldConfigs(updatedFieldConfigs);
  };

  // 取消全选
  const handleDeselectAll = () => {
    const updatedFieldConfigs = { ...fieldConfigs };
    Object.keys(updatedFieldConfigs).forEach(key => {
      updatedFieldConfigs[key].visible = false;
    });
    setFieldConfigs(updatedFieldConfigs);
  };

  // 切换字段可见性
  const handleToggleFieldVisibility = (fieldKey) => {
    setFieldConfigs(prev => ({
      ...prev,
      [fieldKey]: {
        ...prev[fieldKey],
        visible: !prev[fieldKey].visible
      }
    }));
  };

  // 更新字段配置
  const handleUpdateFieldConfig = (fieldKey, property, value) => {
    setFieldConfigs(prev => ({
      ...prev,
      [fieldKey]: {
        ...prev[fieldKey],
        [property]: value
      }
    }));
  };

  // 打开颜色选择器
  const handleOpenColorPicker = (event, fieldKey) => {
    setColorPickerAnchorEl(event.currentTarget);
    setCurrentEditingField(fieldKey);
  };

  // 关闭颜色选择器
  const handleCloseColorPicker = () => {
    setColorPickerAnchorEl(null);
    setCurrentEditingField(null);
  };

  // 选择颜色
  const handleSelectColor = (color) => {
    if (currentEditingField) {
      handleUpdateFieldConfig(currentEditingField, 'color', color);
      handleCloseColorPicker();
    }
  };

  // 图表配置
  const chartConfig = {
    data,
    xField: 'time',
    yField: 'value',
    seriesField: 'category',
    meta: {
      // 确保value字段被正确解析为数值
      value: {
        alias: '数值',
        formatter: (v) => {
          if (v === null || v === undefined) return '无数据';
          if (v >= 1000000) return `${(v / 1000000).toFixed(2)}M`;
          if (v >= 1000) return `${(v / 1000).toFixed(2)}k`;
          if (v >= 10) return v.toFixed(1);
          if (v > 0) return v.toFixed(2);
          return '0';
        }
      },
      // 确保time字段被正确格式化
      time: {
        alias: '时间',
        formatter: (t) => moment(t).format('MM-DD HH:mm')
      },
      // 确保category字段被正确显示
      category: {
        alias: '数据项'
      }
    },
    // Y轴配置
    yAxis: {
      title: {
        text: '数值',
        style: {
          fontSize: 10,
          fill: '#666',
        }
      },
      // 自动调整Y轴范围
      nice: true,
      // 确保Y轴从0开始（如果数据都是正值）
      min: Math.min(0, ...data.map(item => item.value).filter(v => !isNaN(v))),
      // 格式化Y轴标签
      label: {
        formatter: (v) => {
          // 根据数值大小选择合适的格式
          if (v >= 1000000) {
            return `${(v / 1000000).toFixed(1)}M`;
          } else if (v >= 1000) {
            return `${(v / 1000).toFixed(1)}k`;
          } else if (v >= 1) {
            return v.toFixed(1);
          } else if (v > 0) {
            return v.toFixed(2);
          } else {
            return '0';
          }
        },
        style: {
          fontSize: 10,
          fill: '#666',
        }
      },
      // 网格线设置
      grid: {
        line: {
          style: {
            stroke: '#eee',
            lineWidth: 1,
            lineDash: [4, 4],
          }
        }
      }
    },
    // X轴配置
    xAxis: {
      title: {
        text: '时间',
        style: {
          fontSize: 10,
          fill: '#666',
        }
      },
      // 控制显示的刻度数量
      tickCount: 8,
      // 标签配置
      label: {
        // 自动旋转标签，避免重叠
        autoRotate: true,
        // 自动隐藏部分标签，避免拥挤
        autoHide: true,
        // 自动省略过长的标签
        autoEllipsis: true,
        // 格式化时间标签
        formatter: (text) => {
          try {
            const date = moment(text);
            // 如果是今天的数据，只显示时间
            if (date.isSame(moment(), 'day')) {
              return date.format('HH:mm');
            }
            // 否则显示日期（不显示年份）
            return date.format('MM-DD HH:mm');
          } catch (e) {
            return text;
          }
        },
        style: {
          fontSize: 9,
          fill: '#666',
          // 垂直显示标签
          textBaseline: 'top',
          rotate: 45
        }
      },
      // 网格线设置
      grid: {
        line: {
          style: {
            stroke: '#eee',
            lineWidth: 1,
            lineDash: [4, 4],
          }
        }
      },
    },
    // 图例配置
    legend: {
      position: 'top-right',
      itemName: {
        style: {
          fontSize: 10,
          fill: '#666',
        },
        formatter: (text) => {
          return text.length > 15 ? text.substring(0, 12) + '...' : text;
        }
      },
      marker: {
        symbol: 'circle',
        style: {
          r: 3,
          lineWidth: 2,
        }
      },
      flipPage: false,
    },
    // 平滑曲线
    smooth: true,
    // 数据点配置
    point: {
      size: 3,
      shape: 'circle',
      style: {
        fill: 'white',
        stroke: '#5B8FF9',
        lineWidth: 2,
      },
    },
    // 线条样式
    lineStyle: {
      lineWidth: 2,
    },
    // 面积样式（添加渐变填充）
    area: {
      style: {
        fill: 'l(270) 0:#ffffff 0.5:#e6f7ff 1:#1890ff',
        fillOpacity: 0.2,
      },
    },
    // 动画效果
    animation: {
      appear: {
        animation: 'path-in',
        duration: 1000,
      },
    },
    // 提示框配置
    tooltip: {
      showMarkers: true,
      shared: true,
      showTitle: true,
      showCrosshairs: true,
      crosshairs: {
        type: 'x',
        line: {
          style: {
            stroke: '#ccc',
            lineWidth: 1,
            lineDash: [4, 4],
          },
        },
      },
      itemTpl: `
        <li class="g2-tooltip-list-item" data-index={index}>
          <span class="g2-tooltip-marker" style="background-color:{color}"></span>
          <span class="g2-tooltip-name">{name}</span>
          <span class="g2-tooltip-value">{value}</span>
        </li>
      `,
      formatter: (datum) => {
        // 确保datum是有效的
        if (!datum) return null;

        // 获取数据
        const { time, category, value, color } = datum;

        // 格式化值
        let formattedValue = '无数据';
        if (value !== null && value !== undefined) {
          // 根据值的大小选择合适的格式
          if (value >= 1000000) {
            formattedValue = `${(value / 1000000).toFixed(2)}M`;
          } else if (value >= 1000) {
            formattedValue = `${(value / 1000).toFixed(2)}k`;
          } else if (value >= 10) {
            formattedValue = value.toFixed(1);
          } else if (value > 0) {
            formattedValue = value.toFixed(2);
          } else if (value === 0) {
            formattedValue = '0';
          }
        }

        // 返回格式化的提示内容
        return {
          name: category,
          value: formattedValue,
          color: color || '#2E7D32'
        };
      },
      domStyles: {
        'g2-tooltip': {
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.25)',
          padding: '10px 12px',
          fontSize: '12px',
          borderRadius: '4px',
          color: '#333',
        },
        'g2-tooltip-title': {
          fontWeight: 'bold',
          marginBottom: '10px',
          color: '#222',
        },
        'g2-tooltip-list': {
          margin: 0,
          padding: 0,
          listStyle: 'none',
        },
        'g2-tooltip-list-item': {
          display: 'flex',
          alignItems: 'center',
          marginBottom: '6px',
        },
        'g2-tooltip-marker': {
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          display: 'inline-block',
          marginRight: '8px',
        },
        'g2-tooltip-name': {
          flex: 1,
          marginRight: '10px',
        },
        'g2-tooltip-value': {
          fontWeight: 'bold',
        },
      },
    },
    // 自定义颜色映射
    colorField: 'color',
    // 自动适应容器大小
    autoFit: true,
    // 交互配置
    interactions: [
      { type: 'element-active' },
      { type: 'legend-active' },
      { type: 'axis-label-highlight' },
      { type: 'legend-highlight' },
      { type: 'element-highlight' },
    ],
  };

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <LineChartOutlined style={{ fontSize: 24, marginRight: 8, color: '#2E7D32' }} />
            <Typography variant="h6">{chartTitle}</Typography>
          </Box>
          <Box>
            {isAdmin && (
              <Tooltip title="编辑趋势图">
                <IconButton
                  size="small"
                  onClick={handleOpenEditDialog}
                  sx={{ mr: 1 }}
                >
                  <EditOutlined />
                </IconButton>
              </Tooltip>
            )}
            <Tooltip title={lastUpdated ? `最后更新: ${moment(lastUpdated).format('YYYY-MM-DD HH:mm')}` : '未更新'}>
              <Button
                size="small"
                startIcon={<ReloadOutlined />}
                onClick={handleRefresh}
                disabled={loading}
              >
                刷新
              </Button>
            </Tooltip>
          </Box>
        </Box>

        {/* 趋势图容器 */}
        <Box sx={{ height: 400, position: 'relative', border: '1px solid #f0f0f0', borderRadius: 1, overflow: 'hidden' }}>
          {loading && data.length === 0 ? (
            <Box sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '100%',
              flexDirection: 'column'
            }}>
              <CircularProgress size={40} sx={{ color: '#2E7D32', mb: 2 }} />
              <Typography variant="body2" color="text.secondary">加载数据中...</Typography>
            </Box>
          ) : error ? (
            <Box sx={{
              p: 3,
              bgcolor: '#ffebee',
              borderRadius: 1,
              color: '#d32f2f',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center'
            }}>
              <Typography variant="h6" sx={{ mb: 1 }}>数据加载失败</Typography>
              <Typography variant="body2">{error}</Typography>
            </Box>
          ) : data.length === 0 ? (
            <Box sx={{
              p: 3,
              bgcolor: '#f5f5f5',
              borderRadius: 1,
              color: '#666',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center'
            }}>
              <Typography variant="h6" sx={{ mb: 1 }}>暂无数据</Typography>
              <Typography variant="body2" color="text.secondary">
                请检查API配置或选择其他数据项
              </Typography>
            </Box>
          ) : (
            <Box sx={{ height: '100%', width: '100%', position: 'relative' }}>
              {/* 加载中遮罩 */}
              {loading && (
                <Box sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  backgroundColor: 'rgba(255, 255, 255, 0.7)',
                  zIndex: 1
                }}>
                  <CircularProgress size={24} sx={{ color: '#2E7D32' }} />
                </Box>
              )}

              {/* 图表 */}
              <Box sx={{ height: '100%', width: '100%', p: 1 }}>
                <Line {...chartConfig} />
              </Box>
            </Box>
          )}
        </Box>
      </CardContent>

      {/* 编辑趋势图对话框 */}
      <Dialog
        open={isEditDialogOpen}
        onClose={handleCloseEditDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)'
          }
        }}
      >
        <DialogTitle sx={{
          borderBottom: '1px solid #f0f0f0',
          display: 'flex',
          alignItems: 'center',
          bgcolor: '#f9f9f9'
        }}>
          <LineChartOutlined style={{ fontSize: 20, marginRight: 8, color: '#2E7D32' }} />
          <Typography variant="h6" component="span" sx={{ color: '#2E7D32', fontWeight: 500 }}>
            编辑趋势图显示
          </Typography>
        </DialogTitle>

        <DialogContent sx={{ pt: 3 }}>
          {/* 标题编辑部分 */}
          <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 500, display: 'flex', alignItems: 'center' }}>
            <Box component="span" sx={{
              width: 4,
              height: 16,
              bgcolor: '#2E7D32',
              display: 'inline-block',
              mr: 1,
              borderRadius: 1
            }}></Box>
            图表标题
          </Typography>

          <TextField
            label="图表标题"
            fullWidth
            size="small"
            value={chartTitle}
            onChange={(e) => setChartTitle(e.target.value)}
            variant="outlined"
            sx={{ mb: 3 }}
            InputProps={{
              sx: {
                bgcolor: 'white'
              }
            }}
          />

          <Divider sx={{ my: 2 }} />

          {/* 数据项选择部分 */}
          <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 500, display: 'flex', alignItems: 'center' }}>
            <Box component="span" sx={{
              width: 4,
              height: 16,
              bgcolor: '#2E7D32',
              display: 'inline-block',
              mr: 1,
              borderRadius: 1
            }}></Box>
            选择要显示的数据项
          </Typography>

          <Box sx={{ mt: 2, mb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              勾选您想要在趋势图中显示的数据项，并可以自定义其显示名称和颜色
            </Typography>

            <Box>
              <Button
                size="small"
                onClick={handleSelectAll}
                sx={{ mr: 1 }}
              >
                全选
              </Button>
              <Button
                size="small"
                onClick={handleDeselectAll}
              >
                取消全选
              </Button>
            </Box>
          </Box>

          <Paper variant="outlined" sx={{ mt: 2, p: 2, bgcolor: '#fafafa', borderRadius: 2 }}>
            <Grid container spacing={2}>
              {Object.keys(fieldConfigs).map(fieldKey => (
                <Grid item xs={12} sm={6} md={4} key={fieldKey}>
                  <Box sx={{
                    p: 2,
                    border: '1px solid',
                    borderColor: fieldConfigs[fieldKey].visible ? '#2E7D32' : '#e0e0e0',
                    borderRadius: 2,
                    opacity: fieldConfigs[fieldKey].visible ? 1 : 0.7,
                    transition: 'all 0.3s',
                    bgcolor: fieldConfigs[fieldKey].visible ? 'rgba(46, 125, 50, 0.05)' : 'white',
                    '&:hover': {
                      borderColor: fieldConfigs[fieldKey].visible ? '#2E7D32' : '#bdbdbd',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
                    }
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Checkbox
                        checked={fieldConfigs[fieldKey].visible}
                        onChange={() => handleToggleFieldVisibility(fieldKey)}
                        sx={{
                          color: '#2E7D32',
                          '&.Mui-checked': {
                            color: '#2E7D32',
                          }
                        }}
                      />
                      <Typography
                        variant="subtitle2"
                        sx={{
                          fontWeight: fieldConfigs[fieldKey].visible ? 600 : 400,
                          color: fieldConfigs[fieldKey].visible ? '#2E7D32' : 'text.primary'
                        }}
                      >
                        {fieldKey}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <TextField
                        label="显示名称"
                        fullWidth
                        size="small"
                        value={fieldConfigs[fieldKey].title || ''}
                        onChange={(e) => handleUpdateFieldConfig(fieldKey, 'title', e.target.value)}
                        disabled={!fieldConfigs[fieldKey].visible}
                        variant="outlined"
                        InputProps={{
                          sx: {
                            bgcolor: 'white'
                          }
                        }}
                      />
                      <Tooltip title="选择颜色">
                        <IconButton
                          size="small"
                          onClick={(e) => handleOpenColorPicker(e, fieldKey)}
                          disabled={!fieldConfigs[fieldKey].visible}
                          sx={{
                            bgcolor: fieldConfigs[fieldKey].color || '#2E7D32',
                            color: 'white',
                            '&:hover': {
                              bgcolor: fieldConfigs[fieldKey].color ? `${fieldConfigs[fieldKey].color}dd` : '#1B5E20',
                            },
                            width: 40,
                            height: 40
                          }}
                        >
                          <BgColorsOutlined />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </DialogContent>

        <DialogActions sx={{ borderTop: '1px solid #f0f0f0', p: 2 }}>
          <Button
            onClick={handleCloseEditDialog}
            variant="outlined"
            sx={{ borderRadius: 2 }}
          >
            取消
          </Button>
          <Button
            onClick={() => handleSaveFieldConfigs(chartTitle)}
            variant="contained"
            color="primary"
            sx={{
              bgcolor: '#2E7D32',
              '&:hover': { bgcolor: '#1B5E20' },
              borderRadius: 2
            }}
          >
            保存设置
          </Button>
        </DialogActions>
      </Dialog>

      {/* 颜色选择器弹出框 */}
      <Popover
        open={Boolean(colorPickerAnchorEl)}
        anchorEl={colorPickerAnchorEl}
        onClose={handleCloseColorPicker}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        PaperProps={{
          sx: {
            p: 1,
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            borderRadius: 2,
            maxWidth: 300
          }
        }}
      >
        <Typography variant="subtitle2" sx={{ p: 1, fontWeight: 500 }}>
          选择颜色
        </Typography>
        <Divider sx={{ mb: 1 }} />
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: 1,
          p: 1
        }}>
          {colorOptions.map((color, index) => (
            <Box
              key={index}
              sx={{
                width: 30,
                height: 30,
                bgcolor: color,
                borderRadius: '50%',
                cursor: 'pointer',
                border: currentEditingField && fieldConfigs[currentEditingField]?.color === color
                  ? '2px solid #000'
                  : '2px solid transparent',
                '&:hover': {
                  transform: 'scale(1.1)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                },
                transition: 'all 0.2s'
              }}
              onClick={() => handleSelectColor(color)}
            />
          ))}
        </Box>
      </Popover>
    </Card>
  );
};

export default TrendDataStats;
