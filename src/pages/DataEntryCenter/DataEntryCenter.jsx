import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Typography, Spin, Button, Tabs, Badge } from 'antd';
import { 
  DatabaseOutlined, 
  ExperimentOutlined, 
  FileAddOutlined,
  HistoryOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import { Link } from 'react-router-dom';
import apiService from '../../services/apiService';
import styles from './DataEntryCenter.module.scss';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

/**
 * 数据填报中心主页
 * 对应移动端的DataEntryCenter
 */
const DataEntryCenter = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    pendingEntries: 0,
    completedToday: 0,
    totalEntries: 0
  });
  const [recentEntries, setRecentEntries] = useState([]);

  // 加载数据填报统计信息
  useEffect(() => {
    const fetchStats = async () => {
      try {
        // 通过API管理器调用获取数据填报统计信息API
        const statsResponse = await apiService.callApi('getDataEntryStats');
        const entriesResponse = await apiService.callApi('getRecentDataEntries');
        
        if (statsResponse && statsResponse.success) {
          setStats({
            pendingEntries: statsResponse.data.pendingEntries || 0,
            completedToday: statsResponse.data.completedToday || 0,
            totalEntries: statsResponse.data.totalEntries || 0
          });
        }
        
        if (entriesResponse && entriesResponse.success) {
          setRecentEntries(entriesResponse.data || []);
        }
      } catch (error) {
        console.error('获取数据填报统计信息失败:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  // 数据填报模块列表
  const entryModules = [
    {
      title: 'AO池数据填报',
      icon: <DatabaseOutlined />,
      description: '填报AO池运行参数和监测数据',
      path: '/data-entry/ao-data',
      color: '#1890ff',
      badge: stats.pendingEntries > 0 ? stats.pendingEntries : null
    },
    {
      title: '化验数据填报',
      icon: <ExperimentOutlined />,
      description: '填报水质化验和监测数据',
      path: '/data-entry/lab-data',
      color: '#52c41a',
      badge: null
    },
    {
      title: '污泥化验数据填报',
      icon: <FileAddOutlined />,
      description: '填报污泥处理相关化验数据',
      path: '/data-entry/sludge-data',
      color: '#fa8c16',
      badge: null
    }
  ];

  // 渲染填报模块卡片
  const renderEntryModule = (module) => (
    <Col xs={24} sm={12} md={8} key={module.title}>
      <Link to={module.path}>
        <Badge count={module.badge} offset={[-5, 5]}>
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
        </Badge>
      </Link>
    </Col>
  );

  // 渲染最近填报记录
  const renderRecentEntries = () => {
    if (recentEntries.length === 0) {
      return (
        <div className={styles.emptyContainer}>
          <Text type="secondary">暂无最近填报记录</Text>
        </div>
      );
    }

    return (
      <div className={styles.recentEntriesContainer}>
        {recentEntries.map((entry, index) => (
          <Card key={index} className={styles.entryCard}>
            <div className={styles.entryInfo}>
              <div className={styles.entryHeader}>
                <Title level={5}>{entry.title}</Title>
                <Badge 
                  status={entry.status === 'completed' ? 'success' : 'processing'} 
                  text={entry.status === 'completed' ? '已完成' : '处理中'} 
                />
              </div>
              <Text type="secondary">{entry.description}</Text>
              <div className={styles.entryMeta}>
                <Text type="secondary">
                  <ClockCircleOutlined /> 填报时间: {entry.timestamp}
                </Text>
                <Text type="secondary">
                  <UserOutlined /> 填报人: {entry.user}
                </Text>
              </div>
            </div>
            <div className={styles.entryActions}>
              <Button type="primary" size="small">
                <Link to={`${entry.path}/${entry.id}`}>查看详情</Link>
              </Button>
            </div>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className={styles.dataEntryCenterContainer}>
      <Title level={2} className={styles.pageTitle}>数据填报中心</Title>
      
      {loading ? (
        <div className={styles.loadingContainer}>
          <Spin size="large" />
          <Text>加载数据填报中心...</Text>
        </div>
      ) : (
        <>
          {/* 统计信息卡片 */}
          <Row gutter={[16, 16]} className={styles.statsRow}>
            <Col xs={24} sm={8}>
              <Card>
                <div className={styles.statCard}>
                  <div className={styles.statIcon} style={{ backgroundColor: '#fff2e8' }}>
                    <ClockCircleOutlined style={{ color: '#fa8c16' }} />
                  </div>
                  <div className={styles.statContent}>
                    <Text type="secondary">待填报</Text>
                    <Title level={3}>{stats.pendingEntries}</Title>
                  </div>
                </div>
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card>
                <div className={styles.statCard}>
                  <div className={styles.statIcon} style={{ backgroundColor: '#f6ffed' }}>
                    <CheckCircleOutlined style={{ color: '#52c41a' }} />
                  </div>
                  <div className={styles.statContent}>
                    <Text type="secondary">今日已完成</Text>
                    <Title level={3}>{stats.completedToday}</Title>
                  </div>
                </div>
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card>
                <div className={styles.statCard}>
                  <div className={styles.statIcon} style={{ backgroundColor: '#e6f7ff' }}>
                    <HistoryOutlined style={{ color: '#1890ff' }} />
                  </div>
                  <div className={styles.statContent}>
                    <Text type="secondary">累计填报</Text>
                    <Title level={3}>{stats.totalEntries}</Title>
                  </div>
                </div>
              </Card>
            </Col>
          </Row>

          {/* 填报模块卡片 */}
          <div className={styles.modulesSection}>
            <Title level={3} className={styles.sectionTitle}>填报模块</Title>
            <Row gutter={[16, 16]} className={styles.modulesRow}>
              {entryModules.map(renderEntryModule)}
            </Row>
          </div>

          {/* 最近填报记录 */}
          <div className={styles.recentSection}>
            <Title level={3} className={styles.sectionTitle}>最近填报</Title>
            <Card className={styles.recentCard}>
              {renderRecentEntries()}
            </Card>
          </div>

          {/* 快速操作按钮 */}
          <div className={styles.quickActions}>
            <Button type="primary" size="large">
              <Link to="/data-entry/ao-data">开始数据填报</Link>
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default DataEntryCenter;
