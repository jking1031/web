import { createSlice } from '@reduxjs/toolkit';

/**
 * 设备状态切片
 * 管理设备列表、设备状态和设备操作
 */
const initialState = {
  devices: [],
  selectedDevice: null,
  deviceStats: {
    total: 0,
    active: 0,
    inactive: 0,
    maintenance: 0,
  },
  loading: false,
  error: null,
};

const deviceSlice = createSlice({
  name: 'devices',
  initialState,
  reducers: {
    setDevices: (state, action) => {
      state.devices = action.payload;
      
      // 更新设备统计
      state.deviceStats = action.payload.reduce(
        (stats, device) => {
          stats.total += 1;
          stats[device.status] += 1;
          return stats;
        },
        { total: 0, active: 0, inactive: 0, maintenance: 0 }
      );
    },
    setSelectedDevice: (state, action) => {
      state.selectedDevice = action.payload;
    },
    updateDeviceStatus: (state, action) => {
      const { deviceId, status } = action.payload;
      const device = state.devices.find(d => d.id === deviceId);
      
      if (device) {
        // 更新设备统计
        state.deviceStats[device.status] -= 1;
        state.deviceStats[status] += 1;
        
        // 更新设备状态
        device.status = status;
        
        // 如果是当前选中的设备，也更新选中的设备
        if (state.selectedDevice && state.selectedDevice.id === deviceId) {
          state.selectedDevice = { ...state.selectedDevice, status };
        }
      }
    },
    setDeviceLoading: (state, action) => {
      state.loading = action.payload;
    },
    setDeviceError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },
    clearDeviceError: (state) => {
      state.error = null;
    },
  },
});

// 导出动作创建器
export const {
  setDevices,
  setSelectedDevice,
  updateDeviceStatus,
  setDeviceLoading,
  setDeviceError,
  clearDeviceError,
} = deviceSlice.actions;

// 导出异步动作创建器
export const fetchDevices = () => async (dispatch) => {
  try {
    dispatch(setDeviceLoading(true));
    
    // 调用设备API
    const response = await fetch('/api/devices');
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || '获取设备列表失败');
    }
    
    dispatch(setDevices(data));
    dispatch(setDeviceLoading(false));
    return data;
  } catch (error) {
    dispatch(setDeviceError(error.message));
    throw error;
  }
};

export const fetchDeviceById = (deviceId) => async (dispatch) => {
  try {
    dispatch(setDeviceLoading(true));
    
    // 调用设备API
    const response = await fetch(`/api/devices/${deviceId}`);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || '获取设备详情失败');
    }
    
    dispatch(setSelectedDevice(data));
    dispatch(setDeviceLoading(false));
    return data;
  } catch (error) {
    dispatch(setDeviceError(error.message));
    throw error;
  }
};

export const changeDeviceStatus = (deviceId, status) => async (dispatch) => {
  try {
    // 调用设备状态更新API
    const response = await fetch(`/api/devices/${deviceId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || '更新设备状态失败');
    }
    
    dispatch(updateDeviceStatus({ deviceId, status }));
    return data;
  } catch (error) {
    dispatch(setDeviceError(error.message));
    throw error;
  }
};

// 导出选择器
export const selectDevices = (state) => state.devices.devices;
export const selectSelectedDevice = (state) => state.devices.selectedDevice;
export const selectDeviceStats = (state) => state.devices.deviceStats;
export const selectDeviceLoading = (state) => state.devices.loading;
export const selectDeviceError = (state) => state.devices.error;

export default deviceSlice.reducer;
