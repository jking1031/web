/**
 * 数据库服务
 * 提供数据库连接和查询功能的模拟实现
 * 注意：这是一个前端模拟实现，实际应用中应该使用后端API进行数据库操作
 */


import { EventEmitter } from '../utils/EventEmitter';
import * as dbApi from '../api/dbApi';

// 模拟数据库连接状态缓存
const connectionStatus = new Map();

// 数据库事件类型
export const DB_EVENTS = {
  CONNECTED: 'db:connected',
  DISCONNECTED: 'db:disconnected',
  QUERY_EXECUTED: 'db:query_executed',
  ERROR: 'db:error',
  STATUS_CHANGED: 'db:status_changed'
};

// 数据库连接状态
export const DB_STATUS = {
  CONNECTED: 'connected',
  DISCONNECTED: 'disconnected',
  ERROR: 'error',
  CONNECTING: 'connecting'
};

// 数据库类型
export const DB_TYPES = {
  MYSQL: 'mysql',
  MARIADB: 'mariadb',
  POSTGRES: 'postgres',
  MSSQL: 'mssql',
  ORACLE: 'oracle',
  SQLITE: 'sqlite'
};

class DbService {
  constructor() {
    this.eventEmitter = EventEmitter;
  }

  /**
   * 模拟获取数据库连接
   * @param {Object} config 数据库配置
   * @returns {Object} 模拟连接对象
   */
  async getConnection(config) {
    if (!config) {
      throw new Error('数据库配置不能为空');
    }

    // 生成连接缓存键
    const cacheKey = this.generateCacheKey(config);

    // 更新连接状态
    this.updateConnectionStatus(cacheKey, DB_STATUS.CONNECTING);

    try {
      // 模拟连接测试
      await this.testConnection(config);

      // 更新连接状态
      this.updateConnectionStatus(cacheKey, DB_STATUS.CONNECTED);

      // 触发连接事件
      this.eventEmitter.emit(DB_EVENTS.CONNECTED, {
        config: {
          ...config,
          password: '******' // 隐藏密码
        },
        timestamp: Date.now()
      });

      // 返回模拟连接对象
      return {
        config,
        connected: true,
        timestamp: Date.now()
      };
    } catch (error) {
      // 更新连接状态
      this.updateConnectionStatus(cacheKey, DB_STATUS.ERROR, error.message);

      // 触发错误事件
      this.eventEmitter.emit(DB_EVENTS.ERROR, {
        config: {
          ...config,
          password: '******' // 隐藏密码
        },
        error: error.message,
        timestamp: Date.now()
      });

      throw error;
    }
  }

  /**
   * 更新数据库连接状态
   * @param {string} cacheKey 连接池缓存键
   * @param {string} status 连接状态
   * @param {string} errorMessage 错误消息（可选）
   */
  updateConnectionStatus(cacheKey, status, errorMessage = null) {
    const oldStatus = connectionStatus.get(cacheKey);
    const newStatus = {
      status,
      timestamp: Date.now(),
      error: errorMessage
    };

    connectionStatus.set(cacheKey, newStatus);

    // 如果状态发生变化，触发状态变更事件
    if (!oldStatus || oldStatus.status !== status) {
      this.eventEmitter.emit(DB_EVENTS.STATUS_CHANGED, {
        cacheKey,
        oldStatus,
        newStatus
      });
    }
  }

  /**
   * 生成连接池缓存键
   * @param {Object} config 数据库配置
   * @returns {string} 缓存键
   */
  generateCacheKey(config) {
    return `${config.type}://${config.username}@${config.host}:${config.port}/${config.database}`;
  }

  /**
   * 关闭数据库连接
   * @param {Object} config 数据库配置
   */
  async closeConnection(config) {
    if (!config) {
      return;
    }

    // 生成连接缓存键
    const cacheKey = this.generateCacheKey(config);

    // 更新连接状态
    this.updateConnectionStatus(cacheKey, DB_STATUS.DISCONNECTED);

    // 触发断开连接事件
    this.eventEmitter.emit(DB_EVENTS.DISCONNECTED, {
      config: {
        ...config,
        password: '******' // 隐藏密码
      },
      timestamp: Date.now()
    });
  }

