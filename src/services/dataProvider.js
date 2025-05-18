import { fetchUtils } from 'react-admin';
import { stringify } from 'query-string';
import axios from 'axios';

// 获取存储在localStorage中的token
const getAuthToken = () => {
  return localStorage.getItem('token');
};

// 创建一个带有认证头的httpClient
const httpClient = (url, options = {}) => {
  if (!options.headers) {
    options.headers = new Headers({ Accept: 'application/json' });
  }
  const token = getAuthToken();
  if (token) {
    options.headers.set('Authorization', `Bearer ${token}`);
  }
  return fetchUtils.fetchJson(url, options);
};

// 创建一个axios实例用于自定义请求
const apiClient = axios.create({
  baseURL: 'https://nodered.jzz77.cn:9003',
  headers: {
    'Content-Type': 'application/json',
  },
});

// 创建一个axios实例用于zziot API
const zziotClient = axios.create({
  baseURL: 'https://zziot.jzz77.cn:9003',
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器 - 添加认证令牌
apiClient.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器 - 处理认证错误
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // 不要在这里处理401/403错误，避免无限循环
    // 只记录错误并继续传播
    console.error('API请求错误:', error.message);
    return Promise.reject(error);
  }
);

// 为zziotClient添加请求拦截器
zziotClient.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 为zziotClient添加响应拦截器
zziotClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // 不要在这里处理401/403错误，避免无限循环
    console.error('ZZIOT API请求错误:', error.message);
    return Promise.reject(error);
  }
);

/**
 * 将React-Admin数据提供者映射到您的API
 * @param {string} apiUrl - API基础URL
 * @returns {Object} - React-Admin数据提供者
 */
