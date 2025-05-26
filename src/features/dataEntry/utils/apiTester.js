/**
 * API测试工具
 * 用于测试表单填报中心的API连接和功能
 */

import formTemplateService from '../services/formTemplateService';
import formSubmissionService from '../services/formSubmissionService';

class ApiTester {
  constructor() {
    this.testResults = [];
  }

  /**
   * 运行所有API测试
   * @returns {Promise<Object>} 测试结果
   */
  async runAllTests() {
    console.log('🚀 开始运行API测试...');
    this.testResults = [];

    const tests = [
      { name: '表单模板列表', test: () => this.testGetTemplates() },
      { name: '表单分类列表', test: () => this.testGetCategories() },
      { name: '模板统计信息', test: () => this.testGetTemplateStats() },
      { name: '表单提交列表', test: () => this.testGetSubmissions() },
      { name: '提交统计信息', test: () => this.testGetSubmissionStats() },
      { name: '创建模板测试', test: () => this.testCreateTemplate() },
      { name: '提交表单测试', test: () => this.testSubmitForm() },
      { name: '保存草稿测试', test: () => this.testSaveDraft() }
    ];

    for (const testCase of tests) {
      try {
        console.log(`📋 测试: ${testCase.name}`);
        const startTime = Date.now();
        const result = await testCase.test();
        const duration = Date.now() - startTime;
        
        this.testResults.push({
          name: testCase.name,
          status: 'success',
          duration,
          result,
          error: null
        });
        
        console.log(`✅ ${testCase.name} - 成功 (${duration}ms)`);
      } catch (error) {
        this.testResults.push({
          name: testCase.name,
          status: 'error',
          duration: 0,
          result: null,
          error: error.message
        });
        
        console.log(`❌ ${testCase.name} - 失败:`, error.message);
      }
    }

    return this.generateTestReport();
  }

  /**
   * 测试获取表单模板列表
   */
  async testGetTemplates() {
    const result = await formTemplateService.getTemplates({
      page: 1,
      pageSize: 10
    });
    
    if (!result.success) {
      throw new Error('API返回失败状态');
    }
    
    if (!result.data || !Array.isArray(result.data.items)) {
      throw new Error('返回数据格式不正确');
    }
    
    return {
      total: result.data.total || result.data.items.length,
      itemCount: result.data.items.length
    };
  }

  /**
   * 测试获取表单分类列表
   */
  async testGetCategories() {
    const result = await formTemplateService.getCategories();
    
    if (!result.success) {
      throw new Error('API返回失败状态');
    }
    
    if (!result.data || !Array.isArray(result.data)) {
      throw new Error('返回数据格式不正确');
    }
    
    return {
      categoryCount: result.data.length
    };
  }

  /**
   * 测试获取模板统计信息
   */
  async testGetTemplateStats() {
    const result = await formTemplateService.getStats();
    
    if (!result.success) {
      throw new Error('API返回失败状态');
    }
    
    if (!result.data) {
      throw new Error('返回数据格式不正确');
    }
    
    return {
      stats: result.data
    };
  }

  /**
   * 测试获取表单提交列表
   */
  async testGetSubmissions() {
    const result = await formSubmissionService.getSubmissions({
      page: 1,
      pageSize: 10
    });
    
    if (!result.success) {
      throw new Error('API返回失败状态');
    }
    
    if (!result.data || !Array.isArray(result.data.items)) {
      throw new Error('返回数据格式不正确');
    }
    
    return {
      total: result.data.total || result.data.items.length,
      itemCount: result.data.items.length
    };
  }

  /**
   * 测试获取提交统计信息
   */
  async testGetSubmissionStats() {
    const result = await formSubmissionService.getStats();
    
    if (!result.success) {
      throw new Error('API返回失败状态');
    }
    
    if (!result.data) {
      throw new Error('返回数据格式不正确');
    }
    
    return {
      stats: result.data
    };
  }

  /**
   * 测试创建表单模板
   */
  async testCreateTemplate() {
    const testTemplate = {
      name: `测试模板_${Date.now()}`,
      description: '这是一个API测试模板',
      category: 'lab_data',
      schema: {
        type: 'object',
        properties: {
          testField: {
            type: 'string',
            title: '测试字段',
            'x-component': 'Input'
          }
        }
      },
      version: '1.0.0',
      status: 'draft'
    };
    
    const result = await formTemplateService.createTemplate(testTemplate);
    
    if (!result.success) {
      throw new Error('API返回失败状态');
    }
    
    if (!result.data || !result.data.id) {
      throw new Error('返回数据格式不正确');
    }
    
    return {
      templateId: result.data.id,
      templateName: result.data.name
    };
  }

