import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Button, DatePicker, Select, Table, message, Row, Col, Typography, Divider, Space } from 'antd';
import { SaveOutlined, RollbackOutlined, FileExcelOutlined, SearchOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import dayjs from 'dayjs';
import { API_ENDPOINTS } from '../../api/config';
import { useAuth } from '../../context/AuthContext';
import styles from './LabData.module.scss';

const { Option } = Select;
const { Title, Text } = Typography;

/**
 * 常规化验数据录入页面
 * @returns {JSX.Element} 常规化验数据录入页面组件
 */
const LabDataEntry = () => {
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
        if (response.data && Array.isArray(response.data)) {
          setSites(response.data);
          if (response.data.length > 0) {
            setSelectedSite(response.data[0].id);
            form.setFieldsValue({ site_id: response.data[0].id });
          }
        } else {
          throw new Error('站点数据格式不正确');
        }
      } catch (error) {
        console.error('获取站点列表失败:', error);
        message.error('获取站点列表失败，使用模拟数据');

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

  // 获取最近的化验数据
  useEffect(() => {
    if (selectedSite) {
      fetchRecentData();
    }
  }, [selectedSite]);

  // 获取最近的化验数据
  const fetchRecentData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_ENDPOINTS.LAB_DATA}?site_id=${selectedSite}&limit=5`);

      if (response.data && Array.isArray(response.data)) {
        setRecentData(response.data);
      } else {
        throw new Error('返回数据格式不正确');
      }
    } catch (error) {
      console.error('获取最近化验数据失败:', error);

      // 使用模拟数据
      const mockData = [];
      for (let i = 0; i < 5; i++) {
        const date = dayjs().subtract(i, 'day').format('YYYY-MM-DD');
        mockData.push({
          id: `lab_${i}`,
          date,
          site_id: selectedSite,
          operator: '张工',
          in_cod: Math.floor(Math.random() * 200) + 300,
          in_bod: Math.floor(Math.random() * 100) + 150,
          in_nh3n: Math.floor(Math.random() * 20) + 30,
          in_tp: (Math.random() * 3 + 2).toFixed(2),
          in_tn: Math.floor(Math.random() * 30) + 40,
          out_cod: Math.floor(Math.random() * 30) + 20,
          out_bod: Math.floor(Math.random() * 10) + 5,
          out_nh3n: Math.floor(Math.random() * 5) + 1,
          out_tp: (Math.random() * 0.5 + 0.1).toFixed(2),
          out_tn: Math.floor(Math.random() * 10) + 5,
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
        id: `lab_${Date.now()}`,
      };

      // 提交数据
      const response = await axios.post(API_ENDPOINTS.LAB_DATA_ENTRY, formattedValues);

      if (response.status === 201) {
        message.success('化验数据提交成功');
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
      console.error('提交化验数据失败:', error);
      message.error('提交化验数据失败，请重试');
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
      title: '进水COD(mg/L)',
      dataIndex: 'in_cod',
      key: 'in_cod',
    },
    {
      title: '进水氨氮(mg/L)',
      dataIndex: 'in_nh3n',
      key: 'in_nh3n',
    },
    {
      title: '进水总磷(mg/L)',
      dataIndex: 'in_tp',
      key: 'in_tp',
    },
    {
      title: '出水COD(mg/L)',
      dataIndex: 'out_cod',
      key: 'out_cod',
    },
    {
      title: '出水氨氮(mg/L)',
      dataIndex: 'out_nh3n',
      key: 'out_nh3n',
    },
    {
      title: '出水总磷(mg/L)',
      dataIndex: 'out_tp',
      key: 'out_tp',
    },
    {
      title: '填报人',
      dataIndex: 'operator',
      key: 'operator',
    },
  ];

  return (
    <div className={styles.dataEntryContainer}>
      <Title level={4}>常规化验数据录入</Title>

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

          <Divider orientation="left">进水水质</Divider>
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item
                name="in_cod"
                label="进水COD(mg/L)"
                rules={[{ required: true, message: '请输入进水COD' }]}
              >
                <Input placeholder="例如: 350" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="in_bod"
                label="进水BOD(mg/L)"
              >
                <Input placeholder="例如: 180" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="in_nh3n"
                label="进水氨氮(mg/L)"
                rules={[{ required: true, message: '请输入进水氨氮' }]}
              >
                <Input placeholder="例如: 35" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="in_tp"
                label="进水总磷(mg/L)"
                rules={[{ required: true, message: '请输入进水总磷' }]}
              >
                <Input placeholder="例如: 4.5" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item
                name="in_tn"
                label="进水总氮(mg/L)"
              >
                <Input placeholder="例如: 45" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="in_ss"
                label="进水SS(mg/L)"
              >
                <Input placeholder="例如: 220" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="in_ph"
                label="进水pH值"
              >
                <Input placeholder="例如: 7.2" />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left">出水水质</Divider>
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item
                name="out_cod"
                label="出水COD(mg/L)"
                rules={[{ required: true, message: '请输入出水COD' }]}
              >
                <Input placeholder="例如: 40" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="out_bod"
                label="出水BOD(mg/L)"
              >
                <Input placeholder="例如: 10" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="out_nh3n"
                label="出水氨氮(mg/L)"
                rules={[{ required: true, message: '请输入出水氨氮' }]}
              >
                <Input placeholder="例如: 2" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="out_tp"
                label="出水总磷(mg/L)"
                rules={[{ required: true, message: '请输入出水总磷' }]}
              >
                <Input placeholder="例如: 0.5" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item
                name="out_tn"
                label="出水总氮(mg/L)"
              >
                <Input placeholder="例如: 10" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="out_ss"
                label="出水SS(mg/L)"
              >
                <Input placeholder="例如: 10" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="out_ph"
                label="出水pH值"
              >
                <Input placeholder="例如: 7.0" />
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
        title="最近化验数据"
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

export default LabDataEntry;
