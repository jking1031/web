import React, { useState, useEffect, useCallback, useRef, memo } from 'react';
import {
  Card, Select, DatePicker, Button, Spin, Empty,
  Row, Col, Divider, message, Space, Typography, Tooltip, Drawer, Radio,
  Segmented, Slider, Switch, InputNumber, Form, Alert, Modal
} from 'antd';
import { 
  LineChartOutlined, ReloadOutlined, SettingOutlined, 
  DownloadOutlined, ZoomInOutlined, ZoomOutOutlined, FullscreenOutlined,
  FullscreenExitOutlined, InfoCircleOutlined, RedoOutlined, ExclamationCircleOutlined, CloseOutlined, SearchOutlined,
  BarChartOutlined
} from '@ant-design/icons';
import moment from 'moment';
import ReactECharts from 'echarts-for-react';
import { debounce } from 'lodash';

const { Option } = Select;
const { RangePicker } = DatePicker;
const { Text } = Typography;

// 隔离的图表组件
const TrendChart = memo(({ 
  chartData, 
  dataPoint, 
  chartSettings, 
  themeColors, 
  loading, 
  fullscreen,
  onChartReady,
  error
}) => {
  // 图表高度计算
  const getChartHeight = () => {
    return fullscreen ? 'calc(100vh - 160px)' : '100%';
  };

  // 图表配置 - 改为静态配置，不依赖外部状态
  const getChartOption = () => {
    if (!chartData || !chartData.times || !chartData.values) {
      return {
        title: {
          text: '暂无数据',
          left: 'center'
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true
        }
      };
    }

    // 获取单位
    const unit = dataPoint?.unit || '';

    // 格式化时间标签
    const formattedTimes = chartData.times.map(time => {
      const date = new Date(time);
      return moment(date).format('MM-DD HH:mm');
    });
    
    // 数据处理
    const values = chartData.values.filter(v => !isNaN(Number(v)));
    const max = values.length > 0 ? Math.max(...values) : 0;
    const min = values.length > 0 ? Math.min(...values) : 0;
    const avg = values.length > 0 ? values.reduce((sum, val) => sum + Number(val), 0) / values.length : 0;
    
    // 计算y轴范围
    let yAxisMin, yAxisMax;
    if (chartSettings.yAxisScale === 'auto' && values.length > 0) {
      const range = max - min;
      yAxisMin = Math.max(0, min - range * 0.1);
      yAxisMax = max + range * 0.1;
    }
    
    // 选择颜色方案
    const colors = themeColors[chartSettings.colorScheme] || themeColors.blue;

    // 标记点数据
    const markPoints = chartSettings.showMarkPoints ? {
      data: [
        { type: 'max', name: '最大值' },
        { type: 'min', name: '最小值' }
      ],
      symbol: 'pin',
      symbolSize: 40,
      itemStyle: {
        color: colors[0]
      }
    } : null;
    
    // 完整配置
    return {
      animation: chartSettings.animation,
      color: colors,
      title: {
        text: dataPoint?.name || '趋势数据',
        left: 'center',
        textStyle: {
          fontSize: chartSettings.fontSize + 4
        }
      },
      tooltip: {
        trigger: 'axis',
        formatter: function(params) {
          const time = params[0].axisValue;
          const value = params[0].data;
          return `${time}<br/>${dataPoint?.name || '值'}: ${value} ${unit}`;
        },
        textStyle: {
          fontSize: chartSettings.fontSize
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: chartSettings.showDataZoom ? '15%' : '8%',
        containLabel: true
      },
      toolbox: {
        feature: {
          saveAsImage: { show: true, title: '下载图表' },
          dataZoom: { show: true, title: { zoom: '区域缩放', back: '恢复缩放' } },
          restore: { show: true, title: '重置' }
        },
        right: 20,
        top: 5,
        itemSize: chartSettings.fontSize + 2,
        itemGap: 10
      },
      dataZoom: chartSettings.showDataZoom ? [
        {
          type: 'slider',
          show: true,
          start: 0,
          end: 100,
          bottom: 10
        },
        {
          type: 'inside',
          start: 0,
          end: 100
        }
      ] : [],
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: formattedTimes,
        axisLabel: {
          rotate: 45,
          formatter: function(value) {
            return value;
          },
          fontSize: chartSettings.fontSize
        }
      },
      yAxis: {
        type: 'value',
        name: unit,
        nameLocation: 'end',
        nameGap: 10,
        min: yAxisMin,
        max: yAxisMax,
        nameTextStyle: {
          align: 'right',
          fontSize: chartSettings.fontSize
        },
        axisLabel: {
          fontSize: chartSettings.fontSize,
          formatter: function(value) {
            // 格式化数据值显示
            if (value === undefined || value === null) return '-';
            
            if (typeof value !== 'number') {
              return value.toString();
            }
            
            if (value > 1000000) {
              return (value / 1000000).toFixed(2) + 'M';
            } else if (value > 1000) {
              return (value / 1000).toFixed(1) + 'k';
            } else if (Math.abs(value) < 0.01) {
              return value.toExponential(1);
            } else if (Math.abs(value) > 100) {
              return Math.round(value);
            } else {
              return value.toFixed(2);
            }
          }
        }
      },
      series: [
        {
          name: dataPoint?.name || '数据',
          type: 'line',
          data: chartData.values,
          smooth: chartSettings.smooth,
          symbol: chartSettings.showSymbols === 'always' ? 'circle' : 
                 chartSettings.showSymbols === 'never' ? 'none' : 'circle',
          symbolSize: 5,
          showSymbol: chartSettings.showSymbols === 'always',
          sampling: 'average',
          markPoint: markPoints,
          markLine: {
            data: [
              { type: 'average', name: '平均值' }
            ],
            label: {
              formatter: '{b}: {c}',
              fontSize: chartSettings.fontSize
            }
          },
          itemStyle: {
            color: colors[0]
          },
          areaStyle: chartSettings.showArea ? {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                {
                  offset: 0,
                  color: `${colors[0]}99` // 半透明主色
                },
                {
                  offset: 1,
                  color: `${colors[0]}11` // 几乎透明主色
                }
              ]
            }
          } : null
        }
      ]
    };
  };

  return (
    <div style={{ 
      height: '100%', 
      position: 'relative',
      width: '100%',
      flex: 1,
      display: 'flex',
      overflow: 'hidden'
    }}>
      {loading ? (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          background: 'rgba(255, 255, 255, 0.7)',
          zIndex: 10
        }}>
          <Spin size="large" tip="加载数据中..." />
        </div>
      ) : null}

      {error ? (
        <Alert
          message="数据加载错误"
          description={error}
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
        />
      ) : null}

      {!chartData || !chartData.times || !chartData.values || chartData.times.length === 0 ? (
        <Empty 
          description="暂无趋势数据"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          style={{ margin: 'auto' }}
        />
      ) : (
        <ReactECharts
          option={getChartOption()}
          style={{ 
            height: '100%', 
            width: '100%', 
            flex: 1,
            minHeight: '400px'
          }}
          notMerge={true}
          lazyUpdate={true}
          onChartReady={onChartReady}
          theme={chartSettings.theme === 'dark' ? 'dark' : ''}
        />
      )}
    </div>
  );
});

