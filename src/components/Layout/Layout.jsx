import React, { useState, useEffect } from 'react';
import { Layout as AntLayout, ConfigProvider, theme } from 'antd';
import { Outlet } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import Header from './Header';
import Sidebar from './Sidebar';
import TopContent from './TopContent';
import styles from './Layout.module.scss';

const { Content, Footer } = AntLayout;

/**
 * 应用主布局组件
 * @returns {JSX.Element} 布局组件
 */
const Layout = () => {
  const { isDarkMode, colors } = useTheme();
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

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

  // 配置主题
  const themeConfig = {
    algorithm: isDarkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
    token: {
      colorPrimary: colors.primary,
      borderRadius: 4,
    },
  };

  return (
    <ConfigProvider theme={themeConfig}>
      <AntLayout className={styles.layout}>
        {/* 页头固定在顶部 */}
        <Header collapsed={collapsed} toggleCollapsed={toggleCollapsed} />

        {/* 侧边栏 */}
        <Sidebar collapsed={collapsed} onMenuClick={handleMenuClick} />

        {/* 主内容区域 */}
        <AntLayout
          className={styles.mainLayout}
          style={{
            marginLeft: isMobile ? 0 : (collapsed ? '80px' : '240px'),
            width: isMobile ? '100%' : (collapsed ? 'calc(100% - 80px)' : 'calc(100% - 240px)')
          }}
        >
          <Content className={styles.mainContent}>
            <TopContent />
            <div className={styles.pageContent}>
              <Outlet />
            </div>
          </Content>
          <Footer className={styles.footer}>
            正泽物联系统平台 ©{new Date().getFullYear()} ZZIOT Web
          </Footer>
        </AntLayout>
      </AntLayout>
    </ConfigProvider>
  );
};

export default Layout;