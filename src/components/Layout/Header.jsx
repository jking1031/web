import React, { useState, useEffect, useCallback } from 'react';
import { Layout, Menu, Button, Dropdown, Avatar, Badge, Breadcrumb as AntBreadcrumb, Tooltip } from 'antd';
import {
  UserOutlined,
  BellOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  LogoutOutlined,
  SettingOutlined,
  SunOutlined,
  MoonOutlined,
  HomeOutlined,
  RightOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import NotificationCenter from '../NotificationCenter/NotificationCenter';
import api from '../../api/interceptors';
import styles from './Header.module.scss';

const { Header: AntHeader } = Layout;

/**
 * 应用顶部导航组件
 * @param {Object} props - 组件属性
 * @param {boolean} props.collapsed - 侧边栏是否折叠
 * @param {Function} props.toggleCollapsed - 切换侧边栏折叠状态的函数
 * @returns {JSX.Element} 顶部导航组件
 */
const Header = ({ collapsed, toggleCollapsed }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isAdmin } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [notificationVisible, setNotificationVisible] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);

  // 切换全屏模式
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  // 监听全屏状态变化
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // 获取未读通知数量
  const fetchNotificationCount = useCallback(async () => {
    try {
      // 尝试从本地存储获取已读通知ID
      const readNotifications = [];
      try {
        const saved = localStorage.getItem('readNotifications');
        if (saved) {
          readNotifications.push(...JSON.parse(saved));
        }
      } catch (e) {
        console.error('读取已读通知失败:', e);
      }

      // 获取通知数据
      const response = await api.get('https://nodered.jzz77.cn:9003/api/messages', {
        timeout: 5000,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (response.data) {
        let notifications = [];

        // 处理不同的响应格式
        if (Array.isArray(response.data)) {
          notifications = [...response.data];
        } else if (response.data.messages && Array.isArray(response.data.messages)) {
          notifications = [...response.data.messages];
        }

        // 计算未读通知数量
        const unreadCount = notifications.filter(notification =>
          !readNotifications.includes(notification.id)
        ).length;

        setNotificationCount(unreadCount);
      }
    } catch (error) {
      console.error('获取通知数量失败:', error);
    }
  }, []);

  // 组件挂载时获取通知数量，并设置定时刷新
  useEffect(() => {
    fetchNotificationCount();

    // 每分钟刷新一次通知数量
    const timer = setInterval(fetchNotificationCount, 60000);

    return () => {
      clearInterval(timer);
    };
  }, [fetchNotificationCount]);

  // 切换通知中心显示状态
  const toggleNotificationCenter = () => {
    setNotificationVisible(!notificationVisible);
  };

  // 路由路径映射到中文名称
  const routeNameMap = {
    'sites': '站点管理',
    'data-query': '历史数据查询',
    'history-data': '数据查询',
    'reports': '报表系统',
    'tickets': '工单系统',
    'carbon-calc': '碳源计算',
    'calculators': '计算器',
    'user-management': '用户管理',
    'settings': '系统设置',
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
    'tickets/create': '创建工单',
    'calculators/pac': 'PAC稀释计算器',
    'calculators/pam': 'PAM稀释计算器',
    'calculators/dosing': '药剂投加计算器',
    'calculators/sludge': '剩余污泥计算器',
  };

  // 生成面包屑导航
  const generateBreadcrumbItems = () => {
    const pathSnippets = location.pathname.split('/').filter(i => i);

    const breadcrumbItems = [
      {
        title: (
          <Link to="/">
            <HomeOutlined /> 首页
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

    return breadcrumbItems;
  };

  // 用户下拉菜单项
  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人中心',
      onClick: () => navigate('/profile'),
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '设置',
      onClick: () => navigate('/settings'),
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: logout,
    },
  ];

  // 通知下拉菜单项
  const notificationMenuItems = [
    {
      key: 'all',
      label: '查看全部通知',
      onClick: () => navigate('/notifications'),
    },
  ];

  return (
    <AntHeader className={`${styles.header} ${collapsed ? styles.collapsed : ''}`}>
      <div className={styles.headerLeft}>
        <div className={styles.logo}>
          <img src="/zziot-logo.svg" alt="ZZIOT Logo" />
          <span className={styles.title}>正泽物联系统平台</span>
          <span className={styles.subtitle}>Professional</span>
        </div>
        <div className={styles.headerNav}>
          <div className={styles.breadcrumbContainer}>
            <AntBreadcrumb
              items={generateBreadcrumbItems()}
              separator={<RightOutlined style={{ fontSize: '10px' }} />}
            />
          </div>
        </div>
      </div>
      <div className={styles.headerRight}>
        <Button
          type="text"
          icon={isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
          onClick={toggleFullscreen}
          className={styles.iconButton}
          title={isFullscreen ? "退出全屏" : "全屏"}
        />
        <Button
          type="text"
          icon={isDarkMode ? <SunOutlined /> : <MoonOutlined />}
          onClick={toggleTheme}
          className={styles.iconButton}
          title={isDarkMode ? "切换到亮色模式" : "切换到暗色模式"}
        />
        <Tooltip title="通知中心">
          <Badge count={notificationCount} className={styles.badge}>
            <Button
              type="text"
              icon={<BellOutlined />}
              className={styles.iconButton}
              onClick={toggleNotificationCenter}
            />
          </Badge>
        </Tooltip>

        {/* 通知中心 */}
        <NotificationCenter
          visible={notificationVisible}
          onClose={() => setNotificationVisible(false)}
          onNotificationUpdate={(count) => setNotificationCount(count)}
        />
        <Dropdown
          menu={{ items: userMenuItems }}
          placement="bottomRight"
          arrow
        >
          <div className={styles.userInfo}>
            <Avatar
              size="default"
              icon={<UserOutlined />}
              src={user?.avatar || `https://api.dicebear.com/7.x/pixel-art/png?seed=${user?.avatar_seed || user?.id || Math.random()}`}
              className={styles.avatar}
            />
            <div className={styles.userDetails}>
              <span className={styles.userName}>{user?.username || user?.name || '用户'}</span>
              <span className={styles.userRole}>
                {isAdmin ? '管理员' : (user?.department || '普通用户')}
              </span>
            </div>
          </div>
        </Dropdown>
      </div>
    </AntHeader>
  );
};

export default Header;