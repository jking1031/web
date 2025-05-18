import React, { createContext, useState, useContext, useEffect } from 'react';

// 创建主题上下文
const ThemeContext = createContext();

/**
 * 主题提供组件
 * @param {Object} props - 组件属性
 * @param {React.ReactNode} props.children - 子组件
 */
export const ThemeProvider = ({ children }) => {
  // 检查本地存储中是否已有主题设置，默认为浅色主题
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    // 如果有保存的主题设置，则使用它；否则根据系统偏好设置
    if (savedTheme) {
      return savedTheme === 'dark';
    }
    // 检查系统偏好
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // 切换主题
  const toggleTheme = () => {
    setIsDarkMode(prevMode => !prevMode);
  };

  // 浅色主题颜色
  const lightThemeColors = {
    primary: '#2E7D32',
    primaryHover: '#388E3C',
    primaryActive: '#1B5E20',
    accent: '#FF5722',
    accentHover: '#FF7043',
    accentActive: '#E64A19',
    background: '#F5F5F7',
    card: '#FFFFFF',
    text: '#333333',
    textSecondary: '#757575',
    border: '#E0E0E0',
  };

  // 深色主题颜色
  const darkThemeColors = {
    primary: '#388E3C',
    primaryHover: '#43A047',
    primaryActive: '#2E7D32',
    accent: '#FF7043',
    accentHover: '#FF8A65',
    accentActive: '#FF5722',
    background: '#121212',
    card: '#1E1E1E',
    text: '#FFFFFF',
    textSecondary: '#BBBBBB',
    border: '#333333',
  };

  // 当前主题颜色
  const colors = isDarkMode ? darkThemeColors : lightThemeColors;

  // 当主题变化时更新文档属性和本地存储
  useEffect(() => {
    // 更新HTML data-theme属性
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');

    // 保存主题设置到本地存储
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  // 提供主题相关的值
  return (
    <ThemeContext.Provider
      value={{
        isDarkMode,
        toggleTheme,
        colors
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

/**
 * 使用主题的自定义钩子
 * @returns {Object} 包含主题状态和方法的对象
 */
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};