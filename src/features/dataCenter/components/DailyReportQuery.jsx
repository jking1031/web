import React, { useState, useEffect } from 'react';
import { 
  Form, 
  Select, 
  DatePicker, 
  Button, 
  Card, 
  Space, 
  Radio, 
  Divider,
  Tag,
  Row,
  Col,
  message,
  Alert,
  Input
} from 'antd';
import { 
  SearchOutlined, 
  CalendarOutlined, 
  FileTextOutlined, 
  ReloadOutlined,
  HistoryOutlined
} from '@ant-design/icons';
import './DailyReportQuery.scss';
import dayjs from 'dayjs';
import { getReportTypes } from '../services/reportService';

const { Option } = Select;
const { RangePicker } = DatePicker;

/**
 * 日报查询表单组件
 * 
 * @param {Object} props
 * @param {Function} props.onSearch - 提交查询的回调函数
 * @param {Boolean} props.loading - 是否正在加载数据
 */
const DailyReportQuery = ({ onSearch, loading }) => {
  const [form] = Form.useForm();
  const [timeMode, setTimeMode] = useState('custom'); // 时间选择模式：custom, recent
  const [recentTimeUnit, setRecentTimeUnit] = useState('day'); // 最近时间单位：day, month, year
  const [reportTypeOptions, setReportTypeOptions] = useState([
    { value: '高铁厂运行日报', label: '高铁厂运行日报' },
    { value: '5000吨处理站', label: '5000吨处理站' }
  ]);
  const [loadingReportTypes, setLoadingReportTypes] = useState(false);

  // 获取报告类型
  useEffect(() => {
    const fetchReportTypes = async () => {
      try {
        setLoadingReportTypes(true);
        const types = await getReportTypes();
        if (types && types.length > 0) {
          setReportTypeOptions(
            types.map(type => ({ 
              value: type.name || type, 
              label: type.displayName || type.name || type 
            }))
          );
        }
      } catch (error) {
        console.error('获取报告类型失败', error);
      } finally {
        setLoadingReportTypes(false);
      }
    };

    fetchReportTypes();
  }, []);

  // 重置表单
  const handleReset = () => {
    form.resetFields();
    setTimeMode('custom');
    setRecentTimeUnit('day');
  };

  // 处理查询
  const handleSubmit = (values) => {
    // 根据时间模式构建查询参数
    let dateRange = [];
    
    if (timeMode === 'recent') {
      const today = dayjs();
      let startDate;
      
      // 根据选择的时间单位计算开始日期
      switch (values.recentTime.unit) {
        case 'day':
          startDate = today.subtract(values.recentTime.value, 'day');
          break;
        case 'month':
          startDate = today.subtract(values.recentTime.value, 'month');
          break;
        case 'year':
          startDate = today.subtract(values.recentTime.value, 'year');
          break;
        default:
          startDate = today.subtract(7, 'day');
      }
      
      dateRange = [startDate, today];
    } else {
      // 自定义时间范围
      dateRange = values.dateRange;
    }
    
    // 构建查询参数
    const queryParams = {
      reportType: values.reportType,
      startDate: dateRange[0].format('YYYY-MM-DD'),
      endDate: dateRange[1].format('YYYY-MM-DD'),
    };
    
    // 回调查询函数
    onSearch(queryParams);
  };

  // 处理时间模式切换
  const handleTimeModeChange = (e) => {
    setTimeMode(e.target.value);
    
    // 重置日期相关字段
    if (e.target.value === 'recent') {
      form.setFieldsValue({
        dateRange: null,
        recentTime: { value: 7, unit: recentTimeUnit }
      });
    } else {
      form.setFieldsValue({
        dateRange: [dayjs().subtract(7, 'day'), dayjs()],
        recentTime: null
      });
    }
  };

  // 处理最近时间单位变更
  const handleRecentUnitChange = (value) => {
    setRecentTimeUnit(value);
    
    // 更新表单字段
    const currentValue = form.getFieldValue(['recentTime', 'value']) || 7;
    form.setFieldsValue({
      recentTime: { value: currentValue, unit: value }
    });
  };

  return (
    <Card className="daily-report-query">
      <div className="query-header">
        <FileTextOutlined /> 日报查询
      </div>
      
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          reportType: reportTypeOptions[0]?.value || '高铁厂运行日报',
          dateRange: [dayjs().subtract(7, 'day'), dayjs()],
          timeMode: 'custom',
          recentTime: { value: 7, unit: 'day' }
        }}
      >
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              name="reportType"
              label="报告类型"
              rules={[{ required: true, message: '请选择报告类型' }]}
            >
              <Select 
                placeholder="选择报告类型" 
                loading={loadingReportTypes}
                options={reportTypeOptions}
              />
            </Form.Item>
          </Col>
          
          <Col xs={24} md={12}>
            <Form.Item label="时间选择方式">
              <Radio.Group 
                value={timeMode} 
                onChange={handleTimeModeChange}
                optionType="button" 
                buttonStyle="solid"
              >
                <Radio.Button value="custom">自定义范围</Radio.Button>
                <Radio.Button value="recent">最近时间</Radio.Button>
              </Radio.Group>
            </Form.Item>
          </Col>
        </Row>
        
        {timeMode === 'custom' ? (
          <Form.Item
            name="dateRange"
            label="日期范围"
            rules={[{ required: true, message: '请选择日期范围' }]}
          >
            <RangePicker 
              style={{ width: '100%' }} 
              placeholder={['开始日期', '结束日期']}
              format="YYYY-MM-DD"
            />
          </Form.Item>
        ) : (
          <Form.Item label="最近时间" required>
            <Input.Group compact>
              <Form.Item
                name={['recentTime', 'value']}
                noStyle
                rules={[{ required: true, message: '请输入数值' }]}
              >
                <Select style={{ width: '30%' }} placeholder="数值">
                  {[1, 3, 7, 14, 30, 90, 180, 365].map(value => (
                    <Option key={value} value={value}>最近 {value}</Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item
                name={['recentTime', 'unit']}
                noStyle
                rules={[{ required: true, message: '请选择时间单位' }]}
              >
                <Select 
                  style={{ width: '70%' }} 
                  placeholder="时间单位"
                  onChange={handleRecentUnitChange}
                >
                  <Option value="day">天</Option>
                  <Option value="month">月</Option>
                  <Option value="year">年</Option>
                </Select>
              </Form.Item>
            </Input.Group>
          </Form.Item>
        )}
        
        <Form.Item>
          <Space>
            <Button 
              type="primary" 
              htmlType="submit" 
              icon={<SearchOutlined />}
              loading={loading}
            >
              查询
            </Button>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={handleReset}
            >
              重置
            </Button>
          </Space>
        </Form.Item>
      </Form>
      
      <Alert
        type="info"
        showIcon
        message="查询提示"
        description="选择报告类型和时间范围进行查询，可以通过自定义日期范围或选择最近时间快速筛选日报。"
      />
    </Card>
  );
};

export default DailyReportQuery; 