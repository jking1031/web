/**
 * API 管理服务
 * 统一入口，整合所有 API 相关服务
 */

import apiRegistry, { API_EVENTS, API_CATEGORIES, API_METHODS, API_STATUS } from './apiRegistry';
import apiProxy from './apiProxy';
import apiFieldManager, { FIELD_TYPES, FORMAT_TYPES } from '../managers/apiFieldManager';
import apiVariableManager, { VARIABLE_SCOPES, VARIABLE_TYPES } from '../managers/apiVariableManager';
import apiDocGenerator, { DOC_FORMATS } from '../utils/apiDocGenerator';

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
    this.isInitialized = false;
    this.isInitializing = false;

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

    // 自动初始化（异步）
    this.initPromise = this.init();
  }

  /**
   * 初始化
   * @returns {Promise<boolean>} 初始化结果
   */
  async init() {
    // 防止重复初始化
    if (this.isInitialized) {
      return true;
    }

    if (this.isInitializing) {
      // 如果已经在初始化中，等待初始化完成
      return this.initPromise;
    }

    this.isInitializing = true;

    try {
      console.log('API管理器开始初始化...');

      // 等待API注册中心初始化完成（从后端加载配置）
      await this.registry.waitForReady();

      // 注册默认 API（只有在没有API配置时才会执行）
      await this.registerDefaultApis();

      // 注册事件监听
      this.registry.eventEmitter.addEventListener(API_EVENTS.REGISTERED, this.handleApiRegistered.bind(this));
      this.registry.eventEmitter.addEventListener(API_EVENTS.UPDATED, this.handleApiUpdated.bind(this));
      this.registry.eventEmitter.addEventListener(API_EVENTS.REMOVED, this.handleApiRemoved.bind(this));

      this.isInitialized = true;
      this.isInitializing = false;
      console.log('API管理器初始化完成');
      return true;
    } catch (error) {
      console.error('API管理器初始化失败:', error);
      this.isInitializing = false;
      return false;
    }
  }

  /**
   * 等待API管理器初始化完成
   * @param {number} timeout 超时时间（毫秒），默认为10000
   * @returns {Promise<boolean>} 初始化是否成功
   */
  async waitForReady(timeout = 10000) {
    if (this.isInitialized) {
      return true;
    }

    // 如果已经有初始化Promise，直接返回
    if (this.initPromise) {
      try {
        return await Promise.race([
          this.initPromise,
          new Promise((_, reject) => setTimeout(() => reject(new Error('初始化超时')), timeout))
        ]);
      } catch (error) {
        console.error('等待API管理器初始化超时:', error);
        return false;
      }
    }

    // 如果没有初始化，开始初始化
    return this.init();
  }

  /**
   * 注册默认 API
   * @returns {Promise<boolean>} 操作是否成功
   */
  async registerDefaultApis() {
    // 检查是否已经注册了默认 API
    if (Object.keys(this.registry.getAll()).length > 0) {
      // 确保趋势数据API已注册
      await this.registerTrendApis();
      console.log('API配置已存在，跳过默认API注册');
      return true;
    }

    console.log('没有找到API配置，注册默认API...');

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

    // 注册告警相关API
    this.registry.register('getAlarms', {
      name: '获取告警信息',
      url: '/api/alarms',
      method: API_METHODS.GET,
      category: API_CATEGORIES.SYSTEM,
      status: API_STATUS.ENABLED,
      description: '获取站点告警信息',
      timeout: 10000,
      retries: 1,
      cacheTime: 30000, // 30秒缓存
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // 注册获取站点详情API
    this.registry.register('getSiteById', {
      name: '获取站点详情',
      url: 'https://nodered.jzz77.cn:9003/api/site/sites/:id',
      method: API_METHODS.GET,
      category: API_CATEGORIES.SYSTEM,
      status: API_STATUS.ENABLED,
      description: '获取站点详情信息',
      timeout: 10000,
      retries: 1,
      cacheTime: 60000, // 60秒缓存
      headers: {
        'Content-Type': 'application/json'
      },
      // 添加参数处理函数，确保URL中的:id被正确替换
      paramsProcessor: (params) => {
        const processedParams = { ...params };
        const url = 'https://nodered.jzz77.cn:9003/api/site/sites/' + params.id;
        return { url, params: {} };
      }
    });

    // 注册获取用户角色API
    this.registry.register('getUserRoles', {
      name: '获取用户角色',
      url: 'https://nodered.jzz77.cn:9003/api/users/:userId/roles',
      method: API_METHODS.GET,
      category: API_CATEGORIES.SYSTEM,
      status: API_STATUS.ENABLED,
      description: '获取用户角色信息',
      timeout: 10000,
      retries: 1,
      cacheTime: 300000, // 5分钟缓存
      headers: {
        'Content-Type': 'application/json'
      },
      // 添加参数处理函数，确保URL中的:userId被正确替换
      paramsProcessor: (params) => {
        const processedParams = { ...params };
        const url = 'https://nodered.jzz77.cn:9003/api/users/' + params.userId + '/roles';
        return { url, params: {} };
      }
    });

    // 注册获取告警信息API
    this.registry.register('getAlarms', {
      name: '获取告警信息',
      url: 'https://nodered.jzz77.cn:9003/api/site/alarms/:siteId',
      method: API_METHODS.GET,
      category: API_CATEGORIES.SYSTEM,
      status: API_STATUS.ENABLED,
      description: '获取站点告警信息',
      timeout: 10000,
      retries: 1,
      cacheTime: 60000, // 1分钟缓存
      headers: {
        'Content-Type': 'application/json'
      },
      // 添加参数处理函数，确保URL中的:siteId被正确替换
      paramsProcessor: (params) => {
        const processedParams = { ...params };
        const url = 'https://nodered.jzz77.cn:9003/api/site/alarms/' + params.siteId;
        return { url, params: {} };
      }
    });

    // 注册趋势数据相关API
    this.registerTrendApis();
  }

  /**
   * 注册趋势数据相关API
   * @returns {Promise<boolean>} 操作是否成功
   */
  async registerTrendApis() {
    console.log('检查并注册趋势数据相关API...');

    // 注册历史趋势数据API
    if (!this.registry.get('getTrendData')) {
      await this.registry.register('getTrendData', {
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
      await this.registry.register('getRealtimeTrendData', {
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
      await this.registry.register('customQuery', {
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
          const dbService = (await import('../../../services/dbService')).default;

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

    console.log('趋势数据相关API检查完成');
    return true;
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
   * 调用单个API
   * @param {string} apiKey - API键名
   * @param {object} params - 请求参数
   * @param {object} options - 额外选项（如超时、重试等）
   * @returns {Promise} - 返回API响应的Promise
   */
  async call(apiKey, params = {}, options = {}) {
    try {
      console.log(`[ApiManager] 开始调用API: ${apiKey}`, {
        params: apiKey === 'login' ? { ...params, password: '******' } : params,
        options
      });

      // 检查API是否存在
      if (this.registry.get(apiKey) === null) {
        console.error(`[ApiManager] API不存在: ${apiKey}`);
        throw new Error(`API不存在: ${apiKey}`);
      }

      // 获取API配置
      const apiConfig = this.registry.get(apiKey);
      console.log(`[ApiManager] API配置: ${apiKey}`, {
        url: apiConfig.url,
        method: apiConfig.method,
        enabled: apiConfig.enabled,
        timeout: apiConfig.timeout
      });

      // 检查API是否启用
      if (apiConfig.enabled === false) {
        console.error(`[ApiManager] API已禁用: ${apiKey}`);
        throw new Error(`API已禁用: ${apiKey}`);
      }

      // 合并选项
      const mergedOptions = {
        ...apiConfig,
        ...options
      };

      // 调用API
      console.log(`[ApiManager] 执行API调用: ${apiKey}`);
      const response = await this.proxy.call(apiKey, params, mergedOptions);
      console.log(`[ApiManager] API调用成功: ${apiKey}`, {
        responseType: typeof response,
        responseKeys: response ? Object.keys(response) : null
      });

      return response;
    } catch (error) {
      console.error(`[ApiManager] 调用API失败: ${apiKey}`, error);
      console.error(`[ApiManager] 错误详情:`, {
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
  async batchCall(apiCalls, parallel = true) {
    try {
      if (parallel) {
        // 并行调用
        const promises = apiCalls.map(call =>
          this.call(call.key, call.params || {}, call.options || {})
            .then(response => ({ key: call.key, response, error: null }))
            .catch(error => ({ key: call.key, response: null, error }))
        );

        return await Promise.all(promises);
      } else {
        // 串行调用
        const results = [];
        for (const call of apiCalls) {
          try {
            const response = await this.call(call.key, call.params || {}, call.options || {});
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
   * 测试API
   * @param {string} apiKey - API键名
   * @param {object} params - 请求参数
   * @returns {Promise} - 返回测试结果的Promise
   */
  async test(apiKey, params = {}) {
    try {
      const result = await this.call(apiKey, params, { showError: false });
      return {
        success: true,
        data: result
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
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
