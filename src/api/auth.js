import axios from 'axios';
import { REQUEST_TIMEOUT, CACHE_KEYS, AUTH_BASE_URL } from './config';
import { EventEmitter } from '../utils/EventEmitter';

/**
 * 创建用于认证的axios实例
 * 与移动端保持一致的配置
 */
const authApi = axios.create({
  // 不使用baseURL，因为我们在API_ENDPOINTS中已经包含了完整路径
  timeout: REQUEST_TIMEOUT,
  headers: {
    'Content-Type': 'application/json'
  }
});

/**
 * 保存认证Token到localStorage
 * @param {string} token 认证Token
 * @returns {boolean} 操作是否成功
 */
export const saveAuthToken = (token) => {
  try {
    localStorage.setItem(CACHE_KEYS.TOKEN, token);
    return true;
  } catch (error) {
    console.error('保存令牌失败:', error);
    return false;
  }
};

/**
 * 获取认证Token
 * @returns {string|null} 认证Token
 */
export const getAuthToken = () => {
  try {
    return localStorage.getItem(CACHE_KEYS.TOKEN);
  } catch (error) {
    console.error('获取令牌失败:', error);
    return null;
  }
};

/**
 * 清除认证Token
 * @returns {boolean} 操作是否成功
 */
export const clearAuthToken = () => {
  try {
    localStorage.removeItem(CACHE_KEYS.TOKEN);
    return true;
  } catch (error) {
    console.error('清除令牌失败:', error);
    return false;
  }
};

/**
 * 保存用户信息
 * @param {Object} userInfo 用户信息对象
 * @returns {boolean} 操作是否成功
 */
export const saveUserInfo = (userInfo) => {
  try {
    localStorage.setItem(CACHE_KEYS.USER_INFO, JSON.stringify(userInfo));
    return true;
  } catch (error) {
    console.error('保存用户信息失败:', error);
    return false;
  }
};

/**
 * 获取用户信息
 * @returns {Object|null} 用户信息对象
 */
export const getUserInfo = () => {
  try {
    const userInfo = localStorage.getItem(CACHE_KEYS.USER_INFO);
    return userInfo ? JSON.parse(userInfo) : null;
  } catch (error) {
    console.error('获取用户信息失败:', error);
    return null;
  }
};

/**
 * 清除用户信息
 * @returns {boolean} 操作是否成功
 */
export const clearUserInfo = () => {
  try {
    localStorage.removeItem(CACHE_KEYS.USER_INFO);
    return true;
  } catch (error) {
    console.error('清除用户信息失败:', error);
    return false;
  }
};

/**
 * 创建本地令牌 - 当后端未提供令牌时使用
 * @param {Object} user 用户信息
 * @returns {string|null} 创建的令牌
 */
export const createToken = (user) => {
  // 令牌头部
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };

  // 确保管理员信息的正确处理 - 只有数字1才是管理员
  let adminValue = 0; // 默认非管理员

  // 优先使用is_admin_value字段，这是保存的原始值
  if (user.is_admin_value !== undefined) {
    adminValue = user.is_admin_value;
  }
  // 其次检查is_admin字段
  else if (user.is_admin !== undefined) {
    // 如果是数字1，则是管理员
    adminValue = user.is_admin === 1 ? 1 : 0;
  }
  // 最后检查其他可能的字段
  else if (user.isAdmin === 1 || user.admin === 1) {
    adminValue = 1;
  }

  // 确保adminValue是数字类型
  adminValue = Number(adminValue);

  console.log('[创建本地令牌] 管理员状态:', adminValue, '类型:', typeof adminValue);

  // 令牌有效数据
  const payload = {
    id: user.id,
    username: user.username || user.name,
    email: user.email,
    is_admin: adminValue, // 使用处理过的管理员值
    // 令牌有效期 - 12小时
    exp: Math.floor(Date.now() / 1000) + (12 * 60 * 60),
    iat: Math.floor(Date.now() / 1000)
  };

  // 记录完整的payload内容用于调试
  console.log('[创建本地令牌] payload内容:', JSON.stringify(payload));

  try {
    // 改进的base64编码函数，正确处理UTF-8字符
    const base64Encode = (str) => {
      try {
        // 将字符串转换为UTF-8编码的字节
        const bytes = new TextEncoder().encode(str);
        const binString = Array.from(bytes).map(byte => String.fromCharCode(byte)).join('');
        return btoa(binString);
      } catch (e) {
        console.error('Base64编码失败:', e);
        // 如果上述方法失败，尝试使用URL编码后再进行base64编码
        return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) =>
          String.fromCharCode(parseInt(p1, 16))
        ));
      }
    };

    // 使用改进的base64编码函数
    const encodedHeader = base64Encode(JSON.stringify(header));
    const encodedPayload = base64Encode(JSON.stringify(payload));
    // 简化的签名
    const signature = base64Encode(`${encodedHeader}.${encodedPayload}.secret`);

    return `${encodedHeader}.${encodedPayload}.${signature}`;
  } catch (error) {
    console.error('[创建本地令牌] 错误:', error, '用户数据:', JSON.stringify(user).substring(0, 100));

    // 创建一个基础令牌，仅包含必要信息
    try {
      // 仅保留基本信息的简单负载
      const simplePayload = {
        id: user.id,
        exp: Math.floor(Date.now() / 1000) + (12 * 60 * 60)
      };

      const encodedHeader = btoa(JSON.stringify(header));
      const encodedPayload = btoa(JSON.stringify(simplePayload));
      const signature = btoa(`${encodedHeader}.${encodedPayload}.secret`);

      console.log('[创建本地令牌] 已创建备用简化令牌');
      return `${encodedHeader}.${encodedPayload}.${signature}`;
    } catch (backupError) {
      console.error('[创建本地令牌] 创建备用令牌也失败:', backupError);
      return null;
    }
  }
};

