/**
 * API 服务层
 * 负责实际的 API 请求发送和处理
 */
import apiManager from './apiManager';

class ApiService {
  /**
   * 调用单个API
   * @param {string} apiKey - API键名
   * @param {object} params - 请求参数
   * @param {object} options - 额外选项（如超时、重试等）
   * @returns {Promise} - 返回API响应的Promise
   */
  async callApi(apiKey, params = {}, options = {}) {
    try {
      console.log(`[ApiService] 开始调用API: ${apiKey}`, {
        params: apiKey === 'login' ? { ...params, password: '******' } : params,
        options
      });

      // 检查API是否存在
      if (apiManager.registry.get(apiKey) === null) {
        console.error(`[ApiService] API不存在: ${apiKey}`);
        throw new Error(`API不存在: ${apiKey}`);
      }

      // 获取API配置
      const apiConfig = apiManager.registry.get(apiKey);
      console.log(`[ApiService] API配置: ${apiKey}`, {
        url: apiConfig.url,
        method: apiConfig.method,
        enabled: apiConfig.enabled,
        timeout: apiConfig.timeout
      });

      // 检查API是否启用
      if (apiConfig.enabled === false) {
        console.error(`[ApiService] API已禁用: ${apiKey}`);
        throw new Error(`API已禁用: ${apiKey}`);
      }

      // 合并选项
      const mergedOptions = {
        ...apiConfig,
        ...options
      };

      // 调用API
      console.log(`[ApiService] 执行API调用: ${apiKey}`);
      const response = await apiManager.call(apiKey, params, mergedOptions);
      console.log(`[ApiService] API调用成功: ${apiKey}`, {
        responseType: typeof response,
        responseKeys: response ? Object.keys(response) : null
      });

      return response;
    } catch (error) {
      console.error(`[ApiService] 调用API失败: ${apiKey}`, error);
      console.error(`[ApiService] 错误详情:`, {
        name: error.name,
        message: error.message,
        stack: error.stack,
        hasResponse: !!error.response,
        hasRequest: !!error.request
      });

      throw error;
    }
  }

  /**
   * 批量调用多个API
   * @param {Array<{key: string, params: object, options: object}>} apiCalls - API调用配置数组
   * @param {boolean} parallel - 是否并行调用，默认为true
   * @returns {Promise} - 返回所有API响应的Promise
   */
  async batchCallApis(apiCalls, parallel = true) {
    try {
      if (parallel) {
        // 并行调用
        const promises = apiCalls.map(call =>
          this.callApi(call.key, call.params || {}, call.options || {})
            .then(response => ({ key: call.key, response, error: null }))
            .catch(error => ({ key: call.key, response: null, error }))
        );

        return await Promise.all(promises);
      } else {
        // 串行调用
        const results = [];
        for (const call of apiCalls) {
          try {
            const response = await this.callApi(call.key, call.params || {}, call.options || {});
            results.push({ key: call.key, response, error: null });
          } catch (error) {
            results.push({ key: call.key, response: null, error });
          }
        }
        return results;
      }
    } catch (error) {
      console.error('批量调用API失败', error);
      throw error;
    }
  }

  /**
   * 创建API调用函数
   * @param {string} apiKey - API键名
   * @returns {Function} - 返回调用特定API的函数
   */
  createApiCaller(apiKey) {
    return (params = {}, options = {}) => this.callApi(apiKey, params, options);
  }

  /**
   * 获取API配置
   * @param {string} apiKey - API键名
   * @returns {object|null} - 返回API配置或null
   */
  getApiConfig(apiKey) {
    try {
      if (apiManager.registry.get(apiKey) === null) {
        return null;
      }
      return apiManager.registry.get(apiKey);
    } catch (error) {
      console.error(`获取API配置失败: ${apiKey}`, error);
      return null;
    }
  }

  /**
   * 获取所有API配置
   * @param {string} category - 可选的API分类过滤
   * @returns {object} - 返回API配置对象
   */
  getAllApiConfigs(category = null) {
    try {
      const allApis = apiManager.registry.getAll();

      if (!category) {
        return allApis;
      }

      // 按分类过滤
      const filteredApis = {};
      Object.entries(allApis).forEach(([key, config]) => {
        if (config.category === category) {
          filteredApis[key] = config;
        }
      });

      return filteredApis;
    } catch (error) {
      console.error('获取所有API配置失败', error);
      return {};
    }
  }
}

export default new ApiService();
