import React from 'react';
import {
  List,
  Datagrid,
  TextField,
  DateField,
  NumberField,
  Filter,
  TextInput,
  DateInput,
  NumberInput,
  usePermissions,
  EditButton,
  ShowButton
} from 'react-admin';

// 统计数据过滤器
const StatisticsFilter = (props) => (
  <Filter {...props}>
    <TextInput label="搜索" source="q" alwaysOn />
    <TextInput label="类型" source="type" />
    <DateInput label="开始日期" source="startDate" />
    <DateInput label="结束日期" source="endDate" />
    <NumberInput label="最小值" source="minValue" />
    <NumberInput label="最大值" source="maxValue" />
  </Filter>
);

// 统计数据列表组件
const StatisticsList = (props) => {
  const { permissions } = usePermissions();
  const isAdmin = permissions && permissions.isAdmin;
  
  return (
    <List
      {...props}
      filters={<StatisticsFilter />}
      sort={{ field: 'date', order: 'DESC' }}
      bulkActionButtons={isAdmin ? undefined : false}
    >
      <Datagrid>
        <TextField source="id" label="ID" />
        <TextField source="type" label="类型" />
        <DateField source="date" label="日期" />
        <NumberField source="value" label="数值" />
        <TextField source="unit" label="单位" />
        <TextField source="source" label="数据源" />
        <ShowButton />
        {isAdmin && <EditButton />}
      </Datagrid>
    </List>
  );
};

export default StatisticsList;
