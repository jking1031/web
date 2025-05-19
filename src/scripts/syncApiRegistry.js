/**
 * API注册同步脚本
 * 用于确保所有环境中API管理页面显示相同的API列表
 * 
 * 使用方法：
 * 1. 在浏览器控制台中运行此脚本
 * 2. 或将此脚本导入到项目中，通过按钮触发执行
 */

import apiManager from '../services/apiManager';
import { API_CATEGORIES, API_METHODS, API_STATUS } from '../services/apiRegistry';

/**
 * 同步API注册
 * 确保所有默认API都被正确注册
 */
export function syncApiRegistry() {
  console.log('开始同步API注册...');
  
  // 清除现有API注册
  clearApiRegistry();
  
  // 注册所有默认API
  registerDefaultApis();
  
  console.log('API注册同步完成！');
  return true;
}

/**
 * 清除API注册
 * 从localStorage中删除API注册信息
 */
export function clearApiRegistry() {
  try {
    localStorage.removeItem('apiRegistry');
    console.log('已清除API注册信息');
    return true;
  } catch (error) {
    console.error('清除API注册信息失败:', error);
    return false;
  }
}

/**
 * 注册所有默认API
 * 确保所有环境中都有相同的API列表
 */
export function registerDefaultApis() {
  const registry = apiManager.registry;
  
  // 注册认证相关 API
  registry.register('login', {
    name: '用户登录',
    url: 'https://zziot.jzz77.cn:9003/api/login',
    method: API_METHODS.POST,
    category: API_CATEGORIES.AUTH,
    status: API_STATUS.ENABLED,
    description: '用户登录认证',
    timeout: 10000,
    retries: 0,
    cacheTime: 0,
    headers: {
      'Content-Type': 'application/json'
    }
  });

  registry.register('logout', {
    name: '用户登出',
    url: '/auth-api/api/logout',
    method: API_METHODS.POST,
    category: API_CATEGORIES.AUTH,
    status: API_STATUS.ENABLED,
    description: '用户登出',
    timeout: 5000,
    retries: 0,
    cacheTime: 0,
    headers: {
      'Content-Type': 'application/json'
    }
  });

  registry.register('register', {
    name: '用户注册',
    url: 'https://zziot.jzz77.cn:9003/api/register',
    method: API_METHODS.POST,
    category: API_CATEGORIES.AUTH,
    status: API_STATUS.ENABLED,
    description: '用户注册',
    timeout: 10000,
    retries: 0,
    cacheTime: 0,
    headers: {
      'Content-Type': 'application/json'
    }
  });

  registry.register('getUserInfo', {
    name: '获取用户信息',
    url: '/auth-api/api/user',
    method: API_METHODS.GET,
    category: API_CATEGORIES.AUTH,
    status: API_STATUS.ENABLED,
    description: '获取当前登录用户信息',
    timeout: 5000,
    retries: 1,
    cacheTime: 60000,
    headers: {
      'Content-Type': 'application/json'
    }
  });

  // 注册管理员相关 API
  registry.register('checkAdminStatus', {
    name: '检查管理员状态',
    url: '/admin-api/api/check-admin-status',
    method: API_METHODS.POST,
    category: API_CATEGORIES.ADMIN,
    status: API_STATUS.ENABLED,
    description: '检查用户的管理员状态',
    timeout: 5000,
    retries: 1,
    cacheTime: 0,
    headers: {
      'Content-Type': 'application/json'
    }
  });

  // 注册用户管理相关 API
  registry.register('getUserRoles', {
    name: '获取用户角色',
    url: '/auth-api/api/users/roles',
    method: API_METHODS.GET,
    category: API_CATEGORIES.ADMIN,
    status: API_STATUS.ENABLED,
    description: '获取用户的角色信息',
    timeout: 5000,
    retries: 1,
    cacheTime: 60000,
    headers: {
      'Content-Type': 'application/json'
    }
  });

  // 注册数据查询相关 API
  registry.register('queryData', {
    name: '数据查询',
    url: '/api/data/query',
    method: API_METHODS.POST,
    category: API_CATEGORIES.DATA,
    status: API_STATUS.ENABLED,
    description: '通用数据查询接口',
    timeout: 15000,
    retries: 1,
    cacheTime: 60000,
    headers: {
      'Content-Type': 'application/json'
    }
  });

  registry.register('getHistoryData', {
    name: '历史数据查询',
    url: '/api/data/history',
    method: API_METHODS.POST,
    category: API_CATEGORIES.DATA,
    status: API_STATUS.ENABLED,
    description: '查询历史数据',
    timeout: 15000,
    retries: 1,
    cacheTime: 60000,
    headers: {
      'Content-Type': 'application/json'
    }
  });

  // 注册自定义查询 API
  registry.register('customQuery', {
    name: '自定义数据库查询',
    url: '/api/custom-query',
    method: API_METHODS.POST,
    category: API_CATEGORIES.DATA,
    status: API_STATUS.ENABLED,
    description: '执行自定义 SQL 查询',
    timeout: 20000,
    retries: 0,
    cacheTime: 0,
    headers: {
      'Content-Type': 'application/json'
    }
  });

  // 注册设备相关 API
  registry.register('getDeviceStatus', {
    name: '获取设备状态',
    url: '/api/device/status',
    method: API_METHODS.GET,
    category: API_CATEGORIES.DEVICE,
    status: API_STATUS.ENABLED,
    description: '获取设备状态信息',
    timeout: 10000,
    retries: 2,
    cacheTime: 30000,
    headers: {
      'Content-Type': 'application/json'
    }
  });

  registry.register('controlDevice', {
    name: '控制设备',
    url: '/api/device/control',
    method: API_METHODS.POST,
    category: API_CATEGORIES.DEVICE,
    status: API_STATUS.ENABLED,
    description: '发送设备控制命令',
    timeout: 8000,
    retries: 2,
    cacheTime: 0,
    headers: {
      'Content-Type': 'application/json'
    }
  });

  // 注册消息通知相关 API
  registry.register('getNotifications', {
    name: '获取通知',
    url: '/api/notifications',
    method: API_METHODS.GET,
    category: API_CATEGORIES.SYSTEM,
    status: API_STATUS.ENABLED,
    description: '获取用户通知',
    timeout: 10000,
    retries: 1,
    cacheTime: 60000,
    headers: {
      'Content-Type': 'application/json'
    }
  });

  registry.register('getMessages', {
    name: '获取消息',
    url: '/api/messages',
    method: API_METHODS.GET,
    category: API_CATEGORIES.SYSTEM,
    status: API_STATUS.ENABLED,
    description: '获取用户消息',
    timeout: 10000,
    retries: 1,
    cacheTime: 60000,
    headers: {
      'Content-Type': 'application/json'
    }
  });

  // 注册站点相关 API
  registry.register('getSites', {
    name: '获取站点列表',
    url: '/api/sites',
    method: API_METHODS.GET,
    category: API_CATEGORIES.SYSTEM,
    status: API_STATUS.ENABLED,
    description: '获取站点列表',
    timeout: 10000,
    retries: 1,
    cacheTime: 300000, // 5分钟缓存
    headers: {
      'Content-Type': 'application/json'
    }
  });

  registry.register('getSiteById', {
    name: '获取站点详情',
    url: '/api/sites/{id}',
    method: API_METHODS.GET,
    category: API_CATEGORIES.SYSTEM,
    status: API_STATUS.ENABLED,
    description: '根据ID获取站点详情',
    timeout: 8000,
    retries: 1,
    cacheTime: 60000,
    headers: {
      'Content-Type': 'application/json'
    }
  });

  // 注册工单相关 API
  registry.register('getTickets', {
    name: '获取工单列表',
    url: '/api/tickets',
    method: API_METHODS.GET,
    category: API_CATEGORIES.SYSTEM,
    status: API_STATUS.ENABLED,
    description: '获取工单列表，支持分页和筛选',
    timeout: 10000,
    retries: 1,
    cacheTime: 60000,
    headers: {
      'Content-Type': 'application/json'
    }
  });

  registry.register('getTicketById', {
    name: '获取工单详情',
    url: '/api/tickets/{id}',
    method: API_METHODS.GET,
    category: API_CATEGORIES.SYSTEM,
    status: API_STATUS.ENABLED,
    description: '根据ID获取工单详情',
    timeout: 8000,
    retries: 1,
    cacheTime: 30000,
    headers: {
      'Content-Type': 'application/json'
    }
  });

  registry.register('updateTicket', {
    name: '更新工单',
    url: '/api/tickets/{id}',
    method: API_METHODS.PUT,
    category: API_CATEGORIES.SYSTEM,
    status: API_STATUS.ENABLED,
    description: '更新工单信息',
    timeout: 10000,
    retries: 0,
    cacheTime: 0,
    headers: {
      'Content-Type': 'application/json'
    }
  });

  registry.register('createTicket', {
    name: '创建工单',
    url: '/api/tickets',
    method: API_METHODS.POST,
    category: API_CATEGORIES.SYSTEM,
    status: API_STATUS.ENABLED,
    description: '创建新工单',
    timeout: 10000,
    retries: 0,
    cacheTime: 0,
    headers: {
      'Content-Type': 'application/json'
    }
  });

  registry.register('updateTicketStatus', {
    name: '更新工单状态',
    url: '/api/tickets/{id}/status',
    method: API_METHODS.PATCH,
    category: API_CATEGORIES.SYSTEM,
    status: API_STATUS.ENABLED,
    description: '更新工单状态',
    timeout: 8000,
    retries: 1,
    cacheTime: 0,
    headers: {
      'Content-Type': 'application/json'
    }
  });

  registry.register('assignTicket', {
    name: '分配工单',
    url: '/api/tickets/{id}/assign',
    method: API_METHODS.POST,
    category: API_CATEGORIES.SYSTEM,
    status: API_STATUS.ENABLED,
    description: '将工单分配给指定用户',
    timeout: 8000,
    retries: 1,
    cacheTime: 0,
    headers: {
      'Content-Type': 'application/json'
    }
  });

  registry.register('addTicketComment', {
    name: '添加工单评论',
    url: '/api/tickets/{id}/comments',
    method: API_METHODS.POST,
    category: API_CATEGORIES.SYSTEM,
    status: API_STATUS.ENABLED,
    description: '为工单添加评论',
    timeout: 8000,
    retries: 1,
    cacheTime: 0,
    headers: {
      'Content-Type': 'application/json'
    }
  });

  registry.register('getTicketComments', {
    name: '获取工单评论',
    url: '/api/tickets/{id}/comments',
    method: API_METHODS.GET,
    category: API_CATEGORIES.SYSTEM,
    status: API_STATUS.ENABLED,
    description: '获取工单的评论列表',
    timeout: 8000,
    retries: 1,
    cacheTime: 30000,
    headers: {
      'Content-Type': 'application/json'
    }
  });

  registry.register('uploadTicketImages', {
    name: '上传工单图片',
    url: '/api/tickets/{id}/images',
    method: API_METHODS.POST,
    category: API_CATEGORIES.SYSTEM,
    status: API_STATUS.ENABLED,
    description: '为工单上传图片',
    timeout: 15000,
    retries: 0,
    cacheTime: 0,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });

  registry.register('getTicketStats', {
    name: '获取工单统计',
    url: '/api/tickets/stats',
    method: API_METHODS.GET,
    category: API_CATEGORIES.SYSTEM,
    status: API_STATUS.ENABLED,
    description: '获取工单统计信息',
    timeout: 10000,
    retries: 1,
    cacheTime: 300000, // 5分钟缓存
    headers: {
      'Content-Type': 'application/json'
    }
  });

  // 注册用户相关 API
  registry.register('getUsers', {
    name: '获取用户列表',
    url: '/api/users',
    method: API_METHODS.GET,
    category: API_CATEGORIES.SYSTEM,
    status: API_STATUS.ENABLED,
    description: '获取用户列表',
    timeout: 10000,
    retries: 1,
    cacheTime: 300000, // 5分钟缓存
    headers: {
      'Content-Type': 'application/json'
    }
  });

  registry.register('getUserById', {
    name: '获取用户详情',
    url: '/api/users/{id}',
    method: API_METHODS.GET,
    category: API_CATEGORIES.SYSTEM,
    status: API_STATUS.ENABLED,
    description: '根据ID获取用户详情',
    timeout: 8000,
    retries: 1,
    cacheTime: 60000,
    headers: {
      'Content-Type': 'application/json'
    }
  });

  registry.register('updateUser', {
    name: '更新用户信息',
    url: '/api/users/{id}',
    method: API_METHODS.PUT,
    category: API_CATEGORIES.SYSTEM,
    status: API_STATUS.ENABLED,
    description: '更新用户信息',
    timeout: 10000,
    retries: 0,
    cacheTime: 0,
    headers: {
      'Content-Type': 'application/json'
    }
  });

  // 注册趋势数据相关API
  registry.register('getTrendData', {
    name: '获取趋势数据',
    url: '/api/trend-data',
    method: API_METHODS.POST,
    category: API_CATEGORIES.DATA,
    status: API_STATUS.ENABLED,
    description: '获取历史趋势数据',
    timeout: 15000,
    retries: 1,
    cacheTime: 60000, // 缓存1分钟
    headers: {
      'Content-Type': 'application/json'
    }
  });

  registry.register('getRealtimeTrendData', {
    name: '获取实时趋势数据',
    url: '/api/realtime-trend-data',
    method: API_METHODS.POST,
    category: API_CATEGORIES.DATA,
    status: API_STATUS.ENABLED,
    description: '获取实时趋势数据',
    timeout: 10000,
    retries: 1,
    cacheTime: 5000, // 缓存5秒
    headers: {
      'Content-Type': 'application/json'
    }
  });

  console.log(`已注册 ${Object.keys(registry.getAll()).length} 个API`);
  return true;
}

// 导出默认函数
export default syncApiRegistry;
