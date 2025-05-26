/**
 * 数据填报中心主页面
 * 根据用户角色显示不同的功能界面
 */

import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Typography, Space, List, Avatar, Tag, Empty, Spin, Statistic, Alert, Divider, Modal } from 'antd';
import { 
  FormOutlined, 
  SettingOutlined, 
  FileTextOutlined, 
  PlusOutlined,
  EditOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  BarChartOutlined,
  ApiOutlined,
  BugOutlined
} from '@ant-design/icons';
import { useAuth } from '../../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
// import FormTemplateManager from '../components/FormTemplateManager/FormTemplateManager';
import FormRenderer from '../components/FormRenderer/FormRenderer';
import formTemplateService from '../services/formTemplateService';
import formSubmissionService from '../services/formSubmissionService';
import apiTester from '../utils/apiTester';
import './DataEntryCenter.scss';

const { Title, Text, Paragraph } = Typography;

const DataEntryCenter = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [currentView, setCurrentView] = useState('home'); // home, templates, form, submissions
  const [availableTemplates, setAvailableTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [recentSubmissions, setRecentSubmissions] = useState([]);
  const [stats, setStats] = useState({
    totalTemplates: 0,
    mySubmissions: 0,
    pendingReviews: 0,
  });
  const [apiTestResults, setApiTestResults] = useState(null);

  // 初始化加载数据
  useEffect(() => {
    if (currentView === 'home') {
      loadDashboardData();
    }
  }, [currentView]);

  // 加载仪表盘数据
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // 加载可用模板
      const templatesResponse = await formTemplateService.getTemplates({
        status: 'published',
        pageSize: 10,
      });
      
      if (templatesResponse && templatesResponse.success) {
        setAvailableTemplates(templatesResponse.data.items || []);
        setStats(prev => ({
          ...prev,
          totalTemplates: templatesResponse.data.total || 0,
        }));
      }

      // 加载最近提交记录
      const submissionsResponse = await formSubmissionService.getSubmissions({
        submittedBy: user?.id || user?.name,
        pageSize: 5,
      });
      
      if (submissionsResponse && submissionsResponse.success) {
        setRecentSubmissions(submissionsResponse.data.items || []);
        setStats(prev => ({
          ...prev,
          mySubmissions: submissionsResponse.data.total || 0,
        }));
      }

      // 如果是管理员，加载待审核数据
      if (isAdmin) {
        const pendingResponse = await formSubmissionService.getSubmissions({
          status: 'pending',
          pageSize: 1,
        });
        
        if (pendingResponse && pendingResponse.success) {
          setStats(prev => ({
            ...prev,
            pendingReviews: pendingResponse.data.total || 0,
          }));
        }
      }
    } catch (error) {
      console.error('加载仪表盘数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 运行API测试
  const runApiTest = async () => {
    try {
      setLoading(true);
      const results = await apiTester.runAllTests();
      setApiTestResults(results);
      apiTester.printReport(results);
    } catch (error) {
      console.error('API测试失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 快速API测试
  const runQuickApiTest = async () => {
    try {
      const results = await apiTester.quickTest();
      console.log('快速测试结果:', results);
    } catch (error) {
      console.error('快速API测试失败:', error);
    }
  };

  // 开始填写表单
  const handleStartForm = (template) => {
    setSelectedTemplate(template);
    setCurrentView('form');
  };

  // 处理模板管理按钮点击
  const handleTemplateManagement = () => {
    Modal.warning({
      title: '功能暂时不可用',
      content: '由于依赖兼容性问题，模板管理功能暂时禁用。我们正在解决这个问题，请稍后再试。',
      okText: '知道了'
    });
  };

  // 处理数据分析按钮点击
  const handleDataAnalysis = () => {
    Modal.info({
      title: '功能开发中',
      content: '数据分析功能正在开发中，敬请期待。',
      okText: '知道了'
    });
  };

  // 处理系统设置按钮点击
  const handleSystemSettings = () => {
    Modal.info({
      title: '功能开发中',
      content: '系统设置功能正在开发中，敬请期待。',
      okText: '知道了'
    });
  };

  // 处理查看提交记录
  const handleViewSubmissions = () => {
    Modal.info({
      title: '功能开发中',
      content: '提交记录查看功能正在开发中，敬请期待。',
      okText: '知道了'
    });
  };

  // 表单提交完成回调
  const handleFormSubmit = (submission, action) => {
    if (action === 'submitted') {
      setCurrentView('home');
      loadDashboardData(); // 刷新数据
    }
  };

  // 渲染管理员功能区
  const renderAdminSection = () => {
    if (!isAdmin) return null;

    return (
      <Card 
        title="管理员功能" 
        className="admin-section"
        extra={
          <Button 
            type="primary" 
            icon={<SettingOutlined />}
            onClick={handleTemplateManagement}
          >
            模板管理
          </Button>
        }
      >
        <Row gutter={16}>
          <Col span={8}>
            <Card.Grid className="stat-card">
              <div className="stat-content">
                <div className="stat-number">{stats.totalTemplates}</div>
                <div className="stat-label">表单模板</div>
              </div>
            </Card.Grid>
          </Col>
          <Col span={8}>
            <Card.Grid className="stat-card">
              <div className="stat-content">
                <div className="stat-number">{stats.pendingReviews}</div>
                <div className="stat-label">待审核</div>
              </div>
            </Card.Grid>
          </Col>
          <Col span={8}>
            <Card.Grid className="stat-card">
              <div className="stat-content">
                <div className="stat-number">{stats.mySubmissions}</div>
                <div className="stat-label">总提交数</div>
              </div>
            </Card.Grid>
          </Col>
        </Row>
      </Card>
    );
  };

  // 渲染可用表单列表
  const renderAvailableForms = () => (
    <Card 
      title="可用表单" 
      className="available-forms"
      extra={
        <Button 
          type="link" 
          onClick={handleTemplateManagement}
        >
          查看全部
        </Button>
      }
    >
      {availableTemplates.length > 0 ? (
        <List
          dataSource={availableTemplates}
          renderItem={(template) => (
            <List.Item
              actions={[
                <Button 
                  type="primary" 
                  size="small"
                  icon={<FormOutlined />}
                  onClick={() => handleStartForm(template)}
                >
                  开始填写
                </Button>
              ]}
            >
              <List.Item.Meta
                avatar={<Avatar icon={<FileTextOutlined />} />}
                title={template.name}
                description={
                  <div>
                    <Text type="secondary">{template.description}</Text>
                    <div style={{ marginTop: 4 }}>
                      <Tag color="blue">v{template.version}</Tag>
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        创建者: {template.createdBy}
                      </Text>
                    </div>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      ) : (
        <Empty 
          description="暂无可用表单"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      )}
    </Card>
  );

  // 渲染最近提交记录
  const renderRecentSubmissions = () => (
    <Card 
      title="最近提交" 
      className="recent-submissions"
      extra={
        <Button 
          type="link" 
          onClick={handleViewSubmissions}
        >
          查看全部
        </Button>
      }
    >
      {recentSubmissions.length > 0 ? (
        <List
          dataSource={recentSubmissions}
          renderItem={(submission) => (
            <List.Item
              actions={[
                <Button 
                  type="text" 
                  size="small"
                  icon={<EyeOutlined />}
                >
                  查看
                </Button>
              ]}
            >
              <List.Item.Meta
                avatar={<Avatar icon={<FileTextOutlined />} />}
                title={submission.templateName}
                description={
                  <div>
                    <div>
                      <Tag color={
                        submission.status === 'pending' ? 'orange' :
                        submission.status === 'approved' ? 'green' : 'red'
                      }>
                        {submission.status === 'pending' ? '待审核' :
                         submission.status === 'approved' ? '已通过' : '已拒绝'}
                      </Tag>
                    </div>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      提交时间: {new Date(submission.submittedAt).toLocaleString()}
                    </Text>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      ) : (
        <Empty 
          description="暂无提交记录"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      )}
    </Card>
  );

  // 渲染主页内容
  const renderHomeContent = () => (
    <div className="data-entry-home">
      <div className="welcome-section">
        <Title level={2}>数据填报中心</Title>
        <Paragraph>
          欢迎使用数据填报中心！您可以在这里填写各种表单，提交数据，查看提交记录。
          {isAdmin && '作为管理员，您还可以创建和管理表单模板。'}
        </Paragraph>
      </div>

      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {renderAdminSection()}
        
        <Row gutter={16}>
          <Col span={12}>
            {renderAvailableForms()}
          </Col>
          <Col span={12}>
            {renderRecentSubmissions()}
          </Col>
        </Row>
      </Space>
    </div>
  );

  // 渲染表单填写界面
  const renderFormContent = () => (
    <FormRenderer
      template={selectedTemplate}
      onSubmit={handleFormSubmit}
      onCancel={() => setCurrentView('home')}
    />
  );

  // 渲染模板管理界面
  const renderTemplateManagement = () => (
    <Card title="模板管理">
      <Alert
        message="模板管理功能暂时不可用"
        description="由于依赖兼容性问题，表单设计器功能暂时禁用。请稍后再试。"
        type="warning"
        showIcon
      />
    </Card>
  );

  // 渲染开发工具
  const renderDevTools = () => {
    if (process.env.NODE_ENV !== 'development') {
      return null;
    }

    return (
      <Card 
        title={
          <span>
            <BugOutlined /> 开发工具
          </span>
        }
        style={{ marginBottom: 24 }}
        size="small"
      >
        <Space wrap>
          <Button 
            icon={<ApiOutlined />} 
            onClick={runQuickApiTest}
            size="small"
          >
            快速API测试
          </Button>
          <Button 
            icon={<BarChartOutlined />} 
            onClick={runApiTest}
            loading={loading}
            size="small"
          >
            完整API测试
          </Button>
          <Button 
            onClick={() => console.log('当前状态:', { stats })}
            size="small"
          >
            打印状态
          </Button>
        </Space>
        
        {apiTestResults && (
          <div style={{ marginTop: 16 }}>
            <Text strong>最近测试结果:</Text>
            <div style={{ marginTop: 8 }}>
              <Tag color={apiTestResults.summary.successRate === '100.0' ? 'green' : 'orange'}>
                成功率: {apiTestResults.summary.successRate}%
              </Tag>
              <Tag>总测试: {apiTestResults.summary.total}</Tag>
              <Tag>耗时: {apiTestResults.summary.totalDuration}ms</Tag>
            </div>
          </div>
        )}
      </Card>
    );
  };

  // 根据当前视图渲染内容
  const renderContent = () => {
    if (loading && currentView === 'home') {
      return (
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <Spin size="large" />
        </div>
      );
    }

    switch (currentView) {
      case 'templates':
        return renderTemplateManagement();
      case 'form':
        return renderFormContent();
      default:
        return renderHomeContent();
    }
  };

  return (
    <div className="data-entry-center">
      <div className="page-header">
        <Title level={2}>
          <FormOutlined /> 数据填报中心
        </Title>
        <Paragraph>
          {isAdmin 
            ? '管理表单模板，查看提交数据，进行数据分析' 
            : '选择表单模板进行数据填报，查看提交历史'
          }
        </Paragraph>
      </div>

      {/* 开发工具 */}
      {renderDevTools()}

      {/* 统计卡片 */}
      {isAdmin ? renderAdminSection() : (
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic
                title="可用表单"
                value={stats.totalTemplates}
                prefix={<FileTextOutlined />}
                suffix="个"
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic
                title="我的提交"
                value={stats.mySubmissions}
                prefix={<FormOutlined />}
                suffix="条"
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic
                title="待处理"
                value={stats.pendingReviews}
                prefix={<ClockCircleOutlined />}
                suffix="条"
              />
            </Card>
          </Col>
        </Row>
      )}

      <Row gutter={[24, 24]}>
        {/* 左侧：表单模板或管理功能 */}
        <Col xs={24} lg={isAdmin ? 12 : 16}>
          <Card
            title={
              <span>
                <FileTextOutlined /> {isAdmin ? '表单模板管理' : '可用表单'}
              </span>
            }
            extra={
              isAdmin && (
                <Space>
                  <Button 
                    type="primary" 
                    icon={<PlusOutlined />}
                    onClick={handleTemplateManagement}
                  >
                    管理模板
                  </Button>
                </Space>
              )
            }
          >
            {availableTemplates.length > 0 ? (
              <List
                dataSource={availableTemplates}
                renderItem={template => (
                  <List.Item
                    actions={[
                      <Button 
                        type="primary" 
                        size="small"
                        onClick={() => handleStartForm(template)}
                      >
                        {isAdmin ? '预览' : '开始填写'}
                      </Button>
                    ]}
                  >
                    <List.Item.Meta
                      avatar={
                        <Avatar 
                          icon={<FileTextOutlined />} 
                          style={{ backgroundColor: '#1890ff' }}
                        />
                      }
                      title={template.name}
                      description={
                        <div>
                          <Text type="secondary">{template.description}</Text>
                          <div style={{ marginTop: 4 }}>
                            <Tag color="blue">{template.category}</Tag>
                            <Tag color="green">v{template.version}</Tag>
                            {isAdmin && (
                              <Tag color={template.status === 'published' ? 'green' : 'orange'}>
                                {template.status}
                              </Tag>
                            )}
                          </div>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            ) : (
              <Alert
                message={isAdmin ? "暂无表单模板" : "暂无可用表单"}
                description={
                  isAdmin 
                    ? "点击'管理模板'按钮创建第一个表单模板"
                    : "请联系管理员创建表单模板"
                }
                type="info"
                showIcon
              />
            )}
          </Card>
        </Col>

        {/* 右侧：最近提交或管理功能 */}
        <Col xs={24} lg={isAdmin ? 12 : 8}>
          {isAdmin ? (
            // 管理员：快速操作
            <Card
              title={
                <span>
                  <SettingOutlined /> 快速操作
                </span>
              }
            >
              <Space direction="vertical" style={{ width: '100%' }}>
                <Button 
                  block 
                  icon={<PlusOutlined />}
                  onClick={handleTemplateManagement}
                >
                  创建新模板
                </Button>
                <Button 
                  block 
                  icon={<BarChartOutlined />}
                  onClick={handleDataAnalysis}
                >
                  查看数据分析
                </Button>
                <Button 
                  block 
                  icon={<SettingOutlined />}
                  onClick={handleSystemSettings}
                >
                  系统设置
                </Button>
              </Space>
              
              <Divider />
              
              <Title level={5}>系统状态</Title>
              <div>
                <Text>API状态: </Text>
                <Tag color="green">正常</Tag>
              </div>
              <div style={{ marginTop: 8 }}>
                <Text>数据库: </Text>
                <Tag color="green">连接正常</Tag>
              </div>
            </Card>
          ) : (
            // 普通用户：最近提交
            <Card
              title={
                <span>
                  <ClockCircleOutlined /> 最近提交
                </span>
              }
            >
              {recentSubmissions.length > 0 ? (
                <List
                  dataSource={recentSubmissions}
                  renderItem={submission => (
                    <List.Item>
                      <List.Item.Meta
                        avatar={
                          <Avatar 
                            icon={<FormOutlined />} 
                            style={{ 
                              backgroundColor: 
                                submission.status === 'approved' ? '#52c41a' :
                                submission.status === 'pending' ? '#faad14' : '#ff4d4f'
                            }}
                          />
                        }
                        title={submission.templateName}
                        description={
                          <div>
                            <div>
                              <Tag 
                                color={
                                  submission.status === 'approved' ? 'green' :
                                  submission.status === 'pending' ? 'orange' : 'red'
                                }
                              >
                                {submission.status}
                              </Tag>
                            </div>
                            <Text type="secondary" style={{ fontSize: '12px' }}>
                              {submission.submittedAt}
                            </Text>
                          </div>
                        }
                      />
                    </List.Item>
                  )}
                />
              ) : (
                <Alert
                  message="暂无提交记录"
                  description="开始填写表单后，提交记录将显示在这里"
                  type="info"
                  showIcon
                />
              )}
            </Card>
          )}
        </Col>
      </Row>
    </div>
  );
};

export default DataEntryCenter; 