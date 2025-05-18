import React from 'react';
import { Card, Row, Col, Button, Typography } from 'antd';
import { ExperimentOutlined, FormOutlined, FileTextOutlined, BarChartOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import styles from './LabData.module.scss';

const { Title, Text } = Typography;

/**
 * 化验数据管理页面
 * @returns {JSX.Element} 化验数据管理页面组件
 */
const LabData = () => {
  const navigate = useNavigate();

  // 化验数据类型
  const dataTypes = [
    {
      title: '常规化验数据',
      icon: <ExperimentOutlined />,
      description: '进出水COD、氨氮、总磷等常规指标数据',
      path: '/lab-data/entry',
      color: '#1890ff',
    },
    {
      title: '污泥化验数据',
      icon: <FormOutlined />,
      description: '污泥含水率、有机物含量等数据',
      path: '/lab-data/sludge',
      color: '#52c41a',
    },
    {
      title: 'AO池数据',
      icon: <FileTextOutlined />,
      description: 'AO池溶解氧、MLSS、SV30等运行参数',
      path: '/lab-data/ao',
      color: '#fa8c16',
    },
    {
      title: '化验数据查询',
      icon: <BarChartOutlined />,
      description: '查询历史化验数据记录和趋势分析',
      path: '/lab-data/query',
      color: '#722ed1',
    },
  ];

  return (
    <div className={styles.labDataContainer}>
      <Title level={4} className={styles.pageTitle}>化验数据管理</Title>
      
      <Row gutter={[16, 16]}>
        {dataTypes.map((type, index) => (
          <Col xs={24} sm={12} md={8} lg={6} key={index}>
            <Card 
              hoverable
              className={styles.dataTypeCard}
              onClick={() => navigate(type.path)}
            >
              <div className={styles.iconWrapper} style={{ backgroundColor: `${type.color}15` }}>
                <div className={styles.icon} style={{ color: type.color }}>
                  {type.icon}
                </div>
              </div>
              <Title level={5} className={styles.cardTitle}>{type.title}</Title>
              <Text className={styles.cardDescription}>{type.description}</Text>
              <Button 
                type="primary" 
                style={{ backgroundColor: type.color, borderColor: type.color }}
                className={styles.cardButton}
              >
                进入
              </Button>
            </Card>
          </Col>
        ))}
      </Row>
      
      <div className={styles.infoSection}>
        <Title level={5}>化验数据管理说明</Title>
        <Text>
          本系统提供全面的水质化验数据管理功能，包括常规水质指标、污泥特性和生化池运行参数等数据的录入、查询和分析。
          通过规范化的数据管理，可以更好地监控工艺运行状况，及时发现异常并采取措施，提高处理效率和出水水质。
        </Text>
        <ul className={styles.infoList}>
          <li>
            <Text strong>常规化验数据：</Text>
            <Text>包括进出水COD、BOD、氨氮、总磷、总氮、SS等常规指标</Text>
          </li>
          <li>
            <Text strong>污泥化验数据：</Text>
            <Text>包括污泥含水率、有机物含量、污泥浓度等指标</Text>
          </li>
          <li>
            <Text strong>AO池数据：</Text>
            <Text>包括溶解氧、MLSS、SV30、pH值等生化池运行参数</Text>
          </li>
          <li>
            <Text strong>数据查询与分析：</Text>
            <Text>提供历史数据查询、趋势分析和报表导出功能</Text>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default LabData;
