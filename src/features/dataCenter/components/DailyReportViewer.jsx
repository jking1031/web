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
  message
} from 'antd';
import { 
  DownloadOutlined, 
  PrinterOutlined, 
  FilePdfOutlined,
  LeftOutlined,
  RightOutlined,
  EyeOutlined,
  CameraOutlined
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

  // 解析图片URLs - 改进版本
  const getImageUrls = () => {
    try {
      // 如果没有图片链接，返回空数组
      if (!report.imagesurl) return [];
      
      // 如果已经是数组，直接返回
      if (Array.isArray(report.imagesurl)) {
        return report.imagesurl;
      }
      
      // 处理字符串情况
      const urlString = report.imagesurl;
      
      // 检查是否看起来像JSON数组字符串 (以 [ 开头)
      if (urlString.trim().startsWith('[')) {
        try {
          return JSON.parse(urlString);
        } catch (e) {
          console.warn('URL看起来像JSON但解析失败，尝试作为单个URL处理');
        }
      }
      
      // 如果是逗号分隔的字符串，拆分为数组
      if (urlString.includes(',')) {
        return urlString.split(',').map(url => url.trim());
      }
      
      // 否则作为单个URL处理
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
      
      // 确保隐藏操作按钮
      const actionButtons = reportRef.current.querySelector('.report-actions');
      const originalDisplay = actionButtons ? actionButtons.style.display : 'flex';
      if (actionButtons) {
        actionButtons.style.display = 'none';
      }
      
      // 捕获HTML内容为画布
      const canvas = await html2canvas(reportRef.current, {
        scale: 2, // 更高的缩放以获得更好的质量
        useCORS: true, // 允许加载跨域图片
        logging: false,
        onclone: (document) => {
          // 可以在这里对克隆的DOM进行额外修改
          const clonedContent = document.querySelector('.print-container');
          if (clonedContent) {
            clonedContent.style.padding = '20px';
            clonedContent.style.width = '100%';
          }
        }
      });
      
      // 计算PDF尺寸
      const imgWidth = 210; // A4宽度，单位毫米
      const pageHeight = 297; // A4高度，单位毫米
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      
      // 创建PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      let position = 0;
      
      // 添加第一页
      pdf.addImage(canvas, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      // 如果内容超过一页，添加更多页
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(canvas, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      // 下载PDF
      const reportDate = report.date ? new Date(report.date).toISOString().split('T')[0] : 'unknown-date';
      const fileName = `日报_${getReportTitle()}_${reportDate}.pdf`;
      pdf.save(fileName);
      
      // 恢复操作按钮显示
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
          <Tag color="blue" className="report-date-tag">报告日期: {formatDate(report.date)}</Tag>
          {report.operator && <Tag color="green" className="report-operator-tag">操作员: {report.operator}</Tag>}
        </div>

        <div className="report-section">
          <Title level={4} className="section-title">
            <span className="section-icon">💧</span> 进出水情况
          </Title>
          <Descriptions 
            bordered 
            column={{ xxl: 4, xl: 3, lg: 3, md: 2, sm: 1, xs: 1 }}
            className="report-descriptions"
            size="middle"
          >
            <Descriptions.Item label="进水流量">{report.inflow || '-'} m³</Descriptions.Item>
            <Descriptions.Item label="出水流量">{report.outflow || '-'} m³</Descriptions.Item>
            <Descriptions.Item label="进水水质情况" span={2}>{report.in_quality || '-'}</Descriptions.Item>
            <Descriptions.Item label="出水水质情况" span={2}>{report.out_quality || '-'}</Descriptions.Item>
            <Descriptions.Item label="水质异常" span={2}>
              {report.water_quality_anomalies || '无'}
            </Descriptions.Item>
          </Descriptions>
        </div>

        <div className="report-section">
          <Title level={4} className="section-title">
            <span className="section-icon">⚙️</span> 设备运行情况
          </Title>
          <Descriptions 
            bordered 
            column={{ xxl: 4, xl: 3, lg: 3, md: 2, sm: 1, xs: 1 }}
            className="report-descriptions"
            size="middle"
          >
            <Descriptions.Item label="设备状态" span={2}>{report.equipment_status || '-'}</Descriptions.Item>
            <Descriptions.Item label="设备故障" span={2}>
              {report.equipment_issues || '无'}
            </Descriptions.Item>
          </Descriptions>
        </div>

        <div className="report-section">
          <Title level={4} className="section-title">
            <span className="section-icon">🧪</span> 药剂投加情况
          </Title>
          <Descriptions 
            bordered 
            column={{ xxl: 4, xl: 3, lg: 3, md: 2, sm: 1, xs: 1 }}
            className="report-descriptions"
            size="middle"
          >
            <Descriptions.Item label="碳源投加量">{report.carbon_source || '-'} L</Descriptions.Item>
            <Descriptions.Item label="除磷剂投加量">{report.phosphorus_removal || '-'} L</Descriptions.Item>
            <Descriptions.Item label="消毒剂投加量">{report.disinfectant || '-'} L</Descriptions.Item>
            <Descriptions.Item label="药剂效果">{report.chemical_effect || '-'}</Descriptions.Item>
          </Descriptions>
        </div>

        <div className="report-section">
          <Title level={4} className="section-title">
            <span className="section-icon">🏭</span> 污泥处理
          </Title>
          <Descriptions 
            bordered 
            column={{ xxl: 4, xl: 3, lg: 3, md: 2, sm: 1, xs: 1 }}
            className="report-descriptions"
            size="middle"
          >
            <Descriptions.Item label="产泥量">{report.sludge_quantity || '-'} 吨</Descriptions.Item>
          </Descriptions>
        </div>

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
                      cover={
                        <div className="image-container">
                          <Image
                            src={img}
                            alt={`现场图片 ${index + 1}`}
                            className="report-image"
                            preview={false}
                            fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADDCAYAAADQvc6UAAABRWlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGASSSwoyGFhYGDIzSspCnJ3UoiIjFJgf8LAwSDCIMogwMCcmFxc4BgQ4ANUwgCjUcG3awyMIPqyLsis7PPOq3QdDFcvjV3jOD1boQVTPQrgSkktTgbSf4A4LbmgqISBgTEFyFYuLykAsTuAbJEioKOA7DkgdjqEvQHEToKwj4DVhAQ5A9k3gGyB5IxEoBmML4BsnSQk8XQkNtReEOBxcfXxUQg1Mjc0dyHgXNJBSWpFCYh2zi+oLMpMzyhRcASGUqqCZ16yno6CkYGRAQMDKMwhqj/fAIcloxgHQqxAjIHBEugw5sUIsSQpBobtQPdLciLEVJYzMPBHMDBsayhILEqEO4DxG0txmrERhM29nYGBddr//5/DGRjYNRkY/l7////39v///y4Dmn+LgeHANwDrkl1AuO+pmgAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAwqADAAQAAAABAAAAwwAAAAD9b/HnAAAHlklEQVR4Ae3dP3PTWBSGcbGzM6GCKqlIBRV0dHRJFarQ0eUT8LH4BnRU0NHR0UEFVdIlFRV7TzRksomPY8uykTk/zewQfKw/9znv4yvJynLv4uLiV2dBoDiBf4qP3/ARuCRABEFAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghgg"
                          />
                          <div 
                            className="image-overlay" 
                            onClick={() => handleViewImage(img)}
                          >
                            <div className="overlay-content">
                              <Button 
                                type="primary" 
                                shape="circle" 
                                icon={<EyeOutlined />} 
                              />
                            </div>
                          </div>
                        </div>
                      }
                    >
                      <Card.Meta title={`图片 ${index + 1}`} />
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