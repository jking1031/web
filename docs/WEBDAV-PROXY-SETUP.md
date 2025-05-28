# WebDAV集成指南

本文档说明如何在前端应用中使用WebDAV功能连接Nextcloud等WebDAV服务。

## 实现方式

本项目使用两种WebDAV连接方式：

1. **直接连接模式**（推荐）：使用 [webdav-client](https://github.com/perry-mitchell/webdav-client) npm包直接连接WebDAV服务器
2. **代理模式**：通过Node-RED代理解决CORS跨域问题（当第一种方式因CORS限制无法使用时）

默认使用直接连接模式，性能更好，无需额外服务器。

## 功能特性

WebDAV服务提供以下功能：

- ✅ 连接到WebDAV服务器
- 📂 浏览目录内容
- 📤 上传文件
- 📥 下载文件
- 📁 创建目录
- 🗑 删除文件或目录

## 使用方法

### 1. 初始化连接

```javascript
import webdavService from '@/services/webdav';

// 直接连接模式（默认）
webdavService.init(
  'http://your-nextcloud-server.com/remote.php/dav/files/username/', 
  'username', 
  'password'
);

// 如需使用代理模式
webdavService.init(
  'http://your-nextcloud-server.com/remote.php/dav/files/username/', 
  'username', 
  'password',
  true // true=使用代理，false=直接连接
);
```

### 2. Nextcloud连接说明

对于Nextcloud服务器，WebDAV路径通常为：
```
http(s)://your-nextcloud-server/remote.php/dav/files/username/
```

注意事项：
1. 请确保URL末尾有斜杠"/"
2. 用户名和密码必须正确（可以使用Nextcloud应用密码）
3. URL中不应该包含特殊字符（如BOM字符）

可以使用curl命令测试连接：
```bash
curl -u username:password -X PROPFIND -H "Depth: 1" -H "Content-Type: application/xml" http://your-nextcloud-server/remote.php/dav/files/username/
```

### 3. 获取目录内容

```javascript
// 获取根目录内容
const rootFiles = await webdavService.listDirectory('');

// 获取指定目录内容
const documentsFiles = await webdavService.listDirectory('Documents');

// 每个项目包含以下属性
// {
//   name: "文件名",
//   path: "/路径/文件名",
//   isDirectory: true/false,
//   contentType: "文件MIME类型",
//   size: 文件大小(字节),
//   lastModified: Date对象(最后修改时间)
// }
```

### 4. 下载文件

```javascript
// 下载文件并获取Blob对象
const fileBlob = await webdavService.downloadFile('path/to/file.txt');

// 创建下载链接
const url = URL.createObjectURL(fileBlob);
const a = document.createElement('a');
a.href = url;
a.download = 'file.txt';
document.body.appendChild(a);
a.click();
document.body.removeChild(a);
URL.revokeObjectURL(url);
```

### 5. 上传文件

```javascript
// 从文件输入获取文件
const fileInput = document.querySelector('input[type="file"]');
const file = fileInput.files[0];

// 上传到指定目录
await webdavService.uploadFile('path/to/directory', file);
```

### 6. 创建目录

```javascript
await webdavService.createDirectory('path/to/new-directory');
```

### 7. 删除文件或目录

```javascript
await webdavService.delete('path/to/file-or-directory');
```

## 跨域问题解决方案

如果遇到CORS跨域问题：

```
Access to fetch at 'http://your-webdav-server/...' from origin 'http://localhost:5176' has been blocked by CORS policy
```

解决方法：

1. **配置Nextcloud CORS**：
   - 安装并配置Nextcloud的CORS应用
   - 编辑Nextcloud的config.php文件添加CORS头

2. **使用代理模式**：
   - 将useProxy参数设为true
   - 确保已配置好Node-RED代理服务

3. **使用浏览器扩展**（仅开发环境）：
   - 安装禁用CORS的浏览器扩展
   - 例如Chrome的"CORS Unblock"或"Allow CORS"

## 代理模式配置

如需使用代理模式，请部署Node-RED代理服务：

1. 导入 `nodered-flows/webdav-proxy-flow.json` 到Node-RED
2. 部署流程
3. 确保代理URL在WebDAV服务中配置正确

## 故障排除

1. **连接失败**：
   - 检查WebDAV服务器地址、用户名和密码
   - 尝试使用curl命令进行测试
   - 检查网络连接和防火墙设置

2. **认证错误**：
   - 对于Nextcloud，考虑使用应用密码而非常规密码
   - 确保用户名没有特殊字符

3. **BOM字符问题**：
   - 如果用户名或URL包含UTF-8 BOM字符，可能导致认证失败
   - 系统自动清理这些字符，但如果仍有问题，请手动清理

4. **特殊字符问题**：
   - URL中的空格和特殊字符应当正确编码 