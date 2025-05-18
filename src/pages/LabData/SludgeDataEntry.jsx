import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Button, DatePicker, Select, Table, message, Row, Col, Typography, Divider, Space } from 'antd';
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
 * 污泥化验数据录入页面
 * @returns {JSX.Element} 污泥化验数据录入页面组件
 */
const SludgeDataEntry = () => {
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
      operator: user?.name || '',
    });
  }, [form, user]);

  // 获取最近的污泥化验数据
  useEffect(() => {
    if (selectedSite) {
      fetchRecentData();
    }
  }, [selectedSite]);

  // 获取最近的污泥化验数据
  const fetchRecentData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_ENDPOINTS.SLUDGE_DATA}?site_id=${selectedSite}&limit=5`);

      if (response.data && Array.isArray(response.data)) {
        setRecentData(response.data);
      } else {
        throw new Error('返回数据格式不正确');
      }
    } catch (error) {
      console.error('获取最近污泥化验数据失败:', error);

      // 使用模拟数据
      const mockData = [];
      for (let i = 0; i < 5; i++) {
        const date = dayjs().subtract(i, 'day').format('YYYY-MM-DD');
        mockData.push({
          id: `sludge_${i}`,
          date,
          site_id: selectedSite,
          operator: '李工',
          moisture_content: Math.floor(Math.random() * 10) + 75,
          organic_content: Math.floor(Math.random() * 10) + 40,
          sludge_concentration: (Math.random() * 2 + 6).toFixed(2),
          svi: Math.floor(Math.random() * 50) + 100,
          ph: (Math.random() * 1 + 6.5).toFixed(1),
          temperature: Math.floor(Math.random() * 5) + 20,
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

      // 格式化日期
      const formattedValues = {
        ...values,
        date: values.date.format('YYYY-MM-DD'),
        id: `sludge_${Date.now()}`,
      };

      // 提交数据
      const response = await axios.post(API_ENDPOINTS.SLUDGE_DATA, formattedValues);

      if (response.status === 201) {
        message.success('污泥化验数据提交成功');
        // 重新获取最近数据
        fetchRecentData();
        // 重置表单
        form.resetFields();
        form.setFieldsValue({
          date: dayjs(),
          site_id: selectedSite,
          operator: user?.name || '',
        });
      } else {
        throw new Error('提交失败');
      }
    } catch (error) {
      console.error('提交污泥化验数据失败:', error);
      message.error('提交污泥化验数据失败，请重试');
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
      title: '含水率(%)',
      dataIndex: 'moisture_content',
      key: 'moisture_content',
    },
    {
      title: '有机物含量(%)',
      dataIndex: 'organic_content',
      key: 'organic_content',
    },
    {
      title: '污泥浓度(g/L)',
      dataIndex: 'sludge_concentration',
      key: 'sludge_concentration',
    },
    {
      title: 'SVI(mL/g)',
      dataIndex: 'svi',
      key: 'svi',
    },
    {
      title: 'pH值',
      dataIndex: 'ph',
      key: 'ph',
    },
    {
      title: '填报人',
      dataIndex: 'operator',
      key: 'operator',
    },
  ];

  return (
    <div className={styles.dataEntryContainer}>
      <Title level={4}>污泥化验数据录入</Title>

      <Card className={styles.formCard}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            date: dayjs(),
            operator: user?.name || '',
          }}
        >
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="date"
                label="化验日期"
                rules={[{ required: true, message: '请选择化验日期' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="site_id"
                label="站点"
                rules={[{ required: true, message: '请选择站点' }]}
              >
                <Select
                  placeholder="请选择站点"
                  onChange={handleSiteChange}
                >
                  {Array.isArray(sites) && sites.map(site => (
                    <Option key={site.id} value={site.id}>{site.name}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="operator"
                label="化验员"
                rules={[{ required: true, message: '请输入化验员姓名' }]}
              >
                <Input placeholder="请输入化验员姓名" />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left">污泥特性</Divider>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="moisture_content"
                label="含水率(%)"
                rules={[{ required: true, message: '请输入含水率' }]}
              >
                <Input placeholder="例如: 80" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="organic_content"
                label="有机物含量(%)"
                rules={[{ required: true, message: '请输入有机物含量' }]}
              >
                <Input placeholder="例如: 45" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="sludge_concentration"
                label="污泥浓度(g/L)"
                rules={[{ required: true, message: '请输入污泥浓度' }]}
              >
                <Input placeholder="例如: 8.5" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="svi"
                label="SVI(mL/g)"
                rules={[{ required: true, message: '请输入SVI' }]}
              >
                <Input placeholder="例如: 120" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="ph"
                label="pH值"
              >
                <Input placeholder="例如: 7.2" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="temperature"
                label="温度(℃)"
              >
                <Input placeholder="例如: 22" />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left">污泥处理</Divider>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="daily_production"
                label="日产量(吨)"
              >
                <Input placeholder="例如: 25" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="dewatering_efficiency"
                label="脱水效率(%)"
              >
                <Input placeholder="例如: 95" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="polymer_dosage"
                label="药剂投加量(kg/t)"
              >
                <Input placeholder="例如: 3.5" />
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
        title="最近污泥化验数据"
        className={styles.tableCard}
        extra={
          <Button type="primary" icon={<FileExcelOutlined />} onClick={() => message.info('导出功能开发中')}>
            导出
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={Array.isArray(recentData) ? recentData : []}
          rowKey="id"
          loading={loading}
          pagination={false}
          size="small"
        />
      </Card>
    </div>
  );
};

export default SludgeDataEntry;
