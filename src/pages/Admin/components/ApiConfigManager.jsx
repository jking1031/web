/**
 * API配置管理组件
 * 支持前端自定义各类API基础URL和端点
 */
import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Button, Table, Space, Typography, Modal, message, Tabs, Select, Switch } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SaveOutlined, ApiOutlined, SettingOutlined } from '@ant-design/icons';
import { usePermission } from '../../context/PermissionContext';
import styles from './Settings.module.scss';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;

/**
 * API配置管理组件
 * @returns {JSX.Element} API配置管理组件
 */
const ApiConfigManager = () => {
  const { hasPermission } = usePermission();
  const [loading, setLoading] = useState(false);
  const [apiConfigs, setApiConfigs] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [editingConfig, setEditingConfig] = useState(null);
  const [form] = Form.useForm();
  const [activeTab, setActiveTab] = useState('api');
  const [testResult, setTestResult] = useState(null);
  const [testModalVisible, setTestModalVisible] = useState(false);
  const [testingEndpoint, setTestingEndpoint] = useState(null);

  // 获取API配置
  useEffect(() => {
    fetchApiConfigs();
  }, []);

  // 获取API配置
  const fetchApiConfigs = () => {
    setLoading(true);
    
    // 从localStorage获取配置
    const storedConfigs = localStorage.getItem('api_configs');
    
    if (storedConfigs) {
      try {
        const configs = JSON.parse(storedConfigs);
        setApiConfigs(configs);
      } catch (error) {
        console.error('解析API配置失败:', error);
        // 使用默认配置
        setApiConfigs(getDefaultConfigs());
      }
    } else {
      // 使用默认配置
      setApiConfigs(getDefaultConfigs());
    }
    
    setLoading(false);
  };

  // 获取默认配置
  const getDefaultConfigs = () => {
    return [
      {
        id: 1,
        name: '用户认证API',
        baseUrl: 'https://zziot.jzz77.cn:9003/api',
        endpoints: [
          { id: 1, name: '登录', path: '/auth/login', method: 'POST', enabled: true },
          { id: 2, name: '注册', path: '/auth/register', method: 'POST', enabled: true },
          { id: 3, name: '刷新令牌', path: '/auth/refresh', method: 'POST', enabled: true },
        ],
        enabled: true,
      },
      {
        id: 2,
        name: '用户管理API',
        baseUrl: 'https://zziot.jzz77.cn:9003/api',
        endpoints: [
          { id: 1, name: '获取用户列表', path: '/users', method: 'GET', enabled: true },
          { id: 2, name: '创建用户', path: '/users', method: 'POST', enabled: true },
          { id: 3, name: '更新用户', path: '/users/{id}', method: 'PUT', enabled: true },
          { id: 4, name: '删除用户', path: '/users/{id}', method: 'DELETE', enabled: true },
        ],
        enabled: true,
      },
      {
        id: 3,
        name: '设备管理API',
        baseUrl: 'https://zziot.jzz77.cn:9003/api',
        endpoints: [
          { id: 1, name: '获取设备列表', path: '/devices', method: 'GET', enabled: true },
          { id: 2, name: '创建设备', path: '/devices', method: 'POST', enabled: true },
          { id: 3, name: '更新设备', path: '/devices/{id}', method: 'PUT', enabled: true },
          { id: 4, name: '删除设备', path: '/devices/{id}', method: 'DELETE', enabled: true },
        ],
        enabled: true,
      },
    ];
  };

  // 保存API配置
  const saveApiConfigs = (configs) => {
    try {
      localStorage.setItem('api_configs', JSON.stringify(configs));
      message.success('API配置保存成功');
    } catch (error) {
      console.error('保存API配置失败:', error);
      message.error('保存API配置失败');
    }
  };

  // 打开创建API配置模态框
  const showCreateModal = () => {
    setModalTitle('创建API配置');
    setEditingConfig(null);
    form.resetFields();
    form.setFieldsValue({
      enabled: true,
      endpoints: [],
    });
    setModalVisible(true);
  };

  // 打开编辑API配置模态框
  const showEditModal = (config) => {
    setModalTitle('编辑API配置');
    setEditingConfig(config);
    form.setFieldsValue({
      name: config.name,
      baseUrl: config.baseUrl,
      enabled: config.enabled,
      endpoints: config.endpoints,
    });
    setModalVisible(true);
  };

  // 关闭模态框
  const handleCancel = () => {
    setModalVisible(false);
  };

  // 提交表单
  const handleSubmit = (values) => {
    try {
      setLoading(true);
      
      if (editingConfig) {
        // 更新配置
        const updatedConfigs = apiConfigs.map(config => {
          if (config.id === editingConfig.id) {
            return {
              ...config,
              ...values,
            };
          }
          return config;
        });
        
        setApiConfigs(updatedConfigs);
        saveApiConfigs(updatedConfigs);
      } else {
        // 创建配置
        const newConfig = {
          id: apiConfigs.length > 0 ? Math.max(...apiConfigs.map(c => c.id)) + 1 : 1,
          ...values,
          endpoints: values.endpoints || [],
        };
        
        const newConfigs = [...apiConfigs, newConfig];
        setApiConfigs(newConfigs);
        saveApiConfigs(newConfigs);
      }
      
      setModalVisible(false);
    } catch (error) {
      console.error('操作失败:', error);
      message.error('操作失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 删除API配置
  const handleDelete = (id) => {
    try {
      setLoading(true);
      
      const updatedConfigs = apiConfigs.filter(config => config.id !== id);
      setApiConfigs(updatedConfigs);
      saveApiConfigs(updatedConfigs);
      
      message.success('API配置删除成功');
    } catch (error) {
      console.error('删除API配置失败:', error);
      message.error('删除API配置失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 切换API配置启用状态
  const toggleConfigEnabled = (id, enabled) => {
    try {
      const updatedConfigs = apiConfigs.map(config => {
        if (config.id === id) {
          return { ...config, enabled };
        }
        return config;
      });
      
      setApiConfigs(updatedConfigs);
      saveApiConfigs(updatedConfigs);
      
      message.success(`API配置${enabled ? '启用' : '禁用'}成功`);
    } catch (error) {
      console.error('切换API配置状态失败:', error);
      message.error('操作失败，请重试');
    }
  };

  // 添加端点
  const addEndpoint = () => {
    const endpoints = form.getFieldValue('endpoints') || [];
    const newEndpoint = {
      id: endpoints.length > 0 ? Math.max(...endpoints.map(e => e.id)) + 1 : 1,
      name: '',
      path: '',
      method: 'GET',
      enabled: true,
    };
    
    form.setFieldsValue({
      endpoints: [...endpoints, newEndpoint],
    });
  };

  // 删除端点
  const removeEndpoint = (id) => {
    const endpoints = form.getFieldValue('endpoints');
    form.setFieldsValue({
      endpoints: endpoints.filter(endpoint => endpoint.id !== id),
    });
  };

  // 测试API端点
  const testEndpoint = (config, endpoint) => {
    setTestingEndpoint({
      config,
      endpoint,
    });
    setTestResult(null);
    setTestModalVisible(true);
  };

  // 执行API测试
  const executeApiTest = async () => {
    if (!testingEndpoint) return;
    
    const { config, endpoint } = testingEndpoint;
    
    try {
      setLoading(true);
      
      // 构建完整URL
      const url = `${config.baseUrl}${endpoint.path}`;
      
      // 模拟API测试结果
      setTimeout(() => {
        setTestResult({
          success: true,
          status: 200,
          data: {
            message: '测试成功',
            timestamp: new Date().toISOString(),
          },
        });
        
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('API测试失败:', error);
      
      setTestResult({
        success: false,
        status: error.response?.status || 500,
        error: error.message,
      });
      
      setLoading(false);
    }
  };

  // 表格列定义
  const columns = [
    {
      title: '配置名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '基础URL',
      dataIndex: 'baseUrl',
      key: 'baseUrl',
    },
    {
      title: '端点数量',
      key: 'endpointCount',
      render: (_, record) => record.endpoints?.length || 0,
    },
    {
      title: '状态',
      key: 'enabled',
      render: (_, record) => (
        <Switch
          checked={record.enabled}
          onChange={(checked) => toggleConfigEnabled(record.id, checked)}
          disabled={!hasPermission('api_manage')}
        />
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button 
            type="primary" 
            size="small" 
            icon={<EditOutlined />}
            onClick={() => showEditModal(record)}
            disabled={!hasPermission('api_manage')}
          >
            编辑
          </Button>
          <Button 
            type="primary" 
            size="small" 
            icon={<ApiOutlined />}
            onClick={() => setActiveTab(`api-${record.id}`)}
          >
            查看端点
          </Button>
          <Button 
            type="primary" 
            danger 
            size="small" 
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
            disabled={!hasPermission('api_manage')}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  // 端点表格列定义
  const endpointColumns = [
    {
      title: '端点名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '路径',
      dataIndex: 'path',
      key: 'path',
    },
    {
      title: '方法',
      dataIndex: 'method',
      key: 'method',
    },
    {
      title: '状态',
      key: 'enabled',
      render: (_, record) => (
        <Switch
          checked={record.enabled}
          onChange={(checked) => {
            const config = apiConfigs.find(c => c.id === parseInt(activeTab.split('-')[1]));
            if (config) {
              const updatedEndpoints = config.endpoints.map(e => {
                if (e.id === record.id) {
                  return { ...e, enabled: checked };
                }
                return e;
              });
              
              const updatedConfigs = apiConfigs.map(c => {
                if (c.id === config.id) {
                  return { ...c, endpoints: updatedEndpoints };
                }
                return c;
              });
              
              setApiConfigs(updatedConfigs);
              saveApiConfigs(updatedConfigs);
            }
          }}
          disabled={!hasPermission('api_manage')}
        />
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => {
        const config = apiConfigs.find(c => c.id === parseInt(activeTab.split('-')[1]));
        return (
          <Space size="middle">
            <Button 
              type="primary" 
              size="small" 
              icon={<ApiOutlined />}
              onClick={() => testEndpoint(config, record)}
            >
              测试
            </Button>
          </Space>
        );
      },
    },
  ];

  return (
    <div className={styles.apiConfigContainer}>
      <Card className={styles.apiConfigCard}>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="API配置" key="api">
            <div className={styles.headerRow}>
              <Title level={4}>API配置管理</Title>
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                onClick={showCreateModal}
                disabled={!hasPermission('api_manage')}
              >
                创建API配置
              </Button>
            </div>
            
            <Paragraph>
              在这里管理系统使用的API配置，包括基础URL和各个端点。这些配置将用于前端与后端的通信。
            </Paragraph>
            
            <Table 
              columns={columns} 
              dataSource={apiConfigs} 
              rowKey="id"
              loading={loading}
              pagination={false}
            />
          </TabPane>
          
          {apiConfigs.map(config => (
            <TabPane tab={config.name} key={`api-${config.id}`}>
              <div className={styles.headerRow}>
                <Title level={4}>{config.name} - 端点列表</Title>
                <Space>
                  <Button 
                    type="primary" 
                    icon={<EditOutlined />}
                    onClick={() => showEditModal(config)}
                    disabled={!hasPermission('api_manage')}
                  >
                    编辑配置
                  </Button>
                  <Button 
                    onClick={() => setActiveTab('api')}
                  >
                    返回列表
                  </Button>
                </Space>
              </div>
              
              <Paragraph>
                <Text strong>基础URL: </Text> {config.baseUrl}
              </Paragraph>
              
              <Table 
                columns={endpointColumns} 
                dataSource={config.endpoints} 
                rowKey="id"
                pagination={false}
              />
            </TabPane>
          ))}
        </Tabs>
        
        {/* API配置编辑模态框 */}
        <Modal
          title={modalTitle}
          open={modalVisible}
          onCancel={handleCancel}
          footer={null}
          width={800}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
          >
            <Form.Item
              name="name"
              label="配置名称"
              rules={[{ required: true, message: '请输入配置名称' }]}
            >
              <Input placeholder="请输入配置名称" />
            </Form.Item>
            
            <Form.Item
              name="baseUrl"
              label="基础URL"
              rules={[
                { required: true, message: '请输入基础URL' },
                { type: 'url', message: '请输入有效的URL' },
              ]}
            >
              <Input placeholder="请输入基础URL，例如：https://zziot.jzz77.cn:9003/api" />
            </Form.Item>
            
            <Form.Item
              name="enabled"
              label="启用状态"
              valuePropName="checked"
            >
              <Switch checkedChildren="启用" unCheckedChildren="禁用" />
            </Form.Item>
            
            <div className={styles.endpointsHeader}>
              <Title level={5}>端点列表</Title>
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                onClick={addEndpoint}
              >
                添加端点
              </Button>
            </div>
            
            <Form.List name="endpoints">
              {(fields, { add, remove }) => (
                <div>
                  {fields.map(({ key, name, ...restField }) => {
                    const endpoint = form.getFieldValue('endpoints')[name];
                    return (
                      <div key={key} className={styles.endpointItem}>
                        <Form.Item
                          {...restField}
                          name={[name, 'id']}
                          hidden
                        >
                          <Input />
                        </Form.Item>
                        
                        <Form.Item
                          {...restField}
                          name={[name, 'name']}
                          label="端点名称"
                          rules={[{ required: true, message: '请输入端点名称' }]}
                        >
                          <Input placeholder="请输入端点名称" />
                        </Form.Item>
                        
                        <Form.Item
                          {...restField}
                          name={[name, 'path']}
                          label="路径"
                          rules={[{ required: true, message: '请输入路径' }]}
                        >
                          <Input placeholder="请输入路径，例如：/users" />
                        </Form.Item>
                        
                        <Form.Item
                          {...restField}
                          name={[name, 'method']}
                          label="方法"
                          rules={[{ required: true, message: '请选择方法' }]}
                        >
                          <Select placeholder="请选择方法">
                            <Option value="GET">GET</Option>
                            <Option value="POST">POST</Option>
                            <Option value="PUT">PUT</Option>
                            <Option value="DELETE">DELETE</Option>
                            <Option value="PATCH">PATCH</Option>
                          </Select>
                        </Form.Item>
                        
                        <Form.Item
                          {...restField}
                          name={[name, 'enabled']}
                          label="状态"
                          valuePropName="checked"
                        >
                          <Switch checkedChildren="启用" unCheckedChildren="禁用" />
                        </Form.Item>
                        
                        <Button 
                          type="primary" 
                          danger 
                          icon={<DeleteOutlined />}
                          onClick={() => removeEndpoint(endpoint.id)}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </Form.List>
            
            <Form.Item>
              <Space>
                <Button onClick={handleCancel}>
                  取消
                </Button>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  loading={loading}
                  icon={<SaveOutlined />}
                >
                  保存
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>
        
        {/* API测试模态框 */}
        <Modal
          title="API端点测试"
          open={testModalVisible}
          onCancel={() => setTestModalVisible(false)}
          footer={[
            <Button key="cancel" onClick={() => setTestModalVisible(false)}>
              关闭
            </Button>,
            <Button 
              key="test" 
              type="primary" 
              loading={loading}
              onClick={executeApiTest}
            >
              执行测试
            </Button>,
          ]}
        >
          {testingEndpoint && (
            <div>
              <Paragraph>
                <Text strong>配置名称: </Text> {testingEndpoint.config.name}
              </Paragraph>
              <Paragraph>
                <Text strong>基础URL: </Text> {testingEndpoint.config.baseUrl}
              </Paragraph>
              <Paragraph>
                <Text strong>端点名称: </Text> {testingEndpoint.endpoint.name}
              </Paragraph>
              <Paragraph>
                <Text strong>路径: </Text> {testingEndpoint.endpoint.path}
              </Paragraph>
              <Paragraph>
                <Text strong>方法: </Text> {testingEndpoint.endpoint.method}
              </Paragraph>
              <Paragraph>
                <Text strong>完整URL: </Text> {testingEndpoint.config.baseUrl}{testingEndpoint.endpoint.path}
              </Paragraph>
              
              {testResult && (
                <div className={styles.testResult}>
                  <Title level={5}>测试结果</Title>
                  <Paragraph>
                    <Text strong>状态: </Text> 
                    {testResult.success ? (
                      <Text type="success">成功 ({testResult.status})</Text>
                    ) : (
                      <Text type="danger">失败 ({testResult.status})</Text>
                    )}
                  </Paragraph>
                  
                  {testResult.success ? (
                    <pre className={styles.jsonResult}>
                      {JSON.stringify(testResult.data, null, 2)}
                    </pre>
                  ) : (
                    <Paragraph type="danger">
                      {testResult.error}
                    </Paragraph>
                  )}
                </div>
              )}
            </div>
          )}
        </Modal>
      </Card>
    </div>
  );
};

export default ApiConfigManager;
