# API管理系统文档

## 系统概述

API管理系统是ZZIOT Web项目的核心组件，提供了统一的API管理、调用、缓存、字段定义和文档生成功能。该系统旨在简化API的使用和管理，提高开发效率和代码质量。

## 系统架构

API管理系统由以下核心组件组成：

1. **API管理器（apiManager.js）**：提供统一的API管理接口，整合所有API相关服务
2. **API注册中心（apiRegistry.js）**：管理API配置，支持API的注册、更新和删除
3. **API代理（apiProxy.js）**：处理API调用、缓存和重试
4. **API字段管理器（apiFieldManager.js）**：管理API响应数据的字段定义、转换和验证
5. **API变量管理器（apiVariableManager.js）**：管理API调用中使用的变量，支持全局变量、环境变量和用户变量
6. **API文档生成器（apiDocGenerator.js）**：生成API文档，支持Markdown、OpenAPI和HTML格式
7. **基础URL管理器（baseUrlManager.js）**：管理API基础URL，支持多环境配置

## 核心功能

### API注册与配置

API注册中心（apiRegistry.js）提供了API的注册、更新和删除功能：

```javascript
// 注册API
apiManager.registry.register('getDeviceData', {
  name: '获取设备数据',
  url: '/api/device/data',
  method: 'GET',
  category: 'data',
  status: 'enabled',
  description: '获取设备实时数据',
  timeout: 10000,
  retries: 1,
  cacheTime: 60000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 更新API
apiManager.registry.update('getDeviceData', {
  timeout: 15000,
  retries: 2
});

// 删除API
apiManager.registry.remove('getDeviceData');

// 获取API配置
const apiConfig = apiManager.registry.get('getDeviceData');

// 获取所有API配置
const allApis = apiManager.registry.getAll();

// 获取指定分类的API配置
const dataApis = apiManager.registry.getByCategory('data');
```

### API调用

API代理（apiProxy.js）提供了API调用、缓存和重试功能：

```javascript
// 调用API
apiManager.call('getDeviceData', {
  deviceId: '12345',
  startTime: '2023-05-01',
  endTime: '2023-05-31'
}).then(data => {
  console.log('设备数据:', data);
}).catch(error => {
  console.error('获取设备数据失败:', error);
});

// 批量调用API
apiManager.batchCall([
  {
    apiKey: 'getDeviceData',
    params: {
      deviceId: '12345'
    }
  },
  {
    apiKey: 'getAlarmData',
    params: {
      deviceId: '12345'
    }
  }
]).then(results => {
  console.log('批量调用结果:', results);
}).catch(error => {
  console.error('批量调用失败:', error);
});

// 测试API
apiManager.test('getDeviceData', {
  deviceId: '12345'
}).then(result => {
  console.log('测试结果:', result);
}).catch(error => {
  console.error('测试失败:', error);
});
```

### 字段管理

API字段管理器（apiFieldManager.js）提供了字段定义、转换和验证功能：

```javascript
// 添加字段定义
apiManager.fieldManager.addField('getDeviceData', {
  key: 'temperature',
  label: '温度',
  type: 'number',
  format: 'decimal',
  unit: '°C',
  description: '设备温度',
  visible: true,
  sortable: true,
  filterable: true
});

// 获取字段定义
const fields = apiManager.fieldManager.getFields('getDeviceData');

// 自动检测字段
apiManager.call('getDeviceData', { deviceId: '12345' })
  .then(data => {
    const detectedFields = apiManager.fieldManager.detectFields('getDeviceData', data, {
      save: true // 自动保存检测到的字段
    });
    console.log('检测到的字段:', detectedFields);
  });

// 转换数据
apiManager.call('getDeviceData', { deviceId: '12345' })
  .then(data => {
    const transformedData = apiManager.fieldManager.transformData('getDeviceData', data, {
      visibleOnly: true // 只包含可见字段
    });
    console.log('转换后的数据:', transformedData);
  });
```

### 变量管理

API变量管理器（apiVariableManager.js）提供了变量管理和替换功能：

```javascript
// 设置变量
apiManager.variableManager.set('apiBaseUrl', 'https://api.example.com', 'global');
apiManager.variableManager.set('userId', '12345', 'user');
apiManager.variableManager.set('sessionToken', 'abc123', 'session');

// 获取变量
const apiBaseUrl = apiManager.variableManager.get('apiBaseUrl');
const userId = apiManager.variableManager.get('userId');
const sessionToken = apiManager.variableManager.get('sessionToken');

// 获取所有变量
const allVariables = apiManager.variableManager.getAll();

// 在API调用中使用变量
apiManager.call('getDeviceData', {
  deviceId: '${userId}', // 使用变量
  startTime: '2023-05-01',
  endTime: '2023-05-31'
});
```

