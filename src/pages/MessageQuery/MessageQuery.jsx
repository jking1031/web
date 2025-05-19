import React, { useState, useEffect } from 'react';
import { Card, Form, DatePicker, Button, Table, Select, Input, Spin, Typography, Space, Tag, Badge, Row, Col } from 'antd';
import { SearchOutlined, DownloadOutlined, BellOutlined, InfoCircleOutlined, WarningOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import moment from 'moment';
import apiService from '../../services/apiService';
import styles from './MessageQuery.module.scss';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

/**
 * 消息查询页面
 * 对应移动端的MessageQueryScreen
 */
const MessageQuery = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [messageTypes, setMessageTypes] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });

  // 加载消息类型
  useEffect(() => {
    const fetchMessageTypes = async () => {
      try {
        // 通过API管理器调用获取消息类型API
        const response = await apiService.callApi('getMessageTypes');
        
        if (response && response.success) {
          setMessageTypes(response.data || []);
        }
      } catch (error) {
        console.error('获取消息类型失败:', error);
      }
    };

    fetchMessageTypes();
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
      const startDate = values.dateRange ? values.dateRange[0].format('YYYY-MM-DD') : undefined;
      const endDate = values.dateRange ? values.dateRange[1].format('YYYY-MM-DD') : undefined;
      
      // 通过API管理器调用查询消息API
      const response = await apiService.callApi('queryMessages', {
        startDate,
        endDate,
        keyword: values.keyword,
        type: values.type,
        level: values.level,
        page: pagination.current,
        pageSize: pagination.pageSize
      });
      
      if (response && response.success) {
        setData(response.data.items || []);
        setPagination({
          ...pagination,
          total: response.data.total || 0
        });
      }
    } catch (error) {
      console.error('查询消息失败:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 处理表格分页、排序、筛选变化
   * @param {Object} pagination - 分页信息
   * @param {Object} filters - 筛选信息
   * @param {Object} sorter - 排序信息
   */
  const handleTableChange = (pagination, filters, sorter) => {
    setPagination(pagination);
    
    // 重新查询
    const values = form.getFieldsValue();
    handleSearch(values);
  };

  /**
   * 导出消息数据
   */
  const handleExport = async () => {
    const values = form.getFieldsValue();
    
    try {
      // 格式化日期范围
      const startDate = values.dateRange ? values.dateRange[0].format('YYYY-MM-DD') : undefined;
      const endDate = values.dateRange ? values.dateRange[1].format('YYYY-MM-DD') : undefined;
      
      // 通过API管理器调用导出消息API
      const response = await apiService.callApi('exportMessages', {
        startDate,
        endDate,
        keyword: values.keyword,
        type: values.type,
        level: values.level,
        format: 'excel'
      });
      
      if (response && response.success && response.data.url) {
        // 创建下载链接
        const link = document.createElement('a');
        link.href = response.data.url;
        link.download = `消息查询_${moment().format('YYYY-MM-DD')}.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error('导出消息失败:', error);
    }
  };

  /**
   * 重置表单
   */
  const handleReset = () => {
    form.resetFields();
    setPagination({
      ...pagination,
      current: 1
    });
    setData([]);
  };

  /**
   * 获取消息级别对应的标签颜色
   * @param {string} level - 消息级别
   * @returns {string} 标签颜色
   */
  const getLevelColor = (level) => {
    switch (level) {
      case 'info':
        return 'blue';
      case 'warning':
        return 'orange';
      case 'error':
        return 'red';
      case 'success':
        return 'green';
      default:
        return 'default';
    }
  };

  /**
   * 获取消息级别对应的图标
   * @param {string} level - 消息级别
   * @returns {React.ReactNode} 图标组件
   */
  const getLevelIcon = (level) => {
    switch (level) {
      case 'info':
        return <InfoCircleOutlined />;
      case 'warning':
        return <WarningOutlined />;
      case 'error':
        return <ExclamationCircleOutlined />;
      case 'success':
        return <CheckCircleOutlined />;
      default:
        return <BellOutlined />;
    }
  };

  // 表格列定义
  const columns = [
    {
      title: '消息ID',
      dataIndex: 'id',
      key: 'id',
      width: 80
    },
    {
      title: '消息类型',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (type) => {
        const messageType = messageTypes.find(t => t.value === type);
        return messageType ? messageType.label : type;
      }
    },
    {
      title: '级别',
      dataIndex: 'level',
      key: 'level',
      width: 100,
      render: (level) => (
        <Tag icon={getLevelIcon(level)} color={getLevelColor(level)}>
          {level.toUpperCase()}
        </Tag>
      )
    },
    {
      title: '消息内容',
      dataIndex: 'content',
      key: 'content',
      ellipsis: true
    },
    {
      title: '发送时间',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 180,
      sorter: (a, b) => moment(a.timestamp).valueOf() - moment(b.timestamp).valueOf()
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => (
        <Badge 
          status={status === 'read' ? 'default' : 'processing'} 
          text={status === 'read' ? '已读' : '未读'} 
        />
      )
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" onClick={() => handleViewMessage(record)}>
            查看
          </Button>
          {record.status !== 'read' && (
            <Button type="link" size="small" onClick={() => handleMarkAsRead(record)}>
              标为已读
            </Button>
          )}
        </Space>
      )
    }
  ];

  /**
   * 查看消息详情
   * @param {Object} record - 消息记录
   */
  const handleViewMessage = (record) => {
    // 通过API管理器调用查看消息API
    apiService.callApi('viewMessage', { id: record.id });
    
    // 更新本地数据状态
    const newData = data.map(item => {
      if (item.id === record.id) {
        return { ...item, status: 'read' };
      }
      return item;
    });
    setData(newData);
  };

  /**
   * 标记消息为已读
   * @param {Object} record - 消息记录
   */
  const handleMarkAsRead = (record) => {
    // 通过API管理器调用标记消息为已读API
    apiService.callApi('markMessageAsRead', { id: record.id });
    
    // 更新本地数据状态
    const newData = data.map(item => {
      if (item.id === record.id) {
        return { ...item, status: 'read' };
      }
      return item;
    });
    setData(newData);
  };

  return (
    <div className={styles.messageQueryContainer}>
      <Title level={2} className={styles.pageTitle}>消息查询</Title>
      
      {/* 查询表单 */}
      <Card className={styles.queryCard}>
        <Form
          form={form}
          layout="horizontal"
          onFinish={handleSearch}
          initialValues={{
            dateRange: [moment().subtract(7, 'days'), moment()]
          }}
        >
          <Row gutter={16}>
            <Col xs={24} sm={12} md={8}>
              <Form.Item
                name="dateRange"
                label="日期范围"
              >
                <RangePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Form.Item
                name="keyword"
                label="关键词"
              >
                <Input placeholder="搜索消息内容" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={4}>
              <Form.Item
                name="type"
                label="消息类型"
              >
                <Select placeholder="选择类型" allowClear>
                  {messageTypes.map(type => (
                    <Option key={type.value} value={type.value}>
                      {type.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={4}>
              <Form.Item
                name="level"
                label="消息级别"
              >
                <Select placeholder="选择级别" allowClear>
                  <Option value="info">信息</Option>
                  <Option value="warning">警告</Option>
                  <Option value="error">错误</Option>
                  <Option value="success">成功</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row>
            <Col span={24} style={{ textAlign: 'right' }}>
              <Space>
                <Button onClick={handleReset}>
                  重置
                </Button>
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
            </Col>
          </Row>
        </Form>
      </Card>
      
      {/* 数据表格 */}
      <Card className={styles.dataCard}>
        <div className={styles.tableContainer}>
          <Table
            columns={columns}
            dataSource={data}
            rowKey="id"
            pagination={pagination}
            loading={loading}
            onChange={handleTableChange}
            scroll={{ x: 'max-content' }}
          />
        </div>
      </Card>
    </div>
  );
};

export default MessageQuery;
