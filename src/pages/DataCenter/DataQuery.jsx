import React, { useState, useEffect } from 'react';
import { Card, Table, Form, Select, Button, DatePicker, Spin, message, Space, Row, Col, Radio } from 'antd';
import { SearchOutlined, ReloadOutlined, DownloadOutlined } from '@ant-design/icons';
import api from '../../api/interceptors';
import styles from './DataQuery.module.scss';

const { Option } = Select;
const { RangePicker } = DatePicker;

/**
 * 实时数据查询组件
 * @returns {JSX.Element} 数据查询页面
 */
const DataQuery = () => {
  const [loading, setLoading] = useState(false);
  const [sites, setSites] = useState([]);
  const [devices, setDevices] = useState([]);
  const [parameters, setParameters] = useState([]);
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [queryType, setQueryType] = useState('realtime'); // 'realtime' or 'history'
  
  const [form] = Form.useForm();
  
  // 加载站点列表
  useEffect(() => {
    fetchSites();
  }, []);
  
  // 获取站点列表
  const fetchSites = async () => {
    try {
      // 实际项目中应调用API
      // const response = await api.get('/api/sites');
      // setSites(response.data);
      
      // 模拟API调用
      const mockSites = [
        { id: 1, name: '污水处理厂1' },
        { id: 2, name: '污水处理厂2' },
        { id: 3, name: '污水处理厂3' },
      ];
      setSites(mockSites);
    } catch (error) {
      console.error('获取站点列表失败', error);
      message.error('获取站点列表失败');
    }
  };
  
  // 根据站点ID获取设备列表
  const fetchDevicesBySite = async (siteId) => {
    if (!siteId) return;
    
    try {
      setLoading(true);
      // 实际项目中应调用API
      // const response = await api.get(`/api/sites/${siteId}/devices`);
      // setDevices(response.data);
      
      // 模拟API调用
      const mockDevices = [
        { id: 1, name: 'PLC-1', type: 'plc' },
        { id: 2, name: '流量计-1', type: 'flowmeter' },
        { id: 3, name: '水质分析仪-1', type: 'analyzer' },
      ];
      setDevices(mockDevices);
      form.setFieldsValue({ deviceId: undefined, parameterId: undefined });
      setParameters([]);
    } catch (error) {
      console.error('获取设备列表失败', error);
      message.error('获取设备列表失败');
    } finally {
      setLoading(false);
    }
  };
  
  // 根据设备ID获取参数列表
  const fetchParametersByDevice = async (deviceId) => {
    if (!deviceId) return;
    
    try {
      setLoading(true);
      // 实际项目中应调用API
      // const response = await api.get(`/api/devices/${deviceId}/parameters`);
      // setParameters(response.data);
      
      // 模拟API调用
      const mockParameters = [
        { id: 1, name: 'pH值', unit: 'pH' },
        { id: 2, name: '溶解氧', unit: 'mg/L' },
        { id: 3, name: '浊度', unit: 'NTU' },
        { id: 4, name: '氨氮', unit: 'mg/L' },
        { id: 5, name: 'COD', unit: 'mg/L' },
      ];
      setParameters(mockParameters);
      form.setFieldsValue({ parameterId: undefined });
    } catch (error) {
      console.error('获取参数列表失败', error);
      message.error('获取参数列表失败');
    } finally {
      setLoading(false);
    }
  };
  
  // 处理站点变化
  const handleSiteChange = (value) => {
    fetchDevicesBySite(value);
  };
  
  // 处理设备变化
  const handleDeviceChange = (value) => {
    fetchParametersByDevice(value);
  };
  
  // 查询数据
  const handleQuery = async (values) => {
    try {
      setLoading(true);
      // 实际项目中应调用API
      // const response = await api.post('/api/data/query', {
      //   ...values,
      //   queryType,
      //   pagination: {
      //     current: pagination.current,
      //     pageSize: pagination.pageSize,
      //   },
      // });
      // setData(response.data.items);
      // setPagination({
      //   ...pagination,
      //   total: response.data.total,
      // });
      
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 模拟数据
      const mockData = Array.from({ length: 10 }, (_, index) => ({
        id: index + 1,
        timestamp: new Date(Date.now() - index * 3600000).toLocaleString(),
        value: (Math.random() * 10).toFixed(2),
        unit: parameters.find(p => p.id === values.parameterId)?.unit || '',
        status: index % 5 === 0 ? 'alarm' : 'normal',
      }));
      
      setData(mockData);
      setPagination({
        ...pagination,
        total: 100,
      });
    } catch (error) {
      console.error('查询数据失败', error);
      message.error('查询数据失败');
    } finally {
      setLoading(false);
    }
  };
  
  // 表格列定义
  const columns = [
    {
      title: '序号',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '时间',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 180,
    },
    {
      title: '数值',
      dataIndex: 'value',
      key: 'value',
      render: (text, record) => `${text} ${record.unit}`,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <span style={{ color: status === 'alarm' ? '#f5222d' : '#52c41a' }}>
          {status === 'alarm' ? '报警' : '正常'}
        </span>
      ),
    },
  ];
  
  // 处理表格分页变更
  const handleTableChange = (newPagination) => {
    setPagination({
      ...pagination,
      current: newPagination.current,
      pageSize: newPagination.pageSize,
    });
    
    // 重新查询数据
    form.submit();
  };
  
  // 导出数据
  const handleExport = () => {
    message.info('数据导出功能将在实际项目中实现');
  };
  
  // 切换查询类型
  const handleQueryTypeChange = (e) => {
    setQueryType(e.target.value);
  };
  
  return (
    <div className={styles.dataQueryContainer}>
      <h1 className={styles.pageTitle}>数据查询</h1>
      
      <Card className={styles.queryCard}>
        <Radio.Group 
          value={queryType} 
          onChange={handleQueryTypeChange}
          className={styles.queryTypeSelector}
        >
          <Radio.Button value="realtime">实时数据</Radio.Button>
          <Radio.Button value="history">历史数据</Radio.Button>
        </Radio.Group>
        
        <Form
          form={form}
          layout="horizontal"
          onFinish={handleQuery}
          initialValues={{
            siteId: undefined,
            deviceId: undefined,
            parameterId: undefined,
          }}
        >
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={8}>
              <Form.Item
                name="siteId"
                label="站点"
                rules={[{ required: true, message: '请选择站点' }]}
              >
                <Select 
                  placeholder="选择站点" 
                  onChange={handleSiteChange}
                  loading={loading}
                >
                  {sites.map((site) => (
                    <Option key={site.id} value={site.id}>{site.name}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            
            <Col xs={24} sm={8}>
              <Form.Item
                name="deviceId"
                label="设备"
                rules={[{ required: true, message: '请选择设备' }]}
              >
                <Select 
                  placeholder="选择设备" 
                  onChange={handleDeviceChange}
                  loading={loading}
                  disabled={devices.length === 0}
                >
                  {devices.map((device) => (
                    <Option key={device.id} value={device.id}>{device.name}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            
            <Col xs={24} sm={8}>
              <Form.Item
                name="parameterId"
                label="参数"
                rules={[{ required: true, message: '请选择参数' }]}
              >
                <Select 
                  placeholder="选择参数" 
                  loading={loading}
                  disabled={parameters.length === 0}
                >
                  {parameters.map((param) => (
                    <Option key={param.id} value={param.id}>{param.name} ({param.unit})</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            
            {queryType === 'history' && (
              <Col xs={24} sm={12}>
                <Form.Item
                  name="dateRange"
                  label="日期范围"
                  rules={[{ required: true, message: '请选择日期范围' }]}
                >
                  <RangePicker 
                    showTime
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              </Col>
            )}
            
            <Col xs={24} sm={queryType === 'history' ? 12 : 24}>
              <Form.Item className={styles.actionButtons}>
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
                    onClick={() => form.resetFields()}
                    icon={<ReloadOutlined />}
                  >
                    重置
                  </Button>
                  <Button 
                    onClick={handleExport} 
                    icon={<DownloadOutlined />}
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
      
      <Card className={styles.resultCard}>
        <Spin spinning={loading}>
          <Table
            columns={columns}
            dataSource={data}
            rowKey="id"
            pagination={pagination}
            onChange={handleTableChange}
            locale={{ emptyText: '暂无数据' }}
          />
        </Spin>
      </Card>
    </div>
  );
};

export default DataQuery; 