  /**
   * 测试提交表单
   */
  async testSubmitForm() {
    const testSubmission = {
      templateId: 'template_001',
      templateName: '测试模板',
      data: {
        testField: '测试数据',
        submittedAt: new Date().toISOString()
      }
    };
    
    const result = await formSubmissionService.submitForm(testSubmission);
    
    if (!result.success) {
      throw new Error('API返回失败状态');
    }
    
    if (!result.data || !result.data.id) {
      throw new Error('返回数据格式不正确');
    }
    
    return {
      submissionId: result.data.id,
      status: result.data.status
    };
  }

  /**
   * 测试保存草稿
   */
  async testSaveDraft() {
    const testDraft = {
      templateId: 'template_001',
      templateName: '测试模板',
      data: {
        testField: '草稿数据',
        savedAt: new Date().toISOString()
      }
    };
    
    const result = await formSubmissionService.saveDraft(testDraft);
    
    if (!result.success) {
      throw new Error('API返回失败状态');
    }
    
    if (!result.data || !result.data.id) {
      throw new Error('返回数据格式不正确');
    }
    
    return {
      draftId: result.data.id,
      status: result.data.status
    };
  }

  /**
   * 测试API连接性
   * @param {string} url - API地址
   * @returns {Promise<Object>} 连接测试结果
   */
  async testConnection(url = 'https://nodered.jzz77.cn:9003/api') {
    try {
      console.log(`🔗 测试API连接: ${url}`);
      
      const startTime = Date.now();
      const response = await fetch(`${url}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });
      
      const duration = Date.now() - startTime;
      
      if (response.ok) {
        return {
          status: 'success',
          statusCode: response.status,
          duration,
          message: '连接成功'
        };
      } else {
        return {
          status: 'warning',
          statusCode: response.status,
          duration,
          message: `HTTP ${response.status} - 服务器响应但可能未配置健康检查端点`
        };
      }
    } catch (error) {
      return {
        status: 'error',
        statusCode: 0,
        duration: 0,
        message: `连接失败: ${error.message}`
      };
    }
  }

  /**
   * 生成测试报告
   * @returns {Object} 测试报告
   */
  generateTestReport() {
    const successCount = this.testResults.filter(r => r.status === 'success').length;
    const errorCount = this.testResults.filter(r => r.status === 'error').length;
    const totalDuration = this.testResults.reduce((sum, r) => sum + r.duration, 0);
    
    const report = {
      summary: {
        total: this.testResults.length,
        success: successCount,
        error: errorCount,
        successRate: ((successCount / this.testResults.length) * 100).toFixed(1),
        totalDuration
      },
      details: this.testResults,
      timestamp: new Date().toISOString()
    };
    
    console.log('📊 测试报告:', report);
    return report;
  }

  /**
   * 打印测试报告到控制台
   * @param {Object} report - 测试报告
   */
  printReport(report) {
    console.log('\n' + '='.repeat(50));
    console.log('📊 API测试报告');
    console.log('='.repeat(50));
    console.log(`总测试数: ${report.summary.total}`);
    console.log(`成功: ${report.summary.success}`);
    console.log(`失败: ${report.summary.error}`);
    console.log(`成功率: ${report.summary.successRate}%`);
    console.log(`总耗时: ${report.summary.totalDuration}ms`);
    console.log('='.repeat(50));
    
    report.details.forEach(test => {
      const icon = test.status === 'success' ? '✅' : '❌';
      console.log(`${icon} ${test.name} (${test.duration}ms)`);
      if (test.error) {
        console.log(`   错误: ${test.error}`);
      }
    });
    
    console.log('='.repeat(50) + '\n');
  }

  /**
   * 快速测试 - 只测试基本连接和关键API
   * @returns {Promise<Object>} 快速测试结果
   */
  async quickTest() {
    console.log('⚡ 运行快速API测试...');
    
    const tests = [
      { name: 'API连接测试', test: () => this.testConnection() },
      { name: '表单模板列表', test: () => this.testGetTemplates() },
      { name: '表单提交列表', test: () => this.testGetSubmissions() }
    ];
    
    const results = [];
    
    for (const testCase of tests) {
      try {
        const startTime = Date.now();
        const result = await testCase.test();
        const duration = Date.now() - startTime;
        
        results.push({
          name: testCase.name,
          status: 'success',
          duration,
          result
        });
        
        console.log(`✅ ${testCase.name} - 成功`);
      } catch (error) {
        results.push({
          name: testCase.name,
          status: 'error',
          duration: 0,
          error: error.message
        });
        
        console.log(`❌ ${testCase.name} - 失败:`, error.message);
      }
    }
    
    return {
      success: results.every(r => r.status === 'success'),
      results
    };
  }
}

// 创建全局实例
const apiTester = new ApiTester();

// 导出测试函数供控制台使用
window.testFormApis = () => apiTester.runAllTests();
window.quickTestFormApis = () => apiTester.quickTest();
window.testApiConnection = (url) => apiTester.testConnection(url);

export default apiTester; 