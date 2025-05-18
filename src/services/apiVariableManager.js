/**
 * API 变量管理服务
 * 用于管理 API 调用中使用的变量，支持全局变量、环境变量和用户变量
 */

// 变量作用域
export const VARIABLE_SCOPES = {
  GLOBAL: 'global',   // 全局变量，所有用户可用
  USER: 'user',       // 用户变量，仅当前用户可用
  SESSION: 'session', // 会话变量，仅当前会话可用
  ENV: 'env'          // 环境变量，根据环境不同而不同
};

// 变量类型
export const VARIABLE_TYPES = {
  STRING: 'string',
  NUMBER: 'number',
  BOOLEAN: 'boolean',
  OBJECT: 'object',
  ARRAY: 'array',
  FUNCTION: 'function'
};

class ApiVariableManager {
  constructor() {
    // 变量存储
    this.variables = {
      [VARIABLE_SCOPES.GLOBAL]: {},
      [VARIABLE_SCOPES.USER]: {},
      [VARIABLE_SCOPES.SESSION]: {},
      [VARIABLE_SCOPES.ENV]: {}
    };

    // 加载已保存的变量
    this.loadVariables();

    // 初始化环境变量
    this.initEnvVariables();
  }

  /**
   * 加载已保存的变量
   */
  loadVariables() {
    try {
      // 加载全局变量
      const globalVars = localStorage.getItem('apiGlobalVariables');
      if (globalVars) {
        this.variables[VARIABLE_SCOPES.GLOBAL] = JSON.parse(globalVars);
      }

      // 加载用户变量
      const userVars = localStorage.getItem('apiUserVariables');
      if (userVars) {
        this.variables[VARIABLE_SCOPES.USER] = JSON.parse(userVars);
      }

      // 加载会话变量
      const sessionVars = sessionStorage.getItem('apiSessionVariables');
      if (sessionVars) {
        this.variables[VARIABLE_SCOPES.SESSION] = JSON.parse(sessionVars);
      }

      console.log('已加载 API 变量');
    } catch (error) {
      console.error('加载 API 变量失败:', error);
    }
  }

  /**
   * 保存变量到存储
   */
  saveVariables() {
    try {
      // 保存全局变量
      localStorage.setItem('apiGlobalVariables', JSON.stringify(this.variables[VARIABLE_SCOPES.GLOBAL]));

      // 保存用户变量
      localStorage.setItem('apiUserVariables', JSON.stringify(this.variables[VARIABLE_SCOPES.USER]));

      // 保存会话变量
      sessionStorage.setItem('apiSessionVariables', JSON.stringify(this.variables[VARIABLE_SCOPES.SESSION]));
    } catch (error) {
      console.error('保存 API 变量失败:', error);
    }
  }

  /**
   * 初始化环境变量
   */
  initEnvVariables() {
    try {
      // 获取环境变量
      const mode = (import.meta && import.meta.env && import.meta.env.MODE) || 'development';
      const apiBaseUrl = (import.meta && import.meta.env && import.meta.env.VITE_API_BASE_URL) || window.location.origin;

      // 设置环境变量
      this.variables[VARIABLE_SCOPES.ENV] = {
        NODE_ENV: mode,
        BASE_URL: window.location.origin,
        API_BASE_URL: apiBaseUrl,
        TIMESTAMP: Date.now(),
        BROWSER: this.detectBrowser(),
        PLATFORM: this.detectPlatform(),
        SCREEN_WIDTH: window.screen.width,
        SCREEN_HEIGHT: window.screen.height
      };
    } catch (error) {
      console.error('初始化环境变量失败:', error);

      // 设置默认环境变量
      this.variables[VARIABLE_SCOPES.ENV] = {
        NODE_ENV: 'development',
        BASE_URL: window.location.origin,
        API_BASE_URL: window.location.origin,
        TIMESTAMP: Date.now(),
        BROWSER: this.detectBrowser(),
        PLATFORM: this.detectPlatform(),
        SCREEN_WIDTH: window.screen.width,
        SCREEN_HEIGHT: window.screen.height
      };
    }
  }

  /**
   * 检测浏览器类型
   * @returns {string} 浏览器类型
   */
  detectBrowser() {
    const userAgent = navigator.userAgent;

    if (userAgent.indexOf('Chrome') > -1) {
      return 'Chrome';
    }
    if (userAgent.indexOf('Safari') > -1) {
      return 'Safari';
    }
    if (userAgent.indexOf('Firefox') > -1) {
      return 'Firefox';
    }
    if (userAgent.indexOf('MSIE') > -1 || userAgent.indexOf('Trident') > -1) {
      return 'IE';
    }
    if (userAgent.indexOf('Edge') > -1) {
      return 'Edge';
    }

    return 'Unknown';
  }

  /**
   * 检测平台类型
   * @returns {string} 平台类型
   */
  detectPlatform() {
    const userAgent = navigator.userAgent;

    if (/Android/i.test(userAgent)) {
      return 'Android';
    }
    if (/iPhone|iPad|iPod/i.test(userAgent)) {
      return 'iOS';
    }
    if (/Windows/i.test(userAgent)) {
      return 'Windows';
    }
    if (/Mac/i.test(userAgent)) {
      return 'Mac';
    }
    if (/Linux/i.test(userAgent)) {
      return 'Linux';
    }

    return 'Unknown';
  }

