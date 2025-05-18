import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import apiSlice from './slices/apiSlice';
import authSlice from './slices/authSlice';
import deviceSlice from './slices/deviceSlice';
import uiSlice from './slices/uiSlice';

/**
 * 配置Redux存储
 * 集中管理应用状态，提供更好的状态管理和调试体验
 */
const store = configureStore({
  reducer: {
    api: apiSlice.reducer,
    auth: authSlice,
    devices: deviceSlice,
    ui: uiSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(apiSlice.middleware),
  devTools: process.env.NODE_ENV !== 'production',
});

// 设置监听器用于RTK Query的缓存失效和重新获取
setupListeners(store.dispatch);

export default store;