// 设置抽屉组件 - 单独拆分
const SettingsDrawer = memo(({ 
  visible, 
  onClose, 
  initialValues, 
  onFinish 
}) => (
  <Drawer
    title="图表设置"
    width={320}
    placement="right"
    onClose={onClose}
    open={visible}
    destroyOnClose={true}
  >
    <Form
      layout="vertical"
      initialValues={initialValues}
      onFinish={onFinish}
    >
      <Form.Item label="线条平滑" name="smooth" valuePropName="checked">
        <Switch />
      </Form.Item>
      
      <Form.Item label="显示面积" name="showArea" valuePropName="checked">
        <Switch />
      </Form.Item>
      
      <Form.Item label="数据点显示" name="showSymbols">
        <Radio.Group>
          <Radio.Button value="auto">自动</Radio.Button>
          <Radio.Button value="always">总是</Radio.Button>
          <Radio.Button value="never">隐藏</Radio.Button>
        </Radio.Group>
      </Form.Item>
      
      <Form.Item label="显示缩放控件" name="showDataZoom" valuePropName="checked">
        <Switch />
      </Form.Item>
      
      <Form.Item label="动画效果" name="animation" valuePropName="checked">
        <Switch />
      </Form.Item>
      
      <Form.Item label="标记最值点" name="showMarkPoints" valuePropName="checked">
        <Switch />
      </Form.Item>
      
      <Form.Item label="字体大小" name="fontSize">
        <Slider min={10} max={18} marks={{10: '10', 14: '14', 18: '18'}} />
      </Form.Item>
      
      <Form.Item label="颜色方案" name="colorScheme">
        <Radio.Group>
          <Radio.Button value="blue">蓝色</Radio.Button>
          <Radio.Button value="green">绿色</Radio.Button>
          <Radio.Button value="multi">多彩</Radio.Button>
        </Radio.Group>
      </Form.Item>
      
      <Form.Item label="Y轴缩放" name="yAxisScale">
        <Radio.Group>
          <Radio.Button value="auto">自动</Radio.Button>
          <Radio.Button value="fixed">固定</Radio.Button>
        </Radio.Group>
      </Form.Item>
      
      <Form.Item>
        <Button type="primary" htmlType="submit" block>
          应用设置
        </Button>
      </Form.Item>
    </Form>
  </Drawer>
));

// 数据统计信息组件
const DataStatistics = memo(({ chartData, dataPoint }) => {
  if (!chartData || !chartData.values || chartData.values.length === 0) {
    return null;
  }

  const values = chartData.values.filter(v => !isNaN(Number(v)));
  const max = values.length > 0 ? Math.max(...values) : 0;
  const min = values.length > 0 ? Math.min(...values) : 0;
  const avg = values.length > 0 ? values.reduce((sum, val) => sum + Number(val), 0) / values.length : 0;
  const unit = dataPoint?.unit || '';

  return (
    <Row gutter={16} style={{ marginBottom: 16 }}>
      <Col span={8}>
        <Card size="small">
          <Statistic 
            title="最大值" 
            value={max.toFixed(2)} 
            suffix={unit}
            valueStyle={{ color: '#3f8600' }}
          />
        </Card>
      </Col>
      <Col span={8}>
        <Card size="small">
          <Statistic 
            title="最小值" 
            value={min.toFixed(2)} 
            suffix={unit}
            valueStyle={{ color: '#cf1322' }}
          />
        </Card>
      </Col>
      <Col span={8}>
        <Card size="small">
          <Statistic 
            title="平均值" 
            value={avg.toFixed(2)} 
            suffix={unit}
            valueStyle={{ color: '#1890ff' }}
          />
        </Card>
      </Col>
    </Row>
  );
});

