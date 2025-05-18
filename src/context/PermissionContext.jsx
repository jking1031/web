/**
 * 增强的权限校验上下文
 * 基于RBAC模型实现，支持细粒度权限控制
 */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { message } from 'antd';
import UserRoleModel from '../models/UserRoleModel';
import { useAuth } from './AuthContext';

// 创建权限上下文
const PermissionContext = createContext();

/**
 * 权限提供者组件
 * @param {Object} props 组件属性
 * @returns {JSX.Element} 权限提供者组件
 */
export const PermissionProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [userPermissions, setUserPermissions] = useState([]);
  const [userRoles, setUserRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  // 获取用户权限和角色
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchUserPermissionsAndRoles();
    } else {
      setUserPermissions([]);
      setUserRoles([]);
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  // 获取用户权限和角色
  const fetchUserPermissionsAndRoles = async () => {
    try {
      setLoading(true);
      
      // 获取用户角色
      const roles = await UserRoleModel.getUserRoles(user.id);
      setUserRoles(roles);
      
      // 获取用户权限
      const permissions = [];
      for (const role of roles) {
        const rolePermissions = await UserRoleModel.getRolePermissions(role.id);
        permissions.push(...rolePermissions);
      }
      
      // 去重
      const uniquePermissions = [...new Set(permissions)];
      setUserPermissions(uniquePermissions);
    } catch (error) {
      console.error('获取用户权限和角色失败:', error);
      message.error('获取用户权限失败，部分功能可能无法使用');
    } finally {
      setLoading(false);
    }
  };

  // 判断用户是否为管理员
  const isAdmin = () => {
    return UserRoleModel.isAdmin(user);
  };

  // 判断用户是否拥有指定权限
  const hasPermission = (permissionNames, requireAll = false) => {
    return UserRoleModel.hasPermission(
      { ...user, permissions: userPermissions, roles: userRoles },
      permissionNames,
      requireAll
    );
  };

  // 提供的上下文值
  const contextValue = {
    userPermissions,
    userRoles,
    loading,
    isAdmin,
    hasPermission,
    refreshPermissions: fetchUserPermissionsAndRoles,
  };

  return (
    <PermissionContext.Provider value={contextValue}>
      {children}
    </PermissionContext.Provider>
  );
};

/**
 * 使用权限上下文的Hook
 * @returns {Object} 权限上下文
 */
export const usePermission = () => {
  const context = useContext(PermissionContext);
  if (!context) {
    throw new Error('usePermission must be used within a PermissionProvider');
  }
  return context;
};

/**
 * 权限守卫组件
 * @param {Object} props 组件属性
 * @param {string|Array} props.permission 所需权限名称或权限名称数组
 * @param {boolean} props.requireAll 是否要求拥有所有权限，默认为false（拥有任一权限即可）
 * @param {React.ReactNode} props.fallback 无权限时显示的内容
 * @returns {JSX.Element} 权限守卫组件
 */
export const PermissionGuard = ({ permission, requireAll = false, fallback = null, children }) => {
  const { hasPermission, isAdmin, loading } = usePermission();
  
  if (loading) {
    return <div>加载中...</div>;
  }
  
  // 超级管理员拥有所有权限
  if (isAdmin()) {
    return children;
  }
  
  // 检查权限
  if (hasPermission(permission, requireAll)) {
    return children;
  }
  
  // 无权限
  return fallback;
};
