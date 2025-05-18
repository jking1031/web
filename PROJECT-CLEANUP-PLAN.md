# ZZIOT Web项目清理计划

本文档提供了ZZIOT Web项目的清理计划，旨在减少冗余代码，提高代码质量和可维护性。

## 1. 重复组件清理

### 1.1 Dashboard组件清理

项目中存在两个Dashboard组件目录：`./src/components/Dashboard`和`./zziot-web/src/components/Dashboard`。

**清理步骤：**

1. 确认`./zziot-web/src/components/Dashboard`中的组件是否包含`./src/components/Dashboard`中的所有功能
2. 更新所有引用`./src/components/Dashboard`的导入语句，改为引用`./zziot-web/src/components/Dashboard`
3. 删除`./src/components/Dashboard`目录

**需要删除的文件：**
- `./src/components/Dashboard/DeviceStatus.jsx`
- `./src/components/Dashboard/EnhancedDashboard.jsx`
- `./src/components/Dashboard/ProductionStats.jsx`
- `./src/components/Dashboard/TrendChart.jsx`

### 1.2 认证相关文件清理

项目中存在两个认证相关文件：`./zziot-web/src/api/auth.js`和`./zziot-web/src/utils/auth.js`。

**清理步骤：**

1. 比较两个文件的功能，确认它们的差异
2. 将`./zziot-web/src/utils/auth.js`中的独特功能合并到`./zziot-web/src/api/auth.js`中
3. 更新所有引用`./zziot-web/src/utils/auth.js`的导入语句，改为引用`./zziot-web/src/api/auth.js`
4. 删除`./zziot-web/src/utils/auth.js`

**需要修改的文件：**
- `./zziot-web/src/api/auth.js`
- `./zziot-web/src/context/AuthContext.jsx`
- `./zziot-web/src/services/apiRegistry.js`

### 1.3 登录页面清理

项目中存在两个登录页面：`./zziot-web/src/pages/Auth/Login.jsx`和`./zziot-web/src/pages/Login/Login.jsx`。

**清理步骤：**

1. 比较两个文件的功能，确认它们的差异
2. 将`./zziot-web/src/pages/Login/Login.jsx`中的独特功能合并到`./zziot-web/src/pages/Auth/Login.jsx`中
3. 更新路由配置，确保所有登录路由都指向`./zziot-web/src/pages/Auth/Login.jsx`
4. 删除`./zziot-web/src/pages/Login/Login.jsx`和`./zziot-web/src/pages/Login`目录

**需要修改的文件：**
- `./zziot-web/src/pages/Auth/Login.jsx`
- `./zziot-web/src/router.jsx`

## 2. 未使用组件清理

### 2.1 AlertsFloatingWindow组件清理

`./zziot-web/src/components/AlertsFloatingWindow`可能已被`NotificationCenter`替代。

**清理步骤：**

1. 确认`NotificationCenter`是否包含`AlertsFloatingWindow`的所有功能
2. 检查是否有组件仍在使用`AlertsFloatingWindow`
3. 如果没有组件使用，删除`./zziot-web/src/components/AlertsFloatingWindow`目录

### 2.2 SimpleAdmin组件清理

`./zziot-web/src/components/SimpleAdmin`可能已被其他Admin组件替代。

**清理步骤：**

1. 确认其他Admin组件是否包含`SimpleAdmin`的所有功能
2. 检查是否有组件仍在使用`SimpleAdmin`
3. 如果没有组件使用，删除`./zziot-web/src/components/SimpleAdmin`目录

## 3. API管理相关文件清理

### 3.1 apiService.js清理

`./zziot-web/src/services/apiService.js`可能与`apiManager.js`和`apiProxy.js`存在功能重叠。

**清理步骤：**

1. 比较`apiService.js`、`apiManager.js`和`apiProxy.js`的功能，确认它们的差异
2. 将`apiService.js`中的独特功能合并到`apiManager.js`或`apiProxy.js`中
3. 更新所有引用`apiService.js`的导入语句
4. 删除`apiService.js`

### 3.2 ThingsboardService.js清理

`./zziot-web/src/services/ThingsboardService.js`可能已被API管理系统替代。

**清理步骤：**

1. 确认API管理系统是否包含`ThingsboardService.js`的所有功能
2. 检查是否有组件仍在使用`ThingsboardService.js`
3. 如果没有组件使用，删除`ThingsboardService.js`

## 4. 大型文件拆分

### 4.1 AuthContext.jsx拆分

`./zziot-web/src/context/AuthContext.jsx`文件过大（25418行），应该拆分为多个小文件。

