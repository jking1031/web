import React from 'react';
import { Card, List, Button, Row, Col } from 'antd';
import { Link } from 'react-router-dom';
import { FileTextOutlined, BarChartOutlined, FormOutlined } from '@ant-design/icons';
import styles from './Reports.module.scss';

/**
 * 报表系统首页组件
 * @returns {JSX.Element} 报表系统首页
 */
const Reports = () => {
  // 报表类型列表
  const reportTypes = [
    {
      id: '5000',
      title: '环保5000报表',
      description: '环保部门标准5000报表填报系统',
      icon: <FileTextOutlined />,
      link: '/reports/5000',
    },
    {
      id: 'sludge',
      title: '污泥报表',
      description: '污泥处理量、含水率及处置方式统计',
      icon: <FormOutlined />,
      link: '/reports/sludge',
    },
    {
      id: 'pump-station',
      title: '泵站报表',
      description: '泵站运行数据和水量统计',
      icon: <FileTextOutlined />,
      link: '/reports/pump-station',
    },
    {
      id: 'dynamic',
      title: '动态报表',
      description: '自定义数据统计和报表生成',
      icon: <BarChartOutlined />,
      link: '/dynamic-reports',
    },
  ];
  
  // 报表查询入口
  const queryOptions = [
    {
      id: 'report-query',
      title: '历史报表查询',
      description: '查询已提交的历史报表数据',
      link: '/report-query',
    }
  ];
  
  return (
    <div className={styles.reportsContainer}>
      <h1 className={styles.pageTitle}>报表系统</h1>
      
      <Row gutter={[24, 24]}>
        <Col xs={24}>
          <Card title="报表填报" className={styles.reportCard}>
            <List
              grid={{ gutter: 16, xs: 1, sm: 2, md: 2, lg: 4, xl: 4, xxl: 4 }}
              dataSource={reportTypes}
              renderItem={(item) => (
                <List.Item>
                  <Link to={item.link}>
                    <Card 
                      className={styles.reportTypeCard}
                      hoverable
                    >
                      <div className={styles.reportTypeIcon}>
                        {item.icon}
                      </div>
                      <div className={styles.reportTypeTitle}>
                        {item.title}
                      </div>
                      <div className={styles.reportTypeDescription}>
                        {item.description}
                      </div>
                    </Card>
                  </Link>
                </List.Item>
              )}
            />
          </Card>
        </Col>
        
        <Col xs={24}>
          <Card title="报表查询" className={styles.queryCard}>
            <List
              dataSource={queryOptions}
              renderItem={(item) => (
                <List.Item
                  actions={[
                    <Link to={item.link} key="view">
                      <Button type="primary">
                        查看
                      </Button>
                    </Link>
                  ]}
                >
                  <List.Item.Meta
                    title={item.title}
                    description={item.description}
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Reports; 