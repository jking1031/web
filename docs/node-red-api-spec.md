# Node-RED 表单填报平台 API 规范

## 概述
本文档定义了表单填报平台所需的Node-RED后端API接口规范。

## 基础配置
- 基础URL: `http://localhost:1880/api`
- 数据格式: JSON
- 认证方式: Bearer Token (可选)

## 1. 表单模板管理 API

### 1.1 获取表单模板列表
```
GET /form-templates
```

**查询参数:**
- `page`: 页码 (默认: 1)
- `pageSize`: 每页数量 (默认: 10)
- `search`: 搜索关键词
- `category`: 分类ID
- `status`: 状态 (draft/published/archived)

**响应示例:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "template_001",
        "name": "化验数据填报表",
        "description": "用于填报日常化验数据",
        "category": "lab_data",
        "schema": { ... },
        "version": "1.0.0",
        "status": "published",
        "createdBy": "admin",
        "createdAt": "2024-01-01T00:00:00Z",
        "updatedAt": "2024-01-01T00:00:00Z",
        "permissions": ["user", "admin"]
      }
    ],
    "total": 50,
    "page": 1,
    "pageSize": 10
  }
}
```

### 1.2 获取单个表单模板
```
GET /form-templates/{id}
```

**响应示例:**
```json
{
  "success": true,
  "data": {
    "id": "template_001",
    "name": "化验数据填报表",
    "description": "用于填报日常化验数据",
    "category": "lab_data",
    "schema": {
      "type": "object",
      "properties": { ... }
    },
    "version": "1.0.0",
    "status": "published",
    "createdBy": "admin",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z",
    "permissions": ["user", "admin"]
  }
}
```

### 1.3 创建表单模板
```
POST /form-templates
```

**请求体:**
```json
{
  "name": "新表单模板",
  "description": "模板描述",
  "category": "lab_data",
  "schema": {
    "type": "object",
    "properties": { ... }
  },
  "version": "1.0.0",
  "status": "draft",
  "createdBy": "admin"
}
```

### 1.4 更新表单模板
```
PUT /form-templates/{id}
```

### 1.5 删除表单模板
```
DELETE /form-templates/{id}
```

### 1.6 发布表单模板
```
POST /form-templates/{id}/publish
```

## 2. 表单分类管理 API

### 2.1 获取表单分类列表
```
GET /form-categories
```

**响应示例:**
```json
{
  "success": true,
  "data": [
    {
      "id": "lab_data",
      "name": "化验数据",
      "description": "化验相关的数据填报表单",
      "icon": "ExperimentOutlined",
      "order": 1
    }
  ]
}
```

## 3. 表单提交管理 API

### 3.1 提交表单数据
```
POST /form-submissions
```

**请求体:**
```json
{
  "templateId": "template_001",
  "templateName": "化验数据填报表",
  "data": {
    "basic_info": {
      "date": "2024-01-15",
      "site_id": "site_001",
      "operator": "张三"
    },
    "inlet_quality": { ... }
  },
  "status": "pending",
  "submittedBy": "user001"
}
```

### 3.2 获取表单提交列表
```
GET /form-submissions
```

**查询参数:**
- `page`: 页码
- `pageSize`: 每页数量
- `templateId`: 模板ID
- `status`: 状态
- `submittedBy`: 提交人
- `startDate`: 开始日期
- `endDate`: 结束日期

### 3.3 获取单个表单提交详情
```
GET /form-submissions/{id}
```

### 3.4 更新表单提交状态
```
PUT /form-submissions/{id}/status
```

**请求体:**
```json
{
  "status": "approved",
  "reviewedBy": "admin",
  "comments": "审核通过"
}
```

### 3.5 删除表单提交
```
DELETE /form-submissions/{id}
```

### 3.6 导出表单提交数据
```
POST /form-submissions/export
```

**请求体:**
```json
{
  "templateId": "template_001",
  "startDate": "2024-01-01",
  "endDate": "2024-01-31",
  "format": "excel"
}
```

### 3.7 获取提交统计
```
GET /form-submissions/stats
```

**查询参数:**
- `templateId`: 模板ID (可选)
- `startDate`: 开始日期 (可选)
- `endDate`: 结束日期 (可选)

**响应示例:**
```json
{
  "success": true,
  "data": {
    "total": 150,
    "pending": 10,
    "approved": 130,
    "rejected": 10,
    "byTemplate": [
      {
        "templateId": "template_001",
        "templateName": "化验数据填报表",
        "count": 80
      }
    ],
    "byDate": [
      {
        "date": "2024-01-15",
        "count": 5
      }
    ]
  }
}
```

## 4. 数据库表结构

### 4.1 表单模板表 (form_templates)
```sql
CREATE TABLE form_templates (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  category VARCHAR(50),
  schema JSON NOT NULL,
  version VARCHAR(20),
  status ENUM('draft', 'published', 'archived') DEFAULT 'draft',
  created_by VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  permissions JSON
);
```

### 4.2 表单分类表 (form_categories)
```sql
CREATE TABLE form_categories (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  order_num INT DEFAULT 0
);
```

### 4.3 表单提交表 (form_submissions)
```sql
CREATE TABLE form_submissions (
  id VARCHAR(50) PRIMARY KEY,
  template_id VARCHAR(50) NOT NULL,
  template_name VARCHAR(200),
  data JSON NOT NULL,
  status ENUM('draft', 'pending', 'approved', 'rejected') DEFAULT 'pending',
  submitted_by VARCHAR(50),
  submitted_at TIMESTAMP,
  reviewed_by VARCHAR(50),
  reviewed_at TIMESTAMP,
  comments TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (template_id) REFERENCES form_templates(id)
);
```

## 5. Node-RED流程设计建议

### 5.1 表单模板管理流程
- HTTP In节点接收API请求
- Function节点处理业务逻辑
- MySQL节点执行数据库操作
- HTTP Response节点返回响应

### 5.2 表单提交流程
- 接收表单数据
- 数据验证和清洗
- 存储到数据库
- 发送通知 (可选)
- 返回提交结果

### 5.3 数据导出流程
- 查询数据库获取数据
- 格式化数据 (Excel/CSV)
- 生成文件
- 返回下载链接

## 6. 错误处理

### 6.1 标准错误响应格式
```json
{
  "success": false,
  "error": "VALIDATION_ERROR",
  "message": "表单验证失败",
  "details": {
    "field": "name",
    "message": "名称不能为空"
  }
}
```

### 6.2 常见错误码
- `VALIDATION_ERROR`: 数据验证错误
- `NOT_FOUND`: 资源不存在
- `PERMISSION_DENIED`: 权限不足
- `DUPLICATE_ERROR`: 数据重复
- `INTERNAL_ERROR`: 服务器内部错误

## 7. 安全考虑

### 7.1 输入验证
- 对所有输入数据进行验证
- 防止SQL注入
- 限制文件上传大小和类型

### 7.2 权限控制
- 基于用户角色的访问控制
- API接口权限验证
- 数据行级权限控制

### 7.3 数据安全
- 敏感数据加密存储
- 审计日志记录
- 定期数据备份 