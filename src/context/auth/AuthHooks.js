import { useContext } from 'react';
import { AuthContext } from './AuthProvider';

/**
 * 使用认证上下文的钩子
 * @returns {Object} 认证上下文
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth必须在AuthProvider内部使用');
  }
  return context;
};

/**
 * 使用用户信息的钩子
 * @returns {Object} 用户信息
 */
export const useUser = () => {
  const { user } = useAuth();
  return user;
};

/**
 * 使用管理员状态的钩子
 * @returns {boolean} 是否为管理员
 */
export const useAdmin = () => {
  const { isAdmin } = useAuth();
  return isAdmin;
};

/**
 * 使用用户角色的钩子
 * @returns {Array} 用户角色列表
 */
export const useRoles = () => {
  const { userRoles } = useAuth();
  return userRoles;
};

/**
 * 使用认证状态的钩子
 * @returns {boolean} 是否已登录
 */
export const useLoggedIn = () => {
  const { isLoggedIn } = useAuth();
  return isLoggedIn;
};

/**
 * 使用认证加载状态的钩子
 * @returns {boolean} 是否正在加载
 */
export const useAuthLoading = () => {
  const { loading } = useAuth();
  return loading;
};

/**
 * 使用认证错误的钩子
 * @returns {string|null} 错误信息
 */
export const useAuthError = () => {
  const { error } = useAuth();
  return error;
};
