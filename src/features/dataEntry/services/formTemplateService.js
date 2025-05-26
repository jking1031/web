/**
 * 表单模板服务
 * 负责与Node-RED后端的表单模板相关API交互
 */

import apiManager from '../../../services/api/core/apiManager';

class FormTemplateService {
  constructor() {
    this.baseUrl = 'https://nodered.jzz77.cn:9003/api';
    this.registerApis();
  }

  /**
   * 注册API端点
   */
  registerApis() {
    // 检查API是否已注册，避免重复注册
    if (!apiManager.registry.get('getFormTemplates')) {
      // 获取表单模板列表
      apiManager.registry.register('getFormTemplates', {
        name: '获取表单模板列表',
        url: `${this.baseUrl}/form-templates`,
        method: 'GET',
        category: 'form',
        status: 'enabled',
        description: '获取所有表单模板',
        timeout: 15000,
        retries: 2,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
    }

    if (!apiManager.registry.get('getFormTemplate')) {
      // 获取单个表单模板
      apiManager.registry.register('getFormTemplate', {
        name: '获取表单模板详情',
        url: `${this.baseUrl}/form-templates`,
        method: 'GET',
        category: 'form',
        status: 'enabled',
        description: '根据ID获取表单模板详情',
        timeout: 10000,
        retries: 2,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
    }

    if (!apiManager.registry.get('createFormTemplate')) {
      // 创建表单模板
      apiManager.registry.register('createFormTemplate', {
        name: '创建表单模板',
        url: `${this.baseUrl}/form-templates`,
        method: 'POST',
        category: 'form',
        status: 'enabled',
        description: '创建新的表单模板',
        timeout: 20000,
        retries: 1,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
    }

    if (!apiManager.registry.get('updateFormTemplate')) {
      // 更新表单模板
      apiManager.registry.register('updateFormTemplate', {
        name: '更新表单模板',
        url: `${this.baseUrl}/form-templates`,
        method: 'PUT',
        category: 'form',
        status: 'enabled',
        description: '更新表单模板',
        timeout: 20000,
        retries: 1,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
    }

    if (!apiManager.registry.get('deleteFormTemplate')) {
      // 删除表单模板
      apiManager.registry.register('deleteFormTemplate', {
        name: '删除表单模板',
        url: `${this.baseUrl}/form-templates`,
        method: 'DELETE',
        category: 'form',
        status: 'enabled',
        description: '删除表单模板',
        timeout: 15000,
        retries: 1,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
    }

    if (!apiManager.registry.get('publishFormTemplate')) {
      // 发布表单模板
      apiManager.registry.register('publishFormTemplate', {
        name: '发布表单模板',
        url: `${this.baseUrl}/form-templates/publish`,
        method: 'POST',
        category: 'form',
        status: 'enabled',
        description: '发布表单模板供用户使用',
        timeout: 15000,
        retries: 1,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
    }

    if (!apiManager.registry.get('archiveFormTemplate')) {
      // 归档表单模板
      apiManager.registry.register('archiveFormTemplate', {
        name: '归档表单模板',
        url: `${this.baseUrl}/form-templates/archive`,
        method: 'POST',
        category: 'form',
        status: 'enabled',
        description: '归档表单模板',
        timeout: 15000,
        retries: 1,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
    }

    if (!apiManager.registry.get('copyFormTemplate')) {
      // 复制表单模板
      apiManager.registry.register('copyFormTemplate', {
        name: '复制表单模板',
        url: `${this.baseUrl}/form-templates/copy`,
        method: 'POST',
        category: 'form',
        status: 'enabled',
        description: '复制表单模板',
        timeout: 20000,
        retries: 1,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
    }

    if (!apiManager.registry.get('getFormCategories')) {
      // 获取表单分类
      apiManager.registry.register('getFormCategories', {
        name: '获取表单分类',
        url: `${this.baseUrl}/form-categories`,
        method: 'GET',
        category: 'form',
        status: 'enabled',
        description: '获取所有表单分类',
        timeout: 10000,
        retries: 2,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
    }

    if (!apiManager.registry.get('getTemplateStats')) {
      // 获取模板统计信息
      apiManager.registry.register('getTemplateStats', {
        name: '获取模板统计信息',
        url: `${this.baseUrl}/form-templates/stats`,
        method: 'GET',
        category: 'form',
        status: 'enabled',
        description: '获取表单模板统计信息',
        timeout: 10000,
        retries: 2,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
    }

    if (!apiManager.registry.get('validateFormTemplate')) {
      // 验证表单模板
      apiManager.registry.register('validateFormTemplate', {
        name: '验证表单模板',
        url: `${this.baseUrl}/form-templates/validate`,
        method: 'POST',
        category: 'form',
        status: 'enabled',
        description: '验证表单模板Schema',
        timeout: 10000,
        retries: 1,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
    }
  }

  /**
   * 获取表单模板列表
   * @param {Object} params - 查询参数
   * @returns {Promise<Object>} API响应
   */
  async getTemplates(params = {}) {
    try {
      console.log('获取表单模板列表，参数:', params);
      
      const response = await apiManager.call('getFormTemplates', params, {
        showError: true,
        showLoading: false
      });
      
      console.log('表单模板列表响应:', response);
      return response;
    } catch (error) {
      console.error('获取表单模板列表失败:', error);
      
      // 返回模拟数据以便开发测试
      if (process.env.NODE_ENV === 'development') {
        console.warn('使用模拟数据');
        return this.getMockTemplates(params);
      }
      
      throw error;
    }
  }

  /**
   * 获取表单模板详情
   * @param {string} id - 模板ID
   * @returns {Promise<Object>} API响应
   */
  async getTemplate(id) {
    try {
      console.log('获取表单模板详情，ID:', id);
      
      const response = await apiManager.call('getFormTemplate', { 
        templateId: id 
      }, {
        showError: true,
        showLoading: true
      });
      
      console.log('表单模板详情响应:', response);
      return response;
    } catch (error) {
      console.error('获取表单模板详情失败:', error);
      
      // 返回模拟数据以便开发测试
      if (process.env.NODE_ENV === 'development') {
        console.warn('使用模拟数据');
        return this.getMockTemplate(id);
      }
      
      throw error;
    }
  }

  /**
   * 创建表单模板
   * @param {Object} templateData - 模板数据
   * @returns {Promise<Object>} API响应
   */
  async createTemplate(templateData) {
    try {
      console.log('创建表单模板，数据:', templateData);
      
      // 数据预处理
      const processedData = this.preprocessTemplateData(templateData);
      
      const response = await apiManager.call('createFormTemplate', processedData, {
        showError: true,
        showLoading: true
      });
      
      console.log('创建表单模板响应:', response);
      return response;
    } catch (error) {
      console.error('创建表单模板失败:', error);
      
      // 开发环境返回模拟成功响应
      if (process.env.NODE_ENV === 'development') {
        console.warn('使用模拟响应');
        return {
          success: true,
          data: {
            id: `template_${Date.now()}`,
            ...templateData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        };
      }
      
      throw error;
    }
  }

  /**
   * 更新表单模板
   * @param {string} id - 模板ID
   * @param {Object} templateData - 模板数据
   * @returns {Promise<Object>} API响应
   */
  async updateTemplate(id, templateData) {
    try {
      console.log('更新表单模板，ID:', id, '数据:', templateData);
      
      // 数据预处理
      const processedData = this.preprocessTemplateData(templateData);
      
      const response = await apiManager.call('updateFormTemplate', 
        { templateId: id, ...processedData }, 
        { 
          showError: true,
          showLoading: true 
        }
      );
      
      console.log('更新表单模板响应:', response);
      return response;
    } catch (error) {
      console.error('更新表单模板失败:', error);
      
      // 开发环境返回模拟成功响应
      if (process.env.NODE_ENV === 'development') {
        console.warn('使用模拟响应');
        return {
          success: true,
          data: {
            id: id,
            ...templateData,
            updatedAt: new Date().toISOString()
          }
        };
      }
      
      throw error;
    }
  }

  /**
   * 删除表单模板
   * @param {string} id - 模板ID
   * @returns {Promise<Object>} API响应
   */
  async deleteTemplate(id) {
    try {
      console.log('删除表单模板，ID:', id);
      
      const response = await apiManager.call('deleteFormTemplate', { 
        templateId: id 
      }, {
        showError: true,
        showLoading: true
      });
      
      console.log('删除表单模板响应:', response);
      return response;
    } catch (error) {
      console.error('删除表单模板失败:', error);
      
      // 开发环境返回模拟成功响应
      if (process.env.NODE_ENV === 'development') {
        console.warn('使用模拟响应');
        return { success: true };
      }
      
      throw error;
    }
  }

  /**
   * 发布表单模板
   * @param {string} id - 模板ID
   * @returns {Promise<Object>} API响应
   */
  async publishTemplate(id) {
    try {
      console.log('发布表单模板，ID:', id);
      
      const response = await apiManager.call('publishFormTemplate', { 
        templateId: id 
      }, {
        showError: true,
        showLoading: true
      });
      
      console.log('发布表单模板响应:', response);
      return response;
    } catch (error) {
      console.error('发布表单模板失败:', error);
      
      // 开发环境返回模拟成功响应
      if (process.env.NODE_ENV === 'development') {
        console.warn('使用模拟响应');
        return { 
          success: true,
          data: { status: 'published' }
        };
      }
      
      throw error;
    }
  }

  /**
   * 归档表单模板
   * @param {string} id - 模板ID
   * @returns {Promise<Object>} API响应
   */
  async archiveTemplate(id) {
    try {
      console.log('归档表单模板，ID:', id);
      
      const response = await apiManager.call('archiveFormTemplate', { 
        templateId: id 
      }, {
        showError: true,
        showLoading: true
      });
      
      console.log('归档表单模板响应:', response);
      return response;
    } catch (error) {
      console.error('归档表单模板失败:', error);
      
      // 开发环境返回模拟成功响应
      if (process.env.NODE_ENV === 'development') {
        console.warn('使用模拟响应');
        return { 
          success: true,
          data: { status: 'archived' }
        };
      }
      
      throw error;
    }
  }

  /**
   * 复制表单模板
   * @param {string} id - 模板ID
   * @param {Object} options - 复制选项
   * @returns {Promise<Object>} API响应
   */
  async copyTemplate(id, options = {}) {
    try {
      console.log('复制表单模板，ID:', id, '选项:', options);
      
      const response = await apiManager.call('copyFormTemplate', { 
        templateId: id,
        ...options
      }, {
        showError: true,
        showLoading: true
      });
      
      console.log('复制表单模板响应:', response);
      return response;
    } catch (error) {
      console.error('复制表单模板失败:', error);
      
      // 开发环境返回模拟成功响应
      if (process.env.NODE_ENV === 'development') {
        console.warn('使用模拟响应');
        return { 
          success: true,
          data: {
            id: `template_copy_${Date.now()}`,
            name: `${options.name || '模板副本'}`,
            status: 'draft'
          }
        };
      }
      
      throw error;
    }
  }

  /**
   * 获取表单分类
   * @returns {Promise<Object>} API响应
   */
  async getCategories() {
    try {
      console.log('获取表单分类');
      
      const response = await apiManager.call('getFormCategories', {}, {
        showError: true,
        showLoading: false
      });
      
      console.log('表单分类响应:', response);
      return response;
    } catch (error) {
      console.error('获取表单分类失败:', error);
      
      // 返回模拟数据以便开发测试
      if (process.env.NODE_ENV === 'development') {
        console.warn('使用模拟数据');
        return this.getMockCategories();
      }
      
      throw error;
    }
  }

  /**
   * 获取模板统计信息
   * @param {Object} params - 查询参数
   * @returns {Promise<Object>} API响应
   */
  async getStats(params = {}) {
    try {
      console.log('获取模板统计信息，参数:', params);
      
      const response = await apiManager.call('getTemplateStats', params, {
        showError: true,
        showLoading: false
      });
      
      console.log('模板统计信息响应:', response);
      return response;
    } catch (error) {
      console.error('获取模板统计信息失败:', error);
      
      // 返回模拟数据以便开发测试
      if (process.env.NODE_ENV === 'development') {
        console.warn('使用模拟数据');
        return this.getMockStats();
      }
      
      throw error;
    }
  }

  /**
   * 验证表单模板
   * @param {Object} schema - 表单Schema
   * @returns {Promise<Object>} API响应
   */
  async validateTemplate(schema) {
    try {
      console.log('验证表单模板，Schema:', schema);
      
      const response = await apiManager.call('validateFormTemplate', { 
        schema 
      }, {
        showError: true,
        showLoading: false
      });
      
      console.log('验证表单模板响应:', response);
      return response;
    } catch (error) {
      console.error('验证表单模板失败:', error);
      
      // 开发环境返回模拟成功响应
      if (process.env.NODE_ENV === 'development') {
        console.warn('使用模拟响应');
        return { 
          success: true,
          data: { valid: true }
        };
      }
      
      throw error;
    }
  }

  /**
   * 预处理模板数据
   * @param {Object} templateData - 原始模板数据
   * @returns {Object} 处理后的模板数据
   */
  preprocessTemplateData(templateData) {
    const processed = { ...templateData };
    
    // 确保schema是对象而不是字符串
    if (typeof processed.schema === 'string') {
      try {
        processed.schema = JSON.parse(processed.schema);
      } catch (e) {
        console.warn('Schema解析失败，使用原始数据');
      }
    }
    
    // 确保permissions是数组
    if (processed.permissions && !Array.isArray(processed.permissions)) {
      processed.permissions = [processed.permissions];
    }
    
    // 添加时间戳
    if (!processed.createdAt) {
      processed.createdAt = new Date().toISOString();
    }
    processed.updatedAt = new Date().toISOString();
    
    // 生成ID（如果没有）
    if (!processed.id) {
      processed.id = `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    return processed;
  }

  // 以下是模拟数据方法，用于开发测试
  getMockTemplates(params) {
    const mockTemplates = [
      {
        id: 'template_001',
        name: '化验数据填报表',
        description: '用于填报日常化验数据，包括进出水水质指标',
        category: 'lab_data',
        version: '1.0.0',
        status: 'published',
        createdBy: 'admin',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        permissions: ['user', 'admin']
      },
      {
        id: 'template_002',
        name: 'AO池运行数据表',
        description: '用于填报AO池日常运行数据',
        category: 'operation_data',
        version: '1.0.0',
        status: 'published',
        createdBy: 'admin',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        permissions: ['user', 'admin']
      }
    ];

    return {
      success: true,
      data: {
        items: mockTemplates,
        total: mockTemplates.length,
        page: parseInt(params.page || 1),
        pageSize: parseInt(params.pageSize || 10)
      }
    };
  }

  getMockTemplate(id) {
    return {
      success: true,
      data: {
        id: id,
        name: '测试模板',
        description: '这是一个测试模板',
        category: 'lab_data',
        version: '1.0.0',
        status: 'published',
        createdBy: 'admin',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        permissions: ['user', 'admin'],
        schema: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              title: '姓名',
              'x-component': 'Input'
            }
          }
        }
      }
    };
  }

  getMockCategories() {
    return {
      success: true,
      data: [
        {
          id: 'lab_data',
          name: '化验数据',
          description: '化验相关的数据填报表单',
          icon: 'ExperimentOutlined',
          order: 1
        },
        {
          id: 'operation_data',
          name: '运行数据',
          description: '设备运行相关的数据填报表单',
          icon: 'SettingOutlined',
          order: 2
        }
      ]
    };
  }

  getMockStats() {
    return {
      success: true,
      data: {
        total: 10,
        published: 8,
        draft: 2,
        archived: 0
      }
    };
  }
}

export default new FormTemplateService(); 