  /**
   * 获取变量
   * @param {string} name 变量名
   * @param {string} scope 变量作用域
   * @returns {*} 变量值
   */
  get(name, scope = null) {
    // 如果指定了作用域，则只在该作用域中查找
    if (scope) {
      return this.variables[scope][name];
    }

    // 按优先级查找变量：会话 > 用户 > 全局 > 环境
    if (this.variables[VARIABLE_SCOPES.SESSION][name] !== undefined) {
      return this.variables[VARIABLE_SCOPES.SESSION][name];
    }

    if (this.variables[VARIABLE_SCOPES.USER][name] !== undefined) {
      return this.variables[VARIABLE_SCOPES.USER][name];
    }

    if (this.variables[VARIABLE_SCOPES.GLOBAL][name] !== undefined) {
      return this.variables[VARIABLE_SCOPES.GLOBAL][name];
    }

    if (this.variables[VARIABLE_SCOPES.ENV][name] !== undefined) {
      return this.variables[VARIABLE_SCOPES.ENV][name];
    }

    return undefined;
  }

  /**
   * 设置变量
   * @param {string} name 变量名
   * @param {*} value 变量值
   * @param {string} scope 变量作用域
   * @returns {boolean} 操作是否成功
   */
  set(name, value, scope = VARIABLE_SCOPES.USER) {
    // 不允许修改环境变量
    if (scope === VARIABLE_SCOPES.ENV) {
      console.error('不允许修改环境变量');
      return false;
    }

    // 设置变量
    this.variables[scope][name] = value;

    // 保存变量
    this.saveVariables();

    return true;
  }

  /**
   * 删除变量
   * @param {string} name 变量名
   * @param {string} scope 变量作用域
   * @returns {boolean} 操作是否成功
   */
  remove(name, scope = VARIABLE_SCOPES.USER) {
    // 不允许删除环境变量
    if (scope === VARIABLE_SCOPES.ENV) {
      console.error('不允许删除环境变量');
      return false;
    }

    // 删除变量
    delete this.variables[scope][name];

    // 保存变量
    this.saveVariables();

    return true;
  }

  /**
   * 清除作用域中的所有变量
   * @param {string} scope 变量作用域
   * @returns {boolean} 操作是否成功
   */
  clear(scope = VARIABLE_SCOPES.USER) {
    // 不允许清除环境变量
    if (scope === VARIABLE_SCOPES.ENV) {
      console.error('不允许清除环境变量');
      return false;
    }

    // 清除变量
    this.variables[scope] = {};

    // 保存变量
    this.saveVariables();

    return true;
  }

  /**
   * 获取作用域中的所有变量
   * @param {string} scope 变量作用域
   * @returns {Object} 变量对象
   */
  getAll(scope = null) {
    if (scope) {
      return { ...this.variables[scope] };
    }

    // 合并所有作用域的变量
    return {
      ...this.variables[VARIABLE_SCOPES.ENV],
      ...this.variables[VARIABLE_SCOPES.GLOBAL],
      ...this.variables[VARIABLE_SCOPES.USER],
      ...this.variables[VARIABLE_SCOPES.SESSION]
    };
  }

  /**
   * 替换字符串中的变量
   * @param {string} str 字符串
   * @returns {string} 替换后的字符串
   */
  replaceVariables(str) {
    if (typeof str !== 'string') {
      return str;
    }

    // 替换 ${variable} 格式的变量
    return str.replace(/\${([^}]+)}/g, (match, name) => {
      const value = this.get(name);
      return value !== undefined ? value : match;
    });
  }

  /**
   * 替换对象中的变量
   * @param {Object} obj 对象
   * @returns {Object} 替换后的对象
   */
  replaceObjectVariables(obj) {
    if (!obj || typeof obj !== 'object') {
      return obj;
    }

    // 如果是数组，递归替换每个元素
    if (Array.isArray(obj)) {
      return obj.map(item => this.replaceObjectVariables(item));
    }

    // 替换对象中的变量
    const result = {};
    Object.keys(obj).forEach(key => {
      const value = obj[key];

      if (typeof value === 'string') {
        result[key] = this.replaceVariables(value);
      } else if (typeof value === 'object' && value !== null) {
        result[key] = this.replaceObjectVariables(value);
      } else {
        result[key] = value;
      }
    });

    return result;
  }

  /**
   * 导出变量
   * @param {string} scope 变量作用域
   * @returns {Object} 导出的变量
   */
  exportVariables(scope = null) {
    const variables = scope ? { ...this.variables[scope] } : this.getAll();

    // 移除函数类型的变量
    Object.keys(variables).forEach(key => {
      if (typeof variables[key] === 'function') {
        delete variables[key];
      }
    });

    return variables;
  }

  /**
   * 导入变量
   * @param {Object} variables 变量对象
   * @param {string} scope 变量作用域
   * @param {boolean} overwrite 是否覆盖现有变量
   * @returns {boolean} 操作是否成功
   */
  importVariables(variables, scope = VARIABLE_SCOPES.USER, overwrite = false) {
    if (!variables || typeof variables !== 'object') {
      console.error('无效的变量对象');
      return false;
    }

    // 不允许导入环境变量
    if (scope === VARIABLE_SCOPES.ENV) {
      console.error('不允许导入环境变量');
      return false;
    }

    // 导入变量
    Object.keys(variables).forEach(key => {
      // 如果不覆盖现有变量，且变量已存在，则跳过
      if (!overwrite && this.get(key, scope) !== undefined) {
        return;
      }

      this.set(key, variables[key], scope);
    });

    return true;
  }
}

// 创建单例
const apiVariableManager = new ApiVariableManager();

export default apiVariableManager;
