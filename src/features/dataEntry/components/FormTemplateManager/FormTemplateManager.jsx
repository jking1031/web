/**
 * 表单模板管理组件
 * 管理员用于管理表单模板的界面
 */

import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Table, 
  Button, 
  Space, 
  Tag, 
  Modal, 
  message, 
  Input, 
  Select, 
  Popconfirm,
  Typography,
  Row,
  Col,
  Statistic,
  Tooltip
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  EyeOutlined,
  PublishedWithChangesOutlined,
  CopyOutlined,
  SearchOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { useAuth } from '../../../../context/AuthContext';
import formTemplateService from '../../services/formTemplateService';
import FormDesigner from '../FormDesigner/FormDesigner';
import FormRenderer from '../FormRenderer/FormRenderer';
import './FormTemplateManager.scss';

const { Title, Text } = Typography;
const { Option } = Select;
const { Search } = Input;

const FormTemplateManager = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [designerVisible, setDesignerVisible] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [stats, setStats] = useState({
    total: 0,
    published: 0,
    draft: 0,
    archived: 0,
  });

  // 初始化加载数据
  useEffect(() => {
    loadTemplates();
    loadCategories();
    loadStats();
  }, []);

  // 加载模板列表
  const loadTemplates = async (params = {}) => {
    try {
      setLoading(true);
      const queryParams = {
        page: pagination.current,
        pageSize: pagination.pageSize,
        search: searchText,
        category: selectedCategory,
        status: selectedStatus,
        ...params,
      };

      const response = await formTemplateService.getTemplates(queryParams);
      
      if (response && response.success) {
        setTemplates(response.data.items || []);
        setPagination(prev => ({
          ...prev,
          total: response.data.total || 0,
        }));
      }
    } catch (error) {
      console.error('加载模板列表失败:', error);
      message.error('加载模板列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 加载分类列表
  const loadCategories = async () => {
    try {
      const response = await formTemplateService.getCategories();
      if (response && response.success) {
        setCategories(response.data || []);
      }
    } catch (error) {
      console.error('加载分类列表失败:', error);
    }
  };

  // 加载统计数据
  const loadStats = async () => {
    try {
      // 这里可以调用统计API，暂时使用模拟数据
      setStats({
        total: templates.length,
        published: templates.filter(t => t.status === 'published').length,
        draft: templates.filter(t => t.status === 'draft').length,
        archived: templates.filter(t => t.status === 'archived').length,
      });
    } catch (error) {
      console.error('加载统计数据失败:', error);
    }
  };

  // 创建新模板
  const handleCreate = () => {
    setSelectedTemplate(null);
    setDesignerVisible(true);
  };

  // 编辑模板
  const handleEdit = (template) => {
    setSelectedTemplate(template);
    setDesignerVisible(true);
  };

  // 预览模板
  const handlePreview = (template) => {
    setSelectedTemplate(template);
    setPreviewVisible(true);
  };

  // 复制模板
  const handleCopy = async (template) => {
    try {
      const newTemplate = {
        ...template,
        name: `${template.name} - 副本`,
        status: 'draft',
      };
      delete newTemplate.id;
      delete newTemplate.createdAt;
      delete newTemplate.updatedAt;

      const response = await formTemplateService.createTemplate(newTemplate);
      if (response && response.success) {
        message.success('模板复制成功');
        loadTemplates();
      }
    } catch (error) {
      console.error('复制模板失败:', error);
      message.error('复制模板失败');
    }
  };

  // 发布模板
  const handlePublish = async (template) => {
    try {
      const response = await formTemplateService.publishTemplate(template.id);
      if (response && response.success) {
        message.success('模板发布成功');
        loadTemplates();
        loadStats();
      }
    } catch (error) {
      console.error('发布模板失败:', error);
      message.error('发布模板失败');
    }
  };

  // 删除模板
  const handleDelete = async (template) => {
    try {
      const response = await formTemplateService.deleteTemplate(template.id);
      if (response && response.success) {
        message.success('模板删除成功');
        loadTemplates();
        loadStats();
      }
    } catch (error) {
      console.error('删除模板失败:', error);
      message.error('删除模板失败');
    }
  };

  // 搜索处理
  const handleSearch = (value) => {
    setSearchText(value);
    setPagination(prev => ({ ...prev, current: 1 }));
    loadTemplates({ search: value, page: 1 });
  };

  // 筛选处理
  const handleFilter = (type, value) => {
    if (type === 'category') {
      setSelectedCategory(value);
    } else if (type === 'status') {
      setSelectedStatus(value);
    }
    setPagination(prev => ({ ...prev, current: 1 }));
    loadTemplates({ [type]: value, page: 1 });
  };

  // 表格分页处理
  const handleTableChange = (newPagination) => {
    setPagination(newPagination);
    loadTemplates({ page: newPagination.current, pageSize: newPagination.pageSize });
  };

  // 设计器保存回调
  const handleDesignerSave = (template) => {
    setDesignerVisible(false);
    loadTemplates();
    loadStats();
  };

  // 状态标签渲染
  const renderStatusTag = (status) => {
    const statusConfig = {
      draft: { color: 'orange', text: '草稿' },
      published: { color: 'green', text: '已发布' },
      archived: { color: 'red', text: '已归档' },
    };
    const config = statusConfig[status] || { color: 'default', text: status };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  // 表格列定义
  const columns = [
    {
      title: '模板名称',
      dataIndex: 'name',
      key: 'name',
      ellipsis: true,
      render: (text, record) => (
        <div>
          <Text strong>{text}</Text>
          {record.description && (
            <div>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                {record.description}
              </Text>
            </div>
          )}
        </div>
      ),
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 120,
      render: (categoryId) => {
        const category = categories.find(c => c.id === categoryId);
        return category ? category.name : categoryId;
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: renderStatusTag,
    },
    {
      title: '版本',
      dataIndex: 'version',
      key: 'version',
      width: 80,
    },
    {
      title: '创建者',
      dataIndex: 'createdBy',
      key: 'createdBy',
      width: 100,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      render: (text) => text ? new Date(text).toLocaleDateString() : '-',
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="预览">
            <Button 
              type="text" 
              icon={<EyeOutlined />} 
              onClick={() => handlePreview(record)}
            />
          </Tooltip>
          <Tooltip title="编辑">
            <Button 
              type="text" 
              icon={<EditOutlined />} 
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Tooltip title="复制">
            <Button 
              type="text" 
              icon={<CopyOutlined />} 
              onClick={() => handleCopy(record)}
            />
          </Tooltip>
          {record.status === 'draft' && (
            <Tooltip title="发布">
              <Button 
                type="text" 
                icon={<PublishedWithChangesOutlined />} 
                onClick={() => handlePublish(record)}
              />
            </Tooltip>
          )}
          <Popconfirm
            title="确定要删除这个模板吗？"
            onConfirm={() => handleDelete(record)}
            okText="确定"
            cancelText="取消"
          >
            <Tooltip title="删除">
              <Button 
                type="text" 
                danger 
                icon={<DeleteOutlined />} 
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="form-template-manager">
      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic title="总模板数" value={stats.total} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="已发布" value={stats.published} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="草稿" value={stats.draft} valueStyle={{ color: '#faad14' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="已归档" value={stats.archived} valueStyle={{ color: '#ff4d4f' }} />
          </Card>
        </Col>
      </Row>

      {/* 主要内容 */}
      <Card>
        <div className="template-manager-header">
          <Title level={4}>表单模板管理</Title>
          <div className="template-manager-actions">
            <Space>
              <Search
                placeholder="搜索模板名称"
                allowClear
                style={{ width: 200 }}
                onSearch={handleSearch}
              />
              <Select
                placeholder="选择分类"
                allowClear
                style={{ width: 120 }}
                onChange={(value) => handleFilter('category', value)}
              >
                {categories.map(category => (
                  <Option key={category.id} value={category.id}>
                    {category.name}
                  </Option>
                ))}
              </Select>
              <Select
                placeholder="选择状态"
                allowClear
                style={{ width: 120 }}
                onChange={(value) => handleFilter('status', value)}
              >
                <Option value="draft">草稿</Option>
                <Option value="published">已发布</Option>
                <Option value="archived">已归档</Option>
              </Select>
              <Button 
                icon={<ReloadOutlined />} 
                onClick={() => loadTemplates()}
              >
                刷新
              </Button>
              <Button 
                type="primary" 
                icon={<PlusOutlined />} 
                onClick={handleCreate}
              >
                创建模板
              </Button>
            </Space>
          </div>
        </div>

        <Table
          columns={columns}
          dataSource={templates}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
          onChange={handleTableChange}
        />
      </Card>

      {/* 表单设计器 */}
      <Modal
        title={selectedTemplate ? "编辑表单模板" : "创建表单模板"}
        open={designerVisible}
        onCancel={() => setDesignerVisible(false)}
        footer={null}
        width="100%"
        style={{ top: 0, paddingBottom: 0 }}
        bodyStyle={{ height: '100vh', padding: 0 }}
      >
        <FormDesigner
          templateId={selectedTemplate?.id}
          onSave={handleDesignerSave}
          onCancel={() => setDesignerVisible(false)}
        />
      </Modal>

      {/* 表单预览 */}
      <Modal
        title="表单预览"
        open={previewVisible}
        onCancel={() => setPreviewVisible(false)}
        footer={null}
        width={800}
        style={{ top: 20 }}
      >
        {selectedTemplate && (
          <FormRenderer
            template={selectedTemplate}
            readonly={true}
            showActions={false}
          />
        )}
      </Modal>
    </div>
  );
};

export default FormTemplateManager; 