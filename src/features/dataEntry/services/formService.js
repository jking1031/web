import axios from 'axios';

// Get API base URL from environment variables or use default
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://nodered.jzz77.cn:9003';

// Create axios instance with proper configuration
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds timeout
});

// Add request interceptor to include auth token if available
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 在文件顶部添加调试工具
const DEBUG = true; // 启用调试日志
const logDebug = (...args) => DEBUG && console.log('[FormService]', ...args);

export const formService = {
  // Get all forms from Node-RED
  getForms: async () => {
    console.log(`正在请求所有表单列表... API URL: ${API_BASE_URL}/api/forms`);
    
    try {
      const response = await apiClient.get('/api/forms');
      console.log(`获取表单列表成功，共${response.data?.data?.length || 0}项`);
      return response.data;
    } catch (error) {
      console.error('获取表单列表失败:', error);
      
      // 详细错误处理
      if (error.response) {
        console.error('错误状态码:', error.response.status);
        console.error('错误响应:', error.response.data);
        
        return {
          success: false,
          message: `服务器错误 (${error.response.status}): ${error.response.data?.message || '未知错误'}`,
          data: [],
          error: error.response.data
        };
      } else if (error.request) {
        console.error('服务器无响应');
        
        return {
          success: false,
          message: '服务器无响应，请检查网络连接',
          data: [],
          error: 'no_response'
        };
      }
      
      return {
        success: false,
        message: `获取表单列表失败: ${error.message}`,
        data: [],
        error: error.message
      };
    }
  },

  // Get a single form by ID
  getForm: async (id) => {
    if (!id) {
      console.error('表单ID不能为空');
      return {
        success: false,
        message: '表单ID不能为空',
        data: null
      };
    }
    
    console.log(`正在获取表单数据，ID: ${id}`);
    console.log(`API URL: ${API_BASE_URL}/api/forms/${id}`);
    
    try {
      const response = await apiClient.get(`/api/forms/${id}`);
      console.log('API响应:', response.data);
      
      // 验证返回的数据
      const formData = response.data?.data;
      if (formData && !formData.embedUrl) {
        console.warn('API返回的表单数据中没有embedUrl');
      }
      
      return response.data;
    } catch (error) {
      console.error('获取表单详情失败:', error);
      
      // 详细错误处理
      if (error.response) {
        console.error('错误状态码:', error.response.status);
        console.error('错误响应:', error.response.data);
        
        return {
          success: false,
          message: `服务器错误 (${error.response.status}): ${error.response.data?.message || '未知错误'}`,
          data: null,
          error: error.response.data
        };
      } else if (error.request) {
        console.error('服务器无响应');
        
        return {
          success: false,
          message: '服务器无响应，请检查网络连接',
          data: null,
          error: 'no_response'
        };
      }
      
      return {
        success: false,
        message: `获取表单失败: ${error.message}`,
        data: null,
        error: error.message
      };
    }
  },

  // Create a new form
  createForm: async (formData) => {
    try {
      // 确保所需字段存在，但不修改原始embedUrl
      const processedData = {
        ...formData,
        // 确保embedType存在
        embedType: formData.embedType || 'link',
      };
      
      // 如果是iframe类型且没有提供embedUrl，则从embedCode中提取
      if (formData.embedType === 'iframe' && !formData.embedUrl && formData.embedCode) {
        processedData.embedUrl = extractUrlFromIframe(formData.embedCode);
      }
      
      const response = await apiClient.post('/api/forms', processedData);
      return response.data;
    } catch (error) {
      console.error('Failed to create form:', error);
      throw error;
    }
  },

  // Update an existing form
  updateForm: async (id, formData) => {
    try {
      // 确保所需字段存在，但不修改原始embedUrl
      const processedData = {
        ...formData,
        // 确保embedType存在
        embedType: formData.embedType || 'link',
      };
      
      // 如果是iframe类型且没有提供embedUrl，则从embedCode中提取
      if (formData.embedType === 'iframe' && !formData.embedUrl && formData.embedCode) {
        processedData.embedUrl = extractUrlFromIframe(formData.embedCode);
      }
      
      const response = await apiClient.put(`/api/forms/${id}`, processedData);
      return response.data;
    } catch (error) {
      console.error('Failed to update form:', error);
      throw error;
    }
  },

  // Delete a form
  deleteForm: async (id) => {
    try {
      await apiClient.delete(`/api/forms/${id}`);
      return { success: true };
    } catch (error) {
      console.error('Failed to delete form:', error);
      throw error;
    }
  },

  // Submit form data to Node-RED backend
  submitFormData: async (formId, formData) => {
    if (!formId) {
      const error = new Error('提交表单数据需要提供表单ID');
      logDebug('错误: 缺少表单ID', error);
      throw error;
    }

    if (!formData || typeof formData !== 'object') {
      const error = new Error('提交表单数据无效');
      logDebug('错误: 表单数据无效', error);
      throw error;
    }

    try {
      logDebug(`开始提交表单数据到后端，表单ID: ${formId}`);
      logDebug(`API请求URL: ${API_BASE_URL}/api/forms/${formId}/submit`);
      logDebug('表单数据:', JSON.stringify(formData, null, 2));
      
      const startTime = new Date();
      logDebug(`开始请求时间: ${startTime.toISOString()}`);
      
      // 添加超时和重试机制
      const response = await apiClient.post(`/api/forms/${formId}/submit`, formData, {
        timeout: 10000, // 10秒超时
        headers: {
          'Content-Type': 'application/json',
          'X-Request-ID': `form_submit_${Date.now()}`
        }
      });
      
      const endTime = new Date();
      const duration = endTime - startTime;
      logDebug(`请求完成时间: ${endTime.toISOString()}, 耗时: ${duration}ms`);
      
      // 记录响应详情
      logDebug('API响应状态:', response.status);
      logDebug('API响应头:', response.headers);
      logDebug('API响应数据:', response.data);
      
      // 存储最近提交的表单数据，方便验证
      try {
        sessionStorage.setItem(`lastSubmitted_${formId}`, JSON.stringify({
          timestamp: new Date().toISOString(),
          data: formData,
          response: response.data
        }));
        logDebug('表单提交数据已保存到会话存储');
      } catch (storageError) {
        logDebug('无法保存表单提交数据到会话存储:', storageError);
      }
      
      return response.data;
    } catch (error) {
      logDebug('提交表单数据失败:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        config: error.config,
        stack: error.stack
      });
      
      // 将错误信息存储在会话存储中以便调试
      try {
        sessionStorage.setItem(`lastSubmitError_${formId}`, JSON.stringify({
          timestamp: new Date().toISOString(),
          error: {
            message: error.message,
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data
          },
          formData: formData
        }));
      } catch (storageError) {
        logDebug('无法保存错误信息到会话存储:', storageError);
      }
      
      throw error;
    }
  },

  // Get form submission history
  getFormSubmissions: async (formId) => {
    try {
      const response = await apiClient.get(`/api/forms/${formId}/submissions`);
      return response.data;
    } catch (error) {
      console.error('Failed to get form submissions:', error);
      throw error;
    }
  },

  // 验证表单提交是否成功写入数据库
  verifyFormSubmission: async (formId) => {
    if (!formId) {
      logDebug('错误: 未提供表单ID，无法验证提交状态');
      return {
        success: false,
        message: '未提供表单ID',
        details: '验证失败：表单ID不能为空'
      };
    }
    
    // 从会话存储中获取最近提交的数据
    let lastSubmitted = null;
    try {
      const storedData = sessionStorage.getItem(`lastSubmitted_${formId}`);
      if (storedData) {
        lastSubmitted = JSON.parse(storedData);
        logDebug('从会话存储中检索到最近提交的数据:', lastSubmitted);
      }
    } catch (storageError) {
      logDebug('从会话存储中读取数据失败:', storageError);
    }
    
    try {
      logDebug(`正在验证表单提交状态，表单ID: ${formId}`);
      logDebug(`API请求URL: ${API_BASE_URL}/api/forms/${formId}/verify-submission`);
      
      const startTime = new Date();
      logDebug(`开始请求时间: ${startTime.toISOString()}`);
      
      // 添加超时和请求ID
      const response = await apiClient.get(`/api/forms/${formId}/verify-submission`, {
        timeout: 8000, // 8秒超时
        headers: {
          'X-Request-ID': `form_verify_${Date.now()}`
        }
      });
      
      const endTime = new Date();
      const duration = endTime - startTime;
      logDebug(`请求完成时间: ${endTime.toISOString()}, 耗时: ${duration}ms`);
      
      // 记录响应详情
      logDebug('API响应状态:', response.status);
      logDebug('API响应数据:', response.data);
      
      // 添加会话存储中的最近提交数据到响应中
      if (lastSubmitted) {
        response.data.lastSubmitted = lastSubmitted;
      }
      
      return response.data;
    } catch (error) {
      logDebug('验证表单提交失败:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        stack: error.stack
      });
      
      // 构建错误响应
      return {
        success: false,
        message: `验证表单提交失败: ${error.message}`,
        details: `错误详情: ${error.response?.data?.message || error.message}`,
        error: {
          status: error.response?.status,
          message: error.message
        },
        lastSubmitted: lastSubmitted
      };
    }
  },

  // 添加webhook处理相关方法
  getWebhookInfo: async (formId) => {
    try {
      const response = await apiClient.get(`/api/forms/${formId}/webhook-info`);
      return response.data;
    } catch (error) {
      console.error('Failed to get webhook info:', error);
      throw error;
    }
  },

  // 检查表单数据是否存在重复
  checkDuplicateSubmission: async (formId, submissionData) => {
    try {
      const response = await apiClient.post(`/api/forms/${formId}/check-duplicate`, submissionData);
      return response.data;
    } catch (error) {
      console.error('Failed to check duplicate submission:', error);
      throw error;
    }
  },
};

// 从iframe代码中提取URL
function extractUrlFromIframe(iframeCode) {
  if (!iframeCode) return '';
  
  const srcMatch = iframeCode.match(/src=["']([^"']+)["']/i);
  return srcMatch ? srcMatch[1] : '';
}