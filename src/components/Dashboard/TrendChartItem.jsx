import React, { useState, useEffect, useRef } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  IconButton,
  Tooltip,
  Paper
} from '@mui/material';
import {
  ReloadOutlined,
  EditOutlined,
  DeleteOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined
} from '@ant-design/icons';
import { Line } from '@ant-design/charts';
import moment from 'moment';
import { Resizable } from 're-resizable';
import api from '../../api/interceptors';
import apiManager from '../../services/apiManager';
import styles from './EnhancedTrendChart.module.scss';
import { useAuth } from '../../context/AuthContext';
import AdminCheck from '../Auth/AdminCheck';

// 过滤不必要的日志输出
const originalConsoleLog = console.log;
console.log = function(...args) {
  // 过滤掉包含 "工具提示时间原始值" 的日志
  if (args.length > 0 &&
      typeof args[0] === 'string' &&
      args[0].includes('工具提示时间原始值')) {
    return;
  }
  originalConsoleLog.apply(console, args);
};

/**
 * 单个趋势图组件
 * @param {Object} props - 组件属性
 * @param {Object} props.trend - 趋势图配置
 * @param {Array} props.dataSources - 数据源列表
 * @param {Array} props.queryCommands - 查询命令列表
 * @param {Function} props.onEdit - 编辑回调
 * @param {Function} props.onDelete - 删除回调
 * @param {Function} props.onResize - 大小调整回调
 * @param {Number} props.refreshInterval - 刷新间隔
 * @param {Object} props.timersRef - 定时器引用
 */
