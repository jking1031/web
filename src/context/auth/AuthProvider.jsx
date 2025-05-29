import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';
import authApi from '../../api/auth';
import { API_ENDPOINTS } from '../../api/config';
import { EventEmitter } from '../../utils/EventEmitter';
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
import { 
  handleSessionExpired, 
  checkAdminStatusAPI, 
  fetchUserRoles,
  clearAuthData
} from './AuthUtils';

// 创建认证上下文
export const AuthContext = createContext();

/**
 * 认证提供组件
 * @param {Object} props - 组件属性
 * @param {React.ReactNode} props.children - 子组件
 */
export const AuthProvider = ({ children }) => {
  // 用户信息状态
  const [user, setUser] = useState(null);
  // 加载状态
  const [loading, setLoading] = useState(true);
  // 错误状态
  const [error, setError] = useState(null);
  // 是否已登录
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  // 用户角色
  const [userRoles, setUserRoles] = useState([]);
  // 是否为管理员
  const [isAdmin, setIsAdmin] = useState(false);

  // 初始化时检查用户登录状态
  useEffect(() => {
    checkAuth();

    // 监听会话过期事件
    const sessionExpiredListener = EventEmitter.addEventListener('SESSION_EXPIRED', () => {
      // 清除认证信息
      clearAuthToken();
      clearUserInfo();
      // 更新状态
      setUser(null);
      setIsLoggedIn(false);
      setIsAdmin(false);
      setError('会话已过期，请重新登录');

      // 如果不是登录页面，重定向到登录页面
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    });

    return () => {
      // 清理事件监听器
      EventEmitter.removeEventListener(sessionExpiredListener);
    };
  }, []);

  /**
   * 检查用户认证状态
   */
  const checkAuth = async () => {
    try {
      // 检查本地存储中是否有令牌
      const token = getAuthToken();

      if (!token) {
        setLoading(false);
        return;
      }

      // 检查令牌有效性
      if (!checkTokenValidity()) {
        console.log('令牌已过期，尝试刷新');
        const refreshSuccessful = await refreshToken();
        if (!refreshSuccessful) {
          console.log('令牌刷新失败，需要重新登录');
          handleSessionExpired();
          return;
        }
      }

      // 从本地存储获取用户信息
      const storedUserInfo = getUserInfo();
      if (storedUserInfo) {
        // 设置基本用户信息
        setUser(storedUserInfo);
        setIsLoggedIn(true);
        
        // 设置初始管理员状态
        const initialAdminStatus = storedUserInfo.is_admin === true;
        setIsAdmin(initialAdminStatus);
        
        console.log('从本地存储恢复用户信息，初始管理员状态:', initialAdminStatus);

        try {
          // 1. 获取用户角色
          if (storedUserInfo.id) {
            const roles = await fetchUserRoles(storedUserInfo.id);
            setUserRoles(roles);
            
            // 2. 根据角色判断是否为管理员
            const hasAdminRole = checkIsAdminByRoles(roles);
            
            // 3. 如果角色判断为管理员，但当前状态不是，则更新状态
            if (hasAdminRole && !initialAdminStatus) {
              console.log('基于角色判断用户为管理员，更新状态');
              updateUserInfo({
                is_admin: true
              });
              setIsAdmin(true);
            }
          }
          
          // 4. 再次检查管理员状态
          await checkAdminStatus();
        } catch (roleError) {
          console.error('获取用户角色失败:', roleError);
        }
      } else {
        // 如果本地没有用户信息，尝试从API获取
        try {
          const response = await authApi.get(API_ENDPOINTS.USER_INFO);
          const userData = response.data;

          if (userData) {
            // 保存用户信息
            saveUserInfo(userData);
            setUser(userData);
            setIsLoggedIn(true);
            setIsAdmin(userData.is_admin === true);

            // 检查管理员状态
            await checkAdminStatus();
          }
        } catch (apiError) {
          console.error('获取用户信息失败:', apiError);
          // 清除无效令牌
          clearAuthToken();
          setError('获取用户信息失败，请重新登录');
        }
      }
    } catch (err) {
      console.error('认证检查失败:', err);
      // 清除无效令牌
      clearAuthToken();
      clearUserInfo();
      setError('认证会话已过期，请重新登录');
    } finally {
      setLoading(false);
    }
  };

  /**
   * 用户登录
   * @param {Object} userData - 用户数据或登录凭证
   * @returns {Promise<Object>} 登录结果
   */
  const login = async (userData) => {
    try {
      setLoading(true);
      setError(null);

      console.log('===== AuthContext: 登录处理 =====');

      // 如果传入的是用户数据对象（从API响应中获取）
      if (userData && userData.id) {
        console.log('用户ID:', userData.id);
        console.log('用户名:', userData.username);
        console.log('用户Email:', userData.email);
        console.log('原始管理员状态:', userData.is_admin, '类型:', typeof userData.is_admin);

        // 首先保存基本用户信息，不含管理员状态
        const initialUserData = {
          ...userData
        };

        // 保存初始用户信息到本地存储
        saveUserInfo(initialUserData);

        // 更新基本用户状态
        setUser(initialUserData);
        setIsLoggedIn(true);

        // 关键修改：先查询管理员状态，再创建令牌
        console.log('登录成功，立即查询管理员状态');

        try {
          // 查询管理员状态
          const { adminStatus, adminValue } = await checkAdminStatusAPI(userData);
          console.log('API返回的管理员状态:', adminStatus, '原始值:', adminValue);

          // 更新用户信息，包含管理员状态
          const enhancedUserData = {
            ...userData,
            is_admin: adminStatus,
            is_admin_value: adminValue
          };

          // 更新状态和存储
          saveUserInfo(enhancedUserData);
          setUser(enhancedUserData);
          setIsAdmin(adminStatus);

          // 然后创建令牌 - 此时令牌会包含管理员状态
          console.log('创建令牌，包含管理员状态:', adminValue);

          if (userData.token) {
            // 如果后端返回了令牌，直接保存
            saveAuthToken(userData.token);
            console.log('后端提供的令牌已保存');
          } else {
            // 否则创建本地令牌，此时包含管理员信息
            const token = createToken(enhancedUserData);
            if (token) {
              saveAuthToken(token);
              console.log('已创建并保存包含管理员状态的本地令牌');
            } else {
              console.error('创建令牌失败');
            }
          }

          // 获取用户角色
          const roles = await fetchUserRoles(userData.id);
          setUserRoles(roles);
          
          // 检查用户角色是否包含管理员角色
          const hasAdminRole = checkIsAdminByRoles(roles);
          if (hasAdminRole && !adminStatus) {
            console.log('用户角色包含管理员角色，但API返回非管理员状态，更新为管理员');
            
            // 更新用户信息
            const updatedUserData = {
              ...enhancedUserData,
              is_admin: true
            };
            saveUserInfo(updatedUserData);
            setUser(updatedUserData);
            setIsAdmin(true);
          }

        } catch (adminCheckError) {
          console.error('查询管理员状态失败:', adminCheckError);

          // 查询失败时，使用默认值创建令牌
          const fallbackUserData = {
            ...userData,
            is_admin: userData.is_admin || false,
            is_admin_value: userData.is_admin || 0
          };

          setIsAdmin(fallbackUserData.is_admin === true);

          // 使用回退数据创建令牌
          if (userData.token) {
            saveAuthToken(userData.token);
            console.log('后端提供的令牌已保存');
          } else {
            const token = createToken(fallbackUserData);
            if (token) {
              saveAuthToken(token);
              console.log('已创建并保存含默认管理员状态的令牌');
            } else {
              console.error('创建令牌失败');
            }
          }
        }

        console.log('登录流程完成，用户信息和令牌已保存');
        return { success: true };
      }
      // 如果传入的是登录凭证，需要调用API
      else if (userData && (userData.email || userData.username) && userData.password) {
        console.log('使用登录凭证调用API');

        const response = await authApi.post(API_ENDPOINTS.LOGIN, userData);

        if (!response.data || !response.data.user) {
          throw new Error(response.data?.message || '登录响应数据无效');
        }

        // 获取用户信息
        const userInfo = response.data.user;

        // 检查所有可能的管理员相关字段
        const adminRelatedFields = [
          'is_admin', 'isAdmin', 'admin'
        ];

        console.log('管理员相关字段检查:');
        adminRelatedFields.forEach(field => {
          if (userInfo[field] !== undefined) {
            console.log(`- ${field}: ${JSON.stringify(userInfo[field])}`);
          }
        });

        // 调用login函数存储用户基本信息
        console.log('调用登录函数，存储用户信息并查询管理员状态');
        const loginResult = await login(userInfo);

        return loginResult;
      } else {
        throw new Error('无效的用户数据或登录凭证');
      }
    } catch (err) {
      console.error('登录失败:', err);
      const errorMessage = err.response?.data?.message || err.message || '登录失败，请检查用户名和密码';
      setError(errorMessage);

      // 确保清理任何可能部分完成的状态
      clearAuthToken();
      clearUserInfo();
      setUser(null);
      setIsLoggedIn(false);
      setIsAdmin(false);

      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  /**
   * 用户注册
   * @param {Object} userData - 用户注册数据
   * @returns {Promise<Object>} 注册结果
   */
  const register = async (userData) => {
    try {
      setLoading(true);
      setError(null);

      const response = await authApi.post(API_ENDPOINTS.REGISTER, userData);
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.response?.data?.message || '注册失败');
      return { success: false, error: err.response?.data?.message || '注册失败' };
    } finally {
      setLoading(false);
    }
  };

  /**
   * 用户登出
   * 与移动端保持一致，主要是清除本地存储的用户数据
   */
  const logout = async () => {
    try {
      console.log('开始退出登录流程');

      // 清除所有与用户相关的存储数据
      clearAuthData();

      // 重置用户状态
      setUser(null);
      setIsLoggedIn(false);
      setUserRoles([]);
      setIsAdmin(false);

      console.log('已成功登出并清理所有用户数据');
      return true;
    } catch (err) {
      console.error('退出登录失败:', err);

      // 即使出错，也尝试清除关键数据
      clearAuthToken();
      clearUserInfo();
      setUser(null);
      setIsLoggedIn(false);
      setIsAdmin(false);

      return false;
    }
  };

  /**
   * 更新用户信息
   * @param {Object} newUserData - 新的用户数据
   */
  const updateUserInfo = (newUserData) => {
    setUser(prevUser => {
      const updatedUser = {
        ...prevUser,
        ...newUserData
      };

      // 更新本地存储中的用户信息
      saveUserInfo(updatedUser);

      // 更新管理员状态
      if (newUserData.is_admin !== undefined) {
        setIsAdmin(newUserData.is_admin === true);
      }

      return updatedUser;
    });
  };

  /**
   * 检查用户管理员状态
   * @returns {Promise<boolean>} 是否为管理员
   */
  const checkAdminStatus = async () => {
    try {
      // 获取当前用户数据
      const userInfo = user || getUserInfo();
      if (!userInfo) {
        return false;
      }

      // 向后端发送请求检查管理员权限
      const { adminStatus, adminValue } = await checkAdminStatusAPI(userInfo);

      // 更新用户信息中的管理员状态
      updateUserInfo({
        is_admin: adminStatus,
        is_admin_value: adminValue
      });

      // 获取用户角色
      const roles = await fetchUserRoles(userInfo.id);
      setUserRoles(roles);
      
      // 检查角色是否包含管理员
      const hasAdminRole = checkIsAdminByRoles(roles);
      if (hasAdminRole && !adminStatus) {
        console.log('角色显示为管理员，但API状态不是管理员，更新为管理员状态');
        updateUserInfo({
          is_admin: true
        });
        setIsAdmin(true);
        return true;
      }

      return adminStatus || hasAdminRole;
    } catch (error) {
      console.error('[AuthContext] 检查管理员状态失败:', error.message);
      return isAdmin;
    }
  };

  /**
   * 通过角色数组判断用户是否为管理员
   * @param {Array} roles - 角色数组
   * @returns {boolean} 是否为管理员
   */
  const checkIsAdminByRoles = (roles) => {
    if (!roles || !Array.isArray(roles) || roles.length === 0) {
      return false;
    }

    // 处理格式为 [{"name":"管理员"}] 或 [{"name":"部门管理员"}] 的角色数据
    return roles.some(role => {
      if (typeof role === 'string') {
        return role === 'admin' || role === '管理员' || role === '部门管理员';
      } else if (role && typeof role === 'object' && role.name) {
        return role.name === 'admin' || role.name === '管理员' || role.name === '部门管理员';
      }
      return false;
    });
  };

  /**
   * 获取用户角色
   * @param {number|string} userId - 用户ID
   * @param {boolean} forceRefresh - 是否强制刷新角色信息
   * @returns {Promise<Array>} 用户角色列表
   */
  const getUserRoles = async (userId, forceRefresh = false) => {
    try {
      if (!userId) {
        const currentUser = user || getUserInfo();
        if (!currentUser) {
          console.log('获取角色: 未提供用户ID');
          return [];
        }
        userId = currentUser.id;
      }

      const roles = await fetchUserRoles(userId, forceRefresh);
      setUserRoles(roles);
      
      // 检查角色中是否包含管理员角色
      const hasAdminRole = checkIsAdminByRoles(roles);
      
      // 如果角色判断为管理员，但当前状态不是管理员，则更新状态
      if (hasAdminRole) {
        console.log('基于角色判断用户为管理员:', 
          roles.map(r => typeof r === 'string' ? r : (r.name || 'unknown')).join(', '));
        
        // 只有当前用户不是管理员时才更新状态
        if (!isAdmin) {
          updateUserInfo({
            is_admin: true
          });
          setIsAdmin(true);
        }
      }
      
      return roles;
    } catch (error) {
      console.error('获取用户角色失败:', error);
      return [];
    }
  };

  // 提供上下文值
  const contextValue = {
    user,
    loading,
    error,
    isLoggedIn,
    isAdmin,
    userRoles,
    login,
    logout,
    register,
    updateUserInfo,
    checkAdminStatus,
    getUserRoles,
    setError
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