// 自定义统计组件
const Statistic = memo(({ title, value, suffix, valueStyle }) => (
  <div>
    <div style={{ fontSize: 14, color: 'rgba(0, 0, 0, 0.45)', marginBottom: 4 }}>{title}</div>
    <div style={{ fontSize: 24, ...valueStyle }}>
      {value}{suffix && <span style={{ fontSize: 16, marginLeft: 4 }}>{suffix}</span>}
    </div>
  </div>
));

/**
 * 增强版趋势数据展示组件
 * 用于展示历史趋势数据，支持更多交互和可视化选项
 */
const TrendDataSection = ({ siteId, fetchTrendData }) => {
  // 基础状态
  const [loading, setLoading] = useState(false);
  const [dataPoints, setDataPoints] = useState([]);
  const [selectedDataPoint, setSelectedDataPoint] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [error, setError] = useState(null);
  
  // 数据采样相关状态
  const [dataSamplingModalVisible, setDataSamplingModalVisible] = useState(false);
  const [dataSamplingInterval, setDataSamplingInterval] = useState('auto');
  const [originalData, setOriginalData] = useState(null);
  
  // 使用ref存储当前选择的时间预设
  const [currentTimePreset, setCurrentTimePreset] = useState('7days');
  
  // 使用ref存储日期范围，避免状态更新导致的重渲染
  const dateRangeRef = useRef([
    moment().subtract(7, 'days').startOf('day'),
    moment().endOf('day')
  ]);
  
  // 数据点阈值常量
  const DATA_POINTS_THRESHOLD = 1000; // 超过1000个数据点时提示
  const DATA_POINTS_WARNING = 5000;   // 超过5000个数据点时强制采样
  
  // 数据采样间隔选项
  const samplingIntervalOptions = [
    { label: '自动', value: 'auto', description: '根据数据量自动选择合适的间隔' },
    { label: '1分钟', value: '1m', description: '每分钟采样一个点' },
    { label: '5分钟', value: '5m', description: '每5分钟采样一个点' },
    { label: '15分钟', value: '15m', description: '每15分钟采样一个点' },
    { label: '30分钟', value: '30m', description: '每30分钟采样一个点' },
    { label: '1小时', value: '1h', description: '每小时采样一个点' },
    { label: '2小时', value: '2h', description: '每2小时采样一个点' },
    { label: '6小时', value: '6h', description: '每6小时采样一个点' },
    { label: '12小时', value: '12h', description: '每12小时采样一个点' },
    { label: '1天', value: '1d', description: '每天采样一个点' },
  ];
  
  // 使用useRef替代部分useState，减少重渲染
  const chartInstance = useRef(null);
  const chartSettingsRef = useRef({
    smooth: true,
    showArea: true,
    showSymbols: 'auto',
    showDataZoom: true,
    theme: 'default',
    animation: true,
    fontSize: 12,
    showMarkPoints: true,
    colorScheme: 'blue',
    yAxisScale: 'auto'
  });
  
  // 图表主题颜色
  const themeColors = {
    blue: ['#1890ff', '#69c0ff', '#40a9ff', '#096dd9', '#0050b3'],
    green: ['#52c41a', '#95de64', '#389e0d', '#73d13d', '#237804'],
    multi: ['#1890ff', '#52c41a', '#fa8c16', '#722ed1', '#eb2f96']
  };

  // 常用时间段配置
  const timePresets = [
    { label: '今天', value: 'today', range: [moment().startOf('day'), moment()] },
    { label: '昨天', value: 'yesterday', range: [moment().subtract(1, 'days').startOf('day'), moment().subtract(1, 'days').endOf('day')] },
    { label: '近7天', value: '7days', range: [moment().subtract(7, 'days').startOf('day'), moment()] },
    { label: '近30天', value: '30days', range: [moment().subtract(30, 'days').startOf('day'), moment()] },
    { label: '本月', value: 'thisMonth', range: [moment().startOf('month'), moment()] }
  ];
  
  // 引用
  const fetchCountRef = useRef(0);

  // 全屏相关引用
  const chartContainerRef = useRef(null);

  // 数据采样处理函数 - 根据间隔对数据进行采样
  const sampleData = useCallback((data, interval) => {
    if (!data || !data.times || !data.values) return data;
    
    // 如果数据点不多，直接返回原始数据
    if (data.times.length <= DATA_POINTS_THRESHOLD) return data;
    
    console.log(`原始数据点数量: ${data.times.length}, 采样间隔: ${interval}`);
    
    let samplingStep = 1; // 默认不采样
    
    // 根据间隔计算采样步长
    if (interval === 'auto') {
      // 自动计算，保持在1000个数据点以内
      samplingStep = Math.max(1, Math.ceil(data.times.length / 1000));
    } else {
      // 解析间隔设置
      const value = parseInt(interval.slice(0, -1), 10);
      const unit = interval.slice(-1);
      
      // 估计平均时间间隔 (假设数据均匀分布)
      const startTime = new Date(data.times[0]).getTime();
      const endTime = new Date(data.times[data.times.length - 1]).getTime();
      const totalMinutes = (endTime - startTime) / (60 * 1000);
      const avgIntervalMinutes = totalMinutes / (data.times.length - 1);
      
      // 将目标间隔转换为分钟
      let targetMinutes = value;
      if (unit === 'h') targetMinutes = value * 60;
      else if (unit === 'd') targetMinutes = value * 24 * 60;
      
      // 计算采样步长
      samplingStep = Math.max(1, Math.round(targetMinutes / avgIntervalMinutes));
    }
    
    // 执行采样
    const sampledTimes = [];
    const sampledValues = [];
    
    for (let i = 0; i < data.times.length; i += samplingStep) {
      sampledTimes.push(data.times[i]);
      sampledValues.push(data.values[i]);
    }
    
    console.log(`采样后数据点数量: ${sampledTimes.length}, 采样步长: ${samplingStep}`);
    
    return {
      times: sampledTimes,
      values: sampledValues,
      originalLength: data.times.length,
      samplingRate: samplingStep
    };
  }, [DATA_POINTS_THRESHOLD]);

  // 生成模拟趋势数据 - 用于API不可用时
  const generateMockTrendData = useCallback((dataPointId, dateRange) => {
    const startTime = dateRange[0].toDate();
    const endTime = dateRange[1].toDate();
    const hoursDiff = Math.round((endTime - startTime) / (1000 * 60 * 60));
    
    const times = [];
    const values = [];
    
    // 生成基准值 - 根据数据点ID生成不同的基准值，使不同指标有差异
    let baseValue = 50;
    if (dataPointId) {
      // 使用数据点ID的哈希值生成不同的基准值
      const hash = dataPointId.split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0);
        return a & a;
      }, 0);
      baseValue = Math.abs(hash % 100) + 20; // 20-120之间的值
    }
    
    // 生成带周期性波动的数据
    let currentTime = new Date(startTime);
    let lastValue = baseValue + (Math.random() - 0.5) * 10;
    
    for (let i = 0; i <= hoursDiff; i++) {
      times.push(currentTime.toISOString());
      
      const hour = currentTime.getHours();
      const day = currentTime.getDay(); // 0-6, 0是周日
      
      // 添加日周期和周周期波动
      const dayFactor = Math.sin((hour / 24) * Math.PI * 2) * 0.2 + 1; // 日内波动
      const weekFactor = Math.sin((day / 7 + hour / 168) * Math.PI * 2) * 0.1 + 1; // 周内波动
      const randomFactor = (Math.random() - 0.5) * 0.05;
      
      const randomChange = (Math.random() - 0.5) * (baseValue * 0.03);
      lastValue = lastValue * 0.9 + (baseValue * dayFactor * weekFactor * (1 + randomFactor)) * 0.1 + randomChange;
      
      values.push(Math.max(0, Number(lastValue.toFixed(2))));
      
      currentTime = new Date(currentTime.getTime() + 60 * 60 * 1000);
    }
    
    return { times, values };
  }, []);

  // 获取数据点列表
  const fetchDataPoints = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // 获取站点可用的数据点
      const response = await fetchTrendData({
        action: 'getDataPoints',
        siteId
      }, true);

      console.log('数据点API响应:', response);

      if (!response) {
        console.warn('趋势数据API不可用，使用模拟数据');
        const mockDataPoints = [
          { id: 'gt_in_lj', name: '进水流量', unit: 'm³/h' },
          { id: 'gt_out_lj', name: '出水流量', unit: 'm³/h' },
          { id: 'gt_in_nh3', name: '进水氨氮', unit: 'mg/L' },
          { id: 'gt_out_nh3', name: '出水氨氮', unit: 'mg/L' },
          { id: 'gt_out_tn', name: '出水总氮', unit: 'mg/L' },
        ];
        setDataPoints(mockDataPoints);
        setSelectedDataPoint(mockDataPoints[0].id);
        return;
      }

      // 处理API返回的数据点格式
      let dataPointsArray = null;
      
      // 情况1: 直接返回数组格式
      if (Array.isArray(response)) {
        dataPointsArray = response;
        console.log('成功获取数据点列表(数组格式):', response);
      } 
      // 情况2: 包含在对象的某个属性中
      else if (response && typeof response === 'object') {
        // 尝试从response对象中找到数据点数组
        const possibleArrays = Object.values(response).filter(val => 
          Array.isArray(val) && val.length > 0 && val[0] && typeof val[0] === 'object'
        );
        
        for (const arr of possibleArrays) {
          // 验证数组中的元素是否符合数据点格式 (至少有id属性)
          if (arr.length > 0 && arr[0] && typeof arr[0] === 'object' && 'id' in arr[0]) {
            dataPointsArray = arr;
            console.log('从对象中提取数据点列表:', arr);
            break;
          }
        }
        
        // 如果response.data是数组，尝试使用它
        if (!dataPointsArray && response.data && Array.isArray(response.data)) {
          dataPointsArray = response.data;
          console.log('使用response.data作为数据点列表:', response.data);
        }
      }

      // 确认我们找到了数据点数组
      if (dataPointsArray && dataPointsArray.length > 0) {
        // 验证每个数据点是否有必要的字段
        const validDataPoints = dataPointsArray.filter(dp => 
          dp && typeof dp === 'object' && dp.id && 
          (dp.name || dp.title || dp.label) // 支持不同名称的标签字段
        );

        if (validDataPoints.length > 0) {
          // 标准化数据点格式
          const standardizedDataPoints = validDataPoints.map(dp => ({
            id: dp.id,
            name: dp.name || dp.title || dp.label || dp.id,
            unit: dp.unit || dp.unitLabel || ''
          }));
          
          console.log('标准化后的数据点列表:', standardizedDataPoints);
          setDataPoints(standardizedDataPoints);
          setSelectedDataPoint(standardizedDataPoints[0].id);
          return;
        }
      }
      
      // 如果未找到有效数据点数组，抛出错误
      throw new Error('无法从API响应中提取有效的数据点列表');
      
    } catch (error) {
      console.error('获取数据点失败:', error);
      setError(`获取数据点失败: ${error.message || '未知错误'}`);

      // 使用模拟数据作为备选
      const mockDataPoints = [
        { id: 'gt_in_lj', name: '进水流量', unit: 'm³/h' },
        { id: 'gt_out_lj', name: '出水流量', unit: 'm³/h' },
        { id: 'gt_in_nh3', name: '进水氨氮', unit: 'mg/L' },
        { id: 'gt_out_nh3', name: '出水氨氮', unit: 'mg/L' },
        { id: 'gt_out_tn', name: '出水总氮', unit: 'mg/L' },
      ];
      setDataPoints(mockDataPoints);
      setSelectedDataPoint(mockDataPoints[0].id);
    } finally {
      setLoading(false);
    }
  }, [siteId, fetchTrendData]);

  // 获取趋势数据 - 修改为使用ref中的日期范围并添加数据量检查
  const fetchTrendChartData = async () => {
    if (!selectedDataPoint) {
      message.warning('请选择数据点');
      return;
    }
    
    const currentDateRange = dateRangeRef.current;
    
    if (!currentDateRange || !currentDateRange[0] || !currentDateRange[1]) {
      message.warning('请选择有效的时间范围');
      return;
    }
    
    // 重置错误状态
    setError(null);

    try {
      setLoading(true);
      fetchCountRef.current++;

      console.log(`获取趋势数据: ${selectedDataPoint} - ${currentDateRange[0].format('YYYY-MM-DD')} 到 ${currentDateRange[1].format('YYYY-MM-DD')}`);

      const response = await fetchTrendData({
        action: 'getTrendData',
        siteId,
        dataPointId: selectedDataPoint,
        startTime: currentDateRange[0].format('YYYY-MM-DD HH:mm:ss'),
        endTime: currentDateRange[1].format('YYYY-MM-DD HH:mm:ss')
      });

      console.log('趋势数据API响应:', response);

      if (!response) {
        console.warn('趋势数据API不可用，使用模拟数据');
        const mockData = generateMockTrendData(selectedDataPoint, currentDateRange);
        processReceivedData(mockData);
        return;
      }

      // 处理不同格式的API响应
      let processedData = null;
      
      // 情况1: 标准times/values格式
      if (response.times && response.values && 
          Array.isArray(response.times) && Array.isArray(response.values)) {
        processedData = {
          times: response.times,
          values: response.values.map(v => Number(v))
        };
      }
      // 情况2: 数组格式，每个元素包含时间和值
      else if (Array.isArray(response)) {
        // 检查数组元素是否为对象格式
        if (response.length > 0 && typeof response[0] === 'object') {
          // 尝试找出时间和值的字段名
          const firstItem = response[0];
          const timeField = Object.keys(firstItem).find(key => 
            key === 'time' || key === 'timestamp' || key === 'date' || 
            firstItem[key] instanceof Date || 
            (typeof firstItem[key] === 'string' && 
              (firstItem[key].includes('-') || firstItem[key].includes('/') || /^\d+$/.test(firstItem[key])))
          );
          
          const valueField = Object.keys(firstItem).find(key => 
            key !== timeField && 
            (key === 'value' || key === 'val' || typeof firstItem[key] === 'number')
          );
          
          if (timeField && valueField) {
            const times = response.map(item => item[timeField]);
            const values = response.map(item => Number(item[valueField]));
            processedData = { times, values };
          }
        }
      }
      // 情况3: 嵌套对象，尝试找到数据
      else if (typeof response === 'object') {
        // 尝试从对象中找到数据数组
        let dataArray = null;
        
        // 常见的数据字段名
        const dataFields = ['data', 'result', 'results', 'values', 'trendData'];
        for (const field of dataFields) {
          if (response[field]) {
            if (Array.isArray(response[field])) {
              dataArray = response[field];
              break;
            } else if (typeof response[field] === 'object') {
              // 检查是否是times/values格式
              if (response[field].times && response[field].values) {
                processedData = {
                  times: response[field].times,
                  values: response[field].values.map(v => Number(v))
                };
                break;
              }
            }
          }
        }
        
        // 如果找到了数据数组但还没有处理成processedData
        if (dataArray && !processedData) {
          // 尝试从数组中提取时间和值
          if (dataArray.length > 0 && typeof dataArray[0] === 'object') {
            const firstItem = dataArray[0];
            const timeField = Object.keys(firstItem).find(key => 
              key === 'time' || key === 'timestamp' || key === 'date' || 
              (typeof firstItem[key] === 'string' && 
                (firstItem[key].includes('-') || firstItem[key].includes('/')))
            );
            
            const valueField = Object.keys(firstItem).find(key => 
              key !== timeField && 
              (key === 'value' || key === 'val' || typeof firstItem[key] === 'number')
            );
            
            if (timeField && valueField) {
              const times = dataArray.map(item => item[timeField]);
              const values = dataArray.map(item => Number(item[valueField]));
              processedData = { times, values };
            }
          }
        }
      }
      
      // 如果所有尝试都失败，使用模拟数据
      if (!processedData || !processedData.times || !processedData.values || 
          processedData.times.length === 0 || processedData.values.length === 0) {
        console.warn('无法解析趋势数据格式，使用模拟数据');
        const mockData = generateMockTrendData(selectedDataPoint, currentDateRange);
        processReceivedData(mockData);
        return;
      }

      // 确保时间格式一致
      processedData.times = processedData.times.map(time => {
        if (typeof time !== 'string') {
          return new Date(time).toISOString();
        }
        if (/^\d+$/.test(time)) {
          return new Date(parseInt(time)).toISOString();
        }
        return time;
      });
      
      // 确保值是数字
      processedData.values = processedData.values.map(value => {
        if (typeof value === 'string') {
          return Number(value);
        }
        return value;
      });
      
      console.log('处理后的趋势数据:', processedData);
      processReceivedData(processedData);
      
    } catch (error) {
      console.error('获取趋势数据失败:', error);
      setError(`获取趋势数据失败: ${error.message || '未知错误'}`);
      message.error(`获取趋势数据失败: ${error.message || '未知错误'}`);

      // 仍然使用模拟数据
      const mockData = generateMockTrendData(selectedDataPoint, currentDateRange);
      processReceivedData(mockData);
    } finally {
      setLoading(false);
    }
  };

  // 处理接收到的数据 - 检查数据量并进行采样或显示提示
  const processReceivedData = useCallback((data) => {
    if (!data || !data.times || !data.values) {
      setChartData(null);
      setOriginalData(null);
      return;
    }
    
    // 保存原始数据
    setOriginalData(data);

    // 检查数据点数量
    const dataPointCount = data.times.length;
    console.log(`数据点数量: ${dataPointCount}`);
    
    if (dataPointCount > DATA_POINTS_WARNING) {
      // 超过警告阈值，强制采样
      message.warning(`数据点数量(${dataPointCount})超过安全阈值，已自动采样以提高性能`);
      const sampledData = sampleData(data, 'auto');
      setChartData(sampledData);
      setDataSamplingInterval('auto');
      
    } else if (dataPointCount > DATA_POINTS_THRESHOLD) {
      // 超过提示阈值，显示采样选择对话框
      message.info(`数据点数量(${dataPointCount})较多，可能影响性能`);
      setChartData(data); // 先显示完整数据
      setDataSamplingModalVisible(true);
      
    } else {
      // 数据量正常，直接显示
      setChartData(data);
    }
  }, [sampleData, DATA_POINTS_THRESHOLD, DATA_POINTS_WARNING]);

  // 处理数据采样间隔变更
  const handleSamplingIntervalChange = useCallback((interval) => {
    setDataSamplingInterval(interval);
    
    if (originalData) {
      const sampledData = sampleData(originalData, interval);
      setChartData(sampledData);
    }

    setDataSamplingModalVisible(false);
  }, [originalData, sampleData]);

  // 组件挂载时获取数据点
  useEffect(() => {
    fetchDataPoints();
    
    // 初始化时间预设
    handleTimePresetChange('7days');
  }, [fetchDataPoints]);

  // 当数据点改变时重置图表数据
  useEffect(() => {
    if (selectedDataPoint) {
      setChartData(null);
      setOriginalData(null);
    }
  }, [selectedDataPoint]);

  // 清理函数 - 防止内存泄漏
  useEffect(() => {
    return () => {
      // 清理图表实例
      if (chartInstance.current) {
        chartInstance.current.dispose && chartInstance.current.dispose();
      }
      
      // 退出全屏模式
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(err => {
          console.error('退出全屏时出错:', err);
        });
      }
    };
  }, []);

  // 添加全屏状态变更监听
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

  // 添加图表大小调整监听
  useEffect(() => {
    // 当全屏状态变化时，延迟一下再调整图表大小
    if (chartInstance.current) {
      setTimeout(() => {
        chartInstance.current.resize && chartInstance.current.resize();
      }, 300);
    }
  }, [fullscreen]);

  // 切换全屏 - 使用浏览器的Fullscreen API
  const toggleFullscreen = () => {
    if (!chartContainerRef.current) return;
    
    if (!document.fullscreenElement) {
      // 进入全屏 - 整个卡片进入全屏
      chartContainerRef.current.requestFullscreen().catch(err => {
        message.error(`无法进入全屏模式: ${err.message}`);
      });
    } else {
      // 退出全屏
      document.exitFullscreen().catch(err => {
        message.error(`无法退出全屏模式: ${err.message}`);
      });
    }
  };

  // 刷新数据
  const handleRefresh = () => {
    fetchTrendChartData();
  };

  // 处理时间预设选择 - 修改为使用ref
  const handleTimePresetChange = (preset) => {
    const selectedPreset = timePresets.find(p => p.value === preset);
    if (selectedPreset) {
      // 更新ref和当前预设
      dateRangeRef.current = selectedPreset.range;
      setCurrentTimePreset(preset);
      
      console.log(`已选择时间预设: ${selectedPreset.label}, 范围: ${selectedPreset.range[0].format('YYYY-MM-DD HH:mm')} 到 ${selectedPreset.range[1].format('YYYY-MM-DD HH:mm')}`);
    }
  };

  // 自定义日期选择方法
  const handleCustomDateSelect = (dates) => {
    if (dates && dates.length === 2) {
      // 更新ref和显示值
      dateRangeRef.current = dates;
    }
  };

  // 应用图表设置
  const handleApplySettings = (values) => {
    chartSettingsRef.current = values;
    setSettingsVisible(false);
    
    // 设置变更后，图表需要重新渲染
    setTimeout(() => {
      if (chartInstance.current) {
        chartInstance.current.resize && chartInstance.current.resize();
        }
    }, 100);
  };

  // 获取当前选中的数据点
  const getSelectedDataPointInfo = () => {
    return dataPoints.find(dp => dp.id === selectedDataPoint) || null;
  };

  // 处理图表初始化
  const handleChartReady = (chart) => {
    chartInstance.current = chart;
  };

  // 修改导出数据函数，支持从任意视图导出
  const handleExportData = () => {
    if (!chartData || !chartData.times || !chartData.values) {
      message.error('暂无数据可导出');
      return;
    }

    try {
      // 获取数据点名称和单位
      const pointName = getSelectedDataPointInfo()?.name || '趋势数据';
      const unit = getSelectedDataPointInfo()?.unit || '';

      // 格式化时间
    const formattedTimes = chartData.times.map(time => {
      const date = new Date(time);
        return moment(date).format('YYYY-MM-DD HH:mm:ss');
    });

      // 创建CSV数据
      let csvContent = `时间,${pointName}(${unit})\n`;
      formattedTimes.forEach((time, index) => {
        csvContent += `${time},${chartData.values[index]}\n`;
      });

      // 创建下载链接
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${pointName}-${moment().format('YYYYMMDDHHmmss')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      message.success('数据导出成功');
    } catch (error) {
      console.error('导出数据失败:', error);
      message.error('导出数据失败');
    }
  };

  return (
    <div className="trend-data-section">
    <Card
      title={
        <div style={{ display: 'flex', alignItems: 'center' }}>
            <LineChartOutlined style={{ marginRight: 8, fontSize: 18 }} />
            <span>历史趋势数据</span>
        </div>
      }
      extra={
          <Space>
            <Tooltip title="刷新数据">
        <Button
          icon={<ReloadOutlined />}
          onClick={handleRefresh}
                loading={loading}
                size="small"
              />
            </Tooltip>

            <Tooltip title="导出数据">
              <Button
                icon={<DownloadOutlined />}
                onClick={handleExportData}
                size="small"
                disabled={!chartData || !chartData.times || chartData.times.length === 0}
              />
            </Tooltip>

            <Tooltip title={fullscreen ? '退出全屏' : '全屏显示'}>
              <Button
                icon={fullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
                onClick={toggleFullscreen}
                size="small"
              />
            </Tooltip>
          </Space>
        }
        bordered={false}
        className={fullscreen ? 'trend-chart-fullscreen' : ''}
        style={{ 
          width: '100%',
          margin: 0,
          position: 'relative',
          height: fullscreen ? '100vh' : '600px',
          display: 'flex',
          flexDirection: 'column',
          ...(fullscreen ? {
            padding: '20px',
            boxSizing: 'border-box',
            background: '#fff'
          } : {})
        }}
        bodyStyle={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column', 
          padding: '16px',
          height: 'calc(100% - 56px)', 
          overflow: 'hidden'
        }}
        ref={chartContainerRef}
      >
        {!fullscreen && (
          <div style={{ marginBottom: 16 }}>
            <Row gutter={16} align="middle">
              <Col xs={24} md={8} lg={5}>
            <Select
                  placeholder="请选择数据点"
              style={{ width: '100%' }}
              loading={loading}
                  value={selectedDataPoint}
                  onChange={setSelectedDataPoint}
                  disabled={loading}
            >
              {dataPoints.map(point => (
                <Option key={point.id} value={point.id}>
                      {point.name}
                </Option>
              ))}
            </Select>
        </Col>
              <Col xs={24} md={8} lg={6}>
                <Radio.Group
                  options={timePresets.map(preset => ({ label: preset.label, value: preset.value }))}
                  onChange={(e) => handleTimePresetChange(e.target.value)}
                  value={currentTimePreset}
                  optionType="button"
                  buttonStyle="solid"
                  size="small"
                  style={{ marginRight: 8 }}
                  disabled={loading}
                />
              </Col>
              <Col xs={24} md={8} lg={8}>
            <RangePicker
                  showTime={{ format: 'HH:mm' }}
              format="YYYY-MM-DD HH:mm"
                  value={dateRangeRef.current}
                  onChange={handleCustomDateSelect}
                  disabled={currentTimePreset !== 'custom' || loading}
              style={{ width: '100%' }}
                />
              </Col>
              <Col xs={24} md={24} lg={5} style={{ textAlign: 'right' }}>
                <Space>
                  <Button 
                    type="primary" 
                    onClick={fetchTrendChartData} 
                    loading={loading}
                    icon={<SearchOutlined />}
                  >
                    查询
                  </Button>
                  <Tooltip title="更多设置">
                    <Button
                      icon={<SettingOutlined />}
                      onClick={() => setSettingsVisible(true)}
                    />
                  </Tooltip>
          </Space>
        </Col>
      </Row>
          </div>
        )}

          <div style={{
          flex: 1, 
          height: '100%',
          padding: fullscreen ? '16px' : 0,
          backgroundColor: fullscreen ? '#fff' : 'transparent',
          borderRadius: '4px',
          transition: 'all 0.3s ease-in-out',
          position: 'relative',
            display: 'flex',
          overflow: 'hidden'
        }}>
          {error ? (
            <Alert
              message="加载失败"
              description={error}
              type="error"
              showIcon
              style={{ marginBottom: 16 }}
          />
        ) : (
            <>
              {/* 图表视图 */}
              <TrendChart
                chartData={chartData}
                dataPoint={getSelectedDataPointInfo()}
                chartSettings={chartSettingsRef.current}
                themeColors={themeColors}
                loading={loading}
                fullscreen={fullscreen}
                onChartReady={handleChartReady}
                error={error}
              />
            </>
        )}
      </div>

        {!fullscreen && <DataStatistics chartData={chartData} dataPoint={getSelectedDataPointInfo()} />}
    </Card>

      {/* 全屏模式下的控制面板 */}
      {fullscreen && (
        <div style={{
          position: 'absolute',
          top: 70,
          left: 20,
          zIndex: 1000,
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          padding: '16px',
          borderRadius: '4px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
          width: '300px'
        }}>
          <div style={{ marginBottom: 16 }}>
            <Select
              placeholder="请选择数据点"
              style={{ width: '100%', marginBottom: 12 }}
              loading={loading}
              value={selectedDataPoint}
              onChange={setSelectedDataPoint}
              disabled={loading}
            >
              {dataPoints.map(point => (
                <Option key={point.id} value={point.id}>
                  {point.name}
                </Option>
              ))}
            </Select>
            
            <Radio.Group
              options={timePresets.map(preset => ({ label: preset.label, value: preset.value }))}
              onChange={(e) => handleTimePresetChange(e.target.value)}
              value={currentTimePreset}
              optionType="button"
              buttonStyle="solid"
              size="small"
              style={{ marginBottom: 12, width: '100%', display: 'flex', flexWrap: 'wrap' }}
              disabled={loading}
            />
            
            {currentTimePreset === 'custom' && (
              <RangePicker
                showTime={{ format: 'HH:mm' }}
                format="YYYY-MM-DD HH:mm"
                value={dateRangeRef.current}
                onChange={handleCustomDateSelect}
                style={{ width: '100%', marginBottom: 12 }}
              />
            )}
            
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <Button 
                type="primary" 
                onClick={fetchTrendChartData} 
                loading={loading}
                icon={<SearchOutlined />}
                style={{ flex: 1 }}
              >
                查询
              </Button>
              <Button
                onClick={handleExportData}
                icon={<DownloadOutlined />}
                disabled={!chartData || !chartData.times || chartData.times.length === 0}
              />
              <Button
                icon={<FullscreenExitOutlined />}
                onClick={toggleFullscreen}
              />
            </div>
          </div>

          <Divider style={{ margin: '12px 0' }} />
          
          <div style={{ marginBottom: 16 }}>
            <DataStatistics chartData={chartData} dataPoint={getSelectedDataPointInfo()} />
          </div>
        </div>
      )}

      {/* 设置抽屉 */}
      <Drawer
        title="图表设置"
        placement="right"
        onClose={() => setSettingsVisible(false)}
        visible={settingsVisible}
        width={320}
      >
        <Form
          layout="vertical"
          initialValues={chartSettingsRef.current}
          onFinish={handleApplySettings}
        >
          <Form.Item label="线条平滑" name="smooth" valuePropName="checked">
            <Switch />
          </Form.Item>
          
          <Form.Item label="显示面积" name="showArea" valuePropName="checked">
            <Switch />
          </Form.Item>
          
          <Form.Item label="数据点显示" name="showSymbols">
            <Radio.Group>
              <Radio.Button value="auto">自动</Radio.Button>
              <Radio.Button value="always">总是</Radio.Button>
              <Radio.Button value="never">隐藏</Radio.Button>
            </Radio.Group>
          </Form.Item>
          
          <Form.Item label="显示缩放控件" name="showDataZoom" valuePropName="checked">
            <Switch />
          </Form.Item>
          
          <Form.Item label="动画效果" name="animation" valuePropName="checked">
            <Switch />
          </Form.Item>
          
          <Form.Item label="标记最值点" name="showMarkPoints" valuePropName="checked">
            <Switch />
          </Form.Item>
          
          <Form.Item label="字体大小" name="fontSize">
            <Slider min={10} max={18} marks={{10: '10', 14: '14', 18: '18'}} />
          </Form.Item>
          
          <Form.Item label="颜色方案" name="colorScheme">
            <Radio.Group>
              <Radio.Button value="blue">蓝色</Radio.Button>
              <Radio.Button value="green">绿色</Radio.Button>
              <Radio.Button value="multi">多彩</Radio.Button>
            </Radio.Group>
          </Form.Item>
          
          <Form.Item label="Y轴缩放" name="yAxisScale">
            <Radio.Group>
              <Radio.Button value="auto">自动</Radio.Button>
              <Radio.Button value="fixed">固定</Radio.Button>
            </Radio.Group>
          </Form.Item>
          
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              应用设置
            </Button>
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
};

// 添加全局样式
const style = document.createElement('style');
style.textContent = `
  .trend-chart-fullscreen {
    z-index: 9999;
  }
  
  .trend-data-section {
    height: 600px;
    display: flex;
    flex-direction: column;
    width: 100%;
    overflow: hidden;
  }
  
  :fullscreen {
    background-color: white;
    padding: 20px;
    overflow: auto;
  }
  
  :-webkit-full-screen {
    background-color: white;
    padding: 20px;
    overflow: auto;
  }
`;
document.head.appendChild(style);

export default memo(TrendDataSection);
