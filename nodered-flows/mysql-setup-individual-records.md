# Node-RED MySQL 配置指南 - 单条记录模式

本文档提供了在Node-RED中配置MySQL节点以存储API配置的步骤，每个API作为单独的一条记录保存。

## 1. 安装MySQL节点

如果尚未安装MySQL节点，请在Node-RED中安装：

1. 在Node-RED界面中，点击右上角的菜单按钮
2. 选择"管理面板"
3. 切换到"安装"选项卡
4. 搜索"node-red-node-mysql"
5. 点击安装
6. 安装完成后重启Node-RED

## 2. 配置MySQL连接

在导入流程之前，需要先配置MySQL连接：

1. 在Node-RED界面中，双击任意MySQL节点
2. 点击"添加新的MySQL配置"按钮
3. 填写以下信息：
   - 名称: `api_db_config`
   - 主机: 你的MySQL服务器地址（例如 `localhost`）
   - 端口: MySQL端口（默认 `3306`）
   - 用户: MySQL用户名
   - 密码: MySQL密码
   - 数据库: 数据库名称（例如 `nodered_db`）
4. 点击"添加"按钮保存配置

## 3. 创建数据库

在MySQL中创建数据库：

```sql
-- 创建数据库（如果不存在）
CREATE DATABASE IF NOT EXISTS nodered_db;

-- 使用数据库
USE nodered_db;
```

## 4. 导入流程

1. 在Node-RED界面中，点击右上角的菜单按钮
2. 选择"导入"
3. 将 `api-configs-individual-records-flow.json` 文件的内容粘贴到导入对话框中
4. 点击"导入"按钮

## 5. 部署流程

1. 检查所有MySQL节点是否已正确配置
2. 点击右上角的"部署"按钮

## 6. 测试API

导入并部署流程后，可以使用以下API端点：

- `POST /api/api-configs/save`: 保存API配置到数据库（每个API作为单独的一条记录）
- `GET /api/api-configs/get`: 从数据库获取所有API配置
- `GET /api/api-configs/get/:apiKey`: 从数据库获取指定的API配置
- `DELETE /api/api-configs/delete`: 删除数据库中的所有API配置

## 数据库表结构

新的表结构设计如下：

```sql
CREATE TABLE IF NOT EXISTS api_configs (
    api_key VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255),
    url TEXT,
    method VARCHAR(50),
    category VARCHAR(100),
    status VARCHAR(50),
    description TEXT,
    config_json LONGTEXT,
    timestamp VARCHAR(50),
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

这个表结构的优点：

1. 每个API作为单独的一条记录保存
2. 可以单独查询、更新或删除特定的API
3. 保存了API的基本信息作为单独的字段，便于查询和筛选
4. 同时保存了完整的API配置JSON，保证了数据的完整性
5. 记录了最后更新时间，便于跟踪变更

## 注意事项

- 确保MySQL服务器已启动并可访问
- 确保用户具有创建表和执行CRUD操作的权限
- 流程启动时会自动创建表（如果不存在）
- 如果遇到错误，请查看Node-RED的调试面板，有详细的错误信息

## 故障排除

### 1. 连接错误

如果遇到连接错误，请检查：
- MySQL服务器是否正在运行
- 主机名、端口、用户名和密码是否正确
- 数据库是否存在
- 防火墙是否允许连接

### 2. 权限错误

如果遇到权限错误，请确保MySQL用户具有以下权限：
- CREATE: 创建表
- SELECT, INSERT, UPDATE, DELETE: 执行CRUD操作

可以使用以下SQL语句授予权限：

```sql
GRANT ALL PRIVILEGES ON nodered_db.* TO 'your_user'@'localhost';
FLUSH PRIVILEGES;
```

### 3. 数据存储错误

如果API配置无法正确存储，可能是因为：
- 数据太大，超出了MySQL的限制
- 字符编码问题

解决方案：
- 确保使用了LONGTEXT类型来存储配置
- 确保MySQL使用UTF8MB4字符集：

```sql
ALTER DATABASE nodered_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE api_configs CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```