/**
 * 刷新认证令牌
 * @returns {Promise<boolean>} 刷新是否成功
 */
export const refreshToken = async () => {
  try {
    const userData = getUserInfo();
    if (!userData) {
      console.error('[令牌刷新] 无用户数据');
      return false;
    }

    try {
      // 方法1：调用后端刷新令牌接口
      const response = await axios.post(`${AUTH_BASE_URL}/api/refresh-token`, {
        userId: userData.id,
        email: userData.email
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.data && response.data.token) {
        saveAuthToken(response.data.token);
        console.log('[令牌刷新] 成功获取新令牌');
        return true;
      }
    } catch (apiError) {
      console.log('[令牌刷新API] 失败:', apiError.message);

      // 方法2：如果API请求失败，创建本地令牌（作为备选）
      const token = createToken(userData);
      if (token) {
        saveAuthToken(token);
        console.log('[令牌刷新] 已创建本地令牌');
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error('[令牌刷新] 错误:', error);
    return false;
  }
};

/**
 * 检查令牌有效性
 * @returns {boolean} 令牌是否有效
 */
export const checkTokenValidity = () => {
  try {
    const token = getAuthToken();
    if (!token) return false;

    // 解析令牌
    const parts = token.split('.');
    if (parts.length !== 3) return false;

    // 改进的base64解码函数，正确处理UTF-8字符
    const base64Decode = (str) => {
      try {
        // 处理可能的URL安全base64编码
        const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
        const binary = atob(base64);

        // 将二进制字符串转换为UTF-8字符
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }

        // 使用TextDecoder将UTF-8字节转换为字符串
        return new TextDecoder().decode(bytes);
      } catch (error) {
        console.error('解码令牌失败:', error);
        return null;
      }
    };

    const payload = JSON.parse(base64Decode(parts[1]));

    // 检查过期时间
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      console.log('[令牌检查] 令牌已过期');
      return false;
    }

    return true;
  } catch (error) {
    console.error('[令牌检查] 错误:', error);
    return false;
  }
};

// 请求拦截器
authApi.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;

      // 令牌解析 - 仅在开发环境或首次请求时执行
      try {
        // 使用会话存储来跟踪是否已经记录过令牌信息
        const tokenLogged = sessionStorage.getItem('token_logged');

        // 只在首次请求时记录令牌信息
        if (!tokenLogged && process.env.NODE_ENV === 'development') {
          const parts = token.split('.');
          if (parts.length === 3) {
            // 尝试解码令牌payload部分
            const base64Decode = (str) => {
              try {
                return atob(str);
              } catch (e) {
                try {
                  // 处理可能的URL安全base64编码
                  const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
                  return atob(base64);
                } catch (error) {
                  console.error('[auth] 解码令牌失败:', error.message);
                  return null;
                }
              }
            };

            const decodedPayload = base64Decode(parts[1]);
            if (decodedPayload) {
              const payload = JSON.parse(decodedPayload);

              // 只记录一次令牌信息
              console.log('[auth] 令牌信息:', {
                id: payload.id,
                username: payload.username,
                is_admin: payload.is_admin,
                is_admin_type: typeof payload.is_admin
              });

              // 标记已记录令牌信息
              sessionStorage.setItem('token_logged', 'true');
            }
          }
        }
      } catch (parseError) {
        console.error('[auth] 令牌解析错误:', parseError.message);
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
authApi.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    if (error.response) {
      // 服务器返回错误
      console.error('API错误:', error.response.status, error.response.data);

      // 处理401未授权错误 - 可能是token过期
      if (error.response.status === 401) {
        console.log('[令牌过期] 尝试刷新令牌');

        try {
          // 尝试刷新令牌
          const refreshSuccessful = await refreshToken();

          if (refreshSuccessful) {
            // 令牌刷新成功，重试原始请求
            console.log('[令牌刷新成功] 重试原始请求');

            // 获取新的令牌
            const newToken = getAuthToken();

            // 使用新令牌创建新的请求配置
            const originalRequest = error.config;
            originalRequest.headers.Authorization = `Bearer ${newToken}`;

            // 重试请求
            return axios(originalRequest);
          } else {
            // 令牌刷新失败，通知登录过期
            console.log('[令牌刷新失败] 通知登录过期');

            // 清除认证信息
            clearAuthToken();
            clearUserInfo();

            // 触发会话过期事件
            EventEmitter.emit('SESSION_EXPIRED');

            // 如果不是登录页面，重定向到登录页面
            if (!window.location.pathname.includes('/login')) {
              window.location.href = '/login';
            }
          }
        } catch (refreshError) {
          console.error('[令牌刷新错误]', refreshError);

          // 清除认证信息
          clearAuthToken();
          clearUserInfo();

          // 如果不是登录页面，重定向到登录页面
          if (!window.location.pathname.includes('/login')) {
            window.location.href = '/login';
          }
        }
      }
    } else if (error.request) {
      // 请求发送但没有收到响应
      console.error('网络错误:', error.request);
    } else {
      // 请求设置时出错
      console.error('请求错误:', error.message);
    }

    return Promise.reject(error);
  }
);

