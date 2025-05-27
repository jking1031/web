import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Modal,
  message,
  Input,
  Form,
  Popconfirm,
  Switch,
  Tooltip,
  Badge,
  Tabs,
  Radio,
  Drawer,
  Typography,
  Descriptions,
  Alert,
  Divider,
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  EyeOutlined,
  LinkOutlined,
  HistoryOutlined,
  FullscreenOutlined,
  CopyOutlined,
  FormOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { formService } from '../services/formService';
import styles from '../styles/FormModule.module.scss';

const { Title, Text, Paragraph } = Typography;

const FormManagement = () => {
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [submissionModalVisible, setSubmissionModalVisible] = useState(false);
  const [currentFormId, setCurrentFormId] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadForms();
  }, []);

  const loadForms = async () => {
    setLoading(true);
    try {
      const response = await formService.getForms();
      if (response.success) {
        setForms(response.data || []);
      } else {
        message.error(response.message || 'Failed to load forms');
      }
    } catch (error) {
      console.error('Error loading forms:', error);
      message.error('Failed to load forms. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const loadSubmissions = async (formId) => {
    setSubmissionsLoading(true);
    try {
      const response = await formService.getFormSubmissions(formId);
      if (response.success) {
        setSubmissions(response.data || []);
      } else {
        message.error(response.message || 'Failed to load submissions');
      }
    } catch (error) {
      console.error('Error loading submissions:', error);
      message.error('Failed to load submissions. Please try again later.');
    } finally {
      setSubmissionsLoading(false);
    }
  };

  const handleAdd = () => {
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record) => {
    form.setFieldsValue({
      ...record,
      status: record.status === 'active',
    });
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      const response = await formService.deleteForm(id);
      if (response.success) {
        message.success('Form deleted successfully');
        loadForms();
      } else {
        message.error(response.message || 'Failed to delete form');
      }
    } catch (error) {
      console.error('Error deleting form:', error);
      message.error('Failed to delete form. Please try again later.');
    }
  };

  const handleSubmit = async (values) => {
    const formData = {
      ...values,
      status: values.status ? 'active' : 'inactive',
    };

    try {
      let response;
      if (form.getFieldValue('id')) {
        response = await formService.updateForm(form.getFieldValue('id'), formData);
      } else {
        response = await formService.createForm(formData);
      }

      if (response.success) {
        message.success(`Form ${form.getFieldValue('id') ? 'updated' : 'created'} successfully`);
        setModalVisible(false);
        loadForms();
      } else {
        message.error(response.message || `Failed to ${form.getFieldValue('id') ? 'update' : 'create'} form`);
      }
    } catch (error) {
      console.error(`Error ${form.getFieldValue('id') ? 'updating' : 'creating'} form:`, error);
      message.error(`Failed to ${form.getFieldValue('id') ? 'update' : 'create'} form. Please try again later.`);
    }
  };

  const handleViewSubmissions = (id) => {
    setCurrentFormId(id);
    loadSubmissions(id);
    setSubmissionModalVisible(true);
  };

  const handleCopyEmbedCode = (record) => {
    let embedCode = '';
    
    if (record.embedType === 'iframe') {
      embedCode = record.embedCode || `<iframe style="border:none;width:100%;" id="${record.id}" src="${record.embedUrl}"></iframe>`;
    } else {
      embedCode = `<iframe style="border:none;width:100%;" id="${record.id}" src="${record.embedUrl}"></iframe><script type="text/javascript" onload="initEmbed('${record.id}')" src="https://opnform.com/widgets/iframe.min.js"></script>`;
    }
    
    navigator.clipboard.writeText(embedCode)
      .then(() => {
        message.success('嵌入代码已复制到剪贴板');
      })
      .catch(() => {
        message.error('复制嵌入代码失败');
      });
  };

  const columns = [
    {
      title: '表单标题',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '类型',
      dataIndex: 'embedType',
      key: 'embedType',
      render: (text) => text === 'iframe' ? 'iframe嵌入' : '链接嵌入',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Badge status={status ? 'success' : 'default'} text={status ? '启用' : '禁用'} />
      ),
    },
    {
      title: '创建日期',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (text) => new Date(text).toLocaleString('zh-CN'),
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Tooltip title="预览">
            <Button
              type="link"
              icon={<EyeOutlined />}
              onClick={() => navigate(`/forms/preview/${record.id}`)}
            />
          </Tooltip>
          <Tooltip title="编辑">
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Tooltip title="复制嵌入代码">
            <Button
              type="link"
              icon={<CopyOutlined />}
              onClick={() => handleCopyEmbedCode(record)}
            />
          </Tooltip>
          <Tooltip title="查看提交记录">
            <Button
              type="link"
              icon={<HistoryOutlined />}
              onClick={() => handleViewSubmissions(record.id)}
            />
          </Tooltip>
          <Tooltip title="删除">
            <Popconfirm
              title="确定要删除这个表单吗？"
              onConfirm={() => handleDelete(record.id)}
              okText="确定"
              cancelText="取消"
            >
              <Button type="link" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  const submissionColumns = [
    {
      title: '提交ID',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: '提交用户',
      dataIndex: 'submittedBy',
      key: 'submittedBy',
    },
    {
      title: '提交时间',
      dataIndex: 'submittedAt',
      key: 'submittedAt',
      render: (date) => new Date(date).toLocaleString(),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Badge 
          status={status === 'processed' ? 'success' : status === 'pending' ? 'processing' : 'warning'} 
          text={status === 'processed' ? '已处理' : status === 'pending' ? '处理中' : '错误'} 
        />
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button
            type="link"
            onClick={() => {
              Modal.info({
                title: '表单提交数据',
                width: 800,
                content: (
                  <div style={{ maxHeight: '500px', overflow: 'auto' }}>
                    <pre>{JSON.stringify(record.data, null, 2)}</pre>
                  </div>
                ),
              });
            }}
          >
            查看数据
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className={styles['form-management']}>
      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FormOutlined /> 表单管理
          </div>
        }
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
          >
            添加表单
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={forms}
          loading={loading}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 项`,
          }}
        />
      </Card>

      <Modal
        title={form.getFieldValue('id') ? '编辑表单' : '添加表单'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        width={700}
        className={styles['form-edit-modal']}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item name="id" hidden>
            <Input />
          </Form.Item>
          <Form.Item
            name="title"
            label="表单标题"
            rules={[{ required: true, message: '请输入表单标题' }]}
          >
            <Input />
          </Form.Item>
          
          <Form.Item
            name="embedType"
            label="嵌入类型"
            initialValue="link"
          >
            <Radio.Group>
              <Radio value="link">链接方式</Radio>
              <Radio value="iframe">iframe代码方式</Radio>
            </Radio.Group>
          </Form.Item>
          
          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) => prevValues.embedType !== currentValues.embedType}
          >
            {({ getFieldValue }) => 
              getFieldValue('embedType') === 'link' ? (
                <Form.Item
                  name="embedUrl"
                  label="嵌入URL"
                  rules={[{ required: true, message: '请输入嵌入URL' }]}
                  extra="示例: https://opnform.com/forms/loan-application-form-cyuzmj"
                >
                  <Input prefix={<LinkOutlined />} />
                </Form.Item>
              ) : (
                <Form.Item
                  name="embedCode"
                  label="iframe嵌入代码"
                  rules={[{ required: true, message: '请输入iframe嵌入代码' }]}
                  extra="示例: <iframe src='https://example.com/form' width='100%' height='500'></iframe>"
                >
                  <Input.TextArea rows={4} />
                </Form.Item>
              )
            }
          </Form.Item>
          
          <Form.Item
            name="description"
            label="描述"
          >
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item
            name="status"
            label="状态"
            valuePropName="checked"
            initialValue={true}
          >
            <Switch checkedChildren="启用" unCheckedChildren="禁用" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="表单提交记录"
        open={submissionModalVisible}
        onCancel={() => setSubmissionModalVisible(false)}
        footer={null}
        width={1000}
        className={styles['submission-modal']}
      >
        <Table
          columns={submissionColumns}
          dataSource={submissions}
          loading={submissionsLoading}
          rowKey="id"
          pagination={{ pageSize: 5 }}
        />
      </Modal>
    </div>
  );
};

export default FormManagement; 