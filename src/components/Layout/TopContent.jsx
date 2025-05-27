import React from 'react';
import { useLocation } from 'react-router-dom';
import { Typography, Button } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import Breadcrumb from './Breadcrumb';
import ActionButtons from './ActionButtons';
import styles from './TopContent.module.scss';

const { Title } = Typography;

/**
 * 顶部内容区域组件，包含面包屑和操作按钮
 * @returns {JSX.Element} 顶部内容区域组件
 */
const TopContent = () => {
  const location = useLocation();

  // 首页不显示面包屑
  const isHomePage = location.pathname === '/';

  // 获取页面标题
  const getPageTitle = () => {
    const path = location.pathname;

    if (path === '/') return '首页';
    if (path.startsWith('/sites')) return '站点管理';
    if (path.startsWith('/data-query')) return '历史数据查询';
    if (path.startsWith('/history-data')) return '数据查询';
    if (path === '/reports') return '报表系统';
    if (path.startsWith('/reports/5000')) return '5000吨处理厂日报';
    if (path.startsWith('/reports/sludge')) return '污泥车间日报';
    if (path.startsWith('/reports/pump-station')) return '泵站运行周报';
    if (path.startsWith('/report-query')) return '报告查询';
    if (path.startsWith('/dynamic-reports')) return '动态报表';
    if (path === '/tickets') return '工单系统';
    if (path.startsWith('/tickets/create')) return '创建工单';
    if (path.startsWith('/carbon-calc')) return '碳源计算';
    if (path.startsWith('/calculators/pac')) return 'PAC稀释计算器';
    if (path.startsWith('/calculators/pam')) return 'PAM稀释计算器';
    if (path.startsWith('/calculators/dosing')) return '药剂投加计算器';
    if (path.startsWith('/calculators/sludge')) return '剩余污泥计算器';
    if (path.startsWith('/user-management')) return '用户管理';
    if (path.startsWith('/settings')) return '系统设置';
    if (path.startsWith('/api-management')) return 'API管理';

    return '页面';
  };

  // 是否显示返回按钮
  const showBackButton = !isHomePage && !location.pathname.endsWith('/sites') &&
                         !location.pathname.endsWith('/reports') &&
                         !location.pathname.endsWith('/tickets');

  if (isHomePage) {
    return null;
  }

  return (
    <div className={styles.topContent}>
      <Breadcrumb />
      <div className={styles.pageHeader}>
        <div className={styles.titleArea}>
          {showBackButton && (
            <Button
              type="text"
              icon={<ArrowLeftOutlined />}
              className={styles.backButton}
            />
          )}
          <Title level={4} className={styles.pageTitle}>
            {getPageTitle()}
          </Title>
        </div>
        <div className={styles.actionArea}>
          <ActionButtons />
        </div>
      </div>
    </div>
  );
};

export default TopContent;
