/**
 * API 管理系统测试脚本
 * 用于测试 API 管理系统的各项功能
 * 
 * 使用方法：
 * 1. 在浏览器控制台中导入此脚本
 * 2. 调用 runTests() 函数
 */

import apiManager from '../services/apiManager';
import { API_CATEGORIES, API_METHODS, API_STATUS } from '../services/apiRegistry';
import { FIELD_TYPES } from '../services/apiFieldManager';
import { VARIABLE_SCOPES } from '../services/apiVariableManager';

/**
 * 运行所有测试
 */
export function runTests() {
  console.log('开始测试 API 管理系统...');
  
  testApiRegistry();
  testApiProxy();
  testApiFieldManager();
  testApiVariableManager();
  testApiDocGenerator();
  
  console.log('API 管理系统测试完成');
}

/**
 * 测试 API 注册中心
 */
function testApiRegistry() {
  console.log('测试 API 注册中心...');
  
  // 注册测试 API
  const testApiKey = `test_api_${Date.now()}`;
  const testApiConfig = {
    name: '测试 API',
    url: '/api/test',
    method: API_METHODS.GET,
    category: API_CATEGORIES.CUSTOM,
    status: API_STATUS.ENABLED,
    description: '用于测试的 API',
    timeout: 5000,
    retries: 1,
    cacheTime: 60000,
    headers: {
      'X-Test-Header': 'test'
    }
  };
  
  // 测试注册 API
  const registerResult = apiManager.registry.register(testApiKey, testApiConfig);
  console.log('注册 API 结果:', registerResult);
  
  // 测试获取 API
  const apiConfig = apiManager.registry.get(testApiKey);
  console.log('获取 API 配置:', apiConfig);
  
  // 测试更新 API
  const updateResult = apiManager.registry.update(testApiKey, {
    description: '已更新的测试 API'
  });
  console.log('更新 API 结果:', updateResult);
  
  // 测试获取更新后的 API
  const updatedApiConfig = apiManager.registry.get(testApiKey);
  console.log('获取更新后的 API 配置:', updatedApiConfig);
  
  // 测试获取所有 API
  const allApis = apiManager.registry.getAll();
  console.log('获取所有 API 数量:', Object.keys(allApis).length);
  
  // 测试获取指定分类的 API
  const customApis = apiManager.registry.getByCategory(API_CATEGORIES.CUSTOM);
  console.log('获取自定义 API 数量:', Object.keys(customApis).length);
  
  // 测试删除 API
  const removeResult = apiManager.registry.remove(testApiKey);
  console.log('删除 API 结果:', removeResult);
  
  console.log('API 注册中心测试完成');
}

/**
 * 测试 API 代理服务
 */
function testApiProxy() {
  console.log('测试 API 代理服务...');
  
  // 注册测试 API
  const testApiKey = `test_proxy_${Date.now()}`;
  const testApiConfig = {
    name: '测试代理 API',
    url: 'https://jsonplaceholder.typicode.com/todos/1',
    method: API_METHODS.GET,
    category: API_CATEGORIES.CUSTOM,
    status: API_STATUS.ENABLED,
    description: '用于测试代理的 API',
    timeout: 5000,
    retries: 1,
    cacheTime: 60000
  };
  
  // 注册 API
  apiManager.registry.register(testApiKey, testApiConfig);
  
  // 测试调用 API
  apiManager.call(testApiKey)
    .then(data => {
      console.log('API 调用结果:', data);
    })
    .catch(error => {
      console.error('API 调用失败:', error);
    });
  
  // 测试 API
  apiManager.test(testApiKey)
    .then(result => {
      console.log('API 测试结果:', result);
    })
    .catch(error => {
      console.error('API 测试失败:', error);
    });
  
  // 清理测试 API
  setTimeout(() => {
    apiManager.registry.remove(testApiKey);
  }, 5000);
  
  console.log('API 代理服务测试完成');
}

/**
 * 测试 API 字段管理
 */