const dataProvider = {
  // 生成模拟月度生产数据
  generateMockMonthlyData: () => {
    console.log('dataProvider: 生成模拟月度生产数据');
    const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
    const currentMonth = new Date().getMonth();

    // 创建过去12个月的数据
    return {
      totalProcessing_in: Math.floor(Math.random() * 5000) + 10000,
      totalProcessing_out: Math.floor(Math.random() * 4500) + 9000,
      chemicalUsage: Math.floor(Math.random() * 500) + 1000,
      energyConsumption: Math.floor(Math.random() * 2000) + 5000,
      sludgeProduction: Math.floor(Math.random() * 300) + 700,
      carbonUsage: Math.floor(Math.random() * 200) + 500,
      phosphorusRemoval: Math.floor(Math.random() * 150) + 300,
      disinfectant: Math.floor(Math.random() * 100) + 200,
      electricity: Math.floor(Math.random() * 3000) + 7000,
      pacUsage: Math.floor(Math.random() * 250) + 500,
      pamUsage: Math.floor(Math.random() * 150) + 300,
      monthlyData: months.map((month, index) => {
        // 计算实际月份（当前月份往前推）
        const actualMonthIndex = (currentMonth - 11 + index + 12) % 12;
        const actualMonth = months[actualMonthIndex];

        return {
          month: actualMonth,
          产量: Math.floor(Math.random() * 1000) + 500,
          目标: 800
        };
      })
    };
  },

  // 生成模拟设备状态数据
  generateMockDeviceStatus: () => {
    console.log('dataProvider: 生成模拟设备状态数据');
    return {
      online: Math.floor(Math.random() * 20) + 30,
      offline: Math.floor(Math.random() * 10) + 5,
      warning: Math.floor(Math.random() * 8) + 2,
      error: Math.floor(Math.random() * 5) + 1
    };
  },

  // 生成模拟告警数据
  generateMockAlerts: () => {
    console.log('dataProvider: 生成模拟告警数据');
    const alarmTypes = ['设备离线', '温度过高', '压力异常', '流量过大', '水位过高'];
    const devices = ['水泵1号', '水泵2号', '阀门控制器', '水位传感器', '压力传感器'];
    const levels = ['警告', '严重', '紧急'];

    return Array(5).fill().map((_, i) => ({
      id: i + 1,
      type: alarmTypes[Math.floor(Math.random() * alarmTypes.length)],
      device: devices[Math.floor(Math.random() * devices.length)],
      level: levels[Math.floor(Math.random() * levels.length)],
      timestamp: new Date(Date.now() - Math.floor(Math.random() * 86400000)).toLocaleString(),
      status: Math.random() > 0.5 ? '已处理' : '未处理'
    }));
  },

  // 自定义方法 - 获取月度生产统计
  getMonthlyStats: async () => {
    console.log('dataProvider: 获取月度生产统计');
    try {
      // 设置超时，避免长时间等待
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const response = await apiClient.get('/api/stats/overview', {
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.data) {
        console.log('dataProvider: 成功获取月度生产统计');
        return response.data;
      } else {
        console.log('dataProvider: 月度生产统计数据为空，使用模拟数据');
        return dataProvider.generateMockMonthlyData();
      }
    } catch (error) {
      console.error('dataProvider: 获取月度生产统计失败:', error.message);
      // 返回模拟数据
      return dataProvider.generateMockMonthlyData();
    }
  },

  // 自定义方法 - 获取设备状态
  getDeviceStatus: async () => {
    console.log('dataProvider: 获取设备状态');
    try {
      // 设置超时，避免长时间等待
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const response = await apiClient.get('/api/devices/status', {
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.data) {
        console.log('dataProvider: 成功获取设备状态');
        return response.data;
      } else {
        console.log('dataProvider: 设备状态数据为空，使用模拟数据');
        return dataProvider.generateMockDeviceStatus();
      }
    } catch (error) {
      console.error('dataProvider: 获取设备状态失败:', error.message);
      // 返回模拟数据
      return dataProvider.generateMockDeviceStatus();
    }
  },

  // 自定义方法 - 获取告警信息
  getAlerts: async () => {
    console.log('dataProvider: 获取告警信息');
    try {
      // 设置超时，避免长时间等待
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const response = await apiClient.get('/api/messages', {
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      let alerts = [];

      if (Array.isArray(response.data)) {
        console.log('dataProvider: 成功获取告警信息(数组格式)');
        alerts = response.data;
      } else if (response.data && Array.isArray(response.data.messages)) {
        console.log('dataProvider: 成功获取告警信息(嵌套格式)');
        alerts = response.data.messages;
      } else {
        console.log('dataProvider: 告警信息数据为空或格式不正确，使用模拟数据');
        return dataProvider.generateMockAlerts();
      }

      return alerts;
    } catch (error) {
      console.error('dataProvider: 获取告警信息失败:', error.message);
      // 返回模拟数据
      return dataProvider.generateMockAlerts();
    }
  },

  // 获取资源列表
  getList: async (resource, params) => {
    const { page, perPage } = params.pagination;
    const { field, order } = params.sort;

    // 构建查询参数
    const query = {
      sort: JSON.stringify([field, order]),
      range: JSON.stringify([(page - 1) * perPage, page * perPage - 1]),
      filter: JSON.stringify(params.filter),
    };

    // 根据资源类型构建URL
    let url = '';
    let response = null;

    switch (resource) {
      case 'devices':
        // 设备列表API
        url = '/api/devices';
        response = await apiClient.get(url, { params: query });
        return {
          data: response.data.data || [],
          total: response.data.total || 0,
        };

      case 'statistics':
        // 统计数据API
        url = '/api/statistics';
        response = await apiClient.get(url, { params: query });
        return {
          data: response.data.data || [],
          total: response.data.total || 0,
        };

      case 'alarms':
        // 告警信息API
        url = '/api/alarms';
        response = await apiClient.get(url, { params: query });
        return {
          data: response.data.data || [],
          total: response.data.total || 0,
        };

      case 'custom-queries':
        // 自定义查询API
        url = '/custom-query';
        response = await apiClient.post(url, {
          ...params.filter,
          page,
          pageSize: perPage,
        });
        return {
          data: response.data.data || [],
          total: response.data.total || response.data.data?.length || 0,
        };

      default:
        // 默认处理
        url = `/${resource}?${stringify(query)}`;
        const { json } = await httpClient(url);
        return {
          data: json.data || [],
          total: json.total || 0,
        };
    }
  },

  // 获取单个资源
  getOne: async (resource, params) => {
    let url = '';
    let response = null;

    switch (resource) {
      case 'devices':
        url = `/api/devices/${params.id}`;
        response = await apiClient.get(url);
        return { data: response.data };

      case 'statistics':
        url = `/api/statistics/${params.id}`;
        response = await apiClient.get(url);
        return { data: response.data };

      default:
        const { json } = await httpClient(`/${resource}/${params.id}`);
        return { data: json };
    }
  },

  // 获取多个资源
  getMany: async (resource, params) => {
    const query = {
      filter: JSON.stringify({ id: params.ids }),
    };
    const url = `/${resource}?${stringify(query)}`;
    const { json } = await httpClient(url);
    return { data: json };
  },

  // 获取引用的多个资源
  getManyReference: async (resource, params) => {
    const { page, perPage } = params.pagination;
    const { field, order } = params.sort;

    const query = {
      sort: JSON.stringify([field, order]),
      range: JSON.stringify([(page - 1) * perPage, page * perPage - 1]),
      filter: JSON.stringify({
        ...params.filter,
        [params.target]: params.id,
      }),
    };

    const url = `/${resource}?${stringify(query)}`;
    const { json, headers } = await httpClient(url);
    return {
      data: json,
      total: parseInt(headers.get('content-range').split('/').pop(), 10),
    };
  },

  // 创建资源
  create: async (resource, params) => {
    let url = '';
    let response = null;

    switch (resource) {
      case 'devices':
        url = '/api/devices';
        response = await apiClient.post(url, params.data);
        return { data: { ...params.data, id: response.data.id } };

      default:
        const { json } = await httpClient(`/${resource}`, {
          method: 'POST',
          body: JSON.stringify(params.data),
        });
        return { data: { ...params.data, id: json.id } };
    }
  },

  // 更新资源
  update: async (resource, params) => {
    let url = '';
    let response = null;

    switch (resource) {
      case 'devices':
        url = `/api/devices/${params.id}`;
        response = await apiClient.put(url, params.data);
        return { data: response.data };

      default:
        const { json } = await httpClient(`/${resource}/${params.id}`, {
          method: 'PUT',
          body: JSON.stringify(params.data),
        });
        return { data: json };
    }
  },

  // 更新资源的部分字段
  updateMany: async (resource, params) => {
    const query = {
      filter: JSON.stringify({ id: params.ids }),
    };
    const { json } = await httpClient(`/${resource}?${stringify(query)}`, {
      method: 'PUT',
      body: JSON.stringify(params.data),
    });
    return { data: json };
  },

  // 删除资源
  delete: async (resource, params) => {
    let url = '';
    let response = null;

    switch (resource) {
      case 'devices':
        url = `/api/devices/${params.id}`;
        response = await apiClient.delete(url);
        return { data: response.data };

      default:
        const { json } = await httpClient(`/${resource}/${params.id}`, {
          method: 'DELETE',
        });
        return { data: json };
    }
  },

  // 删除多个资源
  deleteMany: async (resource, params) => {
    const query = {
      filter: JSON.stringify({ id: params.ids }),
    };
    const { json } = await httpClient(`/${resource}?${stringify(query)}`, {
      method: 'DELETE',
    });
    return { data: json };
  },
};

export default dataProvider;
