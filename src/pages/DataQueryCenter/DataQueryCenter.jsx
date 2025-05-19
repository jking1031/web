import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Typography, Spin, Tabs, Button } from 'antd';
import { 
  HistoryOutlined, 
  DatabaseOutlined, 
  FileSearchOutlined, 
  AreaChartOutlined,
  MessageOutlined
} from '@ant-design/icons';
import { Link } from 'react-router-dom';
import apiService from '../../services/apiService';
import styles from './DataQueryCenter.module.scss';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

/**
 * 数据查询中心主页
 * 对应移动端的DataQueryCenterScreen
 */
const DataQueryCenter = () => {
  const [loading, setLoading] = useState(true);
  const [recentQueries, setRecentQueries] = useState([]);

  // 加载最近查询记录
  useEffect(() => {
    const fetchRecentQueries = async () => {
      try {
        // 通过API管理器调用获取最近查询记录API
        const response = await apiService.callApi('getRecentQueries');
        
        if (response && response.success) {
          setRecentQueries(response.data || []);
        }
      } catch (error) {
        console.error('获取最近查询记录失败:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentQueries();
  }, []);

  // 数据查询模块列表
  const queryModules = [
    {
      title: '历史数据查询',
      icon: <HistoryOutlined />,
      description: '查询和分析历史运行数据，支持多种筛选条件和导出功能',
      path: '/data-center/history-query',
      color: '#1890ff'
    },
    {
      title: 'AO池数据查询',
      icon: <DatabaseOutlined />,
      description: '查询AO池相关运行参数和历史数据，支持趋势分析',
      path: '/data-center/ao-query',
      color: '#52c41a'
    },
    {
      title: '报告查询',
      icon: <FileSearchOutlined />,
      description: '查询和下载系统生成的各类报告，支持多种格式导出',
      path: '/data-center/report-query',
      color: '#fa8c16'
    },
    {
      title: '动态报表查询',
      icon: <AreaChartOutlined />,
      description: '自定义动态报表查询和生成，支持多种图表类型',
      path: '/data-center/dynamic-reports',
      color: '#722ed1'
    },
    {
      title: '消息查询',
      icon: <MessageOutlined />,
      description: '查询系统消息和通知，支持按类型和时间筛选',
      path: '/data-center/message-query',
      color: '#eb2f96'
    }
  ];

  // 渲染查询模块卡片
  const renderQueryModule = (module) => (
    <Col xs={24} sm={12} lg={8} key={module.title}>
      <Link to={module.path}>
        <Card 
          hoverable 
          className={styles.moduleCard}
          style={{ borderTop: `4px solid ${module.color}` }}
        >
          <div className={styles.iconContainer} style={{ color: module.color }}>
            {module.icon}
          </div>
          <div className={styles.moduleContent}>
            <Title level={4}>{module.title}</Title>
            <Text type="secondary">{module.description}</Text>
          </div>
        </Card>
      </Link>
    </Col>
  );

  // 渲染最近查询记录
  const renderRecentQueries = () => {
    if (recentQueries.length === 0) {
      return (
        <div className={styles.emptyContainer}>
          <Text type="secondary">暂无最近查询记录</Text>
        </div>
      );
    }

    return (
      <div className={styles.recentQueriesContainer}>
        {recentQueries.map((query, index) => (
          <Card key={index} className={styles.queryCard}>
            <div className={styles.queryInfo}>
              <Title level={5}>{query.title}</Title>
              <Text type="secondary">{query.description}</Text>
              <div className={styles.queryMeta}>
                <Text type="secondary">查询时间: {query.timestamp}</Text>
                <Text type="secondary">查询类型: {query.type}</Text>
              </div>
            </div>
            <div className={styles.queryActions}>
              <Button type="primary" size="small">
                <Link to={query.path}>重新查询</Link>
              </Button>
            </div>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className={styles.dataQueryCenterContainer}>
      <Title level={2} className={styles.pageTitle}>数据查询中心</Title>
      
      {loading ? (
        <div className={styles.loadingContainer}>
          <Spin size="large" />
          <Text>加载数据查询中心...</Text>
        </div>
      ) : (
        <>
          {/* 查询模块卡片 */}
          <div className={styles.modulesSection}>
            <Title level={3} className={styles.sectionTitle}>查询模块</Title>
            <Row gutter={[16, 16]} className={styles.modulesRow}>
              {queryModules.map(renderQueryModule)}
            </Row>
          </div>

          {/* 最近查询记录 */}
          <div className={styles.recentSection}>
            <Title level={3} className={styles.sectionTitle}>最近查询</Title>
            <Card className={styles.recentCard}>
              {renderRecentQueries()}
            </Card>
          </div>

          {/* 快速操作按钮 */}
          <div className={styles.quickActions}>
            <Button type="primary" size="large">
              <Link to="/data-center/history-query">开始新查询</Link>
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default DataQueryCenter;
