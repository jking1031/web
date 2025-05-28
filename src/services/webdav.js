import { createClient } from 'webdav';
import axios from 'axios';

/**
 * WebDAV服务类，用于连接Nextcloud等支持WebDAV协议的存储服务
 */
class WebDAVService {
  constructor() {
    this.baseURL = '';
    this.username = '';
    this.password = '';
    this.connected = false;
    this.client = null;
    this.useProxy = true; // 修改为默认不使用代理
    this.proxyClient = null;
  }

  /**
   * 初始化WebDAV连接
   * @param {string} baseURL - WebDAV服务器地址
   * @param {string} username - 用户名
   * @param {string} password - 密码
   * @param {boolean} useProxy - 是否使用代理解决CORS问题
   * @returns {boolean} 连接是否成功
   */
  init(baseURL, username, password, useProxy = true) {
    // 清理URL中的BOM字符
    let cleanBaseURL = baseURL.replace(/[\uFEFF\uFFFE\u200B]/g, '');
    // 也处理编码后的BOM字符
    cleanBaseURL = cleanBaseURL.replace(/%EF%BB%BF/g, '');
    
    // 保存原始的WebDAV服务器信息
    this.baseURL = cleanBaseURL.endsWith('/') ? cleanBaseURL : `${cleanBaseURL}/`;
    
    // 移除用户名中可能存在的BOM字符
    this.username = username.replace(/[\uFEFF\uFFFE\u200B]/g, '');
    this.password = password;
    this.useProxy = useProxy;
    
    try {
      if (this.useProxy) {
        // 获取当前域名和端口，以便使用相对路径
        const currentHost = window.location.origin;
        const proxyUrl = `${currentHost}/api/webdav/proxy`;
        console.log("使用代理URL:", proxyUrl);
        
        // 使用Node-RED作为代理，避免CORS问题
        this.proxyClient = axios.create({
          baseURL: proxyUrl,
          headers: {
            'Content-Type': 'application/json', // 修改为JSON格式，便于Node-RED处理
            'X-WebDAV-Server': encodeURIComponent(this.baseURL),
            'X-WebDAV-Username': encodeURIComponent(this.username),
            'X-WebDAV-Password': encodeURIComponent(this.password)
          }
        });
      } else {
        // 使用webdav-client库直接连接
        this.client = createClient(this.baseURL, {
          username: this.username,
          password: this.password,
          headers: {
            // 避免Nextcloud可能需要的额外头信息
            'OCS-APIRequest': 'true',
          }
        });
      }
      
      this.connected = true;
      return true;
    } catch (error) {
      console.error('WebDAV连接失败', error);
      this.connected = false;
      throw error;
    }
  }

  /**
   * 检查连接状态
   * @returns {boolean} 是否已连接
   */
  isConnected() {
    return this.connected;
  }

