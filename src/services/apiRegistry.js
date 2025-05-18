/**
 * API 注册中心
 * 用于集中管理和注册系统中的所有 API
 */

import { EventEmitter } from '../utils/EventEmitter';
import { getToken } from '../api/auth';
import axios from 'axios';
import { message } from 'antd';

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

    // 初始化默认 axios 实例
    this.createAxiosInstance('default', {
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    // 加载已保存的 API 配置
    this.loadApis();
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
   */
  loadApis() {
    try {
      const savedApis = localStorage.getItem('apiRegistry');
      if (savedApis) {
        try {
          const parsedApis = JSON.parse(savedApis);

          // 验证解析后的数据是否为对象
          if (parsedApis && typeof parsedApis === 'object' && !Array.isArray(parsedApis)) {
            this.apis = parsedApis;
            console.log(`已加载 ${Object.keys(this.apis).length} 个 API 配置`);
          } else {
            console.warn('API配置格式无效，初始化默认配置');
            this.initDefaultApis();
          }
        } catch (parseError) {
          console.error('解析API配置失败:', parseError);
          this.initDefaultApis();
        }
      } else {
        // 初始化默认 API 配置
        this.initDefaultApis();
      }
    } catch (error) {
      console.error('加载 API 配置失败:', error);
      // 初始化默认 API 配置
      this.initDefaultApis();
    }
  }

  /**
   * 保存 API 配置到本地存储
   */
  saveApis() {
    try {
      // 验证数据是否为有效对象
      if (this.apis && typeof this.apis === 'object' && !Array.isArray(this.apis)) {
        const serialized = JSON.stringify(this.apis);
        localStorage.setItem('apiRegistry', serialized);
        console.log(`已保存 ${Object.keys(this.apis).length} 个 API 配置`);
      } else {
        console.error('无法保存API配置：数据格式无效', this.apis);
      }
    } catch (error) {
      console.error('保存 API 配置失败:', error);
    }
  }

  /**
   * 初始化默认 API 配置
   */
  initDefaultApis() {
    // 这里可以添加系统默认的 API 配置
    this.apis = {};
    this.saveApis();
  }

  /**
   * 注册 API
   * @param {string} key API 键名
   * @param {Object} config API 配置
   * @returns {boolean} 操作是否成功
   */
  register(key, config) {
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

    // 保存到本地存储
    this.saveApis();

    // 触发 API 注册事件
    this.eventEmitter.emit(API_EVENTS.REGISTERED, {
      key,
      config: apiConfig,
      timestamp: Date.now()
    });

    return true;
  }

  /**
   * 更新 API 配置
   * @param {string} key API 键名
   * @param {Object} config API 配置
   * @returns {boolean} 操作是否成功
   */
  update(key, config) {
    if (!this.apis[key]) {
      console.error(`API 不存在: ${key}`);
      return false;
    }

    // 更新 API 配置
    this.apis[key] = {
      ...this.apis[key],
      ...config
    };

    // 保存到本地存储
    this.saveApis();

    // 触发 API 更新事件
    this.eventEmitter.emit(API_EVENTS.UPDATED, {
      key,
      config: this.apis[key],
      timestamp: Date.now()
    });

    return true;
  }

  /**
   * 删除 API
   * @param {string} key API 键名
   * @returns {boolean} 操作是否成功
   */
  remove(key) {
    if (!this.apis[key]) {
      console.error(`API 不存在: ${key}`);
      return false;
    }

    // 保存被删除的 API 配置
    const deletedApi = this.apis[key];

    // 删除 API
    delete this.apis[key];

    // 保存到本地存储
    this.saveApis();

    // 触发 API 删除事件
    this.eventEmitter.emit(API_EVENTS.REMOVED, {
      key,
      config: deletedApi,
      timestamp: Date.now()
    });

    return true;
  }

  /**
   * 获取所有 API 配置
   * @returns {Object} 所有 API 配置
   */
  getAll() {
    return this.apis;
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
}

// 创建单例
const apiRegistry = new ApiRegistry();

export default apiRegistry;
