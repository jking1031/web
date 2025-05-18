// 简单的认证提供者，不进行实际的认证
const simpleAuthProvider = {
  // 登录
  login: ({ username, password }) => {
    console.log('simpleAuthProvider.login', { username, password });
    // 始终允许登录
    localStorage.setItem('username', username);
    return Promise.resolve();
  },
  
  // 登出
  logout: () => {
    console.log('simpleAuthProvider.logout');
    localStorage.removeItem('username');
    return Promise.resolve();
  },
  
  // 检查错误
  checkError: (error) => {
    console.log('simpleAuthProvider.checkError', error);
    // 不处理错误
    return Promise.resolve();
  },
  
  // 检查认证状态
  checkAuth: () => {
    console.log('simpleAuthProvider.checkAuth');
    // 不检查认证状态，始终返回成功
    return Promise.resolve();
  },
  
  // 获取权限
  getPermissions: () => {
    console.log('simpleAuthProvider.getPermissions');
    // 不检查权限，始终返回成功
    return Promise.resolve();
  },
};

export default simpleAuthProvider;
