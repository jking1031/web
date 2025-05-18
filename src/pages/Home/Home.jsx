import React, { useState, useEffect, useRef } from 'react';
import { Spin, Alert, Button, Card, Row, Col, Typography } from 'antd';
import { ReloadOutlined, DashboardOutlined, AppstoreOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import styles from './Home.module.scss';

const { Title, Paragraph } = Typography;

/**
 * 首页组件，使用React-Admin作为仪表盘
 * @returns {JSX.Element} 首页组件
 */
const Home = () => {
  const navigate = useNavigate();
  const { isAdmin, token } = useAuth();
  const { isDarkMode } = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  // 使用ref跟踪组件是否已挂载
  const isMounted = useRef(true);

  // 初始化仪表盘
  useEffect(() => {
    console.log('Home: 初始化仪表盘');
    // 页面加载时执行一些初始化操作
    document.title = '仪表盘 - 正泽物联';

    // 检查认证状态
    if (!token) {
      console.warn('Home: 用户未登录或token不存在');
      setError('请先登录系统');
      setLoading(false);
      return;
    }

    console.log('Home: 用户已登录，token存在');
    console.log('Home: token长度:', token.length);

    try {
      // 尝试解析token
      const tokenParts = token.split('.');
      if (tokenParts.length === 3) {
        const payload = JSON.parse(atob(tokenParts[1]));
        console.log('Home: token有效期至:', new Date(payload.exp * 1000).toLocaleString());
      }
    } catch (e) {
      console.error('Home: 解析token失败:', e);
    }

    // 模拟加载过程
    const timer = setTimeout(() => {
      if (isMounted.current) {
        console.log('Home: 设置加载状态为false');
        setLoading(false);
      }
    }, 1500); // 增加延迟，确保Dashboard组件有足够时间初始化

    // 清理函数
    return () => {
      console.log('Home: 组件卸载，清理资源');
      isMounted.current = false;
      clearTimeout(timer);
    };
  }, [token]);

  // 处理重试
  const handleRetry = () => {
    console.log('Home: 用户点击重试按钮');
    setLoading(true);
    setError(null);
    setRetryCount(prev => prev + 1);

    // 重新加载页面
    setTimeout(() => {
      if (isMounted.current) {
        console.log('Home: 重试完成，设置加载状态为false');
        setLoading(false);
      }
    }, 1000);
  };

  // 显示加载状态
  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Spin size="large">
          <div className={styles.loadingContent}>
            <p>加载仪表盘...</p>
          </div>
        </Spin>
      </div>
    );
  }

  // 显示错误状态
  if (error) {
    return (
      <div className={styles.errorContainer}>
        <Alert
          message="加载仪表盘失败"
          description={error}
          type="error"
          showIcon
          action={
            <Button type="primary" onClick={handleRetry}>
              重试
            </Button>
          }
        />
      </div>
    );
  }

  // 渲染首页
  console.log('Home: 渲染首页');
  return (
    <div className={styles.homeContainer}>
      <div className={styles.welcomeSection}>
        <Title level={2}>欢迎使用正泽物联网平台</Title>
        <Paragraph>
          这是一个用于管理和监控设备、告警和统计数据的平台。您可以使用左侧导航菜单访问各种功能。
        </Paragraph>
      </div>

      <Row gutter={[24, 24]} className={styles.dashboardCards}>
        <Col xs={24} md={12}>
          <Card
            title="React-Admin仪表盘"
            extra={<Button type="primary" icon={<AppstoreOutlined />} onClick={() => navigate('/admin-dashboard')}>访问</Button>}
            className={styles.dashboardCard}
          >
            <Paragraph>
              使用React-Admin构建的仪表盘，提供了更现代化的用户界面和更丰富的功能。
            </Paragraph>
            <Paragraph>
              包括设备管理、告警管理、统计数据和自定义查询等功能。
            </Paragraph>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card
            title="传统仪表盘"
            extra={<Button icon={<DashboardOutlined />}>即将推出</Button>}
            className={styles.dashboardCard}
          >
            <Paragraph>
              传统的仪表盘界面，提供了基本的数据展示和管理功能。
            </Paragraph>
            <Paragraph>
              包括生产统计、设备状态、告警信息和实时趋势等功能。
            </Paragraph>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Home;