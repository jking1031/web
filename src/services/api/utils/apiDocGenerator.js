/**
 * API 文档生成服务
 * 用于生成 API 文档，支持 Markdown 和 OpenAPI 格式
 */

import apiRegistry from '../core/apiRegistry';
import apiFieldManager from '../managers/apiFieldManager';
import { API_CATEGORIES, API_METHODS, API_STATUS } from '../core/apiRegistry';
import { FIELD_TYPES } from '../managers/apiFieldManager';

// 文档格式
export const DOC_FORMATS = {
  MARKDOWN: 'markdown',
  OPENAPI: 'openapi',
  HTML: 'html'
};

class ApiDocGenerator {
  /**
   * 生成 API 文档
   * @param {string|Array} apiKeys API 键名或键名数组
   * @param {string} format 文档格式
   * @param {Object} options 选项
   * @returns {string} 生成的文档
   */
  generateDocs(apiKeys, format = DOC_FORMATS.MARKDOWN, options = {}) {
    // 如果 apiKeys 为空，则使用所有 API
    if (!apiKeys) {
      apiKeys = Object.keys(apiRegistry.getAll());
    }
    
    // 如果 apiKeys 不是数组，则转换为数组
    if (!Array.isArray(apiKeys)) {
      apiKeys = [apiKeys];
    }
    
    // 根据格式生成文档
    switch (format) {
      case DOC_FORMATS.MARKDOWN:
        return this.generateMarkdownDocs(apiKeys, options);
      case DOC_FORMATS.OPENAPI:
        return this.generateOpenApiDocs(apiKeys, options);
      case DOC_FORMATS.HTML:
        return this.generateHtmlDocs(apiKeys, options);
      default:
        throw new Error(`不支持的文档格式: ${format}`);
    }
  }
  
  /**
   * 生成 Markdown 格式的 API 文档
   * @param {Array} apiKeys API 键名数组
   * @param {Object} options 选项
   * @returns {string} 生成的 Markdown 文档
   */
  generateMarkdownDocs(apiKeys, options = {}) {
    const apis = apiKeys.map(key => ({
      key,
      config: apiRegistry.get(key)
    })).filter(api => api.config);
    
    if (apis.length === 0) {
      return '# API 文档\n\n没有找到 API。';
    }
    
    // 生成文档标题
    let markdown = '# API 文档\n\n';
    
    // 生成目录
    if (options.toc !== false) {
      markdown += '## 目录\n\n';
      
      // 按分类分组
      const categories = {};
      apis.forEach(api => {
        const category = api.config.category || 'uncategorized';
        if (!categories[category]) {
          categories[category] = [];
        }
        categories[category].push(api);
      });
      
      // 生成分类目录
      Object.keys(categories).forEach(category => {
        const categoryName = this.getCategoryName(category);
        markdown += `- [${categoryName}](#${category})\n`;
        
        // 生成 API 目录
        categories[category].forEach(api => {
          markdown += `  - [${api.config.name || api.key}](#${api.key})\n`;
        });
      });
      
      markdown += '\n';
    }
    
    // 按分类分组
    const categories = {};
    apis.forEach(api => {
      const category = api.config.category || 'uncategorized';
      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push(api);
    });
    
    // 生成 API 文档
    Object.keys(categories).forEach(category => {
      const categoryName = this.getCategoryName(category);
      markdown += `## ${categoryName} {#${category}}\n\n`;
      
      // 生成分类下的 API 文档
      categories[category].forEach(api => {
        markdown += this.generateApiMarkdown(api.key, api.config, options);
      });
    });
    
    return markdown;
  }
  
