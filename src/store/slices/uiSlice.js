import { createSlice } from '@reduxjs/toolkit';

/**
 * UI状态切片
 * 管理主题、布局、通知和UI相关状态
 */
const initialState = {
  theme: localStorage.getItem('theme') || 'light',
  sidebarCollapsed: localStorage.getItem('sidebarCollapsed') === 'true',
  notifications: [],
  activeModal: null,
  modalData: null,
  loading: {
    global: false,
    components: {},
  },
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setTheme: (state, action) => {
      state.theme = action.payload;
      localStorage.setItem('theme', action.payload);
      
      // 应用主题到文档根元素
      document.documentElement.setAttribute('data-theme', action.payload);
    },
    toggleSidebar: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed;
      localStorage.setItem('sidebarCollapsed', state.sidebarCollapsed);
    },
    setSidebarCollapsed: (state, action) => {
      state.sidebarCollapsed = action.payload;
      localStorage.setItem('sidebarCollapsed', action.payload);
    },
    addNotification: (state, action) => {
      state.notifications.push({
        id: Date.now(),
        read: false,
        timestamp: Date.now(),
        ...action.payload,
      });
    },
    removeNotification: (state, action) => {
      state.notifications = state.notifications.filter(
        (notification) => notification.id !== action.payload
      );
    },
    markNotificationAsRead: (state, action) => {
      const notification = state.notifications.find(
        (notification) => notification.id === action.payload
      );
      if (notification) {
        notification.read = true;
      }
    },
    markAllNotificationsAsRead: (state) => {
      state.notifications.forEach((notification) => {
        notification.read = true;
      });
    },
    clearAllNotifications: (state) => {
      state.notifications = [];
    },
    showModal: (state, action) => {
      state.activeModal = action.payload.modalType;
      state.modalData = action.payload.modalData;
    },
    hideModal: (state) => {
      state.activeModal = null;
      state.modalData = null;
    },
    setGlobalLoading: (state, action) => {
      state.loading.global = action.payload;
    },
    setComponentLoading: (state, action) => {
      state.loading.components[action.payload.componentId] = action.payload.loading;
    },
  },
});

// 导出动作创建器
export const {
  setTheme,
  toggleSidebar,
  setSidebarCollapsed,
  addNotification,
  removeNotification,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  clearAllNotifications,
  showModal,
  hideModal,
  setGlobalLoading,
  setComponentLoading,
} = uiSlice.actions;

// 导出选择器
export const selectTheme = (state) => state.ui.theme;
export const selectSidebarCollapsed = (state) => state.ui.sidebarCollapsed;
export const selectNotifications = (state) => state.ui.notifications;
export const selectUnreadNotificationsCount = (state) =>
  state.ui.notifications.filter((notification) => !notification.read).length;
export const selectActiveModal = (state) => state.ui.activeModal;
export const selectModalData = (state) => state.ui.modalData;
export const selectGlobalLoading = (state) => state.ui.loading.global;
export const selectComponentLoading = (componentId) => (state) =>
  state.ui.loading.components[componentId] || false;

export default uiSlice.reducer;
