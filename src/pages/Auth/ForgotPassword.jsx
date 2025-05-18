import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Card, Typography, Alert } from 'antd';
import { MailOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import { API_ENDPOINTS } from '../../api/config';
import styles from './Auth.module.scss';

const { Title, Text, Paragraph } = Typography;

/**
 * 忘记密码页面组件
 */
const ForgotPassword = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // 如果用户已登录，重定向到首页
  useEffect(() => {
    if (isLoggedIn) {
      navigate('/');
    }
  }, [isLoggedIn, navigate]);

  /**
   * 处理忘记密码表单提交
   * @param {Object} values - 表单值
   */
  const handleSubmit = async (values) => {
    if (loading) return;
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      // 调用忘记密码API
      const response = await axios.post('/api/forgot-password', {
        email: values.email
      });
      
      // 清空表单
      form.resetFields();
      
      // 显示成功消息
      setSuccess('重置密码链接已发送到您的邮箱，请查收');
    } catch (error) {
      console.error('忘记密码请求失败:', error);
      
      let errorMessage = '请求失败';
      if (error.response) {
        errorMessage = error.response.data?.message || '服务器返回错误，请稍后重试';
      } else if (error.request) {
        errorMessage = '网络连接失败，请检查网络设置';
      } else {
        errorMessage = error.message || '请求过程中发生错误，请重试';
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
          <Title level={3} className={styles.cardTitle}>忘记密码</Title>
          
          <Paragraph className={styles.description}>
            请输入您的注册邮箱，我们将向您发送重置密码的链接。
          </Paragraph>
          
          {error && (
            <Alert
              message="请求失败"
              description={error}
              type="error"
              showIcon
              className={styles.alert}
            />
          )}
          
          {success && (
            <Alert
              message="请求成功"
              description={success}
              type="success"
              showIcon
              className={styles.alert}
            />
          )}
          
          <Form
            form={form}
            name="forgotPassword"
            layout="vertical"
            onFinish={handleSubmit}
            autoComplete="off"
            className={styles.form}
          >
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
            
            <Form.Item>
              <Button 
                type="primary" 
                htmlType="submit" 
                size="large" 
                block
                loading={loading}
                className={styles.submitButton}
              >
                发送重置链接
              </Button>
            </Form.Item>
          </Form>
          
          <div className={styles.loginLink}>
            <Text>记起密码了？</Text>
            <Link to="/login">返回登录</Link>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ForgotPassword;
