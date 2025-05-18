import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Card, Typography, Alert, Select, Spin } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, PhoneOutlined, BankOutlined, TeamOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import authApi from '../../api/auth';
import { API_ENDPOINTS } from '../../api/config';
import styles from './Auth.module.scss';

const { Title, Text } = Typography;
const { Option } = Select;

/**
 * 注册页面组件
 */
const Register = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // 公司和部门选项
  const [companies, setCompanies] = useState([
    { id: 1, name: '华北水务集团' },
    { id: 2, name: '东方水处理有限公司' },
    { id: 3, name: '西部环保科技' },
  ]);

  const [departments, setDepartments] = useState([
    { id: 1, name: '运营部' },
    { id: 2, name: '技术部' },
    { id: 3, name: '管理部' },
    { id: 4, name: '研发部' },
  ]);

  // 如果用户已登录，重定向到首页
  useEffect(() => {
    if (isLoggedIn) {
      navigate('/');
    }
  }, [isLoggedIn, navigate]);

  /**
   * 处理注册表单提交
   * @param {Object} values - 表单值
   */
  const handleSubmit = async (values) => {
    if (loading) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // 验证两次密码是否一致
      if (values.password !== values.confirmPassword) {
        throw new Error('两次输入的密码不一致');
      }

      // 调用注册API，与移动端保持一致的数据结构
      const response = await authApi.post(API_ENDPOINTS.REGISTER, {
        username: values.username,
        password: values.password,
        email: values.email,
        phone: values.phone,
        company: values.company,
        department: values.department
      }, {
        timeout: 15000, // 增加超时时间到15秒，与移动端一致
        headers: {
          'Content-Type': 'application/json'
        }
      });

      // 检查响应数据
      if (response.data && response.status === 201) {
        // 清空表单
        form.resetFields();

        // 显示成功消息
        setSuccess('注册成功，请使用新账号登录系统');

        // 3秒后跳转到登录页面
        setTimeout(() => {
          navigate('/login', { state: { email: values.email } });
        }, 3000);
      }
    } catch (error) {
      console.error('注册失败:', error);

      let errorMessage = '注册失败';
      if (error.response) {
        errorMessage = error.response.data?.message || '服务器返回错误，请稍后重试';
      } else if (error.request) {
        errorMessage = '网络连接失败，请检查网络设置';
      } else {
        errorMessage = error.message || '注册过程中发生错误，请重试';
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.authContainer}>
      <div className={styles.authCard}>
        <div className={styles.logoContainer}>
          <img src="/zziot-logo.svg" alt="ZZIOT Logo" className={styles.logo} />
          <Title level={2} className={styles.title}>ZZIOT平台</Title>
        </div>

        <Card className={styles.formCard}>
          <Title level={3} className={styles.cardTitle}>用户注册</Title>

          {error && (
            <Alert
              message="注册失败"
              description={error}
              type="error"
              showIcon
              className={styles.alert}
            />
          )}

          {success && (
            <Alert
              message="注册成功"
              description={success}
              type="success"
              showIcon
              className={styles.alert}
            />
          )}

          <Form
            form={form}
            name="register"
            layout="vertical"
            onFinish={handleSubmit}
            autoComplete="off"
            className={styles.form}
          >
            <Form.Item
              name="username"
              rules={[
                { required: true, message: '请输入用户名' },
                { min: 3, message: '用户名至少3个字符' }
              ]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder="用户名"
                size="large"
              />
            </Form.Item>

            <Form.Item
              name="email"
              rules={[
                { required: true, message: '请输入邮箱' },
                { type: 'email', message: '请输入有效的邮箱地址' }
              ]}
            >
              <Input
                prefix={<MailOutlined />}
                placeholder="邮箱"
                size="large"
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[
                { required: true, message: '请输入密码' },
                { min: 6, message: '密码至少6个字符' }
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="密码"
                size="large"
              />
            </Form.Item>

            <Form.Item
              name="confirmPassword"
              rules={[
                { required: true, message: '请确认密码' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('两次输入的密码不一致'));
                  },
                }),
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="确认密码"
                size="large"
              />
            </Form.Item>

            <Form.Item
              name="phone"
              rules={[
                { required: true, message: '请输入手机号' },
                { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号' }
              ]}
            >
              <Input
                prefix={<PhoneOutlined />}
                placeholder="手机号"
                size="large"
              />
            </Form.Item>

            <Form.Item
              name="company"
              rules={[
                { required: true, message: '请选择公司' }
              ]}
            >
              <Select
                placeholder="选择公司"
                size="large"
                suffixIcon={<BankOutlined />}
              >
                {companies.map(company => (
                  <Option key={company.id} value={company.name}>
                    {company.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="department"
              rules={[
                { required: true, message: '请选择部门' }
              ]}
            >
              <Select
                placeholder="选择部门"
                size="large"
                suffixIcon={<TeamOutlined />}
              >
                {departments.map(dept => (
                  <Option key={dept.id} value={dept.name}>
                    {dept.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                block
                loading={loading}
                className={styles.submitButton}
              >
                注册
              </Button>
            </Form.Item>
          </Form>

          <div className={styles.loginLink}>
            <Text>已有账号？</Text>
            <Link to="/login">立即登录</Link>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Register;
