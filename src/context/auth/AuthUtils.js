import axios from 'axios';
import { API_ENDPOINTS, CACHE_KEYS } from '../../api/config';
import {
  saveAuthToken,
  getAuthToken,
  clearAuthToken,
  saveUserInfo,
  getUserInfo,
  clearUserInfo,
  createToken,
  refreshToken,
  checkTokenValidity
} from '../../api/auth';

/**
 * 处理会话过期
 */
export const handleSessionExpired = () => {
  console.log('会话已过期，需要重新登录');
  // 清除认证信息
  clearAuthToken();
  clearUserInfo();

  // 如果不是登录页面，重定向到登录页面
  if (!window.location.pathname.includes('/login')) {
    window.location.href = '/login';
  }
};

/**
 * 检查用户管理员状态
 * @param {Object} userInfo - 用户信息
 * @returns {Promise<{adminStatus: boolean, adminValue: number}>} 管理员状态
 */
export const checkAdminStatusAPI = async (userInfo) => {
  try {
    // 向后端发送请求检查管理员权限
    const response = await axios.post(API_ENDPOINTS.CHECK_ADMIN_STATUS,
      {
        userId: userInfo.id,
        username: userInfo.username,
        email: userInfo.email
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'user-id': userInfo.id
        }
      }
    );

    // 解析API返回的权限信息
    let adminStatus = false;
    let adminValue = 0;

    // 处理可能的数组响应格式
    const responseData = Array.isArray(response.data)
      ? response.data[0]
      : response.data;

    // 检查API返回的数据中是否包含is_admin字段
    if (responseData && responseData.is_admin !== undefined) {
      adminValue = responseData.is_admin;
      // 只有当is_admin严格等于数字1时，才将用户视为管理员
      adminStatus = adminValue === 1;
      return { adminStatus, adminValue };
    }

    return { adminStatus: false, adminValue: 0 };
  } catch (error) {
    console.error('[AuthUtils] API权限检查失败:', error.message);
    return { adminStatus: false, adminValue: 0 };
  }
};

/**
 * 获取用户角色
 * @param {number|string} userId - 用户ID
 * @param {boolean} forceRefresh - 是否强制刷新角色信息
 * @returns {Promise<Array>} 用户角色列表
 */
export const fetchUserRoles = async (userId, forceRefresh = false) => {
  try {
    if (!userId) {
      console.error('获取用户角色失败: 缺少用户ID');
      return [];
    }
    
    // 首先尝试从缓存获取角色信息，除非强制刷新
    if (!forceRefresh) {
      try {
        const cachedRoles = localStorage.getItem('userRoles_cache');
        if (cachedRoles) {
          const rolesData = JSON.parse(cachedRoles);
          const timestamp = rolesData.timestamp || 0;
          const currentTime = Date.now();

          // 如果缓存不超过5分钟，直接使用缓存
          if (rolesData.userId === userId && (currentTime - timestamp) < 5 * 60 * 1000) {
            console.log('使用角色信息缓存:', rolesData.roles);
            return rolesData.roles;
          }
        }
      } catch (cacheError) {
        console.log('读取角色缓存失败:', cacheError);
      }
    }

    // 从API获取角色信息 - 确保在URL和headers中都传递userId
    const response = await axios.get(API_ENDPOINTS.USER_ROLES, {
      params: { userId },
      headers: {
        'Content-Type': 'application/json',
        'user-id': userId
      }
    });
    
    let roles = [];
    
    // 处理各种可能的响应格式
    if (response.data && Array.isArray(response.data)) {
      roles = response.data;
    } else if (response.data && response.data.roles && Array.isArray(response.data.roles)) {
      roles = response.data.roles;
    }

    // 确保检测角色名称格式为 [{"name":"管理员"}] 或 [{"name":"部门管理员"}]
    console.log('获取到的用户角色:', roles);
    
    // 缓存角色信息
    try {
      localStorage.setItem('userRoles_cache', JSON.stringify({
        userId,
        roles,
        timestamp: Date.now()
      }));
    } catch (cacheError) {
      console.log('缓存角色信息失败:', cacheError);
    }

    return roles;
  } catch (error) {
    console.error('获取用户角色失败:', error);
    return [];
  }
};

/**
 * 清除所有认证相关数据
 */
export const clearAuthData = () => {
  // 清除所有与用户相关的存储数据
  const keysToRemove = [
    CACHE_KEYS.TOKEN,       // 认证令牌
    CACHE_KEYS.USER_INFO,   // 用户基本信息
    'userEmail',            // 邮箱/账号
    'rememberMe',           // 记住登录状态
    'userRoles',            // 用户角色
    'lastLogin',            // 上次登录信息
    'userPreferences',      // 用户偏好设置
    'userRoles_cache',      // 角色缓存
  ];

  // 清除本地存储
  keysToRemove.forEach(key => {
    localStorage.removeItem(key);
  });
};
