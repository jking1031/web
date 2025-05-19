import React from 'react';
import {
  List,
  Datagrid,
  TextField,
  DateField,
  FunctionField,
  ReferenceField,
  Filter,
  TextInput,
  SelectInput,
  BooleanInput,
  usePermissions,
  EditButton,
  ShowButton
} from 'react-admin';
import { Chip } from '@mui/material';

// 告警列表过滤器
const AlarmFilter = (props) => (
  <Filter {...props}>
    <TextInput label="搜索" source="q" alwaysOn />
    <TextInput label="类型" source="type" />
    <SelectInput label="级别" source="level" choices={[
      { id: 'info', name: '信息' },
      { id: 'warning', name: '警告' },
      { id: 'error', name: '错误' },
      { id: 'critical', name: '严重' },
    ]} />
    <BooleanInput label="已处理" source="resolved" />
  </Filter>
);

// 告警级别渲染
const AlarmLevelField = ({ record }) => {
  if (!record || !record.level) return null;
  
  let color = 'default';
  let label = '未知';
  
  switch (record.level) {
    case 'info':
      color = 'info';
      label = '信息';
      break;
    case 'warning':
      color = 'warning';
      label = '警告';
      break;
    case 'error':
      color = 'error';
      label = '错误';
      break;
    case 'critical':
      color = 'error';
      label = '严重';
      break;
    default:
      break;
  }
  
  return <Chip label={label} color={color} size="small" />;
};

// 告警状态渲染
const AlarmStatusField = ({ record }) => {
  if (!record) return null;
  
  const resolved = record.resolved || false;
  
  return (
    <Chip 
      label={resolved ? '已处理' : '未处理'} 
      color={resolved ? 'success' : 'default'} 
      size="small" 
    />
  );
};

// 告警列表组件
const AlarmList = (props) => {
  const { permissions } = usePermissions();
  const isAdmin = permissions && permissions.isAdmin;
  
  return (
    <List
      {...props}
      filters={<AlarmFilter />}
      sort={{ field: 'timestamp', order: 'DESC' }}
      bulkActionButtons={isAdmin ? undefined : false}
    >
      <Datagrid>
        <TextField source="id" label="ID" />
        <TextField source="type" label="类型" />
        <FunctionField
          label="级别"
          render={record => <AlarmLevelField record={record} />}
        />
        <ReferenceField
          label="设备"
          source="deviceId"
          reference="devices"
          link
        >
          <TextField source="name" />
        </ReferenceField>
        <TextField source="message" label="消息" />
        <DateField source="timestamp" label="时间" showTime />
        <FunctionField
          label="状态"
          render={record => <AlarmStatusField record={record} />}
        />
        <ShowButton />
        {isAdmin && <EditButton />}
      </Datagrid>
    </List>
  );
};

export default AlarmList;
