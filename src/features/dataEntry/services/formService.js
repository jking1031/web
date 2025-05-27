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
    try {
      const response = await apiClient.post(`/api/forms/${formId}/submit`, formData);
      return response.data;
    } catch (error) {
      console.error('Failed to submit form data:', error);
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
      console.error('未提供表单ID，无法验证提交状态');
      return {
        success: false,
        message: '未提供表单ID',
        details: '验证失败：表单ID不能为空'
      };
    }
    
    console.log(`正在验证表单提交状态，表单ID: ${formId}`);
    console.log(`API请求URL: ${API_BASE_URL}/api/forms/${formId}/verify-submission`);
    
    try {
      // 记录请求开始时间
      const startTime = new Date();
      console.log(`开始请求时间: ${startTime.toISOString()}`);
      
      const response = await apiClient.get(`/api/forms/${formId}/verify-submission`);
      
      // 记录请求结束时间和耗时
      const endTime = new Date();
      const duration = endTime - startTime;
      console.log(`请求完成时间: ${endTime.toISOString()}, 耗时: ${duration}ms`);
      
      // 记录响应数据
      console.log('API响应状态:', response.status);
      console.log('API响应数据:', response.data);
      
      return response.data;
    } catch (error) {
      console.error('验证表单提交失败:', error);
      
      // 详细记录错误信息
      if (error.response) {
        // 服务器响应了，但状态码不在2xx范围内
        console.error('错误状态码:', error.response.status);
        console.error('错误响应数据:', error.response.data);
        console.error('错误响应头:', error.response.headers);
        
        return {
          success: false,
          message: `服务器返回错误: ${error.response.status}`,
          details: `错误详情: ${JSON.stringify(error.response.data)}`,
          errorResponse: error.response.data
        };
      } else if (error.request) {
        // 请求已发送但没有收到响应
        console.error('没有收到响应:', error.request);
        
        return {
          success: false,
          message: '服务器无响应',
          details: '请求已发送，但未收到服务器响应，请检查网络连接或服务器状态',
          errorType: 'no_response'
        };
      } else {
        // 请求配置有问题
        console.error('请求错误:', error.message);
        
        return {
          success: false,
          message: '请求配置错误',
          details: `错误信息: ${error.message}`,
          errorType: 'request_setup'
        };
      }
    }
  },
};

// 从iframe代码中提取URL
function extractUrlFromIframe(iframeCode) {
  if (!iframeCode) return '';
  
  const srcMatch = iframeCode.match(/src=["']([^"']+)["']/i);
  return srcMatch ? srcMatch[1] : '';
} 