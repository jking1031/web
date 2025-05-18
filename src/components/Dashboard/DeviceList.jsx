import React from 'react';
import {
  List,
  Datagrid,
  TextField,
  DateField,
  BooleanField,
  EditButton,
  ShowButton,
  FunctionField,
  ReferenceField,
  Filter,
  TextInput,
  BooleanInput,
  SelectInput,
  usePermissions
} from 'react-admin';
import { Chip } from '@mui/material';

// 设备列表过滤器
const DeviceFilter = (props) => (
  <Filter {...props}>
    <TextInput label="搜索" source="q" alwaysOn />
    <TextInput label="名称" source="name" />
    <TextInput label="型号" source="model" />
    <SelectInput label="状态" source="status" choices={[
      { id: 'online', name: '在线' },
      { id: 'offline', name: '离线' },
      { id: 'warning', name: '警告' },
      { id: 'error', name: '错误' },
    ]} />
    <BooleanInput label="已激活" source="active" />
  </Filter>
);

// 设备状态渲染
const DeviceStatusField = ({ record }) => {
  if (!record || !record.status) return null;
  
  let color = 'default';
  let label = '未知';
  
  switch (record.status) {
    case 'online':
      color = 'success';
      label = '在线';
      break;
    case 'offline':
      color = 'default';
      label = '离线';
      break;
    case 'warning':
      color = 'warning';
      label = '警告';
      break;
    case 'error':
      color = 'error';
      label = '错误';
      break;
    default:
      break;
  }
  
  return <Chip label={label} color={color} size="small" />;
};

// 设备列表组件
const DeviceList = (props) => {
  const { permissions } = usePermissions();
  const isAdmin = permissions && permissions.isAdmin;
  
  return (
    <List
      {...props}
      filters={<DeviceFilter />}
      sort={{ field: 'lastActive', order: 'DESC' }}
      bulkActionButtons={isAdmin ? undefined : false}
    >
      <Datagrid>
        <TextField source="id" label="ID" />
        <TextField source="name" label="名称" />
        <TextField source="model" label="型号" />
        <FunctionField
          label="状态"
          render={record => <DeviceStatusField record={record} />}
        />
        <BooleanField source="active" label="已激活" />
        <DateField source="lastActive" label="最后活动" showTime />
        <ReferenceField
          label="所属区域"
          source="areaId"
          reference="areas"
          link={false}
        >
          <TextField source="name" />
        </ReferenceField>
        <ShowButton />
        {isAdmin && <EditButton />}
      </Datagrid>
    </List>
  );
};

export default DeviceList;