  /**
   * 关闭所有数据库连接
   */
  async closeAllConnections() {
    // 获取所有连接状态
    const statuses = this.getAllConnectionStatus();

    // 更新所有连接状态为断开
    for (const status of statuses) {
      this.updateConnectionStatus(status.key, DB_STATUS.DISCONNECTED);
    }

    // 触发断开连接事件
    this.eventEmitter.emit(DB_EVENTS.DISCONNECTED, {
      message: '所有连接已断开',
      timestamp: Date.now()
    });
  }

  /**
   * 获取所有数据库连接状态
   * @returns {Array} 连接状态数组
   */
  getAllConnectionStatus() {
    const result = [];

    for (const [key, status] of connectionStatus.entries()) {
      result.push({
        key,
        ...status
      });
    }

    return result;
  }

  /**
   * 获取特定数据库连接状态
   * @param {Object} config 数据库配置
   * @returns {Object} 连接状态
   */
  getConnectionStatus(config) {
    if (!config) {
      return null;
    }

    const cacheKey = this.generateCacheKey(config);
    return connectionStatus.get(cacheKey) || {
      status: DB_STATUS.DISCONNECTED,
      timestamp: Date.now()
    };
  }

  /**
   * 测试数据库连接
   * @param {Object} config 数据库配置
   * @returns {Object} 测试结果
   */
  async testConnection(config) {
    if (!config) {
      throw new Error('数据库配置不能为空');
    }

    const startTime = Date.now();
    const cacheKey = this.generateCacheKey(config);

    // 更新连接状态
    this.updateConnectionStatus(cacheKey, DB_STATUS.CONNECTING);

    try {
      // 使用API进行连接测试
      const response = await dbApi.testConnection({
        type: config.type,
        host: config.host,
        port: config.port,
        database: config.database,
        username: config.username,
        password: config.password,
        options: {
          connectTimeout: config.connectTimeout || 10000,
          timezone: config.timezone || 'local',
          charset: config.charset || 'utf8mb4',
          dateStrings: config.dateStrings || true
        }
      });

      // 计算响应时间
      const responseTime = Date.now() - startTime;

      // 更新连接状态
      this.updateConnectionStatus(cacheKey, DB_STATUS.CONNECTED);

      // 如果API调用成功但测试失败
      if (response.data && !response.data.success) {
        this.updateConnectionStatus(cacheKey, DB_STATUS.ERROR, response.data.error);
        return {
          success: false,
          message: response.data.message || `数据库连接失败`,
          responseTime,
          error: response.data.error
        };
      }



      return {
        success: true,
        message: '数据库连接成功',
        responseTime,
        data: response.data?.data || { connected: 1 },
        version: response.data?.version,
        statusInfo: response.data?.statusInfo
      };
    } catch (error) {
      // 计算响应时间
      const responseTime = Date.now() - startTime;

      // 更新连接状态
      this.updateConnectionStatus(cacheKey, DB_STATUS.ERROR, error.message);



      return {
        success: false,
        message: `数据库连接失败: ${error.message}`,
        responseTime,
        error: error.message
      };
    }
  }

