/**
 * API同步API
 * 提供API配置与数据库同步的API接口
 * 增加了超时时间和错误处理
 */

import axios from 'axios';

// 基础API地址
const BASE_URL = import.meta.env.VITE_API_URL || 'https://nodered.jzz77.cn:9003';

// 创建一个自定义的axios实例，设置更长的超时时间
const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 120000, // 增加到120秒
  headers: {
    'Content-Type': 'application/json'
  }
});

// 添加请求拦截器
apiClient.interceptors.request.use(
  config => {
    console.log(`[API请求] ${config.method.toUpperCase()} ${config.url}`, config.data);
    return config;
  },
  error => {
    console.error('[API请求错误]', error);
    return Promise.reject(error);
  }
);

// 添加响应拦截器
apiClient.interceptors.response.use(
  response => {
    console.log(`[API响应] ${response.config.method.toUpperCase()} ${response.config.url}`, response.data);
    return response;
  },
  error => {
    if (error.response) {
      // 服务器返回了错误状态码
      console.error(`[API响应错误] 状态码: ${error.response.status}`, error.response.data);
    } else if (error.request) {
      // 请求已发送但没有收到响应
      console.error('[API响应错误] 未收到响应', error.request);
    } else {
      // 请求配置出错
      console.error('[API响应错误] 请求配置错误', error.message);
    }
    return Promise.reject(error);
  }
);

/**
 * 将API配置保存到数据库
 * @param {Object} apiConfigs API配置对象
 * @returns {Promise} 保存结果
 */
export const saveApiConfigsToDb = async (apiConfigs) => {
  try {
    console.log(`[saveApiConfigsToDb] 开始保存 ${Object.keys(apiConfigs).length} 个API配置`);
    const response = await apiClient.post('/api/api-configs/save', {
      apiConfigs
    });
    console.log('[saveApiConfigsToDb] 保存成功', response.data);
    return response.data;
  } catch (error) {
    console.error('[saveApiConfigsToDb] 保存API配置到数据库失败:', error);
    
    // 提供更详细的错误信息
    let errorMessage = '保存API配置失败';
    if (error.response) {
      errorMessage += `: ${error.response.status} ${error.response.statusText}`;
      if (error.response.data && error.response.data.message) {
        errorMessage += ` - ${error.response.data.message}`;
      }
    } else if (error.request) {
      errorMessage += ': 服务器未响应，可能是网络问题或CORS限制';
    } else {
      errorMessage += `: ${error.message}`;
    }
    
    throw new Error(errorMessage);
  }
};

/**
 * 从数据库获取API配置
 * @returns {Promise} API配置对象
 */
export const getApiConfigsFromDb = async () => {
  try {
    console.log('[getApiConfigsFromDb] 开始获取API配置');
    const response = await apiClient.get('/api/api-configs/get');
    console.log(`[getApiConfigsFromDb] 获取成功，共 ${Object.keys(response.data.data || {}).length} 个API配置`);
    return response.data;
  } catch (error) {
    console.error('[getApiConfigsFromDb] 从数据库获取API配置失败:', error);
    
    // 提供更详细的错误信息
    let errorMessage = '获取API配置失败';
    if (error.response) {
      errorMessage += `: ${error.response.status} ${error.response.statusText}`;
      if (error.response.data && error.response.data.message) {
        errorMessage += ` - ${error.response.data.message}`;
      }
    } else if (error.request) {
      errorMessage += ': 服务器未响应，可能是网络问题或CORS限制';
    } else {
      errorMessage += `: ${error.message}`;
    }
    
    throw new Error(errorMessage);
  }
};

/**
 * 删除数据库中的API配置
 * @returns {Promise} 删除结果
 */
export const deleteApiConfigsFromDb = async () => {
  try {
    console.log('[deleteApiConfigsFromDb] 开始删除API配置');
    const response = await apiClient.delete('/api/api-configs/delete');
    console.log('[deleteApiConfigsFromDb] 删除成功', response.data);
    return response.data;
  } catch (error) {
    console.error('[deleteApiConfigsFromDb] 删除数据库中的API配置失败:', error);
    
    // 提供更详细的错误信息
    let errorMessage = '删除API配置失败';
    if (error.response) {
      errorMessage += `: ${error.response.status} ${error.response.statusText}`;
      if (error.response.data && error.response.data.message) {
        errorMessage += ` - ${error.response.data.message}`;
      }
    } else if (error.request) {
      errorMessage += ': 服务器未响应，可能是网络问题或CORS限制';
    } else {
      errorMessage += `: ${error.message}`;
    }
    
    throw new Error(errorMessage);
  }
};