function testApiFieldManager() {
  console.log('测试 API 字段管理...');
  
  // 注册测试 API
  const testApiKey = `test_field_${Date.now()}`;
  const testApiConfig = {
    name: '测试字段 API',
    url: 'https://jsonplaceholder.typicode.com/todos/1',
    method: API_METHODS.GET,
    category: API_CATEGORIES.CUSTOM,
    status: API_STATUS.ENABLED,
    description: '用于测试字段的 API',
    timeout: 5000,
    retries: 1,
    cacheTime: 60000
  };
  
  // 注册 API
  apiManager.registry.register(testApiKey, testApiConfig);
  
  // 测试添加字段
  const testField = {
    key: 'title',
    label: '标题',
    type: FIELD_TYPES.STRING,
    visible: true,
    description: '任务标题'
  };
  
  const addFieldResult = apiManager.fieldManager.addField(testApiKey, testField);
  console.log('添加字段结果:', addFieldResult);
  
  // 测试获取字段
  const fields = apiManager.fieldManager.getFields(testApiKey);
  console.log('获取字段结果:', fields);
  
  // 测试自动检测字段
  apiManager.call(testApiKey)
    .then(data => {
      const detectedFields = apiManager.fieldManager.detectFields(testApiKey, data);
      console.log('检测到的字段:', detectedFields);
    })
    .catch(error => {
      console.error('API 调用失败:', error);
    });
  
  // 测试删除字段
  setTimeout(() => {
    const removeFieldResult = apiManager.fieldManager.removeField(testApiKey, 'title');
    console.log('删除字段结果:', removeFieldResult);
    
    // 清理测试 API
    apiManager.registry.remove(testApiKey);
  }, 5000);
  
  console.log('API 字段管理测试完成');
}

/**
 * 测试 API 变量管理
 */
function testApiVariableManager() {
  console.log('测试 API 变量管理...');
  
  // 测试设置变量
  const testVarName = `test_var_${Date.now()}`;
  const testVarValue = '测试变量值';
  
  const setVarResult = apiManager.variableManager.set(testVarName, testVarValue, VARIABLE_SCOPES.SESSION);
  console.log('设置变量结果:', setVarResult);
  
  // 测试获取变量
  const varValue = apiManager.variableManager.get(testVarName);
  console.log('获取变量结果:', varValue);
  
  // 测试替换变量
  const testStr = `这是一个测试字符串，包含变量 \${${testVarName}}`;
  const replacedStr = apiManager.variableManager.replaceVariables(testStr);
  console.log('替换变量结果:', replacedStr);
  
  // 测试删除变量
  const removeVarResult = apiManager.variableManager.remove(testVarName, VARIABLE_SCOPES.SESSION);
  console.log('删除变量结果:', removeVarResult);
  
  console.log('API 变量管理测试完成');
}

/**
 * 测试 API 文档生成
 */
function testApiDocGenerator() {
  console.log('测试 API 文档生成...');
  
  // 注册测试 API
  const testApiKey = `test_doc_${Date.now()}`;
  const testApiConfig = {
    name: '测试文档 API',
    url: 'https://jsonplaceholder.typicode.com/todos/1',
    method: API_METHODS.GET,
    category: API_CATEGORIES.CUSTOM,
    status: API_STATUS.ENABLED,
    description: '用于测试文档生成的 API',
    timeout: 5000,
    retries: 1,
    cacheTime: 60000
  };
  
  // 注册 API
  apiManager.registry.register(testApiKey, testApiConfig);
  
  // 测试生成 Markdown 文档
  const markdownDoc = apiManager.docGenerator.generateDocs(testApiKey, 'markdown');
  console.log('生成的 Markdown 文档:', markdownDoc.substring(0, 200) + '...');
  
  // 测试生成 OpenAPI 文档
  const openApiDoc = apiManager.docGenerator.generateDocs(testApiKey, 'openapi');
  console.log('生成的 OpenAPI 文档:', openApiDoc.substring(0, 200) + '...');
  
  // 清理测试 API
  apiManager.registry.remove(testApiKey);
  
  console.log('API 文档生成测试完成');
}

export default {
  runTests
};
