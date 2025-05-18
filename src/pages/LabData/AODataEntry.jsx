import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Button, DatePicker, Select, Table, message, Row, Col, Typography, Divider, Space, TimePicker } from 'antd';
import { SaveOutlined, RollbackOutlined, FileExcelOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import dayjs from 'dayjs';
import { API_ENDPOINTS } from '../../api/config';
import { useAuth } from '../../context/AuthContext';
import styles from './LabData.module.scss';

const { Option } = Select;
const { Title } = Typography;

/**
 * AO池数据录入页面
 * @returns {JSX.Element} AO池数据录入页面组件
 */
const AODataEntry = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [sites, setSites] = useState([]);
  const [recentData, setRecentData] = useState([]);
  const [selectedSite, setSelectedSite] = useState(null);

  // 获取站点列表
  useEffect(() => {
    const fetchSites = async () => {
      try {
        const response = await axios.get(API_ENDPOINTS.SITES);
        if (response.data) {
          setSites(response.data);
          if (response.data.length > 0) {
            setSelectedSite(response.data[0].id);
            form.setFieldsValue({ site_id: response.data[0].id });
          }
        }
      } catch (error) {
        console.error('获取站点列表失败:', error);
        message.error('获取站点列表失败');
        
        // 使用模拟数据
        const mockSites = [
          { id: 1, name: '华北水厂' },
          { id: 2, name: '东方水处理厂' },
          { id: 3, name: '西部污水处理中心' },
          { id: 4, name: '南方水厂' },
        ];
        setSites(mockSites);
        setSelectedSite(mockSites[0].id);
        form.setFieldsValue({ site_id: mockSites[0].id });
      }
    };
    
    fetchSites();
    
    // 设置默认值
    form.setFieldsValue({
      date: dayjs(),
      time: dayjs(),
      operator: user?.name || '',
    });
  }, [form, user]);

  // 获取最近的AO池数据
  useEffect(() => {
    if (selectedSite) {
      fetchRecentData();
    }
  }, [selectedSite]);

  // 获取最近的AO池数据
  const fetchRecentData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_ENDPOINTS.AO_DATA}?site_id=${selectedSite}&limit=5`);
      
      if (response.data) {
        setRecentData(response.data);
      }
    } catch (error) {
      console.error('获取最近AO池数据失败:', error);
      
      // 使用模拟数据
      const mockData = [];
      for (let i = 0; i < 5; i++) {
        const date = dayjs().subtract(i, 'day').format('YYYY-MM-DD');
        const time = dayjs().format('HH:mm:ss');
        mockData.push({
          id: `ao_${i}`,
          date,
          time,
          site_id: selectedSite,
          operator: '王工',
          a_zone_do: (Math.random() * 0.5).toFixed(2),
          o_zone_do: (Math.random() * 2 + 2).toFixed(2),
          a_zone_mlss: (Math.random() * 1000 + 3000).toFixed(0),
          o_zone_mlss: (Math.random() * 1000 + 3000).toFixed(0),
          sv30: Math.floor(Math.random() * 100) + 200,
          temperature: Math.floor(Math.random() * 5) + 20,
          ph: (Math.random() * 1 + 6.5).toFixed(1),
        });
      }
      setRecentData(mockData);
    } finally {
      setLoading(false);
    }
  };

  // 处理站点变化
  const handleSiteChange = (value) => {
    setSelectedSite(value);
  };

  // 提交表单
  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      
      // 格式化日期和时间
      const formattedValues = {
        ...values,
        date: values.date.format('YYYY-MM-DD'),
        time: values.time.format('HH:mm:ss'),
        id: `ao_${Date.now()}`,
      };
      
      // 提交数据
      const response = await axios.post(API_ENDPOINTS.AO_DATA, formattedValues);
      
      if (response.status === 201) {
        message.success('AO池数据提交成功');
        // 重新获取最近数据
        fetchRecentData();
        // 重置表单
        form.resetFields();
        form.setFieldsValue({
          date: dayjs(),
          time: dayjs(),
          site_id: selectedSite,
          operator: user?.name || '',
        });
      } else {
        throw new Error('提交失败');
      }
    } catch (error) {
      console.error('提交AO池数据失败:', error);
      message.error('提交AO池数据失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 表格列定义
  const columns = [
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date',
    },
    {
      title: '时间',
      dataIndex: 'time',
      key: 'time',
    },
    {
      title: 'A区DO(mg/L)',
      dataIndex: 'a_zone_do',
      key: 'a_zone_do',
    },
    {
      title: 'O区DO(mg/L)',
      dataIndex: 'o_zone_do',
      key: 'o_zone_do',
    },
    {
      title: 'A区MLSS(mg/L)',
      dataIndex: 'a_zone_mlss',
      key: 'a_zone_mlss',
    },
    {
      title: 'O区MLSS(mg/L)',
      dataIndex: 'o_zone_mlss',
      key: 'o_zone_mlss',
    },
    {
      title: 'SV30(mL/L)',
      dataIndex: 'sv30',
      key: 'sv30',
    },
    {
      title: '填报人',
      dataIndex: 'operator',
      key: 'operator',
    },
  ];

  return (
    <div className={styles.dataEntryContainer}>
      <Title level={4}>AO池数据录入</Title>
      
      <Card className={styles.formCard}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            date: dayjs(),
            time: dayjs(),
            operator: user?.name || '',
          }}
        >
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item
                name="date"
                label="日期"
                rules={[{ required: true, message: '请选择日期' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="time"
                label="时间"
                rules={[{ required: true, message: '请选择时间' }]}
              >
                <TimePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="site_id"
                label="站点"
                rules={[{ required: true, message: '请选择站点' }]}
              >
                <Select 
                  placeholder="请选择站点" 
                  onChange={handleSiteChange}
                >
                  {sites.map(site => (
                    <Option key={site.id} value={site.id}>{site.name}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="operator"
                label="操作员"
                rules={[{ required: true, message: '请输入操作员姓名' }]}
              >
                <Input placeholder="请输入操作员姓名" />
              </Form.Item>
            </Col>
          </Row>
          
          <Divider orientation="left">溶解氧</Divider>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="a_zone_do"
                label="A区DO(mg/L)"
                rules={[{ required: true, message: '请输入A区DO' }]}
              >
                <Input placeholder="例如: 0.3" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="o_zone_do"
                label="O区DO(mg/L)"
                rules={[{ required: true, message: '请输入O区DO' }]}
              >
                <Input placeholder="例如: 3.5" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="second_o_zone_do"
                label="二沉池DO(mg/L)"
              >
                <Input placeholder="例如: 2.0" />
              </Form.Item>
            </Col>
          </Row>
          
          <Divider orientation="left">活性污泥</Divider>
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item
                name="a_zone_mlss"
                label="A区MLSS(mg/L)"
                rules={[{ required: true, message: '请输入A区MLSS' }]}
              >
                <Input placeholder="例如: 3500" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="o_zone_mlss"
                label="O区MLSS(mg/L)"
                rules={[{ required: true, message: '请输入O区MLSS' }]}
              >
                <Input placeholder="例如: 3500" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="sv30"
                label="SV30(mL/L)"
                rules={[{ required: true, message: '请输入SV30' }]}
              >
                <Input placeholder="例如: 250" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="svi"
                label="SVI(mL/g)"
              >
                <Input placeholder="例如: 120" />
              </Form.Item>
            </Col>
          </Row>
          
          <Divider orientation="left">其他参数</Divider>
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item
                name="temperature"
                label="水温(℃)"
                rules={[{ required: true, message: '请输入水温' }]}
              >
                <Input placeholder="例如: 22" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="ph"
                label="pH值"
                rules={[{ required: true, message: '请输入pH值' }]}
              >
                <Input placeholder="例如: 7.2" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="orp"
                label="ORP(mV)"
              >
                <Input placeholder="例如: 150" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="air_flow"
                label="曝气量(m³/h)"
              >
                <Input placeholder="例如: 1200" />
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item
            name="remarks"
            label="备注"
          >
            <Input.TextArea rows={3} placeholder="请输入备注信息..." />
          </Form.Item>
          
          <div className={styles.formActions}>
            <Button onClick={() => navigate('/lab-data')}>
              <RollbackOutlined /> 返回
            </Button>
            <Button type="primary" htmlType="submit" loading={loading}>
              <SaveOutlined /> 提交
            </Button>
          </div>
        </Form>
      </Card>
      
      <Card 
        title="最近AO池数据" 
        className={styles.tableCard}
        extra={
          <Button type="primary" icon={<FileExcelOutlined />} onClick={() => message.info('导出功能开发中')}>
            导出
          </Button>
        }
      >
        <Table 
          columns={columns} 
          dataSource={recentData} 
          rowKey="id"
          loading={loading}
          pagination={false}
          size="small"
        />
      </Card>
    </div>
  );
};

export default AODataEntry;
