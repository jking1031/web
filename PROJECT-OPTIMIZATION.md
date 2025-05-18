# ZZIOT Web项目优化建议

## 冗余代码清理

### 1. 合并重复的Dashboard组件

在项目中发现了两个Dashboard组件目录：`./src/components/Dashboard`和`./zziot-web/src/components/Dashboard`。这些组件存在功能重叠，应该合并为一个。

**建议操作：**
- 删除`./src/components/Dashboard`目录
- 使用`./zziot-web/src/components/Dashboard`中的组件
- 更新所有引用`./src/components/Dashboard`的导入语句

**受影响的文件：**
- `./src/components/Dashboard/DeviceStatus.jsx`
- `./src/components/Dashboard/EnhancedDashboard.jsx`
- `./src/components/Dashboard/ProductionStats.jsx`
- `./src/components/Dashboard/TrendChart.jsx`

### 2. 合并认证相关文件

项目中存在两个认证相关文件：`./zziot-web/src/api/auth.js`和`./zziot-web/src/utils/auth.js`，它们的功能有重叠。

**建议操作：**
- 合并`./zziot-web/src/utils/auth.js`的功能到`./zziot-web/src/api/auth.js`
- 删除`./zziot-web/src/utils/auth.js`
- 更新所有引用`./zziot-web/src/utils/auth.js`的导入语句

**受影响的文件：**
- `./zziot-web/src/api/auth.js`
- `./zziot-web/src/utils/auth.js`
- `./zziot-web/src/context/AuthContext.jsx`
- `./zziot-web/src/services/apiRegistry.js`

### 3. 优化API管理相关文件

项目中存在多个API管理相关文件，可能存在功能重叠。

**建议操作：**
- 检查并删除未使用的API服务
- 合并功能相似的API服务
- 确保所有API调用都通过`apiManager`进行

**受影响的文件：**
- `./zziot-web/src/services/apiManager.js`
- `./zziot-web/src/services/apiRegistry.js`
- `./zziot-web/src/services/apiProxy.js`
- `./zziot-web/src/services/apiFieldManager.js`
- `./zziot-web/src/services/apiVariableManager.js`
- `./zziot-web/src/services/apiDocGenerator.js`
- `./zziot-web/src/services/apiService.js`

### 4. 删除未使用的组件和页面

项目中可能存在未使用的组件和页面，应该删除以减少代码量和提高可维护性。

**建议操作：**
- 使用工具分析组件依赖关系，找出未使用的组件
- 检查路由配置，找出未使用的页面
- 删除未使用的组件和页面

**可能未使用的组件：**
- `./zziot-web/src/components/AlertsFloatingWindow/`（可能已被NotificationCenter替代）
- `./zziot-web/src/components/SimpleAdmin/`（可能已被Admin组件替代）

### 5. 拆分大型文件

项目中存在一些过大的文件，应该拆分为多个小文件，提高可维护性。

**建议操作：**
- 将`AuthContext.jsx`（25418行）拆分为多个小文件
- 将API管理相关文件拆分为更小的模块

**受影响的文件：**
- `./zziot-web/src/context/AuthContext.jsx`
- `./zziot-web/src/services/apiDocGenerator.js`
- `./zziot-web/src/services/apiFieldManager.js`

## 性能优化

### 1. 减少不必要的API调用

**建议操作：**
- 使用批量API调用减少请求次数
- 合理设置缓存时间，减少重复请求
- 实现请求取消，避免无效请求

**示例代码：**
```javascript
// 使用批量API调用
apiManager.batchCall([
  { apiKey: 'getDeviceStatus', params: { deviceId: '12345' } },
  { apiKey: 'getAlarmData', params: { deviceId: '12345' } },
  { apiKey: 'getProductionStats', params: { deviceId: '12345' } }
]);

// 设置合理的缓存时间
apiManager.registry.update('getDeviceStatus', {
  cacheTime: 30000 // 30秒缓存
});
```

### 2. 优化WebSocket连接

**建议操作：**
- 只在需要时建立WebSocket连接
- 不使用时关闭WebSocket连接
- 实现更可靠的重连机制

**示例代码：**
```javascript
// 只在进入站点详情页面时连接WebSocket
useEffect(() => {
  if (siteId) {
    webSocket.connect(siteId);
  }
  
  return () => {
    // 离开页面时断开连接
    webSocket.disconnect();
  };
}, [siteId]);
```

### 3. 优化组件渲染