### 文档生成

API文档生成器（apiDocGenerator.js）提供了API文档生成功能：

```javascript
// 生成单个API的文档
const markdownDoc = apiManager.generateDocs('getDeviceData', 'markdown');
const openApiDoc = apiManager.generateDocs('getDeviceData', 'openapi');
const htmlDoc = apiManager.generateDocs('getDeviceData', 'html', {
  title: '设备数据API文档'
});

// 生成多个API的文档
const docs = apiManager.generateDocs(['getDeviceData', 'getAlarmData'], 'markdown');

// 生成指定分类的API文档
const categoryApis = Object.keys(apiManager.registry.getByCategory('data'));
const categoryDocs = apiManager.generateDocs(categoryApis, 'markdown', {
  title: '数据查询API文档',
  toc: true, // 包含目录
  examples: true // 包含示例
});

// 生成所有API的文档
const allDocs = apiManager.generateDocs(null, 'markdown');
```

### 基础URL管理

基础URL管理器（baseUrlManager.js）提供了API基础URL的管理功能：

```javascript
// 获取所有基础URL
const baseUrls = apiManager.baseUrlManager.getAll();

// 获取默认基础URL
const defaultBaseUrl = apiManager.baseUrlManager.getDefault();

// 添加基础URL
apiManager.baseUrlManager.add({
  id: 'dev',
  name: '开发环境',
  url: 'https://dev-api.example.com',
  description: '开发环境API',
  isDefault: false
});

// 更新基础URL
apiManager.baseUrlManager.update('dev', {
  url: 'https://new-dev-api.example.com'
});

// 设置默认基础URL
apiManager.baseUrlManager.setDefault('dev');

// 删除基础URL
apiManager.baseUrlManager.remove('dev');
```

## 最佳实践

### API命名规范

- 使用有意义的名称，反映API的功能
- 使用驼峰命名法（camelCase）
- 使用动词+名词的形式（如getDeviceData）
- 保持命名的一致性

### 错误处理

- 始终使用try-catch捕获API调用的错误
- 根据错误类型进行不同的处理
- 向用户提供有意义的错误信息
- 记录错误日志，便于问题排查

### 性能优化

- 合理设置缓存策略，减少重复请求
- 只请求必要的数据，减少数据传输量
- 使用批量请求，减少请求次数
- 实现请求取消，避免无效请求

### API管理最佳实践

- 使用apiManager作为统一入口，避免直接使用底层服务
- 为每个API定义字段，便于数据处理和展示
- 使用变量管理动态参数，提高代码可维护性
- 为常用API生成文档，便于团队协作
- 使用批量调用减少请求次数，提高性能
- 合理设置缓存时间，减少服务器负载

## 实现状态

本节列出了API管理系统各功能的实现状态，帮助开发团队跟踪进度和规划后续工作。

### 已实现功能

- **API注册中心**：✅ 已实现基本功能，支持API的注册、更新和删除
- **API代理服务**：✅ 已实现基本功能，支持API的调用、缓存和重试
- **字段管理**：✅ 已实现基本功能，支持字段的定义、检测和转换
- **变量管理**：✅ 已实现基本功能，支持变量的定义、替换和作用域管理
- **API文档生成**：✅ 已实现基本功能，支持Markdown、OpenAPI和HTML格式的文档生成
- **API管理入口**：✅ 已实现基本功能，提供统一的API管理接口
- **基础URL管理**：✅ 已实现基本功能，支持多环境配置

### 进行中功能

- **API管理界面**：🔄 正在开发，包括API列表、详情、编辑和测试界面
- **数据库管理**：🔄 正在开发，包括数据库连接配置和测试功能
- **SQL查询管理**：🔄 正在开发，包括SQL查询的创建、执行和结果分析
- **API测试工具**：🔄 正在开发，包括参数测试、响应验证和性能测试

### 计划功能

- **API监控统计**：📅 计划开发，包括API调用次数、响应时间等统计信息
- **API权限控制**：📅 计划开发，基于角色的API访问控制
- **API版本控制**：📅 计划开发，支持API的版本管理
- **API批量操作**：📅 计划开发，支持API的批量导入、导出和更新
- **高级数据转换**：📅 计划开发，支持复杂的数据转换和计算
- **API依赖分析**：📅 计划开发，分析API之间的依赖关系
- **API性能优化**：📅 计划开发，提供API性能优化建议
- **API安全检查**：📅 计划开发，检查API的安全漏洞
