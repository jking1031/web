import React, { useState, useEffect } from 'react';
import { Card, Form, DatePicker, Button, Table, Select, Spin, Typography, Space, Tabs, Row, Col } from 'antd';
import { DownloadOutlined, SearchOutlined, LineChartOutlined, BarChartOutlined } from '@ant-design/icons';
import moment from 'moment';
import apiService from '../../../services/apiService';
import TrendChart from '../../../components/TrendChart';
import styles from './AODataQuery.module.scss';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;
const { TabPane } = Tabs;

/**
 * AO池数据查询页面
 * 对应移动端的AODataQueryScreen
 */
const AODataQuery = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [chartLoading, setChartLoading] = useState(false);
  const [data, setData] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [parameters, setParameters] = useState([]);
  const [selectedParameters, setSelectedParameters] = useState([]);
  const [activeTab, setActiveTab] = useState('table');

  // 加载参数列表
  useEffect(() => {
    const fetchParameters = async () => {
      try {
        // 通过API管理器调用获取AO池参数列表API
        const response = await apiService.callApi('getAOParameters');
        
        if (response && response.success) {
          setParameters(response.data || []);
        }
      } catch (error) {
        console.error('获取AO池参数列表失败:', error);
      }
    };

    fetchParameters();
  }, []);

  /**
   * 处理查询表单提交
   * @param {Object} values - 表单值
   */
  const handleSearch = async (values) => {
    if (loading) return;
    
    setLoading(true);
    try {
      // 格式化日期范围
      const startDate = values.dateRange[0].format('YYYY-MM-DD');
      const endDate = values.dateRange[1].format('YYYY-MM-DD');
      
      // 通过API管理器调用查询AO池数据API
      const response = await apiService.callApi('queryAOData', {
        startDate,
        endDate,
        parameters: values.parameters
      });
      
      if (response && response.success) {
        setData(response.data || []);
        setSelectedParameters(values.parameters);
        
        // 如果当前是图表视图，加载图表数据
        if (activeTab === 'chart') {
          loadChartData(startDate, endDate, values.parameters);
        }
      }
    } catch (error) {
      console.error('查询AO池数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 加载图表数据
   * @param {string} startDate - 开始日期
   * @param {string} endDate - 结束日期
   * @param {Array} parameters - 参数列表
   */
  const loadChartData = async (startDate, endDate, parameters) => {
    setChartLoading(true);
    try {
      // 通过API管理器调用获取AO池图表数据API
      const response = await apiService.callApi('getAOChartData', {
        startDate,
        endDate,
        parameters
      });
      
      if (response && response.success) {
        setChartData(response.data || []);
      }
    } catch (error) {
      console.error('获取AO池图表数据失败:', error);
    } finally {
      setChartLoading(false);
    }
  };

  /**
   * 处理标签页切换
   * @param {string} key - 标签页键值
   */
  const handleTabChange = (key) => {
    setActiveTab(key);
    
    // 如果切换到图表视图且有查询条件，加载图表数据
    if (key === 'chart' && data.length > 0) {
      const values = form.getFieldsValue();
      if (values.dateRange && values.dateRange.length === 2) {
        const startDate = values.dateRange[0].format('YYYY-MM-DD');
        const endDate = values.dateRange[1].format('YYYY-MM-DD');
        loadChartData(startDate, endDate, values.parameters);
      }
    }
  };

  /**
   * 导出数据
   */
  const handleExport = async () => {
    const values = form.getFieldsValue();
    if (!values.dateRange || values.dateRange.length !== 2 || !values.parameters) {
      return;
    }
    
    try {
      // 格式化日期范围
      const startDate = values.dateRange[0].format('YYYY-MM-DD');
      const endDate = values.dateRange[1].format('YYYY-MM-DD');
      
      // 通过API管理器调用导出AO池数据API
      const response = await apiService.callApi('exportAOData', {
        startDate,
        endDate,
        parameters: values.parameters,
        format: 'excel'
      });
      
      if (response && response.success && response.data.url) {
        // 创建下载链接
        const link = document.createElement('a');
        link.href = response.data.url;
        link.download = `AO池数据_${startDate}_${endDate}.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error('导出AO池数据失败:', error);
    }
  };

  // 生成表格列
  const generateColumns = () => {
    const columns = [
      {
        title: '日期',
        dataIndex: 'date',
        key: 'date',
        fixed: 'left',
        width: 120
      },
      {
        title: '时间',
        dataIndex: 'time',
        key: 'time',
        fixed: 'left',
        width: 100
      }
    ];
    
    // 添加选中的参数列
    selectedParameters.forEach(param => {
      const paramInfo = parameters.find(p => p.key === param);
      if (paramInfo) {
        columns.push({
          title: `${paramInfo.name}${paramInfo.unit ? ` (${paramInfo.unit})` : ''}`,
          dataIndex: param,
          key: param,
          sorter: (a, b) => a[param] - b[param],
          render: (text) => text !== undefined ? text : '-'
        });
      }
    });
    
    return columns;
  };

  return (
    <div className={styles.aoDataQueryContainer}>
      <Title level={2} className={styles.pageTitle}>AO池数据查询</Title>
      
      {/* 查询表单 */}
      <Card className={styles.queryCard}>
        <Form
          form={form}
          layout="horizontal"
          onFinish={handleSearch}
          initialValues={{
            dateRange: [moment().subtract(7, 'days'), moment()],
            parameters: ['do', 'ph', 'temperature']
          }}
        >
          <Row gutter={16}>
            <Col xs={24} sm={12} md={8}>
              <Form.Item
                name="dateRange"
                label="日期范围"
                rules={[{ required: true, message: '请选择日期范围' }]}
              >
                <RangePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={12}>
              <Form.Item
                name="parameters"
                label="查询参数"
                rules={[{ required: true, message: '请选择至少一个参数' }]}
              >
                <Select
                  mode="multiple"
                  placeholder="选择参数"
                  style={{ width: '100%' }}
                >
                  {parameters.map(param => (
                    <Option key={param.key} value={param.key}>
                      {param.name} {param.unit ? `(${param.unit})` : ''}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={24} md={4}>
              <Form.Item>
                <Space>
                  <Button
                    type="primary"
                    htmlType="submit"
                    icon={<SearchOutlined />}
                    loading={loading}
                  >
                    查询
                  </Button>
                  <Button
                    icon={<DownloadOutlined />}
                    onClick={handleExport}
                    disabled={data.length === 0}
                  >
                    导出
                  </Button>
                </Space>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Card>
      
      {/* 数据展示 */}
      <Card className={styles.dataCard}>
        <Tabs activeKey={activeTab} onChange={handleTabChange}>
          <TabPane 
            tab={
              <span>
                <TableOutlined />
                表格视图
              </span>
            } 
            key="table"
          >
            <div className={styles.tableContainer}>
              {loading ? (
                <div className={styles.loadingContainer}>
                  <Spin size="large" />
                  <Text>加载数据中...</Text>
                </div>
              ) : data.length > 0 ? (
                <Table
                  columns={generateColumns()}
                  dataSource={data}
                  rowKey="id"
                  scroll={{ x: 'max-content' }}
                  pagination={{ pageSize: 10 }}
                />
              ) : (
                <div className={styles.emptyContainer}>
                  <Text type="secondary">暂无数据，请选择参数进行查询</Text>
                </div>
              )}
            </div>
          </TabPane>
          <TabPane 
            tab={
              <span>
                <LineChartOutlined />
                趋势图
              </span>
            } 
            key="chart"
          >
            <div className={styles.chartContainer}>
              {chartLoading ? (
                <div className={styles.loadingContainer}>
                  <Spin size="large" />
                  <Text>加载图表数据中...</Text>
                </div>
              ) : chartData.length > 0 ? (
                <TrendChart 
                  data={chartData} 
                  parameters={selectedParameters.map(param => {
                    const paramInfo = parameters.find(p => p.key === param);
                    return {
                      key: param,
                      name: paramInfo ? paramInfo.name : param,
                      unit: paramInfo ? paramInfo.unit : ''
                    };
                  })}
                />
              ) : (
                <div className={styles.emptyContainer}>
                  <Text type="secondary">暂无图表数据，请选择参数进行查询</Text>
                </div>
              )}
            </div>
          </TabPane>
          <TabPane 
            tab={
              <span>
                <BarChartOutlined />
                统计分析
              </span>
            } 
            key="stats"
          >
            <div className={styles.statsContainer}>
              {chartLoading ? (
                <div className={styles.loadingContainer}>
                  <Spin size="large" />
                  <Text>加载统计数据中...</Text>
                </div>
              ) : chartData.length > 0 ? (
                <div className={styles.statsContent}>
                  {/* 这里可以添加统计分析内容，如最大值、最小值、平均值等 */}
                  <Row gutter={[16, 16]}>
                    {selectedParameters.map(param => {
                      const paramInfo = parameters.find(p => p.key === param);
                      const stats = calculateStats(data, param);
                      return (
                        <Col xs={24} sm={12} md={8} key={param}>
                          <Card title={paramInfo ? paramInfo.name : param}>
                            <div className={styles.statItem}>
                              <Text>最大值: {stats.max}</Text>
                            </div>
                            <div className={styles.statItem}>
                              <Text>最小值: {stats.min}</Text>
                            </div>
                            <div className={styles.statItem}>
                              <Text>平均值: {stats.avg}</Text>
                            </div>
                          </Card>
                        </Col>
                      );
                    })}
                  </Row>
                </div>
              ) : (
                <div className={styles.emptyContainer}>
                  <Text type="secondary">暂无统计数据，请选择参数进行查询</Text>
                </div>
              )}
            </div>
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
};

/**
 * 计算统计数据
 * @param {Array} data - 数据数组
 * @param {string} param - 参数键值
 * @returns {Object} 统计结果
 */
const calculateStats = (data, param) => {
  if (!data || data.length === 0) {
    return { max: '-', min: '-', avg: '-' };
  }
  
  const values = data
    .map(item => item[param])
    .filter(val => val !== undefined && val !== null && !isNaN(val));
  
  if (values.length === 0) {
    return { max: '-', min: '-', avg: '-' };
  }
  
  const max = Math.max(...values);
  const min = Math.min(...values);
  const sum = values.reduce((acc, val) => acc + val, 0);
  const avg = (sum / values.length).toFixed(2);
  
  return { max, min, avg };
};

export default AODataQuery;
