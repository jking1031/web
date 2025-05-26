# 数据填报中心部署指南

## 概述
本文档提供数据填报中心的完整部署和开发指南，包括前端React应用和Node-RED后端的配置。

## 系统架构

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React前端     │    │   Node-RED      │    │   MariaDB       │
│   (表单设计器)   │◄──►│   (API服务)     │◄──►│   (数据存储)     │
│   (表单渲染器)   │    │   (业务逻辑)     │    │   (表单数据)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 前端部署

### 1. 环境要求
- Node.js >= 16.0.0
- npm >= 8.0.0 或 yarn >= 1.22.0
- 现代浏览器支持 (Chrome 90+, Firefox 88+, Safari 14+)

### 2. 依赖安装
```bash
cd zziot-web
npm install --legacy-peer-deps
```

### 3. 环境配置
创建 `.env.local` 文件：
```env
# API配置
REACT_APP_API_BASE_URL=http://localhost:1880/api
REACT_APP_NODE_RED_URL=http://localhost:1880

# 表单设计器配置
REACT_APP_FORMILY_CDN=//unpkg.com
REACT_APP_DESIGNABLE_CDN=//unpkg.com

# 功能开关
REACT_APP_ENABLE_FORM_DESIGNER=true
REACT_APP_ENABLE_FORM_PREVIEW=true
```

### 4. 启动开发服务器
```bash
npm start
```

### 5. 生产构建
```bash
npm run build
```

## Node-RED后端部署

### 1. 环境要求
- Node.js >= 16.0.0
- Node-RED >= 3.0.0
- MariaDB >= 10.5

### 2. Node-RED安装和配置
```bash
# 全局安装Node-RED
npm install -g node-red

# 安装必要的节点包
npm install -g node-red-node-mysql
npm install -g node-red-contrib-uuid
npm install -g node-red-contrib-moment
```

### 3. Node-RED配置文件
编辑 `~/.node-red/settings.js`：
```javascript
module.exports = {
    uiPort: process.env.PORT || 1880,
    mqttReconnectTime: 15000,
    serialReconnectTime: 15000,
    debugMaxLength: 1000,
    
    // 启用CORS
    httpNodeCors: {
        origin: "*",
        methods: "GET,PUT,POST,DELETE"
    },
    
    // API路径前缀
    httpNodeRoot: '/api',
    
    // 静态文件服务
    httpStatic: '/path/to/static/files',
    
    // 功能节点配置
    functionGlobalContext: {
        // 全局变量
    },
    
    // 日志配置
    logging: {
        console: {
            level: "info",
            metrics: false,
            audit: false
        }
    }
};
```

### 4. 数据库配置

#### 4.1 MariaDB安装
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install mariadb-server

# CentOS/RHEL
sudo yum install mariadb-server

# macOS
brew install mariadb
```

#### 4.2 数据库初始化
```sql
-- 创建数据库
CREATE DATABASE form_platform CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 创建用户
CREATE USER 'form_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON form_platform.* TO 'form_user'@'localhost';
FLUSH PRIVILEGES;

-- 使用数据库
USE form_platform;

-- 创建表单模板表
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
  permissions JSON,
  INDEX idx_category (category),
  INDEX idx_status (status),
  INDEX idx_created_by (created_by)
);

-- 创建表单分类表
CREATE TABLE form_categories (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  order_num INT DEFAULT 0,
  INDEX idx_order (order_num)
);

-- 创建表单提交表
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
  FOREIGN KEY (template_id) REFERENCES form_templates(id) ON DELETE CASCADE,
  INDEX idx_template_id (template_id),
  INDEX idx_status (status),
  INDEX idx_submitted_by (submitted_by),
  INDEX idx_submitted_at (submitted_at)
);

