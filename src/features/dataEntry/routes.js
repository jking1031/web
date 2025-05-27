import React from 'react';
import { Navigate } from 'react-router-dom';
import FormManagement from './pages/FormManagement';
import FormPreview from './pages/FormPreview';
import FormList from './pages/FormList';

// 使用React.createElement代替JSX，避免语法错误
export const dataEntryRoutes = [
  // 主要表单路由
  {
    path: '/forms',
    element: React.createElement(FormManagement)
  },
  {
    path: '/forms/list',
    element: React.createElement(FormList)
  },
  {
    path: '/forms/preview/:id',
    element: React.createElement(FormPreview)
  },
  
  // 兼容性路由和重定向
  {
    path: '/forms/fill', 
    element: React.createElement(Navigate, { to: "/forms/list", replace: true })
  },
  {
    path: '/form-system',
    element: React.createElement(Navigate, { to: "/forms", replace: true })
  },
]; 