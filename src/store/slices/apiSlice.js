import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { BaseUrlManager } from '../../services/api';

/**
 * API切片 - 使用RTK Query实现API调用
 * 提供自动缓存、重新获取、加载状态等功能
 */
const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: BaseUrlManager.getBaseUrl(),
    prepareHeaders: (headers, { getState }) => {
      // 从状态中获取令牌
      const token = getState().auth.token;
      
      // 如果有令牌，添加到请求头
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      
      // 添加请求ID用于跟踪
      headers.set('X-Request-ID', crypto.randomUUID());
      
      return headers;
    },
    timeout: 30000, // 30秒超时
  }),
  tagTypes: ['Device', 'Alarm', 'Telemetry', 'User', 'Site'],
  endpoints: (builder) => ({
    // 设备相关端点
    getDevices: builder.query({
      query: (params = {}) => ({
        url: '/api/devices',
        params,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: 'Device', id })),
              { type: 'Device', id: 'LIST' },
            ]
          : [{ type: 'Device', id: 'LIST' }],
    }),
    
    getDeviceById: builder.query({
      query: (id) => `/api/devices/${id}`,
      providesTags: (result, error, id) => [{ type: 'Device', id }],
    }),
    
    // 遥测数据端点
    getDeviceTelemetry: builder.query({
      query: ({ deviceId, keys, startTs, endTs }) => ({
        url: `/api/devices/${deviceId}/telemetry`,
        params: { keys, startTs, endTs },
      }),
      providesTags: (result, error, { deviceId }) => [
        { type: 'Telemetry', id: deviceId },
      ],
    }),
    
    // 告警端点
    getAlarms: builder.query({
      query: (params = {}) => ({
        url: '/api/alarms',
        params,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: 'Alarm', id })),
              { type: 'Alarm', id: 'LIST' },
            ]
          : [{ type: 'Alarm', id: 'LIST' }],
    }),
    
    // 用户端点
    getUsers: builder.query({
      query: (params = {}) => ({
        url: '/api/users',
        params,
      }),
      providesTags: [{ type: 'User', id: 'LIST' }],
    }),
    
    // 站点端点
    getSites: builder.query({
      query: (params = {}) => ({
        url: '/api/sites',
        params,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: 'Site', id })),
              { type: 'Site', id: 'LIST' },
            ]
          : [{ type: 'Site', id: 'LIST' }],
    }),
    
    getSiteById: builder.query({
      query: (id) => `/api/sites/${id}`,
      providesTags: (result, error, id) => [{ type: 'Site', id }],
    }),
  }),
});

// 导出生成的钩子
export const {
  useGetDevicesQuery,
  useGetDeviceByIdQuery,
  useGetDeviceTelemetryQuery,
  useGetAlarmsQuery,
  useGetUsersQuery,
  useGetSitesQuery,
  useGetSiteByIdQuery,
} = apiSlice;

export default apiSlice;
