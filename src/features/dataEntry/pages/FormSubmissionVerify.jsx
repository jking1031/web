import React, { useState, useEffect } from 'react';
import { Card, Result, Spin, Button, Typography, Steps, Space, Collapse } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import { CheckCircleOutlined, CloseCircleOutlined, LoadingOutlined, DatabaseOutlined, FormOutlined, ExclamationCircleOutlined, BugOutlined } from '@ant-design/icons';
import { formService } from '../services/formService';
import styles from '../styles/FormModule.module.scss';

const { Title, Text, Paragraph } = Typography;
const { Step } = Steps;
const { Panel } = Collapse;

/**
 * 表单提交验证页面
 * 此页面在表单提交后自动加载，用于验证数据是否成功写入数据库
 * @param {Object} props
 * @param {boolean} props.standalone - 是否以独立页面模式显示，不含布局
 */
const FormSubmissionVerify = ({ standalone = false }) => {
  const [status, setStatus] = useState('loading'); // loading, success, error
  const [message, setMessage] = useState('');
  const [details, setDetails] = useState('');
  const [currentStep, setCurrentStep] = useState(1);
  const [debugMode, setDebugMode] = useState(false);
  const [debugInfo, setDebugInfo] = useState({
    apiUrl: '',
    formId: '',
    requestTime: '',
    responseTime: '',
    responseData: null,
    error: null
  });
  const navigate = useNavigate();
  const location = useLocation();

  // 页面加载时自动调用验证API
  useEffect(() => {
    // 如果URL中包含表单ID参数，则使用它
    const params = new URLSearchParams(location.search);
    const formId = params.get('formId');
    
    if (formId) {
      setDebugInfo(prev => ({ ...prev, formId }));
      verifySubmission(formId);
    } else {
      setStatus('error');
      setMessage('未提供表单ID');
      setDetails('请检查URL参数中是否包含formId');
      setDebugInfo(prev => ({ 
        ...prev, 
        error: '未提供表单ID参数',
        formId: '缺失'
      }));
    }
  }, [location]);

  // 调用后端验证API
  const verifySubmission = async (formId) => {
    try {
      setStatus('loading');
      setCurrentStep(1);
      
      // 构建API URL用于调试
      const apiBaseUrl = import.meta.env.VITE_API_URL || 'https://nodered.jzz77.cn:9003';
      const apiUrl = `${apiBaseUrl}/api/forms/${formId}/verify-submission`;
      
      // 记录请求开始时间
      const requestStartTime = new Date();
      setDebugInfo(prev => ({ 
        ...prev, 
        apiUrl,
        requestTime: requestStartTime.toISOString()
      }));
      
      // 延迟一点时间以显示加载动画
      await new Promise(resolve => setTimeout(resolve, 1000));
      setCurrentStep(2);
      
      // 调用API验证数据写入状态
      console.log(`正在调用验证API: ${apiUrl}`);
      const response = await formService.verifyFormSubmission(formId);
      
      // 记录响应时间
      const responseTime = new Date();
      setDebugInfo(prev => ({ 
        ...prev, 
        responseTime: responseTime.toISOString(),
        responseData: response
      }));
      
      // 再延迟一点时间以显示数据库处理动画
      await new Promise(resolve => setTimeout(resolve, 1000));
      setCurrentStep(3);
      
      if (response.success) {
        setStatus('success');
        setMessage(response.message || '数据已成功写入数据库');
        setDetails(response.details || '');
      } else {
        setStatus('error');
        setMessage(response.message || '数据写入失败');
        setDetails(response.details || '请联系管理员检查问题');
      }
    } catch (error) {
      console.error('验证表单提交错误:', error);
      setStatus('error');
      setMessage('验证过程中发生错误');
      setDetails('请稍后重试或联系管理员');
      setCurrentStep(3);
      setDebugInfo(prev => ({ 
        ...prev, 
        error: {
          message: error.message,
          stack: error.stack,
          response: error.response?.data
        }
      }));
    }
  };

  // 返回表单列表
  const handleBackToList = () => {
    const params = new URLSearchParams(location.search);
    const formId = params.get('formId');
    
    if (standalone) {
      // 在独立窗口模式下，尝试先打开原窗口再关闭当前窗口
      try {
        // 如果有opener，则聚焦原窗口并导航
        if (window.opener) {
          window.opener.location.href = '/#/forms/list';
          window.opener.focus();
          window.close();
        } else {
          // 如果在iframe中，尝试在父窗口导航
          if (window.parent && window.parent !== window) {
            window.parent.location.href = '/#/forms/list';
          } else {
            // 如果无法关闭窗口，则在当前窗口导航
            window.location.href = '/#/forms/list';
          }
        }
      } catch (e) {
        console.error('无法导航到表单列表:', e);
        // 降级方案：在当前窗口导航
        window.location.href = '/#/forms/list';
      }
    } else {
      // 在内嵌模式下，使用路由导航
      navigate('/forms/list');
    }
  };

  // 修改填报 - 返回填报页面 (简化版)
  const handleEditSubmission = () => {
    // 直接关闭当前窗口，无需跳转
    if (standalone) {
      try {
        window.close();
      } catch (e) {
        console.error('无法关闭窗口:', e);
        // 如果关闭失败，尝试返回上一页
        window.history.back();
      }
    } else {
      // 如果是嵌入式模式，直接使用浏览器的返回功能
      window.history.back();
    }
  };

  // 切换调试模式
  const toggleDebugMode = () => {
    setDebugMode(!debugMode);
  };

  // 渲染调试信息
  const renderDebugInfo = () => (
    <Collapse 
      ghost
      style={{ marginTop: '20px', border: '1px dashed #ccc', borderRadius: '8px' }}
    >
      <Panel 
        header={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BugOutlined /> 调试信息
          </div>
        } 
        key="1"
      >
        <div style={{ background: '#f5f5f5', padding: '16px', borderRadius: '4px' }}>
          <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
            <b>表单ID:</b> {debugInfo.formId || '未提供'}{'\n'}
            <b>API地址:</b> {debugInfo.apiUrl || '未调用'}{'\n'}
            <b>请求时间:</b> {debugInfo.requestTime || '未调用'}{'\n'}
            <b>响应时间:</b> {debugInfo.responseTime || '未收到响应'}{'\n'}
            <b>当前步骤:</b> {currentStep}{'\n'}
            <b>状态:</b> {status}{'\n'}
            <b>独立模式:</b> {standalone ? '是' : '否'}{'\n\n'}
            <b>响应数据:</b>{'\n'}
            {debugInfo.responseData ? JSON.stringify(debugInfo.responseData, null, 2) : '暂无数据'}{'\n\n'}
            <b>错误信息:</b>{'\n'}
            {debugInfo.error ? JSON.stringify(debugInfo.error, null, 2) : '无错误'}
          </pre>
        </div>
      </Panel>
    </Collapse>
  );

  // 渲染加载中状态
  const renderLoading = () => (
    <Result
      icon={<Spin size="large" />}
      title="正在验证数据写入状态"
      subTitle="请稍候，系统正在处理您的表单数据..."
    />
  );

  // 渲染成功状态 - 只显示一个关闭窗口按钮
  const renderSuccess = () => (
    <Result
      status="success"
      icon={<CheckCircleOutlined />}
      title="数据验证成功"
      subTitle={message}
      extra={[
        <Button type="primary" key="close" onClick={handleBackToList}>
          关闭窗口
        </Button>
      ]}
    >
      {details && (
        <div className="result-details">
          <Paragraph>{details}</Paragraph>
        </div>
      )}
    </Result>
  );

  // 渲染错误状态 - 显示三个按钮：重试、修改填报、关闭窗口
  const renderError = () => (
    <Result
      status="error"
      icon={<CloseCircleOutlined />}
      title="数据验证失败"
      subTitle={message}
      extra={[
        <Button type="primary" key="retry" onClick={handleRetry}>
          重试
        </Button>,
        <Button key="edit" onClick={handleEditSubmission}>
          修改填报
        </Button>,
        <Button key="close" onClick={handleBackToList}>
          关闭窗口
        </Button>
      ]}
    >
      {details && (
        <div className="result-details">
          <Paragraph>
            <Text type="danger">{details}</Text>
          </Paragraph>
        </div>
      )}
    </Result>
  );

  // 处理步骤图标
  const getStepIcon = (step) => {
    if (currentStep > step) {
      return <CheckCircleOutlined />;
    }
    if (currentStep === step) {
      if (status === 'error' && step === 3) {
        return <CloseCircleOutlined />;
      }
      return <LoadingOutlined />;
    }
    return null;
  };

  // 重试验证
  const handleRetry = () => {
    const params = new URLSearchParams(location.search);
    const formId = params.get('formId');
    verifySubmission(formId);
  };

  // 渲染主要内容
  const renderContent = () => (
    <>
      <div className={styles['verification-steps']}>
        <Steps current={currentStep - 1} status={status === 'error' ? 'error' : 'process'}>
          <Step 
            title="表单提交" 
            description="已提交表单数据"
            icon={getStepIcon(1)} 
          />
          <Step 
            title="API处理" 
            description="后端处理表单数据"
            icon={getStepIcon(2)} 
          />
          <Step 
            title="数据库写入" 
            description="数据写入数据库"
            icon={getStepIcon(3)} 
          />
        </Steps>
      </div>
      
      <div className={styles['verification-result']} style={{ marginTop: '30px' }}>
        {status === 'loading' && renderLoading()}
        {status === 'success' && renderSuccess()}
        {status === 'error' && renderError()}
      </div>
    </>
  );

  // 如果是独立模式，使用简化布局
  if (standalone) {
    return (
      <div className={styles['standalone-verify-container']} 
           style={{ 
             maxWidth: '1000px', 
             margin: '20px auto', 
             padding: '20px',
             height: 'calc(100vh - 40px)',
             display: 'flex',
             flexDirection: 'column'
           }}>
        <Card
          title={
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <DatabaseOutlined /> 表单数据验证
              </div>
              <Button
                type="text"
                icon={<BugOutlined />}
                onClick={toggleDebugMode}
                title="切换调试模式"
              />
            </div>
          }
          bordered
          style={{ 
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            flex: 1,
            display: 'flex',
            flexDirection: 'column'
          }}
          bodyStyle={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
          }}
        >
          {renderContent()}
          {debugMode && renderDebugInfo()}
        </Card>
      </div>
    );
  }

  // 默认布局 (包含在MainLayout中)
  return (
    <div className={styles['form-verify-container']}>
      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <DatabaseOutlined /> 表单数据验证
            </div>
            <Button
              type="text"
              icon={<BugOutlined />}
              onClick={toggleDebugMode}
              title="切换调试模式"
            />
          </div>
        }
        style={{
          minHeight: '500px',
          display: 'flex',
          flexDirection: 'column'
        }}
        bodyStyle={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center'
        }}
      >
        {renderContent()}
        {debugMode && renderDebugInfo()}
      </Card>
    </div>
  );
};

export default FormSubmissionVerify; 