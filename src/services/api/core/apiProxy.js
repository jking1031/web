/**
 * API 代理服务
 * 用于统一处理 API 调用，支持缓存、重试、转换等功能
 */

import apiRegistry from './apiRegistry';
import { API_EVENTS, API_STATUS } from './apiRegistry';
import { message } from 'antd';

// 缓存存储
const apiCache = new Map();

class ApiProxy {
  constructor() {
    // 注册事件监听
    apiRegistry.eventEmitter.addEventListener(API_EVENTS.REMOVED, this.handleApiRemoved.bind(this));
  }

  /**
   * 处理 API 删除事件
   * @param {Object} event 事件对象
   */
  handleApiRemoved(event) {
    // 清除相关缓存
    this.clearCache(event.key);
  }

  /**
   * 清除指定 API 的缓存
   * @param {string} apiKey API 键名
   */
  clearCache(apiKey) {
    if (apiKey) {
      // 清除特定 API 的缓存
      const cacheKeys = Array.from(apiCache.keys()).filter(key => key.startsWith(`${apiKey}:`));
      cacheKeys.forEach(key => apiCache.delete(key));
    } else {
      // 清除所有缓存
      apiCache.clear();
    }
  }

  /**
   * 生成缓存键
   * @param {string} apiKey API 键名
   * @param {Object} params 请求参数
   * @returns {string} 缓存键
   */
  generateCacheKey(apiKey, params) {
    return `${apiKey}:${JSON.stringify(params || {})}`;
  }

  /**
   * 检查缓存是否有效
   * @param {string} cacheKey 缓存键
   * @returns {Object|null} 缓存数据或 null
   */
  checkCache(cacheKey) {
    if (apiCache.has(cacheKey)) {
      const cache = apiCache.get(cacheKey);
      // 检查缓存是否过期
      if (cache.expiry > Date.now()) {
        return cache.data;
      }
      // 缓存已过期，删除
      apiCache.delete(cacheKey);
    }
    return null;
  }

  /**
   * 设置缓存
   * @param {string} cacheKey 缓存键
   * @param {Object} data 缓存数据
   * @param {number} cacheTime 缓存时间（毫秒）
   */
  setCache(cacheKey, data, cacheTime) {
    if (cacheTime > 0) {
      apiCache.set(cacheKey, {
        data,
        expiry: Date.now() + cacheTime
      });
    }
  }

