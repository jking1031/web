/**
 * API 管理服务
 * 统一入口，整合所有 API 相关服务
 */

import apiRegistry, { API_EVENTS, API_CATEGORIES, API_METHODS, API_STATUS } from './apiRegistry';
import apiProxy from './apiProxy';
import apiFieldManager, { FIELD_TYPES, FORMAT_TYPES } from './apiFieldManager';
import apiVariableManager, { VARIABLE_SCOPES, VARIABLE_TYPES } from './apiVariableManager';
import apiDocGenerator, { DOC_FORMATS } from './apiDocGenerator';

/**
 * API 管理服务
 * 提供统一的 API 管理接口
 */
class ApiManager {
  constructor() {
    this.registry = apiRegistry;
    this.proxy = apiProxy;
    this.fieldManager = apiFieldManager;
    this.variableManager = apiVariableManager;
    this.docGenerator = apiDocGenerator;

    // 常量
    this.API_EVENTS = API_EVENTS;
    this.API_CATEGORIES = API_CATEGORIES;
    this.API_METHODS = API_METHODS;
    this.API_STATUS = API_STATUS;
    this.FIELD_TYPES = FIELD_TYPES;
    this.FORMAT_TYPES = FORMAT_TYPES;
    this.VARIABLE_SCOPES = VARIABLE_SCOPES;
    this.VARIABLE_TYPES = VARIABLE_TYPES;
    this.DOC_FORMATS = DOC_FORMATS;

    // 初始化
    this.init();
  }

  /**
   * 初始化
   */
  init() {
    // 注册默认 API
    this.registerDefaultApis();

    // 注册事件监听
    this.registry.eventEmitter.addEventListener(API_EVENTS.REGISTERED, this.handleApiRegistered.bind(this));
    this.registry.eventEmitter.addEventListener(API_EVENTS.UPDATED, this.handleApiUpdated.bind(this));
    this.registry.eventEmitter.addEventListener(API_EVENTS.REMOVED, this.handleApiRemoved.bind(this));
  }

