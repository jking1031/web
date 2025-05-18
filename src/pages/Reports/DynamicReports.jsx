import React, { useState, useEffect } from 'react';
import { Card, Table, Button, DatePicker, Select, Input, Space, Row, Col, message, Typography, Tabs, Modal, Form, Checkbox, Radio, Spin } from 'antd';
import { SearchOutlined, FileExcelOutlined, BarChartOutlined, LineChartOutlined, PieChartOutlined, DownloadOutlined, ReloadOutlined } from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';
import ReactECharts from 'echarts-for-react';
import styles from './Reports.module.scss';

const { RangePicker } = DatePicker;
const { Option } = Select;
const { Title, Text } = Typography;
const { TabPane } = Tabs;

/**
 * 动态报表组件
 * @returns {JSX.Element} 动态报表页面
 */
const DynamicReports = () => {
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState([]);
  const [dateRange, setDateRange] = useState([dayjs().subtract(30, 'days'), dayjs()]);
  const [reportType, setReportType] = useState('water_quality');
  const [chartType, setChartType] = useState('line');
  const [selectedMetrics, setSelectedMetrics] = useState(['cod', 'nh3n', 'tp']);
  const [sites, setSites] = useState([]);
  const [selectedSite, setSelectedSite] = useState(null);
  const [chartVisible, setChartVisible] = useState(false);
  const [chartOptions, setChartOptions] = useState({});

  // 加载站点列表
  useEffect(() => {
    const fetchSites = async () => {
      try {
        const response = await axios.get('https://nodered.jzz77.cn:9003/api/sites');
        if (response.data) {
          setSites(response.data);
          if (response.data.length > 0) {
            setSelectedSite(response.data[0].id);
          }
        }
      } catch (error) {
        console.error('获取站点列表失败:', error);
        // 使用模拟数据
        const mockSites = [
          { id: 1, name: '华北水厂' },
          { id: 2, name: '东方水处理厂' },
          { id: 3, name: '西部污水处理中心' },
          { id: 4, name: '南方水厂' },
        ];
        setSites(mockSites);
        setSelectedSite(mockSites[0].id);
      }
    };
    
    fetchSites();
  }, []);

  // 加载报表数据
  useEffect(() => {
    if (selectedSite) {
      fetchReportData();
    }
  }, [dateRange, reportType, selectedSite]);

  // 获取报表数据
  const fetchReportData = async () => {
    if (!dateRange || dateRange.length !== 2 || !selectedSite) return;
    
    setLoading(true);
    try {
      const startDate = dateRange[0].format('YYYY-MM-DD');
      const endDate = dateRange[1].format('YYYY-MM-DD');
      
      let url = 'https://nodered.jzz77.cn:9003/api/reports/dynamic';
      const params = { 
        start_date: startDate, 
        end_date: endDate,
        report_type: reportType,
        site_id: selectedSite
      };
      
      const response = await axios.get(url, { params });
      
      if (response.data) {
        setReportData(response.data);
      }
    } catch (error) {
      console.error('获取报表数据失败:', error);
      message.error('获取报表数据失败');
      
      // 使用模拟数据
      generateMockData();
    } finally {
      setLoading(false);
    }
  };

  // 生成模拟数据
  const generateMockData = () => {
    const mockData = [];
    const startDate = dateRange[0];
    const endDate = dateRange[1];
    const daysDiff = endDate.diff(startDate, 'day');
    
    for (let i = 0; i <= daysDiff; i++) {
      const currentDate = startDate.add(i, 'day').format('YYYY-MM-DD');
      
      if (reportType === 'water_quality') {
        mockData.push({
          date: currentDate,
          cod: Math.floor(Math.random() * 50) + 20,
          nh3n: Math.floor(Math.random() * 10) + 1,
          tp: (Math.random() * 2 + 0.1).toFixed(2),
          tn: Math.floor(Math.random() * 15) + 5,
          ss: Math.floor(Math.random() * 30) + 10,
        });
      } else if (reportType === 'flow') {
        mockData.push({
          date: currentDate,
          inflow: Math.floor(Math.random() * 2000) + 3000,
          outflow: Math.floor(Math.random() * 1800) + 2800,
        });
      } else if (reportType === 'energy') {
        mockData.push({
          date: currentDate,
          electricity: Math.floor(Math.random() * 500) + 1000,
          chemical: Math.floor(Math.random() * 200) + 300,
        });
      }
    }
    
    setReportData(mockData);
  };

  // 处理日期范围变化
  const handleDateRangeChange = (dates) => {
    setDateRange(dates);
  };

  // 处理报表类型变化
  const handleReportTypeChange = (value) => {
    setReportType(value);
    
    // 根据报表类型设置默认指标
    if (value === 'water_quality') {
      setSelectedMetrics(['cod', 'nh3n', 'tp']);
    } else if (value === 'flow') {
      setSelectedMetrics(['inflow', 'outflow']);
    } else if (value === 'energy') {
      setSelectedMetrics(['electricity', 'chemical']);
    }
  };

  // 处理站点选择变化
  const handleSiteChange = (value) => {
    setSelectedSite(value);
  };

  // 处理指标选择变化
  const handleMetricsChange = (checkedValues) => {
    setSelectedMetrics(checkedValues);
  };

  // 处理图表类型变化
  const handleChartTypeChange = (e) => {
    setChartType(e.target.value);
  };

  // 生成图表
  const generateChart = () => {
    if (reportData.length === 0 || selectedMetrics.length === 0) {
      message.warning('没有数据可以生成图表');
      return;
    }
    
    const dates = reportData.map(item => item.date);
    const series = selectedMetrics.map(metric => {
      return {
        name: getMetricName(metric),
        type: chartType,
        data: reportData.map(item => item[metric]),
      };
    });
    
    const options = {
      title: {
        text: getReportTitle(),
      },
      tooltip: {
        trigger: 'axis',
      },
      legend: {
        data: selectedMetrics.map(metric => getMetricName(metric)),
      },
      xAxis: {
        type: 'category',
        data: dates,
      },
      yAxis: {
        type: 'value',
      },
      series: series,
    };
    
    setChartOptions(options);
    setChartVisible(true);
  };

  // 获取指标名称
  const getMetricName = (metric) => {
    const metricNames = {
      cod: 'COD (mg/L)',
      nh3n: '氨氮 (mg/L)',
      tp: '总磷 (mg/L)',
      tn: '总氮 (mg/L)',
      ss: '悬浮物 (mg/L)',
      inflow: '进水流量 (m³)',
      outflow: '出水流量 (m³)',
      electricity: '电力消耗 (kWh)',
      chemical: '药剂消耗 (kg)',
    };
    
    return metricNames[metric] || metric;
  };

  // 获取报表标题
  const getReportTitle = () => {
    const reportTitles = {
      water_quality: '水质指标趋势',
      flow: '流量趋势',
      energy: '能耗趋势',
    };
    
    const selectedSiteName = sites.find(site => site.id === selectedSite)?.name || '';
    
    return `${selectedSiteName} - ${reportTitles[reportType] || '动态报表'}`;
  };

  // 导出为Excel
  const exportToExcel = () => {
    message.info('Excel导出功能正在开发中');
  };

  // 获取表格列
  const getColumns = () => {
    if (reportType === 'water_quality') {
      return [
        {
          title: '日期',
          dataIndex: 'date',
          key: 'date',
          sorter: (a, b) => dayjs(a.date).unix() - dayjs(b.date).unix(),
        },
        {
          title: 'COD (mg/L)',
          dataIndex: 'cod',
          key: 'cod',
          sorter: (a, b) => a.cod - b.cod,
        },
        {
          title: '氨氮 (mg/L)',
          dataIndex: 'nh3n',
          key: 'nh3n',
          sorter: (a, b) => a.nh3n - b.nh3n,
        },
        {
          title: '总磷 (mg/L)',
          dataIndex: 'tp',
          key: 'tp',
          sorter: (a, b) => a.tp - b.tp,
        },
        {
          title: '总氮 (mg/L)',
          dataIndex: 'tn',
          key: 'tn',
          sorter: (a, b) => a.tn - b.tn,
        },
        {
          title: '悬浮物 (mg/L)',
          dataIndex: 'ss',
          key: 'ss',
          sorter: (a, b) => a.ss - b.ss,
        },
      ];
    } else if (reportType === 'flow') {
      return [
        {
          title: '日期',
          dataIndex: 'date',
          key: 'date',
          sorter: (a, b) => dayjs(a.date).unix() - dayjs(b.date).unix(),
        },
        {
          title: '进水流量 (m³)',
          dataIndex: 'inflow',
          key: 'inflow',
          sorter: (a, b) => a.inflow - b.inflow,
        },
        {
          title: '出水流量 (m³)',
          dataIndex: 'outflow',
          key: 'outflow',
          sorter: (a, b) => a.outflow - b.outflow,
        },
      ];
    } else if (reportType === 'energy') {
      return [
        {
          title: '日期',
          dataIndex: 'date',
          key: 'date',
          sorter: (a, b) => dayjs(a.date).unix() - dayjs(b.date).unix(),
        },
        {
          title: '电力消耗 (kWh)',
          dataIndex: 'electricity',
          key: 'electricity',
          sorter: (a, b) => a.electricity - b.electricity,
        },
        {
          title: '药剂消耗 (kg)',
          dataIndex: 'chemical',
          key: 'chemical',
          sorter: (a, b) => a.chemical - b.chemical,
        },
      ];
    }
    
    return [];
  };

  // 获取可选指标
  const getMetricsOptions = () => {
    if (reportType === 'water_quality') {
      return [
        { label: 'COD (mg/L)', value: 'cod' },
        { label: '氨氮 (mg/L)', value: 'nh3n' },
        { label: '总磷 (mg/L)', value: 'tp' },
        { label: '总氮 (mg/L)', value: 'tn' },
        { label: '悬浮物 (mg/L)', value: 'ss' },
      ];
    } else if (reportType === 'flow') {
      return [
        { label: '进水流量 (m³)', value: 'inflow' },
        { label: '出水流量 (m³)', value: 'outflow' },
      ];
    } else if (reportType === 'energy') {
      return [
        { label: '电力消耗 (kWh)', value: 'electricity' },
        { label: '药剂消耗 (kg)', value: 'chemical' },
      ];
    }
    
    return [];
  };

  return (
    <div className={styles.dynamicReportsContainer}>
      <Card className={styles.reportsCard}>
        <Title level={4}>动态报表</Title>
        
        <Row gutter={16} className={styles.filterRow}>
          <Col span={6}>
            <RangePicker 
              value={dateRange}
              onChange={handleDateRangeChange}
              style={{ width: '100%' }}
            />
          </Col>
          <Col span={4}>
            <Select
              placeholder="选择站点"
              style={{ width: '100%' }}
              value={selectedSite}
              onChange={handleSiteChange}
            >
              {sites.map(site => (
                <Option key={site.id} value={site.id}>{site.name}</Option>
              ))}
            </Select>
          </Col>
          <Col span={4}>
            <Select
              placeholder="报表类型"
              style={{ width: '100%' }}
              value={reportType}
              onChange={handleReportTypeChange}
            >
              <Option value="water_quality">水质指标</Option>
              <Option value="flow">流量</Option>
              <Option value="energy">能耗</Option>
            </Select>
          </Col>
          <Col span={10}>
            <Space>
              <Button 
                type="primary" 
                icon={<ReloadOutlined />}
                onClick={fetchReportData}
                loading={loading}
              >
                刷新数据
              </Button>
              <Button 
                icon={<BarChartOutlined />}
                onClick={generateChart}
              >
                生成图表
              </Button>
              <Button 
                icon={<FileExcelOutlined />}
                onClick={exportToExcel}
              >
                导出Excel
              </Button>
            </Space>
          </Col>
        </Row>
        
        <Row gutter={16} className={styles.metricsRow}>
          <Col span={16}>
            <Form layout="inline">
              <Form.Item label="选择指标">
                <Checkbox.Group
                  options={getMetricsOptions()}
                  value={selectedMetrics}
                  onChange={handleMetricsChange}
                />
              </Form.Item>
            </Form>
          </Col>
          <Col span={8}>
            <Form layout="inline">
              <Form.Item label="图表类型">
                <Radio.Group value={chartType} onChange={handleChartTypeChange}>
                  <Radio.Button value="line"><LineChartOutlined /> 折线图</Radio.Button>
                  <Radio.Button value="bar"><BarChartOutlined /> 柱状图</Radio.Button>
                  {reportType !== 'flow' && (
                    <Radio.Button value="pie"><PieChartOutlined /> 饼图</Radio.Button>
                  )}
                </Radio.Group>
              </Form.Item>
            </Form>
          </Col>
        </Row>
        
        <div className={styles.tableContainer}>
          {loading ? (
            <div className={styles.loadingContainer}>
              <Spin size="large" />
            </div>
          ) : (
            <Table 
              columns={getColumns()} 
              dataSource={reportData} 
              rowKey="date"
              pagination={{ pageSize: 10 }}
            />
          )}
        </div>
        
        <Modal
          title={getReportTitle()}
          open={chartVisible}
          onCancel={() => setChartVisible(false)}
          footer={[
            <Button key="close" onClick={() => setChartVisible(false)}>
              关闭
            </Button>,
            <Button 
              key="download" 
              type="primary" 
              icon={<DownloadOutlined />}
              onClick={() => message.info('图表下载功能正在开发中')}
            >
              下载图表
            </Button>
          ]}
          width={800}
        >
          <ReactECharts option={chartOptions} style={{ height: 400 }} />
        </Modal>
      </Card>
    </div>
  );
};

export default DynamicReports;
