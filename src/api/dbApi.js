/**
 * 数据库API
 * 提供数据库操作的API接口
 */

import axios from 'axios';

// 基础API地址
const BASE_URL = import.meta.env.VITE_API_URL || 'https://nodered.jzz77.cn:9003';

/**
 * 测试数据库连接
 * @param {Object} config 数据库配置
 * @returns {Promise} 测试结果
 */
export const testConnection = async (config) => {
  try {
    const response = await axios.post(`${BASE_URL}/api/database/test-connection`, config);
    return response.data;
  } catch (error) {
    console.error('测试数据库连接失败:', error);
    throw error;
  }
};

/**
 * 执行SQL查询
 * @param {Object} params 查询参数
 * @returns {Promise} 查询结果
 */
export const executeQuery = async (params) => {
  try {
    const response = await axios.post(`${BASE_URL}/api/database/query`, params);
    return response.data;
  } catch (error) {
    console.error('执行SQL查询失败:', error);
    throw error;
  }
};

/**
 * 执行多个SQL查询
 * @param {Object} params 查询参数
 * @returns {Promise} 查询结果
 */
export const executeMultiQuery = async (params) => {
  try {
    const response = await axios.post(`${BASE_URL}/api/database/multi-query`, params);
    return response.data;
  } catch (error) {
    console.error('执行多个SQL查询失败:', error);
    throw error;
  }
};
