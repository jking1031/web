# 表单系统模块

本模块提供在ZZIOT应用程序中管理嵌入式表单的功能。表单从外部服务（OpenForm）嵌入，使数据收集和提交到Node-RED后端变得简单。

## 功能特点

- 管理表单（创建、更新、删除、列表）
- 全屏预览表单
- 查看表单提交记录
- 复制表单嵌入代码
- 处理表单提交并将数据存储在Node-RED中
- 验证表单数据是否成功保存

## 组件

- **FormManagement**: 管理表单的主页
- **FormList**: 表单列表页面
- **FormPreview**: 预览和使用表单的页面
- **FormSubmissionVerify**: 表单提交验证页面
- **formService**: 表单相关操作的API服务

## 使用方法

### 管理表单

1. 导航到表单管理页面 `/forms`
2. 使用"添加表单"按钮创建新表单
3. 填写表单详情：
   - 标题：表单的显示名称
   - 嵌入URL：外部服务上表单的URL（例如OpenForm）
   - 描述：可选的表单用途描述
   - 状态：激活或禁用

### 预览表单

1. 在管理列表中点击任何表单的"预览"按钮
2. 表单将在iframe中加载
3. 使用"全屏"按钮以全屏模式查看表单

### 查看提交记录

1. 在管理列表中点击任何表单的"查看提交"按钮
2. 弹出的模态框将显示该表单的所有提交记录
3. 点击"查看数据"以查看完整的提交数据

### 嵌入表单

1. 点击任何表单的"复制嵌入代码"按钮
2. 嵌入代码将被复制到剪贴板
3. 将代码粘贴到任何HTML页面中以嵌入表单

## Node-RED集成

该模块与Node-RED流程（`forms-api-flow.json`）交互，处理：

1. 表单数据存储
2. 表单提交处理
3. 检索表单数据和提交记录
4. 验证表单数据写入状态

### 设置Node-RED流程

1. 将`forms-api-flow.json`文件导入您的Node-RED实例
2. 部署流程
3. API端点将可用于：
   - GET `/api/forms` - 列出所有表单
   - GET `/api/forms/:id` - 通过ID获取表单
   - POST `/api/forms` - 创建新表单
   - PUT `/api/forms/:id` - 更新表单
   - DELETE `/api/forms/:id` - 删除表单
   - POST `/api/forms/:id/submit` - 提交表单数据
   - GET `/api/forms/:id/submissions` - 获取表单提交记录
   - GET `/api/forms/:id/verify-submission` - 验证表单提交状态

## 技术细节

### 表单结构

```javascript
{
  id: string,
  title: string,
  embedUrl: string,
  description: string,
  status: 'active' | 'inactive',
  createdAt: string, // ISO日期字符串
  updatedAt: string  // ISO日期字符串
}
```

### 提交记录结构

```javascript
{
  id: string,
  formId: string,
  data: object, // 表单提交数据
  submittedBy: string,
  submittedAt: string, // ISO日期字符串
  status: 'pending' | 'processed' | 'error'
}
```

## 自定义

要自定义表单的外观：
1. 编辑`FormModule.module.scss`文件
2. 根据需要调整不同组件的样式 