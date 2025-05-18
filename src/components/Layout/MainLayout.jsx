import React, { useState, useEffect } from 'react';
import { Layout, ConfigProvider, theme } from 'antd';
import { Outlet } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import Header from './Header';
import Sidebar from './Sidebar';
import styles from './MainLayout.module.scss';

const { Content } = Layout;

/**
 * 主布局组件 - 基于 ThingsBoard 布局风格
 * @returns {JSX.Element} 主布局组件
 */
const MainLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { isDarkMode, colors } = useTheme();

  // 检测屏幕尺寸
  useEffect(() => {
    const checkMobile = () => {
      const isMobileView = window.innerWidth <= 768;
      setIsMobile(isMobileView);
      if (isMobileView) {
        setCollapsed(true);
      } else {
        setCollapsed(false); // 在桌面视图下默认展开侧边栏
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // 切换侧边栏折叠状态
  const toggleCollapsed = () => {
    setCollapsed(!collapsed);
  };

  // 自动折叠侧边栏（当点击侧边栏菜单项时，在移动设备上自动折叠侧边栏）
  const handleMenuClick = () => {
    if (isMobile) {
      setCollapsed(true);
    }
  };

  return (
    <ConfigProvider
      theme={{
        algorithm: isDarkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: colors.primary,
          colorBgBase: colors.background,
          colorTextBase: colors.text,
          borderRadius: 2,
        },
      }}
    >
      <Layout className={styles.layout}>
        {/* 页头固定在顶部 */}
        <Header collapsed={collapsed} toggleCollapsed={toggleCollapsed} />

        {/* 侧边栏 */}
        <Sidebar collapsed={collapsed} onMenuClick={handleMenuClick} />

        {/* 主内容区域 */}
        <Layout
          className={styles.mainLayout}
          style={{
            marginLeft: isMobile ? 0 : (collapsed ? '80px' : '240px'),
            width: isMobile ? '100%' : (collapsed ? 'calc(100% - 80px)' : 'calc(100% - 240px)')
          }}
        >
          <Content className={styles.mainContent}>
            <div className={styles.pageContent}>
              <Outlet />
            </div>
          </Content>
        </Layout>
      </Layout>
    </ConfigProvider>
  );
};

export default MainLayout;
