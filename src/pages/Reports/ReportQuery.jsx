import React, { useState, useEffect } from 'react';
import { Card, Table, Button, DatePicker, Select, Input, Space, Row, Col, message, Typography, Tabs, Modal, Descriptions, Tag, Divider } from 'antd';
import { SearchOutlined, FileExcelOutlined, FilePdfOutlined, EyeOutlined, DownloadOutlined } from '@ant-design/icons';
import apiService from '../../services/apiService';
import dayjs from 'dayjs';
import styles from './Reports.module.scss';

const { RangePicker } = DatePicker;
const { Option } = Select;
const { Title, Text } = Typography;
const { TabPane } = Tabs;

/**
 * 报告查询组件
 * @returns {JSX.Element} 报告查询页面
 */
const ReportQuery = () => {
  const [loading, setLoading] = useState(false);
  const [reports5000, setReports5000] = useState([]);
  const [reportsSludge, setReportsSludge] = useState([]);
  const [reportsPump, setReportsPump] = useState([]);
  const [dateRange, setDateRange] = useState([dayjs().subtract(30, 'days'), dayjs()]);
  const [searchText, setSearchText] = useState('');
  const [activeTab, setActiveTab] = useState('5000');
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [currentReport, setCurrentReport] = useState(null);
  const [pumpStations, setPumpStations] = useState([]);
  const [selectedPumpStation, setSelectedPumpStation] = useState(null);

  // 加载泵站列表
  useEffect(() => {
    const fetchPumpStations = async () => {
      try {
        // 通过API管理器调用获取泵站列表API
        const response = await apiService.callApi('getPumpStations');
        
        if (response && response.success) {
          setPumpStations(response.data || []);
        } else {
          throw new Error(response?.message || '获取泵站列表失败');
        }
      } catch (error) {
        console.error('获取泵站列表失败:', error);
        message.error('获取泵站列表失败: ' + (error.message || '未知错误'));
        // 使用模拟数据
        setPumpStations([
          { id: 1, name: '第一泵站' },
          { id: 2, name: '第二泵站' },
          { id: 3, name: '第三泵站' },
          { id: 4, name: '第四泵站' },
        ]);
      }
    };
    
    fetchPumpStations();
  }, []);

  // 加载报告数据
  useEffect(() => {
    fetchReports();
  }, [dateRange, activeTab, selectedPumpStation]);

  // 获取报告数据
  const fetchReports = async () => {
    if (!dateRange || dateRange.length !== 2) return;
    
    setLoading(true);
    try {
      const startDate = dateRange[0].format('YYYY-MM-DD');
      const endDate = dateRange[1].format('YYYY-MM-DD');
      
      let apiKey = '';
      let params = { start_date: startDate, end_date: endDate };
      
      if (activeTab === '5000') {
        apiKey = 'getReports5000';
      } else if (activeTab === 'sludge') {
        apiKey = 'getReportsSludge';
      } else if (activeTab === 'pump') {
        apiKey = 'getReportsPump';
        if (selectedPumpStation) {
          params.pump_station_id = selectedPumpStation;
        }
      }
      
      // 通过API管理器调用获取报告数据API
      const response = await apiService.callApi(apiKey, params);
      
      if (response && response.success) {
        if (activeTab === '5000') {
          setReports5000(response.data || []);
        } else if (activeTab === 'sludge') {
          setReportsSludge(response.data || []);
        } else if (activeTab === 'pump') {
          setReportsPump(response.data || []);
        }
      } else {
        throw new Error(response?.message || '获取报告数据失败');
      }
    } catch (error) {
      console.error('获取报告数据失败:', error);
      message.error('获取报告数据失败: ' + (error.message || '未知错误'));
    } finally {
      setLoading(false);
    }
  };

  // 处理日期范围变化
  const handleDateRangeChange = (dates) => {
    setDateRange(dates);
  };

  // 处理搜索文本变化
  const handleSearchChange = (e) => {
    setSearchText(e.target.value);
  };

  // 处理泵站选择变化
  const handlePumpStationChange = (value) => {
    setSelectedPumpStation(value);
  };

  // 处理标签页切换
  const handleTabChange = (key) => {
    setActiveTab(key);
  };

  // 查看报告详情
  const viewReportDetail = (record) => {
    setCurrentReport(record);
    setDetailModalVisible(true);
  };

  // 导出为Excel
  const exportToExcel = () => {
    message.info('Excel导出功能正在开发中');
  };

  // 导出为PDF
  const exportToPDF = () => {
    message.info('PDF导出功能正在开发中');
  };

  // 5000吨处理厂日报表列
  const columns5000 = [
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date',
      sorter: (a, b) => dayjs(a.date).unix() - dayjs(b.date).unix(),
    },
    {
      title: '值班员',
      dataIndex: 'operator',
      key: 'operator',
      filteredValue: searchText ? [searchText] : null,
      onFilter: (value, record) => {
        return record.operator.toLowerCase().includes(value.toLowerCase());
      },
    },
    {
      title: '进水流量(m³)',
      dataIndex: 'inflow',
      key: 'inflow',
      sorter: (a, b) => a.inflow - b.inflow,
    },
    {
      title: '出水流量(m³)',
      dataIndex: 'outflow',
      key: 'outflow',
      sorter: (a, b) => a.outflow - b.outflow,
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button 
            type="primary" 
            size="small" 
            icon={<EyeOutlined />}
            onClick={() => viewReportDetail(record)}
          >
            查看
          </Button>
          <Button 
            size="small" 
            icon={<DownloadOutlined />}
            onClick={() => message.info('下载功能正在开发中')}
          >
            下载
          </Button>
        </Space>
      ),
    },
  ];

  // 污泥车间日报表列
  const columnsSludge = [
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date',
      sorter: (a, b) => dayjs(a.date).unix() - dayjs(b.date).unix(),
    },
    {
      title: '值班员',
      dataIndex: 'operator',
      key: 'operator',
      filteredValue: searchText ? [searchText] : null,
      onFilter: (value, record) => {
        return record.operator.toLowerCase().includes(value.toLowerCase());
      },
    },
    {
      title: '污泥产量(吨)',
      dataIndex: 'sludge_production',
      key: 'sludge_production',
      sorter: (a, b) => a.sludge_production - b.sludge_production,
    },
    {
      title: '污泥含水率(%)',
      dataIndex: 'sludge_moisture',
      key: 'sludge_moisture',
      sorter: (a, b) => a.sludge_moisture - b.sludge_moisture,
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button 
            type="primary" 
            size="small" 
            icon={<EyeOutlined />}
            onClick={() => viewReportDetail(record)}
          >
            查看
          </Button>
          <Button 
            size="small" 
            icon={<DownloadOutlined />}
            onClick={() => message.info('下载功能正在开发中')}
          >
            下载
          </Button>
        </Space>
      ),
    },
  ];

  // 泵站周报表列
  const columnsPump = [
    {
      title: '报告周期',
      key: 'date_range',
      render: (_, record) => `${record.start_date} 至 ${record.end_date}`,
      sorter: (a, b) => dayjs(a.start_date).unix() - dayjs(b.start_date).unix(),
    },
    {
      title: '泵站名称',
      key: 'pump_station_name',
      render: (_, record) => {
        const station = pumpStations.find(s => s.id === record.pump_station_id);
        return station ? station.name : `泵站${record.pump_station_id}`;
      },
      filteredValue: searchText ? [searchText] : null,
      onFilter: (value, record) => {
        const station = pumpStations.find(s => s.id === record.pump_station_id);
        const stationName = station ? station.name : `泵站${record.pump_station_id}`;
        return stationName.toLowerCase().includes(value.toLowerCase());
      },
    },
    {
      title: '填报人',
      dataIndex: 'operator',
      key: 'operator',
    },
    {
      title: '总流量(m³)',
      dataIndex: 'total_flow',
      key: 'total_flow',
      sorter: (a, b) => a.total_flow - b.total_flow,
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button 
            type="primary" 
            size="small" 
            icon={<EyeOutlined />}
            onClick={() => viewReportDetail(record)}
          >
            查看
          </Button>
          <Button 
            size="small" 
            icon={<DownloadOutlined />}
            onClick={() => message.info('下载功能正在开发中')}
          >
            下载
          </Button>
        </Space>
      ),
    },
  ];

  // 渲染报告详情模态框
  const renderDetailModal = () => {
    if (!currentReport) return null;
    
    let content = null;
    
    if (activeTab === '5000') {
      content = (
        <Descriptions bordered column={2}>
          <Descriptions.Item label="日期">{currentReport.date}</Descriptions.Item>
          <Descriptions.Item label="值班员">{currentReport.operator}</Descriptions.Item>
          <Descriptions.Item label="进水流量">{currentReport.inflow} m³</Descriptions.Item>
          <Descriptions.Item label="出水流量">{currentReport.outflow} m³</Descriptions.Item>
          <Descriptions.Item label="出水水质" span={2}>{currentReport.out_quality}</Descriptions.Item>
          <Descriptions.Item label="水质异常情况" span={2}>{currentReport.water_quality_anomalies || '无'}</Descriptions.Item>
          <Descriptions.Item label="曝气系统" span={2}>{currentReport.aeration_system_status}</Descriptions.Item>
          <Descriptions.Item label="反洗系统" span={2}>{currentReport.backwash_system_status}</Descriptions.Item>
          <Descriptions.Item label="进水泵系统" span={2}>{currentReport.inlet_pump_status}</Descriptions.Item>
          <Descriptions.Item label="磁混凝" span={2}>{currentReport.magnetic_mixing_status}</Descriptions.Item>
          <Descriptions.Item label="水箱状态" span={2}>{currentReport.water_tank_status}</Descriptions.Item>
          <Descriptions.Item label="污泥排放" span={2}>{currentReport.sludge_discharge_status}</Descriptions.Item>
          <Descriptions.Item label="其他设备状态" span={2}>{currentReport.other_equipment_status || '无'}</Descriptions.Item>
          <Descriptions.Item label="絮凝剂投加量">{currentReport.flocculant_dosage} kg</Descriptions.Item>
          <Descriptions.Item label="磁粉投加量">{currentReport.magnetic_powder_dosage} kg</Descriptions.Item>
          <Descriptions.Item label="药剂存量" span={2}>{currentReport.chemical_inventory}</Descriptions.Item>
          <Descriptions.Item label="其他备注" span={2}>{currentReport.other_notes || '无'}</Descriptions.Item>
        </Descriptions>
      );
    } else if (activeTab === 'sludge') {
      content = (
        <Descriptions bordered column={2}>
          <Descriptions.Item label="日期">{currentReport.date}</Descriptions.Item>
          <Descriptions.Item label="值班员">{currentReport.operator}</Descriptions.Item>
          <Descriptions.Item label="污泥产量">{currentReport.sludge_production} 吨</Descriptions.Item>
          <Descriptions.Item label="污泥含水率">{currentReport.sludge_moisture} %</Descriptions.Item>
          <Descriptions.Item label="污泥外运量">{currentReport.sludge_transport} 吨</Descriptions.Item>
          <Descriptions.Item label="絮凝剂用量">{currentReport.polymer_dosage} kg</Descriptions.Item>
          <Descriptions.Item label="絮凝剂库存">{currentReport.polymer_inventory} kg</Descriptions.Item>
          <Descriptions.Item label="耗电量">{currentReport.power_consumption} kWh</Descriptions.Item>
          <Descriptions.Item label="脱水设备运行状态" span={2}>{currentReport.dewatering_equipment_status}</Descriptions.Item>
          <Descriptions.Item label="设备维护记录" span={2}>{currentReport.maintenance_records || '无'}</Descriptions.Item>
          <Descriptions.Item label="异常情况" span={2}>{currentReport.abnormal_situations || '无'}</Descriptions.Item>
          <Descriptions.Item label="其他备注" span={2}>{currentReport.other_notes || '无'}</Descriptions.Item>
        </Descriptions>
      );
    } else if (activeTab === 'pump') {
      const station = pumpStations.find(s => s.id === currentReport.pump_station_id);
      const stationName = station ? station.name : `泵站${currentReport.pump_station_id}`;
      
      content = (
        <Descriptions bordered column={2}>
          <Descriptions.Item label="报告周期">{`${currentReport.start_date} 至 ${currentReport.end_date}`}</Descriptions.Item>
          <Descriptions.Item label="泵站名称">{stationName}</Descriptions.Item>
          <Descriptions.Item label="填报人">{currentReport.operator}</Descriptions.Item>
          <Descriptions.Item label="总流量">{currentReport.total_flow} m³</Descriptions.Item>
          <Descriptions.Item label="日均流量">{currentReport.daily_average_flow} m³</Descriptions.Item>
          <Descriptions.Item label="最大日流量">{currentReport.max_daily_flow} m³</Descriptions.Item>
          <Descriptions.Item label="最小日流量">{currentReport.min_daily_flow} m³</Descriptions.Item>
          <Descriptions.Item label="耗电量">{currentReport.power_consumption} kWh</Descriptions.Item>
          <Descriptions.Item label="水泵运行时间">{currentReport.pump_operation_hours} h</Descriptions.Item>
          <Descriptions.Item label="设备运行状态" span={2}>{currentReport.equipment_status}</Descriptions.Item>
          <Descriptions.Item label="设备维护记录" span={2}>{currentReport.maintenance_records || '无'}</Descriptions.Item>
          <Descriptions.Item label="异常情况" span={2}>{currentReport.abnormal_situations || '无'}</Descriptions.Item>
          <Descriptions.Item label="其他备注" span={2}>{currentReport.other_notes || '无'}</Descriptions.Item>
        </Descriptions>
      );
    }
    
    return (
      <Modal
        title="报告详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            关闭
          </Button>,
          <Button 
            key="download" 
            type="primary" 
            icon={<DownloadOutlined />}
            onClick={() => message.info('下载功能正在开发中')}
          >
            下载
          </Button>
        ]}
        width={800}
      >
        {content}
      </Modal>
    );
  };

  return (
    <div className={styles.reportQueryContainer}>
      <Card className={styles.queryCard}>
        <Title level={4}>报告查询</Title>
        
        <Row gutter={16} className={styles.filterRow}>
          <Col span={8}>
            <RangePicker 
              value={dateRange}
              onChange={handleDateRangeChange}
              style={{ width: '100%' }}
            />
          </Col>
          <Col span={8}>
            <Input 
              placeholder="搜索..." 
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={handleSearchChange}
            />
          </Col>
          <Col span={8}>
            <Space>
              <Button 
                type="primary" 
                icon={<FileExcelOutlined />}
                onClick={exportToExcel}
              >
                导出Excel
              </Button>
              <Button 
                icon={<FilePdfOutlined />}
                onClick={exportToPDF}
              >
                导出PDF
              </Button>
            </Space>
          </Col>
        </Row>
        
        <Tabs activeKey={activeTab} onChange={handleTabChange} className={styles.tabs}>
          <TabPane tab="5000吨处理厂日报" key="5000">
            <Table 
              columns={columns5000} 
              dataSource={reports5000} 
              rowKey="id"
              loading={loading}
              pagination={{ pageSize: 10 }}
            />
          </TabPane>
          <TabPane tab="污泥车间日报" key="sludge">
            <Table 
              columns={columnsSludge} 
              dataSource={reportsSludge} 
              rowKey="id"
              loading={loading}
              pagination={{ pageSize: 10 }}
            />
          </TabPane>
          <TabPane tab="泵站周报" key="pump">
            <Row gutter={16} className={styles.filterRow}>
              <Col span={8}>
                <Select
                  placeholder="选择泵站"
                  style={{ width: '100%' }}
                  allowClear
                  onChange={handlePumpStationChange}
                  value={selectedPumpStation}
                >
                  {pumpStations.map(station => (
                    <Option key={station.id} value={station.id}>{station.name}</Option>
                  ))}
                </Select>
              </Col>
            </Row>
            <Table 
              columns={columnsPump} 
              dataSource={reportsPump} 
              rowKey="id"
              loading={loading}
              pagination={{ pageSize: 10 }}
            />
          </TabPane>
        </Tabs>
      </Card>
      
      {renderDetailModal()}
    </div>
  );
};

export default ReportQuery;
