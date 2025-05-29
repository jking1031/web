import React, { useState, useEffect } from 'react';
import { Spin, message, Typography, Layout, Button } from 'antd';
import DailyReportQuery from '../components/DailyReportQuery';
import DailyReportList from '../components/DailyReportList';
import DailyReportViewer from '../components/DailyReportViewer';
import { getReports, downloadReportPDF } from '../services/reportService';
import './DailyReportPage.scss';

const { Title } = Typography;
const { Content } = Layout;

/**
 * 日报查询页面
 */
const DailyReportPage = () => {
  const [loading, setLoading] = useState(false);
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [queryParams, setQueryParams] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // list 或 detail

  // 处理查询
  const handleSearch = async (params) => {
    try {
      setLoading(true);
      setQueryParams(params);
      setViewMode('list');
      setSelectedReport(null);
      
      const data = await getReports(params);
      setReports(data);
      
      if (data.length === 0) {
        message.info('未找到符合条件的日报数据');
      } else {
        message.success(`查询成功，共找到 ${data.length} 条日报数据`);
      }
    } catch (error) {
      console.error('查询日报失败', error);
      message.error('查询日报失败，请稍后重试');
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  // 查看日报详情
  const handleViewReport = (report) => {
    setSelectedReport(report);
    setViewMode('detail');
    window.scrollTo(0, 0);
  };

  // 返回列表
  const handleBackToList = () => {
    setViewMode('list');
    setSelectedReport(null);
  };

  // 下载日报PDF
  const handleDownloadReport = async (report) => {
    try {
      setLoading(true);
      await downloadReportPDF(report);
      message.success('PDF下载成功');
    } catch (error) {
      console.error('下载PDF失败', error);
      message.error('下载PDF失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="daily-report-page">
      <Content className="report-content">
        {/* 查询表单始终显示 */}
        <DailyReportQuery 
          onSearch={handleSearch} 
          loading={loading} 
        />
        
        {/* 根据视图模式显示列表或详情 */}
        {viewMode === 'list' ? (
          <DailyReportList 
            reports={reports} 
            onViewReport={handleViewReport}
            onDownloadReport={handleDownloadReport}
            loading={loading}
            reportType={queryParams?.reportType}
          />
        ) : (
          <DailyReportViewer
            report={selectedReport}
            onDownload={handleDownloadReport}
            loading={loading}
            onBack={handleBackToList}
          />
        )}
      </Content>
    </div>
  );
};

export default DailyReportPage; 