import React, { useState, useEffect } from 'react';
import { Card, Avatar, Form, Input, Button, Upload, message, Spin, Tabs, Divider, Typography } from 'antd';
import { UserOutlined, MailOutlined, PhoneOutlined, BankOutlined, UploadOutlined, LockOutlined } from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';
import apiService from '../../services/apiService';
import styles from './Profile.module.scss';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

/**
 * 用户个人资料页面
 * 对应移动端的ProfileScreen
 */
const Profile = () => {
  const { user, updateUserInfo } = useAuth();
  const [form] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar || null);

  // 初始化表单数据
  useEffect(() => {
    if (user) {
      form.setFieldsValue({
        username: user.username,
        email: user.email,
        phone: user.phone,
        department: user.department,
        company: user.company
      });
      setAvatarUrl(user.avatar);
    }
  }, [user, form]);

  /**
   * 处理个人资料更新
   * @param {Object} values - 表单值
   */
  const handleProfileUpdate = async (values) => {
    if (loading) return;
    
    setLoading(true);
    try {
      // 通过API管理器调用更新用户信息API
      const response = await apiService.callApi('updateUserInfo', {
        id: user.id,
        ...values
      });

      if (response && response.success) {
        message.success('个人资料更新成功');
        // 更新全局用户信息
        updateUserInfo({
          ...user,
          ...values
        });
      } else {
        throw new Error(response?.message || '更新失败');
      }
    } catch (error) {
      console.error('更新个人资料失败:', error);
      message.error('更新个人资料失败: ' + (error.message || '未知错误'));
    } finally {
      setLoading(false);
    }
  };

  /**
   * 处理密码更新
   * @param {Object} values - 表单值
   */
  const handlePasswordUpdate = async (values) => {
    if (passwordLoading) return;
    
    if (values.newPassword !== values.confirmPassword) {
      message.error('两次输入的新密码不一致');
      return;
    }
    
    setPasswordLoading(true);
    try {
      // 通过API管理器调用更新密码API
      const response = await apiService.callApi('updatePassword', {
        userId: user.id,
        oldPassword: values.oldPassword,
        newPassword: values.newPassword
      });

      if (response && response.success) {
        message.success('密码更新成功');
        passwordForm.resetFields();
      } else {
        throw new Error(response?.message || '更新失败');
      }
    } catch (error) {
      console.error('更新密码失败:', error);
      message.error('更新密码失败: ' + (error.message || '未知错误'));
    } finally {
      setPasswordLoading(false);
    }
  };

  /**
   * 处理头像上传
   * @param {Object} info - 上传信息
   */
  const handleAvatarUpload = async (info) => {
    if (info.file.status === 'uploading') {
      return;
    }
    
    if (info.file.status === 'done') {
      // 获取上传后的URL
      const avatarUrl = info.file.response.url;
      setAvatarUrl(avatarUrl);
      
      try {
        // 通过API管理器调用更新头像API
        const response = await apiService.callApi('updateUserAvatar', {
          userId: user.id,
          avatarUrl
        });

        if (response && response.success) {
          message.success('头像更新成功');
          // 更新全局用户信息
          updateUserInfo({
            ...user,
            avatar: avatarUrl
          });
        } else {
          throw new Error(response?.message || '更新失败');
        }
      } catch (error) {
        console.error('更新头像失败:', error);
        message.error('更新头像失败: ' + (error.message || '未知错误'));
      }
    } else if (info.file.status === 'error') {
      message.error(`${info.file.name} 上传失败`);
    }
  };

  // 如果用户未登录，显示加载状态
  if (!user) {
    return (
      <div className={styles.loadingContainer}>
        <Spin size="large" />
        <Text>加载用户信息...</Text>
      </div>
    );
  }

  return (
    <div className={styles.profileContainer}>
      <Title level={2} className={styles.pageTitle}>个人资料</Title>
      
      <Card className={styles.profileCard}>
        <Tabs defaultActiveKey="basic">
          <TabPane tab="基本信息" key="basic">
            <div className={styles.avatarSection}>
              <Avatar 
                size={100} 
                icon={<UserOutlined />} 
                src={avatarUrl}
                className={styles.avatar}
              />
              <Upload
                name="avatar"
                listType="picture"
                className={styles.avatarUpload}
                showUploadList={false}
                action="/api/upload/avatar"
                onChange={handleAvatarUpload}
              >
                <Button icon={<UploadOutlined />}>更换头像</Button>
              </Upload>
            </div>
            
            <Divider />
            
            <Form
              form={form}
              layout="vertical"
              onFinish={handleProfileUpdate}
              className={styles.profileForm}
            >
              <Form.Item
                name="username"
                label="用户名"
                rules={[{ required: true, message: '请输入用户名' }]}
              >
                <Input prefix={<UserOutlined />} placeholder="用户名" />
              </Form.Item>
              
              <Form.Item
                name="email"
                label="邮箱"
                rules={[
                  { required: true, message: '请输入邮箱' },
                  { type: 'email', message: '请输入有效的邮箱地址' }
                ]}
              >
                <Input prefix={<MailOutlined />} placeholder="邮箱" />
              </Form.Item>
              
              <Form.Item
                name="phone"
                label="手机号"
                rules={[{ pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号码' }]}
              >
                <Input prefix={<PhoneOutlined />} placeholder="手机号" />
              </Form.Item>
              
              <Form.Item
                name="department"
                label="部门"
              >
                <Input prefix={<BankOutlined />} placeholder="部门" />
              </Form.Item>
              
              <Form.Item
                name="company"
                label="公司"
              >
                <Input prefix={<BankOutlined />} placeholder="公司" />
              </Form.Item>
              
              <Form.Item>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  loading={loading}
                  className={styles.submitButton}
                >
                  保存修改
                </Button>
              </Form.Item>
            </Form>
          </TabPane>
          
          <TabPane tab="修改密码" key="password">
            <Form
              form={passwordForm}
              layout="vertical"
              onFinish={handlePasswordUpdate}
              className={styles.passwordForm}
            >
              <Form.Item
                name="oldPassword"
                label="当前密码"
                rules={[{ required: true, message: '请输入当前密码' }]}
              >
                <Input.Password prefix={<LockOutlined />} placeholder="当前密码" />
              </Form.Item>
              
              <Form.Item
                name="newPassword"
                label="新密码"
                rules={[
                  { required: true, message: '请输入新密码' },
                  { min: 6, message: '密码长度不能少于6个字符' }
                ]}
              >
                <Input.Password prefix={<LockOutlined />} placeholder="新密码" />
              </Form.Item>
              
              <Form.Item
                name="confirmPassword"
                label="确认新密码"
                rules={[
                  { required: true, message: '请确认新密码' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('newPassword') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('两次输入的密码不一致'));
                    },
                  }),
                ]}
              >
                <Input.Password prefix={<LockOutlined />} placeholder="确认新密码" />
              </Form.Item>
              
              <Form.Item>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  loading={passwordLoading}
                  className={styles.submitButton}
                >
                  更新密码
                </Button>
              </Form.Item>
            </Form>
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
};

export default Profile;
