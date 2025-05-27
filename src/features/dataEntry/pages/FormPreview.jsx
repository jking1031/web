import React, { useState, useEffect, useRef } from 'react';
import { Card, Spin, message, Button, Modal, Space, Typography, Alert, Collapse } from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import { FullscreenOutlined, FullscreenExitOutlined, LeftOutlined, FormOutlined, BugOutlined, AlertOutlined } from '@ant-design/icons';
import { formService } from '../services/formService';
import styles from '../styles/FormModule.module.scss';

const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;

const FormPreview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  const [debugInfo, setDebugInfo] = useState({
    formId: '',
    formData: null,
    messageEvents: [],
    embedUrl: '',
    apiResponse: null,
    error: null
  });
  const iframeRef = useRef(null);
  const [verifyModalVisible, setVerifyModalVisible] = useState(false);

  // 开启调试模式的处理函数
  const toggleDebugMode = () => {
    setDebugMode(!debugMode);
  };

  // Load form data when component mounts or ID changes
  useEffect(() => {
    loadForm();
    
    // 初始化调试信息中的表单ID
    setDebugInfo(prev => ({
      ...prev,
      formId: id
    }));
  }, [id]);

  // Set up fullscreen change event listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Set up message listener for form submissions
  useEffect(() => {
    const handleMessage = async (event) => {
      // 确保form已加载
      if (!form || !form.embedUrl) return;
      
      // 记录所有接收到的消息事件用于调试
      setDebugInfo(prev => ({
        ...prev, 
        messageEvents: [...prev.messageEvents, {
          time: new Date().toISOString(),
          origin: event.origin,
          data: event.data
        }]
      }));
      
      try {
        // 获取嵌入表单的源域名
        let formOrigin;
        try {
          formOrigin = new URL(form.embedUrl).origin;
        } catch (error) {
          console.error('Invalid URL:', form.embedUrl);
          setDebugInfo(prev => ({
            ...prev,
            error: {
              ...prev.error,
              urlError: `无效的URL: ${form.embedUrl}, 错误: ${error.message}`
            }
          }));
          return;
        }
        
        // 记录源域名匹配情况
        console.log(`消息来源: ${event.origin}, 表单域名: ${formOrigin}`);
        
        // 处理所有消息，但记录匹配情况
        const isOriginMatch = event.origin === formOrigin;
        setDebugInfo(prev => ({
          ...prev,
          originMatch: {
            messageOrigin: event.origin,
            formOrigin: formOrigin,
            isMatch: isOriginMatch
          }
        }));
        
        // 检查是否是表单提交消息
        if (event.data && event.data.type === 'form-submission') {
          // 记录表单数据
          setDebugInfo(prev => ({
            ...prev,
            formData: event.data.formData
          }));
          
          // 尝试提交数据到后端
          try {
            console.log(`正在提交表单数据到后端...`);
            const response = await formService.submitFormData(id, event.data.formData);
            
            // 记录API响应
            setDebugInfo(prev => ({
              ...prev,
              apiResponse: response
            }));
            
            message.success('表单提交成功');
            setFormSubmitted(true);
            
            // 显示验证结果模态框
            if (window.innerWidth >= 768) {
              // 较大屏幕上打开验证模态框
              setVerifyModalVisible(true);
            } else {
              // 小屏幕上打开新窗口
              openVerificationInNewWindow();
            }
          } catch (submitError) {
            console.error('提交表单数据错误:', submitError);
            message.error('表单提交失败');
            
            setDebugInfo(prev => ({
              ...prev,
              error: {
                ...prev.error,
                submitError: {
                  message: submitError.message,
                  response: submitError.response?.data
                }
              }
            }));
          }
        }
      } catch (error) {
        console.error('处理表单提交错误:', error);
        message.error('表单提交处理失败');
        
        setDebugInfo(prev => ({
          ...prev,
          error: {
            ...prev.error,
            generalError: {
              message: error.message,
              stack: error.stack
            }
          }
        }));
      }
    };
    
    window.addEventListener('message', handleMessage);
    
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [form, id, navigate]);

  const loadForm = async () => {
    try {
      setLoading(true);
      console.log(`正在加载表单数据，ID: ${id}`);
      
      const response = await formService.getForm(id);
      if (response.success) {
        // 处理表单数据
        const formData = response.data;
        
        // 记录原始embedUrl用于调试
        setDebugInfo(prev => ({
          ...prev,
          originalEmbedUrl: formData.embedUrl
        }));
        
        // 不修改第三方表单URL，直接使用原始URL
        if (formData.embedUrl) {
          try {
            // 仅验证URL是否有效，不做任何修改
            new URL(formData.embedUrl);
            console.log(`使用原始嵌入URL: ${formData.embedUrl}`);
          } catch (urlError) {
            console.error('URL解析错误:', urlError);
            // 只记录错误但不修改URL
            setDebugInfo(prev => ({
              ...prev,
              error: {
                ...prev.error,
                urlError: `URL解析错误: ${urlError.message}，但仍使用原始URL`
              }
            }));
          }
        } else {
          console.warn('表单没有提供embedUrl');
        }
        
        setForm(formData);
        
        // 记录表单数据
        setDebugInfo(prev => ({
          ...prev,
          formDetail: formData
        }));
      } else {
        message.error(response.message || 'Failed to load form');
        
        setDebugInfo(prev => ({
          ...prev,
          error: {
            ...prev.error,
            loadError: response.message || 'Failed to load form'
          }
        }));
      }
    } catch (error) {
      console.error('Error loading form:', error);
      message.error('Failed to load form. Please try again later.');
      
      setDebugInfo(prev => ({
        ...prev,
        error: {
          ...prev.error,
          loadException: {
            message: error.message,
            stack: error.stack
          }
        }
      }));
    } finally {
      setLoading(false);
    }
  };

  // 在新窗口中打开验证页面
  const openVerificationInNewWindow = () => {
    // 构建验证页面URL
    const verifyUrl = `/#/form-verify?formId=${id}`;
    
    // 打开新窗口
    const verifyWindow = window.open(
      verifyUrl,
      'formVerification',
      'width=600,height=700,resizable=yes,scrollbars=yes'
    );
    
    // 确保窗口成功打开
    if (verifyWindow) {
      console.log(`验证窗口已打开: ${verifyUrl}`);
      verifyWindow.focus();
    } else {
      console.error('无法打开验证窗口，可能被浏览器拦截');
      message.warning('验证窗口被浏览器拦截，请允许弹出窗口或检查浏览器设置');
      
      // 如果无法打开新窗口，则打开模态框
      setVerifyModalVisible(true);
    }
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
            <b>表单ID:</b> {id || '未提供'}{'\n'}
            <b>表单名称:</b> {form?.title || '未加载'}{'\n'}
            <b>原始嵌入URL:</b> {debugInfo.originalEmbedUrl || '未加载'}{'\n'}
            <b>修改后嵌入URL:</b> {debugInfo.modifiedEmbedUrl || '未修改'}{'\n'}
            <b>提交状态:</b> {formSubmitted ? '已提交' : '未提交'}{'\n\n'}
            <b>表单数据:</b>{'\n'}
            {debugInfo.formData ? JSON.stringify(debugInfo.formData, null, 2) : '暂无数据'}{'\n\n'}
            <b>消息事件:</b>{'\n'}
            {debugInfo.messageEvents.length > 0 
              ? JSON.stringify(debugInfo.messageEvents, null, 2) 
              : '暂无消息'}{'\n\n'}
            <b>源匹配:</b>{'\n'}
            {debugInfo.originMatch 
              ? JSON.stringify(debugInfo.originMatch, null, 2) 
              : '未匹配'}{'\n\n'}
            <b>API响应:</b>{'\n'}
            {debugInfo.apiResponse 
              ? JSON.stringify(debugInfo.apiResponse, null, 2) 
              : '暂无响应'}{'\n\n'}
            <b>错误信息:</b>{'\n'}
            {debugInfo.error 
              ? JSON.stringify(debugInfo.error, null, 2) 
              : '无错误'}
          </pre>
        </div>
      </Panel>
    </Collapse>
  );

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  const handleBackToList = () => {
    navigate('/forms/list');
  };

  // 关闭验证模态框
  const handleCloseVerifyModal = () => {
    setVerifyModalVisible(false);
  };

  // Add script for form embed
  const injectEmbedScript = () => {
    if (form && iframeRef.current) {
      if (form.embedType !== 'iframe') {
        // Create a script element for iframe integration
        const script = document.createElement('script');
        script.src = 'https://opnform.com/widgets/iframe.min.js';
        script.onload = () => {
          if (window.initEmbed) {
            window.initEmbed(`form-${form.id}`);
          }
        };
        document.body.appendChild(script);
        
        return () => {
          document.body.removeChild(script);
        };
      }
    }
  };

  useEffect(() => {
    injectEmbedScript();
  }, [form]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 0' }}>
        <Spin size="large" />
        <div style={{ marginTop: '20px' }}>
          <Text type="secondary">正在加载表单...</Text>
        </div>
      </div>
    );
  }

  if (!form) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 0' }}>
        <Title level={4}>表单不存在或已被删除</Title>
        <Button 
          type="primary" 
          onClick={handleBackToList}
          style={{ marginTop: '20px' }}
        >
          返回表单列表
        </Button>
        {renderDebugInfo()}
      </div>
    );
  }

  return (
    <div className={`${styles['form-preview-container']} ${isFullscreen ? styles.fullscreen : ''}`}>
      <Card 
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FormOutlined /> {form.title}
          </div>
        }
        extra={
          <Space>
            <Button
              type="text"
              icon={<BugOutlined />}
              onClick={toggleDebugMode}
              title="切换调试模式"
            />
            <Button 
              type="default"
              icon={<LeftOutlined />} 
              onClick={handleBackToList}
            >
              返回
            </Button>
            <Button 
              type="primary"
              ghost
              icon={isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />} 
              onClick={toggleFullscreen}
            >
              {isFullscreen ? '退出全屏' : '全屏模式'}
            </Button>
          </Space>
        }
      >
        {formSubmitted && (
          <Alert
            message="表单已提交成功"
            description={
              <div>
                您的表单数据已成功提交。
                <Button 
                  type="link" 
                  onClick={openVerificationInNewWindow}
                >
                  打开验证页面
                </Button>
              </div>
            }
            type="success"
            showIcon
            closable
            style={{ marginBottom: '20px' }}
          />
        )}

        {form.description && (
          <div className={styles['form-description']}>{form.description}</div>
        )}

        <div className={styles['iframe-container']} style={{ height: isFullscreen ? 'calc(100vh - 160px)' : '800px' }}>
          {form.embedUrl ? (
            form.embedType === 'iframe' ? (
              <div 
                dangerouslySetInnerHTML={{ 
                  __html: form.embedCode || `<iframe
                    style="border:none;width:100%;height:100%;background-color:#fff;"
                    id="form-${form.id}"
                    src="${form.embedUrl}"
                    title="${form.title}"
                    allow="camera; microphone; geolocation"
                    loading="lazy"
                    referrerpolicy="no-referrer-when-downgrade"
                  ></iframe>` 
                }} 
              />
            ) : (
              <iframe
                ref={iframeRef}
                style={{ 
                  border: 'none', 
                  width: '100%', 
                  height: '100%',
                  backgroundColor: '#fff'
                }}
                id={`form-${form.id}`}
                src={form.embedUrl}
                title={form.title}
                allow="camera; microphone; geolocation"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                onLoad={() => {
                  console.log('iframe已加载');
                  setDebugInfo(prev => ({
                    ...prev,
                    iframeStatus: "已加载"
                  }));
                }}
                onError={() => {
                  console.error('iframe加载失败');
                  setDebugInfo(prev => ({
                    ...prev, 
                    error: {
                      ...prev.error,
                      iframeError: '表单加载失败，请检查原始URL是否有效'
                    },
                    iframeStatus: "加载失败"
                  }));
                }}
              />
            )
          ) : (
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              padding: '20px',
              backgroundColor: '#f9f9f9',
              borderRadius: '8px',
              border: '1px solid #eee'
            }}>
              <AlertOutlined style={{ fontSize: '48px', color: '#faad14', marginBottom: '16px' }} />
              <Title level={4}>无法加载表单</Title>
              <Text type="secondary">表单URL不可用</Text>
              <Button 
                type="primary" 
                style={{ marginTop: '20px' }}
                onClick={loadForm}>
                重试加载
              </Button>
            </div>
          )}
        </div>
        
        {/* 调试信息区域 */}
        {debugMode && renderDebugInfo()}
      </Card>

      {/* 验证结果模态框 */}
      <Modal
        title="表单提交验证"
        open={verifyModalVisible}
        onCancel={handleCloseVerifyModal}
        footer={null}
        width={700}
        destroyOnClose={true}
        style={{ top: 20 }}
        bodyStyle={{ padding: 0, height: '70vh', overflow: 'hidden' }}
      >
        <iframe
          src={`/#/form-verify?formId=${id}`}
          style={{ 
            border: 'none', 
            width: '100%', 
            height: '100%',
            display: 'block' 
          }}
          title="表单验证"
        />
      </Modal>
    </div>
  );
};

export default FormPreview; 