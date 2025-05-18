import React, { useState, useEffect } from 'react';
import { Form, Input, DatePicker, Button, Card, Row, Col, message, Select, Typography, Divider, Upload, Space } from 'antd';
import { SaveOutlined, PrinterOutlined, UploadOutlined, PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import dayjs from 'dayjs';
import { useAuth } from '../../context/AuthContext';
import styles from './Reports.module.scss';

const { Option } = Select;
const { TextArea } = Input;
const { Title, Text } = Typography;

/**
 * 5000吨处理厂日报表单组件
 * @returns {JSX.Element} 5000吨处理厂日报表单
 */
const ReportForm5000 = () => {
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
      const response = await axios.get(`https://nodered.jzz77.cn:9003/api/reports5000/exists?date=${formattedDate}&operator=${operator}`);

      if (response.data && response.data.exists) {
        // 格式化日期为"X月X日"的形式
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

      // 生成唯一的生产报告ID
      const date = values.date.format('YYYY-MM-DD');
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 10);
      const reportId = `PROD_REPORT_5000${date}_${timestamp}`;

      // 处理图片上传
      let imageUrls = [];
      if (fileList.length > 0) {
        // 这里应该实现图片上传逻辑
        // 由于Web端可能使用不同的上传方式，这里暂时留空
        message.info('图片上传功能正在开发中');
      }

      // 合成出水水质描述
      const outQualityParts = [];
      if (values.out_cod) outQualityParts.push(`出水COD平均值${values.out_cod}mg/L`);
      if (values.out_nh3n) outQualityParts.push(`氨氮平均值${values.out_nh3n}mg/L`);
      if (values.out_tp) outQualityParts.push(`总磷平均值${values.out_tp}mg/L`);
      const outQualityText = outQualityParts.join('，');

      // 准备提交的数据
      const processedData = {
        id: reportId,
        date: date,
        operator: values.operator,
        inflow: values.inflow || '0',
        outflow: values.outflow || '0',
        out_quality: outQualityText,
        water_quality_anomalies: values.water_quality_anomalies || '',
        aeration_system_status: values.aeration_system_status || '',
        backwash_system_status: values.backwash_system_status || '',
        inlet_pump_status: values.inlet_pump_status || '',
        magnetic_mixing_status: values.magnetic_mixing_status || '',
        water_tank_status: values.water_tank_status || '',
        sludge_discharge_status: values.sludge_discharge_status || '',
        other_equipment_status: values.other_equipment_status || '',
        flocculant_dosage: values.flocculant_dosage || '',
        magnetic_powder_dosage: values.magnetic_powder_dosage || '',
        chemical_inventory: values.chemical_inventory || '',
        other_notes: values.other_notes || '',
        report_id: reportId,
        imagesurl: imageUrls.length > 0 ? imageUrls.join(',') : null,
      };

      // 提交到服务器
      const response = await axios.post('https://nodered.jzz77.cn:9003/api/reports5000', processedData);

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
        title={<Title level={4}>5000吨处理厂运行日报表</Title>}
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

          <Divider orientation="left">进出水情况</Divider>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="inflow"
                label="进水流量(m³)"
                rules={[{ required: true, message: '请输入进水流量' }]}
              >
                <Input placeholder="例如: 5000" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="outflow"
                label="出水流量(m³)"
                rules={[{ required: true, message: '请输入出水流量' }]}
              >
                <Input placeholder="例如: 4800" />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left">出水水质</Divider>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="out_cod"
                label="出水COD(mg/L)"
                rules={[{ required: true, message: '请输入出水COD' }]}
              >
                <Input placeholder="例如: 40" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="out_nh3n"
                label="出水氨氮(mg/L)"
              >
                <Input placeholder="例如: 5" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="out_tp"
                label="出水总磷(mg/L)"
              >
                <Input placeholder="例如: 0.5" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="water_quality_anomalies"
            label="水质异常情况"
          >
            <TextArea rows={2} placeholder="请输入水质异常情况..." />
          </Form.Item>

          <Divider orientation="left">设备运行情况</Divider>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="aeration_system_status"
                label="曝气系统"
                rules={[{ required: true, message: '请输入曝气系统状态' }]}
              >
                <TextArea rows={2} placeholder="请输入曝气系统运行状态..." />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="backwash_system_status"
                label="反洗系统"
                rules={[{ required: true, message: '请输入反洗系统状态' }]}
              >
                <TextArea rows={2} placeholder="请输入反洗系统运行状态..." />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="inlet_pump_status"
                label="进水泵系统"
                rules={[{ required: true, message: '请输入进水泵系统状态' }]}
              >
                <TextArea rows={2} placeholder="请输入进水泵系统运行状态..." />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="magnetic_mixing_status"
                label="磁混凝"
                rules={[{ required: true, message: '请输入磁混凝状态' }]}
              >
                <TextArea rows={2} placeholder="请输入磁混凝运行状态..." />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="water_tank_status"
                label="水箱状态"
                rules={[{ required: true, message: '请输入水箱状态' }]}
              >
                <TextArea rows={2} placeholder="请输入水箱状态..." />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="sludge_discharge_status"
                label="污泥排放"
                rules={[{ required: true, message: '请输入污泥排放状态' }]}
              >
                <TextArea rows={2} placeholder="请输入污泥排放状态..." />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="other_equipment_status"
            label="其他设备状态"
          >
            <TextArea rows={2} placeholder="请输入其他设备状态..." />
          </Form.Item>

          <Divider orientation="left">药剂投加情况</Divider>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="flocculant_dosage"
                label="絮凝剂投加量(kg)"
                rules={[{ required: true, message: '请输入絮凝剂投加量' }]}
              >
                <Input placeholder="例如: 25" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="magnetic_powder_dosage"
                label="磁粉投加量(kg)"
                rules={[{ required: true, message: '请输入磁粉投加量' }]}
              >
                <Input placeholder="例如: 15" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="chemical_inventory"
                label="药剂存量"
                rules={[{ required: true, message: '请输入药剂存量' }]}
              >
                <Input placeholder="例如: 絮凝剂200kg，磁粉150kg" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="other_notes"
            label="其他备注"
          >
            <TextArea rows={3} placeholder="请输入其他备注信息..." />
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

export default ReportForm5000;