  /**
   * 获取目录内容列表
   * @param {string} path - 目录路径
   * @returns {Promise<Array>} 文件和目录列表
   */
  async listDirectory(path = '') {
    if (!this.connected) {
      throw new Error('WebDAV未连接，请先调用init方法');
    }

    try {
      if (this.useProxy) {
        // 使用代理
        const normalizedPath = path.startsWith('/') ? path.substring(1) : path;
        const response = await this.proxyClient({
          method: 'POST',
          url: '/list',
          data: {
            path: normalizedPath
          }
        });
        
        console.log("WebDAV列表响应:", response.data);
        
        // 如果Node-RED已经解析了XML并返回JSON
        if (response.data && Array.isArray(response.data.items)) {
          console.log("使用服务器返回的解析后items数组", response.data.items);
          return response.data.items;
        }
        
        // 如果返回的是原始XML，则在前端解析
        if (response.data && response.data.raw) {
          console.log("需要前端解析XML响应");
          
          let xmlContent = response.data.raw;
          // 确保xmlContent是字符串
          if (typeof xmlContent !== 'string') {
            console.log("XML内容不是字符串，尝试转换", typeof xmlContent);
            
            // 如果是Buffer或类似类型，尝试转换为字符串
            if (xmlContent instanceof ArrayBuffer || (xmlContent.buffer && xmlContent.buffer instanceof ArrayBuffer)) {
              xmlContent = new TextDecoder('utf-8').decode(xmlContent);
            } else {
              // 其他类型尝试强制转换为字符串
              xmlContent = String(xmlContent);
            }
          }
          
          try {
            const parser = new DOMParser();
            // 确保解析时指定编码为UTF-8
            const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');
            console.log("XML解析成功");
            
            // 获取所有响应元素
            const responses = xmlDoc.getElementsByTagNameNS('DAV:', 'response') || 
                             xmlDoc.getElementsByTagName('d:response') ||
                             xmlDoc.getElementsByTagName('response');
            
            console.log("找到响应元素数量:", responses ? responses.length : 0);
            
            if (!responses || responses.length === 0) {
              console.warn("未找到响应元素，返回空数组");
              return [];
            }
            
            const items = [];
            // 从URL中提取用户名，用于过滤
            const username = response.data.username || '';
            
            for (let i = 0; i < responses.length; i++) {
              try {
                const response = responses[i];
                
                // 尝试多种可能的命名空间获取href
                const hrefElement = response.getElementsByTagNameNS('DAV:', 'href')[0] || 
                                   response.getElementsByTagName('d:href')[0] ||
                                   response.getElementsByTagName('href')[0];
                
                if (!hrefElement) {
                  console.warn(`响应 #${i} 中未找到href元素，跳过`);
                  continue;
                }
                
                const href = hrefElement.textContent;
                console.log(`处理项目 #${i}: ${href}`);
                
                // 多次解码，确保特殊字符和UTF-8编码正确处理
                let decodedHref;
                try {
                  // 首次解码
                  decodedHref = decodeURIComponent(href);
                  
                  // 尝试再次解码（某些服务器可能有双重编码）
                  try {
                    const secondDecode = decodeURIComponent(decodedHref);
                    // 确保第二次解码不产生不同的结果（避免过度解码）
                    if (secondDecode !== decodedHref && secondDecode.length < decodedHref.length) {
                      decodedHref = secondDecode;
                    }
                  } catch (e) {
                    // 忽略二次解码错误，保留首次解码结果
                  }
                } catch (e) {
                  // 如果解码失败（可能因为URL不是正确编码），使用原始值
                  console.warn('URL解码失败，使用原始值:', href);
                  decodedHref = href;
                }
                
                // 忽略当前目录
                if (decodedHref === normalizedPath || 
                    decodedHref === `/${normalizedPath}` || 
                    decodedHref === `${normalizedPath}/`) {
                  console.log(`跳过当前目录: ${decodedHref}`);
                  continue;
                }
                
                // 忽略用户名目录
                if (username && 
                    decodedHref.includes(`/remote.php/dav/files/${username}/`) && 
                    !decodedHref.replace(`/remote.php/dav/files/${username}/`, '')) {
                  console.log(`跳过用户根目录: ${decodedHref}`);
                  continue;
                }
                
                // 获取属性
                const propstats = response.getElementsByTagNameNS('DAV:', 'propstat') || 
                                 response.getElementsByTagName('d:propstat') ||
                                 response.getElementsByTagName('propstat');
                
                if (!propstats || propstats.length === 0) {
                  console.warn(`响应 #${i} 中未找到propstat元素，跳过`);
                  continue;
                }
                
                let isDirectory = false;
                let contentType = '';
                let contentLength = 0;
                let lastModified = '';
                
                for (let j = 0; j < propstats.length; j++) {
                  const propsElement = propstats[j].getElementsByTagNameNS('DAV:', 'prop')[0] ||
                                      propstats[j].getElementsByTagName('d:prop')[0] ||
                                      propstats[j].getElementsByTagName('prop')[0];
                  
                  if (!propsElement) {
                    console.warn(`propstat #${j} 中未找到prop元素，跳过`);
                    continue;
                  }
                  
                  // 检查资源类型 - 尝试多种可能的命名空间
                  const resourceTypeElement = propsElement.getElementsByTagNameNS('DAV:', 'resourcetype')[0] ||
                                            propsElement.getElementsByTagName('d:resourcetype')[0] ||
                                            propsElement.getElementsByTagName('resourcetype')[0];
                  
                  if (resourceTypeElement) {
                    const collections = resourceTypeElement.getElementsByTagNameNS('DAV:', 'collection') ||
                                       resourceTypeElement.getElementsByTagName('d:collection') ||
                                       resourceTypeElement.getElementsByTagName('collection');
                    isDirectory = collections && collections.length > 0;
                  }
                  
                  // 获取内容类型
                  const contentTypeElements = propsElement.getElementsByTagNameNS('DAV:', 'getcontenttype') ||
                                            propsElement.getElementsByTagName('d:getcontenttype') ||
                                            propsElement.getElementsByTagName('getcontenttype');
                  if (contentTypeElements && contentTypeElements.length > 0) {
                    contentType = contentTypeElements[0].textContent;
                  }
                  
                  // 获取内容长度
                  const contentLengthElements = propsElement.getElementsByTagNameNS('DAV:', 'getcontentlength') ||
                                              propsElement.getElementsByTagName('d:getcontentlength') ||
                                              propsElement.getElementsByTagName('getcontentlength');
                  if (contentLengthElements && contentLengthElements.length > 0) {
                    contentLength = parseInt(contentLengthElements[0].textContent, 10) || 0;
                  }
                  
                  // 获取最后修改时间
                  const lastModifiedElements = propsElement.getElementsByTagNameNS('DAV:', 'getlastmodified') ||
                                             propsElement.getElementsByTagName('d:getlastmodified') ||
                                             propsElement.getElementsByTagName('getlastmodified');
                  if (lastModifiedElements && lastModifiedElements.length > 0) {
                    lastModified = lastModifiedElements[0].textContent;
                  }
                }
                
                // 提取文件名/目录名 - 移除用户名部分
                let name = decodedHref.split('/').filter(Boolean).pop() || '';
                
                // 处理URL编码的文件名
                try {
                  name = decodeURIComponent(name);
                } catch (e) {
                  // 忽略解码错误
                }
                
                // 确保文件名没有被错误编码
                name = this.sanitizeFileName(name);
                
                // 清理文件路径，移除WebDAV前缀和用户名部分
                let cleanPath = decodedHref;
                if (username && cleanPath.includes(`/remote.php/dav/files/${username}/`)) {
                  cleanPath = cleanPath.replace(`/remote.php/dav/files/${username}/`, '');
                }
                
                console.log(`添加项目: ${name}, 类型: ${isDirectory ? '目录' : '文件'}`);
                
                items.push({
                  name,
                  path: cleanPath,
                  isDirectory,
                  contentType,
                  size: contentLength,
                  lastModified: lastModified ? new Date(lastModified) : null,
                });
              } catch (itemError) {
                console.error(`处理项目 #${i} 时出错:`, itemError);
                // 继续处理下一个项目
              }
            }
            
            console.log(`成功解析 ${items.length} 个项目`);
            return items;
          } catch (parseError) {
            console.error('XML解析失败:', parseError);
            throw new Error(`XML解析失败: ${parseError.message}`);
          }
        }
        
        // 如果既不是items数组也不是原始XML，返回空数组
        console.warn('未识别的响应格式，返回空数组', response.data);
        
        // 尝试直接解析返回的XML字符串
        if (typeof response.data === 'string' && response.data.includes('<?xml')) {
          try {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(response.data, 'text/xml');
            
            // 获取所有响应元素
            const responses = xmlDoc.getElementsByTagNameNS('DAV:', 'response') || 
                             xmlDoc.getElementsByTagName('d:response') ||
                             xmlDoc.getElementsByTagName('response');
            
            console.log("直接解析XML - 找到响应元素数量:", responses ? responses.length : 0);
            
            if (!responses || responses.length === 0) {
              console.warn("未找到响应元素，返回空数组");
              return [];
            }
            
            const items = [];
            
            for (let i = 0; i < responses.length; i++) {
              try {
                const response = responses[i];
                
                // 尝试多种可能的命名空间获取href
                const hrefElement = response.getElementsByTagNameNS('DAV:', 'href')[0] || 
                                   response.getElementsByTagName('d:href')[0] ||
                                   response.getElementsByTagName('href')[0];
                
                if (!hrefElement) {
                  console.warn(`响应 #${i} 中未找到href元素，跳过`);
                  continue;
                }
                
                const href = hrefElement.textContent;
                
                // 多次解码，确保特殊字符和UTF-8编码正确处理
                let decodedHref;
                try {
                  decodedHref = decodeURIComponent(href);
                } catch (e) {
                  decodedHref = href;
                }
                
                // 获取属性
                const propstats = response.getElementsByTagNameNS('DAV:', 'propstat') || 
                                 response.getElementsByTagName('d:propstat') ||
                                 response.getElementsByTagName('propstat');
                
                if (!propstats || propstats.length === 0) {
                  console.warn(`响应 #${i} 中未找到propstat元素，跳过`);
                  continue;
                }
                
                let isDirectory = false;
                let contentType = '';
                let contentLength = 0;
                let lastModified = '';
                
                for (let j = 0; j < propstats.length; j++) {
                  const propsElement = propstats[j].getElementsByTagNameNS('DAV:', 'prop')[0] ||
                                      propstats[j].getElementsByTagName('d:prop')[0] ||
                                      propstats[j].getElementsByTagName('prop')[0];
                  
                  if (!propsElement) continue;
                  
                  // 检查资源类型
                  const resourceTypeElement = propsElement.getElementsByTagNameNS('DAV:', 'resourcetype')[0] ||
                                            propsElement.getElementsByTagName('d:resourcetype')[0] ||
                                            propsElement.getElementsByTagName('resourcetype')[0];
                  
                  if (resourceTypeElement) {
                    const collections = resourceTypeElement.getElementsByTagNameNS('DAV:', 'collection') ||
                                       resourceTypeElement.getElementsByTagName('d:collection') ||
                                       resourceTypeElement.getElementsByTagName('collection');
                    isDirectory = collections && collections.length > 0;
                  }
                  
                  // 获取内容类型
                  const contentTypeElements = propsElement.getElementsByTagNameNS('DAV:', 'getcontenttype') ||
                                            propsElement.getElementsByTagName('d:getcontenttype') ||
                                            propsElement.getElementsByTagName('getcontenttype');
                  if (contentTypeElements && contentTypeElements.length > 0) {
                    contentType = contentTypeElements[0].textContent;
                  }
                  
                  // 获取内容长度
                  const contentLengthElements = propsElement.getElementsByTagNameNS('DAV:', 'getcontentlength') ||
                                              propsElement.getElementsByTagName('d:getcontentlength') ||
                                              propsElement.getElementsByTagName('getcontentlength');
                  if (contentLengthElements && contentLengthElements.length > 0) {
                    contentLength = parseInt(contentLengthElements[0].textContent, 10) || 0;
                  }
                  
                  // 获取最后修改时间
                  const lastModifiedElements = propsElement.getElementsByTagNameNS('DAV:', 'getlastmodified') ||
                                             propsElement.getElementsByTagName('d:getlastmodified') ||
                                             propsElement.getElementsByTagName('getlastmodified');
                  if (lastModifiedElements && lastModifiedElements.length > 0) {
                    lastModified = lastModifiedElements[0].textContent;
                  }
                }
                
                // 提取文件名/目录名
                let name = decodedHref.split('/').filter(Boolean).pop() || '';
                
                // 处理URL编码的文件名
                try {
                  name = decodeURIComponent(name);
                } catch (e) {
                  // 忽略解码错误
                }
                
                // 确保文件名没有被错误编码
                name = this.sanitizeFileName(name);
                
                // 从路径中提取文件名，处理远程路径格式
                if (decodedHref.includes('/remote.php/dav/files/')) {
                  const parts = decodedHref.split('/remote.php/dav/files/');
                  if (parts.length > 1) {
                    const userParts = parts[1].split('/');
                    if (userParts.length > 1) {
                      const relativePath = userParts.slice(1).join('/');
                      // 如果相对路径不为空，则使用它
                      if (relativePath) {
                        const pathParts = relativePath.split('/');
                        name = pathParts[pathParts.length - 1];
                      }
                    }
                  }
                }
                
                console.log(`添加项目: ${name}, 类型: ${isDirectory ? '目录' : '文件'}`);
                
                items.push({
                  name,
                  path: decodedHref,
                  isDirectory,
                  contentType,
                  size: contentLength,
                  lastModified: lastModified ? new Date(lastModified) : null,
                });
              } catch (itemError) {
                console.error(`处理项目 #${i} 时出错:`, itemError);
                // 继续处理下一个项目
              }
            }
            
            console.log(`成功解析 ${items.length} 个项目`);
            return items;
          } catch (parseError) {
            console.error('直接XML解析失败:', parseError);
          }
        }
        
        return [];
      } else {
        // 使用webdav-client
        const result = await this.client.getDirectoryContents(path);
        
        // 转换为统一的返回格式并处理文件名
        return result.map(item => ({
          name: this.sanitizeFileName(item.basename),
          path: item.filename,
          isDirectory: item.type === 'directory',
          contentType: item.mime,
          size: item.size,
          lastModified: new Date(item.lastmod),
        }));
      }
    } catch (error) {
      console.error('获取目录内容失败', error);
      throw error;
    }
  }

