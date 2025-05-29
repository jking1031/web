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
  FormOutlined,
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
    if (path.startsWith('/history-data')) {
      if (path.includes('/old')) {
        return ['data-center', 'data-query-center', 'history-data-old'];
      }
      return ['data-center', 'data-query-center', 'history-data'];
    }
    if (path.startsWith('/report-query')) return ['data-center', 'data-query-center', 'report-query'];

    // 表单系统
    if (path.startsWith('/forms')) {
      if (path === '/forms') {
        return ['data-center', 'forms-system', 'forms-admin'];
      }
      if (path.startsWith('/forms/list')) {
        return ['data-center', 'forms-system', 'forms-list'];
      }
      return ['data-center', 'forms-system'];
    }

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
    if (path.startsWith('/carbon-calc')) return ['tools', 'carbon-calc'];
    if (path.startsWith('/calculators/pac')) return ['tools', 'calculators', 'pac-calculator'];
    if (path.startsWith('/calculators/pam')) return ['tools', 'calculators', 'pam-calculator'];
    if (path.startsWith('/calculators/dosing')) return ['tools', 'calculators', 'dosing-calculator'];
    if (path.startsWith('/calculators/sludge')) return ['tools', 'calculators', 'sludge-calculator'];

    // 文件上传
    if (path.startsWith('/file-upload')) return ['file-upload'];
    if (path.startsWith('/file-manager')) return ['file-manager'];

    // 管理员菜单
    if (path.startsWith('/user-management')) return ['user-management'];
    if (path.startsWith('/settings')) return ['settings'];
    if (path.startsWith('/api-management')) return ['api-management'];
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
      key: 'data-query-center',
      icon: <BarChartOutlined />,
      label: '查询系统',
      children: [
            {
              key: 'history-data',
              label: '历史数据查询',
              onClick: () => handleNavigate('/history-data'),
            },
            {
              key: 'report-query',
              label: '历史报告查询',
              onClick: () => handleNavigate('/report-query'),
            },
      ],
    },
    
    // 将表单系统移到顶级菜单
    {
      key: 'forms-system',
      icon: <FormOutlined />,
      label: '表单系统',
      children: [
        {
          key: 'forms-list',
          label: '填写表单',
          onClick: () => handleNavigate('/forms/list'),
        },
        {
          key: 'forms-admin',
          label: '表单管理',
          onClick: () => handleNavigate('/forms'),
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
      key: 'file-manager',
      icon: <UploadOutlined />,
      label: '共享网盘',
      onClick: () => handleNavigate('/file-manager'),
    },
  ];


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
        defaultOpenKeys={['data-center', 'data-query-center', 'forms-system', 'reports', 'tickets', 'tools', 'calculators']}
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