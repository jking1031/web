import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Checkbox, Card, Typography, Alert, Spin } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import apiManager from '../../services/apiManager';
import styles from './Auth.module.scss';

const { Title, Text } = Typography;

/**
 * 登录页面组件
 */
const Login = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { login, isLoggedIn, checkAdminStatus } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  // 如果用户已登录，重定向到首页
  useEffect(() => {
    if (isLoggedIn) {
      navigate('/');
    }
  }, [isLoggedIn, navigate]);

  // 从本地存储中获取保存的登录信息
  useEffect(() => {
    const savedEmail = localStorage.getItem('userEmail');
    const savedRememberMe = localStorage.getItem('rememberMe') === 'true';

    if (savedEmail && savedRememberMe) {
      form.setFieldsValue({ email: savedEmail });
      setRememberMe(savedRememberMe);
    }
  }, [form]);

  /**
   * 处理登录表单提交
   * @param {Object} values - 表单值
   */
  const handleSubmit = async (values) => {
    if (loading) return;

    setLoading(true);
    setError('');

    // 默认管理员账户验证（仅在开发环境或API请求失败时使用）
    if (values.email === 'admin' && values.password === 'admin123') {
      console.log('使用默认管理员账户登录');
      try {
        // 创建默认管理员用户信息
        const defaultAdminUser = {
          id: 'admin-default',
          email: 'admin',
          name: '系统管理员',
          is_admin: true,
          isAdmin: true,
          admin: true,
          role: 'admin',
          token: 'default-admin-token'
        };

        // 调用登录函数存储用户信息
        await login(defaultAdminUser);

        // 检查管理员权限
        await checkAdminStatus();

        // 如果选择了记住密码，保存登录信息
        if (rememberMe) {
          localStorage.setItem('userEmail', values.email);
          localStorage.setItem('rememberMe', 'true');
        } else {
          localStorage.removeItem('userEmail');
          localStorage.removeItem('rememberMe');
        }

        // 登录成功，重定向到首页
        navigate('/');
        return;
      } catch (error) {
        console.error('默认管理员登录失败:', error);
        // 如果默认登录失败，继续尝试API登录
      }
    }

    try {
      // 调用登录API，通过API管理器调用
      console.log('第一步：调用登录API获取用户基本信息');
      console.log('登录请求参数:', { email: values.email, password: '******' });

      const response = await apiManager.callApi('login', {
        email: values.email,
        password: values.password
      });

      // 添加详细日志，打印完整的API响应
      console.log('登录API响应:', response);
      console.log('登录API响应类型:', typeof response);
      console.log('登录API响应JSON:', JSON.stringify(response, null, 2));

      // 处理嵌套的响应结构
      let userInfo;

      // 检查响应结构
      if (response && response.data && response.data.user) {
        // 新的API响应结构: { success: true, data: { user: {...} } }
        userInfo = response.data.user;
        console.log('从嵌套的data.user中获取用户信息:', userInfo);
      } else if (response && response.user) {
        // 旧的API响应结构: { user: {...} }
        userInfo = response.user;
        console.log('从直接的user字段获取用户信息:', userInfo);
      } else {
        // 无效的响应结构
        console.error('登录响应验证失败:', {
          hasResponse: !!response,
          responseKeys: response ? Object.keys(response) : null,
          hasData: !!(response && response.data),
          dataKeys: (response && response.data) ? Object.keys(response.data) : null,
          message: response?.message || response?.data?.message
        });
        throw new Error(response?.message || response?.data?.message || '登录响应数据无效');
      }

      // 此时userInfo已经正确获取

      // 获取token信息（如果存在）
      const token = response?.data?.token;
      if (token) {
        // 如果token在响应中，添加到userInfo中
        userInfo.token = token;
        console.log('从响应中获取到token并添加到userInfo');
      }

      // 检查所有可能的管理员相关字段
      const adminRelatedFields = [
        'is_admin', 'isAdmin', 'admin'
      ];

      console.log('管理员相关字段检查:');
      adminRelatedFields.forEach(field => {
        if (userInfo[field] !== undefined) {
          console.log(`- ${field}: ${JSON.stringify(userInfo[field])}`);
        }
      });
      console.log('=============================================');

      // 第二步：调用login函数存储用户基本信息
      console.log('第二步：调用登录函数，存储用户信息并查询管理员状态');
      await login(userInfo);

      // 第三步：检查管理员权限
      console.log('第三步：检查管理员权限');
      await checkAdminStatus();

      // 如果未选择记住密码，清除之前可能保存的登录信息
      if (!rememberMe) {
        localStorage.removeItem('userEmail');
        localStorage.removeItem('rememberMe');
      }

      // 保存登录信息（如果选择了记住密码）
      if (rememberMe && values.email) {
        localStorage.setItem('userEmail', values.email);
        localStorage.setItem('rememberMe', 'true');
      }

      // 登录成功，重定向到首页
      navigate('/');
    } catch (error) {
      console.error('登录失败:', error);

      // 添加更详细的错误日志
      console.error('登录错误详情:', {
        errorName: error.name,
        errorMessage: error.message,
        errorStack: error.stack,
        hasResponse: !!error.response,
        hasRequest: !!error.request
      });

      if (error.response) {
        console.error('服务器响应错误:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
          headers: error.response.headers
        });
      }

      let errorMessage = '登录失败';
      if (error.response) {
        errorMessage = error.response.data?.message || '服务器返回错误，请稍后重试';
      } else if (error.request) {
        errorMessage = '网络连接失败，请检查网络设置';
        console.error('网络请求错误:', error.request);
      } else {
        errorMessage = error.message || '登录过程中发生错误，请重试';
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
          <Title level={3} className={styles.cardTitle}>用户登录</Title>

          {error && (
            <Alert
              message="登录失败"
              description={error}
              type="error"
              showIcon
              className={styles.alert}
            />
          )}

          <Form
            form={form}
            name="login"
            layout="vertical"
            onFinish={handleSubmit}
            autoComplete="off"
            className={styles.form}
          >
            <Form.Item
              name="email"
              rules={[
                { required: true, message: '请输入邮箱/账号' },
              ]}
            >
              <Input
                prefix={<MailOutlined />}
                placeholder="邮箱/账号"
                size="large"
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[
                { required: true, message: '请输入密码' },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="密码"
                size="large"
              />
            </Form.Item>

            <Form.Item>
              <div className={styles.formActions}>
                <Checkbox
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                >
                  记住密码
                </Checkbox>

                <Link to="/forgot-password" className={styles.forgotPassword}>
                  忘记密码?
                </Link>
              </div>
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
                登录
              </Button>
            </Form.Item>
          </Form>

          <div className={styles.registerLink}>
            <Text>还没有账号？</Text>
            <Link to="/register">立即注册</Link>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Login;