-- 插入示例分类数据
INSERT INTO form_categories (id, name, description, icon, order_num) VALUES
('lab_data', '化验数据', '化验相关的数据填报表单', 'ExperimentOutlined', 1),
('operation_data', '运行数据', '设备运行相关的数据填报表单', 'SettingOutlined', 2),
('maintenance_data', '维护数据', '设备维护相关的数据填报表单', 'ToolOutlined', 3),
('quality_data', '质量数据', '质量控制相关的数据填报表单', 'SafetyCertificateOutlined', 4);
```

### 5. Node-RED流程导入

#### 5.1 表单模板管理流程
```json
[
  {
    "id": "template_flow",
    "type": "tab",
    "label": "表单模板管理",
    "disabled": false,
    "info": ""
  },
  {
    "id": "get_templates",
    "type": "http in",
    "z": "template_flow",
    "name": "获取模板列表",
    "url": "/form-templates",
    "method": "get",
    "upload": false,
    "swaggerDoc": "",
    "x": 140,
    "y": 80,
    "wires": [["process_get_templates"]]
  },
  {
    "id": "process_get_templates",
    "type": "function",
    "z": "template_flow",
    "name": "处理查询参数",
    "func": "const { page = 1, pageSize = 10, search, category, status } = msg.req.query;\n\nlet sql = 'SELECT * FROM form_templates WHERE 1=1';\nlet params = [];\n\nif (search) {\n    sql += ' AND (name LIKE ? OR description LIKE ?)';\n    params.push(`%${search}%`, `%${search}%`);\n}\n\nif (category) {\n    sql += ' AND category = ?';\n    params.push(category);\n}\n\nif (status) {\n    sql += ' AND status = ?';\n    params.push(status);\n}\n\nsql += ' ORDER BY created_at DESC';\n\nconst offset = (page - 1) * pageSize;\nsql += ` LIMIT ${pageSize} OFFSET ${offset}`;\n\nmsg.topic = sql;\nmsg.payload = params;\n\nreturn msg;",
    "outputs": 1,
    "x": 340,
    "y": 80,
    "wires": [["query_templates"]]
  },
  {
    "id": "query_templates",
    "type": "mysql",
    "z": "template_flow",
    "mydb": "form_db",
    "name": "查询模板",
    "x": 540,
    "y": 80,
    "wires": [["format_response"]]
  },
  {
    "id": "format_response",
    "type": "function",
    "z": "template_flow",
    "name": "格式化响应",
    "func": "const items = msg.payload || [];\n\n// 解析JSON字段\nitems.forEach(item => {\n    if (typeof item.schema === 'string') {\n        item.schema = JSON.parse(item.schema);\n    }\n    if (typeof item.permissions === 'string') {\n        item.permissions = JSON.parse(item.permissions);\n    }\n});\n\nmsg.payload = {\n    success: true,\n    data: {\n        items: items,\n        total: items.length, // 实际应该查询总数\n        page: parseInt(msg.req.query.page || 1),\n        pageSize: parseInt(msg.req.query.pageSize || 10)\n    }\n};\n\nreturn msg;",
    "outputs": 1,
    "x": 740,
    "y": 80,
    "wires": [["http_response"]]
  },
  {
    "id": "http_response",
    "type": "http response",
    "z": "template_flow",
    "name": "返回响应",
    "statusCode": "",
    "headers": {},
    "x": 940,
    "y": 80,
    "wires": []
  }
]
```

## 开发指南

### 1. 前端开发

#### 1.1 项目结构
```
src/features/dataEntry/
├── components/          # 组件
│   ├── FormDesigner/   # 表单设计器
│   ├── FormRenderer/   # 表单渲染器
│   └── FormTemplateManager/ # 模板管理
├── pages/              # 页面
├── services/           # API服务
├── types/              # 类型定义
└── data/              # 示例数据
```

#### 1.2 添加新组件
```javascript
// 1. 创建组件文件
// src/features/dataEntry/components/NewComponent/NewComponent.jsx

import React from 'react';
import './NewComponent.scss';

const NewComponent = ({ prop1, prop2 }) => {
  return (
    <div className="new-component">
      {/* 组件内容 */}
    </div>
  );
};

export default NewComponent;
```

#### 1.3 添加新API服务
```javascript
// src/features/dataEntry/services/newService.js

import apiManager from '../../../services/api/core/apiManager';

class NewService {
  constructor() {
    this.registerApis();
  }

  registerApis() {
    apiManager.registry.register('newApi', {
      name: '新API',
      url: 'http://localhost:1880/api/new-endpoint',
      method: 'GET',
      category: 'form',
      status: 'enabled'
    });
  }

  async callNewApi(params) {
    try {
      const response = await apiManager.call('newApi', params);
      return response;
    } catch (error) {
      console.error('API调用失败:', error);
      throw error;
    }
  }
}

export default new NewService();
```

### 2. Node-RED开发

#### 2.1 创建新的API端点
1. 拖拽HTTP In节点到画布
2. 配置URL路径和HTTP方法
3. 添加Function节点处理业务逻辑
4. 连接MySQL节点执行数据库操作
5. 添加HTTP Response节点返回结果

#### 2.2 数据验证示例
```javascript
// Function节点中的数据验证代码
const Joi = require('joi');

const schema = Joi.object({
    name: Joi.string().required().max(200),
    description: Joi.string().max(1000),
    category: Joi.string().required(),
    schema: Joi.object().required()
});

const { error, value } = schema.validate(msg.payload);

if (error) {
    msg.statusCode = 400;
    msg.payload = {
        success: false,
        error: 'VALIDATION_ERROR',
        message: error.details[0].message
    };
    return msg;
}

// 验证通过，继续处理
msg.payload = value;
return msg;
```

## 部署清单

### 1. 生产环境部署

#### 1.1 前端部署
```bash
# 构建生产版本
npm run build

# 部署到Nginx
sudo cp -r build/* /var/www/html/

# Nginx配置
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/html;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    location /api {
        proxy_pass http://localhost:1880;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

#### 1.2 Node-RED部署
```bash
# 使用PM2管理Node-RED进程
npm install -g pm2

# 创建PM2配置文件
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'node-red',
    script: 'node-red',
    env: {
      NODE_ENV: 'production'
    }
  }]
};
EOF

# 启动服务
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 2. 监控和日志

#### 2.1 应用监控
```bash
# 安装监控工具
npm install -g @pm2/io

# 配置监控
pm2 install pm2-server-monit
```

#### 2.2 日志管理
```bash
# 查看日志
pm2 logs node-red

# 日志轮转
pm2 install pm2-logrotate
```

## 故障排除

### 1. 常见问题

#### 1.1 前端构建失败
```bash
# 清理缓存
npm cache clean --force
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

#### 1.2 API连接失败
- 检查Node-RED服务状态
- 验证CORS配置
- 确认防火墙设置

#### 1.3 数据库连接问题
- 检查数据库服务状态
- 验证连接参数
- 确认用户权限

### 2. 性能优化

#### 2.1 前端优化
- 启用代码分割
- 使用CDN加载静态资源
- 启用Gzip压缩

#### 2.2 后端优化
- 数据库索引优化
- 查询语句优化
- 缓存策略实施

## 安全配置

### 1. 前端安全
- 启用HTTPS
- 配置CSP头
- 输入数据验证

### 2. 后端安全
- API访问控制
- SQL注入防护
- 数据加密存储

### 3. 数据库安全
- 用户权限最小化
- 定期备份
- 访问日志记录 