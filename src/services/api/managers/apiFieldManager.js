/**
 * API 字段管理服务
 * 用于管理 API 响应数据的字段定义、转换和验证
 */

// 字段类型
export const FIELD_TYPES = {
  STRING: 'string',
  NUMBER: 'number',
  BOOLEAN: 'boolean',
  DATE: 'date',
  DATETIME: 'datetime',
  OBJECT: 'object',
  ARRAY: 'array',
  ENUM: 'enum'
};

// 字段格式化类型
export const FORMAT_TYPES = {
  NONE: 'none',
  CURRENCY: 'currency',
  PERCENTAGE: 'percentage',
  DECIMAL: 'decimal',
  INTEGER: 'integer',
  DATE: 'date',
  TIME: 'time',
  DATETIME: 'datetime',
  CUSTOM: 'custom'
};

class ApiFieldManager {
  constructor() {
    // 字段定义存储
    this.fieldDefinitions = {};
    
    // 加载已保存的字段定义
    this.loadFieldDefinitions();
  }
  
  /**
   * 加载已保存的字段定义
   */
  loadFieldDefinitions() {
    try {
      const savedDefinitions = localStorage.getItem('apiFieldDefinitions');
      if (savedDefinitions) {
        this.fieldDefinitions = JSON.parse(savedDefinitions);
        console.log(`已加载 ${Object.keys(this.fieldDefinitions).length} 个 API 字段定义`);
      }
    } catch (error) {
      console.error('加载 API 字段定义失败:', error);
      this.fieldDefinitions = {};
    }
  }
  
  /**
   * 保存字段定义到本地存储
   */
  saveFieldDefinitions() {
    try {
      localStorage.setItem('apiFieldDefinitions', JSON.stringify(this.fieldDefinitions));
    } catch (error) {
      console.error('保存 API 字段定义失败:', error);
    }
  }
  
  /**
   * 获取 API 的字段定义
   * @param {string} apiKey API 键名
   * @returns {Array} 字段定义数组
   */
  getFields(apiKey) {
    return this.fieldDefinitions[apiKey] || [];
  }
  
  /**
   * 设置 API 的字段定义
   * @param {string} apiKey API 键名
   * @param {Array} fields 字段定义数组
   */
  setFields(apiKey, fields) {
    if (!Array.isArray(fields)) {
      console.error('字段定义必须是数组');
      return false;
    }
    
    this.fieldDefinitions[apiKey] = fields;
    this.saveFieldDefinitions();
    return true;
  }
  
  /**
   * 添加字段定义
   * @param {string} apiKey API 键名
   * @param {Object} field 字段定义
   */
  addField(apiKey, field) {
    if (!field || !field.key) {
      console.error('字段定义无效');
      return false;
    }
    
    // 获取当前字段定义
    const fields = this.getFields(apiKey);
    
    // 检查字段是否已存在
    const existingIndex = fields.findIndex(f => f.key === field.key);
    if (existingIndex >= 0) {
      // 更新现有字段
      fields[existingIndex] = {
        ...fields[existingIndex],
        ...field
      };
    } else {
      // 添加新字段
      fields.push(field);
    }
    
    // 保存字段定义
    this.setFields(apiKey, fields);
    return true;
  }
  
  /**
   * 删除字段定义
   * @param {string} apiKey API 键名
   * @param {string} fieldKey 字段键名
   */
  removeField(apiKey, fieldKey) {
    // 获取当前字段定义
    const fields = this.getFields(apiKey);
    
    // 过滤掉要删除的字段
    const newFields = fields.filter(f => f.key !== fieldKey);
    
    // 保存字段定义
    this.setFields(apiKey, newFields);
    return true;
  }
  
  /**
   * 清除 API 的所有字段定义
   * @param {string} apiKey API 键名
   */
  clearFields(apiKey) {
    delete this.fieldDefinitions[apiKey];
    this.saveFieldDefinitions();
    return true;
  }
  