  /**
   * 生成单个 API 的 Markdown 文档
   * @param {string} apiKey API 键名
   * @param {Object} apiConfig API 配置
   * @param {Object} options 选项
   * @returns {string} 生成的 Markdown 文档
   */
  generateApiMarkdown(apiKey, apiConfig, options = {}) {
    let markdown = `### ${apiConfig.name || apiKey} {#${apiKey}}\n\n`;
    
    // 基本信息
    markdown += `**键名:** \`${apiKey}\`\n\n`;
    markdown += `**URL:** \`${apiConfig.url}\`\n\n`;
    markdown += `**方法:** \`${apiConfig.method}\`\n\n`;
    markdown += `**状态:** ${this.getStatusBadge(apiConfig.status)}\n\n`;
    
    // 描述
    if (apiConfig.description) {
      markdown += `**描述:** ${apiConfig.description}\n\n`;
    }
    
    // 请求头
    if (apiConfig.headers && Object.keys(apiConfig.headers).length > 0) {
      markdown += '#### 请求头\n\n';
      markdown += '| 名称 | 值 |\n';
      markdown += '| ---- | --- |\n';
      
      Object.keys(apiConfig.headers).forEach(key => {
        markdown += `| ${key} | ${apiConfig.headers[key]} |\n`;
      });
      
      markdown += '\n';
    }
    
    // 请求参数
    const fields = apiFieldManager.getFields(apiKey);
    if (fields && fields.length > 0) {
      markdown += '#### 字段\n\n';
      markdown += '| 字段名 | 标签 | 类型 | 描述 |\n';
      markdown += '| ------ | ---- | ---- | ---- |\n';
      
      fields.forEach(field => {
        markdown += `| ${field.key} | ${field.label || ''} | ${field.type || ''} | ${field.description || ''} |\n`;
      });
      
      markdown += '\n';
    }
    
    // 示例
    if (options.examples !== false) {
      // 请求示例
      markdown += '#### 请求示例\n\n';
      markdown += '```javascript\n';
      markdown += `// 使用 apiProxy 调用\n`;
      markdown += `apiProxy.call('${apiKey}', {\n`;
      
      // 生成示例参数
      if (fields && fields.length > 0) {
        fields.filter(field => field.key && field.type).forEach(field => {
          const exampleValue = this.generateExampleValue(field);
          markdown += `  ${field.key}: ${exampleValue},\n`;
        });
      }
      
      markdown += '});\n';
      markdown += '```\n\n';
      
      // 响应示例
      markdown += '#### 响应示例\n\n';
      markdown += '```json\n';
      
      // 生成示例响应
      const exampleResponse = this.generateExampleResponse(apiKey, fields);
      markdown += JSON.stringify(exampleResponse, null, 2);
      
      markdown += '\n```\n\n';
    }
    
    // 分隔线
    markdown += '---\n\n';
    
    return markdown;
  }
  
