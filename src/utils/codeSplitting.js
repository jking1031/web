/**
 * 代码分割与懒加载优化
 * 提供更精细的代码分割策略和组件懒加载实现
 */
import React, { lazy, Suspense, useState, useEffect } from 'react';

/**
 * 增强的懒加载组件
 * @param {Function} importFunc 导入函数
 * @param {Object} options 选项
 * @returns {React.LazyExoticComponent} 懒加载组件
 */
export function enhancedLazy(importFunc, options = {}) {
  const {
    retry = 1,
    retryDelay = 1000,
    timeout = 10000,
    onError,
    onTimeout,
    onSuccess,
  } = options;
  
  return lazy(() => {
    let retryCount = 0;
    
    const load = () => {
      // 添加超时处理
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          const error = new Error(`Lazy load timed out after ${timeout}ms`);
          error.code = 'TIMEOUT';
          reject(error);
        }, timeout);
      });
      
      // 加载组件
      const loadPromise = importFunc()
        .then((result) => {
          if (onSuccess) {
            onSuccess();
          }
          return result;
        })
        .catch((error) => {
          if (retryCount < retry) {
            retryCount++;
            
            // 延迟重试
            return new Promise((resolve) => {
              setTimeout(() => {
                resolve(load());
              }, retryDelay);
            });
          }
          
          if (onError) {
            onError(error);
          }
          
          throw error;
        });
      
      // 竞争超时和加载
      return Promise.race([loadPromise, timeoutPromise])
        .catch((error) => {
          if (error.code === 'TIMEOUT' && onTimeout) {
            onTimeout(error);
          }
          throw error;
        });
    };
    
    return load();
  });
}

/**
 * 懒加载组件包装器
 * @param {React.LazyExoticComponent} LazyComponent 懒加载组件
 * @param {Object} options 选项
 * @returns {React.FC} 包装后的组件
 */
export function withLazyLoading(LazyComponent, options = {}) {
  const {
    fallback = null,
    errorFallback = null,
    minDelay = 0,
  } = options;
  
  return function LazyLoadingWrapper(props) {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    
    useEffect(() => {
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, minDelay);
      
      return () => clearTimeout(timer);
    }, []);
    
    if (error && errorFallback) {
      return React.isValidElement(errorFallback)
        ? errorFallback
        : errorFallback(error, () => setError(null));
    }
    
    return (
      <Suspense fallback={isLoading || fallback}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}

/**
 * 预加载组件
 * @param {Function} importFunc 导入函数
 */
export function preloadComponent(importFunc) {
  importFunc();
}

/**
 * 按需加载组件
 * @param {string} chunkName 块名称
 * @param {Function} importFunc 导入函数
 * @param {Object} options 选项
 * @returns {React.FC} 按需加载的组件
 */
export function loadable(chunkName, importFunc, options = {}) {
  const LazyComponent = enhancedLazy(importFunc, options);
  
  const LoadableComponent = withLazyLoading(LazyComponent, options);
  
  // 添加预加载方法
  LoadableComponent.preload = () => preloadComponent(importFunc);
  
  // 添加显示名称
  LoadableComponent.displayName = `Loadable(${chunkName})`;
  
  return LoadableComponent;
}

/**
 * 路由级别的代码分割
 * @param {string} chunkName 块名称
 * @param {Function} importFunc 导入函数
 * @param {Object} options 选项
 * @returns {React.FC} 路由组件
 */
export function routeComponent(chunkName, importFunc, options = {}) {
  const defaultOptions = {
    fallback: <div className="route-loading">加载中...</div>,
    errorFallback: (error, retry) => (
      <div className="route-error">
        <h3>加载失败</h3>
        <p>{error.message}</p>
        <button onClick={retry}>重试</button>
      </div>
    ),
    ...options,
  };
  
  return loadable(chunkName, importFunc, defaultOptions);
}

/**
 * 组件级别的代码分割
 * @param {string} chunkName 块名称
 * @param {Function} importFunc 导入函数
 * @param {Object} options 选项
 * @returns {React.FC} 组件
 */
export function componentLazy(chunkName, importFunc, options = {}) {
  const defaultOptions = {
    fallback: <div className="component-loading">加载中...</div>,
    ...options,
  };
  
  return loadable(chunkName, importFunc, defaultOptions);
}
