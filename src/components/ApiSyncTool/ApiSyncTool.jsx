import React, { useState } from 'react';
import { Button, Typography, Card, Space, Alert, message } from 'antd';
import { SyncOutlined, ClearOutlined, CheckCircleOutlined } from '@ant-design/icons';
import syncApiRegistry, { clearApiRegistry } from '../../scripts/syncApiRegistry';

/**
 * API同步组件
 * 用于同步不同环境下的API注册
 */
const ApiSyncTool = () => {
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState(null);

  // 同步API注册
  const handleSync = () => {
    setSyncing(true);
    setResult(null);
    
    try {
      const success = syncApiRegistry();
      
      if (success) {
        setResult({
          status: 'success',
          message: 'API注册同步成功！请刷新页面查看更新后的API列表。'
        });
        message.success('API注册同步成功！');
      } else {
        setResult({
          status: 'error',
          message: 'API注册同步失败，请查看控制台获取详细错误信息。'
        });
        message.error('API注册同步失败！');
      }
    } catch (error) {
      setResult({
        status: 'error',
        message: `API注册同步出错: ${error.message}`
      });
      message.error('API注册同步出错！');
      console.error('API注册同步出错:', error);
    } finally {
      setSyncing(false);
    }
  };

  // 清除API注册
  const handleClear = () => {
    try {
      const success = clearApiRegistry();
      
      if (success) {
        setResult({
          status: 'success',
          message: 'API注册信息已清除！请刷新页面查看更新。'
        });
        message.success('API注册信息已清除！');
      } else {
        setResult({
          status: 'error',
          message: '清除API注册信息失败，请查看控制台获取详细错误信息。'
        });
        message.error('清除API注册信息失败！');
      }
    } catch (error) {
      setResult({
        status: 'error',
        message: `清除API注册信息出错: ${error.message}`
      });
      message.error('清除API注册信息出错！');
      console.error('清除API注册信息出错:', error);
    }
  };

  return (
    <Card title="API同步工具" style={{ marginBottom: 24 }}>
      <Typography.Paragraph>
        此工具用于同步不同环境下的API注册，确保所有环境中API管理页面显示相同的API列表。
      </Typography.Paragraph>
      
      <Space direction="vertical" style={{ width: '100%' }}>
        <Space>
          <Button 
            type="primary" 
            icon={<SyncOutlined />} 
            loading={syncing} 
            onClick={handleSync}
          >
            同步API注册
          </Button>
          
          <Button 
            danger 
            icon={<ClearOutlined />} 
            onClick={handleClear}
          >
            清除API注册
          </Button>
        </Space>
        
        {result && (
          <Alert
            message={result.status === 'success' ? "操作成功" : "操作失败"}
            description={result.message}
            type={result.status}
            showIcon
            icon={result.status === 'success' ? <CheckCircleOutlined /> : undefined}
          />
        )}
        
        <Alert
          message="使用说明"
          description={
            <ol>
              <li>点击"同步API注册"按钮，将重置并注册所有默认API</li>
              <li>点击"清除API注册"按钮，将清除所有API注册信息</li>
              <li>操作完成后，请刷新页面查看更新后的API列表</li>
              <li>如需访问API管理页面，请使用带hash的URL格式: <Typography.Text code>/#/api-management</Typography.Text></li>
            </ol>
          }
          type="info"
          showIcon
        />
      </Space>
    </Card>
  );
};

export default ApiSyncTool;
