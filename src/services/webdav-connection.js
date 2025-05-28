import webdavService from './webdav';

/**
 * WebDAV连接管理器 - 负责维持WebDAV连接状态
 */
class WebDAVConnectionManager {
  constructor() {
    this.credentials = null;
    this.isInitializing = false;
    this.lastActivityTime = Date.now();
    this.connectionTimeout = 30 * 60 * 1000; // 30分钟超时
    this.checkInterval = null;
    this.onConnectionChange = null;
  }

  /**
   * 初始化WebDAV连接
   * @param {object} credentials WebDAV凭证
   * @param {string} credentials.baseURL 服务器地址
   * @param {string} credentials.username 用户名
   * @param {string} credentials.password 密码
   * @param {boolean} credentials.useProxy 是否使用代理
   * @returns {Promise<boolean>} 连接是否成功
   */
  async initConnection(credentials) {
    if (this.isInitializing) {
      return false;
    }

    this.isInitializing = true;

    try {
      // 保存凭证以便重连
      this.credentials = credentials;
      
      // 初始化WebDAV连接
      const result = await webdavService.init(
        credentials.baseURL,
        credentials.username,
        credentials.password,
        credentials.useProxy
      );
      
      // 更新活动时间
      this.updateActivityTime();
      
      // 启动连接状态检查
      this.startConnectionCheck();
      
      // 通知连接状态变化
      if (this.onConnectionChange) {
        this.onConnectionChange(true);
      }
      
      return result;
    } catch (error) {
      console.error('初始化WebDAV连接失败', error);
      
      // 通知连接状态变化
      if (this.onConnectionChange) {
        this.onConnectionChange(false);
      }
      
      return false;
    } finally {
      this.isInitializing = false;
    }
  }

  /**
   * 检查WebDAV连接状态，必要时重连
   * @returns {Promise<boolean>} 连接是否有效
   */
  async checkConnection() {
    // 检查当前连接状态
    const isConnected = webdavService.isConnected();
    
    // 如果连接已断开且有保存的凭证，尝试重连
    if (!isConnected && this.credentials) {
      console.log('WebDAV连接已断开，尝试重连...');
      return await this.initConnection(this.credentials);
    }
    
    // 检查连接是否超时
    const currentTime = Date.now();
    const timeSinceLastActivity = currentTime - this.lastActivityTime;
    
    if (timeSinceLastActivity > this.connectionTimeout) {
      console.log('WebDAV连接超时，尝试刷新连接...');
      return await this.initConnection(this.credentials);
    }
    
    return isConnected;
  }

  /**
   * 更新最后活动时间
   */
  updateActivityTime() {
    this.lastActivityTime = Date.now();
  }

  /**
   * 启动连接状态检查定时器
   */
  startConnectionCheck() {
    // 清除可能存在的旧定时器
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
    
    // 每5分钟检查一次连接状态
    this.checkInterval = setInterval(async () => {
      await this.checkConnection();
    }, 5 * 60 * 1000);
  }

  /**
   * 停止连接状态检查
   */
  stopConnectionCheck() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  /**
   * 设置连接状态变化回调
   * @param {Function} callback 回调函数，参数为连接状态(boolean)
   */
  setConnectionChangeCallback(callback) {
    this.onConnectionChange = callback;
  }

  /**
   * 关闭WebDAV连接
   */
  disconnect() {
    this.stopConnectionCheck();
    this.credentials = null;
    this.lastActivityTime = 0;
    
    // 通知连接状态变化
    if (this.onConnectionChange) {
      this.onConnectionChange(false);
    }
  }

  /**
   * 包装WebDAV服务方法，确保连接有效
   * @param {Function} method WebDAV服务方法
   * @param {Array} args 方法参数
   * @returns {Promise<any>} 方法执行结果
   */
  async ensureConnection(method, ...args) {
    // 更新活动时间
    this.updateActivityTime();
    
    try {
      // 检查连接状态，必要时重连
      const isConnected = await this.checkConnection();
      
      if (!isConnected) {
        throw new Error('WebDAV连接失败，请检查网络或重新登录');
      }
      
      // 执行原始方法
      return await method(...args);
    } catch (error) {
      // 如果是连接错误，尝试重连一次
      if (error.message.includes('WebDAV未连接') && this.credentials) {
        console.log('尝试重新连接后再次执行操作...');
        await this.initConnection(this.credentials);
        
        // 重新执行原始方法
        return await method(...args);
      }
      
      // 其他错误直接抛出
      throw error;
    }
  }
}

// 创建单例
const webdavConnectionManager = new WebDAVConnectionManager();

export default webdavConnectionManager; 