  /**
   * 下载文件
   * @param {string} path - 文件路径
   * @returns {Promise<Blob>} 文件内容
   */
  async downloadFile(path) {
    if (!this.connected) {
      throw new Error('WebDAV未连接，请先调用init方法');
    }

    try {
      if (this.useProxy) {
        // 使用代理
        const normalizedPath = path.startsWith('/') ? path.substring(1) : path;
        const response = await this.proxyClient({
          method: 'POST',
          url: '/download',
          responseType: 'blob',
          data: {
            path: normalizedPath
          }
        });
        
        return response.data;
      } else {
        // 使用webdav-client
        const data = await this.client.getFileContents(path, { format: 'binary' });
        return new Blob([data]);
      }
    } catch (error) {
      console.error('下载文件失败', error);
      throw error;
    }
  }

  /**
   * 上传文件
   * @param {string} path - 目标路径
   * @param {File|Blob} file - 要上传的文件
   * @param {Function} onProgress - 进度回调函数 (percent, uploadedBytes, totalBytes) => void
   * @returns {Promise<boolean>} 上传是否成功
   */
  async uploadFile(path, file, onProgress = null) {
    if (!this.connected) {
      throw new Error('WebDAV未连接，请先调用init方法');
    }

    try {
      if (this.useProxy) {
        // 使用代理
        const normalizedPath = path.startsWith('/') ? path.substring(1) : path;
        
        // 创建FormData对象
        const formData = new FormData();
        
        // 使用Blob构造一个新文件对象，保留原始文件名
        // 这确保文件名的编码信息被正确传递
        let fileToUpload;
        if (file instanceof File) {
          // 确保文件名编码正确
          const sanitizedName = this.sanitizeFileName(file.name);
          
          // 明确设置中文文件名的处理方式
          // 确保文件名使用UTF-8编码
          console.log("原始文件名:", file.name);
          console.log("处理后文件名:", sanitizedName);
          
          const options = {
            type: file.type,
            lastModified: file.lastModified
          };
          fileToUpload = new File([file], sanitizedName, options);
          
          // 添加额外属性帮助调试
          formData.append('originalFileName', file.name);
          formData.append('sanitizedFileName', sanitizedName);
        } else {
          // 如果是Blob，使用一个默认文件名
          fileToUpload = file;
        }
        
        formData.append('file', fileToUpload);
        formData.append('path', normalizedPath);
        
        // 添加上传进度监听
        const totalSize = fileToUpload.size;
        
        await this.proxyClient({
          method: 'POST',
          url: '/upload',
          data: formData,
          headers: {
            'Content-Type': 'multipart/form-data'
            // 移除不允许的Accept-Charset头
          },
          onUploadProgress: onProgress 
            ? (progressEvent) => {
                const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                onProgress(percentCompleted, progressEvent.loaded, progressEvent.total);
              }
            : undefined
        });
        
        // 上传完成，调用一次100%进度
        if (onProgress) {
          onProgress(100, totalSize, totalSize);
        }
        
        return true;
      } else {
        // 使用webdav-client
        const uploadPath = path.endsWith('/') 
          ? `${path}${this.sanitizeFileName(file.name)}` 
          : `${path}/${this.sanitizeFileName(file.name)}`;
        
        const arrayBuffer = await file.arrayBuffer();
        const totalSize = arrayBuffer.byteLength;
        
        // webdav-client库不直接支持进度回调，但我们可以在上传前和上传后调用进度回调
        if (onProgress) {
          onProgress(0, 0, totalSize);
        }
        
        await this.client.putFileContents(uploadPath, arrayBuffer, {
          contentLength: totalSize,
          overwrite: true
        });
        
        // 上传完成，调用一次100%进度
        if (onProgress) {
          onProgress(100, totalSize, totalSize);
        }
        
        return true;
      }
    } catch (error) {
      console.error('上传文件失败', error);
      throw error;
    }
  }

