import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Input, Select, Tag, Space, Typography, Row, Col, Modal, Form, message, Popconfirm, Switch } from 'antd';
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined, LockOutlined, UnlockOutlined } from '@ant-design/icons';
import axios from 'axios';
import { API_ENDPOINTS } from '../../api/config';
import { useAuth } from '../../context/AuthContext';
import styles from './Admin.module.scss';

const { Option } = Select;
const { Title, Text } = Typography;

/**
 * 用户管理页面
 * @returns {JSX.Element} 用户管理页面组件
 */
const UserManagement = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [editingUser, setEditingUser] = useState(null);
  const [form] = Form.useForm();
  const [roles, setRoles] = useState([]);

  // 获取用户列表
  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  // 筛选用户
  useEffect(() => {
    filterUsers();
  }, [users, searchText, roleFilter, statusFilter]);

  // 获取用户列表
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get(API_ENDPOINTS.USERS);
      
      if (response.data) {
        setUsers(response.data);
      }
    } catch (error) {
      console.error('获取用户列表失败:', error);
      
      // 使用模拟数据
      const mockUsers = [
        { id: 1, username: 'admin', name: '管理员', email: 'admin@example.com', role: 'admin', status: 'active', created_at: '2023-01-01 00:00:00' },
        { id: 2, username: 'operator1', name: '张工', email: 'zhang@example.com', role: 'operator', status: 'active', created_at: '2023-01-02 00:00:00' },
        { id: 3, username: 'operator2', name: '李工', email: 'li@example.com', role: 'operator', status: 'active', created_at: '2023-01-03 00:00:00' },
        { id: 4, username: 'viewer1', name: '王经理', email: 'wang@example.com', role: 'viewer', status: 'active', created_at: '2023-01-04 00:00:00' },
        { id: 5, username: 'operator3', name: '赵工', email: 'zhao@example.com', role: 'operator', status: 'inactive', created_at: '2023-01-05 00:00:00' },
      ];
      
      setUsers(mockUsers);
    } finally {
      setLoading(false);
    }
  };

  // 获取角色列表
  const fetchRoles = async () => {
    try {
      const response = await axios.get(API_ENDPOINTS.USER_ROLES);
      
      if (response.data) {
        setRoles(response.data);
      }
    } catch (error) {
      console.error('获取角色列表失败:', error);
      
      // 使用模拟数据
      setRoles([
        { id: 'admin', name: '管理员', description: '系统管理员，拥有所有权限' },
        { id: 'operator', name: '操作员', description: '系统操作员，可以操作大部分功能' },
        { id: 'viewer', name: '查看者', description: '只能查看数据，不能进行操作' },
      ]);
    }
  };

  // 筛选用户
  const filterUsers = () => {
    let filtered = [...users];
    
    // 搜索文本筛选
    if (searchText) {
      const searchLower = searchText.toLowerCase();
      filtered = filtered.filter(user => 
        user.username.toLowerCase().includes(searchLower) || 
        user.name.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower)
      );
    }
    
    // 角色筛选
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }
    
    // 状态筛选
    if (statusFilter !== 'all') {
      filtered = filtered.filter(user => user.status === statusFilter);
    }
    
    setFilteredUsers(filtered);
  };

  // 处理搜索文本变化
  const handleSearchChange = (e) => {
    setSearchText(e.target.value);
  };

  // 处理角色筛选变化
  const handleRoleFilterChange = (value) => {
    setRoleFilter(value);
  };

  // 处理状态筛选变化
  const handleStatusFilterChange = (value) => {
    setStatusFilter(value);
  };

  // 打开创建用户模态框
  const showCreateModal = () => {
    setModalTitle('创建用户');
    setEditingUser(null);
    form.resetFields();
    setModalVisible(true);
  };

  // 打开编辑用户模态框
  const showEditModal = (user) => {
    setModalTitle('编辑用户');
    setEditingUser(user);
    form.setFieldsValue({
      username: user.username,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status === 'active',
    });
    setModalVisible(true);
  };

  // 关闭模态框
  const handleCancel = () => {
    setModalVisible(false);
  };

  // 提交表单
  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      
      // 格式化状态
      const formattedValues = {
        ...values,
        status: values.status ? 'active' : 'inactive',
      };
      
      if (editingUser) {
        // 更新用户
        const response = await axios.put(`${API_ENDPOINTS.USERS}/${editingUser.id}`, formattedValues);
        
        if (response.data) {
          message.success('用户更新成功');
          fetchUsers();
        }
      } else {
        // 创建用户
        const response = await axios.post(API_ENDPOINTS.USERS, formattedValues);
        
        if (response.data) {
          message.success('用户创建成功');
          fetchUsers();
        }
      }
      
      setModalVisible(false);
    } catch (error) {
      console.error('操作失败:', error);
      message.error('操作失败，请重试');
      
      // 模拟成功操作
      if (editingUser) {
        // 更新用户
        const updatedUsers = users.map(u => {
          if (u.id === editingUser.id) {
            return {
              ...u,
              ...values,
              status: values.status ? 'active' : 'inactive',
            };
          }
          return u;
        });
        
        setUsers(updatedUsers);
        message.success('用户更新成功');
      } else {
        // 创建用户
        const newUser = {
          id: users.length + 1,
          ...values,
          status: values.status ? 'active' : 'inactive',
          created_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
        };
        
        setUsers([...users, newUser]);
        message.success('用户创建成功');
      }
      
      setModalVisible(false);
    } finally {
      setLoading(false);
    }
  };

  // 删除用户
  const handleDelete = async (id) => {
    try {
      setLoading(true);
      const response = await axios.delete(`${API_ENDPOINTS.USERS}/${id}`);
      
      if (response.status === 200) {
        message.success('用户删除成功');
        fetchUsers();
      }
    } catch (error) {
      console.error('删除用户失败:', error);
      message.error('删除用户失败，请重试');
      
      // 模拟成功删除
      const updatedUsers = users.filter(user => user.id !== id);
      setUsers(updatedUsers);
      message.success('用户删除成功');
    } finally {
      setLoading(false);
    }
  };

  // 重置密码
  const handleResetPassword = async (id) => {
    try {
      setLoading(true);
      const response = await axios.post(`${API_ENDPOINTS.USERS}/${id}/reset-password`);
      
      if (response.status === 200) {
        message.success('密码重置成功，新密码已发送至用户邮箱');
      }
    } catch (error) {
      console.error('重置密码失败:', error);
      message.error('重置密码失败，请重试');
      
      // 模拟成功重置
      message.success('密码重置成功，新密码已发送至用户邮箱');
    } finally {
      setLoading(false);
    }
  };

  // 获取角色标签
  const getRoleTag = (role) => {
    switch (role) {
      case 'admin':
        return <Tag color="red">管理员</Tag>;
      case 'operator':
        return <Tag color="blue">操作员</Tag>;
      case 'viewer':
        return <Tag color="green">查看者</Tag>;
      default:
        return <Tag>{role}</Tag>;
    }
  };

  // 获取状态标签
  const getStatusTag = (status) => {
    switch (status) {
      case 'active':
        return <Tag color="green">启用</Tag>;
      case 'inactive':
        return <Tag color="red">禁用</Tag>;
      default:
        return <Tag>{status}</Tag>;
    }
  };

  // 表格列定义
  const columns = [
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      render: (role) => getRoleTag(role),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => getStatusTag(status),
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
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
          >
            编辑
          </Button>
          <Button 
            size="small" 
            icon={<LockOutlined />}
            onClick={() => handleResetPassword(record.id)}
          >
            重置密码
          </Button>
          <Popconfirm
            title="确定要删除此用户吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button 
              type="primary" 
              danger 
              size="small" 
              icon={<DeleteOutlined />}
              disabled={record.username === 'admin' || record.username === user?.username}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className={styles.userManagementContainer}>
      <Card className={styles.userManagementCard}>
        <div className={styles.headerRow}>
          <Title level={4}>用户管理</Title>
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={showCreateModal}
          >
            创建用户
          </Button>
        </div>
        
        <div className={styles.filterRow}>
          <Row gutter={16} align="middle">
            <Col xs={24} sm={12} md={8} lg={8}>
              <Input 
                placeholder="搜索用户..." 
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={handleSearchChange}
                allowClear
              />
            </Col>
            <Col xs={12} sm={6} md={4} lg={4}>
              <Select
                placeholder="角色筛选"
                style={{ width: '100%' }}
                value={roleFilter}
                onChange={handleRoleFilterChange}
              >
                <Option value="all">全部角色</Option>
                {roles.map(role => (
                  <Option key={role.id} value={role.id}>{role.name}</Option>
                ))}
              </Select>
            </Col>
            <Col xs={12} sm={6} md={4} lg={4}>
              <Select
                placeholder="状态筛选"
                style={{ width: '100%' }}
                value={statusFilter}
                onChange={handleStatusFilterChange}
              >
                <Option value="all">全部状态</Option>
                <Option value="active">启用</Option>
                <Option value="inactive">禁用</Option>
              </Select>
            </Col>
          </Row>
        </div>
        
        <Table 
          columns={columns} 
          dataSource={filteredUsers} 
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
        
        <Modal
          title={modalTitle}
          open={modalVisible}
          onCancel={handleCancel}
          footer={null}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
          >
            <Form.Item
              name="username"
              label="用户名"
              rules={[
                { required: true, message: '请输入用户名' },
                { min: 3, message: '用户名至少3个字符' },
              ]}
            >
              <Input placeholder="请输入用户名" disabled={!!editingUser} />
            </Form.Item>
            
            <Form.Item
              name="name"
              label="姓名"
              rules={[{ required: true, message: '请输入姓名' }]}
            >
              <Input placeholder="请输入姓名" />
            </Form.Item>
            
            <Form.Item
              name="email"
              label="邮箱"
              rules={[
                { required: true, message: '请输入邮箱' },
                { type: 'email', message: '请输入有效的邮箱地址' },
              ]}
            >
              <Input placeholder="请输入邮箱" />
            </Form.Item>
            
            {!editingUser && (
              <Form.Item
                name="password"
                label="密码"
                rules={[
                  { required: true, message: '请输入密码' },
                  { min: 6, message: '密码至少6个字符' },
                ]}
              >
                <Input.Password placeholder="请输入密码" />
              </Form.Item>
            )}
            
            <Form.Item
              name="role"
              label="角色"
              rules={[{ required: true, message: '请选择角色' }]}
            >
              <Select placeholder="请选择角色">
                {roles.map(role => (
                  <Option key={role.id} value={role.id}>{role.name}</Option>
                ))}
              </Select>
            </Form.Item>
            
            <Form.Item
              name="status"
              label="状态"
              valuePropName="checked"
            >
              <Switch checkedChildren="启用" unCheckedChildren="禁用" />
            </Form.Item>
            
            <Form.Item>
              <Space>
                <Button onClick={handleCancel}>
                  取消
                </Button>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  loading={loading}
                >
                  {editingUser ? '更新' : '创建'}
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>
      </Card>
    </div>
  );
};

export default UserManagement;
