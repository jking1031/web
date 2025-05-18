import axios from 'axios';
import { REQUEST_TIMEOUT, API_RESPONSE_CODES, CACHE_KEYS } from './config';
import { EventEmitter } from '../utils/EventEmitter';
import {
  getAuthToken,
  clearAuthToken,
  clearUserInfo,
  refreshToken,
  checkTokenValidity
} from './auth';

// 创建axios实例
const api = axios.create({
  // 不使用baseURL，因为我们在API_ENDPOINTS中已经包含了完整路径
  timeout: REQUEST_TIMEOUT,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 请求拦截器 - 自动添加认证令牌到每个请求
api.interceptors.request.use(
  async (config) => {
    const token = getAuthToken();

    // 如果有令牌，添加到请求头
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;

      // 令牌解析 - 仅在开发环境或首次请求时执行
      try {
        // 使用会话存储来跟踪是否已经记录过令牌信息
        const tokenLogged = sessionStorage.getItem('token_logged');

        // 只在首次请求时记录令牌信息
        if (!tokenLogged) {
          const parts = token.split('.');
          if (parts.length === 3) {
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
                console.error('[拦截器] 解码令牌失败:', error.message);
                return null;
              }
            };

            const decodedPayload = base64Decode(parts[1]);
            if (decodedPayload) {
              const payload = JSON.parse(decodedPayload);

              // 只记录一次令牌信息
              console.log('[拦截器] 令牌信息:', {
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
        console.error('[拦截器] 令牌解析错误:', parseError.message);
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    if (error.response) {
      const { status } = error.response;
      console.error('API错误:', status, error.response.data);

      // 处理401未授权错误 - 可能是token过期
      if (status === API_RESPONSE_CODES.UNAUTHORIZED) {
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

      // 处理其他错误状态码
      switch (status) {
        case API_RESPONSE_CODES.BAD_REQUEST:
          console.error('请求参数错误');
          break;
        case API_RESPONSE_CODES.FORBIDDEN:
          console.error('没有权限访问该资源');
          break;
        case API_RESPONSE_CODES.NOT_FOUND:
          console.error('请求的资源不存在');
          break;
        case API_RESPONSE_CODES.SERVER_ERROR:
          console.error('服务器内部错误');
          break;
        default:
          console.error(`未处理的错误状态码: ${status}`);
      }
    } else if (error.request) {
      // 请求已发出但未收到响应
      console.error('网络连接失败，请检查您的网络');
    } else {
      // 请求配置时出错
      console.error('请求配置错误:', error.message);
    }

    return Promise.reject(error);
  }
);

export default api;