  /**
   * 创建目录
   * @param {string} path - 目录路径
   * @returns {Promise<boolean>} 创建是否成功
   */
  async createDirectory(path) {
    if (!this.connected) {
      throw new Error('WebDAV未连接，请先调用init方法');
    }

    try {
      if (this.useProxy) {
        // 使用代理
        const normalizedPath = path.startsWith('/') ? path.substring(1) : path;
        
        await this.proxyClient({
          method: 'POST',
          url: '/mkdir',
          headers: {
            'Content-Type': 'application/json'  // 明确指定Content-Type为JSON
          },
          data: {
            path: normalizedPath
          }
        });
        
        return true;
      } else {
        // 使用webdav-client
        await this.client.createDirectory(path);
        return true;
      }
    } catch (error) {
      console.error('创建目录失败', error);
      throw error;
    }
  }

  /**
   * 删除文件或目录
   * @param {string} path - 文件或目录路径
   * @returns {Promise<boolean>} 删除是否成功
   */
  async delete(path) {
    if (!this.connected) {
      throw new Error('WebDAV未连接，请先调用init方法');
    }

    try {
      if (this.useProxy) {
        // 使用代理
        const normalizedPath = path.startsWith('/') ? path.substring(1) : path;
        
        await this.proxyClient({
          method: 'POST',
          url: '/delete',
          data: {
            path: normalizedPath
          }
        });
        
        return true;
      } else {
        // 使用webdav-client
        await this.client.deleteFile(path);
        return true;
      }
    } catch (error) {
      console.error('删除失败', error);
      throw error;
    }
  }

