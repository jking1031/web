import React from 'react';
import ApiManagement from './ApiManagement';
import ApiManagementEnhanced from './ApiManagementEnhanced';

/**
 * API管理页面包装器
 * 将原始API管理页面包装在增强组件中
 */
const ApiManagementWrapper = () => {
  return (
    <ApiManagementEnhanced>
      <ApiManagement />
    </ApiManagementEnhanced>
  );
};

export default ApiManagementWrapper;
