import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Select, DatePicker, Button, Upload, message, Typography, Space, Divider, Row, Col } from 'antd';
import { UploadOutlined, SaveOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import apiService from '../../../services/apiService';
import { useAuth } from '../../../context/AuthContext';
import styles from './WorkOrderEntry.module.scss';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

/**
 * 工单录入页面
 * 对应移动端的WorkOrderEntryScreen
 */
const WorkOrderEntry = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [sites, setSites] = useState([]);
  const [equipmentTypes, setEquipmentTypes] = useState([]);
  const [equipments, setEquipments] = useState([]);
  const [fileList, setFileList] = useState([]);
  const [selectedSite, setSelectedSite] = useState(null);

  // 加载站点和设备类型数据
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // 通过API管理器调用获取站点列表API
        const sitesResponse = await apiService.callApi('getSiteList');
        
        if (sitesResponse && sitesResponse.success) {
          setSites(sitesResponse.data || []);
        }
        
        // 通过API管理器调用获取设备类型API
        const typesResponse = await apiService.callApi('getEquipmentTypes');
        
        if (typesResponse && typesResponse.success) {
          setEquipmentTypes(typesResponse.data || []);
        }
      } catch (error) {
        console.error('获取初始数据失败:', error);
        message.error('获取初始数据失败，请刷新页面重试');
      }
    };

    fetchInitialData();
  }, []);

  /**
   * 处理站点选择变化
   * @param {string} siteId - 站点ID
   */
  const handleSiteChange = async (siteId) => {
    setSelectedSite(siteId);
    form.setFieldsValue({ equipmentId: undefined });
    
    try {
      // 通过API管理器调用获取站点设备列表API
      const response = await apiService.callApi('getSiteEquipments', { siteId });
      
      if (response && response.success) {
        setEquipments(response.data || []);
      }
    } catch (error) {
      console.error('获取站点设备列表失败:', error);
      message.error('获取站点设备列表失败');
      setEquipments([]);
    }
  };

  /**
   * 处理文件上传变化
   * @param {Object} info - 上传信息
   */
  const handleFileChange = ({ fileList }) => {
    setFileList(fileList);
  };

  /**
   * 处理文件上传前检查
   * @param {File} file - 文件对象
   * @returns {boolean|Promise} 是否允许上传
   */
  const beforeUpload = (file) => {
    const isValidSize = file.size / 1024 / 1024 < 10;
    if (!isValidSize) {
      message.error('文件大小不能超过10MB');
    }
    return isValidSize || Upload.LIST_IGNORE;
  };

  /**
   * 处理表单提交
   * @param {Object} values - 表单值
   */
  const handleSubmit = async (values) => {
    if (loading) return;
    
    setLoading(true);
    try {
      // 准备上传文件
      const formData = new FormData();
      fileList.forEach(file => {
        if (file.originFileObj) {
          formData.append('files[]', file.originFileObj);
        }
      });
      
      // 上传文件
      let attachments = [];
      if (fileList.length > 0) {
        const uploadResponse = await apiService.callApi('uploadFiles', { formData });
        if (uploadResponse && uploadResponse.success) {
          attachments = uploadResponse.data.fileUrls || [];
        }
      }
      
      // 通过API管理器调用创建工单API
      const response = await apiService.callApi('createWorkOrder', {
        title: values.title,
        description: values.description,
        siteId: values.siteId,
        equipmentId: values.equipmentId,
        equipmentTypeId: values.equipmentTypeId,
        priority: values.priority,
        scheduledDate: values.scheduledDate ? values.scheduledDate.format('YYYY-MM-DD') : null,
        assignedTo: values.assignedTo,
        createdBy: user.id,
        attachments
      });
      
      if (response && response.success) {
        message.success('工单创建成功');
        navigate('/tickets');
      } else {
        throw new Error(response?.message || '创建失败');
      }
    } catch (error) {
      console.error('创建工单失败:', error);
      message.error('创建工单失败: ' + (error.message || '未知错误'));
    } finally {
      setLoading(false);
    }
  };

  /**
   * 处理取消操作
   */
  const handleCancel = () => {
    navigate('/tickets');
  };

  return (
    <div className={styles.workOrderEntryContainer}>
      <Title level={2} className={styles.pageTitle}>工单录入</Title>
      
      <Card className={styles.formCard}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            priority: 'medium',
            scheduledDate: null
          }}
        >
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                name="title"
                label="工单标题"
                rules={[{ required: true, message: '请输入工单标题' }]}
              >
                <Input placeholder="请输入工单标题" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="priority"
                label="优先级"
                rules={[{ required: true, message: '请选择优先级' }]}
              >
                <Select placeholder="请选择优先级">
                  <Option value="low">低</Option>
                  <Option value="medium">中</Option>
                  <Option value="high">高</Option>
                  <Option value="urgent">紧急</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                name="siteId"
                label="站点"
                rules={[{ required: true, message: '请选择站点' }]}
              >
                <Select 
                  placeholder="请选择站点" 
                  onChange={handleSiteChange}
                  showSearch
                  optionFilterProp="children"
                >
                  {sites.map(site => (
                    <Option key={site.id} value={site.id}>{site.name}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="scheduledDate"
                label="计划执行日期"
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                name="equipmentTypeId"
                label="设备类型"
                rules={[{ required: true, message: '请选择设备类型' }]}
              >
                <Select 
                  placeholder="请选择设备类型"
                  showSearch
                  optionFilterProp="children"
                >
                  {equipmentTypes.map(type => (
                    <Option key={type.id} value={type.id}>{type.name}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="equipmentId"
                label="设备"
                rules={[{ required: true, message: '请选择设备' }]}
              >
                <Select 
                  placeholder={selectedSite ? "请选择设备" : "请先选择站点"}
                  disabled={!selectedSite}
                  showSearch
                  optionFilterProp="children"
                >
                  {equipments.map(equipment => (
                    <Option key={equipment.id} value={equipment.id}>{equipment.name}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item
            name="description"
            label="工单描述"
            rules={[{ required: true, message: '请输入工单描述' }]}
          >
            <TextArea rows={4} placeholder="请详细描述问题或任务" />
          </Form.Item>
          
          <Form.Item
            name="assignedTo"
            label="指派给"
          >
            <Select 
              placeholder="请选择指派人员（可选）"
              allowClear
              showSearch
              optionFilterProp="children"
            >
              {/* 这里可以添加用户列表，通过API获取 */}
              <Option value="user1">张三</Option>
              <Option value="user2">李四</Option>
              <Option value="user3">王五</Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            label="附件"
          >
            <Upload
              listType="picture"
              fileList={fileList}
              onChange={handleFileChange}
              beforeUpload={beforeUpload}
              multiple
              maxCount={5}
              customRequest={({ onSuccess }) => {
                setTimeout(() => {
                  onSuccess("ok");
                }, 0);
              }}
            >
              <Button icon={<UploadOutlined />}>上传附件</Button>
            </Upload>
            <Text type="secondary" style={{ marginTop: 8, display: 'block' }}>
              支持JPG、PNG、PDF等格式，单个文件不超过10MB，最多上传5个文件
            </Text>
          </Form.Item>
          
          <Divider />
          
          <Form.Item>
            <div className={styles.formActions}>
              <Button 
                onClick={handleCancel}
                icon={<CloseOutlined />}
              >
                取消
              </Button>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={loading}
                icon={<SaveOutlined />}
              >
                提交工单
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default WorkOrderEntry;
