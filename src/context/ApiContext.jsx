/**
 * API 上下文提供者
 * 提供全局 API 状态和缓存管理
 */
import React, { createContext, useState, useCallback, useContext, useEffect } from 'react';
import apiManager from '../services/apiManager';

// 创建简单的缓存实现
class ApiCache {
  constructor(maxSize = 100) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }
  
  has(key) {
    return this.cache.has(key);
  }
  
  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    
    // 检查是否过期
    if (item.expiry && item.expiry < Date.now()) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }
  
  set(key, data, ttl = null) {
    // 如果缓存已满，删除最早的项
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
    
    const expiry = ttl ? Date.now() + ttl : null;
    this.cache.set(key, { data, expiry });
  }
  
  delete(key) {
    this.cache.delete(key);
  }
  
  clear() {
    this.cache.clear();
  }
}

// 创建API上下文
export const ApiContext = createContext();

/**
 * API上下文提供者组件
 * @param {object} props - 组件属性
 * @param {React.ReactNode} props.children - 子组件
 * @param {number} props.cacheSize - 缓存大小
 * @returns {React.ReactElement} API上下文提供者组件
 */
export const ApiProvider = ({ children, cacheSize = 100 }) => {
  const [cache] = useState(() => new ApiCache(cacheSize));
  const [apiStatus, setApiStatus] = useState({
    loading: false,
    error: null
  });
  
  // 清除缓存
  const clearCache = useCallback(() => {
    cache.clear();
  }, [cache]);
  
  // 刷新API注册表
  const refreshRegistry = useCallback(() => {
    setApiStatus({ loading: true, error: null });
    
    try {
      apiManager.registry.reload();
      setApiStatus({ loading: false, error: null });
    } catch (error) {
      setApiStatus({ loading: false, error });
      console.error('刷新API注册表失败:', error);
    }
  }, []);
  
  // 获取缓存的API响应
  const getCachedResponse = useCallback((apiKey, params) => {
    const cacheKey = `${apiKey}:${JSON.stringify(params)}`;
    return cache.get(cacheKey);
  }, [cache]);
  
  // 缓存API响应
  const cacheResponse = useCallback((apiKey, params, data, ttl = 60000) => {
    const cacheKey = `${apiKey}:${JSON.stringify(params)}`;
    cache.set(cacheKey, data, ttl);
  }, [cache]);
  
  // 初始化
  useEffect(() => {
    // 监听API事件
    const handleApiEvent = (event) => {
      // 当API注册表变化时，可以在这里执行一些操作
      console.log('API事件:', event);
    };
    
    apiManager.registry.eventEmitter.addEventListener(apiManager.API_EVENTS.REGISTERED, handleApiEvent);
    apiManager.registry.eventEmitter.addEventListener(apiManager.API_EVENTS.UPDATED, handleApiEvent);
    apiManager.registry.eventEmitter.addEventListener(apiManager.API_EVENTS.REMOVED, handleApiEvent);
    
    return () => {
      apiManager.registry.eventEmitter.removeEventListener(apiManager.API_EVENTS.REGISTERED, handleApiEvent);
      apiManager.registry.eventEmitter.removeEventListener(apiManager.API_EVENTS.UPDATED, handleApiEvent);
      apiManager.registry.eventEmitter.removeEventListener(apiManager.API_EVENTS.REMOVED, handleApiEvent);
    };
  }, []);
  
  const value = {
    cache,
    apiStatus,
    clearCache,
    refreshRegistry,
    getCachedResponse,
    cacheResponse
  };
  
  return (
    <ApiContext.Provider value={value}>
      {children}
    </ApiContext.Provider>
  );
};

/**
 * 使用API上下文的Hook
 * @returns {object} API上下文
 */
export const useApiContext = () => {
  const context = useContext(ApiContext);
  
  if (!context) {
    throw new Error('useApiContext必须在ApiProvider内部使用');
  }
  
  return context;
};