  /**
   * 断开WebDAV连接
   * 在页面关闭或用户手动断开连接时调用
   * @returns {boolean} 断开连接是否成功
   */
  disconnect() {
    try {
      // 清理连接状态
      this.connected = false;
      
      // 如果使用代理，发送断开连接请求
      if (this.useProxy && this.proxyClient) {
        // 尝试发送断开连接请求
        // 注意：这是一个异步操作，但在页面关闭时可能无法完成
        // 所以我们不等待它完成
        try {
          this.proxyClient({
            method: 'POST',
            url: '/disconnect',
            data: {
              server: this.baseURL,
              username: this.username
            }
          }).catch(() => {
            // 忽略错误，因为页面可能已经关闭
          });
        } catch (error) {
          // 忽略错误
          console.log('断开连接请求发送失败，但这可能是因为页面正在关闭');
        }
      }
      
      // 清空客户端实例
      this.client = null;
      this.proxyClient = null;
      
      return true;
    } catch (error) {
      console.error('断开连接失败', error);
      return false;
    }
  }

  /**
   * 净化文件名，确保特殊文件类型显示正确
   * @param {string} fileName - 原始文件名
   * @returns {string} 处理后的文件名
   */
  sanitizeFileName(fileName) {
    if (!fileName) return fileName;
    
    console.log("sanitizeFileName处理前:", fileName);
    
    // 确保文件名是UTF-8编码
    // 检查是否含有非ASCII字符(如中文)
    const hasNonAscii = /[^\x00-\x7F]/.test(fileName);
    if (hasNonAscii) {
      console.log("文件名包含非ASCII字符(可能是中文)");
    }
    
    // 处理明显的URL编码字符
    if (fileName.includes('%')) {
      try {
        // 先尝试完整解码
        const decoded = decodeURIComponent(fileName);
        if (decoded !== fileName) {
          console.log("文件名URL解码成功:", decoded);
          return this.sanitizeFileExtension(decoded);
        }
      } catch (e) {
        // 解码失败，尝试部分解码
        try {
          // 采用分段解码策略
          const parts = fileName.split('%');
          let result = parts[0];
          for (let i = 1; i < parts.length; i++) {
            const part = parts[i];
            if (part.length >= 2) {
              try {
                // 尝试解码 %XX 格式
                const decoded = decodeURIComponent('%' + part.substring(0, 2));
                result += decoded + part.substring(2);
              } catch (err) {
                // 如果部分解码失败，保留原样
                result += '%' + part;
              }
            } else {
              result += '%' + part;
            }
          }
          console.log("文件名部分URL解码:", result);
          return this.sanitizeFileExtension(result);
        } catch (e2) {
          // 所有解码方法都失败，继续下一步
          console.log("文件名URL解码失败");
        }
      }
    }
    
    // 检查中文乱码修复
    const result = this.sanitizeFileExtension(this.fixChineseEncoding(fileName));
    console.log("sanitizeFileName处理后:", result);
    return result;
  }

