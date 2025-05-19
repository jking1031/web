/**
 * API Hooks 系统
 * 提供组件使用的 API 调用钩子函数
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import apiService from '../services/apiService';

/**
 * 使用单个API的Hook
 * @param {string} apiKey - API键名
 * @param {object} defaultParams - 默认参数
 * @param {object} options - 选项（如自动加载、缓存等）
 * @returns {object} - 返回API调用状态和函数
 */
export function useApi(apiKey, defaultParams = {}, options = {}) {
  const { 
    autoLoad = false, 
    dependencies = [],
    onSuccess = null,
    onError = null,
    transformData = data => data
  } = options;
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [params, setParams] = useState(defaultParams);
  const isMounted = useRef(true);
  
  // 执行API调用
  const execute = useCallback(async (callParams = null) => {
    const finalParams = callParams || params;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.callApi(apiKey, finalParams);
      
      if (isMounted.current) {
        const transformedData = transformData(response);
        setData(transformedData);
        setLoading(false);
        
        if (onSuccess) {
          onSuccess(transformedData);
        }
      }
      
      return response;
    } catch (err) {
      if (isMounted.current) {
        setError(err);
        setLoading(false);
        
        if (onError) {
          onError(err);
        }
      }
      throw err;
    }
  }, [apiKey, params, transformData, onSuccess, onError]);
  
  // 更新参数并执行
  const executeWithParams = useCallback((newParams) => {
    setParams(prev => ({ ...prev, ...newParams }));
    return execute({ ...params, ...newParams });
  }, [execute, params]);
  
  // 重置状态
  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setParams(defaultParams);
  }, [defaultParams]);
  
  // 自动加载
  useEffect(() => {
    if (autoLoad) {
      execute();
    }
    
    return () => {
      isMounted.current = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoLoad, execute, ...dependencies]);
  
  return {
    data,
    loading,
    error,
    execute,
    executeWithParams,
    reset,
    setParams
  };
}

/**
 * 使用多个API的Hook
 * @param {Array<{key: string, params: object, options: object}>} apiConfigs - API配置数组
 * @param {object} options - 选项（如自动加载、并行等）
 * @returns {object} - 返回批量API调用状态和函数
 */
export function useApis(apiConfigs, options = {}) {
  const { 
    autoLoad = false, 
    parallel = true,
    dependencies = [],
    onSuccess = null,
    onError = null
  } = options;
  
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const isMounted = useRef(true);
  
  // 执行批量API调用
  const execute = useCallback(async (customConfigs = null) => {
    const configs = customConfigs || apiConfigs;
    
    setLoading(true);
    setErrors({});
    
    try {
      const responses = await apiService.batchCallApis(configs, parallel);
      
      if (isMounted.current) {
        const newResults = {};
        const newErrors = {};
        
        responses.forEach(({ key, response, error }) => {
          if (error) {
            newErrors[key] = error;
          } else {
            newResults[key] = response;
          }
        });
        
        setResults(prev => ({ ...prev, ...newResults }));
        setErrors(newErrors);
        setLoading(false);
        
        if (onSuccess && Object.keys(newResults).length > 0) {
          onSuccess(newResults);
        }
        
        if (onError && Object.keys(newErrors).length > 0) {
          onError(newErrors);
        }
      }
      
      return responses;
    } catch (err) {
      if (isMounted.current) {
        setErrors({ general: err });
        setLoading(false);
        
        if (onError) {
          onError({ general: err });
        }
      }
      throw err;
    }
  }, [apiConfigs, parallel, onSuccess, onError]);
  
  // 重置状态
  const reset = useCallback(() => {
    setResults({});
    setErrors({});
  }, []);
  
  // 自动加载
  useEffect(() => {
    if (autoLoad) {
      execute();
    }
    
    return () => {
      isMounted.current = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoLoad, execute, ...dependencies]);
  
  return {
    results,
    loading,
    errors,
    execute,
    reset
  };
}

/**
 * 使用分页API的Hook
 * @param {string} apiKey - API键名
 * @param {object} defaultParams - 默认参数
 * @param {object} options - 选项
 * @returns {object} - 返回分页API调用状态和函数
 */
export function usePaginatedApi(apiKey, defaultParams = {}, options = {}) {
  const { 
    pageSize = 10,
    initialPage = 1,
    ...restOptions
  } = options;
  
  const [page, setPage] = useState(initialPage);
  const [total, setTotal] = useState(0);
  
  // 构建分页参数
  const paginationParams = {
    ...defaultParams,
    page,
    pageSize
  };
  
  // 使用基础API Hook
  const apiHook = useApi(apiKey, paginationParams, {
    ...restOptions,
    dependencies: [...(restOptions.dependencies || []), page, pageSize],
    transformData: (response) => {
      // 假设API返回格式为 { data: [...], total: 100 }
      if (response && typeof response === 'object') {
        if ('total' in response) {
          setTotal(response.total);
        }
        
        // 返回数据部分
        return response.data || response;
      }
      return response;
    }
  });
  
  // 分页控制函数
  const handlePageChange = useCallback((newPage) => {
    setPage(newPage);
  }, []);
  
  return {
    ...apiHook,
    page,
    pageSize,
    total,
    handlePageChange
  };
}
