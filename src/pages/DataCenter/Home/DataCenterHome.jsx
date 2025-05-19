import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Button, Typography, Spin, Empty, Tabs } from 'antd';
import { 
  DatabaseOutlined, 
  LineChartOutlined, 
  BarChartOutlined, 
  TableOutlined,
  FileSearchOutlined,
  AreaChartOutlined
} from '@ant-design/icons';
import { Link } from 'react-router-dom';
import apiService from '../../../services/apiService';
import styles from './DataCenterHome.module.scss';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

/**
 * 数据中心主页
 * 对应移动端的DataCenterScreen
 */
const DataCenterHome = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalDataPoints: 0,
    recentQueries: 0,
    availableDataSources: 0,
    recentReports: 0
  });

  // 加载数据中心统计信息
  useEffect(() => {
    const fetchStats = async () => {
      try {
        // 通过API管理器调用获取数据中心统计信息API
        const response = await apiService.callApi('getDataCenterStats');
        
        if (response && response.success) {
          setStats({
            totalDataPoints: response.data.totalDataPoints || 0,
            recentQueries: response.data.recentQueries || 0,
            availableDataSources: response.data.availableDataSources || 0,
            recentReports: response.data.recentReports || 0
          });
        }
      } catch (error) {
        console.error('获取数据中心统计信息失败:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  // 数据查询模块列表
  const queryModules = [
    {
      title: '历史数据查询',
      icon: <LineChartOutlined />,
      description: '查询和分析历史运行数据',
      path: '/data-center/history-query'
    },
    {
      title: 'AO池数据查询',
      icon: <BarChartOutlined />,
      description: '查询AO池相关运行参数',
      path: '/data-center/ao-query'
    },
    {
      title: '报告查询',
      icon: <FileSearchOutlined />,
      description: '查询和下载系统生成的报告',
      path: '/data-center/report-query'
    },
    {
      title: '动态报表查询',
      icon: <AreaChartOutlined />,
      description: '自定义动态报表查询和生成',
      path: '/data-center/dynamic-reports'
    },
    {
      title: '消息查询',
      icon: <TableOutlined />,
      description: '查询系统消息和通知',
      path: '/data-center/message-query'
    }
  ];

  // 数据分析工具列表
  const analysisTools = [
    {
      title: '碳计算器',
      icon: <DatabaseOutlined />,
      description: '计算和分析碳排放数据',
      path: '/data-center/carbon-calc'
    },
    {
      title: '数据可视化',
      icon: <AreaChartOutlined />,
      description: '创建自定义数据可视化图表',
      path: '/data-center/visualization'
    },
    {
      title: '数据导出',
      icon: <FileSearchOutlined />,
      description: '导出数据为多种格式',
      path: '/data-center/export'
    }
  ];

  // 渲染模块卡片
  const renderModuleCard = (module) => (
    <Col xs={24} sm={12} md={8} key={module.title}>
      <Link to={module.path}>
        <Card 
          hoverable 
          className={styles.moduleCard}
        >
          <div className={styles.iconContainer}>
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

  return (
    <div className={styles.dataCenterContainer}>
      <Title level={2} className={styles.pageTitle}>数据中心</Title>
      
      {loading ? (
        <div className={styles.loadingContainer}>
          <Spin size="large" />
          <Text>加载数据中心信息...</Text>
        </div>
      ) : (
        <>
          {/* 统计信息卡片 */}
          <Row gutter={[16, 16]} className={styles.statsRow}>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic 
                  title="数据点总数" 
                  value={stats.totalDataPoints} 
                  prefix={<DatabaseOutlined />} 
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic 
                  title="近期查询次数" 
                  value={stats.recentQueries} 
                  prefix={<LineChartOutlined />} 
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic 
                  title="可用数据源" 
                  value={stats.availableDataSources} 
                  prefix={<DatabaseOutlined />} 
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic 
                  title="近期报告数" 
                  value={stats.recentReports} 
                  prefix={<FileSearchOutlined />} 
                />
              </Card>
            </Col>
          </Row>

          {/* 功能模块标签页 */}
          <Card className={styles.modulesCard}>
            <Tabs defaultActiveKey="query">
              <TabPane tab="数据查询" key="query">
                <Row gutter={[16, 16]} className={styles.modulesRow}>
                  {queryModules.map(renderModuleCard)}
                </Row>
              </TabPane>
              <TabPane tab="数据分析工具" key="analysis">
                <Row gutter={[16, 16]} className={styles.modulesRow}>
                  {analysisTools.map(renderModuleCard)}
                </Row>
              </TabPane>
            </Tabs>
          </Card>

          {/* 快速操作按钮 */}
          <div className={styles.quickActions}>
            <Button type="primary" size="large">
              <Link to="/data-center/history-query">开始数据查询</Link>
            </Button>
            <Button size="large">
              <Link to="/data-center/carbon-calc">使用碳计算器</Link>
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default DataCenterHome;
