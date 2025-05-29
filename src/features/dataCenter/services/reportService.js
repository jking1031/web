import { message } from 'antd';
import { saveAs } from 'file-saver';
import dayjs from 'dayjs';
import apiManager from '../../../services/api/core/apiManager';

// 注册日报相关API
// 确保API管理器已初始化
apiManager.waitForReady().then(() => {
  // 注册获取日报列表API
  if (!apiManager.registry.get('getReports')) {
    apiManager.registry.register('getReports', {
      name: '获取日报列表',
      url: '/api/reports',
      method: 'GET',
      category: 'data',
      status: 'enabled',
      description: '获取日报列表数据',
      timeout: 30000,
      retries: 1,
      cacheTime: 60000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  // 注册获取日报详情API
  if (!apiManager.registry.get('getReportDetail')) {
    apiManager.registry.register('getReportDetail', {
      name: '获取日报详情',
      url: '/api/reports/{reportId}',
      method: 'GET',
      category: 'data',
      status: 'enabled',
      description: '获取日报详细信息',
      timeout: 30000,
      retries: 1,
      cacheTime: 60000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  // 注册下载日报PDF API
  if (!apiManager.registry.get('downloadReportPDF')) {
    apiManager.registry.register('downloadReportPDF', {
      name: '下载日报PDF',
      url: '/api/reports/{reportId}/pdf',
      method: 'GET',
      category: 'data',
      status: 'enabled',
      description: '下载日报PDF文件',
      timeout: 30000,
      retries: 1,
      cacheTime: 0,
      headers: {
        'Content-Type': 'application/json'
      },
      responseType: 'blob'
    });
  }

  // 注册获取报告类型列表API
  if (!apiManager.registry.get('getReportTypes')) {
    apiManager.registry.register('getReportTypes', {
      name: '获取报告类型列表',
      url: '/api/report-types',
      method: 'GET',
      category: 'data',
      status: 'enabled',
      description: '获取所有报告类型',
      timeout: 30000,
      retries: 1,
      cacheTime: 300000, // 5分钟缓存
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
});

/**
 * 获取日报列表
 * 
 * @param {Object} params 查询参数
 * @param {string} params.reportType 报告类型
 * @param {string} params.startDate 开始日期 YYYY-MM-DD
 * @param {string} params.endDate 结束日期 YYYY-MM-DD
 * @returns {Promise<Array>} 日报数据列表
 */
export const getReports = async (params) => {
  try {
    const response = await apiManager.call('getReports', { params });
    return response.data || [];
  } catch (error) {
    console.error('获取日报列表失败', error);
    throw error;
  }
};

/**
 * 获取日报详情
 * 
 * @param {string|number} reportId 报告ID
 * @returns {Promise<Object>} 日报详情
 */
export const getReportDetail = async (reportId) => {
  try {
    const response = await apiManager.call('getReportDetail', { reportId });
    return response.data || null;
  } catch (error) {
    console.error('获取日报详情失败', error);
    throw error;
  }
};

/**
 * 下载日报PDF
 * 
 * @param {Object} report 报告对象
 * @returns {Promise<void>}
 */
export const downloadReportPDF = async (report) => {
  try {
    const reportId = report.id || report.report_id;
    // 获取PDF文件
    const response = await apiManager.call('downloadReportPDF', 
      { reportId }, 
      { responseType: 'blob' }
    );
    
    // 格式化报告日期
    const reportDate = dayjs(report.date).format('YYYY-MM-DD');
    const reportType = report.reportType || '高铁厂运行日报';
    
    // 使用file-saver保存文件
    saveAs(new Blob([response], { type: 'application/pdf' }), `${reportType}_${reportDate}.pdf`);
    
    return true;
  } catch (error) {
    console.error('下载PDF失败', error);
    throw error;
  }
};

/**
 * 获取报告类型列表
 * 
 * @returns {Promise<Array>} 报告类型列表
 */
export const getReportTypes = async () => {
  try {
    const response = await apiManager.call('getReportTypes');
    return response.data || [];
  } catch (error) {
    console.error('获取报告类型列表失败', error);
    throw error;
  }
};

export default {
  getReports,
  getReportDetail,
  downloadReportPDF,
  getReportTypes,
}; 