/**
 * 从本地存储获取令牌 (兼容utils/auth.js)
 * @returns {string|null} 用户认证令牌，如果不存在则返回null
 */
export const getToken = getAuthToken;

/**
 * 从本地存储清除令牌 (兼容utils/auth.js)
 */
export const clearToken = clearAuthToken;

/**
 * 检查用户是否已登录 (兼容utils/auth.js)
 * @returns {boolean} 用户是否已登录
 */
export const isLoggedIn = () => {
  return !!getToken();
};

/**
 * 保存用户信息到本地存储 (兼容utils/auth.js)
 * @param {Object} userInfo - 用户信息对象
 */
export const setUserInfo = saveUserInfo;

/**
 * 检查用户是否是管理员 (兼容utils/auth.js)
 * @returns {boolean} 用户是否是管理员
 */
export const isAdmin = () => {
  const userInfo = getUserInfo();
  return userInfo ? userInfo.isAdmin === true : false;
};

/**
 * 完全登出，清除所有认证相关的数据 (兼容utils/auth.js)
 */
export const logout = () => {
  clearAuthToken();
  clearUserInfo();
};

/**
 * 解析JWT令牌 (兼容utils/auth.js)
 * @param {string} token - JWT令牌
 * @returns {Object|null} 解析后的令牌载荷，如果解析失败则返回null
 */
export const parseJwt = (token) => {
  if (!token) return null;

  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );

    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('解析JWT令牌失败:', error);
    return null;
  }
};

/**
 * 检查令牌是否已过期 (兼容utils/auth.js)
 * @returns {boolean} 令牌是否已过期
 */
export const isTokenExpired = () => {
  const token = getToken();
  if (!token) return true;

  try {
    const decoded = parseJwt(token);
    if (!decoded || !decoded.exp) return true;

    // 令牌过期时间（秒）转换为毫秒
    const expirationTime = decoded.exp * 1000;
    const currentTime = Date.now();

    return currentTime >= expirationTime;
  } catch (error) {
    console.error('检查令牌过期失败:', error);
    return true;
  }
};

/**
 * 保存令牌到本地存储 (兼容utils/auth.js)
 * @param {string} token - 用户认证令牌
 */
export const setToken = saveAuthToken;

export default authApi;
