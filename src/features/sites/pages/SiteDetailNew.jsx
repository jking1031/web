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
import apiManager from '../../../services/apiManager';
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
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isLoggedIn } = useAuth();
  const { connected, connect, disconnect, sendMessage, lastMessage } = useWebSocket();

  // 站点数据状态
  const [site, setSite] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('alarms');
  const [lastUpdateTime, setLastUpdateTime] = useState(null);

  // 权限控制状态
  const [hasControlPermission, setHasControlPermission] = useState(false);
  const [userRoles, setUserRoles] = useState([]);
  const [siteDepartments, setSiteDepartments] = useState([]);
  const [pendingCommands, setPendingCommands] = useState({});

  // 权限检查引用
  const checkingPermissionRef = useRef(false);
  const permissionRetryCountRef = useRef(0);
  const permissionCheckedRef = useRef(false);
  const lastPermissionCheckRef = useRef(0);

  // 频率设置模态框状态
  const [frequencyModalVisible, setFrequencyModalVisible] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [newFrequency, setNewFrequency] = useState('');

  // 分组显示/隐藏状态
  const [visibleGroups, setVisibleGroups] = useState(() => {
    try {
      const saved = localStorage.getItem(`site_visibility_${id}`);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const saveVisibilitySettings = useCallback((newSettings) => {
    setVisibleGroups(newSettings);
    try {
      localStorage.setItem(`site_visibility_${id}` , JSON.stringify(newSettings));
    } catch {}
  }, [id]);
  const toggleGroupVisibility = useCallback((groupId) => {
    setVisibleGroups(prev => {
      const newVisibility = {
        ...prev,
        [groupId]: prev[groupId] === false ? undefined : false
      };
      saveVisibilitySettings(newVisibility);
      return newVisibility;
    });
  }, [saveVisibilitySettings]);

  // 获取站点详情
  const fetchSiteDetail = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);

    try {
      console.log('开始获取站点详情, ID:', id);

      // 使用API管理系统调用getSiteById API
      const response = await apiManager.call('getSiteById', { id }, {
        showError: !silent // 只在非静默模式下显示错误
      });

      // 检查API调用是否成功
      if (!response || !response.success) {
        throw new Error(response?.error || '获取站点详情失败');
      }

      // 获取数据
      let data = response.data;

      console.log('获取到站点详情数据:', JSON.stringify(data, null, 2));

      // 处理数据格式 - 如果有dataGroups字段，则处理数据分组
      if (data.dataGroups && Array.isArray(data.dataGroups)) {
        console.log('检测到dataGroups数据格式，正在处理...');

        // 保存原始数据组，用于动态渲染
        data.originalDataGroups = [...data.dataGroups];

        // 处理数据分组 - 同时保持原始数据结构和映射到传统字段
        data.dataGroups.forEach(group => {
          const { id, type, name, data: groupData } = group;

          console.log(`处理数据组: ID=${id}, 类型=${type}, 名称=${name}, 数据项数量=${groupData?.length || 0}`);

          // 确保每个数据组都有类型和名称
          group.type = type || 'unknown';
          group.name = name || id || '未命名数据组';

          // 根据数据类型和ID映射到对应的字段
          switch (type) {
            case 'sensor':
              if (id === 'indata' || id.includes('in')) {
                data.inData = groupData;
                console.log('映射为进水数据');
              } else if (id === 'outdata' || id.includes('out')) {
                data.outData = groupData;
                console.log('映射为出水数据');
              }
              break;
            case 'energy':
              data.energy_stats = groupData;
              console.log('映射为能耗数据');
              break;
            case 'runtime':
              data.equipments = groupData;
              console.log('映射为设备运行时间数据');
              break;
            case 'process':
              // 根据ID判断是进水还是出水工艺参数
              if (id.includes('in')) {
                // 如果是进水工艺参数，映射为进水数据
                if (!data.inData) {
                  data.inData = groupData;
                  console.log('将进水工艺参数映射为进水数据');
                } else {
                  // 如果已有进水数据，则合并
                  data.inData = [...data.inData, ...groupData];
                  console.log('合并进水工艺参数到进水数据');
                }
              } else if (id.includes('out')) {
                // 如果是出水工艺参数，映射为出水数据
                if (!data.outData) {
                  data.outData = groupData;
                  console.log('将出水工艺参数映射为出水数据');
                } else {
                  // 如果已有出水数据，则合并
                  data.outData = [...data.outData, ...groupData];
                  console.log('合并出水工艺参数到出水数据');
                }
              } else {
                // 如果ID不包含in或out，则映射为工艺参数
                data.process_parameters = groupData;
                console.log('映射为工艺参数');
              }
              break;
            case 'alarm':
              if (!data.alarms) {
                data.alarms = groupData;
                console.log('映射为告警数据');
              }
              break;
            case 'laboratory':
              data.lab_results = groupData;
              console.log('映射为化验数据');
              break;
            case 'health':
              data.equipment_health = groupData;
              console.log('映射为设备健康状态数据');
              break;
            case 'production':
              data.production_metrics = groupData;
              console.log('映射为生产指标数据');
              break;
            case 'device':
              if (!data.devices) {
                // 转换设备数据格式
                data.devices = groupData.map(item => ({
                  name: item.name,
                  status: item.run === 1 ? 'running' : 'stopped',
                  fault: item.fault === 1
                }));
                console.log('映射为设备数据');
              }
              break;
            case 'valve':
              if (!data.isValve) {
                // 转换阀门数据格式
                data.isValve = groupData.map(item => ({
                  name: item.name,
                  status: item.open === 1 ? 1 : 0,
                  fault: item.fault === 1,
                  openKey: item.openKey,
                  closeKey: item.closeKey
                }));
                console.log('映射为阀门数据');
              }
              break;
            case 'frequency':
              if (!data.deviceFrequency) {
                data.deviceFrequency = groupData;
                console.log('映射为频率设备数据');
              }
              break;
            default:
              console.log(`未知数据类型: ${type}, ID: ${id}, 尝试根据ID进行智能映射`);

              // 智能映射 - 根据ID名称进行猜测
              if (id.includes('in')) {
                if (!data.inData) {
                  data.inData = groupData;
                  console.log('智能映射: 将数据映射为进水数据');
                } else {
                  data.inData = [...data.inData, ...groupData];
                  console.log('智能映射: 合并数据到进水数据');
                }
              } else if (id.includes('out')) {
                if (!data.outData) {
                  data.outData = groupData;
                  console.log('智能映射: 将数据映射为出水数据');
                } else {
                  data.outData = [...data.outData, ...groupData];
                  console.log('智能映射: 合并数据到出水数据');
                }
              } else if (id.includes('energy') || id.includes('power')) {
                data.energy_stats = groupData;
                console.log('智能映射: 将数据映射为能耗数据');
              } else if (id.includes('alarm')) {
                data.alarms = groupData;
                console.log('智能映射: 将数据映射为告警数据');
              } else if (id.includes('device') || id.includes('equipment')) {
                data.devices = groupData;
                console.log('智能映射: 将数据映射为设备数据');
              } else if (id.includes('valve')) {
                data.isValve = groupData;
                console.log('智能映射: 将数据映射为阀门数据');
              } else if (id.includes('freq')) {
                data.deviceFrequency = groupData;
                console.log('智能映射: 将数据映射为频率设备数据');
              } else if (id.includes('lab') || id.includes('test')) {
                data.lab_results = groupData;
                console.log('智能映射: 将数据映射为化验数据');
              } else if (id.includes('health')) {
                data.equipment_health = groupData;
                console.log('智能映射: 将数据映射为设备健康状态数据');
              } else if (id.includes('prod')) {
                data.production_metrics = groupData;
                console.log('智能映射: 将数据映射为生产指标数据');
              } else if (id.includes('process') || id.includes('param')) {
                data.process_parameters = groupData;
                console.log('智能映射: 将数据映射为工艺参数数据');
              } else {
                // 如果无法确定，则根据数据结构进行猜测
                if (groupData && groupData.length > 0) {
                  const firstItem = groupData[0];
                  if (firstItem.value !== undefined && firstItem.unit !== undefined &&
                      firstItem.lowerLimit !== undefined && firstItem.upperLimit !== undefined) {
                    // 看起来是工艺参数
                    data.process_parameters = groupData;
                    console.log('智能映射: 根据数据结构将数据映射为工艺参数数据');
                  } else if (firstItem.data !== undefined && firstItem.dw !== undefined) {
                    // 看起来是传感器数据
                    if (!data.inData) {
                      data.inData = groupData;
                      console.log('智能映射: 根据数据结构将数据映射为进水数据');
                    }
                  }
                }
              }
          }
        });
      }

      // 检查数据结构
      console.log('处理后的站点数据结构检查:');
      console.log('- 站点名称:', data.name);
      console.log('- 设备信息:', data.devices ? `${data.devices.length}个设备` : '无设备信息');
      console.log('- 实时数据:',
        (data.inData || data.outData) ?
        `进水数据:${data.inData?.length || 0}项, 出水数据:${data.outData?.length || 0}项` :
        '无实时数据'
      );
      console.log('- 告警信息:', data.alarms ? `${data.alarms.length}条告警` : '无告警信息');
      console.log('- 部门信息:', data.departments ? `${data.departments.length}个部门` : '无部门信息');
      console.log('- 能耗数据:', data.energy_stats ? `${data.energy_stats.length}项` : '无能耗数据');
      console.log('- 设备运行时间:', data.equipments ? `${data.equipments.length}项` : '无设备运行时间数据');
      console.log('- 工艺参数:', data.process_parameters ? `${data.process_parameters.length}项` : '无工艺参数数据');
      console.log('- 化验数据:', data.lab_results ? `${data.lab_results.length}项` : '无化验数据');
      console.log('- 设备健康状态:', data.equipment_health ? `${data.equipment_health.length}项` : '无设备健康状态数据');
      console.log('- 生产指标:', data.production_metrics ? `${data.production_metrics.length}项` : '无生产指标数据');
      console.log('- 频率设备:', data.deviceFrequency ? `${data.deviceFrequency.length}项` : '无频率设备数据');
      console.log('- 阀门:', data.isValve ? `${data.isValve.length}项` : '无阀门数据');

      setSite(data);
      if (data.departments) setSiteDepartments(data.departments);
      setLastUpdateTime(new Date());
      setError(null);

      return data;
    } catch (err) {
      if (!silent) {
        setError('获取站点详情失败');
        message.error('获取站点详情失败');
      }
      console.error('获取站点详情失败:', err);
      return null;
    } finally {
      if (!silent) setLoading(false);
    }
  }, [id]);

  // 获取用户角色
  const getUserRoles = useCallback(async (userId, forceRefresh = false) => {
    try {
      // 使用API管理系统调用getUserRoles API
      const response = await apiManager.call('getUserRoles', { userId }, {
        showError: false, // 不显示错误消息
        cacheTime: forceRefresh ? 0 : undefined // 如果强制刷新，不使用缓存
      });

      // 检查API调用是否成功
      if (!response || !response.success) {
        throw new Error(response?.error || '获取用户角色失败');
      }

      // 获取角色数据
      const roles = response.data;
      setUserRoles(roles);
      return roles;
    } catch (err) {
      console.error('获取用户角色失败:', err);
      return [];
    }
  }, []);

  // 检查用户是否有权限控制设备
  const checkControlPermission = useCallback(async (forceCheck = false) => {
    // 避免重复检查
    if (checkingPermissionRef.current && !forceCheck) {
      return hasControlPermission;
    }

    checkingPermissionRef.current = true;

    try {
      // 获取当前用户信息
      if (!user) {
        setHasControlPermission(false);
        return false;
      }

      // 获取站点部门信息
      let currentDepartments = siteDepartments;
      if (!currentDepartments || currentDepartments.length === 0) {
        // 尝试从API获取站点详情
        const siteData = await fetchSiteDetail(true);
        if (siteData?.departments) {
          currentDepartments = siteData.departments;
        }
      }

      // 如果仍然没有部门信息
      if (!currentDepartments || currentDepartments.length === 0) {
        setHasControlPermission(false);
        return false;
      }

      // 管理员始终有权限
      if (user && (user.is_admin === 1 || user.isAdmin === true)) {
        console.log('管理员拥有完全控制权限');
        setHasControlPermission(true);
        return true;
      }

      // 获取用户角色
      let currentRoles = userRoles;
      if (!currentRoles || currentRoles.length === 0) {
        currentRoles = await getUserRoles(user.id, true);
      }

      // 从userRoles中提取角色名称
      const userRoleNames = currentRoles.map(role => {
        // role可能是对象或直接是ID
        if (typeof role === 'object' && role !== null) {
          // 从roleMap中获取角色名称
          const roleId = role.id || role.role_id;
          if (roleId) {
            // 角色映射
            const roleMap = {
              1: '管理员',
              2: '部门管理员',
              3: '运行班组',
              4: '化验班组',
              5: '机电班组',
              6: '污泥车间',
              7: '5000吨处理站',
              8: '附属设施',
              9: '备用权限'
            };
            return roleMap[roleId] || role.name;
          }
          return role.name;
        }
        return role; // 如果role直接是名称字符串
      }).filter(name => name); // 移除undefined或null

      // 检查用户角色是否与站点部门匹配
      const hasPermission = userRoleNames.some(roleName =>
        currentDepartments.includes(roleName)
      );

      console.log('权限检查结果:', hasPermission ? '有权限' : '无权限');
      setHasControlPermission(hasPermission);

      return hasPermission;
    } catch (error) {
      console.error('检查权限出错:', error);
      setHasControlPermission(false);
      return false;
    } finally {
      checkingPermissionRef.current = false;
    }
  }, [user, userRoles, siteDepartments, fetchSiteDetail, getUserRoles, hasControlPermission]);

  // 在用户信息或站点信息变化时重新检查权限
  useEffect(() => {
    if (user && siteDepartments?.length > 0) {
      checkControlPermission();
    }
  }, [user, siteDepartments, checkControlPermission]);

  // 页面获得焦点时检查权限
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkControlPermission();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [checkControlPermission]);

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

    // 将API注册到当前页面
    try {
      apiManager.registry.setPageApis('siteDetail', ['getSiteById', 'getAlarms', 'getTrendData', 'getUserRoles']);
    } catch (error) {
      console.error('设置页面API失败:', error);
    }
  }, []);

  // 获取告警信息
  const fetchAlarms = useCallback(async (silent = false) => {
    try {
      // 使用API管理系统调用getAlarms API
      const response = await apiManager.call('getAlarms', { siteId: id }, {
        showError: !silent // 只在非静默模式下显示错误
      });

      // 检查API调用是否成功
      if (!response || !response.success) {
        throw new Error(response?.error || '获取告警信息失败');
      }

      // 获取告警数据
      const alarms = response.data;

      // 更新站点数据中的告警信息
      setSite(prevSite => ({
        ...prevSite,
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
  }, [id]);

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
        if (isLoggedIn && user?.id) {
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
      disconnect();
    };
  }, [id, fetchSiteDetail, disconnect, isLoggedIn, user, getUserRoles, fetchAlarms]);

  // 获取历史趋势数据
  const fetchTrendData = useCallback(async (params, silent = false) => {
    try {
      // 使用API管理系统调用getTrendData API
      const response = await apiManager.call('getTrendData', {
        siteId: id,
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
  }, [id]);

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
              siteId: id
            });
            break;

          case 'device_status':
            // 更新设备状态
            if (data && site) {
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

              setSite(prevSite => ({
                ...prevSite,
                devices: data.devices || prevSite.devices,
                deviceFrequency: data.deviceFrequency || prevSite.deviceFrequency,
                isValve: data.isValve || prevSite.isValve
              }));
            }
            break;

          case 'real_time_data':
            // 更新实时数据
            if (data && site) {
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

              setSite(prevSite => ({
                ...prevSite,
                inData: data.inData || prevSite.inData,
                outData: data.outData || prevSite.outData,
                energy_stats: data.energy_stats || prevSite.energy_stats,
                equipments: data.equipments || prevSite.equipments,
                process_parameters: data.process_parameters || prevSite.process_parameters,
                lab_results: data.lab_results || prevSite.lab_results,
                equipment_health: data.equipment_health || prevSite.equipment_health,
                production_metrics: data.production_metrics || prevSite.production_metrics
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
                  siteId: id
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
  }, [lastMessage, site, id, sendMessage]);

  // 刷新数据
  const handleRefresh = () => {
    fetchSiteDetail();
    fetchAlarms(true);

    // 如果WebSocket已连接，请求最新设备状态
    if (connected) {
      sendMessage({
        type: 'get_device_status',
        siteId: id
      });
    }
  };

  // 设备控制函数
  const handleDeviceControl = useCallback((deviceName, action) => {
    // 权限检查
    if (!hasControlPermission) {
      message.error('权限不足，您没有控制此设备的权限');
      return;
    }

    try {
      // 如果WebSocket未连接，先连接WebSocket
      if (!connected) {
        console.log('WebSocket未连接，正在连接...');
        connect(id);

        // 显示连接中消息
        message.loading('正在建立设备控制连接，请稍候...', 2);

        // 延迟发送命令，等待WebSocket连接建立
        setTimeout(() => {
          if (connected) {
            // 发送设备控制命令
            sendDeviceCommand(deviceName, action);
          } else {
            message.error('无法建立设备控制连接，请稍后重试');
          }
        }, 2000);

        return;
      }

      // 如果WebSocket已连接，直接发送命令
      sendDeviceCommand(deviceName, action);

    } catch (error) {
      console.error('发送设备控制命令失败:', error);
      message.error('发送控制命令失败');
    }
  }, [hasControlPermission, id, connect, connected, sendMessage]);

  // 发送设备控制命令
  const sendDeviceCommand = useCallback((deviceName, action) => {
    try {
      // 发送设备控制命令
      sendMessage({
        type: 'command',
        siteId: id,
        deviceName,
        action,
        timestamp: Date.now()
      });

      // 更新UI状态
      setPendingCommands(prev => ({
        ...prev,
        [deviceName]: { status: 'pending', timestamp: Date.now() }
      }));

      message.info(`正在${action === 'start' ? '启动' : '停止'}设备: ${deviceName}`);
    } catch (error) {
      console.error('发送设备控制命令失败:', error);
      message.error('发送控制命令失败');
    }
  }, [id, sendMessage]);

  // 阀门控制函数
  const handleValveControl = useCallback((valveName, action) => {
    // 权限检查
    if (!hasControlPermission) {
      message.error('权限不足，您没有控制此阀门的权限');
      return;
    }

    try {
      // 如果WebSocket未连接，先连接WebSocket
      if (!connected) {
        console.log('WebSocket未连接，正在连接...');
        connect(id);

        // 显示连接中消息
        message.loading('正在建立设备控制连接，请稍候...', 2);

        // 延迟发送命令，等待WebSocket连接建立
        setTimeout(() => {
          if (connected) {
            // 发送阀门控制命令
            sendValveCommand(valveName, action);
          } else {
            message.error('无法建立设备控制连接，请稍后重试');
          }
        }, 2000);

        return;
      }

      // 如果WebSocket已连接，直接发送命令
      sendValveCommand(valveName, action);

    } catch (error) {
      console.error('发送阀门控制命令失败:', error);
      message.error('发送控制命令失败');
    }
  }, [hasControlPermission, id, connect, connected, sendMessage]);

  // 发送阀门控制命令
  const sendValveCommand = useCallback((valveName, action) => {
    try {
      // 发送阀门控制命令
      sendMessage({
        type: 'valve_command',
        siteId: id,
        valveName,
        action,
        timestamp: Date.now()
      });

      // 更新UI状态
      setPendingCommands(prev => ({
        ...prev,
        [valveName]: { status: 'pending', timestamp: Date.now() }
      }));

      message.info(`正在${action === 'open' ? '打开' : '关闭'}阀门: ${valveName}`);
    } catch (error) {
      console.error('发送阀门控制命令失败:', error);
      message.error('发送控制命令失败');
    }
  }, [id, sendMessage]);

  // 频率设置函数
  const handleSetFrequency = useCallback((deviceName, frequency) => {
    // 权限检查
    if (!hasControlPermission) {
      message.error('权限不足，您没有设置频率的权限');
      return;
    }

    // 验证频率值
    const freqValue = parseFloat(frequency);
    if (isNaN(freqValue) || freqValue < 0 || freqValue > 60) {
      message.error('请输入有效的频率值（0-60Hz）');
      return;
    }

    try {
      // 如果WebSocket未连接，先连接WebSocket
      if (!connected) {
        console.log('WebSocket未连接，正在连接...');
        connect(id);

        // 显示连接中消息
        message.loading('正在建立设备控制连接，请稍候...', 2);

        // 延迟发送命令，等待WebSocket连接建立
        setTimeout(() => {
          if (connected) {
            // 发送频率设置命令
            sendFrequencyCommand(deviceName, freqValue);
          } else {
            message.error('无法建立设备控制连接，请稍后重试');
          }
        }, 2000);

        return;
      }

      // 如果WebSocket已连接，直接发送命令
      sendFrequencyCommand(deviceName, freqValue);

    } catch (error) {
      console.error('发送频率设置命令失败:', error);
      message.error('发送频率设置命令失败');
    }
  }, [hasControlPermission, id, connect, connected, sendMessage, frequencyModalVisible]);

  // 发送频率设置命令
  const sendFrequencyCommand = useCallback((deviceName, freqValue) => {
    try {
      // 发送频率设置命令
      sendMessage({
        type: 'set_frequency',
        siteId: id,
        deviceName,
        frequency: freqValue,
        timestamp: Date.now()
      });

      // 更新UI状态
      setPendingCommands(prev => ({
        ...prev,
        [deviceName]: { status: 'pending', timestamp: Date.now() }
      }));

      message.info(`正在设置 ${deviceName} 的频率为 ${freqValue}Hz`);

      // 关闭模态框
      if (frequencyModalVisible) {
        setFrequencyModalVisible(false);
      }
    } catch (error) {
      console.error('发送频率设置命令失败:', error);
      message.error('发送频率设置命令失败');
    }
  }, [id, sendMessage, frequencyModalVisible]);

  // 打开频率设置模态框
  const showFrequencyModal = (device) => {
    setSelectedDevice(device);
    setNewFrequency(device.sethz?.toFixed(1) || '');
    setFrequencyModalVisible(true);
  };

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
      {group.data.map((item,idx)=>(<Col xs={24} sm={12} md={8} lg={6} key={idx}> {/* TODO:设备卡片 */} </Col>))}
    </Row>
  );
  const renderValveGroup = (group) => (
    <Row gutter={[16,16]}>
      {group.data.map((item,idx)=>(<Col xs={24} sm={12} md={8} lg={6} key={idx}> {/* TODO:阀门卡片 */} </Col>))}
    </Row>
  );
  const renderEnergyGroup = (group) => (
    <Row gutter={[16,16]}>
      {group.data.map((item,idx)=>(<Col xs={24} sm={12} md={8} lg={6} key={idx}> {/* TODO:能耗卡片 */} </Col>))}
    </Row>
  );
  const renderRuntimeGroup = (group) => (
    <Row gutter={[16,16]}>
      {group.data.map((item,idx)=>(<Col xs={24} sm={12} md={8} lg={6} key={idx}> {/* TODO:运行时间卡片 */} </Col>))}
    </Row>
  );
  const renderProcessGroup = (group) => (
    <Row gutter={[16,16]}>
      {group.data.map((item,idx)=>(<Col xs={24} sm={12} md={8} lg={6} key={idx}> {/* TODO:工艺参数卡片 */} </Col>))}
    </Row>
  );
  const renderAlarmGroup = (group) => (
    <Row gutter={[16,16]}>
      {group.data.map((item,idx)=>(<Col xs={24} sm={12} md={8} lg={6} key={idx}> {/* TODO:报警卡片 */} </Col>))}
    </Row>
  );
  const renderLabGroup = (group) => (
    <Row gutter={[16,16]}>
      {group.data.map((item,idx)=>(<Col xs={24} sm={12} md={8} lg={6} key={idx}> {/* TODO:化验卡片 */} </Col>))}
    </Row>
  );
  const renderHealthGroup = (group) => (
    <Row gutter={[16,16]}>
      {group.data.map((item,idx)=>(<Col xs={24} sm={12} md={8} lg={6} key={idx}> {/* TODO:健康卡片 */} </Col>))}
    </Row>
  );
  const renderProductionGroup = (group) => (
    <Row gutter={[16,16]}>
      {group.data.map((item,idx)=>(<Col xs={24} sm={12} md={8} lg={6} key={idx}> {/* TODO:生产指标卡片 */} </Col>))}
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
  if (loading) {
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
  if (!site) {
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
        <h1 className={styles.pageTitle}>{site.name}</h1>
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
              {site.totalInflow !== null && site.totalInflow !== undefined && (
                <Descriptions.Item label="总进水量">
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <DashboardOutlined style={{ marginRight: 4, color: '#2E7D32' }} />
                    {site.totalInflow.toFixed(2)} 吨
                  </div>
                </Descriptions.Item>
              )}
              {(site.totalInflow === null || site.totalInflow === undefined) && (
                <Descriptions.Item label="总进水量">
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <DashboardOutlined style={{ marginRight: 4, color: '#2E7D32' }} />
                    0.00 吨
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
            status={connected ? 'success' : 'error'}
            text={connected ? '设备控制已连接' : '设备控制未连接'}
          />
          {!connected && (
            <Button
              type="primary"
              size="small"
              onClick={() => connect(id)}
              style={{ marginLeft: 16 }}
            >
              连接
            </Button>
          )}
        </div>

        {/* 设备控制 */}
        {site.devices && site.devices.length > 0 ? (
          <Row gutter={[16, 16]}>
            {site.devices.map(device => (
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
                      onClick={() => handleDeviceControl(device.name, 'start')}
                      loading={pendingCommands[device.name]?.status === 'pending'}
                    >
                      启动
                    </Button>
                    <Button
                      danger
                      disabled={(device.status !== 'running' && device.run !== 1) || !hasControlPermission || device.fault === 1}
                      onClick={() => handleDeviceControl(device.name, 'stop')}
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
                        onClick={() => showFrequencyModal(device)}
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
                        onClick={() => handleValveControl(valve.name, 'open')}
                        loading={pendingCommands[valve.name]?.status === 'pending'}
                      >
                        打开
                      </Button>
                      <Button
                        danger
                        disabled={(valve.status !== 1 && valve.open !== 1) || !hasControlPermission || valve.fault === 1}
                        onClick={() => handleValveControl(valve.name, 'close')}
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
        {site.originalDataGroups && site.originalDataGroups.length > 0 ? (
          site.originalDataGroups.map((group, groupIndex) => {
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
            {site.inData && site.inData.length > 0 && (
              <>
                <h3 style={{ color: '#2E7D32', display: 'flex', alignItems: 'center', marginBottom: 16 }}>
                  <DashboardOutlined style={{ marginRight: 8 }} />
                  进水数据
                </h3>
                <Row gutter={[16, 16]}>
                  {site.inData.map((item, index) => (
                    <Col xs={24} sm={12} md={8} lg={6} key={`indata-${index}`}>
                      <DataCard data={item} type="sensor" />
                    </Col>
                  ))}
                </Row>
              </>
            )}

            {/* 传感器数据 - 出水数据 */}
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
                      <DataCard data={item} type="sensor" />
                    </Col>
                  ))}
                </Row>
              </>
            )}

            {/* 能耗监控数据 */}
            {site.energy_stats && site.energy_stats.length > 0 && (
              <>
                <Divider />
                <h3 style={{ color: '#2E7D32', display: 'flex', alignItems: 'center', marginBottom: 16 }}>
                  <ThunderboltOutlined style={{ marginRight: 8 }} />
                  能耗监控
                </h3>
                <Row gutter={[16, 16]}>
                  {site.energy_stats.map((item, index) => (
                    <Col xs={24} sm={12} md={8} lg={6} key={`energy-${index}`}>
                      <DataCard data={item} type="energy" />
                    </Col>
                  ))}
                </Row>
              </>
            )}

            {/* 设备运行时间数据 */}
            {site.equipments && site.equipments.length > 0 && (
              <>
                <Divider />
                <h3 style={{ color: '#2E7D32', display: 'flex', alignItems: 'center', marginBottom: 16 }}>
                  <ClockCircleOutlined style={{ marginRight: 8 }} />
                  设备运行时间
                </h3>
                <Row gutter={[16, 16]}>
                  {site.equipments.map((item, index) => (
                    <Col xs={24} sm={12} md={8} lg={6} key={`equipment-${index}`}>
                      <DataCard data={item} type="runtime" />
                    </Col>
                  ))}
                </Row>
              </>
            )}

            {/* 工艺参数数据 */}
            {site.process_parameters && site.process_parameters.length > 0 && (
              <>
                <Divider />
                <h3 style={{ color: '#2E7D32', display: 'flex', alignItems: 'center', marginBottom: 16 }}>
                  <SettingOutlined style={{ marginRight: 8 }} />
                  工艺参数
                </h3>
                <Row gutter={[16, 16]}>
                  {site.process_parameters.map((item, index) => (
                    <Col xs={24} sm={12} md={8} lg={6} key={`process-${index}`}>
                      <DataCard data={item} type="process" />
                    </Col>
                  ))}
                </Row>
              </>
            )}

            {/* 化验数据 */}
            {site.lab_results && site.lab_results.length > 0 && (
              <>
                <Divider />
                <h3 style={{ color: '#2E7D32', display: 'flex', alignItems: 'center', marginBottom: 16 }}>
                  <ExperimentOutlined style={{ marginRight: 8 }} />
                  水质化验
                </h3>
                <Row gutter={[16, 16]}>
                  {site.lab_results.map((item, index) => (
                    <Col xs={24} sm={12} md={8} lg={6} key={`lab-${index}`}>
                      <DataCard data={item} type="laboratory" />
                    </Col>
                  ))}
                </Row>
              </>
            )}

            {/* 设备健康状态 */}
            {site.equipment_health && site.equipment_health.length > 0 && (
              <>
                <Divider />
                <h3 style={{ color: '#2E7D32', display: 'flex', alignItems: 'center', marginBottom: 16 }}>
                  <HeartOutlined style={{ marginRight: 8 }} />
                  设备健康
                </h3>
                <Row gutter={[16, 16]}>
                  {site.equipment_health.map((item, index) => (
                    <Col xs={24} sm={12} md={8} lg={6} key={`health-${index}`}>
                      <DataCard data={item} type="health" />
                    </Col>
                  ))}
                </Row>
              </>
            )}

            {/* 生产指标 */}
            {site.production_metrics && site.production_metrics.length > 0 && (
              <>
                <Divider />
                <h3 style={{ color: '#2E7D32', display: 'flex', alignItems: 'center', marginBottom: 16 }}>
                  <FundOutlined style={{ marginRight: 8 }} />
                  生产指标
                </h3>
                <Row gutter={[16, 16]}>
                  {site.production_metrics.map((item, index) => (
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
        {(!site.originalDataGroups || site.originalDataGroups.length === 0) &&
         (!site.inData || site.inData.length === 0) &&
         (!site.outData || site.outData.length === 0) &&
         (!site.energy_stats || site.energy_stats.length === 0) &&
         (!site.equipments || site.equipments.length === 0) &&
         (!site.process_parameters || site.process_parameters.length === 0) &&
         (!site.lab_results || site.lab_results.length === 0) &&
         (!site.equipment_health || site.equipment_health.length === 0) &&
         (!site.production_metrics || site.production_metrics.length === 0) && (
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
            {site.alarms && site.alarms.length > 0 ? (
              site.alarms.map((alarm, index) => (
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
                  siteId={id}
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
          </TabPane>
        </Tabs>
      </Card>

      {/* 频率设置模态框 */}
      <Modal
        title={`设置 ${selectedDevice?.name} 的频率`}
        visible={frequencyModalVisible}
        onCancel={() => setFrequencyModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setFrequencyModalVisible(false)}>
            取消
          </Button>,
          <Button
            key="submit"
            type="primary"
            onClick={() => handleSetFrequency(selectedDevice?.name, newFrequency)}
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