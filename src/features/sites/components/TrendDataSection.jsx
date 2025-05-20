import React, { useState, useEffect, useCallback } from 'react';
import {
  Card, Select, DatePicker, Button, Spin, Empty,
  Row, Col, Divider, message, Space, Typography
} from 'antd';
import { LineChartOutlined, ReloadOutlined } from '@ant-design/icons';
import moment from 'moment';
import ReactECharts from 'echarts-for-react';

const { Option } = Select;
const { RangePicker } = DatePicker;
const { Title, Text } = Typography;

/**
 * 趋势数据展示组件
 * 用于展示历史趋势数据
 */
const TrendDataSection = ({ siteId, fetchTrendData }) => {
  // 状态
  const [loading, setLoading] = useState(false);
  const [dataPoints, setDataPoints] = useState([]);
  const [selectedDataPoint, setSelectedDataPoint] = useState(null);
  const [dateRange, setDateRange] = useState([
    moment().subtract(7, 'days').startOf('day'),
    moment().endOf('day')
  ]);
  const [chartData, setChartData] = useState(null);

  // 获取可用数据点
  const fetchDataPoints = useCallback(async () => {
    try {
      setLoading(true);

      // 获取站点可用的数据点
      const response = await fetchTrendData({
        action: 'getDataPoints',
        siteId
      }, true);

      // 如果API尚未注册或不可用，使用模拟数据
      if (!response) {
        console.warn('趋势数据API不可用，使用模拟数据');
        const mockDataPoints = [
          { id: 'flow', name: '流量', unit: 'm³/h' },
          { id: 'pressure', name: '压力', unit: 'MPa' },
          { id: 'temperature', name: '温度', unit: '°C' }
        ];
        setDataPoints(mockDataPoints);
        setSelectedDataPoint(mockDataPoints[0].id);
        return;
      }

      if (Array.isArray(response)) {
        setDataPoints(response);

        // 如果有数据点，默认选择第一个
        if (response.length > 0) {
          setSelectedDataPoint(response[0].id);
        }
      }
    } catch (error) {
      console.error('获取数据点失败:', error);
      message.error('获取数据点失败');

      // 使用模拟数据
      const mockDataPoints = [
        { id: 'flow', name: '流量', unit: 'm³/h' },
        { id: 'pressure', name: '压力', unit: 'MPa' },
        { id: 'temperature', name: '温度', unit: '°C' }
      ];
      setDataPoints(mockDataPoints);
      setSelectedDataPoint(mockDataPoints[0].id);
    } finally {
      setLoading(false);
    }
  }, [siteId, fetchTrendData]);

  // 获取趋势数据
  const fetchTrendChartData = useCallback(async () => {
    if (!selectedDataPoint || !dateRange[0] || !dateRange[1]) {
      return;
    }

    try {
      setLoading(true);

      // 获取趋势数据
      const response = await fetchTrendData({
        action: 'getTrendData',
        siteId,
        dataPointId: selectedDataPoint,
        startTime: dateRange[0].format('YYYY-MM-DD HH:mm:ss'),
        endTime: dateRange[1].format('YYYY-MM-DD HH:mm:ss')
      });

      // 如果API尚未注册或不可用，使用模拟数据
      if (!response) {
        console.warn('趋势数据API不可用，使用模拟数据');

        // 生成模拟数据
        const mockData = generateMockTrendData(selectedDataPoint, dateRange);
        setChartData(mockData);
        return;
      }

      setChartData(response);
    } catch (error) {
      console.error('获取趋势数据失败:', error);
      message.error('获取趋势数据失败');

      // 生成模拟数据
      const mockData = generateMockTrendData(selectedDataPoint, dateRange);
      setChartData(mockData);
    } finally {
      setLoading(false);
    }
  }, [siteId, selectedDataPoint, dateRange, fetchTrendData]);

  // 生成模拟趋势数据
  const generateMockTrendData = (dataPointId, dateRange) => {
    const startTime = dateRange[0].valueOf();
    const endTime = dateRange[1].valueOf();
    const timeSpan = endTime - startTime;

    // 根据时间跨度确定数据点数量，最多100个点
    const pointCount = Math.min(100, Math.floor(timeSpan / (1000 * 60 * 60)) + 1);

    const times = [];
    const values = [];

    // 根据数据点ID生成不同的模拟数据
    let baseValue = 0;
    let amplitude = 0;

    switch (dataPointId) {
      case 'flow':
        baseValue = 100;
        amplitude = 20;
        break;
      case 'pressure':
        baseValue = 0.5;
        amplitude = 0.1;
        break;
      case 'temperature':
        baseValue = 25;
        amplitude = 5;
        break;
      default:
        baseValue = 50;
        amplitude = 10;
    }

    // 生成时间点和对应的值
    for (let i = 0; i < pointCount; i++) {
      const time = new Date(startTime + (i * timeSpan / pointCount));
      times.push(time.toISOString());

      // 生成带有一定随机性的值
      const randomFactor = Math.sin(i / 5) + (Math.random() - 0.5) * 0.5;
      const value = baseValue + randomFactor * amplitude;
      values.push(parseFloat(value.toFixed(2)));
    }

    return { times, values };
  };

  // 初始加载数据点
  useEffect(() => {
    fetchDataPoints();
  }, [fetchDataPoints]);

  // 当选择的数据点或日期范围变化时，获取趋势数据
  useEffect(() => {
    if (selectedDataPoint) {
      fetchTrendChartData();
    }
  }, [selectedDataPoint, dateRange, fetchTrendChartData]);

  // 处理数据点选择变化
  const handleDataPointChange = (value) => {
    setSelectedDataPoint(value);
  };

  // 处理日期范围变化
  const handleDateRangeChange = (dates) => {
    setDateRange(dates);
  };

  // 刷新数据
  const handleRefresh = () => {
    fetchTrendChartData();
  };

  // 生成图表选项
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

    // 获取选中的数据点信息
    const dataPoint = dataPoints.find(dp => dp.id === selectedDataPoint);
    const unit = dataPoint?.unit || '';

    // 格式化时间标签
    const formattedTimes = chartData.times.map(time => {
      const date = new Date(time);
      return moment(date).format('MM-DD HH:mm');
    });

    return {
      title: {
        text: dataPoint?.name || '趋势数据',
        left: 'center'
      },
      tooltip: {
        trigger: 'axis',
        formatter: function(params) {
          const time = params[0].axisValue;
          const value = params[0].data;
          return `${time}<br/>${dataPoint?.name || '值'}: ${value} ${unit}`;
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: formattedTimes,
        axisLabel: {
          rotate: 45,
          formatter: function(value) {
            return value;
          }
        }
      },
      yAxis: {
        type: 'value',
        name: unit,
        nameLocation: 'end',
        nameGap: 10,
        nameTextStyle: {
          align: 'right'
        }
      },
      series: [
        {
          name: dataPoint?.name || '数据',
          type: 'line',
          data: chartData.values,
          smooth: true,
          symbol: 'circle',
          symbolSize: 5,
          sampling: 'average',
          itemStyle: {
            color: '#1890ff'
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                {
                  offset: 0,
                  color: 'rgba(24, 144, 255, 0.3)'
                },
                {
                  offset: 1,
                  color: 'rgba(24, 144, 255, 0.1)'
                }
              ]
            }
          }
        }
      ]
    };
  };

  return (
    <Card
      title={
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <LineChartOutlined style={{ marginRight: 8, color: '#2E7D32' }} />
          <span style={{ color: '#2E7D32' }}>历史趋势数据</span>
        </div>
      }
      extra={
        <Button
          icon={<ReloadOutlined />}
          onClick={handleRefresh}
          disabled={loading}
        >
          刷新
        </Button>
      }
    >
      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Text strong>选择数据点</Text>
            <Select
              placeholder="选择数据点"
              style={{ width: '100%' }}
              value={selectedDataPoint}
              onChange={handleDataPointChange}
              loading={loading}
              disabled={loading || dataPoints.length === 0}
            >
              {dataPoints.map(point => (
                <Option key={point.id} value={point.id}>
                  {point.name} {point.unit ? `(${point.unit})` : ''}
                </Option>
              ))}
            </Select>
          </Space>
        </Col>
        <Col xs={24} md={16}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Text strong>选择时间范围</Text>
            <RangePicker
              showTime
              format="YYYY-MM-DD HH:mm"
              value={dateRange}
              onChange={handleDateRangeChange}
              style={{ width: '100%' }}
              disabled={loading}
            />
          </Space>
        </Col>
      </Row>

      <Divider />

      <div style={{ height: 400, position: 'relative' }}>
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
            background: 'rgba(255, 255, 255, 0.7)'
          }}>
            <Spin size="large" tip="加载数据中..." />
          </div>
        ) : null}

        {dataPoints.length === 0 ? (
          <Empty description="暂无可用数据点" />
        ) : chartData && chartData.values && chartData.values.length > 0 ? (
          <ReactECharts
            option={getChartOption()}
            style={{ height: '100%', width: '100%' }}
            notMerge={true}
            lazyUpdate={true}
          />
        ) : (
          <Empty description="暂无趋势数据" />
        )}
      </div>
    </Card>
  );
};

export default TrendDataSection;