  /**
   * 专门处理文件扩展名
   * @param {string} fileName - 文件名
   * @returns {string} 处理后的文件名
   */
  sanitizeFileExtension(fileName) {
    // 常见文件类型的扩展名处理
    const fileExtensions = [
      '.md', '.markdown',
      '.xlsx', '.xls', '.csv',
      '.docx', '.doc', '.rtf', '.txt',
      '.pptx', '.ppt',
      '.pdf',
      '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg',
      '.zip', '.rar', '.7z', '.tar', '.gz',
      '.js', '.jsx', '.ts', '.tsx', '.html', '.css', '.scss', '.sass',
      '.json', '.xml', '.yaml', '.yml',
      '.py', '.java', '.c', '.cpp', '.cs', '.php', '.rb'
    ];
    
    // 检查文件名中的特殊字符序列，这些可能是编码错误的迹象
    const suspiciousPatterns = ['%', '\\u', '\\x', '+'];
    let hasSuspiciousPattern = suspiciousPatterns.some(pattern => fileName.includes(pattern));
    
    // 如果有可疑模式，对每个扩展名进行更彻底的检查
    if (hasSuspiciousPattern) {
      for (const ext of fileExtensions) {
        // 创建正则表达式来匹配各种可能被错误编码的扩展名形式
        const cleanExt = ext.replace(/\./g, '\\.');
        const variantPatterns = [
          // 标准格式
          new RegExp(`${cleanExt}$`, 'i'),
          // URL编码格式
          new RegExp(`${encodeURIComponent(ext).replace(/%/g, '%?')}$`, 'i'),
          // 部分编码格式
          new RegExp(`\\.${ext.substring(1).replace(/[a-z]/gi, char => `(?:${char}|%${char.charCodeAt(0).toString(16)})`)}$`, 'i')
        ];
        
        // 检查每个模式
        for (const pattern of variantPatterns) {
          if (pattern.test(fileName)) {
            // 如果匹配，返回纠正后的文件名
            const baseName = fileName.replace(pattern, '');
            return baseName + ext;
          }
        }
      }
    }

    return fileName;
  }