  /**
   * 自动检测字段
   * @param {string} apiKey API 键名
   * @param {Object|Array} data API 响应数据
   * @param {Object} options 选项
   * @returns {Array} 检测到的字段定义
   */
  detectFields(apiKey, data, options = {}) {
    if (!data) {
      return [];
    }
    
    // 如果数据是数组，使用第一个元素
    const sampleData = Array.isArray(data) ? data[0] : data;
    
    if (!sampleData || typeof sampleData !== 'object') {
      console.warn('无法检测字段: 数据不是对象');
      return [];
    }
    
    // 获取当前字段定义
    const existingFields = this.getFields(apiKey);
    
    // 提取字段
    const detectedFields = Object.keys(sampleData).map(key => {
      // 检查是否已存在该字段
      const existingField = existingFields.find(f => f.key === key);
      if (existingField) {
        return existingField;
      }
      
      // 创建新字段
      const value = sampleData[key];
      const type = this.detectFieldType(value);
      
      return {
        id: `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        key,
        label: this.generateFieldLabel(key),
        type,
        format: this.detectFieldFormat(value, type),
        unit: type === FIELD_TYPES.NUMBER ? '' : undefined,
        visible: true,
        sortable: true,
        filterable: true,
        editable: false,
        required: false,
        description: '',
        defaultValue: null,
        validation: null,
        options: type === FIELD_TYPES.ENUM ? this.detectEnumOptions(data, key) : undefined,
        color: this.generateRandomColor()
      };
    });
    
    // 如果选项中指定了保存，则保存检测到的字段
    if (options.save) {
      this.setFields(apiKey, detectedFields);
    }
    
    return detectedFields;
  }
  
  /**
   * 检测字段类型
   * @param {*} value 字段值
   * @returns {string} 字段类型
   */
  detectFieldType(value) {
    if (value === null || value === undefined) {
      return FIELD_TYPES.STRING;
    }
    
    const type = typeof value;
    
    if (type === 'string') {
      // 检查是否为日期
      if (this.isDateString(value)) {
        return FIELD_TYPES.DATE;
      }
      // 检查是否为日期时间
      if (this.isDateTimeString(value)) {
        return FIELD_TYPES.DATETIME;
      }
      return FIELD_TYPES.STRING;
    }
    
    if (type === 'number') {
      return FIELD_TYPES.NUMBER;
    }
    
    if (type === 'boolean') {
      return FIELD_TYPES.BOOLEAN;
    }
    
    if (type === 'object') {
      if (Array.isArray(value)) {
        return FIELD_TYPES.ARRAY;
      }
      return FIELD_TYPES.OBJECT;
    }
    
    return FIELD_TYPES.STRING;
  }
  
  /**
   * 检测字段格式
   * @param {*} value 字段值
   * @param {string} type 字段类型
   * @returns {string} 字段格式
   */
  detectFieldFormat(value, type) {
    if (type === FIELD_TYPES.NUMBER) {
      // 检查是否为整数
      if (Number.isInteger(value)) {
        return FORMAT_TYPES.INTEGER;
      }
      return FORMAT_TYPES.DECIMAL;
    }
    
    if (type === FIELD_TYPES.DATE) {
      return FORMAT_TYPES.DATE;
    }
    
    if (type === FIELD_TYPES.DATETIME) {
      return FORMAT_TYPES.DATETIME;
    }
    
    return FORMAT_TYPES.NONE;
  }
  
  /**
   * 检测枚举选项
   * @param {Object|Array} data API 响应数据
   * @param {string} key 字段键名
   * @returns {Array} 枚举选项
   */
  detectEnumOptions(data, key) {
    // 如果数据不是数组，转换为数组
    const dataArray = Array.isArray(data) ? data : [data];
    
    // 提取所有不同的值
    const values = new Set();
    dataArray.forEach(item => {
      if (item && item[key] !== undefined && item[key] !== null) {
        values.add(item[key]);
      }
    });
    
    // 转换为选项数组
    return Array.from(values).map(value => ({
      value,
      label: String(value)
    }));
  }
  
  /**
   * 生成字段标签
   * @param {string} key 字段键名
   * @returns {string} 字段标签
   */
  generateFieldLabel(key) {
    return key
      .replace(/_/g, ' ')
      .replace(/([A-Z])/g, ' $1')
      .replace(/\b\w/g, l => l.toUpperCase());
  }
  
  /**
   * 生成随机颜色
   * @returns {string} 颜色代码
   */
  generateRandomColor() {
    const colors = [
      '#2196F3', '#4CAF50', '#FF9800', '#E91E63', '#9C27B0',
      '#00BCD4', '#3F51B5', '#8BC34A', '#FFC107', '#607D8B',
      '#795548', '#9E9E9E', '#673AB7', '#FFEB3B', '#CDDC39'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }
  
  /**
   * 检查字符串是否为日期格式
   * @param {string} str 字符串
   * @returns {boolean} 是否为日期格式
   */
  isDateString(str) {
    // 简单的日期格式检查
    const dateRegex = /^\d{4}[-/]\d{1,2}[-/]\d{1,2}$/;
    if (!dateRegex.test(str)) {
      return false;
    }
    
    // 尝试解析日期
    const date = new Date(str);
    return !isNaN(date.getTime());
  }
  
  /**
   * 检查字符串是否为日期时间格式
   * @param {string} str 字符串
   * @returns {boolean} 是否为日期时间格式
   */
  isDateTimeString(str) {
    // 简单的日期时间格式检查
    const dateTimeRegex = /^\d{4}[-/]\d{1,2}[-/]\d{1,2}[T ]\d{1,2}:\d{1,2}(:\d{1,2})?(\.\d+)?(Z|[+-]\d{2}:?\d{2})?$/;
    if (!dateTimeRegex.test(str)) {
      return false;
    }
    
    // 尝试解析日期时间
    const date = new Date(str);
    return !isNaN(date.getTime());
  }
  
  /**
   * 根据字段定义转换数据
   * @param {string} apiKey API 键名
   * @param {Object|Array} data API 响应数据
   * @param {Object} options 选项
   * @returns {Object|Array} 转换后的数据
   */
  transformData(apiKey, data, options = {}) {
    if (!data) {
      return data;
    }
    
    // 获取字段定义
    const fields = this.getFields(apiKey);
    if (!fields || fields.length === 0) {
      return data;
    }
    
    // 如果数据是数组，转换每个元素
    if (Array.isArray(data)) {
      return data.map(item => this.transformObject(item, fields, options));
    }
    
    // 转换单个对象
    return this.transformObject(data, fields, options);
  }
  
  /**
   * 转换对象
   * @param {Object} obj 对象
   * @param {Array} fields 字段定义
   * @param {Object} options 选项
   * @returns {Object} 转换后的对象
   */
  transformObject(obj, fields, options) {
    if (!obj || typeof obj !== 'object') {
      return obj;
    }
    
    const result = {};
    
    // 处理每个字段
    fields.forEach(field => {
      // 如果选项中指定了只包含可见字段，且字段不可见，则跳过
      if (options.visibleOnly && field.visible === false) {
        return;
      }
      
      // 获取字段值
      const value = obj[field.key];
      
      // 转换字段值
      result[field.key] = this.transformValue(value, field);
    });
    
    return result;
  }
  
  /**
   * 转换字段值
   * @param {*} value 字段值
   * @param {Object} field 字段定义
   * @returns {*} 转换后的值
   */
  transformValue(value, field) {
    // 如果值为 null 或 undefined，返回默认值或原值
    if (value === null || value === undefined) {
      return field.defaultValue !== undefined ? field.defaultValue : value;
    }
    
    // 根据字段类型转换值
    switch (field.type) {
      case FIELD_TYPES.NUMBER:
        return this.transformNumber(value, field);
      case FIELD_TYPES.DATE:
      case FIELD_TYPES.DATETIME:
        return this.transformDate(value, field);
      case FIELD_TYPES.BOOLEAN:
        return Boolean(value);
      case FIELD_TYPES.STRING:
        return String(value);
      default:
        return value;
    }
  }
  
  /**
   * 转换数字
   * @param {*} value 字段值
   * @param {Object} field 字段定义
   * @returns {number} 转换后的数字
   */
  transformNumber(value, field) {
    // 转换为数字
    const num = Number(value);
    
    // 如果转换失败，返回默认值或 0
    if (isNaN(num)) {
      return field.defaultValue !== undefined ? field.defaultValue : 0;
    }
    
    return num;
  }
  
  /**
   * 转换日期
   * @param {*} value 字段值
   * @param {Object} field 字段定义
   * @returns {Date} 转换后的日期
   */
  transformDate(value, field) {
    // 如果已经是 Date 对象，直接返回
    if (value instanceof Date) {
      return value;
    }
    
    // 尝试转换为 Date 对象
    const date = new Date(value);
    
    // 如果转换失败，返回默认值或当前日期
    if (isNaN(date.getTime())) {
      return field.defaultValue !== undefined ? field.defaultValue : new Date();
    }
    
    return date;
  }
}

// 创建单例
const apiFieldManager = new ApiFieldManager();

export default apiFieldManager;
