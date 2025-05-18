import React, { useState, useEffect } from 'react';
import { Card, Form, Row, Col, DatePicker, Select, Button, Table, Spin, Empty, message } from 'antd';
import { DownloadOutlined, SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import api from '../../api/interceptors';
import styles from './HistoryDataQuery.module.scss';

const { RangePicker } = DatePicker;
const { Option } = Select;

/**
 * 历史数据查询页面
 * @returns {JSX.Element} 历史数据查询组件
 */
const HistoryDataQuery = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [sites, setSites] = useState([]);
  const [dataTypes, setDataTypes] = useState([]);
  const [queryResult, setQueryResult] = useState(null);
  const [tableColumns, setTableColumns] = useState([]);
  
  useEffect(() => {
    // 获取站点和数据类型选项
    const fetchOptions = async () => {
      try {
        const [sitesResponse, dataTypesResponse] = await Promise.all([
          api.get('/api/sites/list'),
          api.get('/api/data/types'),
        ]);
        
        setSites(sitesResponse.data || getMockSites());
        setDataTypes(dataTypesResponse.data || getMockDataTypes());
      } catch (error) {
        console.error('获取选项数据失败', error);
        // 使用模拟数据
        setSites(getMockSites());
        setDataTypes(getMockDataTypes());
      }
    };
    
    fetchOptions();
  }, []);
  
  // 获取模拟站点数据
  const getMockSites = () => {
    return [
      { id: 1, name: '华北水厂' },
      { id: 2, name: '东方水处理厂' },
      { id: 3, name: '西部污水处理中心' },
      { id: 4, name: '南方水厂' },
      { id: 5, name: '城东污水站' },
    ];
  };
  
  // 获取模拟数据类型
  const getMockDataTypes = () => {
    return [
      { id: 'flow', name: '流量' },
      { id: 'ph', name: 'pH值' },
      { id: 'cod', name: 'COD' },
      { id: 'bod', name: 'BOD' },
      { id: 'nh3n', name: '氨氮' },
      { id: 'ss', name: '悬浮物' },
      { id: 'tn', name: '总氮' },
      { id: 'tp', name: '总磷' },
    ];
  };
  
  // 生成模拟数据
  const generateMockData = (formValues) => {
    const { dateRange, siteId, dataType } = formValues;
    const startDate = dateRange[0].format('YYYY-MM-DD');
    const endDate = dateRange[1].format('YYYY-MM-DD');
    
    // 找到选中的站点和数据类型
    const selectedSite = sites.find(site => site.id === siteId);
    const selectedDataType = dataTypes.find(type => type.id === dataType);
    
    // 生成表格列
    const columns = [
      {
        title: '时间',
        dataIndex: 'time',
        key: 'time',
        width: 180,
      },
      {
        title: `${selectedDataType.name} (${getUnit(selectedDataType.id)})`,
        dataIndex: 'value',
        key: 'value',
        render: (value) => value.toFixed(2),
      }
    ];
    
    setTableColumns(columns);
    
    // 生成模拟数据行
    const data = [];
    const days = 7; // 假设查询了7天数据
    
    for (let i = 0; i < days; i++) {
      for (let h = 0; h < 24; h += 2) { // 每2小时一条数据
        data.push({
          key: `${i}-${h}`,
          time: `${startDate} ${h.toString().padStart(2, '0')}:00:00`,
          value: Math.random() * getValueRange(selectedDataType.id),
        });
      }
    }
    
    return {
      site: selectedSite.name,
      dataType: selectedDataType.name,
      startDate,
      endDate,
      data,
    };
  };
  
  // 获取数据单位
  const getUnit = (dataTypeId) => {
    const units = {
      flow: 'm³/h',
      ph: '',
      cod: 'mg/L',
      bod: 'mg/L',
      nh3n: 'mg/L',
      ss: 'mg/L',
      tn: 'mg/L',
      tp: 'mg/L',
    };
    return units[dataTypeId] || '';
  };
  
  // 获取数据范围用于模拟
  const getValueRange = (dataTypeId) => {
    const ranges = {
      flow: 1000,
      ph: 14,
      cod: 100,
      bod: 50,
      nh3n: 20,
      ss: 100,
      tn: 30,
      tp: 5,
    };
    return ranges[dataTypeId] || 100;
  };
  
  // 查询数据
  const handleQuery = (values) => {
    setLoading(true);
    
    try {
      // 实际项目中应调用API
      // const response = await api.get('/api/data/query', { params: values });
      // setQueryResult(response.data);
      
      // 使用模拟数据
      setTimeout(() => {
        const result = generateMockData(values);
        setQueryResult(result);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('查询数据失败', error);
      message.error('查询数据失败');
      setLoading(false);
    }
  };
  
  // 重置表单
  const handleReset = () => {
    form.resetFields();
    setQueryResult(null);
  };
  
  // 导出Excel
  const handleExport = () => {
    if (!queryResult) return;
    
    message.success('数据导出成功');
    // 实际导出逻辑
  };
  
  return (
    <div className={styles.queryContainer}>
      <h1 className={styles.pageTitle}>历史数据查询</h1>
      
      <Card className={styles.queryCard}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleQuery}
          initialValues={{
            siteId: sites[0]?.id,
            dataType: dataTypes[0]?.id,
          }}
        >
          <Row gutter={24}>
            <Col xs={24} md={8}>
              <Form.Item
                name="dateRange"
                label="日期范围"
                rules={[{ required: true, message: '请选择日期范围' }]}
              >
                <RangePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Form.Item
                name="siteId"
                label="站点"
                rules={[{ required: true, message: '请选择站点' }]}
              >
                <Select placeholder="选择站点">
                  {sites.map(site => (
                    <Option key={site.id} value={site.id}>
                      {site.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Form.Item
                name="dataType"
                label="数据类型"
                rules={[{ required: true, message: '请选择数据类型' }]}
              >
                <Select placeholder="选择数据类型">
                  {dataTypes.map(type => (
                    <Option key={type.id} value={type.id}>
                      {type.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          
          <div className={styles.formActions}>
            <Button 
              type="primary" 
              htmlType="submit" 
              icon={<SearchOutlined />} 
              loading={loading}
            >
              查询
            </Button>
            <Button 
              onClick={handleReset} 
              icon={<ReloadOutlined />}
            >
              重置
            </Button>
            <Button 
              type="primary"
              icon={<DownloadOutlined />} 
              onClick={handleExport} 
              disabled={!queryResult}
            >
              导出Excel
            </Button>
          </div>
        </Form>
      </Card>
      
      {loading ? (
        <div className={styles.loadingContainer}>
          <Spin size="large" />
        </div>
      ) : queryResult ? (
        <Card 
          className={styles.resultCard} 
          title={`${queryResult.site} - ${queryResult.dataType} (${queryResult.startDate} 至 ${queryResult.endDate})`}
        >
          <Table 
            columns={tableColumns} 
            dataSource={queryResult.data} 
            rowKey="key" 
            pagination={{ pageSize: 10 }}
            scroll={{ x: 'max-content' }}
          />
        </Card>
      ) : (
        <div className={styles.emptyResult}>
          <Empty description="请选择查询条件并点击查询" />
        </div>
      )}
    </div>
  );
};

export default HistoryDataQuery; 