/**
 * 基础URL管理器
 * 用于管理和存储API基础URL
 */

// 默认基础URL
const DEFAULT_BASE_URLS = [
  {
    id: 'nodered',
    name: 'Node-RED服务器',
    url: 'https://nodered.jzz77.cn:9003',
    description: 'Node-RED服务器API',
    isDefault: true
  },
  {
    id: 'zziot',
    name: 'ZZIOT服务器',
    url: 'https://zziot.jzz77.cn:9003',
    description: 'ZZIOT服务器API',
    isDefault: false
  }
];

// 存储键名
const STORAGE_KEY = 'base_urls';

/**
 * 基础URL管理类
 */
class BaseUrlManager {
  constructor() {
    this.baseUrls = [];
    this.defaultBaseUrl = null;
    this.init();
  }

  /**
   * 初始化
   */
  init() {
    this.loadBaseUrls();
  }

  /**
   * 加载基础URL
   */
  loadBaseUrls() {
    try {
      const savedBaseUrls = localStorage.getItem(STORAGE_KEY);
      if (savedBaseUrls) {
        this.baseUrls = JSON.parse(savedBaseUrls);
      } else {
        // 使用默认基础URL
        this.baseUrls = [...DEFAULT_BASE_URLS];
        this.saveBaseUrls();
      }

      // 设置默认基础URL
      this.setDefaultBaseUrl();
    } catch (error) {
      console.error('加载基础URL失败:', error);
      this.baseUrls = [...DEFAULT_BASE_URLS];
      this.saveBaseUrls();
      this.setDefaultBaseUrl();
    }
  }

  /**
   * 保存基础URL
   */
  saveBaseUrls() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.baseUrls));
    } catch (error) {
      console.error('保存基础URL失败:', error);
    }
  }

  /**
   * 设置默认基础URL
   */
  setDefaultBaseUrl() {
    const defaultBaseUrl = this.baseUrls.find(baseUrl => baseUrl.isDefault);
    this.defaultBaseUrl = defaultBaseUrl || (this.baseUrls.length > 0 ? this.baseUrls[0] : null);
  }

  /**
   * 获取所有基础URL
   * @returns {Array} 基础URL数组
   */
  getAll() {
    return [...this.baseUrls];
  }

  /**
   * 获取默认基础URL
   * @returns {Object|null} 默认基础URL
   */
  getDefault() {
    return this.defaultBaseUrl;
  }

  /**
   * 获取基础URL
   * @param {string} id 基础URL ID
   * @returns {Object|null} 基础URL
   */
  get(id) {
    return this.baseUrls.find(baseUrl => baseUrl.id === id) || null;
  }

  /**
   * 添加基础URL
   * @param {Object} baseUrl 基础URL
   * @returns {boolean} 操作是否成功
   */
  add(baseUrl) {
    if (!baseUrl || !baseUrl.id || !baseUrl.url) {
      console.error('无效的基础URL');
      return false;
    }

    // 检查ID是否已存在
    if (this.baseUrls.some(item => item.id === baseUrl.id)) {
      console.error('基础URL ID已存在');
      return false;
    }

    // 如果设置为默认，将其他基础URL的默认标志设为false
    if (baseUrl.isDefault) {
      this.baseUrls.forEach(item => {
        item.isDefault = false;
      });
    }

    // 添加基础URL
    this.baseUrls.push(baseUrl);
    this.saveBaseUrls();
    this.setDefaultBaseUrl();
    return true;
  }

  /**
   * 更新基础URL
   * @param {string} id 基础URL ID
   * @param {Object} baseUrl 基础URL
   * @returns {boolean} 操作是否成功
   */
  update(id, baseUrl) {
    const index = this.baseUrls.findIndex(item => item.id === id);
    if (index === -1) {
      console.error('基础URL不存在');
      return false;
    }

    // 如果设置为默认，将其他基础URL的默认标志设为false
    if (baseUrl.isDefault) {
      this.baseUrls.forEach(item => {
        item.isDefault = false;
      });
    }

    // 更新基础URL
    this.baseUrls[index] = { ...this.baseUrls[index], ...baseUrl };
    this.saveBaseUrls();
    this.setDefaultBaseUrl();
    return true;
  }

  /**
   * 删除基础URL
   * @param {string} id 基础URL ID
   * @returns {boolean} 操作是否成功
   */
  remove(id) {
    const index = this.baseUrls.findIndex(item => item.id === id);
    if (index === -1) {
      console.error('基础URL不存在');
      return false;
    }

    // 删除基础URL
    this.baseUrls.splice(index, 1);
    this.saveBaseUrls();
    this.setDefaultBaseUrl();
    return true;
  }

  /**
   * 设置默认基础URL
   * @param {string} id 基础URL ID
   * @returns {boolean} 操作是否成功
   */
  setDefault(id) {
    const index = this.baseUrls.findIndex(item => item.id === id);
    if (index === -1) {
      console.error('基础URL不存在');
      return false;
    }

    // 将其他基础URL的默认标志设为false
    this.baseUrls.forEach(item => {
      item.isDefault = false;
    });

    // 设置默认基础URL
    this.baseUrls[index].isDefault = true;
    this.saveBaseUrls();
    this.setDefaultBaseUrl();
    return true;
  }
}

// 创建单例实例
const baseUrlManager = new BaseUrlManager();

export default baseUrlManager;
