import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Row, Col, Card, Tabs, Badge, Button, Spin, Empty, Statistic, Descriptions,
  Alert, message, Tag, Divider, List, Input, Typography, Progress, Modal, Space
} from 'antd';
import {
  DashboardOutlined, ThunderboltOutlined, ClockCircleOutlined, SettingOutlined,
  ExperimentOutlined, HeartOutlined, FundOutlined, AppstoreOutlined,
  AlertOutlined, LineChartOutlined, EnvironmentOutlined, ApartmentOutlined,
  TeamOutlined, ReloadOutlined, LeftOutlined, ExclamationCircleOutlined, EyeInvisibleOutlined, EyeOutlined
} from '@ant-design/icons';
import { useWebSocket } from '../../../context/WebSocketContext';
import { useAuth } from '../../../context/auth';
import apiManager from '../../../services/api/core/apiManager';
import TrendDataSection from '../components/TrendDataSection';
import ApiEditorButton from '../../../components/ApiEditor/ApiEditorButton';
import styles from './SiteDetail.module.scss';

const { Text } = Typography;
const { TabPane } = Tabs;

/**
 * 站点详情页组件 - 新版本
 * 基于文档重新构建，包含四个主要部分：
 * 1. 站点信息区（由站点列表自动传入的基本信息）
 * 2. 设备信息区（由后端API推送，可通过WebSocket控制）
 * 3. 实时数据区（由后端API推送，根据数据类型动态渲染不同的UI组件）
 * 4. 告警信息和历史趋势区（使用API调用获取数据）
 */