  /**
   * 生成 OpenAPI 格式的 API 文档
   * @param {Array} apiKeys API 键名数组
   * @param {Object} options 选项
   * @returns {string} 生成的 OpenAPI 文档
   */
  generateOpenApiDocs(apiKeys, options = {}) {
    const apis = apiKeys.map(key => ({
      key,
      config: apiRegistry.get(key)
    })).filter(api => api.config);
    
    if (apis.length === 0) {
      return JSON.stringify({
        openapi: '3.0.0',
        info: {
          title: 'API 文档',
          version: '1.0.0',
          description: '没有找到 API。'
        },
        paths: {}
      }, null, 2);
    }
    
    // 创建 OpenAPI 文档
    const openapi = {
      openapi: '3.0.0',
      info: {
        title: options.title || 'API 文档',
        version: options.version || '1.0.0',
        description: options.description || '自动生成的 API 文档'
      },
      servers: [
        {
          url: options.baseUrl || '/',
          description: options.serverDescription || '默认服务器'
        }
      ],
      paths: {},
      components: {
        schemas: {},
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT'
          }
        }
      }
    };
    
    // 生成 API 路径
    apis.forEach(api => {
      const path = api.config.url;
      const method = api.config.method.toLowerCase();
      
      // 创建路径对象
      if (!openapi.paths[path]) {
        openapi.paths[path] = {};
      }
      
      // 创建方法对象
      openapi.paths[path][method] = {
        summary: api.config.name || api.key,
        description: api.config.description || '',
        tags: [api.config.category || 'default'],
        operationId: api.key,
        security: [
          {
            bearerAuth: []
          }
        ],
        parameters: [],
        responses: {
          '200': {
            description: '成功响应',
            content: {
              'application/json': {
                schema: {
                  $ref: `#/components/schemas/${api.key}Response`
                }
              }
            }
          },
          '400': {
            description: '请求错误'
          },
          '401': {
            description: '未授权'
          },
          '500': {
            description: '服务器错误'
          }
        }
      };
      
      // 获取字段
      const fields = apiFieldManager.getFields(api.key);
      
      // 添加参数
      if (fields && fields.length > 0) {
        if (method === 'get' || method === 'delete') {
          // 查询参数
          fields.forEach(field => {
            openapi.paths[path][method].parameters.push({
              name: field.key,
              in: 'query',
              description: field.description || field.label || '',
              required: field.required || false,
              schema: this.getOpenApiSchema(field)
            });
          });
        } else {
          // 请求体
          openapi.paths[path][method].requestBody = {
            description: '请求参数',
            required: true,
            content: {
              'application/json': {
                schema: {
                  $ref: `#/components/schemas/${api.key}Request`
                }
              }
            }
          };
          
          // 创建请求体模式
          openapi.components.schemas[`${api.key}Request`] = {
            type: 'object',
            properties: {}
          };
          
          // 添加请求体属性
          fields.forEach(field => {
            openapi.components.schemas[`${api.key}Request`].properties[field.key] = this.getOpenApiSchema(field);
          });
        }
      }
      
      // 创建响应模式
      openapi.components.schemas[`${api.key}Response`] = {
        type: 'object',
        properties: {}
      };
      
      // 添加响应属性
      if (fields && fields.length > 0) {
        fields.forEach(field => {
          openapi.components.schemas[`${api.key}Response`].properties[field.key] = this.getOpenApiSchema(field);
        });
      }
    });
    
    return JSON.stringify(openapi, null, 2);
  }
  
  /**
   * 生成 HTML 格式的 API 文档
   * @param {Array} apiKeys API 键名数组
   * @param {Object} options 选项
   * @returns {string} 生成的 HTML 文档
   */
  generateHtmlDocs(apiKeys, options = {}) {
    // 先生成 Markdown 文档
    const markdown = this.generateMarkdownDocs(apiKeys, options);
    
    // 简单的 HTML 包装
    const html = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${options.title || 'API 文档'}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
    h1, h2, h3, h4 {
      margin-top: 24px;
      margin-bottom: 16px;
      font-weight: 600;
      line-height: 1.25;
    }
    h1 {
      font-size: 2em;
      border-bottom: 1px solid #eaecef;
      padding-bottom: 0.3em;
    }
    h2 {
      font-size: 1.5em;
      border-bottom: 1px solid #eaecef;
      padding-bottom: 0.3em;
    }
    h3 {
      font-size: 1.25em;
    }
    h4 {
      font-size: 1em;
    }
    code {
      font-family: SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace;
      background-color: rgba(27, 31, 35, 0.05);
      border-radius: 3px;
      padding: 0.2em 0.4em;
      font-size: 85%;
    }
    pre {
      background-color: #f6f8fa;
      border-radius: 3px;
      padding: 16px;
      overflow: auto;
    }
    pre code {
      background-color: transparent;
      padding: 0;
    }
    table {
      border-collapse: collapse;
      width: 100%;
      margin-bottom: 16px;
    }
    table th, table td {
      border: 1px solid #dfe2e5;
      padding: 6px 13px;
    }
    table th {
      background-color: #f6f8fa;
      font-weight: 600;
    }
    .badge {
      display: inline-block;
      padding: 3px 6px;
      border-radius: 3px;
      font-size: 12px;
      font-weight: 600;
    }
    .badge-success {
      background-color: #28a745;
      color: white;
    }
    .badge-warning {
      background-color: #ffc107;
      color: black;
    }
    .badge-danger {
      background-color: #dc3545;
      color: white;
    }
  </style>
</head>
<body>
  <div id="content">
    ${this.markdownToHtml(markdown)}
  </div>
</body>
</html>
    `;
    
    return html;
  }
  
  /**
   * 将 Markdown 转换为 HTML
   * @param {string} markdown Markdown 文本
   * @returns {string} HTML 文本
   */
  markdownToHtml(markdown) {
    // 这里使用简单的正则表达式转换，实际项目中可以使用 marked 等库
    let html = markdown;
    
    // 转换标题
    html = html.replace(/^# (.*?)$/gm, '<h1>$1</h1>');
    html = html.replace(/^## (.*?)$/gm, '<h2>$1</h2>');
    html = html.replace(/^### (.*?) {#(.*?)}$/gm, '<h3 id="$2">$1</h3>');
    html = html.replace(/^### (.*?)$/gm, '<h3>$1</h3>');
    html = html.replace(/^#### (.*?)$/gm, '<h4>$1</h4>');
    
    // 转换强调
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // 转换代码
    html = html.replace(/`(.*?)`/g, '<code>$1</code>');
    
    // 转换代码块
    html = html.replace(/```(.*?)\n([\s\S]*?)```/g, '<pre><code class="language-$1">$2</code></pre>');
    
    // 转换表格
    html = html.replace(/\| (.*?) \|\n\| [-:]+ \|\n([\s\S]*?)(?=\n\n)/g, (match, header, rows) => {
      const headerCells = header.split('|').map(cell => `<th>${cell.trim()}</th>`).join('');
      const rowsHtml = rows.split('\n').map(row => {
        const cells = row.split('|').map(cell => `<td>${cell.trim()}</td>`).join('');
        return `<tr>${cells}</tr>`;
      }).join('');
      
      return `<table><thead><tr>${headerCells}</tr></thead><tbody>${rowsHtml}</tbody></table>`;
    });
    
    // 转换列表
    html = html.replace(/^- (.*?)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*?<\/li>\n)+/g, '<ul>$&</ul>');
    
    // 转换段落
    html = html.replace(/^([^<].*?)$/gm, '<p>$1</p>');
    
    // 转换状态徽章
    html = html.replace(/\[启用\]/g, '<span class="badge badge-success">启用</span>');
    html = html.replace(/\[禁用\]/g, '<span class="badge badge-danger">禁用</span>');
    html = html.replace(/\[已弃用\]/g, '<span class="badge badge-warning">已弃用</span>');
    
    // 转换分隔线
    html = html.replace(/^---$/gm, '<hr>');
    
    return html;
  }
  
  /**
   * 获取分类名称
   * @param {string} category 分类键名
   * @returns {string} 分类名称
   */
  getCategoryName(category) {
    const categoryMap = {
      [API_CATEGORIES.SYSTEM]: '系统 API',
      [API_CATEGORIES.DATA]: '数据查询 API',
      [API_CATEGORIES.DEVICE]: '设备控制 API',
      [API_CATEGORIES.CUSTOM]: '用户自定义 API',
      [API_CATEGORIES.ADMIN]: '管理员 API',
      [API_CATEGORIES.AUTH]: '认证 API',
      [API_CATEGORIES.REPORT]: '报表 API',
      'uncategorized': '未分类 API'
    };
    
    return categoryMap[category] || category;
  }
  
  /**
   * 获取状态徽章
   * @param {string} status 状态
   * @returns {string} 状态徽章
   */
  getStatusBadge(status) {
    switch (status) {
      case API_STATUS.ENABLED:
        return '[启用]';
      case API_STATUS.DISABLED:
        return '[禁用]';
      case API_STATUS.DEPRECATED:
        return '[已弃用]';
      default:
        return status;
    }
  }
  
  /**
   * 生成示例值
   * @param {Object} field 字段定义
   * @returns {string} 示例值
   */
  generateExampleValue(field) {
    switch (field.type) {
      case FIELD_TYPES.STRING:
        return `'示例${field.label || field.key}'`;
      case FIELD_TYPES.NUMBER:
        return '123';
      case FIELD_TYPES.BOOLEAN:
        return 'true';
      case FIELD_TYPES.DATE:
        return `'2023-01-01'`;
      case FIELD_TYPES.DATETIME:
        return `'2023-01-01T12:00:00'`;
      case FIELD_TYPES.OBJECT:
        return '{}';
      case FIELD_TYPES.ARRAY:
        return '[]';
      case FIELD_TYPES.ENUM:
        if (field.options && field.options.length > 0) {
          return `'${field.options[0].value}'`;
        }
        return `'option1'`;
      default:
        return `'${field.key}'`;
    }
  }
  
  /**
   * 生成示例响应
   * @param {string} apiKey API 键名
   * @param {Array} fields 字段定义
   * @returns {Object} 示例响应
   */
  generateExampleResponse(apiKey, fields) {
    if (!fields || fields.length === 0) {
      return {
        success: true,
        message: '操作成功',
        data: {}
      };
    }
    
    const data = {};
    
    fields.forEach(field => {
      switch (field.type) {
        case FIELD_TYPES.STRING:
          data[field.key] = `示例${field.label || field.key}`;
          break;
        case FIELD_TYPES.NUMBER:
          data[field.key] = 123;
          break;
        case FIELD_TYPES.BOOLEAN:
          data[field.key] = true;
          break;
        case FIELD_TYPES.DATE:
          data[field.key] = '2023-01-01';
          break;
        case FIELD_TYPES.DATETIME:
          data[field.key] = '2023-01-01T12:00:00';
          break;
        case FIELD_TYPES.OBJECT:
          data[field.key] = {};
          break;
        case FIELD_TYPES.ARRAY:
          data[field.key] = [];
          break;
        case FIELD_TYPES.ENUM:
          if (field.options && field.options.length > 0) {
            data[field.key] = field.options[0].value;
          } else {
            data[field.key] = 'option1';
          }
          break;
        default:
          data[field.key] = field.key;
      }
    });
    
    return {
      success: true,
      message: '操作成功',
      data
    };
  }
  
  /**
   * 获取 OpenAPI 模式
   * @param {Object} field 字段定义
   * @returns {Object} OpenAPI 模式
   */
  getOpenApiSchema(field) {
    const schema = {};
    
    switch (field.type) {
      case FIELD_TYPES.STRING:
        schema.type = 'string';
        break;
      case FIELD_TYPES.NUMBER:
        schema.type = 'number';
        break;
      case FIELD_TYPES.BOOLEAN:
        schema.type = 'boolean';
        break;
      case FIELD_TYPES.DATE:
      case FIELD_TYPES.DATETIME:
        schema.type = 'string';
        schema.format = 'date-time';
        break;
      case FIELD_TYPES.OBJECT:
        schema.type = 'object';
        break;
      case FIELD_TYPES.ARRAY:
        schema.type = 'array';
        schema.items = {
          type: 'string'
        };
        break;
      case FIELD_TYPES.ENUM:
        schema.type = 'string';
        if (field.options && field.options.length > 0) {
          schema.enum = field.options.map(option => option.value);
        }
        break;
      default:
        schema.type = 'string';
    }
    
    if (field.description) {
      schema.description = field.description;
    }
    
    return schema;
  }
}

// 创建单例
const apiDocGenerator = new ApiDocGenerator();

export default apiDocGenerator;
