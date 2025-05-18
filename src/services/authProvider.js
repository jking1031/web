import axios from 'axios';

// 创建axios实例
const apiClient = axios.create({
  baseURL: 'https://zziot.jzz77.cn:9003',
  headers: {
    'Content-Type': 'application/json',
  },
});

// 认证提供者
const authProvider = {
  // 登录
  login: async ({ username, password }) => {
    try {
      const response = await apiClient.post('/login', { username, password });

      if (response.data && response.data.token) {
        // 保存token和用户信息
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));

        // 检查是否是管理员
        const isAdmin = response.data.user.role === 'admin';
        localStorage.setItem('isAdmin', isAdmin ? 'true' : 'false');

        return Promise.resolve();
      } else {
        return Promise.reject(new Error('登录失败: 无效的响应'));
      }
    } catch (error) {
      console.error('登录错误:', error);
      return Promise.reject(new Error(
        error.response?.data?.message || '登录失败，请检查用户名和密码'
      ));
    }
  },

  // 注销
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('isAdmin');
    return Promise.resolve();
  },

  // 检查错误 - 如果是认证错误，则注销
  checkError: (error) => {
    const status = error.status || error.response?.status;
    if (status === 401 || status === 403) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('isAdmin');
      return Promise.reject(new Error('会话已过期，请重新登录'));
    }
    return Promise.resolve();
  },

  // 检查认证状态
  checkAuth: () => {
    const token = localStorage.getItem('token');
    if (!token) {
      return Promise.reject(new Error('未登录'));
    }

    // 注意：我们不在这里验证token，避免无限循环
    // 只检查token是否存在，实际验证在需要时进行

    return Promise.resolve();
  },

  // 获取权限
  getPermissions: () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const isAdmin = localStorage.getItem('isAdmin') === 'true';

    return Promise.resolve({
      role: user.role || 'user',
      isAdmin,
      permissions: user.permissions || [],
    });
  },

  // 获取身份
  getIdentity: () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    if (!user || !user.id) {
      return Promise.reject(new Error('用户信息不存在'));
    }

    return Promise.resolve({
      id: user.id,
      fullName: user.name || user.username,
      avatar: user.avatar || 'https://source.unsplash.com/random/100x100/?portrait',
      role: user.role || 'user',
    });
  },
};

export default authProvider;
