import React, { useState } from 'react';
import { Layout, Menu, Button } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  HomeOutlined,
  AppstoreOutlined,
  BarChartOutlined,
  FileOutlined,
  ExperimentOutlined,
  ToolOutlined,
  TeamOutlined,
  SettingOutlined,
  ApartmentOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UploadOutlined,
  ApiOutlined,
  DatabaseOutlined,
} from '@ant-design/icons';
import styles from './Sidebar.module.scss';

const { Sider } = Layout;

/**
 * 侧边栏导航组件
 * @param {Object} props - 组件属性
 * @param {boolean} props.collapsed - 侧边栏是否折叠
 * @param {Function} props.onMenuClick - 菜单点击事件处理函数
 * @returns {JSX.Element} 侧边栏组件
 */
const Sidebar = ({ collapsed, onMenuClick }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin } = useAuth();

  // 创建导航处理函数
  const handleNavigate = (path) => {
    navigate(path);
    onMenuClick && onMenuClick();
  };

  // 获取当前选中的菜单项
  const getSelectedKeys = () => {
    const path = location.pathname;

    // 主菜单项
    if (path === '/') return ['home'];
    if (path.startsWith('/sites')) return ['sites'];

    // 数据中心
    if (path.startsWith('/data-center')) return ['data-center'];
    if (path.startsWith('/data-query')) return ['data-center', 'data-query-center', 'data-query'];
    if (path.startsWith('/history-data')) return ['data-center', 'data-query-center', 'history-data'];
    if (path.startsWith('/report-query')) return ['data-center', 'data-query-center', 'report-query'];
    if (path.startsWith('/dynamic-reports')) return ['data-center', 'data-query-center', 'dynamic-reports'];
    if (path.startsWith('/ao-data-query')) return ['data-center', 'data-query-center', 'ao-data-query'];
    if (path.startsWith('/message-query')) return ['data-center', 'data-query-center', 'message-query'];

    // 数据填报中心
    if (path.startsWith('/data-entry')) return ['data-center', 'data-entry-center'];
    if (path.startsWith('/ao-data-entry')) return ['data-center', 'data-entry-center', 'ao-data-entry'];
    if (path.startsWith('/lab-data-entry')) return ['data-center', 'data-entry-center', 'lab-data-entry'];
    if (path.startsWith('/sludge-data-entry')) return ['data-center', 'data-entry-center', 'sludge-data-entry'];

    // 报表系统
    if (path === '/reports') return ['reports'];
    if (path.startsWith('/reports/high-speed')) return ['reports', 'report-high-speed'];
    if (path.startsWith('/reports/5000')) return ['reports', 'report-5000'];
    if (path.startsWith('/reports/sludge')) return ['reports', 'report-sludge'];
    if (path.startsWith('/reports/pump-station')) return ['reports', 'report-pump-station'];

    // 工单系统
    if (path === '/tickets') return ['tickets', 'ticket-list'];
    if (path.startsWith('/tickets/detail')) return ['tickets', 'ticket-list'];
    if (path.startsWith('/tickets/create')) return ['tickets', 'create-ticket'];
    if (path.startsWith('/tickets/my')) return ['tickets', 'my-tickets'];

    // 工具箱
    if (path === '/tools') return ['tools'];
    if (path.startsWith('/carbon-calc')) return ['tools', 'carbon-calc'];
    if (path.startsWith('/calculators/pac')) return ['tools', 'calculators', 'pac-calculator'];
    if (path.startsWith('/calculators/pam')) return ['tools', 'calculators', 'pam-calculator'];
    if (path.startsWith('/calculators/dosing')) return ['tools', 'calculators', 'dosing-calculator'];
    if (path.startsWith('/calculators/sludge')) return ['tools', 'calculators', 'sludge-calculator'];

    // 文件上传
    if (path.startsWith('/file-upload')) return ['file-upload'];

    // 管理员菜单
    if (path.startsWith('/user-management')) return ['user-management'];
    if (path.startsWith('/settings')) return ['settings'];
    if (path.startsWith('/api-management')) return ['api-management'];
    if (path.startsWith('/query-management')) return ['query-management'];
    if (path.startsWith('/db-test')) return ['db-test'];
    if (path.startsWith('/profile')) return ['profile'];

    // API 示例页面
    if (path.startsWith('/api-example')) return ['api-examples', 'api-example'];
    if (path.startsWith('/api-class-example')) return ['api-examples', 'api-class-example'];
    if (path.startsWith('/api-dashboard')) return ['api-examples', 'api-dashboard'];

    return [];
  };

  // 菜单项列表
  const menuItems = [
    {
      key: 'home',
      icon: <AppstoreOutlined />,
      label: '仪表盘',
      onClick: () => handleNavigate('/'),
    },
    {
      key: 'sites',
      icon: <ApartmentOutlined />,
      label: '站点管理',
      onClick: () => handleNavigate('/sites'),
    },
    {
      key: 'data-center',
      icon: <BarChartOutlined />,
      label: '数据中心',
      children: [
        {
          key: 'data-query-center',
          label: '数据查询中心',
          children: [
            {
              key: 'data-query',
              label: '历史数据查询',
              onClick: () => handleNavigate('/data-query'),
            },
            {
              key: 'report-query',
              label: '报告查询',
              onClick: () => handleNavigate('/report-query'),
            },
            {
              key: 'dynamic-reports',
              label: '动态报表查询',
              onClick: () => handleNavigate('/dynamic-reports'),
            },
            {
              key: 'ao-data-query',
              label: 'AO池数据查询',
              onClick: () => handleNavigate('/ao-data-query'),
            },
            {
              key: 'message-query',
              label: '消息查询',
              onClick: () => handleNavigate('/message-query'),
            },
          ],
        },
        {
          key: 'data-entry-center',
          label: '数据填报中心',
          children: [
            {
              key: 'ao-data-entry',
              label: 'AO池数据填报',
              onClick: () => handleNavigate('/ao-data-entry'),
            },
            {
              key: 'lab-data-entry',
              label: '化验数据填报',
              onClick: () => handleNavigate('/lab-data-entry'),
            },
            {
              key: 'sludge-data-entry',
              label: '污泥化验数据填报',
              onClick: () => handleNavigate('/sludge-data-entry'),
            },
          ],
        },
      ],
    },
    {
      key: 'reports',
      icon: <FileOutlined />,
      label: '报表系统',
      children: [
        {
          key: 'report-high-speed',
          label: '高铁污水厂运行日报',
          onClick: () => handleNavigate('/reports/high-speed'),
        },
        {
          key: 'report-5000',
          label: '5000吨处理厂日报',
          onClick: () => handleNavigate('/reports/5000'),
        },
        {
          key: 'report-sludge',
          label: '污泥车间日报',
          onClick: () => handleNavigate('/reports/sludge'),
        },
        {
          key: 'report-pump-station',
          label: '泵站运行周报',
          onClick: () => handleNavigate('/reports/pump-station'),
        },
      ],
    },
    {
      key: 'tickets',
      icon: <FileOutlined />,
      label: '工单系统',
      children: [
        {
          key: 'ticket-list',
          label: '工单列表',
          onClick: () => handleNavigate('/tickets'),
        },
        {
          key: 'create-ticket',
          label: '创建工单',
          onClick: () => handleNavigate('/tickets/create'),
        },
        {
          key: 'my-tickets',
          label: '我的工单',
          onClick: () => handleNavigate('/tickets/my'),
        },
      ],
    },
    {
      key: 'tools',
      icon: <ToolOutlined />,
      label: '工具箱',
      children: [
        {
          key: 'carbon-calc',
          label: '碳源计算',
          onClick: () => handleNavigate('/carbon-calc'),
        },
        {
          key: 'calculators',
          label: '计算器',
          children: [
            {
              key: 'pac-calculator',
              label: 'PAC计算器',
              onClick: () => handleNavigate('/calculators/pac'),
            },
            {
              key: 'pam-calculator',
              label: 'PAM计算器',
              onClick: () => handleNavigate('/calculators/pam'),
            },
            {
              key: 'dosing-calculator',
              label: '药剂投加计算器',
              onClick: () => handleNavigate('/calculators/dosing'),
            },
            {
              key: 'sludge-calculator',
              label: '剩余污泥计算器',
              onClick: () => handleNavigate('/calculators/sludge'),
            },
          ]
        },
      ],
    },
    {
      key: 'file-upload',
      icon: <UploadOutlined />,
      label: '文件上传',
      onClick: () => handleNavigate('/file-upload'),
    },
  ];

  // API 示例菜单项
  menuItems.push({
    key: 'api-examples',
    icon: <ApiOutlined />,
    label: 'API 示例',
    children: [
      {
        key: 'api-example',
        label: '函数组件示例',
        onClick: () => handleNavigate('/api-example'),
      },
      {
        key: 'api-class-example',
        label: '类组件示例',
        onClick: () => handleNavigate('/api-class-example'),
      },
      {
        key: 'api-dashboard',
        label: 'API 仪表盘',
        onClick: () => handleNavigate('/api-dashboard'),
      },
    ],
  });

  // 管理员菜单项
  if (isAdmin) {
    menuItems.push({
      key: 'user-management',
      icon: <TeamOutlined />,
      label: '用户管理',
      onClick: () => handleNavigate('/user-management'),
    });

    menuItems.push({
      key: 'settings',
      icon: <SettingOutlined />,
      label: '系统设置',
      onClick: () => handleNavigate('/settings'),
    });

    menuItems.push({
      key: 'api-management',
      icon: <ApiOutlined />,
      label: 'API管理',
      onClick: () => handleNavigate('/api-management'),
    });

    menuItems.push({
      key: 'query-management',
      icon: <DatabaseOutlined />,
      label: '查询管理',
      onClick: () => handleNavigate('/query-management'),
    });
  }

  return (
    <Sider
      collapsible
      collapsed={collapsed}
      trigger={null}
      className={styles.sidebar}
      width={240}
    >
      {/* 移除导航文字和头部区域 */}
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={getSelectedKeys()}
        defaultOpenKeys={['data-center', 'data-query-center', 'data-entry-center', 'reports', 'tickets', 'tools', 'calculators']}
        items={menuItems}
        className={styles.menu}
      />
      <div className={styles.sidebarFooter}>
        <Button
          type="text"
          icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          onClick={() => onMenuClick && onMenuClick()}
          className={styles.collapseButton}
        />
      </div>
    </Sider>
  );
};

export default Sidebar;