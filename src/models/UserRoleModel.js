/**
 * 用户角色模型
 * 封装用户角色和权限相关的逻辑
 */
import axios from 'axios';
import { API_ENDPOINTS } from '../api/config';

/**
 * 用户角色常量
 */
const ROLES = {
  ADMIN: '管理员',
  DEPARTMENT_ADMIN: '部门管理员',
  USER: '普通用户',
  OPERATOR: '操作员',
  MANAGER: '经理',
  GUEST: '访客'
};

/**
 * 用户角色模型
 */
const UserRoleModel = {
  /**
   * 获取用户角色
   * @param {string|number} userId - 用户ID
   * @returns {Promise<Array>} 用户角色列表
   */
  getUserRoles: async (userId) => {
    try {
      if (!userId) {
        console.error('获取用户角色失败: 未提供用户ID');
        return [];
      }

      // 向后端发送请求获取用户角色，明确传递用户ID
      const response = await axios.get(`${API_ENDPOINTS.USER_ROLES}`, {
        params: { userId },
        headers: {
          'Content-Type': 'application/json',
          'user-id': userId
        }
      });

      // 处理响应数据
      let roles = [];
      if (response.data && Array.isArray(response.data)) {
        roles = response.data;
      } else if (response.data && response.data.roles && Array.isArray(response.data.roles)) {
        roles = response.data.roles;
      }

      console.log(`获取用户 ${userId} 的角色成功:`, roles);
      return roles;
    } catch (error) {
      console.error('获取用户角色失败:', error);
      return [];
    }
  },

  /**
   * 获取角色权限
   * @param {string|number} roleId - 角色ID
   * @returns {Promise<Array>} 角色权限列表
   */
  getRolePermissions: async (roleId) => {
    try {
      // 实际项目中应该从后端获取，这里简化处理
      // 根据角色返回模拟的权限列表
      const permissionsMap = {
        'admin': ['all'],
        '管理员': ['all'],
        '部门管理员': ['department.view', 'department.edit', 'user.view', 'user.edit'],
        'manager': ['device.view', 'device.edit', 'report.view', 'report.edit'],
        '经理': ['device.view', 'device.edit', 'report.view', 'report.edit'],
        'operator': ['device.view', 'device.operate'],
        '操作员': ['device.view', 'device.operate'],
        'user': ['device.view', 'report.view'],
        '普通用户': ['device.view', 'report.view'],
        'guest': ['device.view'],
        '访客': ['device.view']
      };

      return permissionsMap[roleId] || [];
    } catch (error) {
      console.error('获取角色权限失败:', error);
      return [];
    }
  },

  /**
   * 判断用户是否为管理员
   * @param {Object} user - 用户信息
   * @returns {boolean} 是否为管理员
   */
  isAdmin: (user) => {
    // 1. 检查用户对象中的is_admin属性
    if (user && user.is_admin === true) {
      return true;
    }

    // 2. 检查用户角色是否包含管理员角色
    if (user && user.roles && Array.isArray(user.roles)) {
      return user.roles.some(role => 
        typeof role === 'string' 
          ? role === 'admin' || role === ROLES.ADMIN
          : (role.name === 'admin' || role.name === ROLES.ADMIN || role.name === ROLES.DEPARTMENT_ADMIN)
      );
    }

    return false;
  },

  /**
   * 判断用户是否具有指定权限
   * @param {Object} user - 用户信息
   * @param {string|Array} permissionNames - 权限名称或权限名称数组
   * @param {boolean} requireAll - 是否要求拥有所有权限
   * @returns {boolean} 是否拥有权限
   */
  hasPermission: (user, permissionNames, requireAll = false) => {
    // 管理员拥有所有权限
    if (UserRoleModel.isAdmin(user)) {
      return true;
    }

    // 如果用户没有权限列表，返回false
    if (!user || !user.permissions || !Array.isArray(user.permissions)) {
      return false;
    }

    // 转换为数组
    const permissionArray = Array.isArray(permissionNames) 
      ? permissionNames 
      : [permissionNames];

    // 检查权限
    if (requireAll) {
      // 要求拥有所有权限
      return permissionArray.every(permission => 
        user.permissions.includes(permission)
      );
    } else {
      // 拥有任一权限即可
      return permissionArray.some(permission => 
        user.permissions.includes(permission)
      );
    }
  }
};

export default UserRoleModel; 