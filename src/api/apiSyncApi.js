/**
 * API同步API
 * 提供API配置与数据库同步的API接口
 */

import axios from 'axios';

// 基础API地址
const BASE_URL = import.meta.env.VITE_API_URL || 'https://nodered.jzz77.cn:9003';

/**
 * 将API配置保存到数据库
 * @param {Object} apiConfigs API配置对象
 * @returns {Promise} 保存结果
 */
export const saveApiConfigsToDb = async (apiConfigs) => {
  try {
    const response = await axios.post(`${BASE_URL}/api/api-configs/save`, {
      apiConfigs
    });
    return response.data;
  } catch (error) {
    console.error('保存API配置到数据库失败:', error);
    throw error;
  }
};

/**
 * 从数据库获取API配置
 * @returns {Promise} API配置对象
 */
export const getApiConfigsFromDb = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/api/api-configs/get`);
    return response.data;
  } catch (error) {
    console.error('从数据库获取API配置失败:', error);
    throw error;
  }
};

/**
 * 删除数据库中的API配置
 * @returns {Promise} 删除结果
 */
export const deleteApiConfigsFromDb = async () => {
  try {
    const response = await axios.delete(`${BASE_URL}/api/api-configs/delete`);
    return response.data;
  } catch (error) {
    console.error('删除数据库中的API配置失败:', error);
    throw error;
  }
};
