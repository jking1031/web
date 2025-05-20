import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Row, Col, Card, Tabs, Badge, Button, Spin, Empty, Statistic, Descriptions, Alert, message, Tag, Divider, List, Input, Typography } from 'antd';
const { Text } = Typography;
import {
  LeftOutlined,
  AlertOutlined,
  LineChartOutlined,
  AppstoreOutlined,
  ApartmentOutlined,
  ReloadOutlined,
  TeamOutlined,
  EnvironmentOutlined,
  DashboardOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import api from '../../../api/interceptors';
import { useWebSocket } from '../../../context/WebSocketContext';
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
  const { connected, connect, lastMessage, sendMessage } = useWebSocket();

  // 使用WebSocket获取实时数据
  useEffect(() => {
    if (connected) {
      // 如果WebSocket已连接，发送请求获取站点详情
      console.log('WebSocket已连接，请求站点详情数据');
      sendMessage({
        type: 'get_device_status',
        siteId: id,
        timestamp: Date.now()
      });

      // 发送初始化消息，帮助服务器识别连接
      sendMessage({
        type: 'init',
        siteId: id,
        clientInfo: {
          platform: 'web',
          timestamp: Date.now()
        }
      });
    } else {
      // 如果WebSocket未连接，尝试连接
      console.log('WebSocket未连接，尝试连接');
      connect();
    }
  }, [id, connected, connect, sendMessage]);

  // 处理WebSocket消息
  useEffect(() => {
    if (lastMessage) {
      try {
        const data = JSON.parse(lastMessage.data);
        console.log('收到WebSocket消息:', data);

        // 处理不同类型的消息
        if (data.type === 'device_status') {
          // 设备状态完整更新
          console.log('更新设备状态:', data);

          // 更新站点数据
          setSite(prevSite => {
            if (!prevSite) return prevSite;

            const updatedSite = { ...prevSite };

            // 更新进水数据
            if (data.indata) {
              updatedSite.inData = data.indata;
            }

            // 更新出水数据
            if (data.outdata) {
              updatedSite.outData = data.outdata;
            }

            // 更新设备数据
            if (data.devices) {
              updatedSite.devices = data.devices;
            }

            // 更新设备频率数据
            if (data.deviceFrequency) {
              updatedSite.deviceFrequency = data.deviceFrequency;
            }

            // 更新阀门数据
            if (data.isValve) {
              updatedSite.isValve = data.isValve;
            }

            // 更新部门数据
            if (data.departments) {
              updatedSite.departments = data.departments;
            }

            // 更新统计数据
            if (data.stats) {
              updatedSite.stats = {
                ...updatedSite.stats,
                ...data.stats
              };
            }

            return updatedSite;
          });

          // 更新最后更新时间
          setLastUpdateTime(new Date());
        }
        else if (data.type === 'device_status_change') {
          // 处理增量设备状态更新
          console.log('设备状态变化:', data);

          setSite(prevSite => {
            if (!prevSite) return prevSite;

            const updatedSite = { ...prevSite };

            // 更新设备数据
            if (data.devices && Array.isArray(data.devices)) {
              // 如果prevSite.devices不存在，初始化为空数组
              const currentDevices = updatedSite.devices || [];

              // 创建设备映射，提高更新效率
              const deviceMap = {};
              currentDevices.forEach(device => {
                deviceMap[device.name] = device;
              });

              // 将新状态合并到映射中
              data.devices.forEach(updatedDevice => {
                if (deviceMap[updatedDevice.name]) {
                  deviceMap[updatedDevice.name] = {
                    ...deviceMap[updatedDevice.name],
                    ...updatedDevice
                  };
                } else {
                  // 如果是新设备，直接添加
                  deviceMap[updatedDevice.name] = updatedDevice;
                }
              });

              // 转换回数组
              updatedSite.devices = Object.values(deviceMap);
            }

            // 类似地处理其他数据类型...

            return updatedSite;
          });

          // 更新最后更新时间
          setLastUpdateTime(new Date());
        }
        else if (data.type === 'command_feedback') {
          // 处理命令反馈
          console.log('命令反馈:', data);

          // 这里可以添加命令反馈处理逻辑
          // 例如显示操作成功/失败的消息
          const deviceId = data.deviceId || data.deviceName || data.valveName;
          if (deviceId) {
            if (data.success) {
              message.success(`设备 ${deviceId} 操作成功: ${data.message || ''}`);
            } else {
              message.error(`设备 ${deviceId} 操作失败: ${data.message || '未知错误'}`);
            }
          }
        }
        else if (data.type === 'device_event') {
          // 处理设备事件消息
          console.log('设备事件:', data);

          // 如果是报警事件，可以触发UI提示
          if (data.eventType === 'alarm' && data.alarmDetails) {
            message.warning(`设备报警: ${data.alarmDetails.message || '未知报警'}`);
          }
        }
        else if (data.type === 'pong') {
          // 处理心跳响应
          console.log('收到心跳响应');
        }

        // 更新最后更新时间
        setLastUpdateTime(new Date());
      } catch (error) {
        console.error('处理WebSocket消息失败:', error);
      }
    }
  }, [lastMessage]);

  // 初始加载站点基本信息
  useEffect(() => {
    const fetchSiteDetail = async () => {
      try {
        // 获取站点基本信息
        const response = await api.get(`/api/sites/${id}`);
        setSite(response.data);
      } catch (error) {
        console.error('获取站点详情失败', error);
        message.error('获取站点详情失败');
        // 使用模拟数据
        setSite(getMockSiteDetail(id));
      } finally {
        setLoading(false);
      }
    };

    fetchSiteDetail();
  }, [id]);

  // 获取模拟数据 - 使用后端提供的数据格式
  const getMockSiteDetail = (siteId) => {
    const mockSites = [
      {
        "name": "高铁污水处理厂",
        "status": "在线",
        "alarm": "设施正常",
        "id": 1,
        "address": "砀山县高铁新区",
        "totalInflow": 3522.77,
        "departments": ["部门管理员", "运行班组", "管理员"],
        "description": "高铁污水处理厂位于砀山县高铁新区，主要负责处理高铁新区的生活污水和工业废水。",
        "capacity": "10000吨/日",
        "contactPerson": "唐看",
        "contactPhone": "10000000000",
        "lastUpdate": "2023-05-20 14:30:45",
        "devices": [
          { id: 1, name: '1号进水泵', status: 'running', location: '进水泵房', lastUpdate: '2023-05-20 14:30:45' },
          { id: 2, name: '2号进水泵', status: 'stopped', location: '进水泵房', lastUpdate: '2023-05-20 14:28:12' },
          { id: 3, name: '1号鼓风机', status: 'running', location: '鼓风机房', lastUpdate: '2023-05-20 14:29:30' },
        ],
        "alarms": [
          { id: 1, device: '溶解氧传感器', message: '溶解氧浓度过低', level: 'warning', time: '2023-05-20 14:25:18' },
        ],
        "stats": {
          deviceTotal: 24,
          deviceRunning: 18,
          deviceStopped: 5,
          deviceWarning: 1,
          alarmTotal: 1,
          alarmCritical: 0,
          alarmWarning: 1,
        }
      },
      {
        "name": "5000吨处理站",
        "status": "在线",
        "alarm": "设施正常",
        "id": 2,
        "address": "砀山县道北路",
        "totalInflow": null,
        "departments": ["5000吨处理站", "管理员"],
        "description": "5000吨处理站位于砀山县道北路，主要负责处理周边区域的生活污水。",
        "capacity": "5000吨/日",
        "contactPerson": "李工",
        "contactPhone": "13900139000",
        "lastUpdate": "2023-05-20 13:15:30",
        "devices": [
          { id: 1, name: 'pH传感器', status: 'running', location: '生化池', lastUpdate: '2023-05-20 14:30:00' },
          { id: 2, name: '溶解氧传感器', status: 'warning', location: '生化池', lastUpdate: '2023-05-20 14:25:18' },
        ],
        "alarms": [],
        "stats": {
          deviceTotal: 18,
          deviceRunning: 15,
          deviceStopped: 2,
          deviceWarning: 1,
          alarmTotal: 0,
          alarmCritical: 0,
          alarmWarning: 0,
        }
      },
      {
        "name": "西地亚处理站",
        "status": "在线",
        "alarm": "设施停用",
        "id": 3,
        "address": "砀山县西地亚",
        "totalInflow": null,
        "departments": ["部门管理员", "运行班组", "管理员"],
        "description": "西地亚处理站位于砀山县西地亚区域，目前处于停用状态，计划进行设备升级。",
        "capacity": "3000吨/日",
        "contactPerson": "王工",
        "contactPhone": "13700137000",
        "lastUpdate": "2023-05-19 09:45:20",
        "devices": [],
        "alarms": [
          { id: 1, device: '系统', message: '设施已停用', level: 'warning', time: '2023-05-19 09:45:20' },
        ],
        "stats": {
          deviceTotal: 12,
          deviceRunning: 0,
          deviceStopped: 12,
          deviceWarning: 0,
          alarmTotal: 1,
          alarmCritical: 0,
          alarmWarning: 1,
        }
      },
      {
        "name": "亚琦处理站",
        "status": "在线",
        "alarm": "设施停用",
        "id": 4,
        "address": "砀山县亚琦广场北侧",
        "totalInflow": null,
        "departments": ["部门管理员", "运行班组", "管理员"],
        "description": "亚琦处理站位于砀山县亚琦广场北侧，目前处于停用状态，正在进行设备维护。",
        "capacity": "2000吨/日",
        "contactPerson": "赵工",
        "contactPhone": "13600136000",
        "lastUpdate": "2023-05-18 16:20:10",
        "devices": [],
        "alarms": [
          { id: 1, device: '系统', message: '设施已停用', level: 'warning', time: '2023-05-18 16:20:10' },
        ],
        "stats": {
          deviceTotal: 10,
          deviceRunning: 0,
          deviceStopped: 10,
          deviceWarning: 0,
          alarmTotal: 1,
          alarmCritical: 0,
          alarmWarning: 1,
        }
      }
    ];

    const site = mockSites.find(site => site.id === parseInt(siteId));
    return site || null;
  };





  // 返回上一页
  const handleBack = () => {
    navigate('/sites');
  };

  // 心跳机制
  useEffect(() => {
    let heartbeatInterval;

    if (connected) {
      // 设置心跳间隔，每15秒发送一次
      heartbeatInterval = setInterval(() => {
        try {
          sendMessage({
            type: 'ping',
            timestamp: Date.now(),
            siteId: id,
            clientId: `web_${Math.random().toString(36).substring(7)}`
          });
        } catch (e) {
          console.error('发送心跳失败:', e);
        }
      }, 15000);
    }

    return () => {
      if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
      }
    };
  }, [connected, sendMessage, id]);

  // 设备控制函数
  const handleDeviceControl = useCallback((deviceName, action) => {
    if (!connected) {
      message.error('WebSocket未连接，无法控制设备');
      return;
    }

    try {
      // 发送设备控制命令
      sendMessage({
        type: 'command',
        siteId: id,
        deviceName,
        action,
        timestamp: Date.now()
      });

      message.info(`正在${action === 'start' ? '启动' : '停止'}设备: ${deviceName}`);
    } catch (error) {
      console.error('发送设备控制命令失败:', error);
      message.error('发送控制命令失败');
    }
  }, [connected, sendMessage, id]);

  // 阀门控制函数
  const handleValveControl = useCallback((valveName, action) => {
    if (!connected) {
      message.error('WebSocket未连接，无法控制阀门');
      return;
    }

    try {
      // 发送阀门控制命令
      sendMessage({
        type: 'command',
        siteId: id,
        valveName,
        action,
        timestamp: Date.now()
      });

      message.info(`正在${action === 'open' ? '打开' : '关闭'}阀门: ${valveName}`);
    } catch (error) {
      console.error('发送阀门控制命令失败:', error);
      message.error('发送控制命令失败');
    }
  }, [connected, sendMessage, id]);

  // 频率设置函数
  const handleSetFrequency = useCallback((deviceName, frequency) => {
    if (!connected) {
      message.error('WebSocket未连接，无法设置频率');
      return;
    }

    try {
      // 发送频率设置命令
      sendMessage({
        type: 'command',
        siteId: id,
        deviceName,
        frequency: parseFloat(frequency),
        timestamp: Date.now()
      });

      message.info(`正在设置设备 ${deviceName} 的频率为 ${frequency} Hz`);
    } catch (error) {
      console.error('发送频率设置命令失败:', error);
      message.error('发送控制命令失败');
    }
  }, [connected, sendMessage, id]);

  // 刷新数据
  const handleRefresh = () => {
    setLoading(true);

    // 通过WebSocket请求最新数据
    if (connected) {
      sendMessage({
        type: 'get_device_status',
        siteId: id,
        timestamp: Date.now()
      });

      // 设置短暂的加载状态
      setTimeout(() => {
        setLoading(false);
        setLastUpdateTime(new Date());
        message.success('数据已刷新');
      }, 1000);
    } else {
      // 如果WebSocket未连接，尝试连接
      connect();
      message.warning('正在连接服务器，请稍后再试');
      setLoading(false);
    }
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
              title={
                <div style={{ display: 'flex', alignItems: 'center', color: '#2E7D32' }}>
                  <AppstoreOutlined style={{ marginRight: 8 }} />
                  <span>站点信息</span>
                </div>
              }
              bordered
              column={{ xxl: 4, xl: 3, lg: 3, md: 2, sm: 1, xs: 1 }}
              labelStyle={{ fontWeight: 500 }}
            >
              <Descriptions.Item label="站点状态">
                <Badge
                  status={site.status === '在线' ? 'success' : 'error'}
                  text={site.status}
                />
              </Descriptions.Item>
              <Descriptions.Item label="设施状态">
                <Tag color={
                  site.alarm === '设施正常' ? 'success' :
                  site.alarm === '设施停用' ? 'warning' : 'error'
                }>
                  {site.alarm}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="处理能力">{site.capacity || '未知'}</Descriptions.Item>
              <Descriptions.Item label="位置">
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <EnvironmentOutlined style={{ marginRight: 4, color: '#2E7D32' }} />
                  {site.address}
                </div>
              </Descriptions.Item>
              {site.totalInflow !== null && (
                <Descriptions.Item label="总进水量">
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <DashboardOutlined style={{ marginRight: 4, color: '#2E7D32' }} />
                    {site.totalInflow.toFixed(2)} 吨
                  </div>
                </Descriptions.Item>
              )}
              <Descriptions.Item label="联系人">{site.contactPerson || '未设置'}</Descriptions.Item>
              <Descriptions.Item label="联系电话">{site.contactPhone || '未设置'}</Descriptions.Item>
              <Descriptions.Item label="最后更新时间">{site.lastUpdate || '未知'}</Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} className={styles.statsRow}>
        <Col xs={24} sm={12} md={6}>
          <Card hoverable style={{ borderTop: '4px solid #2E7D32' }}>
            <Statistic
              title={
                <div style={{ display: 'flex', alignItems: 'center', color: '#2E7D32' }}>
                  <ApartmentOutlined style={{ marginRight: 8 }} />
                  <span>设备总数</span>
                </div>
              }
              value={site.stats?.deviceTotal || 0}
              valueStyle={{ color: '#2E7D32', fontSize: '24px' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card hoverable style={{ borderTop: '4px solid #52c41a' }}>
            <Statistic
              title={
                <div style={{ display: 'flex', alignItems: 'center', color: '#52c41a' }}>
                  <Badge status="success" style={{ marginRight: 8 }} />
                  <span>运行中设备</span>
                </div>
              }
              value={site.stats?.deviceRunning || 0}
              valueStyle={{ color: '#52c41a', fontSize: '24px' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card hoverable style={{ borderTop: '4px solid #ff4d4f' }}>
            <Statistic
              title={
                <div style={{ display: 'flex', alignItems: 'center', color: site.stats?.alarmTotal > 0 ? '#ff4d4f' : 'rgba(0, 0, 0, 0.45)' }}>
                  <AlertOutlined style={{ marginRight: 8 }} />
                  <span>告警总数</span>
                </div>
              }
              value={site.stats?.alarmTotal || 0}
              valueStyle={{
                color: site.stats?.alarmTotal > 0 ? '#ff4d4f' : 'rgba(0, 0, 0, 0.45)',
                fontSize: '24px'
              }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card hoverable style={{ borderTop: '4px solid #1890ff' }}>
            <Statistic
              title={
                <div style={{ display: 'flex', alignItems: 'center', color: '#1890ff' }}>
                  <TeamOutlined style={{ marginRight: 8 }} />
                  <span>管理部门</span>
                </div>
              }
              value={site.departments?.length || 0}
              valueStyle={{ color: '#1890ff', fontSize: '24px' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card hoverable style={{ borderTop: '4px solid #722ed1' }}>
            <Statistic
              title={
                <div style={{ display: 'flex', alignItems: 'center', color: '#722ed1' }}>
                  <ClockCircleOutlined style={{ marginRight: 8 }} />
                  <span>最后更新</span>
                </div>
              }
              value={
                lastUpdateTime
                  ? `${lastUpdateTime.getHours().toString().padStart(2, '0')}:${lastUpdateTime.getMinutes().toString().padStart(2, '0')}`
                  : '未知'
              }
              valueStyle={{ color: '#722ed1', fontSize: '24px' }}
              suffix={lastUpdateTime ? `${lastUpdateTime.getMonth() + 1}月${lastUpdateTime.getDate()}日` : ''}
            />
          </Card>
        </Col>
      </Row>

      {/* 第二部分：设备信息（由后端API推送，可通过WebSocket控制） */}
      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center', color: '#2E7D32' }}>
            <ApartmentOutlined style={{ marginRight: 8 }} />
            <span>设备信息</span>
            <Tag color="blue" style={{ marginLeft: 8 }}>WebSocket推送</Tag>
          </div>
        }
        className={styles.sectionCard}
      >
        <div className={styles.connectionStatus}>
          <Badge
            status={connected ? 'success' : 'error'}
            text={connected ? '设备控制已连接' : '设备控制未连接'}
          />
          {!connected && (
            <Button
              type="primary"
              size="small"
              onClick={connect}
              style={{ marginLeft: 16 }}
            >
              连接
            </Button>
          )}
        </div>

        {site.devices && site.devices.length > 0 ? (
          <Row gutter={[16, 16]}>
            {site.devices.map(device => (
              <Col xs={24} sm={12} md={8} lg={6} key={device.id || device.name}>
                <Card
                  hoverable
                  style={{
                    borderTop: '4px solid',
                    borderTopColor: device.status === 'running' ? '#52c41a' : '#ff4d4f'
                  }}
                >
                  <div style={{ marginBottom: 8 }}>
                    <Text strong>{device.name}</Text>
                    <Badge
                      status={device.status === 'running' ? 'success' : 'error'}
                      text={device.status === 'running' ? '运行中' : '已停止'}
                      style={{ float: 'right' }}
                    />
                  </div>

                  {device.location && (
                    <div style={{ marginBottom: 8, color: 'rgba(0, 0, 0, 0.45)' }}>
                      <EnvironmentOutlined style={{ marginRight: 4 }} />
                      {device.location}
                    </div>
                  )}

                  <div style={{ marginTop: 16 }}>
                    <Button
                      type="primary"
                      style={{ backgroundColor: '#52c41a', marginRight: 8 }}
                      disabled={device.status === 'running'}
                      onClick={() => handleDeviceControl(device.name, 'start')}
                    >
                      启动
                    </Button>
                    <Button
                      danger
                      disabled={device.status !== 'running'}
                      onClick={() => handleDeviceControl(device.name, 'stop')}
                    >
                      停止
                    </Button>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        ) : (
          <Empty description="暂无设备数据" />
        )}

        {site.deviceFrequency && site.deviceFrequency.length > 0 && (
          <>
            <Divider />
            <h3 style={{ color: '#2E7D32', display: 'flex', alignItems: 'center', marginBottom: 16 }}>
              <DashboardOutlined style={{ marginRight: 8 }} />
              频率设备
            </h3>

            <Row gutter={[16, 16]}>
              {site.deviceFrequency.map(device => (
                <Col xs={24} sm={12} md={8} lg={6} key={device.id || device.name}>
                  <Card hoverable style={{ borderTop: '4px solid #1890ff' }}>
                    <div style={{ marginBottom: 8 }}>
                      <Text strong>{device.name}</Text>
                    </div>

                    <Statistic
                      title="当前频率"
                      value={device.hz?.toFixed(2) || '0.00'}
                      suffix="Hz"
                      precision={2}
                      valueStyle={{ color: '#1890ff' }}
                    />

                    {device.sethz !== undefined && (
                      <div style={{ marginTop: 8, color: 'rgba(0, 0, 0, 0.45)' }}>
                        设定值: {device.sethz?.toFixed(2) || '0.00'} Hz
                      </div>
                    )}

                    <div style={{ marginTop: 16 }}>
                      <div style={{ display: 'flex' }}>
                        <Input
                          style={{ width: 'calc(100% - 80px)' }}
                          placeholder="设置频率"
                          suffix="Hz"
                          type="number"
                          step={0.1}
                          min={0}
                          max={50}
                          defaultValue={device.sethz?.toFixed(1) || ''}
                          id={`freq-input-${device.name}`}
                        />
                        <Button
                          type="primary"
                          style={{ width: '80px' }}
                          onClick={() => {
                            const input = document.getElementById(`freq-input-${device.name}`);
                            if (input && input.value) {
                              handleSetFrequency(device.name, input.value);
                            }
                          }}
                        >
                          设置
                        </Button>
                      </div>
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          </>
        )}

        {site.isValve && site.isValve.length > 0 && (
          <>
            <Divider />
            <h3 style={{ color: '#2E7D32', display: 'flex', alignItems: 'center', marginBottom: 16 }}>
              <AppstoreOutlined style={{ marginRight: 8 }} />
              阀门控制
            </h3>

            <Row gutter={[16, 16]}>
              {site.isValve.map(valve => (
                <Col xs={24} sm={12} md={8} lg={6} key={valve.id || valve.name}>
                  <Card
                    hoverable
                    style={{
                      borderTop: '4px solid',
                      borderTopColor: valve.status === 1 ? '#52c41a' : '#ff4d4f'
                    }}
                  >
                    <div style={{ marginBottom: 8 }}>
                      <Text strong>{valve.name}</Text>
                      <Badge
                        status={valve.status === 1 ? 'success' : 'error'}
                        text={valve.status === 1 ? '已打开' : '已关闭'}
                        style={{ float: 'right' }}
                      />
                    </div>

                    <div style={{ marginTop: 16 }}>
                      <Button
                        type="primary"
                        style={{ backgroundColor: '#52c41a', marginRight: 8 }}
                        disabled={valve.status === 1}
                        onClick={() => handleValveControl(valve.name, 'open')}
                      >
                        打开
                      </Button>
                      <Button
                        danger
                        disabled={valve.status !== 1}
                        onClick={() => handleValveControl(valve.name, 'close')}
                      >
                        关闭
                      </Button>
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          </>
        )}
      </Card>

      {/* 第三部分：实时数据区（由后端API推送） */}
      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center', color: '#2E7D32' }}>
            <DashboardOutlined style={{ marginRight: 8 }} />
            <span>实时数据</span>
            <Tag color="blue" style={{ marginLeft: 8 }}>WebSocket推送</Tag>
          </div>
        }
        className={styles.sectionCard}
      >
        {site.inData && site.inData.length > 0 ? (
          <>
            <h3 style={{ color: '#2E7D32', display: 'flex', alignItems: 'center', marginBottom: 16 }}>
              <DashboardOutlined style={{ marginRight: 8 }} />
              进水数据
            </h3>
            <Row gutter={[16, 16]}>
              {site.inData.map((item, index) => (
                <Col xs={24} sm={12} md={8} lg={6} key={`indata-${index}`}>
                  <Card hoverable style={{ borderTop: '4px solid #1890ff' }}>
                    <div style={{ marginBottom: 8 }}>
                      <Text strong>{item.name}</Text>
                    </div>
                    <Statistic
                      value={item.data?.toFixed(2) || '0.00'}
                      suffix={item.dw || ''}
                      precision={2}
                      valueStyle={{ color: item.alarm === 1 ? '#ff4d4f' : '#1890ff' }}
                    />
                    {item.alarm === 1 && (
                      <Tag color="error" style={{ marginTop: 8 }}>异常</Tag>
                    )}
                  </Card>
                </Col>
              ))}
            </Row>
          </>
        ) : (
          <Empty description="暂无进水数据" />
        )}

        {site.outData && site.outData.length > 0 && (
          <>
            <Divider />
            <h3 style={{ color: '#2E7D32', display: 'flex', alignItems: 'center', marginBottom: 16 }}>
              <DashboardOutlined style={{ marginRight: 8 }} />
              出水数据
            </h3>
            <Row gutter={[16, 16]}>
              {site.outData.map((item, index) => (
                <Col xs={24} sm={12} md={8} lg={6} key={`outdata-${index}`}>
                  <Card hoverable style={{ borderTop: '4px solid #52c41a' }}>
                    <div style={{ marginBottom: 8 }}>
                      <Text strong>{item.name}</Text>
                    </div>
                    <Statistic
                      value={item.data?.toFixed(2) || '0.00'}
                      suffix={item.dw || ''}
                      precision={2}
                      valueStyle={{ color: item.alarm === 1 ? '#ff4d4f' : '#52c41a' }}
                    />
                    {item.alarm === 1 && (
                      <Tag color="error" style={{ marginTop: 8 }}>异常</Tag>
                    )}
                  </Card>
                </Col>
              ))}
            </Row>
          </>
        )}
      </Card>

      {/* 第四部分：告警信息和历史趋势区（使用API调用） */}
      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center', color: '#2E7D32' }}>
            <AlertOutlined style={{ marginRight: 8 }} />
            <span>告警信息和历史趋势</span>
            <Tag color="green" style={{ marginLeft: 8 }}>API调用</Tag>
          </div>
        }
        className={styles.sectionCard}
      >
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <Tabs.TabPane
            tab={
              <span>
                <AlertOutlined />
                告警记录
              </span>
            }
            key="alarms"
          >
            {site.alarms && site.alarms.length > 0 ? (
              site.alarms.map((alarm, index) => (
                <Alert
                  key={index}
                  message={`${alarm.device}: ${alarm.message}`}
                  description={`时间: ${alarm.time}`}
                  type={alarm.level === 'error' ? 'error' : 'warning'}
                  showIcon
                  className={styles.alarmAlert}
                  style={{ marginBottom: 16 }}
                />
              ))
            ) : (
              <Empty description="暂无告警记录" />
            )}
          </Tabs.TabPane>
          <Tabs.TabPane
            tab={
              <span>
                <LineChartOutlined />
                数据趋势
              </span>
            }
            key="data"
          >
            <div className={styles.chartSection}>
              <Empty description="数据趋势功能开发中..." />
            </div>
          </Tabs.TabPane>
          <Tabs.TabPane
            tab={
              <span>
                <TeamOutlined />
                管理部门
              </span>
            }
            key="departments"
          >
            {site.departments && site.departments.length > 0 ? (
              <List
                bordered
                dataSource={site.departments}
                renderItem={(item) => (
                  <List.Item>
                    <TeamOutlined style={{ marginRight: 8, color: '#2E7D32' }} />
                    {item}
                  </List.Item>
                )}
              />
            ) : (
              <Empty description="暂无管理部门信息" />
            )}
          </Tabs.TabPane>
        </Tabs>
      </Card>
    </div>
  );
};

export default SiteDetail;