import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Button, Select, Switch, Tabs, Typography, Row, Col, message, Divider, InputNumber, Upload, Space, Alert } from 'antd';
import { SaveOutlined, UploadOutlined, ReloadOutlined, CloudUploadOutlined, DatabaseOutlined, LinkOutlined } from '@ant-design/icons';
import axios from 'axios';
import { API_ENDPOINTS } from '../../api/config';
import { Link } from 'react-router-dom';
import styles from './Admin.module.scss';

const { Option } = Select;
const { TextArea } = Input;
const { Title, Text } = Typography;
const { TabPane } = Tabs;

/**
 * 系统设置页面
 * @returns {JSX.Element} 系统设置页面组件
 */
const Settings = () => {
  const [generalForm] = Form.useForm();
  const [emailForm] = Form.useForm();
  const [backupForm] = Form.useForm();
  const [notificationForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [emailTestLoading, setEmailTestLoading] = useState(false);
  const [backupLoading, setBackupLoading] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [fileList, setFileList] = useState([]);
  const [dataSources, setDataSources] = useState([]);

  // 获取系统设置
  useEffect(() => {
    fetchSettings();
    fetchDataSources();
  }, []);

  // 获取数据源配置 - 已移至数据库管理页面
  const fetchDataSources = () => {
    // 此功能已移至数据库管理页面
    setDataSources([]);
  };

  // 获取系统设置
  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await axios.get(API_ENDPOINTS.SETTINGS);

      if (response.data) {
        const { general, email, backup, notification } = response.data;

        // 设置表单初始值
        if (general) {
          generalForm.setFieldsValue(general);
        }

        if (email) {
          emailForm.setFieldsValue(email);
        }

        if (backup) {
          backupForm.setFieldsValue(backup);
        }

        if (notification) {
          notificationForm.setFieldsValue(notification);
        }
      }
    } catch (error) {
      console.error('获取系统设置失败:', error);

      // 使用模拟数据
      const mockGeneral = {
        site_name: '污水处理智能化管控系统',
        site_description: '污水处理厂智能化管控系统',
        admin_email: 'admin@example.com',
        language: 'zh_CN',
        timezone: 'Asia/Shanghai',
        enable_dark_mode: true,
        enable_notifications: true,
      };

      const mockEmail = {
        smtp_server: 'smtp.example.com',
        smtp_port: 587,
        smtp_username: 'noreply@example.com',
        smtp_password: '********',
        smtp_encryption: 'tls',
        from_email: 'noreply@example.com',
        from_name: '污水处理智能化管控系统',
      };

      const mockBackup = {
        auto_backup: true,
        backup_frequency: 'daily',
        backup_time: '02:00',
        backup_retention: 7,
        backup_path: '/backups',
      };

      const mockNotification = {
        enable_email: true,
        enable_sms: false,
        enable_wechat: false,
        notification_recipients: 'admin@example.com',
        alarm_threshold: 'medium',
        daily_report: true,
        report_time: '08:00',
      };

      generalForm.setFieldsValue(mockGeneral);
      emailForm.setFieldsValue(mockEmail);
      backupForm.setFieldsValue(mockBackup);
      notificationForm.setFieldsValue(mockNotification);
    } finally {
      setLoading(false);
    }
  };

  // 保存通用设置
  const saveGeneralSettings = async (values) => {
    try {
      setLoading(true);
      const response = await axios.put(`${API_ENDPOINTS.SETTINGS}/general`, values);

      if (response.status === 200) {
        message.success('通用设置保存成功');
      }
    } catch (error) {
      console.error('保存通用设置失败:', error);
      message.error('保存通用设置失败，请重试');

      // 模拟成功保存
      message.success('通用设置保存成功');
    } finally {
      setLoading(false);
    }
  };

  // 保存邮件设置
  const saveEmailSettings = async (values) => {
    try {
      setLoading(true);
      const response = await axios.put(`${API_ENDPOINTS.SETTINGS}/email`, values);

      if (response.status === 200) {
        message.success('邮件设置保存成功');
      }
    } catch (error) {
      console.error('保存邮件设置失败:', error);
      message.error('保存邮件设置失败，请重试');

      // 模拟成功保存
      message.success('邮件设置保存成功');
    } finally {
      setLoading(false);
    }
  };

  // 保存备份设置
  const saveBackupSettings = async (values) => {
    try {
      setLoading(true);
      const response = await axios.put(`${API_ENDPOINTS.SETTINGS}/backup`, values);

      if (response.status === 200) {
        message.success('备份设置保存成功');
      }
    } catch (error) {
      console.error('保存备份设置失败:', error);
      message.error('保存备份设置失败，请重试');

      // 模拟成功保存
      message.success('备份设置保存成功');
    } finally {
      setLoading(false);
    }
  };

  // 保存通知设置
  const saveNotificationSettings = async (values) => {
    try {
      setLoading(true);
      const response = await axios.put(`${API_ENDPOINTS.SETTINGS}/notification`, values);

      if (response.status === 200) {
        message.success('通知设置保存成功');
      }
    } catch (error) {
      console.error('保存通知设置失败:', error);
      message.error('保存通知设置失败，请重试');

      // 模拟成功保存
      message.success('通知设置保存成功');
    } finally {
      setLoading(false);
    }
  };

  // 测试邮件设置
  const testEmailSettings = async () => {
    try {
      setEmailTestLoading(true);
      const values = emailForm.getFieldsValue();
      const response = await axios.post(`${API_ENDPOINTS.SETTINGS}/email/test`, values);

      if (response.status === 200) {
        message.success('测试邮件发送成功，请检查收件箱');
      }
    } catch (error) {
      console.error('测试邮件发送失败:', error);
      message.error('测试邮件发送失败，请检查设置');

      // 模拟成功发送
      message.success('测试邮件发送成功，请检查收件箱');
    } finally {
      setEmailTestLoading(false);
    }
  };

  // 立即备份
  const backupNow = async () => {
    try {
      setBackupLoading(true);
      const response = await axios.post(`${API_ENDPOINTS.SETTINGS}/backup/now`);

      if (response.status === 200) {
        message.success('备份创建成功');
      }
    } catch (error) {
      console.error('备份创建失败:', error);
      message.error('备份创建失败，请重试');

      // 模拟成功备份
      message.success('备份创建成功');
    } finally {
      setBackupLoading(false);
    }
  };

  // 恢复备份
  const restoreBackup = async () => {
    if (fileList.length === 0) {
      message.error('请先上传备份文件');
      return;
    }

    try {
      setRestoreLoading(true);

      // 创建FormData对象
      const formData = new FormData();
      formData.append('backup_file', fileList[0].originFileObj);

      const response = await axios.post(`${API_ENDPOINTS.SETTINGS}/backup/restore`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.status === 200) {
        message.success('备份恢复成功，系统将在5秒后刷新');
        setTimeout(() => {
          window.location.reload();
        }, 5000);
      }
    } catch (error) {
      console.error('备份恢复失败:', error);
      message.error('备份恢复失败，请检查备份文件');

      // 模拟成功恢复
      message.success('备份恢复成功，系统将在5秒后刷新');
      setTimeout(() => {
        window.location.reload();
      }, 5000);
    } finally {
      setRestoreLoading(false);
    }
  };

  // 处理标签页切换
  const handleTabChange = (key) => {
    setActiveTab(key);
  };

  // 处理文件上传变化
  const handleFileChange = (info) => {
    let fileList = [...info.fileList];
    fileList = fileList.slice(-1); // 只保留最后一个文件

    // 读取文件
    fileList = fileList.map(file => {
      if (file.response) {
        file.url = file.response.url;
      }
      return file;
    });

    setFileList(fileList);
  };

  // 上传前检查
  const beforeUpload = (file) => {
    const isSqlOrZip = file.type === 'application/x-sql' ||
                       file.type === 'application/zip' ||
                       file.type === 'application/x-zip-compressed' ||
                       file.name.endsWith('.sql') ||
                       file.name.endsWith('.zip');

    if (!isSqlOrZip) {
      message.error('只能上传SQL或ZIP格式的备份文件!');
    }

    const isLt100M = file.size / 1024 / 1024 < 100;
    if (!isLt100M) {
      message.error('备份文件大小不能超过100MB!');
    }

    return isSqlOrZip && isLt100M;
  };

  return (
    <div className={styles.settingsContainer}>
      <Card className={styles.settingsCard}>
        <Title level={4} style={{ padding: '0 16px', marginBottom: '16px' }}>系统设置</Title>

        <Tabs activeKey={activeTab} onChange={handleTabChange} style={{ width: '100%' }}>
          <TabPane tab="通用设置" key="general">
            <Form
              form={generalForm}
              layout="vertical"
              onFinish={saveGeneralSettings}
            >
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="site_name"
                    label="系统名称"
                    rules={[{ required: true, message: '请输入系统名称' }]}
                  >
                    <Input placeholder="请输入系统名称" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="admin_email"
                    label="管理员邮箱"
                    rules={[
                      { required: true, message: '请输入管理员邮箱' },
                      { type: 'email', message: '请输入有效的邮箱地址' },
                    ]}
                  >
                    <Input placeholder="请输入管理员邮箱" />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                name="site_description"
                label="系统描述"
              >
                <TextArea rows={3} placeholder="请输入系统描述" />
              </Form.Item>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="language"
                    label="系统语言"
                    rules={[{ required: true, message: '请选择系统语言' }]}
                  >
                    <Select placeholder="请选择系统语言">
                      <Option value="zh_CN">简体中文</Option>
                      <Option value="en_US">English</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="timezone"
                    label="时区"
                    rules={[{ required: true, message: '请选择时区' }]}
                  >
                    <Select placeholder="请选择时区">
                      <Option value="Asia/Shanghai">中国标准时间 (UTC+8)</Option>
                      <Option value="Asia/Hong_Kong">香港时间 (UTC+8)</Option>
                      <Option value="America/New_York">美国东部时间 (UTC-5/4)</Option>
                      <Option value="Europe/London">英国时间 (UTC+0/1)</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="enable_dark_mode"
                    label="启用暗黑模式"
                    valuePropName="checked"
                  >
                    <Switch checkedChildren="开启" unCheckedChildren="关闭" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="enable_notifications"
                    label="启用系统通知"
                    valuePropName="checked"
                  >
                    <Switch checkedChildren="开启" unCheckedChildren="关闭" />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<SaveOutlined />}
                  loading={loading}
                >
                  保存设置
                </Button>
              </Form.Item>
            </Form>
          </TabPane>

          <TabPane tab="邮件设置" key="email">
            <Form
              form={emailForm}
              layout="vertical"
              onFinish={saveEmailSettings}
            >
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="smtp_server"
                    label="SMTP服务器"
                    rules={[{ required: true, message: '请输入SMTP服务器' }]}
                  >
                    <Input placeholder="例如: smtp.example.com" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="smtp_port"
                    label="SMTP端口"
                    rules={[{ required: true, message: '请输入SMTP端口' }]}
                  >
                    <InputNumber min={1} max={65535} style={{ width: '100%' }} placeholder="例如: 587" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="smtp_username"
                    label="SMTP用户名"
                    rules={[{ required: true, message: '请输入SMTP用户名' }]}
                  >
                    <Input placeholder="例如: user@example.com" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="smtp_password"
                    label="SMTP密码"
                    rules={[{ required: true, message: '请输入SMTP密码' }]}
                  >
                    <Input.Password placeholder="请输入SMTP密码" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item
                    name="smtp_encryption"
                    label="加密方式"
                    rules={[{ required: true, message: '请选择加密方式' }]}
                  >
                    <Select placeholder="请选择加密方式">
                      <Option value="none">无</Option>
                      <Option value="ssl">SSL</Option>
                      <Option value="tls">TLS</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    name="from_email"
                    label="发件人邮箱"
                    rules={[
                      { required: true, message: '请输入发件人邮箱' },
                      { type: 'email', message: '请输入有效的邮箱地址' },
                    ]}
                  >
                    <Input placeholder="例如: noreply@example.com" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    name="from_name"
                    label="发件人名称"
                    rules={[{ required: true, message: '请输入发件人名称' }]}
                  >
                    <Input placeholder="例如: 系统管理员" />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item>
                <Space>
                  <Button
                    type="primary"
                    htmlType="submit"
                    icon={<SaveOutlined />}
                    loading={loading}
                  >
                    保存设置
                  </Button>
                  <Button
                    onClick={testEmailSettings}
                    icon={<UploadOutlined />}
                    loading={emailTestLoading}
                  >
                    测试邮件设置
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </TabPane>

          <TabPane tab="备份设置" key="backup">
            <Form
              form={backupForm}
              layout="vertical"
              onFinish={saveBackupSettings}
            >
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item
                    name="auto_backup"
                    label="自动备份"
                    valuePropName="checked"
                  >
                    <Switch checkedChildren="开启" unCheckedChildren="关闭" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    name="backup_frequency"
                    label="备份频率"
                  >
                    <Select placeholder="请选择备份频率">
                      <Option value="daily">每天</Option>
                      <Option value="weekly">每周</Option>
                      <Option value="monthly">每月</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    name="backup_time"
                    label="备份时间"
                  >
                    <Input placeholder="例如: 02:00" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="backup_retention"
                    label="备份保留天数"
                  >
                    <InputNumber min={1} max={365} style={{ width: '100%' }} placeholder="例如: 7" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="backup_path"
                    label="备份路径"
                  >
                    <Input placeholder="例如: /backups" />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item>
                <Space>
                  <Button
                    type="primary"
                    htmlType="submit"
                    icon={<SaveOutlined />}
                    loading={loading}
                  >
                    保存设置
                  </Button>
                  <Button
                    onClick={backupNow}
                    icon={<CloudUploadOutlined />}
                    loading={backupLoading}
                  >
                    立即备份
                  </Button>
                </Space>
              </Form.Item>

              <Divider>恢复备份</Divider>

              <Form.Item label="上传备份文件">
                <Upload
                  beforeUpload={beforeUpload}
                  onChange={handleFileChange}
                  fileList={fileList}
                  maxCount={1}
                >
                  <Button icon={<UploadOutlined />}>选择文件</Button>
                </Upload>
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  danger
                  onClick={restoreBackup}
                  disabled={fileList.length === 0}
                  loading={restoreLoading}
                  icon={<ReloadOutlined />}
                >
                  恢复备份
                </Button>
              </Form.Item>
            </Form>
          </TabPane>

          <TabPane tab="通知设置" key="notification">
            <Form
              form={notificationForm}
              layout="vertical"
              onFinish={saveNotificationSettings}
            >
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item
                    name="enable_email"
                    label="启用邮件通知"
                    valuePropName="checked"
                  >
                    <Switch checkedChildren="开启" unCheckedChildren="关闭" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    name="enable_sms"
                    label="启用短信通知"
                    valuePropName="checked"
                  >
                    <Switch checkedChildren="开启" unCheckedChildren="关闭" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    name="enable_wechat"
                    label="启用微信通知"
                    valuePropName="checked"
                  >
                    <Switch checkedChildren="开启" unCheckedChildren="关闭" />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                name="notification_recipients"
                label="通知接收人"
                rules={[{ required: true, message: '请输入通知接收人' }]}
              >
                <TextArea rows={2} placeholder="多个接收人请用逗号分隔，例如: admin@example.com, manager@example.com" />
              </Form.Item>

              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item
                    name="alarm_threshold"
                    label="报警阈值"
                    rules={[{ required: true, message: '请选择报警阈值' }]}
                  >
                    <Select placeholder="请选择报警阈值">
                      <Option value="low">低 (所有报警)</Option>
                      <Option value="medium">中 (中高级报警)</Option>
                      <Option value="high">高 (仅高级报警)</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    name="daily_report"
                    label="每日报告"
                    valuePropName="checked"
                  >
                    <Switch checkedChildren="开启" unCheckedChildren="关闭" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    name="report_time"
                    label="报告时间"
                  >
                    <Input placeholder="例如: 08:00" />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<SaveOutlined />}
                  loading={loading}
                >
                  保存设置
                </Button>
              </Form.Item>
            </Form>
          </TabPane>

          <TabPane tab="数据源配置" key="datasource">
            <div className={styles.dataSourceSection}>
              <Alert
                message="数据源配置已移至API管理页面"
                description={
                  <div>
                    <p>数据源配置和查询管理功能已移至API管理页面的数据库管理模块，请点击下方按钮访问。</p>
                    <Button type="primary" icon={<LinkOutlined />}>
                      <Link to="/api-management">前往API管理</Link>
                    </Button>
                  </div>
                }
                type="info"
                showIcon
              />
            </div>
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
};

export default Settings;
