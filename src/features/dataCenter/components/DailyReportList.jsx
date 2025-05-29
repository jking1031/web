import React, { useState, useEffect } from 'react';
import { 
  Table, 
  Space, 
  Button, 
  Tag, 
  Tooltip, 
  Typography,
  message,
  Modal,
  Empty
} from 'antd';
import { 
  FileTextOutlined, 
  DownloadOutlined, 
  EyeOutlined, 
  FileSearchOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import { getReportTypes } from '../services/reportService';
import './DailyReportList.scss';

const { Text, Title } = Typography;

/**
 * 日报列表组件
 * 
 * @param {Object} props
 * @param {Array} props.reports - 日报数据列表
 * @param {Function} props.onViewReport - 查看日报详情的回调函数
 * @param {Function} props.onDownloadReport - 下载日报的回调函数
 * @param {Boolean} props.loading - 是否正在加载数据
 * @param {String} props.reportType - 报告类型
 */
const DailyReportList = ({ reports, onViewReport, onDownloadReport, loading, reportType }) => {
  const [reportTypes, setReportTypes] = useState([]);
  const [reportTypesLoading, setReportTypesLoading] = useState(false);

  // 获取报告类型列表
  useEffect(() => {
    const fetchReportTypes = async () => {
      try {
        setReportTypesLoading(true);
        const types = await getReportTypes();
        setReportTypes(types);
      } catch (error) {
        message.error('获取报告类型失败');
        console.error('获取报告类型失败:', error);
      } finally {
        setReportTypesLoading(false);
      }
    };

    fetchReportTypes();
  }, []);

  // 获取报告类型标签颜色
  const getReportTypeColor = (type) => {
    const foundType = reportTypes.find(t => t.name === type);
    return foundType?.color || 'default';
  };

  // 格式化日期显示
  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('zh-CN', { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit',
        weekday: 'short'
      });
    } catch (e) {
      return dateStr;
    }
  };

  // 表格列定义
  const columns = [
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date',
      render: (text) => (
        <Space>
          <ClockCircleOutlined />
          <span>{formatDate(text)}</span>
        </Space>
      ),
      sorter: (a, b) => new Date(a.date) - new Date(b.date),
      defaultSortOrder: 'descend',
    },
    {
      title: '报告类型',
      dataIndex: 'reportType',
      key: 'reportType',
      render: (text) => (
        <Tag color={getReportTypeColor(text)} style={{ minWidth: '90px', textAlign: 'center' }}>
          {text || reportType}
        </Tag>
      ),
      filters: reportTypes.map(type => ({
        text: type.name,
        value: type.name
      })),
      onFilter: (value, record) => (record.reportType || reportType) === value,
    },
    {
      title: '操作员',
      dataIndex: 'operator',
      key: 'operator',
    },
    {
      title: '进水流量',
      dataIndex: 'inflow',
      key: 'inflow',
      render: (text) => `${text} m³`,
      sorter: (a, b) => a.inflow - b.inflow,
    },
    {
      title: '出水流量',
      dataIndex: 'outflow',
      key: 'outflow',
      render: (text) => `${text} m³`,
      sorter: (a, b) => a.outflow - b.outflow,
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Tooltip title="查看详情">
            <Button 
              type="primary" 
              shape="circle" 
              icon={<EyeOutlined />} 
              onClick={() => onViewReport(record)}
            />
          </Tooltip>
          <Tooltip title="下载PDF">
            <Button 
              shape="circle" 
              icon={<DownloadOutlined />} 
              onClick={() => onDownloadReport(record)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  // 如果没有数据，显示空状态
  if (!reports || reports.length === 0) {
    return (
      <div className="daily-report-empty">
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <span>
              暂无日报数据
              {loading ? '，正在加载...' : '，请调整查询条件重试'}
            </span>
          }
        />
      </div>
    );
  }

  return (
    <div className="daily-report-list">
      <div className="report-header">
        <Title level={4}>
          <FileTextOutlined /> 日报查询结果
          <Tag 
            color="blue" 
            style={{ marginLeft: 8 }}
          >
            共 {reports.length} 条
          </Tag>
        </Title>
      </div>
      
      <Table 
        columns={columns} 
        dataSource={reports.map(report => ({ ...report, key: report.id || report.report_id }))}
        loading={loading}
        pagination={{ 
          pageSize: 10,
          showTotal: (total) => `共 ${total} 条数据`,
          showSizeChanger: true,
          pageSizeOptions: ['10', '20', '50'],
        }}
        bordered
        className="report-table"
        rowClassName="report-row"
        size="middle"
      />
    </div>
  );
};

export default DailyReportList; 