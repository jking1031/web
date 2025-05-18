import React, { useState, useEffect } from 'react';
import { Form, Input, DatePicker, Button, Card, Row, Col, message, Typography, Divider, Upload, Space } from 'antd';
import { SaveOutlined, PrinterOutlined, PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import dayjs from 'dayjs';
import { useAuth } from '../../context/AuthContext';
import styles from './Reports.module.scss';

const { TextArea } = Input;
const { Title } = Typography;

/**
 * 污泥车间日报表单组件
 * @returns {JSX.Element} 污泥车间日报表单
 */
const ReportFormSludge = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [isCheckingReport, setIsCheckingReport] = useState(false);
  const [fileList, setFileList] = useState([]);
  const navigate = useNavigate();
  const { user } = useAuth();

  // 获取昨天的日期
  const getYesterdayDate = () => {
    const yesterday = dayjs().subtract(1, 'day');
    return yesterday;
  };

  // 初始化表单数据
  useEffect(() => {
    form.setFieldsValue({
      date: getYesterdayDate(),
      operator: user?.name || '',
    });
  }, [form, user]);

  // 检查是否已提交报告
  const checkExistingReport = async (date, operator) => {
    if (!operator || !date) return false;
    
    setIsCheckingReport(true);
    try {
      const formattedDate = date.format('YYYY-MM-DD');
      const response = await axios.get(`https://nodered.jzz77.cn:9003/api/reportssludge/exists?date=${formattedDate}&operator=${operator}`);
      
      if (response.data && response.data.exists) {
        const month = date.month() + 1;
        const day = date.date();
        const formattedDateStr = `${month}月${day}日`;
        
        message.warning(`数据库已经存在${formattedDateStr}的报告，请勿重复提交`);
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
      
      // 检查日期是否为今天或未来
      const today = dayjs().startOf('day');
      if (values.date.isAfter(today) || values.date.isSame(today)) {
        message.error('只能选择今天之前的日期');
        setLoading(false);
        return;
      }
      
      // 检查是否已提交过报告
      const reportExists = await checkExistingReport(values.date, values.operator);
      if (reportExists) {
        setLoading(false);
        return;
      }
      
      // 生成唯一的报告ID
      const date = values.date.format('YYYY-MM-DD');
      const timestamp = Date.now();
      const reportId = `SLUDGE_REPORT_${date}_${timestamp}`;
      
      // 处理图片上传
      let imageUrls = [];
      if (fileList.length > 0) {
        // 这里应该实现图片上传逻辑
        message.info('图片上传功能正在开发中');
      }
      
      // 准备提交的数据
      const processedData = {
        id: reportId,
        date: date,
        operator: values.operator,
        sludge_production: values.sludge_production || '0',
        sludge_moisture: values.sludge_moisture || '0',
        sludge_transport: values.sludge_transport || '0',
        dewatering_equipment_status: values.dewatering_equipment_status || '',
        polymer_dosage: values.polymer_dosage || '0',
        polymer_inventory: values.polymer_inventory || '0',
        power_consumption: values.power_consumption || '0',
        maintenance_records: values.maintenance_records || '',
        abnormal_situations: values.abnormal_situations || '',
        other_notes: values.other_notes || '',
        report_id: reportId,
        imagesurl: imageUrls.length > 0 ? imageUrls.join(',') : null,
      };
      
      // 提交到服务器
      const response = await axios.post('https://nodered.jzz77.cn:9003/api/reportssludge', processedData);
      
      if (response.status === 201) {
        message.success('报告已提交');
        // 清空表单和图片
        form.resetFields();
        setFileList([]);
        form.setFieldsValue({
          date: getYesterdayDate(),
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
        title={<Title level={4}>污泥车间运行日报表</Title>} 
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
            date: getYesterdayDate(),
            operator: user?.name || '',
          }}
        >
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="date"
                label="日期"
                rules={[{ required: true, message: '请选择日期' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="operator"
                label="值班员"
                rules={[{ required: true, message: '请输入值班员姓名' }]}
              >
                <Input placeholder="请输入值班员姓名" />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left">污泥生产情况</Divider>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="sludge_production"
                label="污泥产量(吨)"
                rules={[{ required: true, message: '请输入污泥产量' }]}
              >
                <Input placeholder="例如: 25" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="sludge_moisture"
                label="污泥含水率(%)"
                rules={[{ required: true, message: '请输入污泥含水率' }]}
              >
                <Input placeholder="例如: 80" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="sludge_transport"
                label="污泥外运量(吨)"
                rules={[{ required: true, message: '请输入污泥外运量' }]}
              >
                <Input placeholder="例如: 20" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="dewatering_equipment_status"
            label="脱水设备运行状态"
            rules={[{ required: true, message: '请输入脱水设备运行状态' }]}
          >
            <TextArea rows={2} placeholder="请输入脱水设备运行状态..." />
          </Form.Item>

          <Divider orientation="left">药剂使用情况</Divider>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="polymer_dosage"
                label="絮凝剂用量(kg)"
                rules={[{ required: true, message: '请输入絮凝剂用量' }]}
              >
                <Input placeholder="例如: 50" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="polymer_inventory"
                label="絮凝剂库存(kg)"
                rules={[{ required: true, message: '请输入絮凝剂库存' }]}
              >
                <Input placeholder="例如: 200" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="power_consumption"
                label="耗电量(kWh)"
                rules={[{ required: true, message: '请输入耗电量' }]}
              >
                <Input placeholder="例如: 120" />
              </Form.Item>
            </Col>
          </Row>

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

export default ReportFormSludge;
