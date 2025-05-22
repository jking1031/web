import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Row, Col, Card, Tabs, Badge, Button, Table, Spin, Empty, Statistic, Descriptions, Alert, message, Tag } from 'antd';
import {
  LeftOutlined,
  AlertOutlined,
  LineChartOutlined,
  ClockCircleOutlined,
  AppstoreOutlined,
  ApartmentOutlined,
  SettingOutlined,
  ReloadOutlined,
  LinkOutlined,
  DisconnectOutlined
} from '@ant-design/icons';
import apiManager from '../../services/apiManager';
import { useWebSocket } from '../../context/WebSocketContext';
import styles from './SiteDetail.module.scss';

/**
 * 站点详情页面组件
 * @returns {JSX.Element} 站点详情页面
 */
const SiteDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [site, setSite] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [lastUpdateTime, setLastUpdateTime] = useState(new Date());

  // WebSocket相关状态和方法
  const { connected, connect, disconnect, lastMessage, sendMessage } = useWebSocket();
  const [pendingCommands, setPendingCommands] = useState({});

  useEffect(() => {
    const fetchSiteDetail = async () => {
      try {
        // 通过API管理器调用获取站点详情API
        const response = await apiManager.callApi('getSiteById', { id });
        
        if (response && response.success) {
          setSite(response.data);
        } else {
          throw new Error(response?.message || '获取站点详情失败');
        }
      } catch (error) {
        console.error('获取站点详情失败', error);
        message.error('获取站点详情失败: ' + (error.message || '未知错误'));
        // 使用模拟数据
        setSite(getMockSiteDetail(id));
      } finally {
        setLoading(false);
      }
    };

    fetchSiteDetail();
  }, [id]);

  // 获取模拟数据
  const getMockSiteDetail = (siteId) => {
    return {
      id: parseInt(siteId),
      name: `站点${siteId}`,
      location: '北京市朝阳区',
      status: 'online',
      lastUpdate: '2023-05-20 14:30:45',
      type: '污水处理厂',
      capacity: '50000吨/日',
      contactPerson: '张工',
      contactPhone: '13800138000',
      description: '这是一个示例站点描述，实际运行中将显示真实数据。',
      devices: [
        { id: 1, name: '1号进水泵', status: 'running', location: '进水泵房', lastUpdate: '2023-05-20 14:30:45' },
        { id: 2, name: '2号进水泵', status: 'stopped', location: '进水泵房', lastUpdate: '2023-05-20 14:28:12' },
        { id: 3, name: '1号鼓风机', status: 'running', location: '鼓风机房', lastUpdate: '2023-05-20 14:29:30' },
        { id: 4, name: 'pH传感器', status: 'running', location: '生化池', lastUpdate: '2023-05-20 14:30:00' },
        { id: 5, name: '溶解氧传感器', status: 'warning', location: '生化池', lastUpdate: '2023-05-20 14:25:18' },
      ],
      alarms: [
        { id: 1, device: '溶解氧传感器', message: '溶解氧浓度过低', level: 'warning', time: '2023-05-20 14:25:18' },
        { id: 2, device: '出水pH计', message: 'pH值超出范围', level: 'error', time: '2023-05-20 13:15:22' },
      ],
      stats: {
        deviceTotal: 24,
        deviceRunning: 18,
        deviceStopped: 5,
        deviceWarning: 1,
        alarmTotal: 2,
        alarmCritical: 1,
        alarmWarning: 1,
      }
    };
  };

  // 设备状态列
  const deviceColumns = [
    {
      title: '设备名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '位置',
      dataIndex: 'location',
      key: 'location',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        let statusBadge;
        switch (status) {
          case 'running':
            statusBadge = <Badge status="success" text="运行中" />;
            break;
          case 'stopped':
            statusBadge = <Badge status="default" text="已停止" />;
            break;
          case 'warning':
            statusBadge = <Badge status="warning" text="警告" />;
            break;
          case 'error':
            statusBadge = <Badge status="error" text="错误" />;
            break;
          default:
            statusBadge = <Badge status="processing" text="状态未知" />;
        }
        return statusBadge;
      },
    },
    {
      title: '最后更新时间',
      dataIndex: 'lastUpdate',
      key: 'lastUpdate',
    },
    {
      title: '操作',
      key: 'action',
      render: () => (
        <Button type="link" icon={<SettingOutlined />}>
          管理
        </Button>
      ),
    },
  ];

  // 告警列
  const alarmColumns = [
    {
      title: '设备',
      dataIndex: 'device',
      key: 'device',
    },
    {
      title: '告警信息',
      dataIndex: 'message',
      key: 'message',
    },
    {
      title: '级别',
      dataIndex: 'level',
      key: 'level',
      render: (level) => {
        const badgeStatus = level === 'error' ? 'error' : 'warning';
        const badgeText = level === 'error' ? '严重' : '警告';
        return <Badge status={badgeStatus} text={badgeText} />;
      },
    },
    {
      title: '时间',
      dataIndex: 'time',
      key: 'time',
    },
    {
      title: '操作',
      key: 'action',
      render: () => (
        <Button type="link">处理</Button>
      ),
    },
  ];

  // 返回上一页
  const handleBack = () => {
    navigate('/sites');
  };

  // 刷新数据
  const handleRefresh = () => {
    setLoading(true);
    // 重新获取数据
    setTimeout(() => {
      setLoading(false);
      message.success('数据已刷新');
    }, 1000);
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Spin size="large" />
      </div>
    );
  }

  if (!site) {
    return <Empty description="站点不存在" />;
  }

  return (
    <div className={styles.siteDetailContainer}>
      <div className={styles.header}>
        <div className={styles.backButton}>
          <Button type="link" icon={<LeftOutlined />} onClick={handleBack}>
            返回
          </Button>
        </div>
        <h1 className={styles.pageTitle}>{site.name}</h1>
        <div className={styles.actions}>
          <Button
            icon={<ReloadOutlined />}
            onClick={handleRefresh}
          >
            刷新
          </Button>
        </div>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24}>
          <Card>
            <Descriptions
              title="站点信息"
              bordered
              column={{ xxl: 4, xl: 3, lg: 3, md: 2, sm: 1, xs: 1 }}
            >
              <Descriptions.Item label="站点类型">{site.type}</Descriptions.Item>
              <Descriptions.Item label="处理能力">{site.capacity}</Descriptions.Item>
              <Descriptions.Item label="位置">{site.location}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Badge status={site.status === 'online' ? 'success' : 'error'}
                  text={site.status === 'online' ? '在线' : '离线'}
                />
              </Descriptions.Item>
              <Descriptions.Item label="联系人">{site.contactPerson}</Descriptions.Item>
              <Descriptions.Item label="联系电话">{site.contactPhone}</Descriptions.Item>
              <Descriptions.Item label="最后更新时间">{site.lastUpdate}</Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} className={styles.statsRow}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="设备总数"
              value={site.stats.deviceTotal}
              prefix={<ApartmentOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="运行中设备"
              value={site.stats.deviceRunning}
              prefix={<Badge status="success" />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="告警总数"
              value={site.stats.alarmTotal}
              prefix={<AlertOutlined />}
              valueStyle={{ color: site.stats.alarmTotal > 0 ? '#ff4d4f' : 'inherit' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="最后更新"
              value="刚刚"
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Card className={styles.tabsCard}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'overview',
              label: '概览',
              icon: <AppstoreOutlined />,
              children: (
                <div className={styles.overviewTab}>
                  <p className={styles.siteDescription}>{site.description}</p>

                  {site.alarms && site.alarms.length > 0 && (
                    <div className={styles.alarmSection}>
                      <h3>当前告警</h3>
                      {site.alarms.map((alarm, index) => (
                        <Alert
                          key={index}
                          message={`${alarm.device}: ${alarm.message}`}
                          description={`时间: ${alarm.time}`}
                          type={alarm.level === 'error' ? 'error' : 'warning'}
                          showIcon
                          className={styles.alarmAlert}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ),
            },
            {
              key: 'devices',
              label: '设备状态',
              icon: <ApartmentOutlined />,
              children: (
                <Table
                  columns={deviceColumns}
                  dataSource={site.devices}
                  rowKey="id"
                  pagination={false}
                />
              ),
            },
            {
              key: 'alarms',
              label: '告警记录',
              icon: <AlertOutlined />,
              children: (
                <Table
                  columns={alarmColumns}
                  dataSource={site.alarms}
                  rowKey="id"
                  pagination={false}
                />
              ),
            },
            {
              key: 'data',
              label: '数据趋势',
              icon: <LineChartOutlined />,
              children: (
                <div className={styles.chartSection}>
                  <Empty description="暂无图表数据" />
                </div>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
};

export default SiteDetail;