  /**
   * 注册默认 API
   */
  registerDefaultApis() {
    // 检查是否已经注册了默认 API
    if (Object.keys(this.registry.getAll()).length > 0) {
      // 确保趋势数据API已注册
      this.registerTrendApis();
      return;
    }

    // 注册认证相关 API
    this.registry.register('login', {
      name: '用户登录',
      url: 'https://zziot.jzz77.cn:9003/api/login',
      method: API_METHODS.POST,
      category: API_CATEGORIES.AUTH,
      status: API_STATUS.ENABLED,
      description: '用户登录认证',
      timeout: 10000,
      retries: 0,
      cacheTime: 0,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    this.registry.register('logout', {
      name: '用户登出',
      url: '/auth-api/api/logout',
      method: API_METHODS.POST,
      category: API_CATEGORIES.AUTH,
      status: API_STATUS.ENABLED,
      description: '用户登出',
      timeout: 5000,
      retries: 0,
      cacheTime: 0,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    this.registry.register('register', {
      name: '用户注册',
      url: 'https://zziot.jzz77.cn:9003/api/register',
      method: API_METHODS.POST,
      category: API_CATEGORIES.AUTH,
      status: API_STATUS.ENABLED,
      description: '用户注册',
      timeout: 10000,
      retries: 0,
      cacheTime: 0,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    this.registry.register('getUserInfo', {
      name: '获取用户信息',
      url: '/auth-api/api/user',
      method: API_METHODS.GET,
      category: API_CATEGORIES.AUTH,
      status: API_STATUS.ENABLED,
      description: '获取当前登录用户信息',
      timeout: 5000,
      retries: 1,
      cacheTime: 60000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // 注册管理员相关 API
    this.registry.register('checkAdminStatus', {
      name: '检查管理员状态',
      url: '/admin-api/api/check-admin-status',
      method: API_METHODS.POST,
      category: API_CATEGORIES.ADMIN,
      status: API_STATUS.ENABLED,
      description: '检查用户的管理员状态',
      timeout: 5000,
      retries: 1,
      cacheTime: 0,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // 注册用户管理相关 API
    this.registry.register('getUsers', {
      name: '获取用户列表',
      url: '/auth-api/api/users',
      method: API_METHODS.GET,
      category: API_CATEGORIES.ADMIN,
      status: API_STATUS.ENABLED,
      description: '获取所有用户列表',
      timeout: 10000,
      retries: 1,
      cacheTime: 60000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    this.registry.register('getUserRoles', {
      name: '获取用户角色',
      url: '/auth-api/api/users/roles',
      method: API_METHODS.GET,
      category: API_CATEGORIES.ADMIN,
      status: API_STATUS.ENABLED,
      description: '获取用户的角色信息',
      timeout: 5000,
      retries: 1,
      cacheTime: 60000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // 注册数据查询相关 API
    this.registry.register('queryData', {
      name: '数据查询',
      url: '/api/data/query',
      method: API_METHODS.POST,
      category: API_CATEGORIES.DATA,
      status: API_STATUS.ENABLED,
      description: '通用数据查询接口',
      timeout: 15000,
      retries: 1,
      cacheTime: 60000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    this.registry.register('getHistoryData', {
      name: '历史数据查询',
      url: '/api/data/history',
      method: API_METHODS.POST,
      category: API_CATEGORIES.DATA,
      status: API_STATUS.ENABLED,
      description: '查询历史数据',
      timeout: 15000,
      retries: 1,
      cacheTime: 60000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // 注册自定义查询 API
    this.registry.register('customQuery', {
      name: '自定义数据库查询',
      url: '/api/custom-query',
      method: API_METHODS.POST,
      category: API_CATEGORIES.DATA,
      status: API_STATUS.ENABLED,
      description: '执行自定义 SQL 查询',
      timeout: 20000,
      retries: 0,
      cacheTime: 0,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // 注册设备相关 API
    this.registry.register('getDeviceStatus', {
      name: '获取设备状态',
      url: '/api/device/status',
      method: API_METHODS.GET,
      category: API_CATEGORIES.DEVICE,
      status: API_STATUS.ENABLED,
      description: '获取设备状态信息',
      timeout: 10000,
      retries: 2,
      cacheTime: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    this.registry.register('controlDevice', {
      name: '控制设备',
      url: '/api/device/control',
      method: API_METHODS.POST,
      category: API_CATEGORIES.DEVICE,
      status: API_STATUS.ENABLED,
      description: '发送设备控制命令',
      timeout: 8000,
      retries: 2,
      cacheTime: 0,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // 注册消息通知相关 API
    this.registry.register('getNotifications', {
      name: '获取通知',
      url: '/api/notifications',
      method: API_METHODS.GET,
      category: API_CATEGORIES.SYSTEM,
      status: API_STATUS.ENABLED,
      description: '获取用户通知',
      timeout: 10000,
      retries: 1,
      cacheTime: 60000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    this.registry.register('getMessages', {
      name: '获取消息',
      url: '/api/messages',
      method: API_METHODS.GET,
      category: API_CATEGORIES.SYSTEM,
      status: API_STATUS.ENABLED,
      description: '获取用户消息',
      timeout: 10000,
      retries: 1,
      cacheTime: 60000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // 注册站点相关 API
    this.registry.register('getSites', {
      name: '获取站点列表',
      url: '/api/sites',
      method: API_METHODS.GET,
      category: API_CATEGORIES.SYSTEM,
      status: API_STATUS.ENABLED,
      description: '获取站点列表',
      timeout: 10000,
      retries: 1,
      cacheTime: 300000, // 5分钟缓存
      headers: {
        'Content-Type': 'application/json'
      }
    });

    this.registry.register('getSiteById', {
      name: '获取站点详情',
      url: '/api/sites/{id}',
      method: API_METHODS.GET,
      category: API_CATEGORIES.SYSTEM,
      status: API_STATUS.ENABLED,
      description: '根据ID获取站点详情',
      timeout: 8000,
      retries: 1,
      cacheTime: 60000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // 注册工单相关 API
    this.registry.register('getTickets', {
      name: '获取工单列表',
      url: '/api/tickets',
      method: API_METHODS.GET,
      category: API_CATEGORIES.SYSTEM,
      status: API_STATUS.ENABLED,
      description: '获取工单列表，支持分页和筛选',
      timeout: 10000,
      retries: 1,
      cacheTime: 60000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    this.registry.register('getTicketById', {
      name: '获取工单详情',
      url: '/api/tickets/{id}',
      method: API_METHODS.GET,
      category: API_CATEGORIES.SYSTEM,
      status: API_STATUS.ENABLED,
      description: '根据ID获取工单详情',
      timeout: 8000,
      retries: 1,
      cacheTime: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    this.registry.register('updateTicket', {
      name: '更新工单',
      url: '/api/tickets/{id}',
      method: API_METHODS.PUT,
      category: API_CATEGORIES.SYSTEM,
      status: API_STATUS.ENABLED,
      description: '更新工单信息',
      timeout: 10000,
      retries: 0,
      cacheTime: 0,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    this.registry.register('createTicket', {
      name: '创建工单',
      url: '/api/tickets',
      method: API_METHODS.POST,
      category: API_CATEGORIES.SYSTEM,
      status: API_STATUS.ENABLED,
      description: '创建新工单',
      timeout: 10000,
      retries: 0,
      cacheTime: 0,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    this.registry.register('updateTicketStatus', {
      name: '更新工单状态',
      url: '/api/tickets/{id}/status',
      method: API_METHODS.PATCH,
      category: API_CATEGORIES.SYSTEM,
      status: API_STATUS.ENABLED,
      description: '更新工单状态',
      timeout: 8000,
      retries: 1,
      cacheTime: 0,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    this.registry.register('assignTicket', {
      name: '分配工单',
      url: '/api/tickets/{id}/assign',
      method: API_METHODS.POST,
      category: API_CATEGORIES.SYSTEM,
      status: API_STATUS.ENABLED,
      description: '将工单分配给指定用户',
      timeout: 8000,
      retries: 1,
      cacheTime: 0,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    this.registry.register('addTicketComment', {
      name: '添加工单评论',
      url: '/api/tickets/{id}/comments',
      method: API_METHODS.POST,
      category: API_CATEGORIES.SYSTEM,
      status: API_STATUS.ENABLED,
      description: '为工单添加评论',
      timeout: 8000,
      retries: 1,
      cacheTime: 0,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    this.registry.register('getTicketComments', {
      name: '获取工单评论',
      url: '/api/tickets/{id}/comments',
      method: API_METHODS.GET,
      category: API_CATEGORIES.SYSTEM,
      status: API_STATUS.ENABLED,
      description: '获取工单的评论列表',
      timeout: 8000,
      retries: 1,
      cacheTime: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    this.registry.register('uploadTicketImages', {
      name: '上传工单图片',
      url: '/api/tickets/{id}/images',
      method: API_METHODS.POST,
      category: API_CATEGORIES.SYSTEM,
      status: API_STATUS.ENABLED,
      description: '为工单上传图片',
      timeout: 15000,
      retries: 0,
      cacheTime: 0,
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    this.registry.register('getTicketStats', {
      name: '获取工单统计',
      url: '/api/tickets/stats',
      method: API_METHODS.GET,
      category: API_CATEGORIES.SYSTEM,
      status: API_STATUS.ENABLED,
      description: '获取工单统计信息',
      timeout: 10000,
      retries: 1,
      cacheTime: 300000, // 5分钟缓存
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // 注册用户相关 API
    this.registry.register('getUsers', {
      name: '获取用户列表',
      url: '/api/users',
      method: API_METHODS.GET,
      category: API_CATEGORIES.SYSTEM,
      status: API_STATUS.ENABLED,
      description: '获取用户列表',
      timeout: 10000,
      retries: 1,
      cacheTime: 300000, // 5分钟缓存
      headers: {
        'Content-Type': 'application/json'
      }
    });

    this.registry.register('getUserById', {
      name: '获取用户详情',
      url: '/api/users/{id}',
      method: API_METHODS.GET,
      category: API_CATEGORIES.SYSTEM,
      status: API_STATUS.ENABLED,
      description: '根据ID获取用户详情',
      timeout: 8000,
      retries: 1,
      cacheTime: 60000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    this.registry.register('updateUser', {
      name: '更新用户信息',
      url: '/api/users/{id}',
      method: API_METHODS.PUT,
      category: API_CATEGORIES.SYSTEM,
      status: API_STATUS.ENABLED,
      description: '更新用户信息',
      timeout: 10000,
      retries: 0,
      cacheTime: 0,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // 注册趋势数据相关API
    this.registerTrendApis();
  }

  /**
   * 注册趋势数据相关API
   */
  registerTrendApis() {
    // 注册历史趋势数据API
    if (!this.registry.get('getTrendData')) {
      this.registry.register('getTrendData', {
        name: '获取趋势数据',
        url: '/api/trend-data',
        method: API_METHODS.POST,
        category: API_CATEGORIES.DATA,
        status: API_STATUS.ENABLED,
        description: '获取历史趋势数据',
        timeout: 15000,
        retries: 1,
        cacheTime: 60000, // 缓存1分钟
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    // 注册实时趋势数据API
    if (!this.registry.get('getRealtimeTrendData')) {
      this.registry.register('getRealtimeTrendData', {
        name: '获取实时趋势数据',
        url: '/api/realtime-trend-data',
        method: API_METHODS.POST,
        category: API_CATEGORIES.DATA,
        status: API_STATUS.ENABLED,
        description: '获取实时趋势数据',
        timeout: 10000,
        retries: 1,
        cacheTime: 5000, // 缓存5秒
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    // 注册自定义查询API
    if (!this.registry.get('customQuery')) {
      this.registry.register('customQuery', {
        name: '自定义数据查询',
        url: '/api/custom-query',
        method: API_METHODS.POST,
        category: API_CATEGORIES.DATA,
        status: API_STATUS.ENABLED,
        description: '执行自定义数据查询',
        timeout: 20000,
        retries: 1,
        cacheTime: 30000, // 缓存30秒
        headers: {
          'Content-Type': 'application/json'
        },
        // 自定义处理函数，直接使用数据库服务
        handler: async (params) => {
          // 导入数据库服务
          const dbService = (await import('./dbService')).default;

          // 验证参数
          if (!params.dataSource) {
            throw new Error('数据源配置不能为空');
          }

          if (!params.sql) {
            throw new Error('SQL语句不能为空');
          }

          // 执行查询
          try {
            const result = await dbService.query(
              params.dataSource,
              params.sql,
              params.parameters || []
            );

            return result;
          } catch (error) {
            console.error('数据库查询失败:', error);
            throw error;
          }
        }
      });
    }
  }

  /**
   * 处理 API 注册事件
   * @param {Object} event 事件对象
   */
  handleApiRegistered(event) {
    console.log(`API 已注册: ${event.key}`);
  }

  /**
   * 处理 API 更新事件
   * @param {Object} event 事件对象
   */
  handleApiUpdated(event) {
    console.log(`API 已更新: ${event.key}`);
  }

  /**
   * 处理 API 删除事件
   * @param {Object} event 事件对象
   */
  handleApiRemoved(event) {
    console.log(`API 已删除: ${event.key}`);

    // 清除相关字段定义
    this.fieldManager.clearFields(event.key);
  }

  /**
   * 调用 API
   * @param {string} apiKey API 键名
   * @param {Object} params 请求参数
   * @param {Object} options 请求选项
   * @returns {Promise} 请求 Promise
   */
  call(apiKey, params = {}, options = {}) {
    // 替换参数中的变量
    const processedParams = this.variableManager.replaceObjectVariables(params);

    // 调用 API
    return this.proxy.call(apiKey, processedParams, options)
      .then(data => {
        // 转换响应数据
        return this.fieldManager.transformData(apiKey, data, options);
      });
  }

  /**
   * 批量调用 API
   * @param {Array} calls API 调用配置数组
   * @param {Object} globalOptions 全局请求选项
   * @returns {Promise} 请求 Promise
   */
  batchCall(calls, globalOptions = {}) {
    // 处理每个调用的参数
    const processedCalls = calls.map(call => ({
      ...call,
      params: this.variableManager.replaceObjectVariables(call.params || {})
    }));

    // 批量调用 API
    return this.proxy.batchCall(processedCalls, globalOptions)
      .then(results => {
        // 转换每个响应的数据
        return results.map(result => {
          if (result.success) {
            result.data = this.fieldManager.transformData(result.apiKey, result.data, globalOptions);
          }
          return result;
        });
      });
  }

  /**
   * 测试 API
   * @param {string} apiKey API 键名
   * @param {Object} params 测试参数
   * @returns {Promise} 测试结果 Promise
   */
  test(apiKey, params = {}) {
    // 替换参数中的变量
    const processedParams = this.variableManager.replaceObjectVariables(params);

    // 测试 API
    return this.proxy.test(apiKey, processedParams);
  }

  /**
   * 生成 API 文档
   * @param {string|Array} apiKeys API 键名或键名数组
   * @param {string} format 文档格式
   * @param {Object} options 选项
   * @returns {string} 生成的文档
   */
  generateDocs(apiKeys, format = DOC_FORMATS.MARKDOWN, options = {}) {
    return this.docGenerator.generateDocs(apiKeys, format, options);
  }
}

// 创建单例
const apiManager = new ApiManager();

export default apiManager;
