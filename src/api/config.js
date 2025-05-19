// 判断是否为开发环境
const isDevelopment = import.meta.env.DEV;

// API基础URL
export const AUTH_BASE_URL = isDevelopment ? '/auth-api' : 'https://zziot.jzz77.cn:9003'; // 用于认证相关API
export const ADMIN_BASE_URL = isDevelopment ? '/admin-api' : 'https://nodered.jzz77.cn:9003'; // 用于管理员状态检查API
export const BASE_URL = isDevelopment ? '/api' : 'https://nodered.jzz77.cn:9003'; // 用于其他API
export const USER_BASE_URL = isDevelopment ? '/auth-api' : 'https://zziot.jzz77.cn:9003'; // 用于用户管理相关API

// WebSocket基础URL
export const WS_BASE_URL = isDevelopment ? `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws` : 'wss://nodered.jzz77.cn:9003/ws';

// API请求超时时间 (毫秒)
export const REQUEST_TIMEOUT = 10000;

// API响应代码
export const API_RESPONSE_CODES = {
  SUCCESS: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  SERVER_ERROR: 500
};

// 缓存Key
export const CACHE_KEYS = {
  TOKEN: 'auth_token',
  USER_INFO: 'user_info',
  TICKETS: 'cached_tickets',
  TICKET_DETAIL: 'ticket_detail_'
};

// API端点
export const API_ENDPOINTS = {
  // 认证相关 - 直接使用指定的完整URL
  LOGIN: 'https://zziot.jzz77.cn:9003/api/login',
  REGISTER: 'https://zziot.jzz77.cn:9003/api/register',
  LOGOUT: '/auth-api/api/logout',
  USER_INFO: '/auth-api/api/user',

  // 管理员状态检查 - 使用nodered.jzz77.cn:9003
  CHECK_ADMIN_STATUS: '/admin-api/api/check-admin-status',

  // 用户管理相关 - 使用zziot.jzz77.cn:9003
  USERS: '/auth-api/api/users',
  USER_ROLES: '/auth-api/api/users/roles',
  ASSIGN_ROLE: '/auth-api/api/users/assign-role',
  REMOVE_ROLE: '/auth-api/api/users/remove-role',
  TOGGLE_ADMIN: '/auth-api/api/users/toggle-admin',
  TOGGLE_USER_STATUS: '/auth-api/api/users/toggle-status',

  // 站点相关
  SITES: '/api/sites',
  SITE_DETAIL: (id) => `/api/sites/${id}`,
  SITE_DEVICES: (id) => `/api/sites/${id}/devices`,
  SITE_ALARMS: (id) => `/api/sites/${id}/alarms`,
  SITE_DATA: (id) => `/api/sites/${id}/data`,

  // 数据相关
  DATA_QUERY: '/api/data/query',
  DATA_EXPORT: '/api/data/export',
  STATS_OVERVIEW: '/api/stats/overview',
  HISTORY_DATA_QUERY: '/api/data/history',

  // 报表相关
  REPORTS: '/api/reports',
  REPORT_DETAIL: (id) => `/api/reports/${id}`,
  REPORT_TEMPLATES: '/api/reports/templates',
  REPORTS_5000: '/api/reports5000',
  REPORTS_SLUDGE: '/api/reportssludge',
  REPORTS_PUMP: '/api/reportspump',
  REPORTS_DYNAMIC: '/api/reports/dynamic',

  // 工单相关
  TICKETS: '/api/tickets',
  TICKET_BY_ID: (id) => `/api/tickets/${id}`,
  TICKET_STATUS: (id) => `/api/tickets/${id}/status`,
  TICKET_COMMENTS: (id) => `/api/tickets/${id}/comments`,
  TICKET_ASSIGN: (id) => `/api/tickets/${id}/assign`,
  TICKET_FILTERS: '/api/tickets/filters',
  TICKET_STATS: '/api/tickets/stats',

  // 化验数据相关
  LAB_DATA: '/api/labdata',
  LAB_DATA_ENTRY: '/api/labdata/entry',
  SLUDGE_DATA: '/api/sludgedata',
  AO_DATA: '/api/aodata',

  // 泵站相关
  PUMP_STATIONS: '/api/pumpstations',

  // 计算器相关
  CALCULATORS: '/api/calculators',

  // 文件上传
  FILE_UPLOAD: '/api/files/upload',

  // 消息通知 - 与移动端保持一致
  NOTIFICATIONS: '/api/notifications',
  MESSAGES: '/api/messages',
  MESSAGES_QUERY: '/api/messagesquery',

  // 这些已经在上面定义过了，这里删除重复定义

  // 系统设置
  SETTINGS: '/api/settings',
};