**建议操作：**
- 使用React.memo减少不必要的重渲染
- 使用useMemo和useCallback优化性能
- 实现虚拟滚动，减少大列表的渲染开销

**示例代码：**
```javascript
// 使用React.memo
const DeviceItem = React.memo(({ device }) => {
  return (
    <div>
      <h3>{device.name}</h3>
      <p>状态: {device.status}</p>
    </div>
  );
});

// 使用useMemo
const filteredDevices = useMemo(() => {
  return devices.filter(device => device.status === status);
}, [devices, status]);

// 使用useCallback
const handleDeviceClick = useCallback((deviceId) => {
  setSelectedDeviceId(deviceId);
}, []);
```

### 4. 代码分割

**建议操作：**
- 使用React.lazy和Suspense实现代码分割
- 按路由分割代码，减少初始加载时间

**示例代码：**
```javascript
// 使用React.lazy和Suspense
const Dashboard = React.lazy(() => import('./components/Dashboard'));
const DeviceList = React.lazy(() => import('./components/DeviceList'));

function App() {
  return (
    <Suspense fallback={<div>加载中...</div>}>
      <Switch>
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/devices" component={DeviceList} />
      </Switch>
    </Suspense>
  );
}
```

## 架构优化

### 1. 统一状态管理

**建议操作：**
- 考虑使用Redux或Zustand统一管理全局状态
- 减少Context的使用，提高性能和可维护性

**示例代码（使用Zustand）：**
```javascript
// 创建状态存储
import create from 'zustand';

const useAuthStore = create((set) => ({
  user: null,
  isLoggedIn: false,
  isAdmin: false,
  login: (userData) => set({ user: userData, isLoggedIn: true, isAdmin: userData.is_admin === 1 }),
  logout: () => set({ user: null, isLoggedIn: false, isAdmin: false })
}));

// 在组件中使用
function UserInfo() {
  const { user, isLoggedIn, logout } = useAuthStore();
  
  if (!isLoggedIn) return null;
  
  return (
    <div>
      <p>用户: {user.username}</p>
      <button onClick={logout}>退出</button>
    </div>
  );
}
```

### 2. API层重构

**建议操作：**
- 统一API调用方式，使用apiManager作为唯一入口
- 实现更完善的错误处理和重试机制

**示例代码：**
```javascript
// 统一API调用
import apiManager from '../services/apiManager';

// 获取设备数据
const getDeviceData = async (deviceId) => {
  try {
    return await apiManager.call('getDeviceData', { deviceId });
  } catch (error) {
    console.error('获取设备数据失败:', error);
    throw error;
  }
};

// 获取报警数据
const getAlarmData = async (deviceId) => {
  try {
    return await apiManager.call('getAlarmData', { deviceId });
  } catch (error) {
    console.error('获取报警数据失败:', error);
    throw error;
  }
};
```

### 3. 组件库统一

**建议操作：**
- 统一使用Material UI或Ant Design，减少混用
- 创建统一的组件库，确保UI一致性

**示例代码：**
```javascript
// 创建统一的组件库
import { Button as MuiButton } from '@mui/material';
import { Button as AntButton } from 'antd';

// 统一按钮组件
export const Button = ({ variant, ...props }) => {
  // 使用Material UI按钮
  return <MuiButton variant={variant} {...props} />;
};

// 统一表格组件
export const Table = (props) => {
  // 使用Ant Design表格
  return <AntButton {...props} />;
};
```

### 4. 测试覆盖率提高

**建议操作：**
- 增加单元测试和集成测试
- 实现自动化测试流程

**示例代码：**
```javascript
// 单元测试示例
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DeviceItem from './DeviceItem';

test('renders device item correctly', () => {
  const device = { id: '1', name: '设备1', status: '正常' };
  render(<DeviceItem device={device} />);
  
  expect(screen.getByText('设备1')).toBeInTheDocument();
  expect(screen.getByText('状态: 正常')).toBeInTheDocument();
});

test('calls onClick when clicked', () => {
  const device = { id: '1', name: '设备1', status: '正常' };
  const handleClick = jest.fn();
  
  render(<DeviceItem device={device} onClick={handleClick} />);
  userEvent.click(screen.getByText('设备1'));
  
  expect(handleClick).toHaveBeenCalledWith('1');
});
```

## 结论

通过实施上述优化建议，可以显著提高ZZIOT Web项目的代码质量、性能和可维护性。建议按照优先级逐步实施这些优化，先解决冗余代码问题，再进行性能优化，最后考虑架构优化。
