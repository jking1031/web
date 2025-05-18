/**
 * 认证相关类型定义
 */

// 认证状态类型
export const AUTH_STATUS = {
  IDLE: 'idle',
  LOADING: 'loading',
  AUTHENTICATED: 'authenticated',
  UNAUTHENTICATED: 'unauthenticated',
  ERROR: 'error'
};

// 用户角色类型
export const USER_ROLES = {
  ADMIN: 'admin',
  USER: 'user',
  GUEST: 'guest',
  OPERATOR: 'operator',
  MANAGER: 'manager'
};

// 认证事件类型
export const AUTH_EVENTS = {
  LOGIN: 'auth:login',
  LOGOUT: 'auth:logout',
  SESSION_EXPIRED: 'auth:session_expired',
  TOKEN_REFRESHED: 'auth:token_refreshed',
  USER_UPDATED: 'auth:user_updated'
};
