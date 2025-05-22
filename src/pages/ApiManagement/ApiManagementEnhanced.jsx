import React, { useState } from 'react';
import { Card, Tabs, Button, Alert, Typography, Space } from 'antd';
import { SyncOutlined, LinkOutlined } from '@ant-design/icons';
import ApiSyncTool from '../../components/ApiSyncTool/ApiSyncTool';

const { TabPane } = Tabs;
const { Title, Paragraph, Text } = Typography;

/**
 * API管理页面的增强组件
 * 添加API同步工具和访问指南
 */
const ApiManagementEnhanced = ({ children }) => {
  const [activeTab, setActiveTab] = useState('1');
  
  // 处理标签切换
  const handleTabChange = (key) => {
    setActiveTab(key);
  };

  // 切换到Hash模式URL
  const switchToHashMode = () => {
    const currentPath = window.location.pathname;
    // 移除开头的斜杠
    const path = currentPath.startsWith('/') ? currentPath.substring(1) : currentPath;
    // 构建Hash模式URL
    const hashUrl = `${window.location.origin}/#/${path}`;
    // 导航到Hash模式URL
    window.location.href = hashUrl;
  };

  return (
    <div>
      <Card style={{ marginBottom: 24 }}>
        <Title level={4}>API管理系统访问指南</Title>
        <Paragraph>
          由于路由模式配置问题，当前环境下请使用带hash的URL格式访问API管理页面。
        </Paragraph>
        <Space>
          <Button 
            type="primary" 
            icon={<LinkOutlined />} 
            onClick={switchToHashMode}
          >
            切换到Hash模式URL
          </Button>
          <Text code>
            {window.location.origin}/#/api-management
          </Text>
        </Space>
      </Card>

      <Tabs activeKey={activeTab} onChange={handleTabChange}>
        <TabPane tab="API管理" key="1">
          {children}
        </TabPane>
        <TabPane tab="API同步工具" key="2">
          <ApiSyncTool />
          
          <Card title="环境同步指南" style={{ marginTop: 24 }}>
            <Alert
              message="为什么不同环境下API列表不一致？"
              description={
                <div>
                  <Paragraph>
                    API注册机制依赖于浏览器的localStorage，不同环境下的localStorage内容可能不同，导致显示的API列表不一致。
                  </Paragraph>
                  <Paragraph>
                    <strong>常见原因：</strong>
                  </Paragraph>
                  <ul>
                    <li>本地环境localStorage中已有旧的API注册信息</li>
                    <li>新添加的API（如工单相关API）未被自动注册</li>
                    <li>不同环境下的初始化流程不一致</li>
                  </ul>
                </div>
              }
              type="info"
              showIcon
            />
            
            <Alert
              message="如何确保所有环境API列表一致"
              description={
                <ol>
                  <li>在每个环境中使用"API同步工具"执行同步操作</li>
                  <li>同步后刷新页面，查看更新后的API列表</li>
                  <li>确认所有环境中显示相同的API列表</li>
                </ol>
              }
              type="success"
              showIcon
              style={{ marginTop: 16 }}
            />
          </Card>
        </TabPane>
      </Tabs>
    </div>
  );
};

export default ApiManagementEnhanced;