  /**
   * 执行SQL查询
   * @param {Object} config 数据库配置
   * @param {string} sql SQL语句
   * @param {Array} params 查询参数
   * @param {Object} options 查询选项
   * @returns {Array} 查询结果
   */
  async query(config, sql, params = [], options = {}) {
    if (!config) {
      throw new Error('数据库配置不能为空');
    }

    if (!sql) {
      throw new Error('SQL语句不能为空');
    }

    const startTime = Date.now();
    const cacheKey = this.generateCacheKey(config);

    try {
      // 使用API执行查询
      const response = await dbApi.executeQuery({
        config: {
          type: config.type,
          host: config.host,
          port: config.port,
          database: config.database,
          username: config.username,
          password: config.password,
          options: {
            connectTimeout: config.connectTimeout || 10000,
            timezone: config.timezone || 'local',
            charset: config.charset || 'utf8mb4',
            dateStrings: config.dateStrings || true
          }
        },
        sql,
        params,
        includeFields: options.includeFields
      });

      // 计算查询时间
      const queryTime = Date.now() - startTime;

      // 触发查询执行事件
      this.eventEmitter.emit(DB_EVENTS.QUERY_EXECUTED, {
        config: {
          ...config,
          password: '******' // 隐藏密码
        },
        sql,
        params,
        rowCount: response.data?.rows?.length || 0,
        queryTime,
        timestamp: Date.now()
      });

      // 如果API调用成功但查询失败
      if (response.data && response.data.error) {
        this.updateConnectionStatus(cacheKey, DB_STATUS.ERROR, response.data.error);
        throw new Error(response.data.error);
      }

      // 如果需要返回字段信息
      if (options.includeFields && response.data.fields) {
        return {
          rows: response.data.rows || [],
          fields: response.data.fields || [],
          queryTime,
          rowCount: response.data.rows?.length || 0
        };
      }



      return response.data?.rows || [];
    } catch (error) {
      // 更新连接状态
      this.updateConnectionStatus(cacheKey, DB_STATUS.ERROR, error.message);

      // 触发错误事件
      this.eventEmitter.emit(DB_EVENTS.ERROR, {
        config: {
          ...config,
          password: '******' // 隐藏密码
        },
        sql,
        params,
        error: error.message,
        timestamp: Date.now()
      });



      throw error;
    }
  }

  /**
   * 执行多个SQL查询
   * @param {Object} config 数据库配置
   * @param {Array} queries 查询数组，每个元素包含 sql 和 params
   * @returns {Array} 查询结果数组
   */
  async multiQuery(config, queries) {
    if (!config) {
      throw new Error('数据库配置不能为空');
    }

    if (!queries || !Array.isArray(queries) || queries.length === 0) {
      throw new Error('查询数组不能为空');
    }

    const startTime = Date.now();
    const cacheKey = this.generateCacheKey(config);

    try {
      // 使用API执行多个查询
      const response = await dbApi.executeMultiQuery({
        config: {
          type: config.type,
          host: config.host,
          port: config.port,
          database: config.database,
          username: config.username,
          password: config.password,
          options: {
            connectTimeout: config.connectTimeout || 10000,
            timezone: config.timezone || 'local',
            charset: config.charset || 'utf8mb4',
            dateStrings: config.dateStrings || true
          }
        },
        queries: queries.map(q => ({
          sql: q.sql,
          params: q.params || []
        }))
      });

      // 计算查询时间
      const queryTime = Date.now() - startTime;

      // 触发查询执行事件
      this.eventEmitter.emit(DB_EVENTS.QUERY_EXECUTED, {
        config: {
          ...config,
          password: '******' // 隐藏密码
        },
        queryCount: queries.length,
        queryTime,
        timestamp: Date.now()
      });

      // 如果API调用成功但查询失败
      if (response.data && response.data.error) {
        this.updateConnectionStatus(cacheKey, DB_STATUS.ERROR, response.data.error);
        throw new Error(response.data.error);
      }



      return response.data?.results || [];
    } catch (error) {
      // 更新连接状态
      this.updateConnectionStatus(cacheKey, DB_STATUS.ERROR, error.message);

      // 触发错误事件
      this.eventEmitter.emit(DB_EVENTS.ERROR, {
        config: {
          ...config,
          password: '******' // 隐藏密码
        },
        error: error.message,
        timestamp: Date.now()
      });



      throw error;
    }
  }
}

// 创建单例
const dbService = new DbService();

export default dbService;
