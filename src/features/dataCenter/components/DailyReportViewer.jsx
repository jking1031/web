import React, { useState, useRef } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Typography, 
  Descriptions, 
  Button, 
  Space, 
  Divider, 
  Image, 
  Tag, 
  Spin, 
  Empty,
  Alert,
  message,
  Tooltip
} from 'antd';
import { 
  DownloadOutlined, 
  PrinterOutlined, 
  FilePdfOutlined,
  LeftOutlined,
  RightOutlined,
  EyeOutlined,
  CameraOutlined,
  DownloadOutlined as DownloadIcon
} from '@ant-design/icons';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import './DailyReportViewer.scss';

const { Title, Text, Paragraph } = Typography;

/**
 * 日报查看器组件
 * 
 * @param {Object} props
 * @param {Object} props.report - 日报数据
 * @param {Function} props.onDownload - 下载PDF的回调函数
 * @param {Boolean} props.loading - 是否正在加载数据
 * @param {Function} props.onBack - 返回列表的回调函数
 */
const DailyReportViewer = ({ report, onDownload, loading, onBack }) => {
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [currentImage, setCurrentImage] = useState('');
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const reportRef = useRef(null);

  // 如果正在加载或没有报告数据，显示加载状态
  if (loading) {
    return (
      <div className="daily-report-loading">
        <div style={{ textAlign: 'center' }}>
          <Spin size="large" />
          <div style={{ marginTop: 16 }}>加载中...</div>
        </div>
      </div>
    );
  }

  // 如果没有报告数据，显示空状态
  if (!report) {
    return (
      <div className="daily-report-empty">
        <Empty
          description="暂无日报数据"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        >
          <Button type="primary" onClick={onBack}>返回列表</Button>
        </Empty>
      </div>
    );
  }

  // 处理打印功能
  const handlePrint = () => {
    window.print();
  };

  // 处理查看图片
  const handleViewImage = (url) => {
    setCurrentImage(url);
    setImageViewerVisible(true);
  };

  // 处理下载图片
  const handleDownloadImage = async (url) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `日报图片_${new Date().getTime()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      message.success('图片下载成功');
    } catch (error) {
      console.error('下载图片失败:', error);
      message.error('下载图片失败，请稍后重试');
    }
  };

  // 解析图片URLs - 改进版本
  const getImageUrls = () => {
    try {
      if (!report.imagesurl) return [];
      
      if (Array.isArray(report.imagesurl)) {
        return report.imagesurl;
      }
      
      const urlString = report.imagesurl;
      
      if (urlString.trim().startsWith('[')) {
        try {
          return JSON.parse(urlString);
        } catch (e) {
          console.warn('URL看起来像JSON但解析失败，尝试作为单个URL处理');
        }
      }
      
      if (urlString.includes(',')) {
        return urlString.split(',').map(url => url.trim());
      }
      
      return [urlString];
    } catch (e) {
      console.error('解析图片URL失败', e);
      return [];
    }
  };

  // 获取报告标题
  const getReportTitle = () => {
    return report.reportType || '高铁污水厂运行报告';
  };

  // 格式化日期
  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('zh-CN', { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit'
      });
    } catch (e) {
      return dateStr;
    }
  };

  // 前端生成PDF
  const generatePDF = async () => {
    if (!reportRef.current) return;
    
    try {
      setPdfGenerating(true);
      
      const actionButtons = reportRef.current.querySelector('.report-actions');
      const originalDisplay = actionButtons ? actionButtons.style.display : 'flex';
      if (actionButtons) {
        actionButtons.style.display = 'none';
      }
      
      const canvas = await html2canvas(reportRef.current, {
        scale: 3,
        useCORS: true,
        logging: false,
        allowTaint: true,
        onclone: (document) => {
          const clonedContent = document.querySelector('.print-container');
          if (clonedContent) {
            clonedContent.style.padding = '20px';
            clonedContent.style.width = '100%';
          }
        }
      });
      
      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      let position = 0;
      
      pdf.addImage(canvas, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(canvas, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      const reportDate = report.date ? new Date(report.date).toISOString().split('T')[0] : 'unknown-date';
      const fileName = `日报_${getReportTitle()}_${reportDate}.pdf`;
      pdf.save(fileName);
      
      if (actionButtons) {
        actionButtons.style.display = originalDisplay;
      }
      
      message.success('PDF生成成功');
    } catch (error) {
      console.error('生成PDF失败:', error);
      message.error('生成PDF失败，请稍后重试');
    } finally {
      setPdfGenerating(false);
    }
  };

  // 图片列表
  const images = getImageUrls();

  return (
    <div className="daily-report-viewer print-container" ref={reportRef}>
      <div className="report-actions">
        <Button 
          type="primary" 
          icon={<LeftOutlined />} 
          onClick={onBack}
        >
          返回列表
        </Button>
        <Space>
          <Button 
            icon={<PrinterOutlined />} 
            onClick={handlePrint}
          >
            打印报告
          </Button>
          <Button 
            icon={<FilePdfOutlined />} 
            type="primary" 
            onClick={generatePDF}
            loading={pdfGenerating}
          >
            生成PDF
          </Button>
        </Space>
      </div>

      <Card className="report-card">
        <div className="report-header">
          <Title level={2} className="report-title">{getReportTitle()}</Title>
          <Divider className="report-divider" />
          <Space size="middle">
            <Tag color="blue" className="report-date-tag">报告日期: {formatDate(report.date)}</Tag>
            {report.operator && <Tag color="green" className="report-operator-tag">操作员: {report.operator}</Tag>}
          </Space>
        </div>

        <Row gutter={[24, 24]}>
          <Col xs={24} lg={12}>
            <div className="report-section">
              <Title level={4} className="section-title">
                <span className="section-icon">💧</span> 进出水情况
              </Title>
              <Descriptions 
                bordered 
                column={1}
                className="report-descriptions"
                size="middle"
              >
                <Descriptions.Item label="进水流量">{report.inflow || '-'} m³</Descriptions.Item>
                <Descriptions.Item label="出水流量">{report.outflow || '-'} m³</Descriptions.Item>
                <Descriptions.Item label="进水水质情况">{report.in_quality || '-'}</Descriptions.Item>
                <Descriptions.Item label="出水水质情况">{report.out_quality || '-'}</Descriptions.Item>
                <Descriptions.Item label="水质异常">
                  {report.water_quality_anomalies || '无'}
                </Descriptions.Item>
              </Descriptions>
            </div>
          </Col>

          <Col xs={24} lg={12}>
            <div className="report-section">
              <Title level={4} className="section-title">
                <span className="section-icon">⚙️</span> 设备运行情况
              </Title>
              <Descriptions 
                bordered 
                column={1}
                className="report-descriptions"
                size="middle"
              >
                <Descriptions.Item label="设备状态">{report.equipment_status || '-'}</Descriptions.Item>
                <Descriptions.Item label="设备故障">
                  {report.equipment_issues || '无'}
                </Descriptions.Item>
              </Descriptions>
            </div>
          </Col>

          <Col xs={24} lg={12}>
            <div className="report-section">
              <Title level={4} className="section-title">
                <span className="section-icon">🧪</span> 药剂投加情况
              </Title>
              <Descriptions 
                bordered 
                column={1}
                className="report-descriptions"
                size="middle"
              >
                <Descriptions.Item label="碳源投加量">{report.carbon_source || '-'} L</Descriptions.Item>
                <Descriptions.Item label="除磷剂投加量">{report.phosphorus_removal || '-'} L</Descriptions.Item>
                <Descriptions.Item label="消毒剂投加量">{report.disinfectant || '-'} L</Descriptions.Item>
                <Descriptions.Item label="药剂效果">{report.chemical_effect || '-'}</Descriptions.Item>
              </Descriptions>
            </div>
          </Col>

          <Col xs={24} lg={12}>
            <div className="report-section">
              <Title level={4} className="section-title">
                <span className="section-icon">🏭</span> 污泥处理
              </Title>
              <Descriptions 
                bordered 
                column={1}
                className="report-descriptions"
                size="middle"
              >
                <Descriptions.Item label="产泥量">{report.sludge_quantity || '-'} 吨</Descriptions.Item>
              </Descriptions>
            </div>
          </Col>
        </Row>

        {report.other_notes && (
          <div className="report-section">
            <Title level={4} className="section-title">
              <span className="section-icon">📝</span> 巡查工作
            </Title>
            <div className="report-notes">
              <Card className="notes-card">
                <Paragraph>{report.other_notes}</Paragraph>
              </Card>
            </div>
          </div>
        )}
        
        {/* 图片部分 */}
        {images.length > 0 && (
          <div className="report-section">
            <Title level={4} className="section-title">
              <span className="section-icon">📷</span> 相关图片
            </Title>
            <div className="report-images">
              <Row gutter={[16, 16]}>
                {images.map((img, index) => (
                  <Col xs={24} sm={12} md={8} lg={6} key={index}>
                    <Card 
                      hoverable 
                      className="image-card"
                      bodyStyle={{ padding: '8px' }}
                      cover={
                        <div className="image-container">
                          <div style={{ width: '100%', height: '300px', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
                            <Image
                              src={img}
                              alt={`现场图片 ${index + 1}`}
                              className="report-image"
                              preview={false}
                              loading="lazy"
                              placeholder={<div style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#f0f2f5' }}><Spin /></div>}
                              fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADDCAYAAADQvc6UAAABRWlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGASSSwoyGFhYGDIzSspCnJ3UoiIjFJgf8LAwSDCIMogwMCcmFxc4BgQ4ANUwgCjUcG3awyMIPqyLsis7PPOq3QdDFcvjV3jOD1boQVTPQrgSkktTgbSf4A4LbmgqISBgTEFyFYuLykAsTuAbJEioKOA7DkgdjqEvQHEToKwj4DVhAQ5A9k3gGyB5IxEoBmML4BsnSQk8XQkNtReEOBxcfXxUQg1Mjc0dyHgXNJBSWpFCYh2zi+oLMpMzyhRcASGUqqCZ16yno6CkYGRAQMDKMwhqj/fAIcloxgHQqxAjIHBEugw5sUIsSQpBobtQPdLciLEVJYzMPBHMDBsayhILEqEO4DxG0txmrERhM29nYGBddr//5/DGRjYNRkY/l7////39v///y4Dmn+LgeHANwDrkl1AuO+pmgAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAwqADAAQAAAABAAAAwwAAAAD9b/HnAAAHlklEQVR4Ae3dP3PTWBSGcbGzM6GCKqlIBRV0dHRJFarQ0eUT8LH4BnRU0NHR0UEFVdIlFRV7TzRksomPY8uykTk/zewQfKw/9znv4yvJynLv4uLiV2dBoDiBf4qP3/ARuCRABEFAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghgg"
                              style={{ objectFit: 'contain', width: '280px', height: '280px', display: 'block' }}
                            />
                          </div>
                          <div className="image-overlay">
                            <Space>
                              <Tooltip title="查看大图">
                                <Button 
                                  type="primary" 
                                  shape="circle" 
                                  icon={<EyeOutlined />} 
                                  onClick={() => handleViewImage(img)}
                                />
                              </Tooltip>
                              <Tooltip title="下载图片">
                                <Button 
                                  type="primary" 
                                  shape="circle" 
                                  icon={<DownloadIcon />} 
                                  onClick={() => handleDownloadImage(img)}
                                />
                              </Tooltip>
                            </Space>
                          </div>
                        </div>
                      }
                    >
                      <div className="image-title">图片 {index + 1}</div>
                    </Card>
                  </Col>
                ))}
              </Row>
            </div>
          </div>
        )}
      </Card>

      {/* 图片查看器 */}
      <div style={{ display: 'none' }}>
        <Image.PreviewGroup
          preview={{
            visible: imageViewerVisible,
            onVisibleChange: (vis) => setImageViewerVisible(vis),
            current: images.indexOf(currentImage),
            countRender: (current, total) => `${current} / ${total}`,
            toolbarRender: (_, { current, total }) => (
              <div className="custom-image-preview-toolbar">
                <Space>
                  <Button 
                    type="primary" 
                    shape="circle" 
                    icon={<LeftOutlined />} 
                    onClick={() => {
                      const newIndex = (current - 1 + total) % total;
                      setCurrentImage(images[newIndex]);
                    }}
                  />
                  <span>{current + 1} / {total}</span>
                  <Button 
                    type="primary" 
                    shape="circle" 
                    icon={<RightOutlined />} 
                    onClick={() => {
                      const newIndex = (current + 1) % total;
                      setCurrentImage(images[newIndex]);
                    }}
                  />
                </Space>
                <Button
                  type="primary"
                  icon={<DownloadIcon />}
                  onClick={() => handleDownloadImage(images[current])}
                >
                  下载图片
                </Button>
              </div>
            ),
          }}
        >
          {images.map((img, index) => (
            <Image key={index} src={img} />
          ))}
        </Image.PreviewGroup>
      </div>
    </div>
  );
};

export default DailyReportViewer;