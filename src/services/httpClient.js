import axios from 'axios';
import { baseUrlManager } from './baseUrlManager';
import apiManager from './apiManager';

/**
 * 增强的HTTP客户端
 * 提供统一的API调用接口，增强错误处理、重试机制和批量请求功能
 */
class IoTApiClient {
  constructor(options = {}) {
    this.baseUrl = options.baseUrl || baseUrlManager.getBaseUrl();
    this.authToken = options.authToken || localStorage.getItem('token');
    
    // 创建axios实例
    this.axios = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Content-Type': 'application/json',
        ...(this.authToken ? { 'Authorization': `Bearer ${this.authToken}` } : {})
      },
      timeout: options.timeout || 30000, // 默认30秒超时
    });
    
    // 添加请求拦截器
    this.axios.interceptors.request.use(
      config => {
        // 添加请求ID用于跟踪
        config.headers['X-Request-ID'] = crypto.randomUUID();
        
        // 确保使用最新的令牌
        const currentToken = localStorage.getItem('token');
        if (currentToken && currentToken !== this.authToken) {
          this.authToken = currentToken;
          config.headers['Authorization'] = `Bearer ${this.authToken}`;
        }
        
        return config;
      },
      error => Promise.reject(error)
    );
    
    // 添加响应拦截器
    this.axios.interceptors.response.use(
      response => response,
      async error => {
        // 处理401错误，刷新令牌
        if (error.response && error.response.status === 401 && this.refreshTokenCallback) {
          try {
            // 尝试刷新令牌
            const newToken = await this.refreshTokenCallback();
            
            // 更新令牌
            this.authToken = newToken;
            
            // 重试请求
            const config = error.config;
            config.headers['Authorization'] = `Bearer ${newToken}`;
            return this.axios.request(config);
          } catch (refreshError) {
            // 刷新令牌失败，可能需要重新登录
            if (this.unauthorizedCallback) {
              this.unauthorizedCallback(refreshError);
            }
            return Promise.reject(error);
          }
        }
        
        // 处理网络错误，自动重试
        if (error.message === 'Network Error' && error.config && !error.config.__isRetry) {
          // 标记为重试请求
          const config = error.config;
          config.__isRetry = true;
          
          // 延迟1秒后重试
          return new Promise(resolve => {
            setTimeout(() => {
              resolve(this.axios.request(config));
            }, 1000);
          });
        }
        
        return Promise.reject(error);
      }
    );
    
    // 回调函数
    this.refreshTokenCallback = options.refreshTokenCallback;
    this.unauthorizedCallback = options.unauthorizedCallback;
  }
  
  /**
   * 设置刷新令牌回调
   * @param {Function} callback 刷新令牌的回调函数
   */
  setRefreshTokenCallback(callback) {
    this.refreshTokenCallback = callback;
  }
  
  /**
   * 设置未授权回调
   * @param {Function} callback 未授权的回调函数
   */
  setUnauthorizedCallback(callback) {
    this.unauthorizedCallback = callback;
  }
  
  /**
   * 更新认证令牌
   * @param {string} token 新的认证令牌
   */
  updateAuthToken(token) {
    this.authToken = token;
    this.axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }
  
  /**
   * 发送GET请求
   * @param {string} url 请求URL
   * @param {Object} params 查询参数
   * @param {Object} options 请求选项
   * @returns {Promise} 请求Promise
   */
  async get(url, params = {}, options = {}) {
    try {
      const response = await this.axios.get(url, {
        params,
        ...options,
      });
      return response.data;
    } catch (error) {
      this._handleError(error);
    }
  }
  
  /**
   * 发送POST请求
   * @param {string} url 请求URL
   * @param {Object} data 请求数据
   * @param {Object} options 请求选项
   * @returns {Promise} 请求Promise
   */
  async post(url, data = {}, options = {}) {
    try {
      const response = await this.axios.post(url, data, options);
      return response.data;
    } catch (error) {
      this._handleError(error);
    }
  }
  
  /**
   * 发送PUT请求
   * @param {string} url 请求URL
   * @param {Object} data 请求数据
   * @param {Object} options 请求选项
   * @returns {Promise} 请求Promise
   */
  async put(url, data = {}, options = {}) {
    try {
      const response = await this.axios.put(url, data, options);
      return response.data;
    } catch (error) {
      this._handleError(error);
    }
  }
  
  /**
   * 发送DELETE请求
   * @param {string} url 请求URL
   * @param {Object} options 请求选项
   * @returns {Promise} 请求Promise
   */
  async delete(url, options = {}) {
    try {
      const response = await this.axios.delete(url, options);
      return response.data;
    } catch (error) {
      this._handleError(error);
    }
  }
  
  /**
   * 发送PATCH请求
   * @param {string} url 请求URL
   * @param {Object} data 请求数据
   * @param {Object} options 请求选项
   * @returns {Promise} 请求Promise
   */
  async patch(url, data = {}, options = {}) {
    try {
      const response = await this.axios.patch(url, data, options);
      return response.data;
    } catch (error) {
      this._handleError(error);
    }
  }
  
  /**
   * 处理错误
   * @param {Error} error 错误对象
   * @throws {Error} 处理后的错误
   * @private
   */
  _handleError(error) {
    // 格式化错误信息
    let errorMessage = '请求失败';
    let errorCode = 'UNKNOWN_ERROR';
    let errorData = null;
    
    if (error.response) {
      // 服务器响应错误
      errorMessage = error.response.data?.message || `服务器错误: ${error.response.status}`;
      errorCode = error.response.data?.code || `HTTP_${error.response.status}`;
      errorData = error.response.data;
    } else if (error.request) {
      // 请求发送但没有收到响应
      errorMessage = '服务器无响应';
      errorCode = 'NO_RESPONSE';
    } else {
      // 请求设置错误
      errorMessage = error.message;
      errorCode = 'REQUEST_ERROR';
    }
    
    // 创建增强的错误对象
    const enhancedError = new Error(errorMessage);
    enhancedError.code = errorCode;
    enhancedError.data = errorData;
    enhancedError.originalError = error;
    
    // 记录错误
    console.error('API请求失败:', {
      message: errorMessage,
      code: errorCode,
      data: errorData,
      originalError: error,
    });
    
    throw enhancedError;
  }
  
  // 设备API
  
  /**
   * 获取设备列表
   * @param {Object} params 查询参数
   * @returns {Promise} 设备列表
   */
  getDevices(params = {}) {
    return this.get('/api/devices', params);
  }
  
  /**
   * 获取设备详情
   * @param {string} deviceId 设备ID
   * @returns {Promise} 设备详情
   */
  getDeviceById(deviceId) {
    return this.get(`/api/devices/${deviceId}`);
  }
  
  /**
   * 创建设备
   * @param {Object} deviceData 设备数据
   * @returns {Promise} 创建的设备
   */
  createDevice(deviceData) {
    return this.post('/api/devices', deviceData);
  }
  
  /**
   * 更新设备
   * @param {string} deviceId 设备ID
   * @param {Object} deviceData 设备数据
   * @returns {Promise} 更新的设备
   */
  updateDevice(deviceId, deviceData) {
    return this.put(`/api/devices/${deviceId}`, deviceData);
  }
  
  /**
   * 删除设备
   * @param {string} deviceId 设备ID
   * @returns {Promise} 删除结果
   */
  deleteDevice(deviceId) {
    return this.delete(`/api/devices/${deviceId}`);
  }
  
  /**
   * 获取设备遥测数据
   * @param {string} deviceId 设备ID
   * @param {Object} params 查询参数
   * @returns {Promise} 遥测数据
   */
  getDeviceTelemetry(deviceId, params = {}) {
    return this.get(`/api/devices/${deviceId}/telemetry`, params);
  }
  
  /**
   * 获取设备属性
   * @param {string} deviceId 设备ID
   * @param {Object} params 查询参数
   * @returns {Promise} 设备属性
   */
  getDeviceAttributes(deviceId, params = {}) {
    return this.get(`/api/devices/${deviceId}/attributes`, params);
  }
  
  /**
   * 更新设备属性
   * @param {string} deviceId 设备ID
   * @param {Object} attributes 属性数据
   * @returns {Promise} 更新结果
   */
  updateDeviceAttributes(deviceId, attributes) {
    return this.post(`/api/devices/${deviceId}/attributes`, attributes);
  }
  
  // 告警API
  
  /**
   * 获取告警列表
   * @param {Object} params 查询参数
   * @returns {Promise} 告警列表
   */
  getAlarms(params = {}) {
    return this.get('/api/alarms', params);
  }
  
  /**
   * 获取告警详情
   * @param {string} alarmId 告警ID
   * @returns {Promise} 告警详情
   */
  getAlarmById(alarmId) {
    return this.get(`/api/alarms/${alarmId}`);
  }
  
  /**
   * 确认告警
   * @param {string} alarmId 告警ID
   * @returns {Promise} 确认结果
   */
  acknowledgeAlarm(alarmId) {
    return this.post(`/api/alarms/${alarmId}/acknowledge`);
  }
  
  /**
   * 清除告警
   * @param {string} alarmId 告警ID
   * @returns {Promise} 清除结果
   */
  clearAlarm(alarmId) {
    return this.post(`/api/alarms/${alarmId}/clear`);
  }
  
  // 用户API
  
  /**
   * 用户登录
   * @param {Object} credentials 登录凭证
   * @returns {Promise} 登录结果
   */
  login(credentials) {
    return this.post('/api/auth/login', credentials);
  }
  
  /**
   * 用户注册
   * @param {Object} userData 用户数据
   * @returns {Promise} 注册结果
   */
  register(userData) {
    return this.post('/api/auth/register', userData);
  }
  
  /**
   * 刷新令牌
   * @returns {Promise} 刷新结果
   */
  refreshToken() {
    return this.post('/api/auth/refresh');
  }
  
  /**
   * 获取当前用户信息
   * @returns {Promise} 用户信息
   */
  getCurrentUser() {
    return this.get('/api/users/me');
  }
  
  /**
   * 更新用户信息
   * @param {Object} userData 用户数据
   * @returns {Promise} 更新结果
   */
  updateUserProfile(userData) {
    return this.put('/api/users/me', userData);
  }
  
  /**
   * 更改密码
   * @param {Object} passwordData 密码数据
   * @returns {Promise} 更改结果
   */
  changePassword(passwordData) {
    return this.post('/api/users/me/change-password', passwordData);
  }
  
  // 站点API
  
  /**
   * 获取站点列表
   * @param {Object} params 查询参数
   * @returns {Promise} 站点列表
   */
  getSites(params = {}) {
    return this.get('/api/sites', params);
  }
  
  /**
   * 获取站点详情
   * @param {string} siteId 站点ID
   * @returns {Promise} 站点详情
   */
  getSiteById(siteId) {
    return this.get(`/api/sites/${siteId}`);
  }
  
  /**
   * 创建站点
   * @param {Object} siteData 站点数据
   * @returns {Promise} 创建的站点
   */
  createSite(siteData) {
    return this.post('/api/sites', siteData);
  }
  
  /**
   * 更新站点
   * @param {string} siteId 站点ID
   * @param {Object} siteData 站点数据
   * @returns {Promise} 更新的站点
   */
  updateSite(siteId, siteData) {
    return this.put(`/api/sites/${siteId}`, siteData);
  }
  
  /**
   * 删除站点
   * @param {string} siteId 站点ID
   * @returns {Promise} 删除结果
   */
  deleteSite(siteId) {
    return this.delete(`/api/sites/${siteId}`);
  }
  
  // 仪表盘API
  
  /**
   * 获取仪表盘列表
   * @param {Object} params 查询参数
   * @returns {Promise} 仪表盘列表
   */
  getDashboards(params = {}) {
    return this.get('/api/dashboards', params);
  }
  
  /**
   * 获取仪表盘详情
   * @param {string} dashboardId 仪表盘ID
   * @returns {Promise} 仪表盘详情
   */
  getDashboardById(dashboardId) {
    return this.get(`/api/dashboards/${dashboardId}`);
  }
  
  /**
   * 创建仪表盘
   * @param {Object} dashboardData 仪表盘数据
   * @returns {Promise} 创建的仪表盘
   */
  createDashboard(dashboardData) {
    return this.post('/api/dashboards', dashboardData);
  }
  
  /**
   * 更新仪表盘
   * @param {string} dashboardId 仪表盘ID
   * @param {Object} dashboardData 仪表盘数据
   * @returns {Promise} 更新的仪表盘
   */
  updateDashboard(dashboardId, dashboardData) {
    return this.put(`/api/dashboards/${dashboardId}`, dashboardData);
  }
  
  /**
   * 删除仪表盘
   * @param {string} dashboardId 仪表盘ID
   * @returns {Promise} 删除结果
   */
  deleteDashboard(dashboardId) {
    return this.delete(`/api/dashboards/${dashboardId}`);
  }

  /**
   * 调用单个API
   * @param {string} apiKey - API键名
   * @param {object} params - 请求参数
   * @param {object} options - 额外选项（如超时、重试等）
   * @returns {Promise} - 返回API响应的Promise
   */
  async callApi(apiKey, params = {}, options = {}) {
    try {
      console.log(`[IoTApiClient] 开始调用API: ${apiKey}`, {
        params: apiKey === 'login' ? { ...params, password: '******' } : params,
        options
      });

      // 检查API是否存在
      if (apiManager.registry.get(apiKey) === null) {
        console.error(`[IoTApiClient] API不存在: ${apiKey}`);
        throw new Error(`API不存在: ${apiKey}`);
      }

      // 获取API配置
      const apiConfig = apiManager.registry.get(apiKey);
      console.log(`[IoTApiClient] API配置: ${apiKey}`, {
        url: apiConfig.url,
        method: apiConfig.method,
        enabled: apiConfig.enabled,
        timeout: apiConfig.timeout
      });

      // 检查API是否启用
      if (apiConfig.enabled === false) {
        console.error(`[IoTApiClient] API已禁用: ${apiKey}`);
        throw new Error(`API已禁用: ${apiKey}`);
      }

      // 合并选项
      const mergedOptions = {
        ...apiConfig,
        ...options
      };

      // 调用API
      console.log(`[IoTApiClient] 执行API调用: ${apiKey}`);
      const response = await apiManager.call(apiKey, params, mergedOptions);
      console.log(`[IoTApiClient] API调用成功: ${apiKey}`, {
        responseType: typeof response,
        responseKeys: response ? Object.keys(response) : null
      });

      return response;
    } catch (error) {
      console.error(`[IoTApiClient] 调用API失败: ${apiKey}`, error);
      console.error(`[IoTApiClient] 错误详情:`, {
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
}

// 创建单例实例
const httpClient = new IoTApiClient();

export default httpClient;