  /**
   * 调用 API
   * @param {string} apiKey API 键名
   * @param {Object} params 请求参数
   * @param {Object} options 请求选项
   * @returns {Promise} 请求 Promise
   */
  async call(apiKey, params = {}, options = {}) {
    // 获取 API 配置
    const apiConfig = apiRegistry.get(apiKey);
    if (!apiConfig) {
      return Promise.reject(new Error(`API 配置不存在: ${apiKey}`));
    }

    // 检查 API 状态
    if (apiConfig.status === API_STATUS.DISABLED) {
      return Promise.reject(new Error(`API 已禁用: ${apiKey}`));
    }

    // 合并选项
    const requestOptions = {
      ...options,
      timeout: options.timeout || apiConfig.timeout
    };

    // 检查是否使用缓存
    const cacheTime = options.cacheTime !== undefined ? options.cacheTime : apiConfig.cacheTime;
    if (cacheTime > 0) {
      const cacheKey = this.generateCacheKey(apiKey, params);
      const cachedData = this.checkCache(cacheKey);
      if (cachedData) {
        return Promise.resolve(cachedData);
      }
    }

    // 如果配置了自定义处理函数，则使用自定义处理函数
    if (apiConfig.handler && typeof apiConfig.handler === 'function') {
      try {
        // 执行自定义处理函数
        const result = await apiConfig.handler(params, requestOptions);

        // 如果配置了缓存，则缓存结果
        if (cacheTime > 0) {
          const cacheKey = this.generateCacheKey(apiKey, params);
          this.setCache(cacheKey, result, cacheTime);
        }

        return result;
      } catch (error) {
        // 重试逻辑
        const retries = options.retries !== undefined ? options.retries : apiConfig.retries;
        if (retries > 0) {
          console.log(`API 调用失败，准备重试: ${apiKey}，剩余重试次数: ${retries}`);
          return this.call(apiKey, params, { ...options, retries: retries - 1 });
        }

        // 显示错误消息
        if (options.showError !== false) {
          const errorMessage = error.message || '请求失败';
          message.error(errorMessage);
        }

        throw error;
      }
    }

    // 获取 axios 实例
    const axiosInstance = apiRegistry.getAxiosInstance(apiConfig.axiosInstance);

    // 处理URL参数替换和自定义参数处理
    let processedUrl = apiConfig.url;
    let processedRequestParams = { ...params };

    // 如果配置了参数处理函数，则使用参数处理函数
    if (apiConfig.paramsProcessor && typeof apiConfig.paramsProcessor === 'function') {
      try {
        const result = apiConfig.paramsProcessor(params);
        if (result && result.url) {
          processedUrl = result.url;
        }
        if (result && result.params) {
          processedRequestParams = result.params;
        }
      } catch (error) {
        console.error('参数处理函数执行失败:', error);
      }
    } else {
      // 替换URL中的参数占位符
      // 支持两种格式: :param 和 {param}
      Object.keys(params).forEach(key => {
        // 替换 :param 格式
        processedUrl = processedUrl.replace(new RegExp(`:${key}\\b`, 'g'), params[key]);

        // 替换 {param} 格式
        processedUrl = processedUrl.replace(new RegExp(`\\{${key}\\}`, 'g'), params[key]);
      });
    }

    // 构建请求配置
    const requestConfig = {
      url: processedUrl,
      method: apiConfig.method,
      timeout: requestOptions.timeout,
      headers: {
        ...apiConfig.headers,
        ...requestOptions.headers
      }
    };

    // 根据请求方法处理参数
    if (['GET', 'DELETE'].includes(apiConfig.method.toUpperCase())) {
      requestConfig.params = {
        ...apiConfig.params,
        ...processedRequestParams
      };
    } else {
      requestConfig.data = {
        ...apiConfig.data,
        ...processedRequestParams
      };
    }

    // 发送请求
    try {
      // 如果配置了模拟数据，则返回模拟数据
      if (apiConfig.mock && (options.useMock || process.env.NODE_ENV === 'development')) {
        const mockData = typeof apiConfig.mock === 'function' ? apiConfig.mock(params) : apiConfig.mock;

        // 如果配置了缓存，则缓存模拟数据
        if (cacheTime > 0) {
          const cacheKey = this.generateCacheKey(apiKey, params);
          this.setCache(cacheKey, mockData, cacheTime);
        }

        return Promise.resolve(mockData);
      }

      // 发送实际请求
      const response = await axiosInstance(requestConfig);

      // 处理响应数据
      let responseData = response.data;

      // 如果配置了转换函数，则转换响应数据
      if (apiConfig.transform && typeof apiConfig.transform === 'function') {
        responseData = apiConfig.transform(responseData, params);
      }

      // 如果配置了验证函数，则验证响应数据
      if (apiConfig.validate && typeof apiConfig.validate === 'function') {
        const validationResult = apiConfig.validate(responseData);
        if (validationResult !== true) {
          throw new Error(validationResult || '数据验证失败');
        }
      }

      // 标准化响应格式，确保包含success和data字段
      if (responseData && typeof responseData === 'object') {
        if (responseData.success === undefined) {
          responseData = {
            success: true,
            data: responseData
          };
        } else if (responseData.data === undefined && !responseData.error) {
          // 如果有success但没有data字段，将除success外的其他数据放入data
          const { success, ...rest } = responseData;
          responseData = {
            success,
            data: Object.keys(rest).length > 0 ? rest : null
          };
        }
      } else {
        // 如果响应不是对象，包装为标准格式
        responseData = {
          success: true,
          data: responseData
        };
      }

      // 如果配置了缓存，则缓存响应数据
      if (cacheTime > 0) {
        const cacheKey = this.generateCacheKey(apiKey, params);
        this.setCache(cacheKey, responseData, cacheTime);
      }

      return responseData;
    } catch (error) {
      // 重试逻辑
      const retries = options.retries !== undefined ? options.retries : apiConfig.retries;
      if (retries > 0) {
        console.log(`API 调用失败，准备重试: ${apiKey}，剩余重试次数: ${retries}`);
        return this.call(apiKey, params, { ...options, retries: retries - 1 });
      }

      // 显示错误消息
      if (options.showError !== false) {
        const errorMessage = error.response?.data?.message || error.message || '请求失败';
        message.error(errorMessage);
      }

      throw error;
    }
  }

