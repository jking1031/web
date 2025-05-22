/**
 * API日志工具
 * 提供统一的API调用日志记录功能
 */

class ApiLogger {
  constructor(options = {}) {
    this.enabled = options.enabled !== false;
    this.logLevel = options.logLevel || 'info';
    this.levels = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3
    };
  }

  /**
   * 记录API调用日志
   * @param {string} level - 日志级别
   * @param {string} message - 日志消息
   * @param {object} data - 附加数据
   */
  log(level, message, data = {}) {
    if (!this.enabled || this.levels[level] < this.levels[this.logLevel]) {
      return;
    }

    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...data
    };

    switch (level) {
      case 'debug':
        console.debug(`[API ${timestamp}] ${message}`, data);
        break;
      case 'info':
        console.info(`[API ${timestamp}] ${message}`, data);
        break;
      case 'warn':
        console.warn(`[API ${timestamp}] ${message}`, data);
        break;
      case 'error':
        console.error(`[API ${timestamp}] ${message}`, data);
        break;
    }

    return logEntry;
  }

  /**
   * 记录API调用开始
   * @param {string} apiKey - API键名
   * @param {object} params - 请求参数
   * @param {object} options - 请求选项
   */
  logApiCall(apiKey, params = {}, options = {}) {
    return this.log('info', `开始调用API: ${apiKey}`, {
      apiKey,
      params: apiKey === 'login' ? { ...params, password: '******' } : params,
      options
    });
  }

  /**
   * 记录API调用成功
   * @param {string} apiKey - API键名
   * @param {object} response - 响应数据
   */
  logApiSuccess(apiKey, response) {
    return this.log('info', `API调用成功: ${apiKey}`, {
      apiKey,
      responseType: typeof response,
      responseKeys: response ? Object.keys(response) : null
    });
  }

  /**
   * 记录API调用失败
   * @param {string} apiKey - API键名
   * @param {Error} error - 错误对象
   */
  logApiError(apiKey, error) {
    return this.log('error', `API调用失败: ${apiKey}`, {
      apiKey,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
        hasResponse: !!error.response,
        hasRequest: !!error.request
      }
    });
  }

  /**
   * 记录API配置
   * @param {string} apiKey - API键名
   * @param {object} config - API配置
   */
  logApiConfig(apiKey, config) {
    return this.log('debug', `API配置: ${apiKey}`, {
      apiKey,
      url: config.url,
      method: config.method,
      enabled: config.enabled,
      timeout: config.timeout
    });
  }
}

// 创建单例实例
const apiLogger = new ApiLogger();

export default apiLogger; 