  /**
   * 修复中文编码问题
   * @param {string} text - 可能包含乱码的文本
   * @returns {string} 修复后的文本
   */
  fixChineseEncoding(text) {
    if (!text) return text;
    
    // 检测常见的中文乱码模式
    // 例如 \u 或 % 后跟数字的模式
    const chineseEncodingPattern = /(%[0-9A-F]{2}){2,}|\\u[0-9a-fA-F]{4}/g;
    
    if (chineseEncodingPattern.test(text)) {
      try {
        // 尝试使用TextDecoder解码
        const bytes = [];
        let i = 0;
        while (i < text.length) {
          if (text[i] === '%' && i + 2 < text.length) {
            // 解析百分号编码
            const hex = text.substring(i + 1, i + 3);
            bytes.push(parseInt(hex, 16));
            i += 3;
          } else if (text.substring(i, i + 2) === '\\u' && i + 5 < text.length) {
            // 解析Unicode转义序列
            const hex = text.substring(i + 2, i + 6);
            const codePoint = parseInt(hex, 16);
            
            // 将Unicode码点转换为UTF-8字节
            if (codePoint < 0x80) {
              bytes.push(codePoint);
            } else if (codePoint < 0x800) {
              bytes.push(0xc0 | (codePoint >> 6), 
                       0x80 | (codePoint & 0x3f));
            } else {
              bytes.push(0xe0 | (codePoint >> 12),
                       0x80 | ((codePoint >> 6) & 0x3f),
                       0x80 | (codePoint & 0x3f));
            }
            i += 6;
          } else {
            // 普通字符
            bytes.push(text.charCodeAt(i));
            i++;
          }
        }
        
        // 将字节数组转换为Uint8Array并解码为UTF-8
        const uint8Array = new Uint8Array(bytes);
        const decoder = new TextDecoder('utf-8');
        return decoder.decode(uint8Array);
      } catch (e) {
        console.warn('修复中文编码失败', e);
        // 失败时返回原始文本
        return text;
      }
    }
    
    return text;
  }
}

export default new WebDAVService(); 