/**
 * 简单的事件发射器工具
 * 用于在应用程序的不同部分之间进行通信
 * 与移动端的EventRegister保持一致的API
 */

class EventEmitterClass {
  constructor() {
    this.events = {};
    this.eventId = 0;
  }

  /**
   * 添加事件监听器
   * @param {string} eventName 事件名称
   * @param {Function} callback 回调函数
   * @returns {number} 事件ID，用于移除监听器
   */
  addEventListener(eventName, callback) {
    if (!this.events[eventName]) {
      this.events[eventName] = {};
    }

    const eventId = ++this.eventId;
    this.events[eventName][eventId] = callback;
    return eventId;
  }

  /**
   * 移除事件监听器
   * @param {number} id 事件ID
   * @returns {boolean} 是否成功移除
   */
  removeEventListener(id) {
    for (const eventName in this.events) {
      if (this.events[eventName][id]) {
        delete this.events[eventName][id];
        return true;
      }
    }
    return false;
  }

  /**
   * 移除特定事件的所有监听器
   * @param {string} eventName 事件名称
   * @returns {boolean} 是否成功移除
   */
  removeAllListeners(eventName) {
    if (this.events[eventName]) {
      delete this.events[eventName];
      return true;
    }
    return false;
  }

  /**
   * 触发事件
   * @param {string} eventName 事件名称
   * @param {any} data 事件数据
   */
  emit(eventName, data) {
    if (this.events[eventName]) {
      Object.keys(this.events[eventName]).forEach(id => {
        this.events[eventName][id](data);
      });
    }
  }

  /**
   * 添加一次性事件监听器
   * @param {string} eventName 事件名称
   * @param {Function} callback 回调函数
   * @returns {number} 事件ID
   */
  once(eventName, callback) {
    const id = this.addEventListener(eventName, (data) => {
      callback(data);
      this.removeEventListener(id);
    });
    return id;
  }
}

// 创建单例实例
const eventEmitterInstance = new EventEmitterClass();

// 导出单例实例
export const EventEmitter = eventEmitterInstance;

// 为了与移动端代码兼容，提供相同的API
export const EventRegister = {
  addEventListener: (eventName, callback) => eventEmitterInstance.addEventListener(eventName, callback),
  removeEventListener: (id) => eventEmitterInstance.removeEventListener(id),
  emit: (eventName, data) => eventEmitterInstance.emit(eventName, data),
  once: (eventName, callback) => eventEmitterInstance.once(eventName, callback),
  removeAllListeners: (eventName) => eventEmitterInstance.removeAllListeners(eventName)
};

export default eventEmitterInstance;
