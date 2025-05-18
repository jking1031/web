import React, { useState, useEffect } from 'react';
import { Form, Input, DatePicker, Button, Card, Row, Col, message, Typography, Divider, Upload, Space, Select } from 'antd';
import { SaveOutlined, PrinterOutlined, PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import dayjs from 'dayjs';
import { useAuth } from '../../context/AuthContext';
import styles from './Reports.module.scss';

const { TextArea } = Input;
const { Title } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

/**
 * 泵站运行周报表单组件
 * @returns {JSX.Element} 泵站运行周报表单
 */
const ReportFormPumpStation = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [isCheckingReport, setIsCheckingReport] = useState(false);
  const [fileList, setFileList] = useState([]);
  const [pumpStations, setPumpStations] = useState([]);
  const navigate = useNavigate();
  const { user } = useAuth();

  // 获取上周的日期范围
  const getLastWeekRange = () => {
    const today = dayjs();
    const dayOfWeek = today.day(); // 0 是周日，1 是周一，以此类推
    
    // 计算上周一的日期
    const lastMonday = today.subtract(dayOfWeek + 7, 'day').startOf('day');
    // 计算上周日的日期
    const lastSunday = today.subtract(dayOfWeek + 1, 'day').endOf('day');
    
    return [lastMonday, lastSunday];
  };

  // 加载泵站列表
  useEffect(() => {
    const fetchPumpStations = async () => {
      try {
        const response = await axios.get('https://nodered.jzz77.cn:9003/api/pumpstations');
        if (response.data) {
          setPumpStations(response.data);
        }
      } catch (error) {
        console.error('获取泵站列表失败:', error);
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

  // 初始化表单数据
  useEffect(() => {
    form.setFieldsValue({
      date_range: getLastWeekRange(),
      operator: user?.name || '',
    });
  }, [form, user]);

  // 检查是否已提交报告
  const checkExistingReport = async (dateRange, pumpStationId) => {
    if (!dateRange || !pumpStationId) return false;
    
    setIsCheckingReport(true);
    try {
      const startDate = dateRange[0].format('YYYY-MM-DD');
      const endDate = dateRange[1].format('YYYY-MM-DD');
      
      const response = await axios.get(`https://nodered.jzz77.cn:9003/api/reportspump/exists?start_date=${startDate}&end_date=${endDate}&pump_station_id=${pumpStationId}`);
      
      if (response.data && response.data.exists) {
        message.warning(`数据库已经存在该时间段的泵站报告，请勿重复提交`);
        return true;
      }
      return false;
    } catch (error) {
      console.error('检查报告失败:', error);
      return false;
    } finally {
      setIsCheckingReport(false);
    }
  };

  // 提交表单
  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      
      // 检查日期范围是否包含未来日期
      const today = dayjs().startOf('day');
      if (values.date_range[1].isAfter(today)) {
        message.error('日期范围不能包含今天或未来的日期');
        setLoading(false);
        return;
      }
      
      // 检查是否已提交过报告
      const reportExists = await checkExistingReport(values.date_range, values.pump_station_id);
      if (reportExists) {
        setLoading(false);
        return;
      }
      
      // 生成唯一的报告ID
      const startDate = values.date_range[0].format('YYYY-MM-DD');
      const endDate = values.date_range[1].format('YYYY-MM-DD');
      const timestamp = Date.now();
      const reportId = `PUMP_REPORT_${values.pump_station_id}_${startDate}_${endDate}_${timestamp}`;
      
      // 处理图片上传
      let imageUrls = [];
      if (fileList.length > 0) {
        // 这里应该实现图片上传逻辑
        message.info('图片上传功能正在开发中');
      }
      
      // 准备提交的数据
      const processedData = {
        id: reportId,
        start_date: startDate,
        end_date: endDate,
        pump_station_id: values.pump_station_id,
        operator: values.operator,
        total_flow: values.total_flow || '0',
        daily_average_flow: values.daily_average_flow || '0',
        max_daily_flow: values.max_daily_flow || '0',
        min_daily_flow: values.min_daily_flow || '0',
        power_consumption: values.power_consumption || '0',
        pump_operation_hours: values.pump_operation_hours || '0',
        equipment_status: values.equipment_status || '',
        maintenance_records: values.maintenance_records || '',
        abnormal_situations: values.abnormal_situations || '',
        other_notes: values.other_notes || '',
        report_id: reportId,
        imagesurl: imageUrls.length > 0 ? imageUrls.join(',') : null,
      };
      
      // 提交到服务器
      const response = await axios.post('https://nodered.jzz77.cn:9003/api/reportspump', processedData);
      
      if (response.status === 201) {
        message.success('报告已提交');
        // 清空表单和图片
        form.resetFields();
        setFileList([]);
        form.setFieldsValue({
          date_range: getLastWeekRange(),
          operator: user?.name || '',
        });
      } else {
        throw new Error('提交失败');
      }
    } catch (error) {
      console.error('提交失败:', error);
      const errorMessage = error.response?.data?.message || '提交失败，请检查数据格式是否正确';
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // 打印表单
  const handlePrint = () => {
    window.print();
  };
  
  // 图片上传配置
  const uploadProps = {
    onRemove: (file) => {
      const index = fileList.indexOf(file);
      const newFileList = fileList.slice();
      newFileList.splice(index, 1);
      setFileList(newFileList);
    },
    beforeUpload: (file) => {
      setFileList([...fileList, file]);
      return false;
    },
    fileList,
  };

  return (
    <div className={styles.reportFormContainer}>
      <Card 
        title={<Title level={4}>泵站运行周报表</Title>} 
        className={styles.reportCard}
        extra={
          <Space>
            <Button 
              type="primary" 
              icon={<SaveOutlined />} 
              onClick={() => form.submit()}
              loading={loading}
            >
              保存
            </Button>
            <Button 
              icon={<PrinterOutlined />} 
              onClick={handlePrint}
            >
              打印
            </Button>
          </Space>
        }
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            date_range: getLastWeekRange(),
            operator: user?.name || '',
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="date_range"
                label="报告周期"
                rules={[{ required: true, message: '请选择报告周期' }]}
              >
                <RangePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="pump_station_id"
                label="泵站名称"
                rules={[{ required: true, message: '请选择泵站' }]}
              >
                <Select placeholder="请选择泵站">
                  {pumpStations.map(station => (
                    <Option key={station.id} value={station.id}>{station.name}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="operator"
                label="填报人"
                rules={[{ required: true, message: '请输入填报人姓名' }]}
              >
                <Input placeholder="请输入填报人姓名" />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left">流量统计</Divider>
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item
                name="total_flow"
                label="总流量(m³)"
                rules={[{ required: true, message: '请输入总流量' }]}
              >
                <Input placeholder="例如: 35000" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="daily_average_flow"
                label="日均流量(m³)"
                rules={[{ required: true, message: '请输入日均流量' }]}
              >
                <Input placeholder="例如: 5000" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="max_daily_flow"
                label="最大日流量(m³)"
                rules={[{ required: true, message: '请输入最大日流量' }]}
              >
                <Input placeholder="例如: 6500" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="min_daily_flow"
                label="最小日流量(m³)"
                rules={[{ required: true, message: '请输入最小日流量' }]}
              >
                <Input placeholder="例如: 3500" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={6}>
              <Form.Item
                name="power_consumption"
                label="耗电量(kWh)"
                rules={[{ required: true, message: '请输入耗电量' }]}
              >
                <Input placeholder="例如: 2500" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="pump_operation_hours"
                label="水泵运行时间(h)"
                rules={[{ required: true, message: '请输入水泵运行时间' }]}
              >
                <Input placeholder="例如: 168" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="equipment_status"
            label="设备运行状态"
            rules={[{ required: true, message: '请输入设备运行状态' }]}
          >
            <TextArea rows={2} placeholder="请输入设备运行状态..." />
          </Form.Item>

          <Form.Item
            name="maintenance_records"
            label="设备维护记录"
          >
            <TextArea rows={2} placeholder="请输入设备维护记录..." />
          </Form.Item>

          <Form.Item
            name="abnormal_situations"
            label="异常情况"
          >
            <TextArea rows={2} placeholder="请输入异常情况..." />
          </Form.Item>

          <Form.Item
            name="other_notes"
            label="其他备注"
          >
            <TextArea rows={2} placeholder="请输入其他备注信息..." />
          </Form.Item>

          <Form.Item label="上传图片">
            <Upload {...uploadProps} listType="picture-card">
              <div>
                <PlusOutlined />
                <div style={{ marginTop: 8 }}>上传</div>
              </div>
            </Upload>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default ReportFormPumpStation;
