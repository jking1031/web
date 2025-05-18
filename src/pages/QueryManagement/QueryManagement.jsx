import React from 'react';
import { Box, Typography } from '@mui/material';
import { DatabaseProvider } from '../ApiManagement/DatabaseManager/utils/DatabaseContext';
import QueryTool from '../ApiManagement/DatabaseManager/QueryTool';

/**
 * 查询管理组件
 * 提供SQL查询管理功能
 */
const QueryManagement = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>查询管理</Typography>
      <DatabaseProvider>
        <QueryTool />
      </DatabaseProvider>
    </Box>
  );
};

export default QueryManagement;
