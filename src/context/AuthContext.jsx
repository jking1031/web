// 此文件已被拆分为多个小文件，保留此文件是为了向后兼容
// 新代码应该直接导入 ./auth 目录中的文件

import {
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
  AUTH_EVENTS
} from './auth';

// 导出原始的AuthProvider组件，保持向后兼容
export { AuthProvider };

// 导出useAuth钩子，保持向后兼容
export { useAuth };

// 导出默认的AuthContext
export default AuthContext;
