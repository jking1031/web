/**
 * API 注册中心
 * 用于集中管理和注册系统中的所有 API
 */

import { EventEmitter } from '../utils/EventEmitter';
import { getToken } from '../api/auth';
import axios from 'axios';
import { message } from 'antd';
import { saveApiConfigsToDb, getApiConfigsFromDb } from '../api/apiSyncApi';

// API 事件类型
export const API_EVENTS = {
  REGISTERED: 'api:registered',
  UPDATED: 'api:updated',
  REMOVED: 'api:removed',
  CALLED: 'api:called',
  RESPONSE: 'api:response',
  ERROR: 'api:error'
};

// API 分类
export const API_CATEGORIES = {
  SYSTEM: 'system',
  DATA: 'data',
  DEVICE: 'device',
  CUSTOM: 'custom',
  ADMIN: 'admin',
  AUTH: 'auth',
  REPORT: 'report'
};

// API 方法
export const API_METHODS = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  DELETE: 'DELETE',
  PATCH: 'PATCH'
};

// API 状态
export const API_STATUS = {
  ENABLED: 'enabled',
  DISABLED: 'disabled',
  DEPRECATED: 'deprecated'
};

class ApiRegistry {
  constructor() {
    this.apis = {};
    this.eventEmitter = EventEmitter; // 使用已经创建好的 EventEmitter 实例
    this.axiosInstances = {};
    this.isLoading = false;
    this.isInitialized = false;

    // 初始化默认 axios 实例
    this.createAxiosInstance('default', {
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    // 异步加载已保存的 API 配置
    this.initialize();
  }

  /**
   * 初始化API注册中心
   * @returns {Promise<boolean>} 初始化结果
   */
  async initialize() {
    if (this.isLoading || this.isInitialized) {
      return this.isInitialized;
    }

    this.isLoading = true;

    try {
      // 加载已保存的 API 配置
      const result = await this.loadApis();
      this.isInitialized = true;
      this.isLoading = false;
      return result;
    } catch (error) {
      console.error('初始化API注册中心失败:', error);
      this.isInitialized = false;
      this.isLoading = false;
      return false;
    }
  }

  /**
   * 创建 axios 实例
   * @param {string} name 实例名称
   * @param {Object} config axios 配置
   */
  createAxiosInstance(name, config) {
    const instance = axios.create(config);

    // 请求拦截器
    instance.interceptors.request.use(
      (config) => {
        // 添加认证令牌
        const token = getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // 触发 API 调用事件
        this.eventEmitter.emit(API_EVENTS.CALLED, {
          url: config.url,
          method: config.method,
          params: config.params,
          data: config.data,
          timestamp: Date.now()
        });

        return config;
      },
      (error) => {
        // 触发 API 错误事件
        this.eventEmitter.emit(API_EVENTS.ERROR, {
          error,
          timestamp: Date.now()
        });

        return Promise.reject(error);
      }
    );

    // 响应拦截器
    instance.interceptors.response.use(
      (response) => {
        // 触发 API 响应事件
        this.eventEmitter.emit(API_EVENTS.RESPONSE, {
          url: response.config.url,
          method: response.config.method,
          status: response.status,
          data: response.data,
          timestamp: Date.now()
        });

        return response;
      },
      (error) => {
        // 处理错误响应
        if (error.response) {
          // 服务器返回错误状态码
          const { status, data } = error.response;

          // 触发 API 错误事件
          this.eventEmitter.emit(API_EVENTS.ERROR, {
            url: error.config.url,
            method: error.config.method,
            status,
            data,
            timestamp: Date.now()
          });

          // 处理特定错误
          if (status === 401) {
            message.error('登录已过期，请重新登录');
            // 可以触发登出事件或重定向到登录页面
          }
        } else if (error.request) {
          // 请求已发送但没有收到响应
          message.error('服务器无响应，请检查网络连接');
        } else {
          // 请求配置出错
          message.error(`请求配置错误: ${error.message}`);
        }

        return Promise.reject(error);
      }
    );

    this.axiosInstances[name] = instance;
    return instance;
  }

  /**
   * 获取 axios 实例
   * @param {string} name 实例名称
   * @returns {Object} axios 实例
   */
  getAxiosInstance(name = 'default') {
    return this.axiosInstances[name] || this.axiosInstances.default;
  }

  /**
   * 加载已保存的 API 配置
   * @returns {Promise} 加载结果的Promise
   */
  async loadApis() {
    try {
      console.log('从后端加载API配置...');

      // 从后端获取API配置
      const response = await getApiConfigsFromDb();

      if (response && response.success && response.data) {
        // 验证解析后的数据是否为对象
        if (response.data && typeof response.data === 'object' && !Array.isArray(response.data)) {
          this.apis = response.data;
          console.log(`已从后端加载 ${Object.keys(this.apis).length} 个 API 配置`);
          return true;
        } else {
          console.warn('从后端获取的API配置格式无效，尝试从本地存储加载');
          return this.loadApisFromLocalStorage();
        }
      } else {
        console.warn('从后端获取API配置失败，尝试从本地存储加载');
        return this.loadApisFromLocalStorage();
      }
    } catch (error) {
      console.error('从后端加载API配置失败:', error);
      console.warn('尝试从本地存储加载API配置');
      return this.loadApisFromLocalStorage();
    }
  }

  /**
   * 从本地存储加载API配置（作为备份方案）
   * @returns {boolean} 操作是否成功
   */
  loadApisFromLocalStorage() {
    try {
      const savedApis = localStorage.getItem('apiRegistry');
      if (savedApis) {
        try {
          const parsedApis = JSON.parse(savedApis);

          // 验证解析后的数据是否为对象
          if (parsedApis && typeof parsedApis === 'object' && !Array.isArray(parsedApis)) {
            this.apis = parsedApis;
            console.log(`已从本地存储加载 ${Object.keys(this.apis).length} 个 API 配置`);
            return true;
          } else {
            console.warn('本地存储的API配置格式无效，初始化默认配置');
            this.initDefaultApis();
            return false;
          }
        } catch (parseError) {
          console.error('解析本地存储的API配置失败:', parseError);
          this.initDefaultApis();
          return false;
        }
      } else {
        // 初始化默认 API 配置
        console.log('本地存储中没有API配置，初始化默认配置');
        this.initDefaultApis();
        return false;
      }
    } catch (error) {
      console.error('从本地存储加载API配置失败:', error);
      // 初始化默认 API 配置
      this.initDefaultApis();
      return false;
    }
  }

  /**
   * 保存 API 配置到后端数据库
   * @returns {Promise} 保存结果的Promise
   */
  async saveApis() {
    try {
      // 验证数据是否为有效对象
      if (this.apis && typeof this.apis === 'object' && !Array.isArray(this.apis)) {
        // 保存到后端
        console.log(`正在保存 ${Object.keys(this.apis).length} 个 API 配置到后端...`);
        const response = await saveApiConfigsToDb(this.apis);

        if (response && response.success) {
          console.log(`已成功保存 ${Object.keys(this.apis).length} 个 API 配置到后端`);

          // 同时保存到本地存储作为备份
          this.saveApisToLocalStorage();
          return true;
        } else {
          console.warn('保存API配置到后端失败，尝试保存到本地存储');
          this.saveApisToLocalStorage();
          return false;
        }
      } else {
        console.error('无法保存API配置：数据格式无效', this.apis);
        return false;
      }
    } catch (error) {
      console.error('保存API配置到后端失败:', error);
      console.warn('尝试保存到本地存储');
      this.saveApisToLocalStorage();
      return false;
    }
  }

  /**
   * 保存 API 配置到本地存储（作为备份方案）
   * @returns {boolean} 操作是否成功
   */
  saveApisToLocalStorage() {
    try {
      // 验证数据是否为有效对象
      if (this.apis && typeof this.apis === 'object' && !Array.isArray(this.apis)) {
        const serialized = JSON.stringify(this.apis);
        localStorage.setItem('apiRegistry', serialized);
        console.log(`已保存 ${Object.keys(this.apis).length} 个 API 配置到本地存储`);
        return true;
      } else {
        console.error('无法保存API配置到本地存储：数据格式无效', this.apis);
        return false;
      }
    } catch (error) {
      console.error('保存API配置到本地存储失败:', error);
      return false;
    }
  }

  /**
   * 导出 API 配置
   * @returns {Object} API 配置对象
   */
  exportApis() {
    try {
      // 验证数据是否为有效对象
      if (this.apis && typeof this.apis === 'object' && !Array.isArray(this.apis)) {
        return { ...this.apis };
      } else {
        console.error('无法导出API配置：数据格式无效', this.apis);
        return {};
      }
    } catch (error) {
      console.error('导出 API 配置失败:', error);
      return {};
    }
  }

  /**
   * 导入 API 配置
   * @param {Object} apis API 配置对象
   * @param {boolean} replace 是否替换现有配置，默认为 false
   * @returns {Promise<boolean>} 操作是否成功
   */
  async importApis(apis, replace = false) {
    try {
      // 验证数据是否为有效对象
      if (!apis || typeof apis !== 'object' || Array.isArray(apis)) {
        console.error('无法导入API配置：数据格式无效', apis);
        return false;
      }

      // 替换或合并配置
      if (replace) {
        this.apis = { ...apis };
      } else {
        this.apis = { ...this.apis, ...apis };
      }

      // 保存到后端和本地存储
      const saveResult = await this.saveApis();

      console.log(`已导入 ${Object.keys(apis).length} 个 API 配置`);
      return saveResult;
    } catch (error) {
      console.error('导入 API 配置失败:', error);
      return false;
    }
  }

  /**
   * 初始化默认 API 配置
   * @returns {Promise} 初始化结果的Promise
   */
  async initDefaultApis() {
    // 这里可以添加系统默认的 API 配置
    this.apis = {};

    // 保存空的API配置到后端和本地存储
    try {
      await this.saveApis();
      return true;
    } catch (error) {
      console.error('初始化默认API配置失败:', error);
      return false;
    }
  }

  /**
   * 注册 API
   * @param {string} key API 键名
   * @param {Object} config API 配置
   * @returns {Promise<boolean>} 操作是否成功
   */
  async register(key, config) {
    if (!key || !config || !config.url) {
      console.error('API 键名和配置不能为空');
      return false;
    }

    // 添加默认值
    const apiConfig = {
      name: config.name || key,
      url: config.url,
      method: config.method || API_METHODS.GET,
      category: config.category || API_CATEGORIES.CUSTOM,
      status: config.status || API_STATUS.ENABLED,
      timeout: config.timeout || 15000,
      retries: config.retries || 0,
      cacheTime: config.cacheTime || 0,
      description: config.description || '',
      headers: config.headers || {},
      params: config.params || {},
      data: config.data || {},
      transform: config.transform || null,
      validate: config.validate || null,
      mock: config.mock || null,
      axiosInstance: config.axiosInstance || 'default',
      ...config
    };

    // 注册 API
    this.apis[key] = apiConfig;

    // 自动保存到后端和本地存储
    try {
      await this.saveApis();

      // 触发 API 注册事件
      this.eventEmitter.emit(API_EVENTS.REGISTERED, {
        key,
        config: apiConfig,
        timestamp: Date.now()
      });

      return true;
    } catch (error) {
      console.error(`注册API '${key}' 失败:`, error);
      return false;
    }
  }

  /**
   * 更新 API 配置
   * @param {string} key API 键名
   * @param {Object} config API 配置
   * @returns {Promise<boolean>} 操作是否成功
   */
  async update(key, config) {
    if (!this.apis[key]) {
      console.error(`API 不存在: ${key}`);
      return false;
    }

    // 更新 API 配置
    this.apis[key] = {
      ...this.apis[key],
      ...config
    };

    // 自动保存到后端和本地存储
    try {
      await this.saveApis();

      // 触发 API 更新事件
      this.eventEmitter.emit(API_EVENTS.UPDATED, {
        key,
        config: this.apis[key],
        timestamp: Date.now()
      });

      return true;
    } catch (error) {
      console.error(`更新API '${key}' 失败:`, error);
      return false;
    }
  }

  /**
   * 删除 API
   * @param {string} key API 键名
   * @returns {Promise<boolean>} 操作是否成功
   */
  async remove(key) {
    if (!this.apis[key]) {
      console.error(`API 不存在: ${key}`);
      return false;
    }

    // 保存被删除的 API 配置
    const deletedApi = this.apis[key];

    // 删除 API
    delete this.apis[key];

    // 自动保存到后端和本地存储
    try {
      await this.saveApis();

      // 触发 API 删除事件
      this.eventEmitter.emit(API_EVENTS.REMOVED, {
        key,
        config: deletedApi,
        timestamp: Date.now()
      });

      return true;
    } catch (error) {
      console.error(`删除API '${key}' 失败:`, error);
      // 恢复被删除的API
      this.apis[key] = deletedApi;
      return false;
    }
  }

  /**
   * 获取所有 API 配置
   * @returns {Array} 所有 API 配置的数组
   */
  getAll() {
    // 将对象格式转换为数组格式
    return Object.keys(this.apis).map(key => ({
      key,
      ...this.apis[key]
    }));
  }

  /**
   * 获取页面使用的API
   * @param {string} pageKey 页面键名
   * @returns {Array} 页面使用的API键名数组
   */
  getPageApis(pageKey) {
    if (!pageKey) {
      return [];
    }

    // 从本地存储中获取页面API映射
    try {
      const pageApiMappings = localStorage.getItem('pageApiMappings');
      if (pageApiMappings) {
        const mappings = JSON.parse(pageApiMappings);
        return mappings[pageKey] || [];
      }
    } catch (error) {
      console.error('获取页面API映射失败:', error);
    }

    return [];
  }

  /**
   * 设置页面使用的API
   * @param {string} pageKey 页面键名
   * @param {Array} apiKeys API键名数组
   * @returns {boolean} 操作是否成功
   */
  setPageApis(pageKey, apiKeys) {
    if (!pageKey) {
      return false;
    }

    try {
      // 从本地存储中获取页面API映射
      let mappings = {};
      const pageApiMappings = localStorage.getItem('pageApiMappings');
      if (pageApiMappings) {
        mappings = JSON.parse(pageApiMappings);
      }

      // 更新映射
      mappings[pageKey] = apiKeys;

      // 保存到本地存储
      localStorage.setItem('pageApiMappings', JSON.stringify(mappings));

      return true;
    } catch (error) {
      console.error('设置页面API映射失败:', error);
      return false;
    }
  }

  /**
   * 获取指定 API 配置
   * @param {string} key API 键名
   * @returns {Object|null} API 配置
   */
  get(key) {
    return this.apis[key] || null;
  }

  /**
   * 获取指定分类的 API 配置
   * @param {string} category API 分类
   * @returns {Object} 指定分类的 API 配置
   */
  getByCategory(category) {
    const result = {};
    Object.keys(this.apis).forEach(key => {
      if (this.apis[key].category === category) {
        result[key] = this.apis[key];
      }
    });
    return result;
  }

  /**
   * 检查API注册中心是否已初始化
   * @returns {boolean} 是否已初始化
   */
  isReady() {
    return this.isInitialized;
  }

  /**
   * 等待API注册中心初始化完成
   * @param {number} timeout 超时时间（毫秒），默认为10000
   * @returns {Promise<boolean>} 初始化是否成功
   */
  async waitForReady(timeout = 10000) {
    if (this.isInitialized) {
      return true;
    }

    return new Promise((resolve) => {
      // 如果已经初始化，直接返回
      if (this.isInitialized) {
        resolve(true);
        return;
      }

      // 设置超时
      const timeoutId = setTimeout(() => {
        console.warn('等待API注册中心初始化超时');
        resolve(false);
      }, timeout);

      // 定期检查初始化状态
      const checkInterval = setInterval(() => {
        if (this.isInitialized) {
          clearTimeout(timeoutId);
          clearInterval(checkInterval);
          resolve(true);
        }
      }, 100);
    });
  }
}

// 创建单例
const apiRegistry = new ApiRegistry();

export default apiRegistry;