const TrendChartItem = ({
  trend,
  dataSources,
  queryCommands,
  onEdit,
  onDelete,
  onResize,
  refreshInterval,
  timersRef
}) => {
  // 状态管理
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState([]);
  const [fullscreen, setFullscreen] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  // 获取查询命令
  const queryCommand = queryCommands.find(q => q.id === trend.queryId);

  // 获取数据源
  const dataSource = queryCommand
    ? dataSources.find(ds => ds.id === queryCommand.dataSourceId)
    : null;

  // 组件挂载时获取数据并设置定时器
  useEffect(() => {
    // 无论是否有查询命令和数据源，都尝试获取数据
    fetchData();

    // 设置定时器
    timersRef.current[trend.id] = setInterval(fetchData, refreshInterval);

    // 清理函数
    return () => {
      if (timersRef.current[trend.id]) {
        clearInterval(timersRef.current[trend.id]);
        delete timersRef.current[trend.id];
      }
    };
  }, [trend.id, refreshInterval]);

  // 当查询命令、数据源或API配置变化时，重新获取数据
  useEffect(() => {
    // 只有在组件已经挂载后才执行，避免初始化时重复调用
    if (lastUpdated) {
      fetchData();
    }
  }, [queryCommand, dataSource, trend.apiConfig?.apiUrl]);

  // 获取趋势数据
  const fetchData = async () => {
    try {
      setLoading(true);

      // 如果配置为使用查询命令且有查询命令和数据源，使用系统设置中的数据源和查询命令
      if (!trend.apiConfig?.useApi && queryCommand && dataSource) {
        try {
          // 使用apiManager的customQuery API
          const requestBody = {
            dataSource: {
              type: dataSource.type,
              host: dataSource.host,
              port: dataSource.port,
              database: dataSource.database,
              username: dataSource.username,
              password: dataSource.password
            },
            sql: queryCommand.sql,
            parameters: {}
          };

          // 调用API管理系统的customQuery API
          const response = await apiManager.call('customQuery', requestBody);

          if (response && Array.isArray(response)) {
            // 处理数据
            const chartData = processData(response);
            setData(chartData);
            setLastUpdated(new Date());
            setError(null);

            // 保存数据到趋势图配置
            trend.data = chartData;
            return;
          }
        } catch (queryError) {
          console.warn(`[TrendChartItem] 使用查询命令获取数据失败:`, queryError.message);
          // 继续尝试使用API获取数据
        }
      }

      // 如果配置为使用API或者查询命令失败，尝试使用API管理系统获取数据

      // 构建API请求参数
      const apiParams = {
        startTime: moment().subtract(24, 'hours').format('YYYY-MM-DD HH:mm:ss'),
        endTime: moment().format('YYYY-MM-DD HH:mm:ss'),
        interval: '1h', // 1小时间隔
        fields: ['flow_in', 'flow_out', 'pressure'] // 默认字段
      };

      // 如果趋势图配置中有API相关设置，使用配置中的设置
      if (trend.apiConfig) {
        if (trend.apiConfig.fields) {
          apiParams.fields = trend.apiConfig.fields;
        }
        if (trend.apiConfig.interval) {
          apiParams.interval = trend.apiConfig.interval;
        }
        if (trend.apiConfig.timeRange) {
          apiParams.startTime = moment().subtract(trend.apiConfig.timeRange, 'hours').format('YYYY-MM-DD HH:mm:ss');
        }
        if (trend.apiConfig.customParams) {
          // 合并自定义参数
          Object.assign(apiParams, trend.apiConfig.customParams);
        }
      }

      // 确定使用哪个API
      let apiKey = trend.apiConfig?.apiKey || 'getTrendData';
      let response;

      try {
        // 使用API管理系统调用
        console.log(`[TrendChartItem] 调用API: ${apiKey}`, apiParams);
        response = await apiManager.call(apiKey, apiParams);

        // 记录API调用结果
        console.log(`[TrendChartItem] API调用成功: ${apiKey}`, {
          dataLength: Array.isArray(response) ? response.length : 'not array'
        });
      } catch (apiError) {
        console.error(`[TrendChartItem] API调用失败: ${apiKey}`, apiError);
        throw apiError;
      }

      if (response && Array.isArray(response)) {
        // 处理数据
        const chartData = processData(response);
        setData(chartData);
        setLastUpdated(new Date());
        setError(null);

        // 保存数据到趋势图配置
        trend.data = chartData;
      } else {
        throw new Error('API返回空结果或格式不正确');
      }
    } catch (error) {
      console.error(`[TrendChartItem] 获取数据失败:`, error.message);
      setError(`获取数据失败: ${error.message || '未知错误'}`);

      // 使用模拟数据
      const mockData = generateMockData();
      setData(mockData);
    } finally {
      setLoading(false);
    }
  };

  // 处理数据
  const processData = (rawData) => {
    if (!rawData || rawData.length === 0) {
      return [];
    }

    try {
      // 获取时间字段名
      const timeField = Object.keys(rawData[0]).find(key =>
        key.toLowerCase().includes('time') ||
        key.toLowerCase().includes('date')
      ) || Object.keys(rawData[0])[0];

      // 获取数值字段
      const valueFields = Object.keys(rawData[0]).filter(key => {
        const value = rawData[0][key];
        const isNumeric = key !== timeField &&
                         (typeof value === 'number' ||
                          (typeof value === 'string' && !isNaN(parseFloat(value))));
        return isNumeric;
      });

      if (valueFields.length === 0) {
        // 如果没有找到数值字段，尝试使用所有非时间字段
        const allFields = Object.keys(rawData[0]).filter(key => key !== timeField);
        if (allFields.length > 0) {
          // 确保数据是按时间排序的
          const sortedData = [...rawData].sort((a, b) => {
            return new Date(a[timeField]) - new Date(b[timeField]);
          });

          // 转换为图表所需格式
          const result = [];

          sortedData.forEach(item => {
            allFields.forEach(field => {
              // 解析数值，确保是有效的数字
              let value = null;
              if (item[field] !== null && item[field] !== undefined) {
                value = typeof item[field] === 'number' ? item[field] : parseFloat(item[field]);
                // 如果解析失败，使用0代替NaN
                if (isNaN(value)) value = 0;
              }

              // 确保时间格式正确，不显示秒
              let timeStr = '';
              try {
                timeStr = moment(item[timeField]).isValid()
                  ? moment(item[timeField]).format('MM-DD HH:mm')
                  : item[timeField].toString();
              } catch (e) {
                timeStr = item[timeField].toString();
              }

              result.push({
                time: timeStr,
                value: value,
                category: field
              });
            });
          });

          return result;
        }

        return [];
      }

      // 确保数据是按时间排序的
      const sortedData = [...rawData].sort((a, b) => {
        return new Date(a[timeField]) - new Date(b[timeField]);
      });

      // 转换为图表所需格式
      const result = [];

      sortedData.forEach(item => {
        valueFields.forEach(field => {
          // 解析数值，确保是有效的数字
          let value = null;
          if (item[field] !== null && item[field] !== undefined) {
            value = typeof item[field] === 'number' ? item[field] : parseFloat(item[field]);
            // 如果解析失败，使用0代替NaN
            if (isNaN(value)) value = 0;
          }

          // 确保时间格式正确，不显示秒
          let timeStr = '';
          try {
            timeStr = moment(item[timeField]).isValid()
              ? moment(item[timeField]).format('MM-DD HH:mm')
              : item[timeField].toString();
          } catch (e) {
            timeStr = item[timeField].toString();
          }

          result.push({
            time: timeStr,
            value: value,
            category: field
          });
        });
      });

      return result;
    } catch (error) {
      console.error(`[TrendChartItem] 处理数据时出错:`, error.message);
      return [];
    }
  };

  // 生成模拟数据
  const generateMockData = () => {
    const result = [];
    const now = new Date();

    // 使用趋势图配置中的字段，如果没有则使用默认字段
    const categories = trend.apiConfig?.fields || ['value1', 'value2', 'value3'];

    // 确定时间范围，默认24小时
    const timeRange = trend.apiConfig?.timeRange || 24;

    // 确定数据点数量，根据时间间隔确定
    let pointCount = timeRange;
    if (trend.apiConfig?.interval) {
      const interval = trend.apiConfig.interval;
      if (interval === '1m') pointCount = timeRange * 60;
      else if (interval === '5m') pointCount = timeRange * 12;
      else if (interval === '15m') pointCount = timeRange * 4;
      else if (interval === '30m') pointCount = timeRange * 2;
      else if (interval === '1h') pointCount = timeRange;
      else if (interval === '6h') pointCount = Math.ceil(timeRange / 6);
      else if (interval === '12h') pointCount = Math.ceil(timeRange / 12);
      else if (interval === '1d') pointCount = Math.ceil(timeRange / 24);
    }

    // 限制点数，避免生成太多数据
    pointCount = Math.min(pointCount, 100);

    // 生成数据点
    for (let i = 0; i < pointCount; i++) {
      const time = new Date(now.getTime() - (pointCount - 1 - i) * (timeRange * 3600000 / pointCount));
      const timeStr = moment(time).format('MM-DD HH:mm');

      categories.forEach(category => {
        // 生成随机值，但保持一定的连续性
        const baseValue = Math.random() * 100;
        const value = baseValue + Math.sin(i / (pointCount / 8)) * 20;

        // 确保值是有效的数字
        const formattedValue = !isNaN(value) ? parseFloat(value.toFixed(2)) : 0;

        result.push({
          time: timeStr,
          value: formattedValue,
          category: category
        });
      });
    }

    return result;
  };

  // 手动刷新数据
  const handleRefresh = () => {
    fetchData();
  };

  // 切换全屏显示
  const toggleFullscreen = () => {
    setFullscreen(!fullscreen);
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
        style: {
          fontSize: 10,
          fill: '#666',
        }
      },
      // 自动调整Y轴范围
      nice: true,
      // 确保Y轴从0开始
      min: 0,
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
    xAxis: {
      title: {
        text: '时间',
        style: {
          fontSize: 10,
          fill: '#666',
        }
      },
      // 优化时间轴显示
      tickCount: 3, // 减少刻度数量，避免拥挤
      // 自动旋转标签，避免重叠
      label: {
        autoRotate: true, // 允许自动旋转
        autoHide: true, // 允许自动隐藏
        autoEllipsis: true, // 允许自动省略
        offset: 8, // 减少与轴的距离
        formatter: (text) => {
          // 格式化时间轴标签，更加简洁
          try {
            // 更简洁的时间格式
            const date = moment(text);
            const now = moment();

            // 如果是今天的数据，只显示时:分
            if (date.isSame(now, 'day')) {
              return date.format('HH:mm');
            }

            // 否则显示月-日
            return date.format('MM-DD');
          } catch (e) {
            console.error('[TrendChartItem] X轴标签格式化错误:', e.message);
            return text;
          }
        },
        style: {
          fontSize: 9, // 进一步减小字体大小
          fill: '#666', // 设置颜色
        }
      },
      // 确保轴线在图表内部
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
    legend: {
      position: 'top-right',
      visible: trend.showLegend !== false,
      itemName: {
        style: {
          fontSize: 10,
          fill: '#666',
        },
        formatter: (text) => {
          // 如果文本太长，截断并添加省略号
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
    // 添加点
    point: {
      size: 3,
      shape: 'circle',
      style: {
        fill: 'white',
        stroke: '#5B8FF9',
        lineWidth: 2,
      },
    },
    // 动画效果
    animation: {
      appear: {
        animation: 'path-in',
        duration: 1000,
      },
    },
    // 工具提示
    tooltip: {
      showMarkers: true,
      shared: true,
      // 禁用控制台日志输出
      showTitle: true,
      showContent: true,
      // 自定义标题格式化
      title: (title) => {
        // 格式化时间标题，不显示年份和秒
        try {
          // 如果title是对象且有time属性，直接使用time属性
          if (title && typeof title === 'object' && title.time) {
            return title.time;
          }

          // 如果title是字符串且已经是格式化好的（如"05-17 02:55"），直接返回
          if (typeof title === 'string' && title.match(/^\d{2}-\d{2} \d{2}:\d{2}$/)) {
            return title;
          }

          // 否则尝试格式化
          const formatted = moment(title).format('MM-DD HH:mm');
          return formatted;
        } catch (e) {
          // 减少错误日志输出
          return typeof title === 'string' ? title : '未知时间';
        }
      },
      // 自定义数据项显示
      customItems: (originalItems) => {
        // 自定义每个数据项的显示
        const customItems = originalItems.map(item => {
          const { name, value, color } = item;
          // 确保值正确显示
          const formattedValue = value !== null && value !== undefined && !isNaN(value)
            ? parseFloat(value).toFixed(2)
            : '无数据';

          return {
            name,
            value: formattedValue,
            color
          };
        });
        return customItems;
      },
      // 添加事件处理函数，阻止默认日志输出
      onShow: () => {},
      onHide: () => {}
    },
    // 主题颜色
    theme: {
      colors10: ['#2E7D32', '#1890ff', '#fa8c16', '#722ed1', '#13c2c2', '#eb2f96', '#faad14', '#52c41a', '#f5222d', '#2f54eb'],
    },
    // 确保图表适应容器大小
    autoFit: true,
    // 添加交互
    interactions: [
      {
        type: 'element-active',
      },
      {
        type: 'legend-active',
      },
      {
        type: 'axis-label-highlight',
      },
    ],
  };

  // 全屏样式
  const fullscreenStyle = fullscreen ? {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1300,
    width: '100vw',
    height: '100vh',
    margin: 0,
    padding: 16,
    backgroundColor: '#fff',
  } : {};

  const { isAdmin } = useAuth();

  return (
    <Resizable
      size={{ width: trend.width || 500, height: trend.height || 400 }}
      onResizeStop={(e, direction, ref, d) => {
        onResize({
          width: trend.width + d.width,
          height: trend.height + d.height
        });
      }}
      enable={{
        top: !fullscreen && isAdmin,
        right: !fullscreen && isAdmin,
        bottom: !fullscreen && isAdmin,
        left: !fullscreen && isAdmin,
        topRight: !fullscreen && isAdmin,
        bottomRight: !fullscreen && isAdmin,
        bottomLeft: !fullscreen && isAdmin,
        topLeft: !fullscreen && isAdmin
      }}
    >
      <Paper
        elevation={3}
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          ...fullscreenStyle
        }}
      >
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 1,
          borderBottom: '1px solid #eee'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mr: 1 }}>
              {trend.title}
            </Typography>
            {lastUpdated && (
              <Typography variant="caption" color="textSecondary" sx={{ fontSize: '0.7rem' }}>
                (更新于 {moment(lastUpdated).format('HH:mm')})
              </Typography>
            )}
          </Box>
          <Box>
            <Tooltip title="刷新">
              <IconButton size="small" onClick={handleRefresh}>
                <ReloadOutlined />
              </IconButton>
            </Tooltip>
            <AdminCheck silent>
              <Tooltip title="编辑">
                <IconButton size="small" onClick={onEdit}>
                  <EditOutlined />
                </IconButton>
              </Tooltip>
              <Tooltip title="删除">
                <IconButton size="small" onClick={onDelete}>
                  <DeleteOutlined />
                </IconButton>
              </Tooltip>
            </AdminCheck>
            <Tooltip title={fullscreen ? "退出全屏" : "全屏"}>
              <IconButton size="small" onClick={toggleFullscreen}>
                {fullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        <Box sx={{ flex: 1, p: 1, position: 'relative' }}>
          {loading && data.length === 0 ? (
            <Box sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '100%'
            }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Box sx={{
              p: 2,
              bgcolor: '#ffebee',
              borderRadius: 1,
              color: '#d32f2f',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Typography variant="body2">{error}</Typography>
            </Box>
          ) : data.length === 0 ? (
            <Box sx={{
              p: 2,
              bgcolor: '#f5f5f5',
              borderRadius: 1,
              color: '#666',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Typography variant="body2">暂无数据</Typography>
            </Box>
          ) : (
            <Box sx={{ height: '100%', width: '100%', position: 'relative' }}>
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
                  <CircularProgress size={24} />
                </Box>
              )}
              <Line {...chartConfig} />
            </Box>
          )}
        </Box>

        {/* 底部信息栏已移除 */}
      </Paper>
    </Resizable>
  );
};

export default TrendChartItem;