  /**
   * 批量调用 API
   * @param {Array} calls API 调用配置数组
   * @param {Object} globalOptions 全局请求选项
   * @returns {Promise} 请求 Promise
   */
  async batchCall(calls, globalOptions = {}) {
    if (!Array.isArray(calls) || calls.length === 0) {
      return Promise.reject(new Error('无效的 API 调用配置'));
    }

    // 创建所有 API 调用的 Promise
    const promises = calls.map(call => {
      const { apiKey, params, options } = call;
      // 合并全局选项和调用特定选项
      const mergedOptions = {
        ...globalOptions,
        ...options
      };

      // 调用 API
      return this.call(apiKey, params, mergedOptions)
        .then(data => ({ apiKey, data, success: true }))
        .catch(error => ({ apiKey, error, success: false }));
    });

    // 等待所有 API 调用完成
    return Promise.all(promises);
  }

  /**
   * 测试 API
   * @param {string} apiKey API 键名
   * @param {Object} params 测试参数
   * @returns {Promise} 测试结果 Promise
   */
  async test(apiKey, params = {}) {
    // 获取 API 配置
    const apiConfig = apiRegistry.get(apiKey);
    if (!apiConfig) {
      const errorMsg = `API 配置不存在: ${apiKey}`;
      console.error(`[API测试] ${errorMsg}`);
      return Promise.reject(new Error(errorMsg));
    }

    // 创建测试日志
    const testLog = {
      timestamp: new Date().toISOString(),
      apiKey,
      apiName: apiConfig.name,
      method: apiConfig.method,
      url: apiConfig.url,
      params: JSON.parse(JSON.stringify(params)), // 深拷贝参数
      startTime: Date.now(),
      logs: [`[${new Date().toLocaleTimeString()}] 开始测试 API: ${apiKey} (${apiConfig.name})`]
    };

    // 记录开始时间
    const startTime = Date.now();

    // 如果配置了自定义处理函数，则使用自定义处理函数
    if (apiConfig.handler && typeof apiConfig.handler === 'function') {
      testLog.logs.push(`[${new Date().toLocaleTimeString()}] 使用自定义处理函数`);
      try {
        // 执行自定义处理函数
        testLog.logs.push(`[${new Date().toLocaleTimeString()}] 执行自定义处理函数，参数: ${JSON.stringify(params)}`);
        const result = await apiConfig.handler(params, { timeout: apiConfig.timeout });

        // 计算响应时间
        const responseTime = Date.now() - startTime;
        testLog.endTime = Date.now();
        testLog.duration = responseTime;
        testLog.success = true;
        testLog.logs.push(`[${new Date().toLocaleTimeString()}] 自定义处理函数执行成功，耗时: ${responseTime}ms`);

        const response = {
          success: true,
          data: result,
          responseTime,
          message: '自定义处理函数执行成功',
          isCustomHandler: true,
          testLog // 添加测试日志
        };

        // 记录响应结果
        testLog.response = response;
        console.log('[API测试日志]', testLog);

        return response;
      } catch (error) {
        // 计算响应时间
        const responseTime = Date.now() - startTime;
        testLog.endTime = Date.now();
        testLog.duration = responseTime;
        testLog.success = false;
        testLog.error = error.message;
        testLog.logs.push(`[${new Date().toLocaleTimeString()}] 自定义处理函数执行失败: ${error.message}，耗时: ${responseTime}ms`);

        const response = {
          success: false,
          error: error.message,
          responseTime,
          message: '自定义处理函数执行失败',
          isCustomHandler: true,
          testLog // 添加测试日志
        };

        // 记录响应结果
        testLog.response = response;
        console.error('[API测试日志]', testLog);

        return response;
      }
    }

    // 获取 axios 实例
    const axiosInstance = apiRegistry.getAxiosInstance(apiConfig.axiosInstance);
    testLog.logs.push(`[${new Date().toLocaleTimeString()}] 使用 axios 实例: ${apiConfig.axiosInstance || 'default'}`);

    // 构建请求配置
    const requestConfig = {
      url: apiConfig.url,
      method: apiConfig.method,
      timeout: apiConfig.timeout,
      headers: {
        ...apiConfig.headers
      }
    };

    // 根据请求方法处理参数
    if (['GET', 'DELETE'].includes(apiConfig.method.toUpperCase())) {
      requestConfig.params = {
        ...apiConfig.params,
        ...params
      };
      testLog.logs.push(`[${new Date().toLocaleTimeString()}] 设置请求参数 (params): ${JSON.stringify(requestConfig.params)}`);
    } else {
      requestConfig.data = {
        ...apiConfig.data,
        ...params
      };
      testLog.logs.push(`[${new Date().toLocaleTimeString()}] 设置请求数据 (data): ${JSON.stringify(requestConfig.data)}`);
    }

    // 记录请求配置
    testLog.requestConfig = { ...requestConfig };
    testLog.logs.push(`[${new Date().toLocaleTimeString()}] 请求URL: ${requestConfig.url}`);
    testLog.logs.push(`[${new Date().toLocaleTimeString()}] 请求方法: ${requestConfig.method}`);
    testLog.logs.push(`[${new Date().toLocaleTimeString()}] 超时设置: ${requestConfig.timeout}ms`);

    try {
      // 发送请求
      testLog.logs.push(`[${new Date().toLocaleTimeString()}] 开始发送请求...`);
      const response = await axiosInstance(requestConfig);
      testLog.logs.push(`[${new Date().toLocaleTimeString()}] 请求成功，状态码: ${response.status} ${response.statusText}`);

      // 计算响应时间
      const responseTime = Date.now() - startTime;
      testLog.endTime = Date.now();
      testLog.duration = responseTime;
      testLog.success = true;
      testLog.logs.push(`[${new Date().toLocaleTimeString()}] 请求完成，耗时: ${responseTime}ms`);

      // 处理响应数据
      let responseData = response.data;
      testLog.logs.push(`[${new Date().toLocaleTimeString()}] 原始响应数据: ${JSON.stringify(response.data).substring(0, 500)}${JSON.stringify(response.data).length > 500 ? '...(已截断)' : ''}`);

      // 如果配置了转换函数，则转换响应数据
      if (apiConfig.transform && typeof apiConfig.transform === 'function') {
        testLog.logs.push(`[${new Date().toLocaleTimeString()}] 使用转换函数处理响应数据`);
        responseData = apiConfig.transform(responseData, params);
        testLog.logs.push(`[${new Date().toLocaleTimeString()}] 转换后的响应数据: ${JSON.stringify(responseData).substring(0, 500)}${JSON.stringify(responseData).length > 500 ? '...(已截断)' : ''}`);
      }

      const result = {
        success: true,
        status: response.status,
        statusText: response.statusText,
        data: responseData,
        originalData: response.data,
        responseTime,
        headers: response.headers,
        config: requestConfig,
        testLog // 添加测试日志
      };

      // 记录响应结果
      testLog.response = result;
      console.log('[API测试日志]', testLog);

      return result;
    } catch (error) {
      // 计算响应时间
      const responseTime = Date.now() - startTime;
      testLog.endTime = Date.now();
      testLog.duration = responseTime;
      testLog.success = false;
      testLog.error = error.message;

      testLog.logs.push(`[${new Date().toLocaleTimeString()}] 请求失败: ${error.message}`);
      if (error.response) {
        testLog.logs.push(`[${new Date().toLocaleTimeString()}] 响应状态码: ${error.response.status} ${error.response.statusText}`);
        testLog.logs.push(`[${new Date().toLocaleTimeString()}] 响应数据: ${JSON.stringify(error.response.data).substring(0, 500)}${JSON.stringify(error.response.data).length > 500 ? '...(已截断)' : ''}`);
      }
      testLog.logs.push(`[${new Date().toLocaleTimeString()}] 请求完成，耗时: ${responseTime}ms`);

      const result = {
        success: false,
        error: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        responseTime,
        config: requestConfig,
        testLog // 添加测试日志
      };

      // 记录响应结果
      testLog.response = result;
      console.error('[API测试日志]', testLog);

      return result;
    }
  }
}

// 创建单例
const apiProxy = new ApiProxy();

export default apiProxy;
