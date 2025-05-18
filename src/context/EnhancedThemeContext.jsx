/* 增强的主题提供者组件
 * 提供更灵活的主题配置和切换功能
 */
import React, { useState, useEffect, createContext, useContext } from 'react';

// 创建主题上下文
export const EnhancedThemeContext = createContext();

// 预定义主题配置
const themePresets = {
  light: {
    mode: 'light',
    primaryColor: '#1890ff',
    secondaryColor: '#52c41a',
    backgroundColor: '#ffffff',
    textColor: 'rgba(0, 0, 0, 0.85)',
    componentBackground: '#ffffff',
    borderRadius: 4,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  dark: {
    mode: 'dark',
    primaryColor: '#177ddc',
    secondaryColor: '#49aa19',
    backgroundColor: '#141414',
    textColor: 'rgba(255, 255, 255, 0.85)',
    componentBackground: '#1f1f1f',
    borderRadius: 4,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  compact: {
    mode: 'light',
    primaryColor: '#1890ff',
    secondaryColor: '#52c41a',
    backgroundColor: '#ffffff',
    textColor: 'rgba(0, 0, 0, 0.85)',
    componentBackground: '#ffffff',
    borderRadius: 2,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    compact: true,
  },
};

export function EnhancedThemeProvider({ children }) {
  // 从本地存储加载主题配置或使用默认配置
  const [themeConfig, setThemeConfig] = useState(() => {
    const savedTheme = localStorage.getItem('themeConfig');
    if (savedTheme) {
      try {
        return JSON.parse(savedTheme);
      } catch (e) {
        console.error('Failed to parse theme config', e);
        return themePresets.light;
      }
    }
    return themePresets.light;
  });

  // 保存主题配置到本地存储
  useEffect(() => {
    localStorage.setItem('themeConfig', JSON.stringify(themeConfig));
    
    // 应用主题到文档根元素
    document.documentElement.setAttribute('data-theme', themeConfig.mode);
    
    // 生成CSS变量
    const root = document.documentElement;
    Object.entries(themeConfig).forEach(([key, value]) => {
      if (typeof value === 'string' || typeof value === 'number') {
        root.style.setProperty(`--${key}`, value);
      }
    });
  }, [themeConfig]);

  // 切换主题模式
  const toggleThemeMode = () => {
    setThemeConfig(prev => ({
      ...prev,
      mode: prev.mode === 'light' ? 'dark' : 'light',
      ...(prev.mode === 'light' ? {
        backgroundColor: themePresets.dark.backgroundColor,
        textColor: themePresets.dark.textColor,
        componentBackground: themePresets.dark.componentBackground,
      } : {
        backgroundColor: themePresets.light.backgroundColor,
        textColor: themePresets.light.textColor,
        componentBackground: themePresets.light.componentBackground,
      }),
    }));
  };

  // 应用预设主题
  const applyThemePreset = (presetName) => {
    if (themePresets[presetName]) {
      setThemeConfig(themePresets[presetName]);
    }
  };

  // 更新主题配置
  const updateThemeConfig = (updates) => {
    setThemeConfig(prev => ({
      ...prev,
      ...updates,
    }));
  };

  // 提供给消费组件的上下文值
  const contextValue = {
    themeConfig,
    toggleThemeMode,
    applyThemePreset,
    updateThemeConfig,
    themePresets,
  };

  return (
    <EnhancedThemeContext.Provider value={contextValue}>
      <div className={`theme-${themeConfig.mode} ${themeConfig.compact ? 'theme-compact' : ''}`}>
        {children}
      </div>
    </EnhancedThemeContext.Provider>
  );
}

// 自定义钩子，方便在组件中使用主题
export function useEnhancedTheme() {
  const context = useContext(EnhancedThemeContext);
  if (!context) {
    throw new Error('useEnhancedTheme must be used within an EnhancedThemeProvider');
  }
  return context;
}
