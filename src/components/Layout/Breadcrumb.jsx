import React from 'react';
import { Breadcrumb as AntBreadcrumb } from 'antd';
import { Link, useLocation } from 'react-router-dom';
import { HomeOutlined } from '@ant-design/icons';
import styles from './Breadcrumb.module.scss';

/**
 * 面包屑导航组件
 * @returns {JSX.Element} 面包屑导航
 */
const Breadcrumb = () => {
  const location = useLocation();
  const pathSnippets = location.pathname.split('/').filter(i => i);

  // 路由路径映射到中文名称
  const routeNameMap = {
    'admin-dashboard': '仪表盘',
    'sites': '站点管理',
    'data-query': '历史数据查询',
    'history-data': '数据查询',
    'reports': '报表系统',
    'lab-data': '化验数据管理',
    'tickets': '工单系统',
    'carbon-calc': '碳源计算',
    'calculators': '计算器',
    'user-management': '用户管理',
    'settings': '系统设置',
    'api-management': 'API管理',
    'profile': '个人中心',
    'notifications': '通知中心',
  };

  // 子路由映射
  const subRouteNameMap = {
    'reports/5000': '5000吨处理厂日报',
    'reports/sludge': '污泥车间日报',
    'reports/pump-station': '泵站运行周报',
    'report-query': '报告查询',
    'dynamic-reports': '动态报表',
    'lab-data/entry': '化验数据填写',
    'lab-data/sludge': '污泥化验数据填报',
    'lab-data/ao': 'AO池数据填报',
    'tickets/create': '创建工单',
    'calculators/pac': 'PAC稀释计算器',
    'calculators/pam': 'PAM稀释计算器',
    'calculators/dosing': '药剂投加计算器',
    'calculators/sludge': '剩余污泥计算器',
  };

  // 生成面包屑项
  const breadcrumbItems = [
    {
      title: (
        <Link to="/">
          <HomeOutlined /> 仪表盘
        </Link>
      ),
      key: 'home'
    }
  ];

  // 添加路径项
  pathSnippets.forEach((snippet, index) => {
    const url = `/${pathSnippets.slice(0, index + 1).join('/')}`;
    const fullPath = pathSnippets.slice(0, index + 1).join('/');

    // 检查是否有子路由映射
    let itemTitle = routeNameMap[snippet] || snippet;
    if (subRouteNameMap[fullPath]) {
      itemTitle = subRouteNameMap[fullPath];
    }

    // 如果是ID，尝试显示为"详情"
    if (/^\d+$/.test(snippet)) {
      const prevSnippet = pathSnippets[index - 1];
      if (prevSnippet === 'sites') {
        itemTitle = '站点详情';
      } else if (prevSnippet === 'tickets') {
        itemTitle = '工单详情';
      } else {
        itemTitle = '详情';
      }
    }

    breadcrumbItems.push({
      title: index === pathSnippets.length - 1 ? (
        <span>{itemTitle}</span>
      ) : (
        <Link to={url}>{itemTitle}</Link>
      ),
      key: url
    });
  });

  return (
    <div className={styles.breadcrumbContainer}>
      <AntBreadcrumb items={breadcrumbItems} />
    </div>
  );
};

export default Breadcrumb;
