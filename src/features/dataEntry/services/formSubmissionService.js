/**
 * 表单提交服务
 * 负责与Node-RED后端的表单提交相关API交互
 */

import apiManager from '../../../services/api/core/apiManager';

class FormSubmissionService {
  constructor() {
    this.baseUrl = 'https://nodered.jzz77.cn:9003/api';
    this.registerApis();
  }

  /**
   * 注册API端点
   */
  registerApis() {
    // 检查API是否已注册，避免重复注册
    if (!apiManager.registry.get('submitFormData')) {
      // 提交表单数据
      apiManager.registry.register('submitFormData', {
        name: '提交表单数据',
        url: `${this.baseUrl}/form-submissions`,
        method: 'POST',
        category: 'form',
        status: 'enabled',
        description: '提交表单填报数据',
        timeout: 20000,
        retries: 1,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
    }

    if (!apiManager.registry.get('getFormSubmissions')) {
      // 获取表单提交列表
      apiManager.registry.register('getFormSubmissions', {
        name: '获取表单提交列表',
        url: `${this.baseUrl}/form-submissions`,
        method: 'GET',
        category: 'form',
        status: 'enabled',
        description: '获取表单提交记录列表',
        timeout: 15000,
        retries: 2,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
    }

    if (!apiManager.registry.get('getFormSubmission')) {
      // 获取单个表单提交详情
      apiManager.registry.register('getFormSubmission', {
        name: '获取表单提交详情',
        url: `${this.baseUrl}/form-submissions`,
        method: 'GET',
        category: 'form',
        status: 'enabled',
        description: '根据ID获取表单提交详情',
        timeout: 10000,
        retries: 2,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
    }

    if (!apiManager.registry.get('updateSubmissionStatus')) {
      // 更新表单提交状态
      apiManager.registry.register('updateSubmissionStatus', {
        name: '更新表单提交状态',
        url: `${this.baseUrl}/form-submissions/status`,
        method: 'PUT',
        category: 'form',
        status: 'enabled',
        description: '更新表单提交的审核状态',
        timeout: 15000,
        retries: 1,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
    }

    if (!apiManager.registry.get('deleteFormSubmission')) {
      // 删除表单提交
      apiManager.registry.register('deleteFormSubmission', {
        name: '删除表单提交',
        url: `${this.baseUrl}/form-submissions`,
        method: 'DELETE',
        category: 'form',
        status: 'enabled',
        description: '删除表单提交记录',
        timeout: 15000,
        retries: 1,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
    }

    if (!apiManager.registry.get('saveDraftSubmission')) {
      // 保存草稿
      apiManager.registry.register('saveDraftSubmission', {
        name: '保存表单草稿',
        url: `${this.baseUrl}/form-submissions/draft`,
        method: 'POST',
        category: 'form',
        status: 'enabled',
        description: '保存表单填报草稿',
        timeout: 15000,
        retries: 1,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
    }

    if (!apiManager.registry.get('updateDraftSubmission')) {
      // 更新草稿
      apiManager.registry.register('updateDraftSubmission', {
        name: '更新表单草稿',
        url: `${this.baseUrl}/form-submissions/draft`,
        method: 'PUT',
        category: 'form',
        status: 'enabled',
        description: '更新表单填报草稿',
        timeout: 15000,
        retries: 1,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
    }

    if (!apiManager.registry.get('exportFormSubmissions')) {
      // 导出表单提交数据
      apiManager.registry.register('exportFormSubmissions', {
        name: '导出表单提交数据',
        url: `${this.baseUrl}/form-submissions/export`,
        method: 'POST',
        category: 'form',
        status: 'enabled',
        description: '导出表单提交数据为Excel',
        timeout: 60000,
        retries: 1,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
    }

    if (!apiManager.registry.get('getSubmissionStats')) {
      // 获取用户的表单提交统计
      apiManager.registry.register('getSubmissionStats', {
        name: '获取表单提交统计',
        url: `${this.baseUrl}/form-submissions/stats`,
        method: 'GET',
        category: 'form',
        status: 'enabled',
        description: '获取表单提交统计信息',
        timeout: 10000,
        retries: 2,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
    }

    if (!apiManager.registry.get('batchUpdateSubmissions')) {
      // 批量更新提交状态
      apiManager.registry.register('batchUpdateSubmissions', {
        name: '批量更新提交状态',
        url: `${this.baseUrl}/form-submissions/batch-update`,
        method: 'PUT',
        category: 'form',
        status: 'enabled',
        description: '批量更新表单提交状态',
        timeout: 30000,
        retries: 1,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
    }

    if (!apiManager.registry.get('validateSubmissionData')) {
      // 验证提交数据
      apiManager.registry.register('validateSubmissionData', {
        name: '验证提交数据',
        url: `${this.baseUrl}/form-submissions/validate`,
        method: 'POST',
        category: 'form',
        status: 'enabled',
        description: '验证表单提交数据',
        timeout: 10000,
        retries: 1,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
    }

    if (!apiManager.registry.get('getSubmissionHistory')) {
      // 获取提交历史记录
      apiManager.registry.register('getSubmissionHistory', {
        name: '获取提交历史记录',
        url: `${this.baseUrl}/form-submissions/history`,
        method: 'GET',
        category: 'form',
        status: 'enabled',
        description: '获取表单提交历史记录',
        timeout: 15000,
        retries: 2,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
    }
  }

  /**
   * 提交表单数据
   * @param {Object} submissionData - 提交数据
   * @returns {Promise<Object>} API响应
   */
  async submitForm(submissionData) {
    try {
      console.log('提交表单数据，数据:', submissionData);
      
      // 数据预处理
      const processedData = this.preprocessSubmissionData(submissionData);
      
      const response = await apiManager.call('submitFormData', processedData, {
        showError: true,
        showLoading: true
      });
      
      console.log('提交表单数据响应:', response);
      return response;
    } catch (error) {
      console.error('提交表单数据失败:', error);
      
      // 开发环境返回模拟成功响应
      if (process.env.NODE_ENV === 'development') {
        console.warn('使用模拟响应');
        return {
          success: true,
          data: {
            id: `submission_${Date.now()}`,
            ...submissionData,
            status: 'pending',
            submittedAt: new Date().toISOString()
          }
        };
      }
      
      throw error;
    }
  }

  /**
   * 保存表单草稿
   * @param {Object} draftData - 草稿数据
   * @returns {Promise<Object>} API响应
   */
  async saveDraft(draftData) {
    try {
      console.log('保存表单草稿，数据:', draftData);
      
      // 数据预处理
      const processedData = this.preprocessSubmissionData(draftData, 'draft');
      
      const response = await apiManager.call('saveDraftSubmission', processedData, {
        showError: true,
        showLoading: false
      });
      
      console.log('保存表单草稿响应:', response);
      return response;
    } catch (error) {
      console.error('保存表单草稿失败:', error);
      
      // 开发环境返回模拟成功响应
      if (process.env.NODE_ENV === 'development') {
        console.warn('使用模拟响应');
        return {
          success: true,
          data: {
            id: `draft_${Date.now()}`,
            ...draftData,
            status: 'draft',
            savedAt: new Date().toISOString()
          }
        };
      }
      
      throw error;
    }
  }

  /**
   * 更新表单草稿
   * @param {string} id - 草稿ID
   * @param {Object} draftData - 草稿数据
   * @returns {Promise<Object>} API响应
   */
  async updateDraft(id, draftData) {
    try {
      console.log('更新表单草稿，ID:', id, '数据:', draftData);
      
      // 数据预处理
      const processedData = this.preprocessSubmissionData(draftData, 'draft');
      
      const response = await apiManager.call('updateDraftSubmission', 
        { submissionId: id, ...processedData }, 
        {
          showError: true,
          showLoading: false
        }
      );
      
      console.log('更新表单草稿响应:', response);
      return response;
    } catch (error) {
      console.error('更新表单草稿失败:', error);
      
      // 开发环境返回模拟成功响应
      if (process.env.NODE_ENV === 'development') {
        console.warn('使用模拟响应');
        return {
          success: true,
          data: {
            id: id,
            ...draftData,
            status: 'draft',
            updatedAt: new Date().toISOString()
          }
        };
      }
      
      throw error;
    }
  }

  /**
   * 获取表单提交列表
   * @param {Object} params - 查询参数
   * @returns {Promise<Object>} API响应
   */
  async getSubmissions(params = {}) {
    try {
      console.log('获取表单提交列表，参数:', params);
      
      const response = await apiManager.call('getFormSubmissions', params, {
        showError: true,
        showLoading: false
      });
      
      console.log('表单提交列表响应:', response);
      return response;
    } catch (error) {
      console.error('获取表单提交列表失败:', error);
      
      // 返回模拟数据以便开发测试
      if (process.env.NODE_ENV === 'development') {
        console.warn('使用模拟数据');
        return this.getMockSubmissions(params);
      }
      
      throw error;
    }
  }

  /**
   * 获取表单提交详情
   * @param {string} id - 提交ID
   * @returns {Promise<Object>} API响应
   */
  async getSubmission(id) {
    try {
      console.log('获取表单提交详情，ID:', id);
      
      const response = await apiManager.call('getFormSubmission', { 
        submissionId: id 
      }, {
        showError: true,
        showLoading: true
      });
      
      console.log('表单提交详情响应:', response);
      return response;
    } catch (error) {
      console.error('获取表单提交详情失败:', error);
      
      // 返回模拟数据以便开发测试
      if (process.env.NODE_ENV === 'development') {
        console.warn('使用模拟数据');
        return this.getMockSubmission(id);
      }
      
      throw error;
    }
  }

  /**
   * 更新表单提交状态
   * @param {string} id - 提交ID
   * @param {Object} statusData - 状态数据
   * @returns {Promise<Object>} API响应
   */
  async updateStatus(id, statusData) {
    try {
      console.log('更新表单提交状态，ID:', id, '状态数据:', statusData);
      
      const response = await apiManager.call('updateSubmissionStatus', 
        { submissionId: id, ...statusData }, 
        { 
          showError: true,
          showLoading: true 
        }
      );
      
      console.log('更新表单提交状态响应:', response);
      return response;
    } catch (error) {
      console.error('更新表单提交状态失败:', error);
      
      // 开发环境返回模拟成功响应
      if (process.env.NODE_ENV === 'development') {
        console.warn('使用模拟响应');
        return {
          success: true,
          data: {
            id: id,
            ...statusData,
            updatedAt: new Date().toISOString()
          }
        };
      }
      
      throw error;
    }
  }

  /**
   * 批量更新提交状态
   * @param {Array} submissionIds - 提交ID数组
   * @param {Object} statusData - 状态数据
   * @returns {Promise<Object>} API响应
   */
  async batchUpdateStatus(submissionIds, statusData) {
    try {
      console.log('批量更新提交状态，IDs:', submissionIds, '状态数据:', statusData);
      
      const response = await apiManager.call('batchUpdateSubmissions', 
        { submissionIds, ...statusData }, 
        { 
          showError: true,
          showLoading: true 
        }
      );
      
      console.log('批量更新提交状态响应:', response);
      return response;
    } catch (error) {
      console.error('批量更新提交状态失败:', error);
      
      // 开发环境返回模拟成功响应
      if (process.env.NODE_ENV === 'development') {
        console.warn('使用模拟响应');
        return {
          success: true,
          data: {
            updated: submissionIds.length,
            failed: 0
          }
        };
      }
      
      throw error;
    }
  }

  /**
   * 删除表单提交
   * @param {string} id - 提交ID
   * @returns {Promise<Object>} API响应
   */
  async deleteSubmission(id) {
    try {
      console.log('删除表单提交，ID:', id);
      
      const response = await apiManager.call('deleteFormSubmission', { 
        submissionId: id 
      }, {
        showError: true,
        showLoading: true
      });
      
      console.log('删除表单提交响应:', response);
      return response;
    } catch (error) {
      console.error('删除表单提交失败:', error);
      
      // 开发环境返回模拟成功响应
      if (process.env.NODE_ENV === 'development') {
        console.warn('使用模拟响应');
        return { success: true };
      }
      
      throw error;
    }
  }

  /**
   * 验证提交数据
   * @param {Object} submissionData - 提交数据
   * @returns {Promise<Object>} API响应
   */
  async validateSubmission(submissionData) {
    try {
      console.log('验证提交数据，数据:', submissionData);
      
      const response = await apiManager.call('validateSubmissionData', submissionData, {
        showError: true,
        showLoading: false
      });
      
      console.log('验证提交数据响应:', response);
      return response;
    } catch (error) {
      console.error('验证提交数据失败:', error);
      
      // 开发环境返回模拟成功响应
      if (process.env.NODE_ENV === 'development') {
        console.warn('使用模拟响应');
        return {
          success: true,
          data: {
            valid: true,
            errors: []
          }
        };
      }
      
      throw error;
    }
  }

  /**
   * 导出表单提交数据
   * @param {Object} exportParams - 导出参数
   * @returns {Promise<Object>} API响应
   */
  async exportSubmissions(exportParams) {
    try {
      console.log('导出表单提交数据，参数:', exportParams);
      
      const response = await apiManager.call('exportFormSubmissions', exportParams, {
        showError: true,
        showLoading: true
      });
      
      console.log('导出表单提交数据响应:', response);
      return response;
    } catch (error) {
      console.error('导出表单提交数据失败:', error);
      
      // 开发环境返回模拟成功响应
      if (process.env.NODE_ENV === 'development') {
        console.warn('使用模拟响应');
        return {
          success: true,
          data: {
            downloadUrl: '/mock/export.xlsx',
            filename: 'form_submissions_export.xlsx'
          }
        };
      }
      
      throw error;
    }
  }

  /**
   * 获取表单提交统计
   * @param {Object} params - 查询参数
   * @returns {Promise<Object>} API响应
   */
  async getStats(params = {}) {
    try {
      console.log('获取表单提交统计，参数:', params);
      
      const response = await apiManager.call('getSubmissionStats', params, {
        showError: true,
        showLoading: false
      });
      
      console.log('表单提交统计响应:', response);
      return response;
    } catch (error) {
      console.error('获取表单提交统计失败:', error);
      
      // 返回模拟数据以便开发测试
      if (process.env.NODE_ENV === 'development') {
        console.warn('使用模拟数据');
        return this.getMockStats();
      }
      
      throw error;
    }
  }

  /**
   * 获取提交历史记录
   * @param {Object} params - 查询参数
   * @returns {Promise<Object>} API响应
   */
  async getHistory(params = {}) {
    try {
      console.log('获取提交历史记录，参数:', params);
      
      const response = await apiManager.call('getSubmissionHistory', params, {
        showError: true,
        showLoading: false
      });
      
      console.log('提交历史记录响应:', response);
      return response;
    } catch (error) {
      console.error('获取提交历史记录失败:', error);
      
      // 返回模拟数据以便开发测试
      if (process.env.NODE_ENV === 'development') {
        console.warn('使用模拟数据');
        return this.getMockHistory(params);
      }
      
      throw error;
    }
  }

  /**
   * 预处理提交数据
   * @param {Object} submissionData - 原始提交数据
   * @param {string} status - 状态 (draft/pending/submitted)
   * @returns {Object} 处理后的提交数据
   */
  preprocessSubmissionData(submissionData, status = 'pending') {
    const processed = { ...submissionData };
    
    // 确保data是对象而不是字符串
    if (typeof processed.data === 'string') {
      try {
        processed.data = JSON.parse(processed.data);
      } catch (e) {
        console.warn('数据解析失败，使用原始数据');
      }
    }
    
    // 设置状态
    processed.status = status;
    
    // 添加时间戳
    const now = new Date().toISOString();
    if (status === 'draft') {
      processed.savedAt = now;
    } else {
      processed.submittedAt = now;
    }
    
    if (!processed.createdAt) {
      processed.createdAt = now;
    }
    processed.updatedAt = now;
    
    // 生成ID（如果没有）
    if (!processed.id) {
      processed.id = `${status}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    // 添加用户信息（如果有）
    if (window.currentUser) {
      processed.submittedBy = window.currentUser.id;
      processed.submittedByName = window.currentUser.name;
    }
    
    return processed;
  }

  // 以下是模拟数据方法，用于开发测试
  getMockSubmissions(params) {
    const mockSubmissions = [
      {
        id: 'submission_001',
        templateId: 'template_001',
        templateName: '化验数据填报表',
        data: {
          basic_info: {
            date: '2024-01-15',
            site_id: 'site_001',
            operator: '张三'
          }
        },
        status: 'approved',
        submittedBy: 'user001',
        submittedByName: '张三',
        submittedAt: '2024-01-15T10:00:00Z',
        reviewedBy: 'admin',
        reviewedAt: '2024-01-15T14:00:00Z',
        comments: '数据正常'
      },
      {
        id: 'submission_002',
        templateId: 'template_002',
        templateName: 'AO池运行数据表',
        data: {
          basic_info: {
            date: '2024-01-15',
            site_id: 'site_001',
            operator: '李四'
          }
        },
        status: 'pending',
        submittedBy: 'user002',
        submittedByName: '李四',
        submittedAt: '2024-01-15T11:00:00Z'
      }
    ];

    return {
      success: true,
      data: {
        items: mockSubmissions,
        total: mockSubmissions.length,
        page: parseInt(params.page || 1),
        pageSize: parseInt(params.pageSize || 10)
      }
    };
  }

  getMockSubmission(id) {
    return {
      success: true,
      data: {
        id: id,
        templateId: 'template_001',
        templateName: '化验数据填报表',
        data: {
          basic_info: {
            date: '2024-01-15',
            site_id: 'site_001',
            operator: '测试用户'
          }
        },
        status: 'pending',
        submittedBy: 'user001',
        submittedByName: '测试用户',
        submittedAt: '2024-01-15T10:00:00Z',
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z'
      }
    };
  }

  getMockStats() {
    return {
      success: true,
      data: {
        total: 150,
        pending: 10,
        approved: 130,
        rejected: 10,
        draft: 5,
        byTemplate: [
          {
            templateId: 'template_001',
            templateName: '化验数据填报表',
            count: 80
          },
          {
            templateId: 'template_002',
            templateName: 'AO池运行数据表',
            count: 70
          }
        ],
        byDate: [
          {
            date: '2024-01-15',
            count: 5
          },
          {
            date: '2024-01-14',
            count: 8
          }
        ]
      }
    };
  }

  getMockHistory(params) {
    const mockHistory = [
      {
        id: 'history_001',
        submissionId: 'submission_001',
        action: 'submitted',
        actionBy: 'user001',
        actionByName: '张三',
        actionAt: '2024-01-15T10:00:00Z',
        comments: '提交表单'
      },
      {
        id: 'history_002',
        submissionId: 'submission_001',
        action: 'approved',
        actionBy: 'admin',
        actionByName: '管理员',
        actionAt: '2024-01-15T14:00:00Z',
        comments: '审核通过'
      }
    ];

    return {
      success: true,
      data: {
        items: mockHistory,
        total: mockHistory.length,
        page: parseInt(params.page || 1),
        pageSize: parseInt(params.pageSize || 10)
      }
    };
  }
}

export default new FormSubmissionService(); 