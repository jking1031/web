import React, { useState, useEffect } from 'react';
import { Table, Card, Typography, Button, Space, Empty, Spin, message, Tabs, Row, Col, Tooltip, Radio, Statistic, Select, Tag } from 'antd';
import { DownloadOutlined, FileExcelOutlined, FilePdfOutlined, BarChartOutlined, LineChartOutlined, PieChartOutlined, TableOutlined, SearchOutlined, FilterOutlined } from '@ant-design/icons';
import * as XLSX from 'xlsx';
import ReactECharts from 'echarts-for-react';

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;

/**
 * 历史数据查询结果组件
 * 用于展示查询结果数据表格，支持导出为Excel或PDF和数据可视化
 */
const HistoryDataResults = ({ data, loading, error, queryInfo }) => {
  const [activeTab, setActiveTab] = useState('table');
  const [chartType, setChartType] = useState('line');
  const [xField, setXField] = useState(null);
  const [yFields, setYFields] = useState([]);
  const [numericFields, setNumericFields] = useState([]);
  const [dateFields, setDateFields] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    showSizeChanger: true,
    pageSizeOptions: ['10', '20', '50', '100'],
    showTotal: (total) => `共 ${total} 条记录`
  });
  const [statistics, setStatistics] = useState({});

  // 当数据变化时更新相关状态
  useEffect(() => {
    if (data && data.length > 0) {
      // 识别数值型和日期型字段
      const numFields = [];
      const timeFields = [];
      const stats = {};
      
      Object.keys(data[0]).forEach(key => {
        // 检查第一行数据的类型
        const value = data[0][key];
        
        // 对于数值类型字段，计算统计信息
        if (typeof value === 'number') {
          numFields.push(key);
          
          // 计算统计值
          const values = data.map(item => item[key]).filter(val => val !== null && val !== undefined && !isNaN(val));
          const sum = values.reduce((acc, val) => acc + val, 0);
          const avg = sum / values.length;
          const max = Math.max(...values);
          const min = Math.min(...values);
          
          stats[key] = {
            sum: parseFloat(sum.toFixed(2)),
            avg: parseFloat(avg.toFixed(2)),
            max: parseFloat(max.toFixed(2)),
            min: parseFloat(min.toFixed(2))
          };
        }
        
        // 识别日期字段
        if (value instanceof Date || 
            (typeof value === 'string' && !isNaN(Date.parse(value))) ||
            key.toLowerCase().includes('date') || 
            key.toLowerCase().includes('time')) {
          timeFields.push(key);
        }
      });
      
      setNumericFields(numFields);
      setDateFields(timeFields);
      setStatistics(stats);
      
      // 设置默认的图表字段
      if (timeFields.length > 0 && numFields.length > 0) {
        setXField(timeFields[0]);
        setYFields([numFields[0]]);
      } else if (numFields.length > 1) {
        setXField(numFields[0]);
        setYFields([numFields[1]]);
      }
      
      setFilteredData(data);
    }
  }, [data]);

  // 处理表格列定义
  const getColumns = () => {
    if (!data || data.length === 0) return [];
    
    // 从第一行数据中提取列定义
    return Object.keys(data[0]).map(key => ({
      title: key,
      dataIndex: key,
      key: key,
      sorter: (a, b) => {
        // 数字类型排序
        if (typeof a[key] === 'number' && typeof b[key] === 'number') {
          return a[key] - b[key];
        }
        // 日期类型排序
        if (a[key] instanceof Date && b[key] instanceof Date) {
          return a[key].getTime() - b[key].getTime();
        }
        // 字符串类型排序
        if (typeof a[key] === 'string' && typeof b[key] === 'string') {
          return a[key].localeCompare(b[key]);
        }
        return 0;
      },
      // 日期或时间字段格式化
      render: (text) => {
        if (text instanceof Date) {
          return text.toLocaleString();
        }
        if (typeof text === 'string' && (key.toLowerCase().includes('date') || key.toLowerCase().includes('time'))) {
          // 尝试将字符串转换为日期并格式化
          try {
            const date = new Date(text);
            if (!isNaN(date.getTime())) {
              return date.toLocaleString();
            }
          } catch (e) {
            // 转换失败，返回原始值
          }
        }
        // 如果是数值，保留2位小数
        if (typeof text === 'number') {
          return text.toFixed(2);
        }
        return text;
      },
      // 添加列过滤功能
      filters: data ? [...new Set(data.map(item => item[key]))].map(value => ({
        text: value?.toString() || '空值',
        value: value?.toString() || ''
      })).slice(0, 50) : [], // 限制过滤选项数量
      onFilter: (value, record) => {
        const recordValue = record[key]?.toString() || '';
        return recordValue === value;
      },
      filterSearch: true,
      ellipsis: true,
    }));
  };

  // 处理分页变化
  const handleTableChange = (pagination, filters, sorter) => {
    setPagination(pagination);
  };

  // 获取图表选项
  const getChartOptions = () => {
    if (!data || data.length === 0 || !xField || yFields.length === 0) {
      return { title: { text: '请选择字段' } };
    }
    
    // 根据图表类型创建不同的配置
    switch (chartType) {
      case 'line':
        return {
          title: {
            text: '数据趋势图',
            left: 'center'
          },
          tooltip: {
            trigger: 'axis'
          },
          legend: {
            data: yFields,
            top: 30
          },
          grid: {
            left: '3%',
            right: '4%',
            bottom: '3%',
            containLabel: true
          },
          xAxis: {
            type: 'category',
            boundaryGap: false,
            data: filteredData.map(item => {
              // 如果是日期字段，进行格式化
              if (dateFields.includes(xField)) {
                try {
                  const date = new Date(item[xField]);
                  return date.toLocaleString();
                } catch (e) {
                  return item[xField];
                }
              }
              return item[xField];
            })
          },
          yAxis: {
            type: 'value'
          },
          series: yFields.map(field => ({
            name: field,
            type: 'line',
            data: filteredData.map(item => item[field])
          }))
        };
        
      case 'bar':
        return {
          title: {
            text: '数据对比图',
            left: 'center'
          },
          tooltip: {
            trigger: 'axis',
            axisPointer: {
              type: 'shadow'
            }
          },
          legend: {
            data: yFields,
            top: 30
          },
          grid: {
            left: '3%',
            right: '4%',
            bottom: '3%',
            containLabel: true
          },
          xAxis: {
            type: 'category',
            data: filteredData.map(item => {
              if (dateFields.includes(xField)) {
                try {
                  const date = new Date(item[xField]);
                  return date.toLocaleString();
                } catch (e) {
                  return item[xField];
                }
              }
              return item[xField];
            }),
            axisLabel: {
              rotate: 45,
              interval: 0
            }
          },
          yAxis: {
            type: 'value'
          },
          series: yFields.map(field => ({
            name: field,
            type: 'bar',
            data: filteredData.map(item => item[field])
          }))
        };
        
      case 'pie':
        // 饼图只使用第一个选中的Y轴字段
        const yField = yFields[0];
        return {
          title: {
            text: `${yField} 数据占比`,
            left: 'center'
          },
          tooltip: {
            trigger: 'item',
            formatter: '{a} <br/>{b}: {c} ({d}%)'
          },
          legend: {
            orient: 'vertical',
            left: 10,
            data: filteredData.map(item => item[xField])
          },
          series: [
            {
              name: yField,
              type: 'pie',
              radius: ['40%', '70%'],
              avoidLabelOverlap: false,
              itemStyle: {
                borderRadius: 10,
                borderColor: '#fff',
                borderWidth: 2
              },
              label: {
                show: false,
                position: 'center'
              },
              emphasis: {
                label: {
                  show: true,
                  fontSize: '18',
                  fontWeight: 'bold'
                }
              },
              labelLine: {
                show: false
              },
              data: filteredData.map(item => ({
                name: item[xField],
                value: item[yField]
              }))
            }
          ]
        };
        
      default:
        return { title: { text: '请选择图表类型' } };
    }
  };

  // 导出到Excel
  const exportToExcel = () => {
    if (!data || data.length === 0) {
      message.warning('没有数据可导出');
      return;
    }

    try {
      // 创建工作簿
      const workbook = XLSX.utils.book_new();
      // 创建工作表
      const worksheet = XLSX.utils.json_to_sheet(data);
      // 添加工作表到工作簿
      XLSX.utils.book_append_sheet(workbook, worksheet, queryInfo?.table || 'Sheet1');
      
      // 设置列宽
      const columnWidths = Object.keys(data[0]).map(key => ({ wch: Math.max(key.length, 15) }));
      worksheet['!cols'] = columnWidths;
      
      // 导出文件
      const fileName = `历史数据_${queryInfo?.table || 'data'}_${new Date().toISOString().slice(0, 10)}.xlsx`;
      XLSX.writeFile(workbook, fileName);
      
      message.success(`数据已导出到 ${fileName}`);
    } catch (error) {
      console.error('导出Excel失败:', error);
      message.error('导出Excel失败');
    }
  };

  // 导出当前页数据
  const exportCurrentPage = () => {
    if (!filteredData || filteredData.length === 0) {
      message.warning('没有数据可导出');
      return;
    }

    try {
      // 计算当前页的数据范围
      const { current, pageSize } = pagination;
      const startIndex = (current - 1) * pageSize;
      const endIndex = Math.min(startIndex + pageSize, filteredData.length);
      const currentPageData = filteredData.slice(startIndex, endIndex);
      
      // 创建工作簿
      const workbook = XLSX.utils.book_new();
      // 创建工作表
      const worksheet = XLSX.utils.json_to_sheet(currentPageData);
      // 添加工作表到工作簿
      XLSX.utils.book_append_sheet(workbook, worksheet, queryInfo?.table || 'Sheet1');
      
      // 设置列宽
      const columnWidths = Object.keys(currentPageData[0]).map(key => ({ wch: Math.max(key.length, 15) }));
      worksheet['!cols'] = columnWidths;
      
      // 导出文件
      const fileName = `历史数据_${queryInfo?.table || 'data'}_当前页_${new Date().toISOString().slice(0, 10)}.xlsx`;
      XLSX.writeFile(workbook, fileName);
      
      message.success(`数据已导出到 ${fileName}`);
    } catch (error) {
      console.error('导出Excel失败:', error);
      message.error('导出Excel失败');
    }
  };

  // 导出到PDF (这里仅作为示例，实际可能需要额外的库)
  const exportToPDF = () => {
    message.info('PDF导出功能正在开发中');
  };

  return (
    <Card 
      title={
        <Space>
          <Title level={4}>查询结果</Title>
          {queryInfo?.table && <span>- {queryInfo.table}</span>}
          {data && data.length > 0 && <Tag color="green">{data.length} 条记录</Tag>}
        </Space>
      }
      extra={
        data && data.length > 0 ? (
          <Space>
            <Button 
              icon={<FileExcelOutlined />} 
              onClick={exportToExcel}
              disabled={!data || data.length === 0}
            >
              导出全部
            </Button>
            <Button 
              icon={<DownloadOutlined />} 
              onClick={exportCurrentPage}
              disabled={!data || data.length === 0}
            >
              导出当前页
            </Button>
            <Button 
              icon={<FilePdfOutlined />} 
              onClick={exportToPDF}
              disabled={!data || data.length === 0}
            >
              导出PDF
            </Button>
          </Space>
        ) : null
      }
    >
      <Spin spinning={loading}>
        {error ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={<span style={{ color: '#ff4d4f' }}>{error}</span>}
          />
        ) : data && data.length > 0 ? (
          <>
            <Tabs activeKey={activeTab} onChange={setActiveTab}>
              <TabPane 
                tab={
                  <span>
                    <TableOutlined />
                    表格视图
                  </span>
                } 
                key="table"
              >
                <Table 
                  columns={getColumns()} 
                  dataSource={filteredData.map((item, index) => ({ ...item, key: index }))}
                  scroll={{ x: 'max-content' }}
                  size="middle"
                  bordered
                  pagination={pagination}
                  onChange={handleTableChange}
                />
              </TabPane>
              
              <TabPane 
                tab={
                  <span>
                    <BarChartOutlined />
                    数据可视化
                  </span>
                } 
                key="chart"
              >
                <Row gutter={16} style={{ marginBottom: 16 }}>
                  <Col span={6}>
                    <Radio.Group 
                      value={chartType} 
                      onChange={(e) => setChartType(e.target.value)}
                      buttonStyle="solid"
                    >
                      <Tooltip title="折线图">
                        <Radio.Button value="line"><LineChartOutlined /></Radio.Button>
                      </Tooltip>
                      <Tooltip title="柱状图">
                        <Radio.Button value="bar"><BarChartOutlined /></Radio.Button>
                      </Tooltip>
                      <Tooltip title="饼图">
                        <Radio.Button value="pie"><PieChartOutlined /></Radio.Button>
                      </Tooltip>
                    </Radio.Group>
                  </Col>
                  
                  <Col span={6}>
                    <Select
                      placeholder="选择X轴字段"
                      style={{ width: '100%' }}
                      value={xField}
                      onChange={setXField}
                    >
                      {Object.keys(data[0]).map(key => (
                        <Option key={key} value={key}>{key}</Option>
                      ))}
                    </Select>
                  </Col>
                  
                  <Col span={12}>
                    <Select
                      mode="multiple"
                      placeholder="选择Y轴字段 (数值型)"
                      style={{ width: '100%' }}
                      value={yFields}
                      onChange={setYFields}
                      maxTagCount={3}
                    >
                      {numericFields.map(key => (
                        <Option key={key} value={key}>{key}</Option>
                      ))}
                    </Select>
                  </Col>
                </Row>
                
                <ReactECharts 
                  option={getChartOptions()} 
                  style={{ height: 400 }}
                  notMerge={true}
                />
              </TabPane>
              
              <TabPane 
                tab={
                  <span>
                    <FilterOutlined />
                    数据统计
                  </span>
                } 
                key="stats"
              >
                {numericFields.length > 0 ? (
                  <Row gutter={[16, 16]}>
                    {numericFields.map(field => (
                      <Col key={field} xs={24} sm={12} md={8} lg={6}>
                        <Card title={field} size="small">
                          <Row gutter={[16, 16]}>
                            <Col span={12}>
                              <Statistic 
                                title="平均值" 
                                value={statistics[field]?.avg} 
                                precision={2}
                              />
                            </Col>
                            <Col span={12}>
                              <Statistic 
                                title="总和" 
                                value={statistics[field]?.sum} 
                                precision={2}
                              />
                            </Col>
                            <Col span={12}>
                              <Statistic 
                                title="最大值" 
                                value={statistics[field]?.max} 
                                precision={2}
                                valueStyle={{ color: '#3f8600' }}
                              />
                            </Col>
                            <Col span={12}>
                              <Statistic 
                                title="最小值" 
                                value={statistics[field]?.min} 
                                precision={2}
                                valueStyle={{ color: '#cf1322' }}
                              />
                            </Col>
                          </Row>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                ) : (
                  <Empty description="没有可用于统计的数值型字段" />
                )}
              </TabPane>
            </Tabs>
          </>
        ) : (
          <Empty description={loading ? '加载中...' : '暂无数据'} />
        )}
      </Spin>
    </Card>
  );
};

export default HistoryDataResults; 