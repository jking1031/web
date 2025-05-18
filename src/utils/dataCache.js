/**
 * 数据缓存策略实现
 * 提供智能的数据缓存机制，减少不必要的API请求
 */
import { useState, useEffect, useCallback } from 'react';

// 缓存存储
const cacheStore = new Map();

// 缓存项结构
class CacheItem {
  constructor(data, timestamp, ttl = 60000) {
    this.data = data;
    this.timestamp = timestamp;
    this.ttl = ttl; // 生存时间，默认60秒
  }

  isExpired(now = Date.now()) {
    return now - this.timestamp > this.ttl;
  }
}

/**
 * 使用数据缓存的自定义Hook
 * @param {string} key 缓存键
 * @param {Function} fetchData 获取数据的函数
 * @param {Object} options 选项
 * @returns {Object} 数据、加载状态、错误和刷新函数
 */
export function useDataCache(key, fetchData, options = {}) {
  const { 
    enabled = true, 
    ttl = 60000, // 默认缓存60秒
    staleTime = 30000, // 默认30秒后视为过期
    onSuccess,
    onError,
    dependencies = []
  } = options;
  
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // 获取数据的函数
  const getData = useCallback(async (force = false) => {
    // 如果禁用，则不获取数据
    if (!enabled) return null;
    
    const now = Date.now();
    const cacheItem = cacheStore.get(key);
    
    // 如果有缓存且未强制刷新
    if (cacheItem && !force) {
      // 如果缓存未过期，直接返回缓存数据
      if (!cacheItem.isExpired(now)) {
        setData(cacheItem.data);
        return cacheItem.data;
      }
      
      // 如果缓存已过期但未超过staleTime，先返回缓存数据，然后在后台刷新
      if (now - cacheItem.timestamp <= staleTime + ttl) {
        setData(cacheItem.data);
        // 在后台刷新数据
        getData(true).catch(console.error);
        return cacheItem.data;
      }
    }
    
    // 没有缓存或需要强制刷新
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await fetchData();
      setData(result);
      
      // 缓存数据
      cacheStore.set(key, new CacheItem(result, now, ttl));
      
      // 调用成功回调
      if (onSuccess) {
        onSuccess(result);
      }
      
      return result;
    } catch (err) {
      setError(err);
      
      // 调用错误回调
      if (onError) {
        onError(err);
      }
      
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [key, fetchData, enabled, ttl, staleTime, onSuccess, onError, ...dependencies]);
  
  // 初始化时获取数据
  useEffect(() => {
    getData().catch(console.error);
  }, [getData]);
  
  // 返回数据、加载状态、错误和刷新函数
  return { 
    data, 
    isLoading, 
    error, 
    refetch: (force = true) => getData(force) 
  };
}

/**
 * 清除指定键的缓存
 * @param {string} key 缓存键
 */
export function invalidateCache(key) {
  cacheStore.delete(key);
}

/**
 * 清除所有缓存
 */
export function clearAllCache() {
  cacheStore.clear();
}

/**
 * 获取缓存状态
 * @returns {Object} 缓存状态
 */
export function getCacheStats() {
  const now = Date.now();
  let totalItems = 0;
  let expiredItems = 0;
  let totalSize = 0;
  
  cacheStore.forEach((item) => {
    totalItems++;
    if (item.isExpired(now)) {
      expiredItems++;
    }
    // 估算大小
    totalSize += JSON.stringify(item.data).length;
  });
  
  return {
    totalItems,
    expiredItems,
    activeItems: totalItems - expiredItems,
    totalSize,
    approximateSizeInKB: Math.round(totalSize / 1024),
  };
}

// 定期清理过期缓存
setInterval(() => {
  const now = Date.now();
  cacheStore.forEach((item, key) => {
    if (item.isExpired(now)) {
      cacheStore.delete(key);
    }
  });
}, 60000); // 每分钟清理一次