**拆分步骤：**

1. 创建`./zziot-web/src/context/auth`目录
2. 将`AuthContext.jsx`中的功能拆分为多个小文件：
   - `AuthProvider.jsx`：认证提供组件
   - `AuthHooks.jsx`：认证相关钩子
   - `AuthUtils.jsx`：认证工具函数
   - `AuthTypes.jsx`：认证类型定义
3. 在`AuthContext.jsx`中导入这些文件，保持向后兼容性
4. 逐步更新引用`AuthContext.jsx`的导入语句

### 4.2 apiDocGenerator.js拆分

`./zziot-web/src/services/apiDocGenerator.js`文件较大，应该拆分为多个小文件。

**拆分步骤：**

1. 创建`./zziot-web/src/services/apiDoc`目录
2. 将`apiDocGenerator.js`中的功能拆分为多个小文件：
   - `MarkdownGenerator.js`：Markdown文档生成
   - `OpenApiGenerator.js`：OpenAPI文档生成
   - `HtmlGenerator.js`：HTML文档生成
   - `DocUtils.js`：文档生成工具函数
3. 在`apiDocGenerator.js`中导入这些文件，保持向后兼容性
4. 逐步更新引用`apiDocGenerator.js`的导入语句

### 4.3 apiFieldManager.js拆分

`./zziot-web/src/services/apiFieldManager.js`文件较大，应该拆分为多个小文件。

**拆分步骤：**

1. 创建`./zziot-web/src/services/apiField`目录
2. 将`apiFieldManager.js`中的功能拆分为多个小文件：
   - `FieldDetector.js`：字段检测
   - `FieldTransformer.js`：字段转换
   - `FieldValidator.js`：字段验证
   - `FieldUtils.js`：字段工具函数
3. 在`apiFieldManager.js`中导入这些文件，保持向后兼容性
4. 逐步更新引用`apiFieldManager.js`的导入语句

## 5. 重复样式清理

### 5.1 CSS/SCSS文件清理

项目中可能存在重复的CSS/SCSS文件。

**清理步骤：**

1. 分析项目中的所有CSS/SCSS文件，找出重复的样式
2. 将重复的样式合并到全局样式文件中
3. 删除不再使用的CSS/SCSS文件

## 6. 重复工具函数清理

### 6.1 工具函数清理

项目中可能存在重复的工具函数。

**清理步骤：**

1. 分析项目中的所有工具函数，找出重复的函数
2. 将重复的函数合并到统一的工具文件中
3. 更新所有引用这些函数的导入语句
4. 删除不再使用的工具函数文件

## 7. 测试文件清理

### 7.1 未使用的测试文件清理

项目中可能存在未使用的测试文件。

**清理步骤：**

1. 分析项目中的所有测试文件，找出未使用的测试
2. 删除未使用的测试文件

## 8. 资源文件清理

### 8.1 未使用的资源文件清理

项目中可能存在未使用的图片、图标等资源文件。

**清理步骤：**

1. 分析项目中的所有资源文件，找出未使用的资源
2. 删除未使用的资源文件

## 9. 依赖清理

### 9.1 未使用的依赖清理

项目中可能存在未使用的依赖。

**清理步骤：**

1. 分析项目的`package.json`文件，找出未使用的依赖
2. 从`package.json`中删除未使用的依赖
3. 运行`npm prune`或`yarn prune`删除未使用的依赖

## 10. 清理后的验证

### 10.1 功能验证

在完成清理后，需要验证所有功能是否正常工作。

**验证步骤：**

1. 运行项目，确保没有编译错误
2. 测试所有主要功能，确保它们正常工作
3. 运行自动化测试，确保所有测试都通过

### 10.2 性能验证

在完成清理后，需要验证项目的性能是否有所改善。

**验证步骤：**

1. 测量项目的加载时间
2. 测量主要操作的响应时间
3. 测量内存使用情况
4. 与清理前的性能指标进行比较

## 清理计划时间表

| 阶段 | 任务 | 预计时间 |
|------|------|----------|
| 1 | 重复组件清理 | 2天 |
| 2 | 未使用组件清理 | 1天 |
| 3 | API管理相关文件清理 | 2天 |
| 4 | 大型文件拆分 | 3天 |
| 5 | 重复样式清理 | 1天 |
| 6 | 重复工具函数清理 | 1天 |
| 7 | 测试文件清理 | 1天 |
| 8 | 资源文件清理 | 1天 |
| 9 | 依赖清理 | 1天 |
| 10 | 清理后的验证 | 2天 |
| **总计** | | **15天** |
