import React, { useState, useEffect } from 'react';
import { 
  Card, Button, Table, Tag, Space, Input, 
  Divider, message, Tooltip, Modal, Form, Select
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, 
  SearchOutlined, ReloadOutlined, ApiOutlined,
  SettingOutlined, InfoCircleOutlined
} from '@ant-design/icons';
import { ApiEditorModal } from '../../../components/ApiEditor';
import apiManager from '../../../services/apiManager';
import { API_METHODS, API_CATEGORIES, API_STATUS } from '../../../constants/apiConstants';
import './ApiManagement.scss';

const { Option } = Select;

/**
 * API管理页面
 * 用于管理系统中的所有API
 */
const ApiManagement = () => {
  // 状态
  const [loading, setLoading] = useState(false);
  const [apis, setApis] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [filteredApis, setFilteredApis] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedMethod, setSelectedMethod] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [apiEditorVisible, setApiEditorVisible] = useState(false);
  
  // 获取API列表
  const fetchApis = async () => {
    setLoading(true);
    try {
      const allApis = await apiManager.registry.getAll();
      setApis(allApis);
      applyFilters(allApis, searchText, selectedCategory, selectedMethod, selectedStatus);
    } catch (error) {
      console.error('获取API列表失败:', error);
      message.error('获取API列表失败');
    } finally {
      setLoading(false);
    }
  };
  
  // 初始加载
  useEffect(() => {
    fetchApis();
  }, []);
  
  // 应用过滤器
  const applyFilters = (apiList, text, category, method, status) => {
    let filtered = [...apiList];
    
    // 文本搜索
    if (text) {
      const lowerText = text.toLowerCase();
      filtered = filtered.filter(api => 
        api.key.toLowerCase().includes(lowerText) || 
        api.name.toLowerCase().includes(lowerText) || 
        api.url.toLowerCase().includes(lowerText) ||
        api.description?.toLowerCase().includes(lowerText)
      );
    }
    
    // 分类过滤
    if (category && category !== 'all') {
      filtered = filtered.filter(api => api.category === category);
    }
    
    // 方法过滤
    if (method && method !== 'all') {
      filtered = filtered.filter(api => api.method === method);
    }
    
    // 状态过滤
    if (status && status !== 'all') {
      filtered = filtered.filter(api => api.status === status);
    }
    
    setFilteredApis(filtered);
  };
  
  // 处理搜索
  const handleSearch = (e) => {
    const text = e.target.value;
    setSearchText(text);
    applyFilters(apis, text, selectedCategory, selectedMethod, selectedStatus);
  };
  
  // 处理分类过滤
  const handleCategoryChange = (value) => {
    setSelectedCategory(value);
    applyFilters(apis, searchText, value, selectedMethod, selectedStatus);
  };
  
  // 处理方法过滤
  const handleMethodChange = (value) => {
    setSelectedMethod(value);
    applyFilters(apis, searchText, selectedCategory, value, selectedStatus);
  };
  
  // 处理状态过滤
  const handleStatusChange = (value) => {
    setSelectedStatus(value);
    applyFilters(apis, searchText, selectedCategory, selectedMethod, value);
  };
  
  // 显示API编辑器
  const showApiEditor = () => {
    setApiEditorVisible(true);
  };
  
  // 关闭API编辑器
  const closeApiEditor = () => {
    setApiEditorVisible(false);
    // 刷新API列表
    fetchApis();
  };
  
  // 表格列定义
  const columns = [
    {
      title: 'API键名',
      dataIndex: 'key',
      key: 'key',
      width: 200,
      ellipsis: true
    },
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      width: 150,
      ellipsis: true
    },
    {
      title: 'URL',
      dataIndex: 'url',
      key: 'url',
      ellipsis: true
    },
    {
      title: '方法',
      dataIndex: 'method',
      key: 'method',
      width: 80,
      render: (method) => (
        <Tag color={
          method === API_METHODS.GET ? 'blue' :
          method === API_METHODS.POST ? 'green' :
          method === API_METHODS.PUT ? 'orange' :
          method === API_METHODS.DELETE ? 'red' : 'default'
        }>
          {method}
        </Tag>
      )
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 100,
      render: (category) => (
        <Tag color="purple">{category}</Tag>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status) => (
        <Tag color={status === API_STATUS.ENABLED ? 'success' : 'error'}>
          {status === API_STATUS.ENABLED ? '启用' : '禁用'}
        </Tag>
      )
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_, record) => (
        <Space>
          <Tooltip title="编辑">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => {
                // 打开API编辑器并选中当前API
                showApiEditor();
              }}
            />
          </Tooltip>
          <Tooltip title="删除">
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={() => {
                Modal.confirm({
                  title: '确认删除',
                  content: `确定要删除API "${record.name}" 吗？`,
                  okText: '确定',
                  cancelText: '取消',
                  onOk: async () => {
                    try {
                      await apiManager.registry.remove(record.key);
                      message.success(`API "${record.name}" 已删除`);
                      fetchApis();
                    } catch (error) {
                      console.error('删除API失败:', error);
                      message.error('删除API失败');
                    }
                  }
                });
              }}
            />
          </Tooltip>
        </Space>
      )
    }
  ];
  
  return (
    <div className="api-management-container">
      <Card
        title={
          <div className="card-title">
            <ApiOutlined style={{ marginRight: 8 }} />
            API管理
          </div>
        }
        extra={
          <Space>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={showApiEditor}
            >
              新建API
            </Button>
            <Button
              icon={<ReloadOutlined />}
              onClick={fetchApis}
              loading={loading}
            >
              刷新
            </Button>
          </Space>
        }
      >
        <div className="filter-container">
          <Input
            placeholder="搜索API"
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={handleSearch}
            style={{ width: 200 }}
          />
          <Select
            placeholder="分类"
            value={selectedCategory}
            onChange={handleCategoryChange}
            style={{ width: 120 }}
          >
            <Option value="all">所有分类</Option>
            <Option value={API_CATEGORIES.SYSTEM}>系统</Option>
            <Option value={API_CATEGORIES.DATA}>数据</Option>
            <Option value={API_CATEGORIES.USER}>用户</Option>
            <Option value={API_CATEGORIES.DEVICE}>设备</Option>
            <Option value={API_CATEGORIES.REPORT}>报表</Option>
            <Option value={API_CATEGORIES.OTHER}>其他</Option>
          </Select>
          <Select
            placeholder="方法"
            value={selectedMethod}
            onChange={handleMethodChange}
            style={{ width: 120 }}
          >
            <Option value="all">所有方法</Option>
            <Option value={API_METHODS.GET}>GET</Option>
            <Option value={API_METHODS.POST}>POST</Option>
            <Option value={API_METHODS.PUT}>PUT</Option>
            <Option value={API_METHODS.DELETE}>DELETE</Option>
          </Select>
          <Select
            placeholder="状态"
            value={selectedStatus}
            onChange={handleStatusChange}
            style={{ width: 120 }}
          >
            <Option value="all">所有状态</Option>
            <Option value={API_STATUS.ENABLED}>启用</Option>
            <Option value={API_STATUS.DISABLED}>禁用</Option>
          </Select>
        </div>
        
        <Divider style={{ margin: '16px 0' }} />
        
        <Table
          columns={columns}
          dataSource={filteredApis}
          rowKey="key"
          loading={loading}
          pagination={{ pageSize: 10 }}
          size="middle"
        />
      </Card>
      
      <ApiEditorModal
        visible={apiEditorVisible}
        onClose={closeApiEditor}
      />
    </div>
  );
};

export default ApiManagement;
