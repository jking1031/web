import { AuthProvider, AuthContext } from './AuthProvider';
import { useAuth, useUser, useAdmin, useRoles, useLoggedIn, useAuthLoading, useAuthError } from './AuthHooks';
import { AUTH_STATUS, USER_ROLES, AUTH_EVENTS } from './AuthTypes';
import { handleSessionExpired, checkAdminStatusAPI, fetchUserRoles, clearAuthData } from './AuthUtils';

export {
  AuthProvider,
  AuthContext,
  useAuth,
  useUser,
  useAdmin,
  useRoles,
  useLoggedIn,
  useAuthLoading,
  useAuthError,
  AUTH_STATUS,
  USER_ROLES,
  AUTH_EVENTS,
  handleSessionExpired,
  checkAdminStatusAPI,
  fetchUserRoles,
  clearAuthData
};

export default AuthProvider;
