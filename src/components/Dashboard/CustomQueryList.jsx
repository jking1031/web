import React, { useState } from 'react';
import {
  List,
  Datagrid,
  TextField,
  DateField,
  NumberField,
  useDataProvider,
  useNotify,
  Button,
  TopToolbar,
  FilterButton,
  CreateButton,
  ExportButton,
  usePermissions
} from 'react-admin';
import { Card, CardContent, Grid, TextField as MuiTextField, MenuItem, Box } from '@mui/material';
import { SearchOutlined } from '@ant-design/icons';

// 自定义查询工具栏
const CustomQueryListActions = ({ permissions }) => (
  <TopToolbar>
    <FilterButton />
    {permissions.isAdmin && <CreateButton />}
    <ExportButton />
  </TopToolbar>
);

// 自定义查询组件
const CustomQueryList = (props) => {
  const dataProvider = useDataProvider();
  const notify = useNotify();
  const { permissions } = usePermissions();
  
  const [queryParams, setQueryParams] = useState({
    dbName: 'nodered',
    tableName: 'gt_data',
    fields: ['timestamp', 'flow_in', 'flow_out', 'pressure'],
    limit: 100,
    orderBy: 'timestamp',
    orderDir: 'DESC'
  });
  
  const [queryResults, setQueryResults] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // 处理查询参数变更
  const handleQueryParamChange = (field) => (event) => {
    setQueryParams({
      ...queryParams,
      [field]: event.target.value
    });
  };
  
  // 处理字段变更（多选）
  const handleFieldsChange = (event) => {
    setQueryParams({
      ...queryParams,
      fields: event.target.value.split(',').map(field => field.trim())
    });
  };
  
  // 执行查询
  const executeQuery = async () => {
    try {
      setLoading(true);
      
      // 使用dataProvider发送自定义查询
      const response = await dataProvider.getList('custom-queries', {
        pagination: { page: 1, perPage: queryParams.limit },
        sort: { field: queryParams.orderBy, order: queryParams.orderDir },
        filter: {
          dbName: queryParams.dbName,
          tableName: queryParams.tableName,
          fields: queryParams.fields.join(','),
        }
      });
      
      setQueryResults(response.data);
      notify('查询成功', { type: 'success' });
    } catch (error) {
      console.error('执行查询失败:', error);
      notify(`查询失败: ${error.message}`, { type: 'error' });
    } finally {
      setLoading(false);
    }
  };
  
  // 动态生成数据表格列
  const generateColumns = () => {
    if (!queryResults || queryResults.length === 0) return null;
    
    // 获取第一条结果的所有字段
    const fields = Object.keys(queryResults[0]);
    
    return fields.map(field => {
      // 根据字段名称和值类型选择合适的组件
      if (field.toLowerCase().includes('time') || field.toLowerCase().includes('date')) {
        return <DateField source={field} key={field} showTime />;
      } else if (typeof queryResults[0][field] === 'number') {
        return <NumberField source={field} key={field} />;
      } else {
        return <TextField source={field} key={field} />;
      }
    });
  };
  
  return (
    <div>
      <Card style={{ marginBottom: '1rem' }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}>
              <MuiTextField
                label="数据库名称"
                value={queryParams.dbName}
                onChange={handleQueryParamChange('dbName')}
                fullWidth
                margin="normal"
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <MuiTextField
                label="表名"
                value={queryParams.tableName}
                onChange={handleQueryParamChange('tableName')}
                fullWidth
                margin="normal"
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <MuiTextField
                label="字段"
                value={queryParams.fields.join(', ')}
                onChange={handleFieldsChange}
                fullWidth
                margin="normal"
                variant="outlined"
                helperText="多个字段用逗号分隔"
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <MuiTextField
                label="限制条数"
                type="number"
                value={queryParams.limit}
                onChange={handleQueryParamChange('limit')}
                fullWidth
                margin="normal"
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <MuiTextField
                label="排序字段"
                value={queryParams.orderBy}
                onChange={handleQueryParamChange('orderBy')}
                fullWidth
                margin="normal"
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <MuiTextField
                label="排序方向"
                select
                value={queryParams.orderDir}
                onChange={handleQueryParamChange('orderDir')}
                fullWidth
                margin="normal"
                variant="outlined"
              >
                <MenuItem value="ASC">升序</MenuItem>
                <MenuItem value="DESC">降序</MenuItem>
              </MuiTextField>
            </Grid>
            <Grid item xs={12} md={3}>
              <Box display="flex" alignItems="flex-end" height="100%">
                <Button
                  label="执行查询"
                  onClick={executeQuery}
                  disabled={loading}
                  fullWidth
                  variant="contained"
                  startIcon={<SearchOutlined />}
                />
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
      
      {queryResults.length > 0 && (
        <List
          {...props}
          actions={<CustomQueryListActions permissions={permissions} />}
          resource="custom-queries"
          hasCreate={false}
          hasEdit={false}
          hasList
          hasShow={false}
          data={queryResults}
          total={queryResults.length}
        >
          <Datagrid>
            {generateColumns()}
          </Datagrid>
        </List>
      )}
    </div>
  );
};

export default CustomQueryList;
