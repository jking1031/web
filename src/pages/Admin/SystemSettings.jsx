/**
 * 系统设置页面
 * 集成用户管理、角色权限管理和API配置功能
 */
import React, { useState } from 'react';
import { Card, Tabs, Typography, Row, Col } from 'antd';
import { UserOutlined, TeamOutlined, ApiOutlined, SettingOutlined } from '@ant-design/icons';
import { usePermission, PermissionGuard } from '../../context/PermissionContext';
import EnhancedUserManagement from './EnhancedUserManagement';
import ApiConfigManager from './components/ApiConfigManager';
import styles from './Settings.module.scss';

const { Title, Paragraph } = Typography;
const { TabPane } = Tabs;

/**
 * 系统设置页面
 * @returns {JSX.Element} 系统设置页面组件
 */
const SystemSettings = () => {
  const { hasPermission } = usePermission();
  const [activeTab, setActiveTab] = useState('users');

  return (
    <div className={styles.settingsContainer}>
      <Card className={styles.settingsCard}>
        <Title level={3}>系统设置</Title>
        <Paragraph>
          在这里管理系统的用户、角色、权限和API配置。请注意，某些功能可能需要管理员权限。
        </Paragraph>
        
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane 
            tab={<span><UserOutlined /> 用户管理</span>} 
            key="users"
            disabled={!hasPermission(['user_manage', 'role_manage'])}
          >
            <PermissionGuard 
              permission={['user_manage', 'role_manage']} 
              fallback={<div className={styles.noPermission}>您没有权限访问用户管理功能</div>}
            >
              <EnhancedUserManagement />
            </PermissionGuard>
          </TabPane>
          
          <TabPane 
            tab={<span><ApiOutlined /> API配置</span>} 
            key="api"
          >
            <ApiConfigManager />
          </TabPane>
          
          <TabPane 
            tab={<span><SettingOutlined /> 系统参数</span>} 
            key="params"
            disabled={!hasPermission('system_config')}
          >
            <PermissionGuard 
              permission="system_config" 
              fallback={<div className={styles.noPermission}>您没有权限访问系统参数配置</div>}
            >
              <div className={styles.systemParamsContainer}>
                <Title level={4}>系统参数配置</Title>
                <Paragraph>
                  在这里配置系统的全局参数，包括系统名称、主题、日志级别等。
                </Paragraph>
                
                <Row gutter={[16, 16]}>
                  <Col span={24}>
                    <Card title="基本设置" className={styles.paramCard}>
                      {/* 系统参数配置表单 */}
                      <div className={styles.comingSoon}>
                        系统参数配置功能即将上线，敬请期待！
                      </div>
                    </Card>
                  </Col>
                </Row>
              </div>
            </PermissionGuard>
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
};

export default SystemSettings;
