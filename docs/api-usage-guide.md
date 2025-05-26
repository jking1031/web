# 表单填报中心 API 使用指南

## 概述

本文档介绍如何使用表单填报中心的API功能，包括前端服务调用和Node-RED后端配置。

## API服务架构

### 前端服务层
- `formTemplateService.js` - 表单模板相关API
- `formSubmissionService.js` - 表单提交相关API
- `apiTester.js` - API测试工具

### 后端地址
- 生产环境: `https://nodered.jzz77.cn:9003/api`
- 开发环境: 支持模拟数据回退

## 使用方法

### 1. 表单模板操作

#### 获取模板列表
```javascript
import formTemplateService from '../services/formTemplateService';

// 获取所有模板
const templates = await formTemplateService.getTemplates({
  page: 1,
  pageSize: 10,
  search: '化验',
  category: 'lab_data',
  status: 'published'
});

console.log('模板列表:', templates.data.items);
```

#### 创建新模板
```javascript
const newTemplate = {
  name: '新表单模板',
  description: '模板描述',
  category: 'lab_data',
  schema: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        title: '姓名',
        'x-component': 'Input'
      },
      date: {
        type: 'string',
        title: '日期',
        'x-component': 'DatePicker'
      }
    }
  },
  version: '1.0.0',
  status: 'draft'
};

const result = await formTemplateService.createTemplate(newTemplate);
console.log('创建结果:', result);
```

#### 发布模板
```javascript
const templateId = 'template_001';
const result = await formTemplateService.publishTemplate(templateId);
console.log('发布结果:', result);
```

### 2. 表单提交操作

#### 提交表单数据
```javascript
import formSubmissionService from '../services/formSubmissionService';

const submissionData = {
  templateId: 'template_001',
  templateName: '化验数据填报表',
  data: {
    name: '张三',
    date: '2024-01-15',
    value: 123.45
  }
};

const result = await formSubmissionService.submitForm(submissionData);
console.log('提交结果:', result);
```

#### 保存草稿
```javascript
const draftData = {
  templateId: 'template_001',
  templateName: '化验数据填报表',
  data: {
    name: '张三',
    // 部分填写的数据
  }
};

const result = await formSubmissionService.saveDraft(draftData);
console.log('草稿保存结果:', result);
```

#### 获取提交列表
```javascript
const submissions = await formSubmissionService.getSubmissions({
  page: 1,
  pageSize: 10,
  templateId: 'template_001',
  status: 'pending',
  startDate: '2024-01-01',
  endDate: '2024-01-31'
});

console.log('提交列表:', submissions.data.items);
```

### 3. API测试工具

#### 在浏览器控制台中使用
```javascript
// 快速测试主要API
await quickTestFormApis();

// 完整API测试
await testFormApis();

// 测试API连接
await testApiConnection('https://nodered.jzz77.cn:9003/api');
```

#### 在代码中使用
```javascript
import apiTester from '../utils/apiTester';

// 运行完整测试
const testResults = await apiTester.runAllTests();
console.log('测试结果:', testResults);

// 快速测试
const quickResults = await apiTester.quickTest();
console.log('快速测试:', quickResults);
```

## API端点列表

### 表单模板相关
- `GET /form-templates` - 获取模板列表
- `GET /form-templates?templateId={id}` - 获取单个模板
- `POST /form-templates` - 创建模板
- `PUT /form-templates` - 更新模板
- `DELETE /form-templates` - 删除模板
- `POST /form-templates/publish` - 发布模板
- `POST /form-templates/archive` - 归档模板
- `POST /form-templates/copy` - 复制模板
- `GET /form-categories` - 获取分类
- `GET /form-templates/stats` - 获取统计
- `POST /form-templates/validate` - 验证模板

### 表单提交相关
- `POST /form-submissions` - 提交表单
- `GET /form-submissions` - 获取提交列表
- `GET /form-submissions?submissionId={id}` - 获取提交详情
- `PUT /form-submissions/status` - 更新状态
- `DELETE /form-submissions` - 删除提交
- `POST /form-submissions/draft` - 保存草稿
- `PUT /form-submissions/draft` - 更新草稿
- `POST /form-submissions/export` - 导出数据
- `GET /form-submissions/stats` - 获取统计
- `PUT /form-submissions/batch-update` - 批量更新
- `POST /form-submissions/validate` - 验证数据
- `GET /form-submissions/history` - 获取历史

## 错误处理

### 网络错误处理
```javascript
try {
  const result = await formTemplateService.getTemplates();
  console.log('成功:', result);
} catch (error) {
  console.error('API调用失败:', error);
  
  // 在开发环境下会自动使用模拟数据
  if (process.env.NODE_ENV === 'development') {
    console.log('使用模拟数据');
  }
}
```

### 响应格式
```javascript
// 成功响应
{
  "success": true,
  "data": {
    "items": [...],
    "total": 100,
    "page": 1,
    "pageSize": 10
  }
}

// 错误响应
{
  "success": false,
  "error": "VALIDATION_ERROR",
  "message": "数据验证失败",
  "details": {
    "field": "name",
    "message": "名称不能为空"
  }
}
```

## 开发环境配置

### 1. 环境变量
```env
# .env.local
REACT_APP_API_BASE_URL=https://nodered.jzz77.cn:9003/api
REACT_APP_NODE_RED_URL=https://nodered.jzz77.cn:9003
```

### 2. 开发工具
在开发环境下，数据填报中心页面会显示开发工具面板，包含：
- 快速API测试按钮
- 完整API测试按钮
- 状态打印按钮
- 测试结果显示

### 3. 模拟数据
当API调用失败时，系统会自动回退到模拟数据，确保开发过程的连续性。

## 最佳实践

### 1. 错误处理
- 始终使用try-catch包装API调用
- 在开发环境提供模拟数据回退
- 记录详细的错误日志

### 2. 性能优化
- 使用适当的超时设置
- 实现重试机制
- 缓存不经常变化的数据

### 3. 数据验证
- 在提交前验证表单数据
- 使用Schema验证确保数据完整性
- 提供友好的错误提示

### 4. 用户体验
- 显示加载状态
- 提供操作反馈
- 支持草稿保存功能

## 故障排除

### 1. API连接问题
```javascript
// 测试API连接
const connectionTest = await apiTester.testConnection();
console.log('连接状态:', connectionTest);
```

### 2. 数据格式问题
- 检查请求数据格式是否正确
- 验证响应数据结构
- 确认Content-Type设置

### 3. 权限问题
- 检查用户认证状态
- 验证API访问权限
- 确认CORS配置

## 联系支持

如果遇到问题，请：
1. 查看浏览器控制台错误信息
2. 运行API测试工具诊断问题
3. 检查网络连接和防火墙设置
4. 联系系统管理员获取帮助 