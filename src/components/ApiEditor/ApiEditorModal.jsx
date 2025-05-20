import React, { useState, useEffect, useCallback } from 'react';
import {
  Modal, Form, Input, Select, Button, Table, Tabs, Space,
  Divider, message, Tooltip, Switch, InputNumber, Tag, Spin,
  Empty
} from 'antd';
import {
  PlusOutlined, DeleteOutlined, EditOutlined,
  PlayCircleOutlined, SaveOutlined, CopyOutlined,
  InfoCircleOutlined, CheckCircleOutlined, CloseCircleOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import apiManager from '../../services/apiManager';
import { API_METHODS, API_CATEGORIES, API_STATUS } from '../../constants/apiConstants';
import JsonEditor from './JsonEditor';
import './ApiEditorModal.scss';

// 不再使用TabPane
const { Option } = Select;
const { TextArea } = Input;

/**
 * API编辑弹窗组件
 * 用于显示、编辑和测试API
 */
const ApiEditorModal = ({ visible, onClose, pageKey }) => {
  // 状态
  const [loading, setLoading] = useState(false);
  const [apis, setApis] = useState([]);
  const [selectedApi, setSelectedApi] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [testParams, setTestParams] = useState({});
  const [activeTab, setActiveTab] = useState('list');
  const [form] = Form.useForm();

  // 获取API列表
  const fetchApis = useCallback(async () => {
    setLoading(true);
    try {
      // 获取所有API
      let allApis = await apiManager.registry.getAll();

      // 确保allApis是数组格式
      if (!Array.isArray(allApis)) {
        console.warn('API配置不是数组格式，尝试转换');
        if (typeof allApis === 'object' && allApis !== null) {
          allApis = Object.keys(allApis).map(key => ({
            key,
            ...allApis[key]
          }));
        } else {
          console.error('无法转换API配置为数组格式');
          allApis = [];
        }
      }

      // 如果指定了页面键，过滤出该页面使用的API
      let filteredApis = allApis;
      if (pageKey) {
        // 获取页面API列表
        const pageApis = await apiManager.registry.getPageApis(pageKey);

        // 如果页面有注册的API，只显示这些API
        if (pageApis && pageApis.length > 0) {
          filteredApis = allApis.filter(api => pageApis.includes(api.key));
        } else {
          // 如果页面没有注册API，但我们知道页面键，则只显示与页面键相关的API
          // 例如，如果页面键是"siteList"，则显示名称或描述中包含"site"或"站点"的API
          const pageKeyLower = pageKey.toLowerCase();
          const relatedTerms = [
            pageKeyLower,
            ...getRelatedTerms(pageKeyLower)
          ];

          filteredApis = allApis.filter(api =>
            relatedTerms.some(term =>
              api.key?.toLowerCase().includes(term) ||
              api.name?.toLowerCase().includes(term) ||
              (api.description && api.description.toLowerCase().includes(term))
            )
          );

          // 如果没有找到相关API，显示空列表
          if (filteredApis.length === 0) {
            filteredApis = [];
          }
        }
      }

      // 确保所有API都有key属性
      filteredApis = filteredApis.filter(api => api && api.key);

      setApis(filteredApis);
    } catch (error) {
      console.error('获取API列表失败:', error);
      message.error('获取API列表失败');
      setApis([]);
    } finally {
      setLoading(false);
    }
  }, [pageKey]);

  // 获取与页面键相关的术语
  const getRelatedTerms = (pageKey) => {
    // 英文到中文的映射
    const termMappings = {
      'site': '站点',
      'user': '用户',
      'device': '设备',
      'report': '报表',
      'data': '数据',
      'alarm': '告警',
      'dashboard': '仪表盘',
      'ticket': '工单',
      'lab': '化验',
      'setting': '设置',
      'query': '查询'
    };

    // 查找相关术语
    const relatedTerms = [];

    // 添加映射的中文术语
    Object.entries(termMappings).forEach(([en, zh]) => {
      if (pageKey.includes(en.toLowerCase())) {
        relatedTerms.push(zh);
      }
    });

    // 添加映射的英文术语
    Object.entries(termMappings).forEach(([en, zh]) => {
      if (pageKey.includes(zh)) {
        relatedTerms.push(en.toLowerCase());
      }
    });

    return relatedTerms;
  };

  // 初始加载
  useEffect(() => {
    if (visible) {
      fetchApis();
    }
  }, [visible, fetchApis]);

  // 选择API
  const handleSelectApi = (api) => {
    setSelectedApi(api);
    setEditMode(false);
    setTestResult(null);

    // 重置表单
    form.setFieldsValue({
      key: api.key,
      name: api.name,
      url: api.url,
      method: api.method,
      category: api.category,
      status: api.status,
      description: api.description,
      timeout: api.timeout,
      retries: api.retries,
      cacheTime: api.cacheTime,
      headers: JSON.stringify(api.headers || {}, null, 2)
    });

    // 设置测试参数
    setTestParams(api.testParams || {});

    // 切换到详情标签
    setActiveTab('detail');
  };

  // 创建新API
  const handleCreateApi = () => {
    setSelectedApi(null);
    setEditMode(true);
    setTestResult(null);

    // 重置表单
    form.resetFields();
    form.setFieldsValue({
      method: API_METHODS.GET,
      category: API_CATEGORIES.SYSTEM,
      status: API_STATUS.ENABLED,
      timeout: 10000,
      retries: 1,
      cacheTime: 60000,
      headers: JSON.stringify({ 'Content-Type': 'application/json' }, null, 2)
    });

    // 设置测试参数
    setTestParams({});

    // 切换到详情标签
    setActiveTab('detail');
  };

  // 编辑API
  const handleEditApi = () => {
    setEditMode(true);
  };

  // 删除API
  const handleDeleteApi = async () => {
    if (!selectedApi) return;

    try {
      await apiManager.registry.remove(selectedApi.key);
      message.success(`API "${selectedApi.name}" 已删除`);
      fetchApis();
      setSelectedApi(null);
      setActiveTab('list');
    } catch (error) {
      console.error('删除API失败:', error);
      message.error('删除API失败');
    }
  };

  // 保存API
  const handleSaveApi = async () => {
    try {
      const values = await form.validateFields();

      // 解析headers
      let headers = {};
      try {
        headers = JSON.parse(values.headers);
      } catch (error) {
        message.error('Headers格式不正确，请输入有效的JSON');
        return;
      }

      const apiConfig = {
        ...values,
        headers,
        testParams
      };

      // 注册或更新API
      if (selectedApi) {
        await apiManager.registry.update(apiConfig.key, apiConfig);
        message.success(`API "${apiConfig.name}" 已更新`);
      } else {
        await apiManager.registry.register(apiConfig.key, apiConfig);
        message.success(`API "${apiConfig.name}" 已创建`);
      }

      // 刷新API列表
      fetchApis();

      // 如果是新建API，选中它
      if (!selectedApi) {
        const newApi = await apiManager.registry.get(apiConfig.key);
        setSelectedApi(newApi);
      }

      // 退出编辑模式
      setEditMode(false);
    } catch (error) {
      console.error('保存API失败:', error);
      message.error('保存API失败');
    }
  };

  // 测试API
  const handleTestApi = async () => {
    if (!selectedApi && !editMode) return;

    try {
      setTestLoading(true);

      // 获取表单值
      const values = await form.validateFields();

      // 解析headers
      let headers = {};
      try {
        headers = JSON.parse(values.headers);
      } catch (error) {
        message.error('Headers格式不正确，请输入有效的JSON');
        setTestLoading(false);
        return;
      }

      const apiConfig = {
        ...values,
        headers,
        testParams
      };

      // 测试API
      const result = await apiManager.test(apiConfig.key, testParams);

      // 显示测试结果
      setTestResult(result);

      // 切换到测试标签
      setActiveTab('test');
    } catch (error) {
      console.error('测试API失败:', error);
      message.error('测试API失败');

      // 显示错误信息
      setTestResult({
        success: false,
        error: error.message || '未知错误'
      });

      // 切换到测试标签
      setActiveTab('test');
    } finally {
      setTestLoading(false);
    }
  };

  // 更新测试参数
  const handleUpdateTestParams = (newParams) => {
    setTestParams(newParams);
  };

  // 复制API配置
  const handleCopyApi = () => {
    if (!selectedApi) return;

    // 创建新的API键名
    const newKey = `${selectedApi.key}_copy`;

    // 设置表单值
    form.setFieldsValue({
      ...form.getFieldsValue(),
      key: newKey,
      name: `${selectedApi.name} (复制)`
    });

    // 进入编辑模式
    setEditMode(true);
    setSelectedApi(null);
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
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleSelectApi(record)}
          />
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => {
              setSelectedApi(record);
              handleDeleteApi();
            }}
          />
        </Space>
      )
    }
  ];

  return (
    <Modal
      title="API编辑器"
      open={visible}
      onCancel={onClose}
      width={1000}
      footer={null}
      destroyOnHidden
      className="api-editor-modal"
    >
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: 'list',
            label: 'API列表',
            children: (
              <>
                <div className="api-list-actions">
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={handleCreateApi}
                  >
                    新建API
                  </Button>
                  <Button
                    onClick={fetchApis}
                    icon={<ReloadOutlined />}
                    loading={loading}
                  >
                    刷新
                  </Button>
                </div>

                <Table
                  columns={columns}
                  dataSource={apis}
                  rowKey="key"
                  loading={loading}
                  pagination={{ pageSize: 10 }}
                  onRow={(record) => ({
                    onClick: () => handleSelectApi(record)
                  })}
                  size="middle"
                />
              </>
            )
          },
          {
            key: 'detail',
            label: 'API详情',
            disabled: !selectedApi && !editMode,
            children: (
              <Form
                form={form}
                layout="vertical"
                disabled={!editMode && !!selectedApi}
              >
                <div className="form-actions">
                  {selectedApi && !editMode && (
                    <>
                      <Button
                        type="primary"
                        icon={<EditOutlined />}
                        onClick={handleEditApi}
                      >
                        编辑
                      </Button>
                      <Button
                        icon={<CopyOutlined />}
                        onClick={handleCopyApi}
                      >
                        复制
                      </Button>
                    </>
                  )}

                  {editMode && (
                    <>
                      <Button
                        type="primary"
                        icon={<SaveOutlined />}
                        onClick={handleSaveApi}
                      >
                        保存
                      </Button>
                      <Button
                        onClick={() => {
                          setEditMode(false);
                          if (!selectedApi) {
                            setActiveTab('list');
                          }
                        }}
                      >
                        取消
                      </Button>
                    </>
                  )}

                  <Button
                    type="primary"
                    icon={<PlayCircleOutlined />}
                    onClick={handleTestApi}
                    disabled={(!selectedApi && !editMode) || testLoading}
                  >
                    测试
                  </Button>
                </div>

                <Divider />

                <div className="form-content">
                  <div className="form-left">
                    <Form.Item
                      label="API键名"
                      name="key"
                      rules={[{ required: true, message: '请输入API键名' }]}
                    >
                      <Input placeholder="例如: getSiteList" />
                    </Form.Item>

                    <Form.Item
                      label="名称"
                      name="name"
                      rules={[{ required: true, message: '请输入API名称' }]}
                    >
                      <Input placeholder="例如: 获取站点列表" />
                    </Form.Item>

                    <Form.Item
                      label="URL"
                      name="url"
                      rules={[{ required: true, message: '请输入API URL' }]}
                    >
                      <Input placeholder="例如: /api/sites 或 https://nodered.jzz77.cn:9003/api/site/sites" />
                    </Form.Item>

                    <Form.Item
                      label="请求方法"
                      name="method"
                      rules={[{ required: true, message: '请选择请求方法' }]}
                    >
                      <Select>
                        <Option value={API_METHODS.GET}>GET</Option>
                        <Option value={API_METHODS.POST}>POST</Option>
                        <Option value={API_METHODS.PUT}>PUT</Option>
                        <Option value={API_METHODS.DELETE}>DELETE</Option>
                      </Select>
                    </Form.Item>

                    <Form.Item
                      label="分类"
                      name="category"
                      rules={[{ required: true, message: '请选择API分类' }]}
                    >
                      <Select>
                        <Option value={API_CATEGORIES.SYSTEM}>系统</Option>
                        <Option value={API_CATEGORIES.DATA}>数据</Option>
                        <Option value={API_CATEGORIES.USER}>用户</Option>
                        <Option value={API_CATEGORIES.DEVICE}>设备</Option>
                        <Option value={API_CATEGORIES.REPORT}>报表</Option>
                        <Option value={API_CATEGORIES.OTHER}>其他</Option>
                      </Select>
                    </Form.Item>

                    <Form.Item
                      label="状态"
                      name="status"
                      valuePropName="checked"
                      getValueFromEvent={(checked) => checked ? API_STATUS.ENABLED : API_STATUS.DISABLED}
                      getValueProps={(value) => ({ checked: value === API_STATUS.ENABLED })}
                    >
                      <Switch checkedChildren="启用" unCheckedChildren="禁用" />
                    </Form.Item>
                  </div>

                  <div className="form-right">
                    <Form.Item
                      label="描述"
                      name="description"
                    >
                      <TextArea rows={4} placeholder="API描述" />
                    </Form.Item>

                    <Form.Item
                      label="超时时间 (毫秒)"
                      name="timeout"
                      rules={[{ required: true, message: '请输入超时时间' }]}
                    >
                      <InputNumber min={1000} max={60000} step={1000} style={{ width: '100%' }} />
                    </Form.Item>

                    <Form.Item
                      label="重试次数"
                      name="retries"
                      rules={[{ required: true, message: '请输入重试次数' }]}
                    >
                      <InputNumber min={0} max={5} style={{ width: '100%' }} />
                    </Form.Item>

                    <Form.Item
                      label="缓存时间 (毫秒)"
                      name="cacheTime"
                      rules={[{ required: true, message: '请输入缓存时间' }]}
                    >
                      <InputNumber min={0} max={3600000} step={1000} style={{ width: '100%' }} />
                    </Form.Item>

                    <Form.Item
                      label="请求头"
                      name="headers"
                      rules={[
                        { required: true, message: '请输入请求头' },
                        {
                          validator: (_, value) => {
                            try {
                              JSON.parse(value);
                              return Promise.resolve();
                            } catch (error) {
                              return Promise.reject('请输入有效的JSON');
                            }
                          }
                        }
                      ]}
                    >
                      <TextArea rows={4} placeholder="请求头 (JSON格式)" />
                    </Form.Item>
                  </div>
                </div>
              </Form>
            )
          },
          {
            key: 'params',
            label: '测试参数',
            disabled: !selectedApi && !editMode,
            children: (
              <div className="test-params-container">
                <div className="test-params-header">
                  <h3>测试参数</h3>
                  <Tooltip title="这些参数将在测试API时使用">
                    <InfoCircleOutlined />
                  </Tooltip>
                </div>

                <JsonEditor
                  value={testParams}
                  onChange={handleUpdateTestParams}
                  height="400px"
                />
              </div>
            )
          },
          {
            key: 'test',
            label: '测试结果',
            disabled: !testResult,
            children: (
              <>
                {testLoading ? (
                  <div className="test-loading">
                    <Spin size="large" tip="正在测试API..." />
                  </div>
                ) : testResult ? (
                  <div className="test-result">
                    <div className="test-result-header">
                      <div className="test-result-status">
                        {testResult.success ? (
                          <Tag color="success" icon={<CheckCircleOutlined />}>测试成功</Tag>
                        ) : (
                          <Tag color="error" icon={<CloseCircleOutlined />}>测试失败</Tag>
                        )}
                      </div>

                      {testResult.time && (
                        <div className="test-result-time">
                          响应时间: {testResult.time}ms
                        </div>
                      )}
                    </div>

                    <Divider />

                    <div className="test-result-content">
                      <h3>响应数据</h3>
                      <JsonEditor
                        value={testResult.data || testResult.error || {}}
                        readOnly
                        height="300px"
                      />
                    </div>
                  </div>
                ) : (
                  <Empty description="暂无测试结果" />
                )}
              </>
            )
          }
        ]}
      />
    </Modal>
  );
};

export default ApiEditorModal;