const SiteDetailNew = () => {
  const { id: siteId } = useParams();
  const navigate = useNavigate();
  const { user, userRoles = [], getUserRoles } = useAuth();
  const { lastMessage, sendMessage, connected: wsConnected, connect, disconnect } = useWebSocket();
  
  // WebSocket相关状态
  const [pendingCommands, setPendingCommands] = useState({});
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  
  // 数据相关状态
  const [inData, setInData] = useState([]);
  const [outData, setOutData] = useState([]);
  const [devices, setDevices] = useState([]);
  const [deviceFrequency, setDeviceFrequency] = useState([]);
  const [isValve, setIsValve] = useState([]);
  const [lastUpdateTime, setLastUpdateTime] = useState(null);
  const [dataGroups, setDataGroups] = useState([]);
  const [siteDepartments, setSiteDepartments] = useState([]);
  
  // 权限相关状态
  const [hasControlPermission, setHasControlPermission] = useState(false);
  const [localUserRoles, setLocalUserRoles] = useState(userRoles);
  const [permissionChecked, setPermissionChecked] = useState(false);
  
  // 刷新相关状态
  const [refreshing, setRefreshing] = useState(false);
  const [manualRefreshing, setManualRefreshing] = useState(false);
  const [updateTimer, setUpdateTimer] = useState(null);
  
  // 引用
  const controllerRef = useRef(null);
  const timerRef = useRef(null);
  const checkingPermissionRef = useRef(false);
  const permissionRetryCountRef = useRef(0);
  const lastPermissionCheckRef = useRef(0);

  // 错误处理和重试机制
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;
  const retryDelay = 2000; // 2秒

  // 分组显示控制
  const [visibleGroups, setVisibleGroups] = useState({});
  const [activeTab, setActiveTab] = useState('alarms');

  // 模态框状态
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [newFrequency, setNewFrequency] = useState('');

  // 切换分组显示状态
  const toggleGroupVisibility = useCallback((groupId) => {
    setVisibleGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  }, []);

  // 获取站点详情
  const fetchSiteDetail = useCallback(async (silent = false) => {
    if (!silent) {
      setRefreshing(true);
    }

    try {
      // 使用API管理系统调用getSiteById API
      const response = await apiManager.call('getSiteById', { id: siteId }, {
        showError: !silent // 只在非静默模式下显示错误
      });

      // 检查API调用是否成功
      if (!response || !response.success) {
        throw new Error(response?.error || '获取站点详情失败');
      }

      // 获取站点数据
      const siteData = response.data;

      // 更新状态
      setDataGroups(siteData);
      setLastUpdateTime(new Date());

      // 如果有进水数据，更新进水数据状态
      if (siteData.inData) {
        setInData(siteData.inData);
      }

      // 如果有出水数据，更新出水数据状态
      if (siteData.outData) {
        setOutData(siteData.outData);
      }

      // 如果有设备数据，更新设备状态
      if (siteData.devices) {
        setDevices(siteData.devices);
      }

      // 如果有频率设备数据，更新频率设备状态
      if (siteData.deviceFrequency) {
        setDeviceFrequency(siteData.deviceFrequency);
      }

      // 如果有阀门数据，更新阀门状态
      if (siteData.isValve) {
        setIsValve(siteData.isValve);
      }

      return siteData;
    } catch (error) {
      console.error('获取站点详情失败:', error);
      if (!silent) {
        message.error('获取站点详情失败');
      }
      throw error;
    } finally {
      if (!silent) {
        setRefreshing(false);
      }
    }
  }, [siteId]);

  // 错误处理函数
  const handleError = useCallback((error, operation, retryCallback) => {
    console.error(`${operation}失败:`, error);
    setError(error.message || `执行${operation}时发生错误`);
    
    if (retryCallback) {
      retryCallback();
    }
  }, [setError]);

  // 重置错误状态
  const resetError = useCallback(() => {
    setError(null);
    setRetryCount(0);
  }, []);

  // 带重试机制的数据获取函数
  const fetchDataWithRetry = useCallback(async (fetchFunction, operation) => {
    try {
      resetError();
      const result = await fetchFunction();
      return result;
    } catch (error) {
      handleError(error, operation, () => fetchDataWithRetry(fetchFunction, operation));
      return null;
    }
  }, [handleError, resetError]);

  // 带重试机制的命令发送函数
  const sendCommandWithRetry = useCallback(async (commandFunction, operation) => {
    try {
      resetError();
      await commandFunction();
    } catch (error) {
      handleError(error, operation, () => sendCommandWithRetry(commandFunction, operation));
    }
  }, [handleError, resetError]);

  // 错误提示组件
  const ErrorDisplay = useCallback(() => {
    if (!error) return null;

    return (
      <Alert
        message="操作出错"
        description={error}
        type="error"
        showIcon
        action={
          <Button size="small" type="primary" onClick={resetError}>
            重试
          </Button>
        }
        style={{ marginBottom: 16 }}
      />
    );
  }, [error, resetError]);

  // 检查用户权限
  const checkUserPermission = useCallback(async () => {
    if (checkingPermissionRef.current || permissionChecked) return;
    
    checkingPermissionRef.current = true;
    try {
      // 获取用户角色
      let roles = localUserRoles;
      if (!roles || roles.length === 0) {
        roles = await getUserRoles(user.id, true);
        setLocalUserRoles(roles);
      }

      // 获取站点部门信息
      const response = await apiManager.call('getSiteDepartments', { siteId });
      if (response && response.data) {
        setSiteDepartments(response.data);
      }

      // 检查用户是否有控制权限
      const hasPermission = roles.some(role => {
        // 检查角色是否有站点控制权限
        if (role.permissions?.includes('site_control')) {
          // 如果角色有站点控制权限，检查是否适用于当前站点
          if (role.sites?.includes(siteId)) {
            return true;
          }
          // 检查部门权限
          if (role.departments && response.data) {
            return response.data.some(dept => role.departments.includes(dept.id));
          }
        }
        return false;
      });

      setHasControlPermission(hasPermission);
      setPermissionChecked(true);
      lastPermissionCheckRef.current = Date.now();

    } catch (error) {
      console.error('检查权限失败:', error);
      // 如果检查失败，增加重试次数
      permissionRetryCountRef.current += 1;
      if (permissionRetryCountRef.current < 3) {
        // 延迟重试
        setTimeout(checkUserPermission, 2000);
      } else {
        // 重试次数达到上限，默认无权限
        setHasControlPermission(false);
        setPermissionChecked(true);
      }
    } finally {
      checkingPermissionRef.current = false;
    }
  }, [user, localUserRoles, siteId, getUserRoles, permissionChecked]);

  // 权限状态显示组件
  const PermissionStatusDisplay = useCallback(() => {
    if (!permissionChecked) {
      return <Badge status="processing" text="正在检查权限..." />;
    }

    return hasControlPermission ? (
      <Badge status="success" text="您有设备控制权限" />
    ) : (
      <Badge status="error" text="您没有设备控制权限" />
    );
  }, [hasControlPermission, permissionChecked]);

  // 在用户信息或站点信息变化时重新检查权限
  useEffect(() => {
    if (user?.id && siteId) {
      checkUserPermission();
    }
  }, [user, siteId, checkUserPermission]);

  // 页面获得焦点时检查权限
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkUserPermission();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [checkUserPermission]);

  // 注册站点详情页使用的API
  useEffect(() => {
    // 检查getSiteById API是否存在
    const siteDetailApi = apiManager.registry.get('getSiteById');

    if (!siteDetailApi) {
      console.log('注册站点详情API');
      // 注册站点详情API
      apiManager.registry.register('getSiteById', {
        name: '获取站点详情',
        url: 'https://nodered.jzz77.cn:9003/api/site/sites/:id',
        method: 'GET',
        category: 'system',
        status: 'enabled',
        description: '获取站点详情信息',
        timeout: 10000,
        retries: 1,
        cacheTime: 60000, // 60秒缓存
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    // 检查getAlarms API是否存在
    const alarmsApi = apiManager.registry.get('getAlarms');

    if (!alarmsApi) {
      console.log('注册告警信息API');
      // 注册告警信息API
      apiManager.registry.register('getAlarms', {
        name: '获取告警信息',
        url: 'https://nodered.jzz77.cn:9003/api/site/alarms/:siteId',
        method: 'GET',
        category: 'system',
        status: 'enabled',
        description: '获取站点告警信息',
        timeout: 10000,
        retries: 1,
        cacheTime: 60000, // 60秒缓存
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    // 检查getTrendData API是否存在
    const trendDataApi = apiManager.registry.get('getTrendData');

    if (!trendDataApi) {
      console.log('注册趋势数据API');
      // 注册趋势数据API
      apiManager.registry.register('getTrendData', {
        name: '获取趋势数据',
        url: 'https://nodered.jzz77.cn:9003/api/trend-data',
        method: 'POST',
        category: 'data',
        status: 'enabled',
        description: '获取历史趋势数据',
        timeout: 15000,
        retries: 1,
        cacheTime: 300000, // 5分钟缓存
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    // 检查getSiteDepartments API是否存在
    const siteDepartmentsApi = apiManager.registry.get('getSiteDepartments');

    if (!siteDepartmentsApi) {
      console.log('注册站点部门API');
      // 注册站点部门API
      apiManager.registry.register('getSiteDepartments', {
        name: '获取站点部门',
        url: 'https://nodered.jzz77.cn:9003/api/site/departments/:siteId',
        method: 'GET',
        category: 'system',
        status: 'enabled',
        description: '获取站点部门信息',
        timeout: 10000,
        retries: 1,
        cacheTime: 300000, // 5分钟缓存
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    // 检查sendCommand API是否存在
    const sendCommandApi = apiManager.registry.get('sendCommand');

    if (!sendCommandApi) {
      console.log('注册设备控制API');
      // 注册设备控制API
      apiManager.registry.register('sendCommand', {
        name: '发送设备控制命令',
        url: 'https://nodered.jzz77.cn:9003/api/site/control',
        method: 'POST',
        category: 'control',
        status: 'enabled',
        description: '发送设备控制命令',
        timeout: 10000,
        retries: 0, // 不自动重试
        cacheTime: 0, // 不缓存
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    // 检查logOperation API是否存在
    const logOperationApi = apiManager.registry.get('logOperation');

    if (!logOperationApi) {
      console.log('注册操作日志API');
      // 注册操作日志API
      apiManager.registry.register('logOperation', {
        name: '记录操作日志',
        url: 'https://nodered.jzz77.cn:9003/api/site/log',
        method: 'POST',
        category: 'system',
        status: 'enabled',
        description: '记录操作日志',
        timeout: 10000,
        retries: 1,
        cacheTime: 0, // 不缓存
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    // 将API注册到当前页面
    try {
      apiManager.registry.setPageApis('siteDetail', ['getSiteById', 'getAlarms', 'getTrendData', 'getUserRoles', 'getSiteDepartments', 'sendCommand', 'logOperation']);
    } catch (error) {
      console.error('设置页面API失败:', error);
    }
  }, []);

  // 初始加载数据
  useEffect(() => {
    // 等待API管理器初始化完成
    apiManager.waitForReady().then(ready => {
      if (ready) {
        // 获取站点详情
        fetchSiteDetail().then(() => {
          // 获取站点详情成功后，获取告警信息
          fetchAlarms(true);
        });

        // 如果用户已登录，获取用户角色
        if (user?.id) {
          getUserRoles(user.id);
        }

        // 注意：不主动连接WebSocket，只在需要控制设备时才连接
        // WebSocket仅用于设备控制，不用于获取数据
      } else {
        setError('API管理器初始化失败');
        message.error('API管理器初始化失败');
      }
    });

    // 设置定时刷新
    const refreshInterval = setInterval(() => {
      console.log('定时刷新站点数据');
      fetchSiteDetail(true); // 静默刷新，不显示加载状态
      fetchAlarms(true);
    }, 30000); // 每30秒刷新一次

    // 组件卸载时清理
    return () => {
      // 清除定时器
      clearInterval(refreshInterval);
      
      // 断开WebSocket连接
      if (wsConnected) {
        disconnect();
      }
    };
  }, [siteId, fetchSiteDetail, user, getUserRoles, fetchAlarms, disconnect, wsConnected]);

  // 获取告警信息
  const fetchAlarms = useCallback(async (silent = false) => {
    try {
      // 使用API管理系统调用getAlarms API
      const response = await apiManager.call('getAlarms', { siteId: siteId }, {
        showError: !silent // 只在非静默模式下显示错误
      });

      // 检查API调用是否成功
      if (!response || !response.success) {
        throw new Error(response?.error || '获取告警信息失败');
      }

      // 获取告警数据
      const alarms = response.data;

      // 更新站点数据中的告警信息
      setDataGroups(prevDataGroups => ({
        ...prevDataGroups,
        alarms: alarms
      }));

      return alarms;
    } catch (err) {
      if (!silent) {
        message.error('获取告警信息失败');
      }
      console.error('获取告警信息失败:', err);
      return [];
    }
  }, [siteId]);

  // 获取历史趋势数据
  const fetchTrendData = useCallback(async (params, silent = false) => {
    try {
      // 使用API管理系统调用getTrendData API
      const response = await apiManager.call('getTrendData', {
        siteId: siteId,
        ...params
      }, {
        showError: !silent // 只在非静默模式下显示错误
      });

      // 检查API调用是否成功
      if (!response || !response.success) {
        throw new Error(response?.error || '获取趋势数据失败');
      }

      // 获取趋势数据
      return response.data;
    } catch (err) {
      if (!silent) {
        message.error('获取趋势数据失败');
      }
      console.error('获取趋势数据失败:', err);
      return null;
    }
  }, [siteId]);

  // 处理WebSocket消息
  useEffect(() => {
    if (lastMessage) {
      try {
        // 解析消息数据
        const data = typeof lastMessage === 'string'
          ? JSON.parse(lastMessage)
          : (lastMessage.data ? JSON.parse(lastMessage.data) : lastMessage);

        console.log('站点详情页收到WebSocket消息:', JSON.stringify(data, null, 2));

        // 根据消息类型处理不同的数据更新
        const { type } = data;

        switch (type) {
          case 'init_confirmed':
            // 初始化确认，请求设备状态
            console.log('WebSocket初始化确认');
            sendMessage({
              type: 'get_device_status',
              siteId: siteId
            });
            break;

          case 'device_status':
            // 更新设备状态
            if (data && dataGroups) {
              console.log('更新设备状态:', JSON.stringify(data, null, 2));

              // 检查设备数据结构
              if (data.devices) {
                console.log(`收到${data.devices.length}个设备信息`);
                data.devices.forEach((device, index) => {
                  console.log(`设备${index + 1}:`, device.name, '状态:', device.status);
                });
              } else {
                console.log('设备状态消息中没有devices字段');
              }

              // 检查频率设备数据结构
              if (data.deviceFrequency) {
                console.log(`收到${data.deviceFrequency.length}个频率设备信息`);
                data.deviceFrequency.forEach((device, index) => {
                  console.log(`频率设备${index + 1}:`, device.name, '频率:', device.hz);
                });
              }

              // 检查阀门数据结构
              if (data.isValve) {
                console.log(`收到${data.isValve.length}个阀门信息`);
                data.isValve.forEach((valve, index) => {
                  console.log(`阀门${index + 1}:`, valve.name, '状态:', valve.status);
                });
              }

              setDataGroups(prevDataGroups => ({
                ...prevDataGroups,
                devices: data.devices || prevDataGroups.devices,
                deviceFrequency: data.deviceFrequency || prevDataGroups.deviceFrequency,
                isValve: data.isValve || prevDataGroups.isValve
              }));
            }
            break;

          case 'real_time_data':
            // 更新实时数据
            if (data && dataGroups) {
              console.log('更新实时数据:', JSON.stringify(data, null, 2));

              // 检查实时数据结构
              const dataTypes = [
                { name: '进水数据', field: 'inData' },
                { name: '出水数据', field: 'outData' },
                { name: '能耗数据', field: 'energy_stats' },
                { name: '设备运行时间', field: 'equipments' },
                { name: '工艺参数', field: 'process_parameters' },
                { name: '化验数据', field: 'lab_results' },
                { name: '设备健康状态', field: 'equipment_health' },
                { name: '生产指标', field: 'production_metrics' }
              ];

              dataTypes.forEach(({ name, field }) => {
                if (data[field]) {
                  console.log(`收到${name}:`, `${data[field].length}项`);
                  if (data[field].length > 0) {
                    console.log(`${name}第一项示例:`, data[field][0]);
                  }
                }
              });

              setDataGroups(prevDataGroups => ({
                ...prevDataGroups,
                inData: data.inData || prevDataGroups.inData,
                outData: data.outData || prevDataGroups.outData,
                energy_stats: data.energy_stats || prevDataGroups.energy_stats,
                equipments: data.equipments || prevDataGroups.equipments,
                process_parameters: data.process_parameters || prevDataGroups.process_parameters,
                lab_results: data.lab_results || prevDataGroups.lab_results,
                equipment_health: data.equipment_health || prevDataGroups.equipment_health,
                production_metrics: data.production_metrics || prevDataGroups.production_metrics
              }));
            }
            break;

          case 'command_result':
            // 处理命令执行结果
            if (data) {
              console.log('命令执行结果:', JSON.stringify(data, null, 2));
              const { deviceName, success, message: msg } = data;

              // 更新命令状态
              setPendingCommands(prev => ({
                ...prev,
                [deviceName]: {
                  status: success ? 'success' : 'error',
                  message: msg,
                  timestamp: Date.now()
                }
              }));

              // 显示消息
              if (success) {
                message.success(msg || `设备 ${deviceName} 操作成功`);
              } else {
                message.error(msg || `设备 ${deviceName} 操作失败`);
              }

              // 刷新设备状态
              setTimeout(() => {
                sendMessage({
                  type: 'get_device_status',
                  siteId: siteId
                });
              }, 1000);
            }
            break;

          case 'status_request_received':
            // 服务器确认收到状态请求
            console.log('服务器确认收到状态请求');
            break;

          case 'pong':
            // 心跳响应
            console.log('收到心跳响应');
            break;

          default:
            // 其他消息类型
            console.log('收到未处理的WebSocket消息类型:', type, JSON.stringify(data, null, 2));
        }

        // 更新最后更新时间
        setLastUpdateTime(new Date());
      } catch (error) {
        console.error('处理WebSocket消息出错:', error, lastMessage);
      }
    }
  }, [lastMessage, dataGroups, siteId, sendMessage]);

  // 刷新数据
  const handleRefresh = useCallback(() => {
    fetchSiteDetail();
    fetchAlarms(true);

    // 如果WebSocket已连接，请求最新设备状态
    if (wsConnected) {
      sendMessage({
        type: 'get_device_status',
        siteId: siteId
      });
    }
  }, [fetchSiteDetail, fetchAlarms, wsConnected, sendMessage, siteId]);

  // 记录操作日志
  const logOperation = useCallback(async (operation) => {
    try {
      await apiManager.call('logOperation', {
        siteId,
        ...operation
      });
    } catch (error) {
      console.error('记录操作日志失败:', error);
    }
  }, [siteId]);

  // 设备控制命令发送
  const sendCommand = useCallback(async (deviceName, action, commandType = 'device') => {
    if (!hasControlPermission) {
      message.error('您没有设备控制权限');
      return;
    }

    const commandId = `${commandType}_${deviceName}_${action}_${Date.now()}`;
    
    setPendingCommands(prev => ({
      ...prev,
      [commandId]: {
        type: commandType,
        deviceName,
        action,
        status: 'pending',
        timestamp: new Date()
      }
    }));

    try {
      await sendMessage({
        type: commandType === 'device' ? 'device_command' : 'valve_command',
        commandId,
        deviceName,
        action
      });

      setTimeout(() => {
        setPendingCommands(prev => {
          if (prev[commandId]?.status === 'pending') {
            return {
              ...prev,
              [commandId]: {
                ...prev[commandId],
                status: 'timeout',
                message: '命令响应超时'
              }
            };
          }
          return prev;
        });
      }, 10000);

      await logOperation({
        type: commandType,
        deviceName,
        action,
        status: 'success',
        timestamp: new Date()
      });

    } catch (error) {
      handleError(error, '发送命令', () => sendCommand(deviceName, action, commandType));
      
      setPendingCommands(prev => ({
        ...prev,
        [commandId]: {
          ...prev[commandId],
          status: 'error',
          message: error.message || '命令发送失败'
        }
      }));

      await logOperation({
        type: commandType,
        deviceName,
        action,
        status: 'error',
        error: error.message,
        timestamp: new Date()
      });
    }
  }, [siteId, hasControlPermission, handleError, logOperation, sendMessage]);

  // 命令状态显示组件
  const CommandStatusDisplay = useCallback(({ commandId, command }) => {
    if (!command) return null;

    const statusConfig = {
      pending: { color: 'processing', text: '执行中...' },
      success: { color: 'success', text: '执行成功' },
      error: { color: 'error', text: '执行失败' },
      timeout: { color: 'warning', text: '响应超时' }
    };

    const status = statusConfig[command.status] || { color: 'default', text: '未知状态' };

    return (
      <div style={{ marginTop: 8 }}>
        <Badge status={status.color} text={status.text} />
        {command.message && (
          <div style={{ color: status.color === 'error' ? '#ff4d4f' : '#52c41a', fontSize: '12px' }}>
            {command.message}
          </div>
        )}
      </div>
    );
  }, []);

  // 设备控制处理函数
  const handleDeviceControl = useCallback((device, action) => {
    sendCommand(device.name, action, 'device');
  }, [sendCommand]);

  // 阀门控制处理函数
  const handleValveControl = useCallback((valve, action) => {
    sendCommand(valve.name, action, 'valve');
  }, [sendCommand]);

  // 频率设置处理函数
  const handleSetFrequency = useCallback((device, frequency) => {
    if (!frequency || isNaN(frequency) || frequency < 0 || frequency > 50) {
      message.error('请输入有效的频率值(0-50Hz)');
      return;
    }

    sendCommand(device.name, frequency.toString(), 'frequency');
  }, [sendCommand]);

  // 数据卡片组件 - 根据数据类型动态渲染
  const DataCard = ({ data }) => {
    if (!data) return null;

    // 根据数据类型选择渲染方式
    const renderContent = () => {
      // 基础数据类型
      switch (data.dataType) {
        case 'number':
          return (
            <Statistic
              value={data.data?.toFixed(2) || data.value?.toFixed(2) || '0.00'}
              suffix={data.dw || data.unit || ''}
              precision={2}
              valueStyle={{
                color: data.alarm === 1 ? '#ff4d4f' :
                       (data.min !== undefined && data.data < data.min) ||
                       (data.max !== undefined && data.data > data.max) ?
                       '#faad14' : '#1890ff'
              }}
            />
          );
        case 'boolean':
          return (
            <Badge
              status={data.data === 1 || data.value === 1 ? 'success' : 'default'}
              text={data.data === 1 || data.value === 1 ? '开启' : '关闭'}
            />
          );
        case 'enum':
          const enumValue = data.enumValues?.[data.data] || data.enumValues?.[data.value];
          return (
            <Tag color={enumValue?.color || 'blue'}>
              {enumValue?.label || data.data || data.value}
            </Tag>
          );

        // 特殊数据类型
        case 'energy':
          return renderEnergyData(data);
        case 'runtime':
          return renderRuntimeData(data);
        case 'process':
          return renderProcessData(data);
        case 'lab':
          return renderLabData(data);
        case 'health':
          return renderHealthData(data);
        case 'production':
          return renderProductionData(data);
        default:
          return <Text>{data.data || data.value}</Text>;
      }
    };

    // 渲染能耗数据
    const renderEnergyData = (data) => (
      <div>
        <Row gutter={[8, 8]}>
          <Col span={12}>
            <Statistic
              title="电流"
              value={data.current}
              suffix="A"
              precision={1}
              valueStyle={{ fontSize: 14 }}
            />
          </Col>
          <Col span={12}>
            <Statistic
              title="电压"
              value={data.voltage}
              suffix="V"
              precision={0}
              valueStyle={{ fontSize: 14 }}
            />
          </Col>
        </Row>
        <Divider style={{ margin: '8px 0' }} />
        <Statistic
          title="功率"
          value={data.power}
          suffix="kW"
          precision={1}
          valueStyle={{ color: '#1890ff' }}
        />
        <div style={{ marginTop: 8 }}>
          <Text type="secondary">累计耗电: {data.consumption} {data.unit}</Text>
        </div>
      </div>
    );

    // 渲染运行时间数据
    const renderRuntimeData = (data) => (
      <div>
        <Statistic
          title="运行时间"
          value={data.runningTime}
          suffix={data.unit}
          precision={1}
          valueStyle={{ color: '#1890ff' }}
        />
        <div style={{ marginTop: 8 }}>
          <Text type="secondary">启动次数: {data.startCount} 次</Text>
        </div>
        <div style={{ marginTop: 4 }}>
          <Text type="secondary">
            最后启动: {new Date(data.lastStartTime).toLocaleString()}
          </Text>
        </div>
      </div>
    );

    // 渲染工艺参数数据
    const renderProcessData = (data) => {
      if (data.dataType === 'enum') {
        const enumValue = data.enumValues?.[data.value];
        return (
          <div>
            <div style={{ marginBottom: 8 }}>
              <Text strong>{data.name}</Text>
            </div>
            <Tag color={enumValue?.color || 'blue'} style={{ padding: '4px 8px', fontSize: 16 }}>
              {enumValue?.label || data.value}
            </Tag>
          </div>
        );
      }

      return (
        <div>
          <Statistic
            value={data.value}
            suffix={data.unit}
            precision={0}
            valueStyle={{ color: '#1890ff' }}
          />
          {data.min !== undefined && data.max !== undefined && (
            <div style={{ marginTop: 8 }}>
              <Progress
                percent={((data.value - data.min) / (data.max - data.min)) * 100}
                size="small"
                status={data.alarm === 1 ? 'exception' : 'normal'}
              />
              <div style={{ fontSize: 12, color: 'rgba(0, 0, 0, 0.45)' }}>
                范围: {data.min} - {data.max} {data.unit}
              </div>
            </div>
          )}
        </div>
      );
    };

    // 渲染化验数据
    const renderLabData = (data) => (
      <div>
        <Statistic
          value={data.value}
          suffix={data.unit}
          precision={1}
          valueStyle={{
            color: data.standard && data.value > data.standard ? '#ff4d4f' : '#1890ff'
          }}
        />
        {data.standard && (
          <div style={{ marginTop: 4 }}>
            <Text type="secondary">标准值: {data.standard} {data.unit}</Text>
          </div>
        )}
        <div style={{ marginTop: 4, fontSize: 12, color: 'rgba(0, 0, 0, 0.45)' }}>
          采样时间: {new Date(data.sampleTime).toLocaleString()}
        </div>
      </div>
    );

    // 渲染设备健康状态
    const renderHealthData = (data) => (
      <div>
        <Statistic
          title="健康得分"
          value={data.healthScore}
          suffix="/100"
          precision={0}
          valueStyle={{
            color:
              data.healthScore >= 80 ? '#52c41a' :
              data.healthScore >= 60 ? '#1890ff' :
              data.healthScore >= 40 ? '#faad14' : '#ff4d4f'
          }}
        />
        <div style={{ marginTop: 8 }}>
          <Badge
            status={
              data.status === 'good' ? 'success' :
              data.status === 'normal' ? 'processing' :
              data.status === 'warning' ? 'warning' : 'error'
            }
            text={
              data.status === 'good' ? '状态良好' :
              data.status === 'normal' ? '状态正常' :
              data.status === 'warning' ? '需要注意' : '需要维修'
            }
          />
        </div>
        {data.maintenanceDue && (
          <div style={{ marginTop: 4, fontSize: 12, color: 'rgba(0, 0, 0, 0.45)' }}>
            下次维护: {data.maintenanceDue}
          </div>
        )}
      </div>
    );

    // 渲染生产指标
    const renderProductionData = (data) => (
      <div>
        <Statistic
          value={data.value}
          suffix={data.unit}
          precision={data.unit === '%' ? 1 : 0}
          valueStyle={{ color: '#1890ff' }}
        />
        {data.target && (
          <div style={{ marginTop: 8 }}>
            <Progress
              percent={(data.value / data.target) * 100}
              size="small"
              status={
                (data.value / data.target) >= 1 ? 'success' :
                (data.value / data.target) >= 0.8 ? 'normal' : 'exception'
              }
            />
            <div style={{ fontSize: 12, color: 'rgba(0, 0, 0, 0.45)' }}>
              目标: {data.target} {data.unit} ({((data.value / data.target) * 100).toFixed(1)}%)
            </div>
          </div>
        )}
      </div>
    );

    return (
      <Card
        hoverable
        style={{
          borderTop: '4px solid',
          borderTopColor: data.alarm === 1 ? '#ff4d4f' : '#1890ff'
        }}
      >
        <div style={{ marginBottom: 8 }}>
          <Text strong>{data.name}</Text>
        </div>
        {renderContent()}
        {data.alarm === 1 && (
          <Tag color="error" style={{ marginTop: 8 }}>异常</Tag>
        )}
      </Card>
    );
  };

  // 检查分组是否有报警/异常（不可隐藏）
  const hasGroupAlarm = useCallback((group) => {
    if (group.type === 'alarm' && group.data && group.data.length > 0) return true;
    if (group.data && Array.isArray(group.data)) {
      if (group.type === 'sensor') return group.data.some(item => item.alarm === 1);
      if (group.type === 'process') return group.data.some(item => item.status === 'abnormal');
      if (group.type === 'device' || group.type === 'valve') return group.data.some(item => item.fault === 1);
    }
    return false;
  }, []);

  const renderGroupHeader = (group) => {
    const alarm = hasGroupAlarm(group);
    return (
      <div style={{display:'flex',alignItems:'center',marginBottom:8}}>
        <span style={{fontWeight:600,fontSize:16,color:alarm?'#ff4d4f':'#2E7D32',display:'flex',alignItems:'center'}}>
          {alarm && <ExclamationCircleOutlined style={{color:'#ff4d4f',marginRight:6}}/>}
          {group.name}
        </span>
        <Button
          size="small"
          icon={visibleGroups[group.id] === false ? <EyeInvisibleOutlined /> : <EyeOutlined />}
          style={{marginLeft:12}}
          onClick={()=>toggleGroupVisibility(group.id)}
          disabled={alarm}
        >{visibleGroups[group.id] === false ? '显示' : '隐藏'}</Button>
        <Button
          size="small"
          icon={<ReloadOutlined />}
          style={{marginLeft:8}}
          onClick={()=>handleRefresh()}
        >刷新</Button>
        {!hasControlPermission && (
          <Tag color="red" style={{marginLeft:8}}>无控制权限</Tag>
        )}
      </div>
    );
  };

  const renderSensorGroup = (group) => (
    <Row gutter={[16,16]}>
      {group.data.map((item,idx)=>(<Col xs={24} sm={12} md={8} lg={6} key={idx}> <DataCard data={item} type="sensor" /> </Col>))}
    </Row>
  );

  const renderDeviceGroup = (group) => (
    <Row gutter={[16,16]}>
      {group.data.map((item,idx)=>(
        <Col xs={24} sm={12} md={8} lg={6} key={idx}>
          <Card
            hoverable
            style={{
              borderTop: '4px solid',
              borderTopColor: item.status === 'running' || item.run === 1 ? '#52c41a' : '#ff4d4f'
            }}
          >
            <div style={{ marginBottom: 8 }}>
              <Text strong>{item.name}</Text>
              <Badge
                status={(item.status === 'running' || item.run === 1) ? 'success' : 'error'}
                text={(item.status === 'running' || item.run === 1) ? '运行中' : '已停止'}
                style={{ float: 'right' }}
              />
              {item.fault === 1 && (
                <Tag color="red" style={{ float: 'right', marginRight: 8 }}>故障</Tag>
              )}
            </div>

            {item.location && (
              <div style={{ marginBottom: 8, color: 'rgba(0, 0, 0, 0.45)' }}>
                <EnvironmentOutlined style={{ marginRight: 4 }} />
                {item.location}
              </div>
            )}

            <div style={{ marginTop: 16 }}>
              <Button
                type="primary"
                style={{ backgroundColor: '#52c41a', marginRight: 8 }}
                disabled={(item.status === 'running' || item.run === 1) || !hasControlPermission || item.fault === 1}
                onClick={() => handleDeviceControl(item, 'start')}
                loading={pendingCommands[item.name]?.status === 'pending'}
              >
                启动
              </Button>
              <Button
                danger
                disabled={(item.status !== 'running' && item.run !== 1) || !hasControlPermission || item.fault === 1}
                onClick={() => handleDeviceControl(item, 'stop')}
                loading={pendingCommands[item.name]?.status === 'pending'}
              >
                停止
              </Button>
            </div>

            {!hasControlPermission && (
              <div style={{
                marginTop: 8,
                padding: '4px 8px',
                backgroundColor: 'rgba(0, 0, 0, 0.05)',
                borderRadius: 4,
                color: 'rgba(0, 0, 0, 0.45)',
                fontSize: 12
              }}>
                无控制权限
              </div>
            )}
          </Card>
        </Col>
      ))}
    </Row>
  );

  const renderValveGroup = (group) => (
    <Row gutter={[16,16]}>
      {group.data.map((item,idx)=>(
        <Col xs={24} sm={12} md={8} lg={6} key={idx}>
          <Card
            hoverable
            style={{
              borderTop: '4px solid',
              borderTopColor: item.status === 1 || item.open === 1 ? '#52c41a' : '#ff4d4f'
            }}
          >
            <div style={{ marginBottom: 8 }}>
              <Text strong>{item.name}</Text>
              <Badge
                status={(item.status === 1 || item.open === 1) ? 'success' : 'error'}
                text={(item.status === 1 || item.open === 1) ? '已打开' : '已关闭'}
                style={{ float: 'right' }}
              />
              {item.fault === 1 && (
                <Tag color="red" style={{ float: 'right', marginRight: 8 }}>故障</Tag>
              )}
            </div>

            <div style={{ marginTop: 16 }}>
              <Button
                type="primary"
                style={{ backgroundColor: '#52c41a', marginRight: 8 }}
                disabled={(item.status === 1 || item.open === 1) || !hasControlPermission || item.fault === 1}
                onClick={() => handleValveControl(item, 'open')}
                loading={pendingCommands[item.name]?.status === 'pending'}
              >
                打开
              </Button>
              <Button
                danger
                disabled={(item.status !== 1 && item.open !== 1) || !hasControlPermission || item.fault === 1}
                onClick={() => handleValveControl(item, 'close')}
                loading={pendingCommands[item.name]?.status === 'pending'}
              >
                关闭
              </Button>
            </div>

            {!hasControlPermission && (
              <div style={{
                marginTop: 8,
                padding: '4px 8px',
                backgroundColor: 'rgba(0, 0, 0, 0.05)',
                borderRadius: 4,
                color: 'rgba(0, 0, 0, 0.45)',
                fontSize: 12
              }}>
                无控制权限
              </div>
            )}
          </Card>
        </Col>
      ))}
    </Row>
  );

  const renderEnergyGroup = (group) => (
    <Row gutter={[16,16]}>
      {group.data.map((item,idx)=>(
        <Col xs={24} sm={12} md={8} lg={6} key={idx}>
          <Card hoverable style={{ borderTop: '4px solid #1890ff' }}>
            <div style={{ marginBottom: 8 }}>
              <Text strong>{item.name}</Text>
            </div>
            <Statistic
              title="当前功率"
              value={item.power}
              suffix="kW"
              precision={1}
              valueStyle={{ color: '#1890ff' }}
            />
            <div style={{ marginTop: 8 }}>
              <Text type="secondary">累计耗电: {item.consumption} kWh</Text>
            </div>
            {item.current !== undefined && (
              <div style={{ marginTop: 4 }}>
                <Text type="secondary">电流: {item.current} A</Text>
              </div>
            )}
            {item.voltage !== undefined && (
              <div style={{ marginTop: 4 }}>
                <Text type="secondary">电压: {item.voltage} V</Text>
              </div>
            )}
          </Card>
        </Col>
      ))}
    </Row>
  );

  const renderRuntimeGroup = (group) => (
    <Row gutter={[16,16]}>
      {group.data.map((item,idx)=>(
        <Col xs={24} sm={12} md={8} lg={6} key={idx}>
          <Card hoverable style={{ borderTop: '4px solid #1890ff' }}>
            <div style={{ marginBottom: 8 }}>
              <Text strong>{item.name}</Text>
            </div>
            <Statistic
              title="运行时间"
              value={item.runningTime}
              suffix={item.unit}
              precision={1}
              valueStyle={{ color: '#1890ff' }}
            />
            <div style={{ marginTop: 8 }}>
              <Text type="secondary">启动次数: {item.startCount} 次</Text>
            </div>
            <div style={{ marginTop: 4 }}>
              <Text type="secondary">
                最后启动: {new Date(item.lastStartTime).toLocaleString()}
              </Text>
            </div>
          </Card>
        </Col>
      ))}
    </Row>
  );

  const renderProcessGroup = (group) => (
    <Row gutter={[16,16]}>
      {group.data.map((item,idx)=>(
        <Col xs={24} sm={12} md={8} lg={6} key={idx}>
          <Card hoverable style={{ borderTop: '4px solid #1890ff' }}>
            <div style={{ marginBottom: 8 }}>
              <Text strong>{item.name}</Text>
            </div>
            <Statistic
              value={item.value}
              suffix={item.unit}
              precision={item.unit === '%' ? 1 : 0}
              valueStyle={{ color: '#1890ff' }}
            />
            {item.min !== undefined && item.max !== undefined && (
              <div style={{ marginTop: 8 }}>
                <Progress
                  percent={((item.value - item.min) / (item.max - item.min)) * 100}
                  size="small"
                  status={item.alarm === 1 ? 'exception' : 'normal'}
                />
                <div style={{ fontSize: 12, color: 'rgba(0, 0, 0, 0.45)' }}>
                  范围: {item.min} - {item.max} {item.unit}
                </div>
              </div>
            )}
          </Card>
        </Col>
      ))}
    </Row>
  );

  const renderAlarmGroup = (group) => (
    <Row gutter={[16,16]}>
      {group.data.map((item,idx)=>(
        <Col xs={24} sm={12} md={8} lg={6} key={idx}>
          <Alert
            message={item.name || (item.device ? `${item.device}: ${item.message}` : item.message)}
            description={
              <div>
                <div>时间: {item.time || new Date(item.timestamp).toLocaleString()}</div>
                {item.level && <div>级别: {
                  item.level === 'high' ? '高' :
                  item.level === 'medium' ? '中' :
                  item.level === 'low' ? '低' :
                  item.level
                }</div>}
                {item.status && <div>状态: {
                  item.status === 'confirmed' ? '已确认' :
                  item.status === 'unconfirmed' ? '未确认' :
                  item.status
                }</div>}
              </div>
            }
            type={
              item.level === 'error' || item.level === 'high' ? 'error' :
              item.level === 'medium' ? 'warning' :
              item.level === 'low' ? 'info' :
              'warning'
            }
            showIcon
            style={{ marginBottom: 16 }}
          />
        </Col>
      ))}
    </Row>
  );

  const renderLabGroup = (group) => (
    <Row gutter={[16,16]}>
      {group.data.map((item,idx)=>(
        <Col xs={24} sm={12} md={8} lg={6} key={idx}>
          <Card hoverable style={{ borderTop: '4px solid #1890ff' }}>
            <div style={{ marginBottom: 8 }}>
              <Text strong>{item.name}</Text>
            </div>
            <Statistic
              value={item.value}
              suffix={item.unit}
              precision={1}
              valueStyle={{
                color: item.standard && item.value > item.standard ? '#ff4d4f' : '#1890ff'
              }}
            />
            {item.standard && (
              <div style={{ marginTop: 4 }}>
                <Text type="secondary">标准值: {item.standard} {item.unit}</Text>
              </div>
            )}
            <div style={{ marginTop: 4, fontSize: 12, color: 'rgba(0, 0, 0, 0.45)' }}>
              采样时间: {new Date(item.sampleTime).toLocaleString()}
            </div>
          </Card>
        </Col>
      ))}
    </Row>
  );

  const renderHealthGroup = (group) => (
    <Row gutter={[16,16]}>
      {group.data.map((item,idx)=>(
        <Col xs={24} sm={12} md={8} lg={6} key={idx}>
          <Card hoverable style={{ borderTop: '4px solid #1890ff' }}>
            <div style={{ marginBottom: 8 }}>
              <Text strong>{item.name}</Text>
            </div>
            <Statistic
              title="健康得分"
              value={item.healthScore}
              suffix="/100"
              precision={0}
              valueStyle={{
                color:
                  item.healthScore >= 80 ? '#52c41a' :
                  item.healthScore >= 60 ? '#1890ff' :
                  item.healthScore >= 40 ? '#faad14' : '#ff4d4f'
              }}
            />
            <div style={{ marginTop: 8 }}>
              <Badge
                status={
                  item.status === 'good' ? 'success' :
                  item.status === 'normal' ? 'processing' :
                  item.status === 'warning' ? 'warning' : 'error'
                }
                text={
                  item.status === 'good' ? '状态良好' :
                  item.status === 'normal' ? '状态正常' :
                  item.status === 'warning' ? '需要注意' : '需要维修'
                }
              />
            </div>
            {item.maintenanceDue && (
              <div style={{ marginTop: 4, fontSize: 12, color: 'rgba(0, 0, 0, 0.45)' }}>
                下次维护: {item.maintenanceDue}
              </div>
            )}
          </Card>
        </Col>
      ))}
    </Row>
  );

  const renderProductionGroup = (group) => (
    <Row gutter={[16,16]}>
      {group.data.map((item,idx)=>(
        <Col xs={24} sm={12} md={8} lg={6} key={idx}>
          <Card hoverable style={{ borderTop: '4px solid #1890ff' }}>
            <div style={{ marginBottom: 8 }}>
              <Text strong>{item.name}</Text>
            </div>
            <Statistic
              value={item.value}
              suffix={item.unit}
              precision={item.unit === '%' ? 1 : 0}
              valueStyle={{ color: '#1890ff' }}
            />
            {item.target && (
              <div style={{ marginTop: 8 }}>
                <Progress
                  percent={(item.value / item.target) * 100}
                  size="small"
                  status={
                    (item.value / item.target) >= 1 ? 'success' :
                    (item.value / item.target) >= 0.8 ? 'normal' : 'exception'
                  }
                />
                <div style={{ fontSize: 12, color: 'rgba(0, 0, 0, 0.45)' }}>
                  目标: {item.target} {item.unit} ({((item.value / item.target) * 100).toFixed(1)}%)
                </div>
              </div>
            )}
          </Card>
        </Col>
      ))}
    </Row>
  );

  const renderGroupContent = (group) => {
    switch(group.type) {
      case 'sensor': return renderSensorGroup(group);
      case 'device': return renderDeviceGroup(group);
      case 'valve': return renderValveGroup(group);
      case 'energy': return renderEnergyGroup(group);
      case 'runtime': return renderRuntimeGroup(group);
      case 'process': return renderProcessGroup(group);
      case 'alarm': return renderAlarmGroup(group);
      case 'laboratory': return renderLabGroup(group);
      case 'health': return renderHealthGroup(group);
      case 'production': return renderProductionGroup(group);
      default: return renderSensorGroup(group);
    }
  };

  // 如果正在加载，显示加载状态
  if (refreshing) {
    return (
      <div className={styles.loadingContainer}>
        <Spin size="large" tip="加载站点数据..." />
      </div>
    );
  }

  // 如果发生错误，显示错误信息
  if (error) {
    return (
      <div className={styles.loadingContainer}>
        <Alert
          message="加载失败"
          description={error}
          type="error"
          showIcon
          action={
            <Button type="primary" onClick={fetchSiteDetail}>
              重试
            </Button>
          }
        />
      </div>
    );
  }

  // 如果没有站点数据，显示空状态
  if (!dataGroups) {
    return (
      <div className={styles.loadingContainer}>
        <Empty description="未找到站点数据" />
      </div>
    );
  }

  return (
    <div className={styles.siteDetailContainer}>
      {/* 页面头部 */}
      <div className={styles.header}>
        <div className={styles.backButton}>
          <Button
            icon={<LeftOutlined />}
            onClick={() => navigate('/sites')}
          >
            返回
          </Button>
        </div>
        <h1 className={styles.pageTitle}>{dataGroups.name}</h1>
        <div className={styles.actions}>
          <Space>
            <ApiEditorButton
              pageKey="siteDetail"
              tooltip="编辑站点详情页API"
            />
            <Button
              icon={<ReloadOutlined />}
              onClick={handleRefresh}
            >
              刷新
            </Button>
          </Space>
        </div>
      </div>

      {/* 第一部分：站点信息区（由站点列表自动传入的基本信息） */}
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
                  status={dataGroups.status === '在线' ? 'success' : 'error'}
                  text={dataGroups.status}
                />
              </Descriptions.Item>
              <Descriptions.Item label="设施状态">
                <Tag color={
                  dataGroups.alarm === '设施正常' ? 'success' :
                  dataGroups.alarm === '设施停用' ? 'warning' : 'error'
                }>
                  {dataGroups.alarm}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="处理能力">{dataGroups.capacity || '未知'}</Descriptions.Item>
              <Descriptions.Item label="位置">
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <EnvironmentOutlined style={{ marginRight: 4, color: '#2E7D32' }} />
                  {dataGroups.address}
                </div>
              </Descriptions.Item>
              {dataGroups.totalInflow !== null && dataGroups.totalInflow !== undefined && (
                <Descriptions.Item label="总进水量">
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <DashboardOutlined style={{ marginRight: 4, color: '#2E7D32' }} />
                    {dataGroups.totalInflow.toFixed(2)} 吨
                  </div>
                </Descriptions.Item>
              )}
              {(dataGroups.totalInflow === null || dataGroups.totalInflow === undefined) && (
                <Descriptions.Item label="总进水量">
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <DashboardOutlined style={{ marginRight: 4, color: '#2E7D32' }} />
                    0.00 吨
                  </div>
                </Descriptions.Item>
              )}
              <Descriptions.Item label="联系人">{dataGroups.contactPerson || '未设置'}</Descriptions.Item>
              <Descriptions.Item label="联系电话">{dataGroups.contactPhone || '未设置'}</Descriptions.Item>
              <Descriptions.Item label="最后更新时间">{dataGroups.lastUpdate || '未知'}</Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
      </Row>

      {/* 站点统计信息 */}
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
              value={dataGroups.stats?.deviceTotal || 0}
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
              value={dataGroups.stats?.deviceRunning || 0}
              valueStyle={{ color: '#52c41a', fontSize: '24px' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card hoverable style={{ borderTop: '4px solid #ff4d4f' }}>
            <Statistic
              title={
                <div style={{ display: 'flex', alignItems: 'center', color: dataGroups.stats?.alarmTotal > 0 ? '#ff4d4f' : 'rgba(0, 0, 0, 0.45)' }}>
                  <AlertOutlined style={{ marginRight: 8 }} />
                  <span>告警总数</span>
                </div>
              }
              value={dataGroups.stats?.alarmTotal || 0}
              valueStyle={{
                color: dataGroups.stats?.alarmTotal > 0 ? '#ff4d4f' : 'rgba(0, 0, 0, 0.45)',
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
              value={dataGroups.departments?.length || 0}
              valueStyle={{ color: '#1890ff', fontSize: '24px' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 第二部分：设备信息区（由后端API推送，可通过WebSocket控制） */}
      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center', color: '#2E7D32' }}>
            <ApartmentOutlined style={{ marginRight: 8 }} />
            <span>设备信息</span>
            <Tag color="blue" style={{ marginLeft: 8 }}>API获取 + WebSocket控制</Tag>
          </div>
        }
        className={styles.sectionCard}
      >
        <div className={styles.connectionStatus}>
          <Badge
            status={wsConnected ? 'success' : 'error'}
            text={wsConnected ? '设备控制已连接' : '设备控制未连接'}
          />
          {!wsConnected && (
            <Button
              type="primary"
              size="small"
              onClick={() => connect(siteId)}
              style={{ marginLeft: 16 }}
            >
              连接
            </Button>
          )}
        </div>

        {/* 设备控制 */}
        {dataGroups.devices && dataGroups.devices.length > 0 ? (
          <Row gutter={[16, 16]}>
            {dataGroups.devices.map(device => (
              <Col xs={24} sm={12} md={8} lg={6} key={device.id || device.name}>
                <Card
                  hoverable
                  style={{
                    borderTop: '4px solid',
                    borderTopColor: device.status === 'running' || device.run === 1 ? '#52c41a' : '#ff4d4f'
                  }}
                >
                  <div style={{ marginBottom: 8 }}>
                    <Text strong>{device.name}</Text>
                    <Badge
                      status={(device.status === 'running' || device.run === 1) ? 'success' : 'error'}
                      text={(device.status === 'running' || device.run === 1) ? '运行中' : '已停止'}
                      style={{ float: 'right' }}
                    />
                    {device.fault === 1 && (
                      <Tag color="red" style={{ float: 'right', marginRight: 8 }}>故障</Tag>
                    )}
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
                      disabled={(device.status === 'running' || device.run === 1) || !hasControlPermission || device.fault === 1}
                      onClick={() => handleDeviceControl(device, 'start')}
                      loading={pendingCommands[device.name]?.status === 'pending'}
                    >
                      启动
                    </Button>
                    <Button
                      danger
                      disabled={(device.status !== 'running' && device.run !== 1) || !hasControlPermission || device.fault === 1}
                      onClick={() => handleDeviceControl(device, 'stop')}
                      loading={pendingCommands[device.name]?.status === 'pending'}
                    >
                      停止
                    </Button>
                  </div>

                  {!hasControlPermission && (
                    <div style={{
                      marginTop: 8,
                      padding: '4px 8px',
                      backgroundColor: 'rgba(0, 0, 0, 0.05)',
                      borderRadius: 4,
                      color: 'rgba(0, 0, 0, 0.45)',
                      fontSize: 12
                    }}>
                      无控制权限
                    </div>
                  )}
                </Card>
              </Col>
            ))}
          </Row>
        ) : (
          <Empty description="暂无设备数据" />
        )}

        {/* 频率设备 */}
        {dataGroups.deviceFrequency && dataGroups.deviceFrequency.length > 0 && (
          <>
            <Divider />
            <h3 style={{ color: '#2E7D32', display: 'flex', alignItems: 'center', marginBottom: 16 }}>
              <DashboardOutlined style={{ marginRight: 8 }} />
              频率设备
            </h3>

            <Row gutter={[16, 16]}>
              {dataGroups.deviceFrequency.map(device => (
                <Col xs={24} sm={12} md={8} lg={6} key={device.id || device.name}>
                  <Card hoverable style={{ borderTop: '4px solid #1890ff' }}>
                    <div style={{ marginBottom: 8 }}>
                      <Text strong>{device.name}</Text>
                    </div>

                    <Statistic
                      title="当前频率"
                      value={device.hz !== undefined && device.hz !== null ? device.hz.toFixed(2) : '0.00'}
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
                      <Button
                        type="primary"
                        disabled={!hasControlPermission}
                        onClick={() => handleSetFrequency(device, device.sethz)}
                        loading={pendingCommands[device.name]?.status === 'pending'}
                      >
                        设置频率
                      </Button>
                    </div>

                    {!hasControlPermission && (
                      <div style={{
                        marginTop: 8,
                        padding: '4px 8px',
                        backgroundColor: 'rgba(0, 0, 0, 0.05)',
                        borderRadius: 4,
                        color: 'rgba(0, 0, 0, 0.45)',
                        fontSize: 12
                      }}>
                        无控制权限
                      </div>
                    )}
                  </Card>
                </Col>
              ))}
            </Row>
          </>
        )}

        {/* 阀门控制 */}
        {dataGroups.isValve && dataGroups.isValve.length > 0 && (
          <>
            <Divider />
            <h3 style={{ color: '#2E7D32', display: 'flex', alignItems: 'center', marginBottom: 16 }}>
              <AppstoreOutlined style={{ marginRight: 8 }} />
              阀门控制
            </h3>

            <Row gutter={[16, 16]}>
              {dataGroups.isValve.map(valve => (
                <Col xs={24} sm={12} md={8} lg={6} key={valve.id || valve.name}>
                  <Card
                    hoverable
                    style={{
                      borderTop: '4px solid',
                      borderTopColor: valve.status === 1 || valve.open === 1 ? '#52c41a' : '#ff4d4f'
                    }}
                  >
                    <div style={{ marginBottom: 8 }}>
                      <Text strong>{valve.name}</Text>
                      <Badge
                        status={(valve.status === 1 || valve.open === 1) ? 'success' : 'error'}
                        text={(valve.status === 1 || valve.open === 1) ? '已打开' : '已关闭'}
                        style={{ float: 'right' }}
                      />
                      {valve.fault === 1 && (
                        <Tag color="red" style={{ float: 'right', marginRight: 8 }}>故障</Tag>
                      )}
                    </div>

                    <div style={{ marginTop: 16 }}>
                      <Button
                        type="primary"
                        style={{ backgroundColor: '#52c41a', marginRight: 8 }}
                        disabled={(valve.status === 1 || valve.open === 1) || !hasControlPermission || valve.fault === 1}
                        onClick={() => handleValveControl(valve, 'open')}
                        loading={pendingCommands[valve.name]?.status === 'pending'}
                      >
                        打开
                      </Button>
                      <Button
                        danger
                        disabled={(valve.status !== 1 && valve.open !== 1) || !hasControlPermission || valve.fault === 1}
                        onClick={() => handleValveControl(valve, 'close')}
                        loading={pendingCommands[valve.name]?.status === 'pending'}
                      >
                        关闭
                      </Button>
                    </div>

                    {!hasControlPermission && (
                      <div style={{
                        marginTop: 8,
                        padding: '4px 8px',
                        backgroundColor: 'rgba(0, 0, 0, 0.05)',
                        borderRadius: 4,
                        color: 'rgba(0, 0, 0, 0.45)',
                        fontSize: 12
                      }}>
                        无控制权限
                      </div>
                    )}
                  </Card>
                </Col>
              ))}
            </Row>
          </>
        )}
      </Card>

      {/* 第三部分：实时数据区（由后端API获取） */}
      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center', color: '#2E7D32' }}>
            <DashboardOutlined style={{ marginRight: 8 }} />
            <span>实时数据</span>
            <Tag color="blue" style={{ marginLeft: 8 }}>API获取</Tag>
          </div>
        }
        className={styles.sectionCard}
      >
        {/* 动态渲染数据组 */}
        {dataGroups.originalDataGroups && dataGroups.originalDataGroups.length > 0 ? (
          dataGroups.originalDataGroups.map((group, groupIndex) => {
            if (!group.data || group.data.length === 0) return null;
            return (
              <React.Fragment key={`group-${group.id}-${groupIndex}`}>
                {groupIndex > 0 && <Divider />}
                {renderGroupHeader(group)}
                {visibleGroups[group.id] !== false && renderGroupContent(group)}
              </React.Fragment>
            );
          })
        ) : (
          <>
            {/* 传统渲染方式 - 向后兼容 */}
            {/* 传感器数据 - 进水数据 */}
            {inData && inData.length > 0 && (
              <>
                <h3 style={{ color: '#2E7D32', display: 'flex', alignItems: 'center', marginBottom: 16 }}>
                  <DashboardOutlined style={{ marginRight: 8 }} />
                  进水数据
                </h3>
                <Row gutter={[16, 16]}>
                  {inData.map((item, index) => (
                    <Col xs={24} sm={12} md={8} lg={6} key={`indata-${index}`}>
                      <DataCard data={item} type="sensor" />
                    </Col>
                  ))}
                </Row>
              </>
            )}

            {/* 传感器数据 - 出水数据 */}
            {outData && outData.length > 0 && (
              <>
                <Divider />
                <h3 style={{ color: '#2E7D32', display: 'flex', alignItems: 'center', marginBottom: 16 }}>
                  <DashboardOutlined style={{ marginRight: 8 }} />
                  出水数据
                </h3>
                <Row gutter={[16, 16]}>
                  {outData.map((item, index) => (
                    <Col xs={24} sm={12} md={8} lg={6} key={`outdata-${index}`}>
                      <DataCard data={item} type="sensor" />
                    </Col>
                  ))}
                </Row>
              </>
            )}

            {/* 能耗监控数据 */}
            {dataGroups.energy_stats && dataGroups.energy_stats.length > 0 && (
              <>
                <Divider />
                <h3 style={{ color: '#2E7D32', display: 'flex', alignItems: 'center', marginBottom: 16 }}>
                  <ThunderboltOutlined style={{ marginRight: 8 }} />
                  能耗监控
                </h3>
                <Row gutter={[16, 16]}>
                  {dataGroups.energy_stats.map((item, index) => (
                    <Col xs={24} sm={12} md={8} lg={6} key={`energy-${index}`}>
                      <DataCard data={item} type="energy" />
                    </Col>
                  ))}
                </Row>
              </>
            )}

            {/* 设备运行时间数据 */}
            {dataGroups.equipments && dataGroups.equipments.length > 0 && (
              <>
                <Divider />
                <h3 style={{ color: '#2E7D32', display: 'flex', alignItems: 'center', marginBottom: 16 }}>
                  <ClockCircleOutlined style={{ marginRight: 8 }} />
                  设备运行时间
                </h3>
                <Row gutter={[16, 16]}>
                  {dataGroups.equipments.map((item, index) => (
                    <Col xs={24} sm={12} md={8} lg={6} key={`equipment-${index}`}>
                      <DataCard data={item} type="runtime" />
                    </Col>
                  ))}
                </Row>
              </>
            )}

            {/* 工艺参数数据 */}
            {dataGroups.process_parameters && dataGroups.process_parameters.length > 0 && (
              <>
                <Divider />
                <h3 style={{ color: '#2E7D32', display: 'flex', alignItems: 'center', marginBottom: 16 }}>
                  <SettingOutlined style={{ marginRight: 8 }} />
                  工艺参数
                </h3>
                <Row gutter={[16, 16]}>
                  {dataGroups.process_parameters.map((item, index) => (
                    <Col xs={24} sm={12} md={8} lg={6} key={`process-${index}`}>
                      <DataCard data={item} type="process" />
                    </Col>
                  ))}
                </Row>
              </>
            )}

            {/* 化验数据 */}
            {dataGroups.lab_results && dataGroups.lab_results.length > 0 && (
              <>
                <Divider />
                <h3 style={{ color: '#2E7D32', display: 'flex', alignItems: 'center', marginBottom: 16 }}>
                  <ExperimentOutlined style={{ marginRight: 8 }} />
                  水质化验
                </h3>
                <Row gutter={[16, 16]}>
                  {dataGroups.lab_results.map((item, index) => (
                    <Col xs={24} sm={12} md={8} lg={6} key={`lab-${index}`}>
                      <DataCard data={item} type="laboratory" />
                    </Col>
                  ))}
                </Row>
              </>
            )}

            {/* 设备健康状态 */}
            {dataGroups.equipment_health && dataGroups.equipment_health.length > 0 && (
              <>
                <Divider />
                <h3 style={{ color: '#2E7D32', display: 'flex', alignItems: 'center', marginBottom: 16 }}>
                  <HeartOutlined style={{ marginRight: 8 }} />
                  设备健康
                </h3>
                <Row gutter={[16, 16]}>
                  {dataGroups.equipment_health.map((item, index) => (
                    <Col xs={24} sm={12} md={8} lg={6} key={`health-${index}`}>
                      <DataCard data={item} type="health" />
                    </Col>
                  ))}
                </Row>
              </>
            )}

            {/* 生产指标 */}
            {dataGroups.production_metrics && dataGroups.production_metrics.length > 0 && (
              <>
                <Divider />
                <h3 style={{ color: '#2E7D32', display: 'flex', alignItems: 'center', marginBottom: 16 }}>
                  <FundOutlined style={{ marginRight: 8 }} />
                  生产指标
                </h3>
                <Row gutter={[16, 16]}>
                  {dataGroups.production_metrics.map((item, index) => (
                    <Col xs={24} sm={12} md={8} lg={6} key={`production-${index}`}>
                      <DataCard data={item} type="production" />
                    </Col>
                  ))}
                </Row>
              </>
            )}
          </>
        )}

        {/* 如果没有任何数据，显示空状态 */}
        {(!dataGroups.originalDataGroups || dataGroups.originalDataGroups.length === 0) &&
         (!inData || inData.length === 0) &&
         (!outData || outData.length === 0) &&
         (!dataGroups.energy_stats || dataGroups.energy_stats.length === 0) &&
         (!dataGroups.equipments || dataGroups.equipments.length === 0) &&
         (!dataGroups.process_parameters || dataGroups.process_parameters.length === 0) &&
         (!dataGroups.lab_results || dataGroups.lab_results.length === 0) &&
         (!dataGroups.equipment_health || dataGroups.equipment_health.length === 0) &&
         (!dataGroups.production_metrics || dataGroups.production_metrics.length === 0) && (
          <Empty description="暂无实时数据" />
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
          <TabPane
            tab={
              <span>
                <AlertOutlined />
                告警记录
              </span>
            }
            key="alarms"
          >
            {dataGroups.alarms && dataGroups.alarms.length > 0 ? (
              dataGroups.alarms.map((alarm, index) => (
                <Alert
                  key={index}
                  message={alarm.name || (alarm.device ? `${alarm.device}: ${alarm.message}` : alarm.message)}
                  description={
                    <div>
                      <div>时间: {alarm.time || new Date(alarm.timestamp).toLocaleString()}</div>
                      {alarm.level && <div>级别: {
                        alarm.level === 'high' ? '高' :
                        alarm.level === 'medium' ? '中' :
                        alarm.level === 'low' ? '低' :
                        alarm.level
                      }</div>}
                      {alarm.status && <div>状态: {
                        alarm.status === 'confirmed' ? '已确认' :
                        alarm.status === 'unconfirmed' ? '未确认' :
                        alarm.status
                      }</div>}
                    </div>
                  }
                  type={
                    alarm.level === 'error' || alarm.level === 'high' ? 'error' :
                    alarm.level === 'medium' ? 'warning' :
                    alarm.level === 'low' ? 'info' :
                    'warning'
                  }
                  showIcon
                  className={styles.alarmAlert}
                  style={{ marginBottom: 16 }}
                />
              ))
            ) : (
              <Empty description="暂无告警记录" />
            )}
          </TabPane>
          <TabPane
            tab={
              <span>
                <LineChartOutlined />
                数据趋势
              </span>
            }
            key="data"
          >
            <div className={styles.chartSection}>
              {activeTab === 'data' ? (
                <TrendDataSection
                  siteId={siteId}
                  fetchTrendData={fetchTrendData}
                />
              ) : (
                <Empty description="请选择此选项卡查看数据趋势" />
              )}
            </div>
          </TabPane>
          <TabPane
            tab={
              <span>
                <TeamOutlined />
                管理部门
              </span>
            }
            key="departments"
          >
            {dataGroups.departments && dataGroups.departments.length > 0 ? (
              <List
                bordered
                dataSource={dataGroups.departments}
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
          </TabPane>
        </Tabs>
      </Card>

      {/* 频率设置模态框 */}
      <Modal
        title={`设置 ${selectedDevice?.name} 的频率`}
        visible={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setModalVisible(false)}>
            取消
          </Button>,
          <Button
            key="submit"
            type="primary"
            onClick={() => handleSetFrequency(selectedDevice, newFrequency)}
          >
            确定
          </Button>
        ]}
      >
        <div style={{ marginBottom: 16 }}>
          <div style={{ marginBottom: 8 }}>当前频率: {selectedDevice?.hz?.toFixed(2) || '0.00'} Hz</div>
          <Input
            placeholder="请输入频率值"
            suffix="Hz"
            type="number"
            step={0.1}
            min={0}
            max={60}
            value={newFrequency}
            onChange={(e) => setNewFrequency(e.target.value)}
          />
          <div style={{ marginTop: 8, fontSize: 12, color: 'rgba(0, 0, 0, 0.45)' }}>
            请输入0-60之间的频率值
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default SiteDetailNew;