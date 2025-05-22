import React from 'react';
import { Box } from '@mui/material';

// 导入查询工具
import QueryTool from './QueryTool';

// 导入上下文提供者
import { DatabaseProvider } from './utils/DatabaseContext';

/**
 * 数据库管理器组件
 * 简化版本，只包含查询工具功能
 */
const DatabaseManager = () => {
  return (
    <DatabaseProvider>
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <QueryTool />
      </Box>
    </DatabaseProvider>
  );
};

export default DatabaseManager;
