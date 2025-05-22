import React, { lazy, Suspense } from 'react';
import { Spin } from 'antd';

// 使用简单的相对路径导入
const ApiManagement = lazy(() => import('./ApiManagement'));
const ApiManagementEnhanced = lazy(() => import('./ApiManagementEnhanced'));

/**
 * API管理页面包装器
 * 将原始API管理页面包装在增强组件中
 */
const ApiManagementWrapper = () => {
  return (
    <Suspense fallback={<Spin size="large" />}>
      <ApiManagementEnhanced>
        <ApiManagement />
      </ApiManagementEnhanced>
    </Suspense>
  );
};

export default ApiManagementWrapper;
