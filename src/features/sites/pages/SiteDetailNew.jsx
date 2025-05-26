import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Row, Col, Card, Tabs, Badge, Button, Spin, Empty, Statistic, Descriptions,
  Alert, message, Tag, Divider, List, Input, Typography, Progress, Modal, Space, Form
} from 'antd';
import {
  DashboardOutlined, ThunderboltOutlined, ClockCircleOutlined, SettingOutlined,
  ExperimentOutlined, HeartOutlined, FundOutlined, AppstoreOutlined,
  AlertOutlined, LineChartOutlined, EnvironmentOutlined, ApartmentOutlined,
  TeamOutlined, ReloadOutlined, LeftOutlined, ExclamationCircleOutlined, EyeInvisibleOutlined, EyeOutlined,
  FullscreenOutlined, FullscreenExitOutlined
} from '@ant-design/icons';
import { useWebSocket } from '../../../context/WebSocketContext';
import { useAuth } from '../../../context/auth';
import apiManager from '../../../services/api/core/apiManager';
import TrendDataSection from '../components/TrendDataSection';
import ApiEditorButton from '../../../components/ApiEditor/ApiEditorButton';
import styles from './SiteDetail.module.scss';

const { Text } = Typography;
const { TabPane } = Tabs;
const { Title } = Typography;

// 全局数字格式化函数
const formatNumber = (value, precision = 2) => {
  if (value === null || value === undefined) return '0.00';
  return typeof value === 'number' ? Number(value).toFixed(precision) : value;
};

/**
 * 站点详情页组件 - 新版本
 * 基于文档重新构建，包含四个主要部分：
 * 1. 站点信息区：显示站点基本信息和统计卡片，可从站点列表传入或调用getSiteList API获取数据
 * 2. 设备信息区：展示设备、频率设备和阀门状态，并通过WebSocket实现实时控制功能
 * 3. 实时数据区：根据不同数据类型动态渲染UI组件，支持分组显示和隐藏（与设备信息区共用getSiteById API）
 * 4. 告警信息和历史趋势区：包含告警记录和历史数据趋势图表，通过专门的API调用获取数据
 */
const SiteDetailNew = () => {
  const { id: siteId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { lastMessage, sendMessage, connected: wsConnected, connect, disconnect } = useWebSocket();
  
  // 获取从SiteList传递来的站点数据
  const location = useLocation();
  const { state } = location;
  
  // 全屏状态
  const [isFullscreen, setIsFullscreen] = useState(false);
  const pageContainerRef = useRef(null);
  
  // 输出路由状态信息 (用于调试)
  useEffect(() => {
    if (state && state.siteData) {
      console.log('收到从SiteList传递的站点数据:', state.siteData);
    } else {
      console.log('未收到从SiteList传递的站点数据，将使用API获取');
    }
  }, [state]);
  
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
  const [localUserRoles] = useState([
    { id: "admin", name: "管理员", permissions: ["site_control"] }
  ]);
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
    const [apiErrorCounts, setApiErrorCounts] = useState({});
  const maxRetries = 3;
  const retryDelay = 2000; // 2秒

  // 分组显示控制
  const [visibleGroups, setVisibleGroups] = useState({});
  const [activeTab, setActiveTab] = useState(() => {
    return sessionStorage.getItem('zziot_default_tab') || 'alarms';
  });
  const [activeDeviceTab, setActiveDeviceTab] = useState(() => {
    return sessionStorage.getItem('zziot_default_device_tab') || 'devices';
  });
  const [activeProcessTab, setActiveProcessTab] = useState(() => {
    return sessionStorage.getItem('zziot_default_process_tab') || 'sensors';
  });

  // 设置默认选项卡的处理函数
  const handleSetDefaultDeviceTab = (tabKey) => {
    sessionStorage.setItem('zziot_default_device_tab', tabKey);
    message.success(`已设置"${tabKey}"为设备数据默认选项卡`);
  };

  const handleSetDefaultProcessTab = (tabKey) => {
    sessionStorage.setItem('zziot_default_process_tab', tabKey);
    message.success(`已设置"${tabKey}"为工艺数据默认选项卡`);
  };

  const handleSetDefaultMainTab = (tabKey) => {
    sessionStorage.setItem('zziot_default_tab', tabKey);
    message.success(`已设置"${tabKey}"为默认主选项卡`);
  };

  // 模态框状态
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [newFrequency, setNewFrequency] = useState('');

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

  // 初始化API统计对象
  useEffect(() => {
    // 初始化全局API统计
    window._API_STATS = window._API_STATS || {};
    
    // 创建一个定时器，每30秒打印一次API统计信息
    const statsTimer = setInterval(() => {
      const stats = window._API_STATS;
      if (!stats) return;
      
      console.log('📊 API调用统计信息 📊');
      console.table(Object.keys(stats).map(apiName => ({
        API名称: apiName,
        调用次数: stats[apiName].callCount,
        平均响应时间: stats[apiName].avgResponseTime ? `${stats[apiName].avgResponseTime.toFixed(2)}ms` : 'N/A',
        错误次数: stats[apiName].errors,
        上次调用: stats[apiName].lastCallTime ? new Date(stats[apiName].lastCallTime).toLocaleTimeString() : 'N/A',
        API地址: stats[apiName].url
      })));
    }, 30000);
    
    return () => {
      clearInterval(statsTimer);
    };
  }, []);
  
  // API调用详细日志器
  const logApiCall = useCallback((apiName, params, verbose = false) => {
    try {
      const apiInfo = apiManager.registry.get(apiName);
      if (!apiInfo) {
        console.log(`API未注册: ${apiName}`);
        return;
      }
      
      // 获取原始URL
      let url = apiInfo.url;
      
      // 替换URL中的参数
      Object.keys(params || {}).forEach(key => {
        const paramPlaceholder = `:${key}`;
        if (url.includes(paramPlaceholder)) {
          url = url.replace(paramPlaceholder, params[key]);
        }
      });
      
      // API统计信息记录
      const now = new Date();
      const apiStats = window._API_STATS = window._API_STATS || {};
      apiStats[apiName] = apiStats[apiName] || {
        callCount: 0,
        lastCallTime: null,
        avgResponseTime: 0,
        errors: 0,
        url: url
      };
      
      apiStats[apiName].callCount++;
      
      if (apiStats[apiName].lastCallTime) {
        const timeSinceLastCall = now - new Date(apiStats[apiName].lastCallTime);
        apiStats[apiName].timeSinceLastCall = timeSinceLastCall;
      }
      
      apiStats[apiName].lastCallTime = now;
      
      // 始终打印API请求信息
      console.log(`🔄 API请求: ${apiName} | URL: ${url} | 参数:`, params);
      
      // 获取完整的请求配置
      const fullConfig = {
        method: apiInfo.method,
        headers: apiInfo.headers,
        timeout: apiInfo.timeout
      };
      
      // 详细模式输出更多信息
      if (verbose) {
        console.log(`API详细配置 (${apiName}):`, fullConfig);
      }
      
      return {
        startTime: now,
        apiName,
        url
      };
    } catch (err) {
      console.error('打印API信息出错:', err);
      return null;
    }
  }, []);

  // 切换分组显示状态
  const toggleGroupVisibility = useCallback((groupId) => {
    setVisibleGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  }, []);

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
      // 设置默认有权限
        setHasControlPermission(true);
      setPermissionChecked(true);
      lastPermissionCheckRef.current = Date.now();
    } finally {
      checkingPermissionRef.current = false;
    }
  }, [permissionChecked]);

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

  // 组件挂载时检查权限一次
  useEffect(() => {
    if (!permissionChecked) {
      checkUserPermission();
    }
  }, [checkUserPermission, permissionChecked]);

  // 简化后的页面获焦处理 - 不再需要频繁检查权限
  useEffect(() => {
    const handleVisibilityChange = () => {
      // 页面可见时只检查一次权限
      if (document.visibilityState === 'visible' && !permissionChecked) {
        checkUserPermission();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [checkUserPermission, permissionChecked]);

  // 注册站点详情页使用的API
  useEffect(() => {
    // 检查getSiteById API是否存在
    const siteDetailApi = apiManager.registry.get('getSiteById');

    if (!siteDetailApi) {
      // 只在开发环境中输出日志
      if (process.env.NODE_ENV === 'development') {
      console.log('注册站点详情API');
      }
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
        },
        onRequest: (config) => {
          // 移除过多的日志输出
          return config;
        },
        onResponse: (response) => {
          // 移除过多的日志输出
          return response;
        }
      });
    }
    
    // 检查getSiteList API是否存在
    const siteListApi = apiManager.registry.get('getSiteList');

    if (!siteListApi) {
      // 只在开发环境中输出日志
      if (process.env.NODE_ENV === 'development') {
        console.log('注册站点列表API');
      }
      // 注册站点列表API，可用于获取站点基本信息
      apiManager.registry.register('getSiteList', {
        name: '获取站点列表',
        url: 'https://nodered.jzz77.cn:9003/api/site/sites',
        method: 'GET',
        category: 'system',
        status: 'enabled',
        description: '获取所有站点基本信息列表',
        timeout: 10000,
        retries: 1,
        cacheTime: 300000, // 5分钟缓存
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    // 检查getAlarms API是否存在
    const alarmsApi = apiManager.registry.get('getAlarms');

    if (!alarmsApi) {
      // 只在开发环境中输出日志
      if (process.env.NODE_ENV === 'development') {
      console.log('注册告警信息API');
      }
      // 注册告警信息API
      apiManager.registry.register('getAlarms', {
        name: '获取告警信息',
        url: 'https://nodered.jzz77.cn:9003/api/site/alarms',
        method: 'GET',
        category: 'system',
        status: 'enabled',
        description: '获取站点告警信息',
        timeout: 10000,
        retries: 1,
        cacheTime: 60000, // 60秒缓存
        headers: {
          'Content-Type': 'application/json'
        },
        onRequest: (config) => {
          // 移除过多的日志输出
          return config;
        },
        onResponse: (response) => {
          // 移除过多的日志输出
          return response;
        }
      });
    }

    // 检查getSite1RendData API是否存在
    const trendDataApi = apiManager.registry.get('getSite1RendData');

    if (!trendDataApi) {
      // 只在开发环境中输出日志
      if (process.env.NODE_ENV === 'development') {
      console.log('注册趋势数据API');
      }
      // 注册趋势数据API
      apiManager.registry.register('getSite1RendData', {
        name: '获取趋势数据',
        url: 'https://nodered.jzz77.cn:9003/api/get-sitet1-trenddata',
        method: 'GET',
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
      // 只在开发环境中输出日志
      if (process.env.NODE_ENV === 'development') {
        console.log('注册站点部门API');
      }
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
      // 只在开发环境中输出日志
      if (process.env.NODE_ENV === 'development') {
        console.log('注册设备控制API');
      }
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
      // 只在开发环境中输出日志
      if (process.env.NODE_ENV === 'development') {
        console.log('注册操作日志API');
      }
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
      apiManager.registry.setPageApis('siteDetail', ['getSiteById', 'getSiteList', 'getAlarms', 'getSite1RendData', 'getUserRoles', 'getSiteDepartments', 'sendCommand', 'logOperation']);
    } catch (error) {
      console.error('设置页面API失败:', error);
    }
  }, []);

  // 初始加载数据
  useEffect(() => {
    // 标记记录当前效果是否已卸载
    let isComponentMounted = true;
    
    // 获取站点详情的函数
    const getSiteDetail = async (silent = false) => {
      if (!silent) {
        setRefreshing(true);
      }
      try {
        // 方法一：首先检查是否有从SiteList页面传入的站点数据
        if (state && state.siteData) {
          console.log('从路由状态获取站点数据:', state.siteData);
          const siteData = state.siteData;
          
          // 使用路由传递的数据更新站点基本信息
          setDataGroups(prevGroups => ({
            ...prevGroups,
            site: {
              ...siteData,
              lastUpdateTime: new Date().toLocaleString()
            },
            // 保持兼容性，同时更新顶层属性
            name: siteData.name,
            status: siteData.status,
            alarm: siteData.alarm,
            address: siteData.address,
            totalInflow: siteData.totalInflow,
            departments: siteData.departments
          }));
          
          console.log('成功使用路由传递的站点数据');
        } 
        // 方法二：如果没有路由传递的数据，尝试从 SiteList API 获取基本站点信息
        else {
          try {
            console.log('尝试从SiteList获取站点数据...');
            const siteListResponse = await apiManager.call('getSiteList', {}, {
              showError: false // 静默获取，不显示错误
            });
            
            if (siteListResponse) {
              let siteData = null;
              
              // 处理不同的响应格式
              if (Array.isArray(siteListResponse)) {
                siteData = siteListResponse.find(site => site.id === siteId);
              } else if (Array.isArray(siteListResponse.data)) {
                siteData = siteListResponse.data.find(site => site.id === siteId);
              } else if (siteListResponse.success && Array.isArray(siteListResponse.data)) {
                siteData = siteListResponse.data.find(site => site.id === siteId);
              }
              
              if (siteData) {
                console.log('从SiteList成功获取站点基本信息:', siteData);
                
                // 使用获取的数据更新站点基本信息
                setDataGroups(prevGroups => ({
                  ...prevGroups,
                  site: {
                    ...siteData,
                    lastUpdateTime: new Date().toLocaleString()
                  },
                  // 保持兼容性，同时更新顶层属性
                  name: siteData.name,
                  status: siteData.status,
                  alarm: siteData.alarm,
                  address: siteData.address,
                  totalInflow: siteData.totalInflow,
                  departments: siteData.departments
                }));
              }
            }
          } catch (listError) {
            console.warn('从SiteList获取数据失败:', listError);
          }
        }
        
        // 方法二：使用getSiteById API获取详细数据
        console.log('使用getSiteById API获取详细数据...');
        const params = { id: siteId };
        logApiCall('getSiteById', params);
        
        const response = await apiManager.call('getSiteById', params, {
        showError: !silent // 只在非静默模式下显示错误
        });

        if (!response || !response.success) {
          throw new Error(response?.error || '获取站点详情失败');
        }

        // 获取站点数据
        const siteData = response.data;
        
        // 更新状态 - 同时保留之前可能从SiteList获取的基本信息
        setDataGroups(prevGroups => {
          // 如果之前已经有site属性（从SiteList获取），则合并新数据
          const updatedSite = prevGroups.site ? 
            { ...prevGroups.site, ...siteData, lastUpdateTime: new Date().toLocaleString() } : 
            { ...siteData, lastUpdateTime: new Date().toLocaleString() };
            
          return {
            ...prevGroups,
            ...siteData,
            site: updatedSite
          };
        });
        
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
        
        // 如果有管理部门数据，更新管理部门状态
        if (siteData.departments) {
          setSiteDepartments(siteData.departments);
        }
      } catch (error) {
        console.error('获取站点详情失败:', error);
        if (!silent) {
          message.error('获取站点详情失败');
        }
      } finally {
        if (!silent) {
          setRefreshing(false);
        }
      }
    };

  // 获取告警信息
    const getAlarms = async (silent = false) => {
      // 检查错误计数，如果超过限制，则不再尝试
      if ((apiErrorCounts['getAlarms'] || 0) >= 5) {
        return [];
      }
      
      const params = { siteId };
      logApiCall('getAlarms', params, false);
      
      try {
        // 使用API管理系统调用getAlarms API - 使用query参数方式
        const response = await apiManager.call('getAlarms', {}, {
          showError: !silent, // 只在非静默模式下显示错误
          params: params // 作为query参数传递
      });

      // 检查API调用是否成功
      if (!response || !response.success) {
        throw new Error(response?.error || '获取告警信息失败');
      }

      // 获取告警数据
      const alarms = response.data;
      
      // 输出告警数据信息
      console.log(`⚠️ API响应: getAlarms | 数据:`, alarms);

      // 更新站点数据中的告警信息
        setDataGroups(prevDataGroups => ({
          ...prevDataGroups,
        alarms: alarms
      }));

      return alarms;
    } catch (err) {
        // 记录API错误次数，超过阈值后停止尝试
        setApiErrorCounts(prev => {
          const newCount = (prev['getAlarms'] || 0) + 1;
          return { ...prev, 'getAlarms': newCount };
        });
        
        if (!silent && apiErrorCounts['getAlarms'] < 3) {
        message.error('获取告警信息失败');
      }
        
        if (apiErrorCounts['getAlarms'] < 10) {
      console.error('获取告警信息失败:', err);
        }
        
      return [];
    }
    };

    // 先注册API
    apiManager.waitForReady().then(ready => {
      if (!isComponentMounted) return; // 如果组件已卸载，不执行后续操作

      if (ready) {
        // 获取站点详情
        getSiteDetail().then(() => {
          if (isComponentMounted) {
          // 获取站点详情成功后，获取告警信息
            getAlarms(true);
          }
        });

        // 不再通过API获取用户角色，使用本地模拟数据
        checkUserPermission();

        // 自动连接WebSocket
        if (!wsConnected) {
          console.log('🔌 自动连接WebSocket...');
          connect(siteId);
          
          // 添加WebSocket连接日志
          console.log('📡 WebSocket连接信息：', {
            站点ID: siteId,
            连接状态: wsConnected ? '已连接' : '连接中',
            连接时间: new Date().toLocaleString()
          });
        }
      } else if (isComponentMounted) {
        setError('API管理器初始化失败');
        message.error('API管理器初始化失败');
      }
    });

    // 设置定时刷新
    const refreshInterval = setInterval(() => {
      if (isComponentMounted) {
        // 仅当错误次数小于阈值时才刷新
        const alarmErrorCount = apiErrorCounts['getAlarms'] || 0;
        const siteErrorCount = apiErrorCounts['getSiteById'] || 0;
        
        // 如果API持续失败，减少刷新频率
        if (alarmErrorCount < 5) {
          // 静默刷新，不显示加载状态和日志
          getAlarms(true);
        }
        
        if (siteErrorCount < 5) {
          getSiteDetail(true);
        }
      }
    }, 30000); // 每30秒刷新一次

    // 组件卸载时清理
    return () => {
      isComponentMounted = false;
      
      // 清除定时器
      clearInterval(refreshInterval);

      // 断开WebSocket连接
      if (wsConnected) {
      disconnect();
      }
    };
  }, [siteId, user, disconnect, wsConnected, logApiCall, apiErrorCounts]);

  // 趋势数据处理函数 - 确保数据格式统一
  const processTrendData = useCallback((data) => {
    if (!data) return null;
    
    console.log('原始趋势数据:', data);
    
    // 1. 首先，处理不同的响应格式
    let processedData = null;
    
    // 情况1: 数据已经是标准的times/values对象格式
    if (data.times && data.values && Array.isArray(data.times) && Array.isArray(data.values)) {
      processedData = {
        times: data.times,
        values: data.values
      };
    }
    // 情况2: 数据是数组格式，每个元素包含time和value字段
    else if (Array.isArray(data)) {
      const times = [];
      const values = [];
      
      data.forEach(item => {
        // 处理不同命名格式的时间和值
        const time = item.time || item.timestamp || item.date || item.datetime;
        let value = null;
        
        // 尝试找到值字段
        if (item.value !== undefined) {
          value = item.value;
        } else if (item.val !== undefined) {
          value = item.val;
        } else {
          // 查找第一个非时间字段作为值
          const valueKey = Object.keys(item).find(key => 
            key !== 'time' && key !== 'timestamp' && key !== 'date' && key !== 'datetime'
          );
          
          if (valueKey) {
            value = item[valueKey];
          }
        }
        
        if (time && value !== null && value !== undefined) {
          times.push(time);
          values.push(Number(value));
        }
      });
      
      if (times.length > 0 && values.length > 0) {
        processedData = { times, values };
      }
    }
    // 情况3: 对象格式，但不是标准的times/values结构
    else if (typeof data === 'object') {
      // 尝试找到时间和值数组
      let timeArray = null;
      let valueArray = null;
      
      // 查找可能的时间数组字段
      const timeKeys = ['times', 'timestamps', 'dates', 'datetimes', 'time', 'timestamp'];
      for (const key of timeKeys) {
        if (Array.isArray(data[key])) {
          timeArray = data[key];
          break;
        }
      }
      
      // 查找可能的值数组字段
      const valueKeys = ['values', 'vals', 'data', 'readings', 'measurements'];
      for (const key of valueKeys) {
        if (Array.isArray(data[key])) {
          valueArray = data[key];
          break;
        }
      }
      
      // 如果找到了时间和值数组
      if (timeArray && valueArray && timeArray.length === valueArray.length) {
        processedData = {
          times: timeArray,
          values: valueArray.map(v => Number(v))
        };
      }
      // 如果只找到了时间数组，尝试找出值数组
      else if (timeArray) {
        // 查找第一个与时间数组长度相同的数组作为值数组
        for (const key in data) {
          if (Array.isArray(data[key]) && 
              data[key] !== timeArray && 
              data[key].length === timeArray.length) {
            valueArray = data[key];
            break;
          }
        }
        
        if (valueArray) {
          processedData = {
            times: timeArray,
            values: valueArray.map(v => Number(v))
          };
        }
      }
    }
    
    // 如果处理后仍然没有数据，返回null
    if (!processedData || !processedData.times || !processedData.values || 
        processedData.times.length === 0 || processedData.values.length === 0) {
      console.warn('无法解析趋势数据格式');
      return null;
    }
    
    // 2. 确保时间格式一致性
    processedData.times = processedData.times.map(time => {
      // 如果时间不是字符串，尝试转换
      if (typeof time !== 'string') {
        return new Date(time).toISOString();
      }
      // 如果时间是时间戳数字字符串，转换为ISO格式
      if (/^\d+$/.test(time)) {
        return new Date(parseInt(time)).toISOString();
      }
      return time;
    });
    
    // 3. 确保值是数字类型
    processedData.values = processedData.values.map(value => {
      if (typeof value === 'string') {
        return Number(value);
      }
      return value;
    });
    
    console.log('处理后的趋势数据:', processedData);
    return processedData;
  }, []);

  // 获取历史趋势数据
  const fetchTrendData = useCallback(async (params, silent = false) => {
    try {
      // 详细记录传入的查询参数
      console.log(`📅 趋势数据查询参数详情:`, {
        siteId: siteId,
        action: params.action,
        dataPointId: params.dataPointId,
        startTime: params.startTime,
        endTime: params.endTime,
        其他参数: params
      });
      
      // 记录API调用开始
      const apiLog = logApiCall('getSite1RendData', { siteId, ...params }, true);
      const startTime = Date.now();
      
      // 使用API管理系统调用getSite1RendData API - 确保参数以GET方式正确传递
      // 获取API注册信息
      const apiInfo = apiManager.registry.get('getSite1RendData');
      const apiUrl = apiInfo?.url || 'https://nodered.jzz77.cn:9003/api/get-sitet1-trenddata';
      
      // 构建URL查询字符串
      const queryParams = new URLSearchParams();
      queryParams.append('siteId', siteId);
      
      // 添加其他参数
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null) {
          queryParams.append(key, params[key]);
        }
      });
      
      // 添加请求标识符
      const requestId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      queryParams.append('requestId', requestId);
      
      // 完整URL
      const fullUrl = `${apiUrl}?${queryParams.toString()}`;
      console.log(`📡 完整API请求URL: ${fullUrl}`);
      
      // 合并所有参数
      const allParams = {
        siteId: siteId,
        ...params,
        requestId: requestId
      };
      
      // 调用API - 直接将参数作为第一个参数传递，而不是放在options.params中
      const response = await apiManager.call('getSite1RendData', allParams, {
        showError: !silent,
        retry: true,
        retryDelay: 1000,
        retryTimes: 2
      });
      
      // 记录API调用结束和响应时间
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      if (apiLog) {
        const apiStats = window._API_STATS = window._API_STATS || {};
        if (apiStats['getSite1RendData']) {
          const oldAvg = apiStats['getSite1RendData'].avgResponseTime;
          const oldCount = apiStats['getSite1RendData'].callCount;
          apiStats['getSite1RendData'].avgResponseTime = (oldAvg * (oldCount - 1) + responseTime) / oldCount;
          
          // 输出重要的API响应信息
          console.log(`✅ API响应: getSite1RendData | 响应时间: ${responseTime}ms | 平均响应时间: ${apiStats['getSite1RendData'].avgResponseTime.toFixed(2)}ms | 数据大小: ${JSON.stringify(response).length} 字节`);
        }
      }

      // 检查API调用是否成功
      if (!response || !response.success) {
        // 记录API错误
        const apiStats = window._API_STATS = window._API_STATS || {};
        if (apiStats['getSite1RendData']) {
          apiStats['getSite1RendData'].errors++;
          console.error(`❌ API错误: getSite1RendData | 总错误数: ${apiStats['getSite1RendData'].errors} | 错误信息:`, response?.error || '获取趋势数据失败');
        }
        throw new Error(response?.error || '获取趋势数据失败');
      }

      // 获取返回数据
      const responseData = response.data;
      
      // 判断请求类型，针对不同的action使用不同的处理逻辑
      if (params.action === 'getDataPoints') {
        // 数据点列表请求，直接返回数组
        console.log('获取数据点列表成功:', responseData);
        return responseData;
      } else {
        // 趋势数据请求，进行格式处理
        const processedData = processTrendData(responseData);
        console.log(`📈 API响应: getSite1RendData | 数据:`, processedData);
        return processedData;
      }
      
    } catch (err) {
      if (!silent) {
        message.error(`获取趋势数据失败: ${err.message || '未知错误'}`);
      }
      console.error('获取趋势数据失败:', err);
      return null;
    }
  }, [siteId, logApiCall, processTrendData]);
  
  // 趋势数据处理函数 - 确保数据格式统一
  //const processTrendData = useCallback((data) => {
  //  // ... existing code for processTrendData ...
  //}, []);

  // 获取站点详情 - 作为组件公共方法
  const fetchSiteDetail = useCallback(async (silent = false) => {
    if (!silent) {
      setRefreshing(true);
    }

    const params = { id: siteId };
    logApiCall('getSiteById', params, false);

    try {
      // 使用API管理系统调用getSiteById API
      const response = await apiManager.call('getSiteById', params, {
        showError: !silent // 只在非静默模式下显示错误
      });

      // 检查API调用是否成功
      if (!response || !response.success) {
        throw new Error(response?.error || '获取站点详情失败');
      }

      // 获取站点数据
      const siteData = response.data;
      
      console.log('获取站点详情成功:', siteData);

      // 更新状态 - 保存完整数据，包括dataGroups数组
      setDataGroups(prevData => ({ ...prevData, ...siteData, lastUpdate: new Date() }));
      setLastUpdateTime(new Date());

      // 如果有进水数据，更新进水数据状态
      if (siteData.indata) {
        setInData(siteData.indata);
      }

      // 如果有出水数据，更新出水数据状态
      if (siteData.outdata) {
        setOutData(siteData.outdata);
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
  }, [siteId, logApiCall]);

  // 获取告警信息 - 作为组件公共方法
  const fetchAlarms = useCallback(async (silent = false) => {
    // 检查错误计数，如果超过限制，则不再尝试
    if ((apiErrorCounts['getAlarms'] || 0) >= 5) {
      return [];
    }
    
    const params = { siteId };
    logApiCall('getAlarms', params, false);
    
    try {
      // 记录API调用开始
      const apiLog = logApiCall('getAlarms', params, true);
      const startTime = Date.now();
      
      // 使用API管理系统调用getAlarms API - 使用query参数方式
      const response = await apiManager.call('getAlarms', {}, {
        showError: !silent, // 只在非静默模式下显示错误
        params: params // 作为query参数传递
      });
      
      // 记录API调用结束和响应时间
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      if (apiLog) {
        const apiStats = window._API_STATS = window._API_STATS || {};
        if (apiStats['getAlarms']) {
          const oldAvg = apiStats['getAlarms'].avgResponseTime;
          const oldCount = apiStats['getAlarms'].callCount;
          apiStats['getAlarms'].avgResponseTime = (oldAvg * (oldCount - 1) + responseTime) / oldCount;
          
          // 输出重要的API响应信息
          console.log(`✅ API响应: getAlarms | 响应时间: ${responseTime}ms | 平均响应时间: ${apiStats['getAlarms'].avgResponseTime.toFixed(2)}ms | 数据大小: ${JSON.stringify(response).length} 字节`);
        }
      }

      // 检查API调用是否成功
      if (!response || !response.success) {
        // 记录API错误
        const apiStats = window._API_STATS = window._API_STATS || {};
        if (apiStats['getAlarms']) {
          apiStats['getAlarms'].errors++;
          console.error(`❌ API错误: getAlarms | 总错误数: ${apiStats['getAlarms'].errors} | 错误信息:`, response?.error || '获取告警信息失败');
        }
        throw new Error(response?.error || '获取告警信息失败');
      }

      // 获取告警数据
      const alarms = response.data;
      
      // 输出告警数据信息
      console.log(`⚠️ 告警数据: 共${alarms.length}条告警`);

      // 更新站点数据中的告警信息
      setDataGroups(prevDataGroups => ({
        ...prevDataGroups,
        alarms: alarms
      }));

      return alarms;
          } catch (err) {
        // 记录API错误次数，超过阈值后停止尝试
        setApiErrorCounts(prev => {
          const newCount = (prev['getAlarms'] || 0) + 1;
          return { ...prev, 'getAlarms': newCount };
        });
        
        if (!silent && apiErrorCounts['getAlarms'] < 3) {
          message.error('获取告警信息失败');
        }
        
        if (apiErrorCounts['getAlarms'] < 10) {
          console.error('获取告警信息失败:', err);
        }
        
        return [];
      }
  }, [siteId, logApiCall]);

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
    
    // 记录命令发送统计
    const commandStats = window._COMMAND_STATS = window._COMMAND_STATS || {};
    const cmdKey = `${commandType}_${action}`;
    
    commandStats[cmdKey] = commandStats[cmdKey] || {
      count: 0,
      success: 0,
      error: 0,
      timeout: 0,
      lastCommand: null
    };
    
    commandStats[cmdKey].count++;
    commandStats[cmdKey].lastCommand = new Date();
    
    console.log(`🎮 发送命令: ${commandType}, 设备: ${deviceName}, 动作: ${action}, 命令ID: ${commandId}`);
    
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
      // 发送WebSocket命令
      const command = {
        type: commandType === 'device' ? 'device_command' : 
              commandType === 'frequency' ? 'frequency_command' : 'valve_command',
        commandId,
        deviceName,
        action
      };
      
      // 打印发送的命令
      console.log('🔄 发送WebSocket命令:', command);
      
      // 记录命令详情
      console.log('📤 WebSocket命令详情:', {
        类型: command.type,
        命令ID: command.commandId,
        设备名称: command.deviceName,
        动作: command.action,
        发送时间: new Date().toLocaleString()
      });
      
      await sendMessage(command);

      setTimeout(() => {
        setPendingCommands(prev => {
          if (prev[commandId]?.status === 'pending') {
            // 更新超时统计
            if (commandStats[cmdKey]) {
              commandStats[cmdKey].timeout++;
              console.warn(`⏱️ 命令超时: ${commandType}, 设备: ${deviceName}, 动作: ${action}, 命令ID: ${commandId}`);
            }
            
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

      // 记录操作日志
      await logOperation({
        type: commandType,
        deviceName,
        action,
        status: 'success',
        timestamp: new Date()
      });
      
      // 命令发送成功统计（但不一定执行成功）
      if (commandStats[cmdKey]) {
        commandStats[cmdKey].success++;
      }
      
      // 每10次命令后打印命令统计
      if (commandStats[cmdKey].count % 10 === 0) {
        console.log('📊 命令统计信息:');
        console.table(Object.keys(commandStats).map(key => ({
          命令类型: key,
          总次数: commandStats[key].count,
          成功: commandStats[key].success,
          错误: commandStats[key].error,
          超时: commandStats[key].timeout,
          成功率: `${((commandStats[key].success / commandStats[key].count) * 100).toFixed(1)}%`,
          最后发送: commandStats[key].lastCommand ? new Date(commandStats[key].lastCommand).toLocaleTimeString() : 'N/A'
        })));
      }

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
      
      // 更新错误统计
      if (commandStats[cmdKey]) {
        commandStats[cmdKey].error++;
        console.error(`❌ 命令错误: ${commandType}, 设备: ${deviceName}, 动作: ${action}, 错误:`, error.message);
      }

      await logOperation({
        type: commandType,
        deviceName,
        action,
        status: 'error',
        error: error.message,
        timestamp: new Date()
      });
    }
  }, [hasControlPermission, handleError, logOperation, sendMessage]);

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
    if (!data) {
      console.warn('DataCard: 数据为空');
      return null;
    }

    console.log(`渲染数据卡片: name=${data.name}, type=${data.dataType}`, data);

    // 获取数据值（支持多种数据格式）
    const getValue = () => {
      // 优先使用data字段，其次使用value字段
      if (data.data !== undefined) return data.data;
      if (data.value !== undefined) return data.value;
      // 尝试使用典型字段名
      if (data.reading !== undefined) return data.reading;
      if (data.result !== undefined) return data.result;
      if (data.measurement !== undefined) return data.measurement;
      
      // 找不到有效值
      console.warn(`DataCard: 无法确定数据值: ${data.name}`);
      return 0;
    };
    
    // 获取单位（支持多种数据格式）
    const getUnit = () => {
      if (data.dw) return data.dw;
      if (data.unit) return data.unit;
      return '';
    };
    
    // 推断数据类型（如果未明确指定）
    const getDataType = () => {
      if (data.dataType) return data.dataType;
      
      const value = getValue();
      // 根据值类型推断
      if (typeof value === 'boolean') return 'boolean';
      if (typeof value === 'number') return 'number';
      if (typeof value === 'string') {
        // 检查是否可能是一个枚举值
        if (data.enumValues || data.options) return 'enum';
      }
      
      // 基于特定字段推断类型
      if (data.current !== undefined || data.voltage !== undefined) return 'energy';
      if (data.runningTime !== undefined) return 'runtime';
      if (data.healthScore !== undefined) return 'health';
      if (data.target !== undefined) return 'production';
      if (data.standard !== undefined) return 'lab';
      
      // 默认为数字类型
      return 'number';
    };

    // 根据数据类型选择渲染方式
    const renderContent = () => {
      const dataType = getDataType();
      const value = getValue();
      const unit = getUnit();
      
      // 基础数据类型
      switch (dataType) {
        case 'number':
          return (
            <Statistic
              value={typeof value === 'number' ? Number(value).toFixed(2) : value || '0.00'}
              suffix={unit}
              precision={2}
              valueStyle={{
                color: data.alarm === 1 ? '#ff4d4f' :
                       (data.min !== undefined && value < data.min) ||
                       (data.max !== undefined && value > data.max) ?
                       '#faad14' : '#1890ff',
                fontSize: '16px'
              }}
            />
          );
        case 'boolean':
          return (
            <Badge
              status={value === 1 || value === true ? 'success' : 'default'}
              text={value === 1 || value === true ? '开启' : '关闭'}
            />
          );
        case 'enum':
          const enumValues = data.enumValues || data.options || {};
          const enumValue = enumValues[value];
          return (
            <Tag color={enumValue?.color || 'blue'}>
              {enumValue?.label || value || '未知'}
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
          // 默认显示文本
          return <Text>{value !== undefined ? value.toString() : '无数据'}</Text>;
      }
    };

    // 渲染能耗数据
    const renderEnergyData = (data) => (
      <div>
        <Row gutter={[8, 8]}>
          <Col span={12}>
            <Statistic
              title="电流"
              value={data.current ? Number(data.current).toFixed(2) : '0.00'}
              suffix="A"
              precision={2}
              valueStyle={{ fontSize: 14 }}
            />
          </Col>
          <Col span={12}>
            <Statistic
              title="电压"
              value={data.voltage ? Number(data.voltage).toFixed(2) : '0.00'}
              suffix="V"
              precision={2}
              valueStyle={{ fontSize: 14 }}
            />
          </Col>
        </Row>
        <Divider style={{ margin: '8px 0' }} />
        <Statistic
          title="功率"
          value={data.power ? Number(data.power).toFixed(2) : '0.00'}
          suffix="kW"
          precision={2}
          valueStyle={{ color: '#1890ff' }}
        />
        <div style={{ marginTop: 8 }}>
          <Text type="secondary">累计耗电: {data.consumption ? Number(data.consumption).toFixed(2) : '0.00'} {data.unit || 'kWh'}</Text>
        </div>
      </div>
    );

    // 渲染运行时间数据
    const renderRuntimeData = (data) => (
      <div>
        <Statistic
          title="运行时间"
          value={data.runningTime ? Number(data.runningTime).toFixed(2) : '0.00'}
          suffix={data.unit}
          precision={2}
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
      console.log(`渲染工艺参数组: ${data.id}, 数据项数: ${data.length}`, data);
        return (
        <Row gutter={[16,16]}>
          {data.map((item, idx) => (
            <Col xs={24} sm={12} md={8} lg={6} key={`${data.id}-process-${idx}`}>
              <Card 
                hoverable 
                style={{ 
                  borderTop: '4px solid', 
                  borderTopColor: 
                    item.status === 'abnormal' || 
                    (item.lowerLimit !== undefined && item.value < item.lowerLimit) || 
                    (item.upperLimit !== undefined && item.value > item.upperLimit) 
                      ? '#ff4d4f' 
                      : '#1890ff' 
                }}
              >
            <div style={{ marginBottom: 8 }}>
                  <Text strong>{item.name}</Text>
                  {item.status && (
                    <Tag 
                      color={item.status === 'normal' ? 'green' : item.status === 'warning' ? 'orange' : 'red'} 
                      style={{ marginLeft: 8 }}
                    >
                      {item.status === 'normal' ? '正常' : 
                       item.status === 'warning' ? '警告' : 
                       item.status === 'abnormal' ? '异常' : item.status}
            </Tag>
                  )}
          </div>

          <Statistic
                  value={item.value !== undefined ? item.value : (item.data !== undefined ? item.data : 0)}
                  suffix={item.unit || ''}
                  precision={item.unit === '%' ? 1 : 0}
                  valueStyle={{ 
                    color: 
                      (item.lowerLimit !== undefined && item.value < item.lowerLimit) || 
                      (item.upperLimit !== undefined && item.value > item.upperLimit) || 
                      item.status === 'abnormal' 
                        ? '#ff4d4f' 
                        : '#1890ff'
                  }}
                />
                
                {(item.lowerLimit !== undefined || item.upperLimit !== undefined) && (
            <div style={{ marginTop: 8 }}>
                    {/* 进度条显示 */}
                    {item.lowerLimit !== undefined && item.upperLimit !== undefined && (
                      <>
              <Progress
                          percent={Math.min(100, Math.max(0, ((item.value - item.lowerLimit) / (item.upperLimit - item.lowerLimit)) * 100))}
                size="small"
                          status={
                            item.value < item.lowerLimit || item.value > item.upperLimit 
                              ? 'exception' 
                              : 'normal'
                          }
              />
              <div style={{ fontSize: 12, color: 'rgba(0, 0, 0, 0.45)' }}>
                          范围: {item.lowerLimit} - {item.upperLimit} {item.unit || ''}
              </div>
                      </>
                    )}
                    
                    {/* 只有下限 */}
                    {item.lowerLimit !== undefined && item.upperLimit === undefined && (
                      <div style={{ fontSize: 12, color: 'rgba(0, 0, 0, 0.45)' }}>
                        最小值: {item.lowerLimit} {item.unit || ''} 
                        {item.value < item.lowerLimit && <span style={{ color: '#ff4d4f' }}> (低于下限)</span>}
            </div>
          )}
                    
                    {/* 只有上限 */}
                    {item.upperLimit !== undefined && item.lowerLimit === undefined && (
                      <div style={{ fontSize: 12, color: 'rgba(0, 0, 0, 0.45)' }}>
                        最大值: {item.upperLimit} {item.unit || ''} 
                        {item.value > item.upperLimit && <span style={{ color: '#ff4d4f' }}> (超过上限)</span>}
        </div>
                    )}
                  </div>
                )}
                
                {/* 其他可能的属性 */}
                {item.time && (
                  <div style={{ marginTop: 4, fontSize: 12, color: 'rgba(0, 0, 0, 0.45)' }}>
                    时间: {typeof item.time === 'string' ? item.time : new Date(item.time).toLocaleString()}
                  </div>
                )}
                
                {item.description && (
                  <div style={{ marginTop: 4, fontSize: 12 }}>
                    {item.description}
                  </div>
                )}
              </Card>
            </Col>
          ))}
        </Row>
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
        className={styles.sensorCard}
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

  const renderSensorGroup = (group) => {
    console.log(`渲染传感器组: ${group.id}, 数据项数: ${group.data.length}`, group.data);
    return (
      <Row gutter={[16,16]}>
        {group.data.map((item, idx) => (
          <Col xs={24} sm={12} md={8} lg={6} key={`${group.id}-sensor-${idx}`}>
            <div className={styles.sensorCardWrapper}>
              <DataCard data={item} type="sensor" />
            </div>
          </Col>
        ))}
      </Row>
    );
  };

  const renderDeviceGroup = (group) => {
    // 调试输出设备数据
    console.log('🧩 渲染设备组:', {
      组ID: group.id,
      组名称: group.name,
      设备数量: group.data?.length || 0,
      数据示例: group.data && group.data.length > 0 ? JSON.stringify(group.data[0]).substring(0, 100) + '...' : '无数据'
    });
    
    return (
      <Row gutter={[8, 8]}>
        {group.data.map((item,idx)=>{
          // 确定设备运行状态 - 兼容多种数据格式
          const isRunning = item.status === 'running' || 
                          item.status === 1 || 
                          item.run === 1 || 
                          item.isRunning === true;
          
          // 确定设备故障状态 - 兼容多种数据格式
          const hasFault = item.fault === 1 || 
                         item.fault === true || 
                         item.hasFault === true;
          
          return (
            <Col xs={24} sm={12} md={8} lg={4} xl={4} xxl={4} key={idx}>
              <Card
                hoverable
                className={styles.deviceCard}
                style={{
                  borderTop: '4px solid',
                  borderTopColor: isRunning ? '#52c41a' : '#ff4d4f'
                }}
              >
                <div style={{ marginBottom: 6 }}>
                  <Text strong>{item.name}</Text>
                  <Badge
                    status={isRunning ? 'success' : 'error'}
                    text={isRunning ? '运行中' : '已停止'}
                    style={{ float: 'right' }}
                  />
                  {hasFault && (
                    <Tag color="red" style={{ float: 'right', marginRight: 8 }}>故障</Tag>
                  )}
                </div>

                {item.location && (
                  <div style={{ marginBottom: 6, color: 'rgba(0, 0, 0, 0.45)', fontSize: 12 }}>
                    <EnvironmentOutlined style={{ marginRight: 4 }} />
                    {item.location}
                  </div>
                )}

                <div style={{ marginTop: 12 }}>
                  <Button
                    type="primary"
                    size="small"
                    style={{ backgroundColor: '#52c41a', marginRight: 6 }}
                    disabled={isRunning || !hasControlPermission || hasFault}
                    onClick={() => handleDeviceControl(item, 'start')}
                    loading={pendingCommands[item.name]?.status === 'pending'}
                  >
                    启动
                  </Button>
                  <Button
                    danger
                    size="small"
                    disabled={!isRunning || !hasControlPermission || hasFault}
                    onClick={() => handleDeviceControl(item, 'stop')}
                    loading={pendingCommands[item.name]?.status === 'pending'}
                  >
                    停止
                  </Button>
                </div>

                {!hasControlPermission && (
                  <div style={{
                    marginTop: 6,
                    padding: '4px 8px',
                    backgroundColor: 'rgba(0, 0, 0, 0.05)',
                    borderRadius: 4,
                    color: 'rgba(0, 0, 0, 0.45)',
                    fontSize: 12
                  }}>
                    无控制权限
                  </div>
                )}
                
                {/* 命令状态显示 */}
                {pendingCommands[item.name] && (
                  <div style={{ marginTop: 6, fontSize: 12 }}>
                    <Badge 
                      status={
                        pendingCommands[item.name].status === 'pending' ? 'processing' :
                        pendingCommands[item.name].status === 'success' ? 'success' : 'error'
                      } 
                      text={
                        pendingCommands[item.name].status === 'pending' ? '命令执行中...' :
                        pendingCommands[item.name].status === 'success' ? '命令成功' : '命令失败'
                      }
                    />
                    {pendingCommands[item.name].message && (
                      <div style={{ 
                        marginTop: 4, 
                        fontSize: 12,
                        color: pendingCommands[item.name].status === 'error' ? '#ff4d4f' : 'inherit'
                      }}>
                        {pendingCommands[item.name].message}
                      </div>
                    )}
                  </div>
                )}
              </Card>
            </Col>
          );
        })}
      </Row>
    );
  };

  const renderValveGroup = (group) => (
    <Row gutter={[8, 8]}>
      {group.data.map((item,idx)=>(
        <Col xs={24} sm={12} md={8} lg={4} xl={4} xxl={4} key={idx}>
          <Card
            hoverable
            className={styles.deviceCard}
            style={{
              borderTop: '4px solid',
              borderTopColor: item.status === 1 || item.open === 1 ? '#52c41a' : '#ff4d4f'
            }}
          >
            <div style={{ marginBottom: 6 }}>
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

            <div style={{ marginTop: 12 }}>
              <Button
                type="primary"
                size="small"
                style={{ backgroundColor: '#52c41a', marginRight: 6 }}
                disabled={(item.status === 1 || item.open === 1) || !hasControlPermission || item.fault === 1}
                onClick={() => handleValveControl(item, 'open')}
                loading={pendingCommands[item.name]?.status === 'pending'}
              >
                打开
              </Button>
              <Button
                danger
                size="small"
                disabled={(item.status !== 1 && item.open !== 1) || !hasControlPermission || item.fault === 1}
                onClick={() => handleValveControl(item, 'close')}
                loading={pendingCommands[item.name]?.status === 'pending'}
              >
                关闭
              </Button>
            </div>

            {!hasControlPermission && (
              <div style={{
                marginTop: 6,
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

  const renderEnergyGroup = (group) => {
    console.log(`渲染能耗组: ${group.id}, 数据项数: ${group.data.length}`, group.data);
    return (
      <Row gutter={[8, 8]}>
        {group.data.map((item, idx) => (
          <Col xs={24} sm={12} md={8} lg={4} xl={4} xxl={4} key={`${group.id}-energy-${idx}`}>
            <Card hoverable style={{ borderTop: '4px solid #1890ff' }}>
              <div style={{ marginBottom: 6 }}>
                <Text strong style={{fontSize: 14}}>{item.name}</Text>
              </div>
              <Statistic
                title="当前值"
                value={formatNumber(item.value || item.power || 0)}
                suffix={item.unit || 'kWh'}
                precision={2}
                valueStyle={{ 
                  color: item.threshold && item.value > item.threshold ? '#ff4d4f' : '#1890ff',
                  fontSize: 25
                }}
              />
              {item.threshold && (
                <div style={{ marginTop: 6 }}>
                  <Progress
                    percent={Math.min(100, parseFloat(((item.value / item.threshold) * 100).toFixed(2)))}
                    size="small"
                    status={item.value > item.threshold ? 'exception' : 'normal'}
                  />
                  <div style={{ fontSize: 12, color: 'rgba(0, 0, 0, 0.45)' }}>
                    阈值: {formatNumber(item.threshold)} {item.unit || 'kWh'} 
                    ({((item.value / item.threshold) * 100).toFixed(2)}%)
                  </div>
                </div>
              )}
              {item.trend !== undefined && (
                <div style={{ marginTop: 6 }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    color: item.trend > 0 ? '#ff4d4f' : item.trend < 0 ? '#52c41a' : 'inherit',
                    fontSize: 12
                  }}>
                    {item.trend > 0 ? (
                      <span>↑ 上升 {Math.abs(item.trend).toFixed(2)}%</span>
                    ) : item.trend < 0 ? (
                      <span>↓ 下降 {Math.abs(item.trend).toFixed(2)}%</span>
                    ) : (
                      <span>→ 持平</span>
                    )}
                  </div>
                </div>
              )}
              {item.consumption && (
                <div style={{ marginTop: 6, fontSize: 12 }}>
                  <Text type="secondary">累计: {formatNumber(item.consumption)} {item.unit || 'kWh'}</Text>
                </div>
              )}
              {item.current !== undefined && (
                <div style={{ marginTop: 4, fontSize: 12 }}>
                  <Text type="secondary">电流: {item.current} A</Text>
                </div>
              )}
              {item.voltage !== undefined && (
                <div style={{ marginTop: 4, fontSize: 12 }}>
                  <Text type="secondary">电压: {item.voltage} V</Text>
                </div>
              )}
            </Card>
          </Col>
        ))}
      </Row>
    );
  };

  const renderRuntimeGroup = (group) => {
    console.log(`渲染运行时间组: ${group.id}, 数据项数: ${group.data.length}`, group.data);
    return (
      <Row gutter={[8, 8]}>
        {group.data.map((item, idx) => (
          <Col xs={24} sm={12} md={8} lg={4} xl={4} xxl={4} key={`${group.id}-runtime-${idx}`}>
            <Card hoverable style={{ borderTop: '4px solid #1890ff' }}>
              <div style={{ marginBottom: 6 }}>
                <Text strong style={{fontSize: 14}}>{item.name}</Text>
              </div>
              <Statistic
                title="总运行时间"
                value={formatNumber(item.totalHours || item.runningTime)}
                suffix="小时"
                precision={2}
                valueStyle={{ color: '#1890ff', fontSize: 16 }}
              />
              
              {item.dailyHours !== undefined && (
                <div style={{ marginTop: 6 }}>
                  <Text type="secondary" style={{fontSize: 12}}>今日运行: {formatNumber(item.dailyHours)} 小时</Text>
                  <Progress 
                    percent={Math.min(100, parseFloat(((item.dailyHours / 24) * 100).toFixed(2)))} 
                    size="small" 
                    status={item.dailyHours > 0 ? (item.dailyHours < 24 ? 'normal' : 'success') : 'exception'} 
                  />
                </div>
              )}
              
              {item.startCount !== undefined && (
                <div style={{ marginTop: 6, fontSize: 12 }}>
                  <Text type="secondary">启动次数: {item.startCount} 次</Text>
                </div>
              )}
            </Card>
          </Col>
        ))}
      </Row>
    );
  };

  const renderProcessGroup = (group) => {
    console.log(`渲染工艺参数组: ${group.id}, 数据项数: ${group.data.length}`, group.data);
    return (
      <Row gutter={[8, 8]}>
        {group.data.map((item, idx) => (
          <Col xs={24} sm={12} md={8} lg={4} xl={4} xxl={4} key={`${group.id}-process-${idx}`}>
            <Card 
              hoverable 
              style={{ 
                borderTop: '4px solid', 
                borderTopColor: 
                  item.status === 'abnormal' || 
                  (item.lowerLimit !== undefined && item.value < item.lowerLimit) || 
                  (item.upperLimit !== undefined && item.value > item.upperLimit) 
                    ? '#ff4d4f' 
                    : '#1890ff' 
              }}
            >
              <div style={{ marginBottom: 6 }}>
                <Text strong style={{fontSize: 14}}>{item.name}</Text>
                {item.status && (
                  <Tag 
                    color={item.status === 'normal' ? 'green' : item.status === 'warning' ? 'orange' : 'red'} 
                    style={{ marginLeft: 4 }}
                  >
                    {item.status === 'normal' ? '正常' : 
                     item.status === 'warning' ? '警告' : 
                     item.status === 'abnormal' ? '异常' : item.status}
                  </Tag>
                )}
              </div>
              
              <Statistic
                value={formatNumber(item.value !== undefined ? item.value : (item.data !== undefined ? item.data : 0))}
                suffix={item.unit || ''}
                precision={2}
                valueStyle={{ 
                  color: 
                    (item.lowerLimit !== undefined && item.value < item.lowerLimit) || 
                    (item.upperLimit !== undefined && item.value > item.upperLimit) || 
                    item.status === 'abnormal' 
                      ? '#ff4d4f' 
                      : '#1890ff',
                  fontSize: 30  // 增加字体大小，从16改为22
                }}
              />
              
              {(item.lowerLimit !== undefined || item.upperLimit !== undefined) && (
                <div style={{ marginTop: 6 }}>
                  {/* 进度条显示 */}
                  {item.lowerLimit !== undefined && item.upperLimit !== undefined && (
                    <>
                      <Progress
                        percent={Math.min(100, Math.max(0, parseFloat(((item.value - item.lowerLimit) / (item.upperLimit - item.lowerLimit) * 100).toFixed(2))))}
                        size="small"
                        status={
                          item.value < item.lowerLimit || item.value > item.upperLimit 
                            ? 'exception' 
                            : 'normal'
                        }
                      />
                      <div style={{ fontSize: 12, color: 'rgba(0, 0, 0, 0.45)' }}>
                        范围: {formatNumber(item.lowerLimit)} - {formatNumber(item.upperLimit)} {item.unit || ''}
                      </div>
                    </>
                  )}
                </div>
              )}
            </Card>
          </Col>
        ))}
      </Row>
    );
  };

  const renderAlarmGroup = (group) => {
    console.log(`渲染报警组: ${group.id}, 数据项数: ${group.data.length}`, group.data);
    return (
      <Row gutter={[16,16]}>
        {group.data.map((item, idx) => (
          <Col xs={24} sm={12} md={12} lg={12} key={`${group.id}-alarm-${idx}`}>
            <Alert
              message={item.name || (item.device ? `${item.device}: ${item.message}` : item.message)}
              description={
                <div>
                  <div>
                    {item.message && <div>{item.message}</div>}
                    <div>时间: {
                      item.time || 
                      (item.timestamp ? new Date(item.timestamp).toLocaleString() : '未知')
                    }</div>
                  </div>
                  
                  {item.id && <div>报警ID: {item.id}</div>}
                  
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
                  
                  {item.device && <div>设备: {item.device}</div>}
                  {item.location && <div>位置: {item.location}</div>}
                  
                  {item.actions && (
                    <div style={{ marginTop: 8 }}>
                      <strong>建议操作:</strong>
                      <div>{item.actions}</div>
                    </div>
                  )}
                </div>
              }
              type={
                item.level === 'error' || item.level === 'high' ? 'error' :
                item.level === 'medium' || item.level === 'warning' ? 'warning' :
                item.level === 'low' || item.level === 'info' ? 'info' :
                'warning'
              }
              showIcon
              style={{ marginBottom: 16 }}
              action={
                item.status === 'unconfirmed' && (
                  <Button size="small" type="primary">
                    确认报警
                  </Button>
                )
              }
            />
          </Col>
        ))}
      </Row>
    );
  };

  const renderLabGroup = (group) => {
    console.log(`渲染实验室数据组: ${group.id}, 数据项数: ${group.data.length}`, group.data);
    return (
      <Row gutter={[8, 8]}>
        {group.data.map((item, idx) => (
          <Col xs={24} sm={12} md={8} lg={4} xl={4} xxl={4} key={`${group.id}-lab-${idx}`}>
            <Card 
              hoverable 
              style={{ 
                borderTop: '4px solid', 
                borderTopColor: 
                  (item.standard && item.value > item.standard) || 
                  (item.limit && item.value > item.limit) || 
                  (item.status === 'abnormal') 
                    ? '#ff4d4f' 
                    : '#1890ff' 
              }}
            >
              <div style={{ marginBottom: 6 }}>
                <Text strong style={{fontSize: 14}}>{item.name}</Text>
                {item.status && (
                  <Tag 
                    color={
                      item.status === 'normal' ? 'green' : 
                      item.status === 'warning' ? 'orange' : 
                      'red'
                    } 
                    style={{ marginLeft: 4 }}
                  >
                    {item.status === 'normal' ? '正常' : 
                     item.status === 'warning' ? '警告' : 
                     item.status === 'abnormal' ? '超标' : 
                     item.status}
                  </Tag>
                )}
              </div>
              <Statistic
                value={formatNumber(item.value || item.result || 0)}
                suffix={item.unit || ''}
                precision={2}
                valueStyle={{
                  color: 
                    (item.standard && item.value > item.standard) || 
                    (item.limit && item.value > item.limit) || 
                    (item.status === 'abnormal') 
                      ? '#ff4d4f' 
                      : '#1890ff',
                  fontSize: 30  // 增加字体大小，从16改为22
                }}
              />
              
              {/* 标准值或限值 */}
              {(item.standard || item.limit) && (
                <div style={{ marginTop: 6, fontSize: 12 }}>
                  <Text 
                    type={
                      (item.standard && item.value > item.standard) || 
                      (item.limit && item.value > item.limit) 
                        ? 'danger' 
                        : 'secondary'
                    }
                  >
                    标准值: {formatNumber(item.standard || item.limit)} {item.unit || ''}
                    {((item.standard && item.value > item.standard) || 
                     (item.limit && item.value > item.limit)) && 
                     <span style={{ color: '#ff4d4f' }}> (超标)</span>
                    }
                  </Text>
                </div>
              )}
            </Card>
          </Col>
        ))}
      </Row>
    );
  };

  const renderHealthGroup = (group) => {
    console.log(`渲染健康状态组: ${group.id}, 数据项数: ${group.data.length}`, group.data);
    return (
      <Row gutter={[8, 8]}>
        {group.data.map((item, idx) => (
          <Col xs={24} sm={12} md={8} lg={4} xl={4} xxl={4} key={`${group.id}-health-${idx}`}>
            <Card 
              hoverable 
              style={{ 
                borderTop: '4px solid',
                borderTopColor:
                  item.healthScore >= 80 ? '#52c41a' :
                  item.healthScore >= 60 ? '#1890ff' :
                  item.healthScore >= 40 ? '#faad14' : '#ff4d4f'
              }}
            >
              <div style={{ marginBottom: 6 }}>
                <Text strong style={{fontSize: 14}}>{item.name}</Text>
              </div>
              <Statistic
                title="健康得分"
                value={formatNumber(item.healthScore)}
                suffix="/100"
                precision={0}
                valueStyle={{
                  color:
                    item.healthScore >= 80 ? '#52c41a' :
                    item.healthScore >= 60 ? '#1890ff' :
                    item.healthScore >= 40 ? '#faad14' : '#ff4d4f',
                  fontSize: 22  // 增加字体大小，从16改为22
                }}
              />
              
              {/* 健康状态进度条 */}
              <Progress
                percent={Math.min(100, parseFloat(item.healthScore.toFixed(2)))}
                size="small"
                status={
                  item.healthScore >= 80 ? 'success' :
                  item.healthScore >= 40 ? 'normal' : 'exception'
                }
                style={{ marginTop: 6 }}
              />
              
              <div style={{ marginTop: 6, fontSize: 12 }}>
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
            </Card>
          </Col>
        ))}
      </Row>
    );
  };

  const renderProductionGroup = (group) => {
    console.log(`渲染生产指标组: ${group.id}, 数据项数: ${group.data.length}`, group.data);
    return (
      <Row gutter={[8, 8]}>
        {group.data.map((item, idx) => (
          <Col xs={24} sm={12} md={8} lg={4} xl={4} xxl={4} key={idx}>
            <Card 
              hoverable 
              style={{ 
                borderTop: '4px solid', 
                borderTopColor: 
                  item.target ? 
                    ((item.value / item.target) >= 1 ? '#52c41a' :
                     (item.value / item.target) >= 0.8 ? '#1890ff' : 
                     '#ff4d4f') :
                    '#1890ff'
              }}
            >
              <div style={{ marginBottom: 6 }}>
                <Text strong style={{fontSize: 14}}>{item.name}</Text>
                {item.timeframe && (
                  <Tag color="blue" style={{ marginLeft: 4 }}>{item.timeframe}</Tag>
                )}
              </div>
              <Statistic
                value={formatNumber(item.value)}
                suffix={item.unit}
                precision={2}
                valueStyle={{ 
                  color: item.target ? 
                    ((item.value / item.target) >= 1 ? '#52c41a' :
                     (item.value / item.target) >= 0.8 ? '#1890ff' : 
                     '#ff4d4f') :
                    '#1890ff',
                  fontSize: 30  // 增加字体大小，从16改为22
                }}
              />
              {item.target && (
                <div style={{ marginTop: 6 }}>
                  <Progress
                    percent={Math.min(100, parseFloat(((item.value / item.target) * 100).toFixed(2)))}
                    size="small"
                    status={
                      (item.value / item.target) >= 1 ? 'success' :
                      (item.value / item.target) >= 0.8 ? 'normal' : 'exception'
                    }
                  />
                  <div style={{ fontSize: 12, color: 'rgba(0, 0, 0, 0.45)' }}>
                    目标: {formatNumber(item.target)} {item.unit} ({((item.value / item.target) * 100).toFixed(2)}%)
                  </div>
                </div>
              )}
            </Card>
          </Col>
        ))}
      </Row>
    );
  };

  // 渲染组内容前安全检查
  const safeRenderGroup = (group, renderFunction) => {
    if (!group || !Array.isArray(group.data) || group.data.length === 0) {
      console.warn(`尝试渲染无效数据组:`, group);
      return null;
    }
    
    if (typeof renderFunction !== 'function') {
      console.error(`渲染函数不是一个有效函数:`, renderFunction);
      return (
        <Alert 
          message={`渲染错误: ${group.name || group.id || '未知组'}`}
          description="无法找到有效的渲染函数"
          type="error"
        />
      );
    }
    
    try {
      return renderFunction(group);
    } catch (error) {
      console.error(`渲染组 ${group.id || 'unknown'} 出错:`, error);
      return (
        <Alert
          type="error"
          message={`渲染错误: ${group.name || '未知组件'}`}
          description={`渲染此组件时发生错误: ${error.message}`}
        />
      );
    }
  };

  // 修改数据处理逻辑，确保正确处理数据分组
  useEffect(() => {
    if (lastMessage) {
      try {
        // 输出原始WebSocket消息
        console.log('📥 接收到WebSocket消息:', lastMessage);
        
        // 解析WebSocket消息
        const message = JSON.parse(lastMessage);
        
        // 输出解析后的消息对象
        console.log('🔄 解析WebSocket消息:', {
          消息类型: message.type,
          时间戳: message.timestamp ? new Date(message.timestamp).toLocaleString() : '未提供',
          消息ID: message.id || message.messageId || '无ID',
          数据大小: JSON.stringify(message).length + ' 字节'
        });
        
        // 处理设备状态更新
        if (message.type === 'device_status') {
          console.log('📊 设备状态更新:', {
            站点ID: message.siteId || siteId,
            设备总数: message.devices?.length || 0,
            频率设备: message.deviceFrequency?.length || 0,
            阀门数量: message.isValve?.length || 0,
            数据组数量: Array.isArray(message.dataGroups) ? message.dataGroups.length : 
                     (message.dataGroups?.groups?.length || 0)
          });
          
          // 处理dataGroups数据结构 - 加强处理多组相同类型数据的能力
          if (message.dataGroups) {
            // 如果dataGroups直接是数组
            if (Array.isArray(message.dataGroups)) {
              console.log('📋 接收到数组格式的dataGroups:', 
                message.dataGroups.map(g => ({
                  id: g.id,
                  name: g.name,
                  type: g.type,
                  数据项数: g.data?.length || 0
                }))
              );
              
              // 确保每个组都有唯一ID和明确类型
              const processedGroups = message.dataGroups.map((group, index) => {
                // 如果组缺少id，添加一个基于类型和索引的id
                if (!group.id) {
                  group.id = `${group.type || 'unknown'}-${index}`;
                }
                return group;
              });
              
              setDataGroups(prevState => ({
                ...prevState,
                isArray: true,
                dataArray: processedGroups
              }));
            } 
            // 如果dataGroups是具有groups属性的对象
            else if (Array.isArray(message.dataGroups.groups)) {
              console.log('📋 接收到对象格式的dataGroups:', 
                message.dataGroups.groups.map(g => ({
                  id: g.id,
                  name: g.name,
                  type: g.type,
                  数据项数: g.data?.length || 0
                }))
              );
              
              // 确保每个组都有唯一ID和明确类型
              const processedGroups = message.dataGroups.groups.map((group, index) => {
                // 如果组缺少id，添加一个基于类型和索引的id
                if (!group.id) {
                  group.id = `${group.type || 'unknown'}-${index}`;
                }
                return group;
              });
              
              setDataGroups(prevState => ({
                ...prevState,
                isArray: false,
                groups: processedGroups
              }));
            }
          }
          
          // 检查设备数据
          if (message.devices && message.devices.length > 0) {
            console.log(`🔌 接收到${message.devices.length}个设备状态:`, 
              message.devices.map(d => ({
                名称: d.name,
                状态: d.status || (d.run === 1 ? '运行中' : '已停止'),
                故障: d.fault === 1 ? '是' : '否'
              }))
            );
          }
          
          // 检查频率设备数据
          if (message.deviceFrequency && message.deviceFrequency.length > 0) {
            console.log(`⚡ 接收到${message.deviceFrequency.length}个频率设备状态:`, 
              message.deviceFrequency.map(d => ({
                名称: d.name,
                频率: d.hz + 'Hz',
                设定频率: d.sethz + 'Hz'
              }))
            );
          }
          
          // 检查阀门数据
          if (message.isValve && message.isValve.length > 0) {
            console.log(`🚿 接收到${message.isValve.length}个阀门状态:`, 
              message.isValve.map(v => ({
                名称: v.name,
                状态: v.status === 1 || v.open === 1 ? '开启' : '关闭',
                故障: v.fault === 1 ? '是' : '否'
              }))
            );
          }
        }
        // 处理命令响应
        else if (message.type === 'command_response') {
          console.log('📤 命令响应:', {
            命令ID: message.commandId,
            成功: message.success ? '是' : '否',
            消息: message.message,
            设备: message.deviceName,
            动作: message.action
          });
        }
      } catch (error) {
        console.error('❌ 处理WebSocket消息失败:', error);
      }
    }
  }, [lastMessage, siteId]);

  // 完全重写renderGroupContent函数，修复渲染问题
  const renderGroupContent = (group) => {
    // 调试日志
    console.log(`准备渲染数据组: ID=${group.id}, 类型=${group.type}`, group);
    
    // 基本验证
    if (!group) {
      console.warn('组对象为空');
      return null;
    }
    
    if (!Array.isArray(group.data) || group.data.length === 0) {
      console.warn(`数据组 ${group.id} 数据为空或不是数组`);
      return null;
    }
    
    // 如果缺少type信息，尝试从ID推断
    let type = group.type;
    if (!type) {
      type = inferTypeFromId(group.id);
      console.log(`从ID ${group.id} 推断出类型: ${type}`);
    }
    
    try {
      // 根据组类型选择渲染函数
      switch(type) {
        case 'sensor':
          if (typeof renderSensorGroup !== 'function') {
            console.error('renderSensorGroup不是一个函数');
            return null;
          }
          return safeRenderGroup(group, renderSensorGroup);
        case 'device':
          if (typeof renderDeviceGroup !== 'function') {
            console.error('renderDeviceGroup不是一个函数');
            return null;
          }
          return safeRenderGroup(group, renderDeviceGroup);
        case 'valve':
          if (typeof renderValveGroup !== 'function') {
            console.error('renderValveGroup不是一个函数');
            return null;
          }
          return safeRenderGroup(group, renderValveGroup);
        case 'energy':
          if (typeof renderEnergyGroup !== 'function') {
            console.error('renderEnergyGroup不是一个函数');
            return null;
          }
          return safeRenderGroup(group, renderEnergyGroup);
        case 'runtime':
          if (typeof renderRuntimeGroup !== 'function') {
            console.error('renderRuntimeGroup不是一个函数');
            return null;
          }
          return safeRenderGroup(group, renderRuntimeGroup);
        case 'process':
          if (typeof renderProcessGroup !== 'function') {
            console.error('renderProcessGroup不是一个函数');
            return null;
          }
          return safeRenderGroup(group, renderProcessGroup);
        case 'alarm':
          if (typeof renderAlarmGroup !== 'function') {
            console.error('renderAlarmGroup不是一个函数');
            return null;
          }
          return safeRenderGroup(group, renderAlarmGroup);
        case 'laboratory':
          if (typeof renderLabGroup !== 'function') {
            console.error('renderLabGroup不是一个函数');
            return null;
          }
          return safeRenderGroup(group, renderLabGroup);
        case 'health':
          if (typeof renderHealthGroup !== 'function') {
            console.error('renderHealthGroup不是一个函数');
            return null;
          }
          return safeRenderGroup(group, renderHealthGroup);
        case 'production':
          if (typeof renderProductionGroup !== 'function') {
            console.error('renderProductionGroup不是一个函数');
            return null;
          }
          return safeRenderGroup(group, renderProductionGroup);
        case 'frequency':
          if (typeof renderFrequencyGroup !== 'function') {
            console.error('renderFrequencyGroup不是一个函数');
            return null;
          }
          return safeRenderGroup(group, renderFrequencyGroup);
        default: 
          console.warn(`未知的数据组类型: ${type}, ID: ${group.id}, 尝试作为sensor类型渲染`);
          // 尝试基于数据结构判断类型
          const sampleItem = group.data[0];
          if (sampleItem && (sampleItem.data !== undefined || sampleItem.value !== undefined)) {
            // 如果数据有data或value字段，很可能是传感器数据
            return safeRenderGroup(group, renderSensorGroup);
          } else if (sampleItem && sampleItem.run !== undefined) {
            // 如果有run字段，可能是设备
            return safeRenderGroup(group, renderDeviceGroup);
          } else {
            console.error(`无法识别数据组类型: ${type}, ID: ${group.id}`);
            // 默认渲染为传感器数据
            return safeRenderGroup(group, renderSensorGroup);
          }
      }
    } catch (error) {
      console.error(`渲染数据组 ${group.id} 时出错:`, error);
      return (
        <Alert message="渲染错误" description={`渲染数据组 ${group.name || group.id} 时出错: ${error.message}`} type="error" />
      );
    }
  };

  // 添加从ID推断类型的辅助函数
  const inferTypeFromId = (id) => {
    if (!id) return 'unknown';
    
    // 常见ID到类型的映射
    const idTypeMap = {
      'indata': 'sensor',
      'outdata': 'sensor',
      'energy_stats': 'energy',
      'equipments': 'runtime',
      'one_process_parameters': 'process',
      'two_process_parameters': 'process',
      'active_alarms': 'alarm',
      'lab_results': 'laboratory',
      'equipment_health': 'health',
      'production_metrics': 'production',
      'control_devices': 'device',
      'control_valves': 'valve',
      'freq_control': 'frequency'
    };
    
    return idTypeMap[id] || 'unknown';
  };

  // 更新renderGroups函数，参考SiteDetailScreen.js的实现
  const renderGroups = (groups) => {
    if (!Array.isArray(groups)) {
      console.warn('groups不是数组:', groups);
      return <Empty description="数据格式错误" />;
    }

    if (groups.length === 0) {
      console.log('没有分组数据可渲染');
      return <Empty description="暂无分组数据" />;
    }

    console.log(`准备渲染${groups.length}个数据组:`, 
      groups.map(g => ({
        id: g.id, 
        name: g.name,
        type: g.type || inferTypeFromId(g.id),
        dataLength: g.data?.length,
        firstItemSample: g.data && g.data.length > 0 ? 
          Object.keys(g.data[0]).slice(0, 3).join(',') : 'no data'
      }))
    );
    
    const renderedItems = [];
    
    // 逐个处理每个组
    for (let index = 0; index < groups.length; index++) {
      const group = groups[index];
      
      // 安全检查
      if (!group) {
        console.warn(`第${index}个组为空`);
        continue;
      }
      
      // 确保ID存在
      const safeId = group.id || `group-${group.type || 'unknown'}-${index}`;
      
      // 确保type存在
      if (!group.type) {
        const inferredType = inferTypeFromId(safeId);
        console.log(`为组${safeId}推断类型: ${inferredType}`);
        group.type = inferredType;
      }
      
      // 确保name存在
      const safeName = group.name || `${group.type}数据组-${index+1}`;
      
      // 确保data数组存在
      if (!Array.isArray(group.data) || group.data.length === 0) {
        console.log(`跳过空数据组: ${safeId}, ${safeName}`);
        continue;
      }
      
      // 创建唯一key
      const randomSuffix = Math.random().toString(36).substring(2, 7);
      const uniqueKey = `group-${safeId}-${index}-${randomSuffix}`;
      
      // 克隆组对象，避免修改原始数据
      const safeGroup = {
        ...group,
        id: safeId,
        name: safeName
      };
      
      // 根据可见性决定是否渲染内容
      const isVisible = visibleGroups[safeId] !== false || hasGroupAlarm(safeGroup);
      
      try {
        // 渲染组和内容
        console.log(`渲染组 ${uniqueKey}: ${safeName}, 类型=${safeGroup.type}, 可见=${isVisible}`);
        renderedItems.push(
          <React.Fragment key={uniqueKey}>
            {index > 0 && <Divider />}
            {renderGroupHeader(safeGroup)}
            {isVisible && renderGroupContent(safeGroup)}
          </React.Fragment>
        );
      } catch (error) {
        console.error(`渲染组 ${safeId} 时出错:`, error);
        renderedItems.push(
          <React.Fragment key={uniqueKey}>
            {index > 0 && <Divider />}
            {renderGroupHeader(safeGroup)}
            <Alert 
              message={`渲染错误: ${safeName}`} 
              description={`渲染此组件时发生错误: ${error.message}`}
              type="error"
            />
          </React.Fragment>
        );
      }
    }
    
    if (renderedItems.length === 0) {
      console.warn('所有组都无法渲染');
      return <Empty description="无法渲染数据组" />;
    }
    
    return renderedItems;
  };

  // 添加频率设备渲染组件
  const renderFrequencyGroup = (group) => (
    <Row gutter={[8, 8]}>
      {group.data.map((device, idx) => (
        <Col xs={24} sm={12} md={8} lg={4} xl={4} xxl={4} key={idx}>
          <Card hoverable className={styles.deviceCard} style={{ borderTop: '4px solid #1890ff' }}>
            <div style={{ marginBottom: 6 }}>
              <Text strong style={{fontSize: 14}}>{device.name}</Text>
            </div>

            <Statistic
              title="当前频率"
              value={formatNumber(device.hz)}
              suffix="Hz"
              precision={2}
              valueStyle={{ color: '#1890ff', fontSize: 16 }}
            />

            {device.sethz !== undefined && (
              <div style={{ marginTop: 6, color: 'rgba(0, 0, 0, 0.45)', fontSize: 12 }}>
                设定值: {formatNumber(device.sethz)} Hz
              </div>
            )}

            <div style={{ marginTop: 12 }}>
              <Button
                type="primary"
                size="small"
                disabled={!hasControlPermission}
                onClick={() => {
                  setSelectedDevice(device);
                  setNewFrequency(device.sethz?.toString() || '');
                  setModalVisible(true);
                }}
                loading={pendingCommands[device.name]?.status === 'pending'}
              >
                设置频率
              </Button>
            </div>

            {!hasControlPermission && (
              <div style={{
                marginTop: 6,
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

  // 打印所有已注册的API信息的函数
  const printApiRegistry = useCallback(() => {
    console.log('📚 注册的API列表 📚');
    const apis = apiManager.registry.getAll();
    
    if (!apis || Object.keys(apis).length === 0) {
      console.log('没有注册的API');
      return;
    }
    
    console.table(Object.keys(apis).map(apiName => ({
      API名称: apiName,
      URL: apis[apiName].url,
      方法: apis[apiName].method,
      超时: `${apis[apiName].timeout}ms`,
      缓存时间: apis[apiName].cacheTime ? `${apis[apiName].cacheTime}ms` : '无缓存',
      类别: apis[apiName].category || '未分类'
    })));
  }, []);

  // 处理WebSocket消息 - 增强处理多个相同类型数据组的能力
  useEffect(() => {
    if (lastMessage) {
      try {
        // 判断消息是否已经是对象（有些WebSocket库可能已经解析）
        const message = typeof lastMessage === 'string' ? JSON.parse(lastMessage) : lastMessage;
        
        console.log('📥 接收到WebSocket消息:', message);
        
        // 处理设备状态更新
        if (message.type === 'device_status') {
          console.log('🔄 接收到设备状态更新:', {
            站点ID: message.siteId,
            时间戳: new Date(message.timestamp).toLocaleString(),
            设备数量: message.devices?.length || 0
          });
          
          // 处理设备状态 - 特别关注简单的设备数组格式
          if (Array.isArray(message.devices) && message.devices.length > 0) {
            console.log('🔌 设备状态数据:', message.devices.map(d => ({
              设备名称: d.name,
              运行状态: d.run === 1 ? '运行中' : '已停止',
              故障状态: d.fault === 1 ? '故障' : '正常'
            })));
            
            // 更新设备状态
            setDevices(message.devices);
            
            // 同时更新数据组中的设备信息
            setDataGroups(prevGroups => {
              // 创建一个新的设备组，使用接收到的设备数据
              const deviceGroup = {
                id: 'devices',
                name: '设备控制',
                type: 'device',
                data: message.devices
              };
              
              // 检查是否已有设备组
              if (prevGroups.dataGroups && Array.isArray(prevGroups.dataGroups)) {
                // 替换现有的设备组
                const updatedGroups = prevGroups.dataGroups.map(group => 
                  group.id === 'devices' ? deviceGroup : group
                );
                
                // 检查是否找到了设备组
                const foundDeviceGroup = updatedGroups.some(g => g.id === 'devices');
                
                // 如果没有找到设备组，添加它
                if (!foundDeviceGroup) {
                  updatedGroups.push(deviceGroup);
                }
                
                return {
                  ...prevGroups,
                  dataGroups: updatedGroups
                };
              }
              
              // 如果没有dataGroups属性，创建一个
              return {
                ...prevGroups,
                dataGroups: [deviceGroup]
              };
            });
            
            console.log('✅ 成功更新设备状态');
          }
          
          // 处理dataGroups数据结构
          if (message.dataGroups) {
            // 如果dataGroups直接是数组
            if (Array.isArray(message.dataGroups)) {
              console.log('📋 接收到数组格式的dataGroups:', message.dataGroups);
              // 确保每个组都有唯一ID和明确类型
              const processedGroups = message.dataGroups.map((group, index) => {
                // 如果组缺少id，添加一个基于类型和索引的id
                if (!group.id) {
                  group.id = `${group.type || 'unknown'}-${index}`;
                }
                return group;
              });
              
              setDataGroups(prevState => ({
                ...prevState,
                isArray: true,
                dataArray: processedGroups
              }));
              
              console.log('✅ 成功更新数组格式的数据组');
            } 
            // 如果dataGroups是具有groups属性的对象
            else if (Array.isArray(message.dataGroups.groups)) {
              console.log('📋 接收到对象格式的dataGroups:', message.dataGroups.groups);
              // 确保每个组都有唯一ID和明确类型
              const processedGroups = message.dataGroups.groups.map((group, index) => {
                // 如果组缺少id，添加一个基于类型和索引的id
                if (!group.id) {
                  group.id = `${group.type || 'unknown'}-${index}`;
                }
                return group;
              });
              
              setDataGroups(prevState => ({
                ...prevState,
                isArray: false,
                groups: processedGroups
              }));
              
              console.log('✅ 成功更新对象格式的数据组');
            }
          }
          
          // 处理其他数据类型
          if (message.deviceFrequency) {
            console.log('⚡ 更新频率设备:', message.deviceFrequency);
            setDeviceFrequency(message.deviceFrequency);
          }
          
          if (message.isValve) {
            console.log('🚿 更新阀门状态:', message.isValve);
            setIsValve(message.isValve);
          }
          
          if (message.indata) {
            console.log('📊 更新进水数据:', message.indata);
            setInData(message.indata);
          }
          
          if (message.outdata) {
            console.log('📊 更新出水数据:', message.outdata);
            setOutData(message.outdata);
          }
          
          // 更新时间戳
          setLastUpdateTime(new Date(message.timestamp || Date.now()));
          console.log('🕒 更新时间戳:', new Date(message.timestamp || Date.now()).toLocaleString());
        }
        
        // 处理命令响应
        if (message.type === 'command_response' && message.commandId) {
          console.log('📤 命令响应:', {
            命令ID: message.commandId,
            成功: message.success ? '是' : '否',
            消息: message.message
          });
          
          setPendingCommands(prev => ({
            ...prev,
            [message.commandId]: {
              ...prev[message.commandId],
              status: message.success ? 'success' : 'error',
              message: message.message
            }
          }));
        }
      } catch (error) {
        console.error('❌ 处理WebSocket消息失败:', error);
        console.error('原始消息:', lastMessage);
      }
    }
  }, [lastMessage]);

  // 渲染安全包装函数，提供给SiteDetailRenderer组件使用 
  const safeFunctionCall = (func, ...args) => {
    if (typeof func !== 'function') {
      console.error(`尝试调用不是函数的对象: ${func}`);
      return null;
    }
    
    try {
      return func(...args);
    } catch (error) {
      console.error(`函数调用时出错:`, error);
      return <Alert message="渲染错误" description={error.message} type="error" />;
    }
  };
  
  // 计算设备和告警统计数据
  const calculateStats = useCallback(() => {
    let deviceTotal = 0;
    let deviceRunning = 0;
    let alarmTotal = 0;
    
    // 获取所有可能的数据源
    let allDataGroups = [];
    
    // 处理API返回的dataGroups数组
    if (Array.isArray(dataGroups.dataGroups) && dataGroups.dataGroups.length > 0) {
      allDataGroups = dataGroups.dataGroups;
    } 
    // 处理groups属性
    else if (dataGroups?.groups && dataGroups.groups.length > 0) {
      allDataGroups = dataGroups.groups;
    }
    // 处理dataArray属性
    else if (dataGroups?.isArray && dataGroups.dataArray && dataGroups.dataArray.length > 0) {
      allDataGroups = dataGroups.dataArray;
    }
    
    // 处理传统格式的设备数据
    if (devices?.length > 0) {
      deviceTotal += devices.length;
      deviceRunning += devices.filter(device => 
        device.status === 'running' || device.run === 1 || device.status === 1
      ).length;
    }
    
    if (deviceFrequency?.length > 0) {
      deviceTotal += deviceFrequency.length;
      // 检查频率设备是否有运行状态标记
      deviceRunning += deviceFrequency.filter(device => 
        (device.status === 'running' || device.run === 1 || device.status === 1) || 
        // 如果没有明确的运行状态，检查频率值是否大于0
        (device.hz > 0)
      ).length;
    }
    
    if (isValve?.length > 0) {
      deviceTotal += isValve.length;
      deviceRunning += isValve.filter(valve => 
        valve.status === 1 || valve.open === 1
      ).length;
    }
    
    if (dataGroups?.devices?.length > 0) {
      // 避免重复计算，仅当未计算过时才计算
      if (devices?.length === 0) {
        deviceTotal += dataGroups.devices.length;
        deviceRunning += dataGroups.devices.filter(device => 
          device.status === 'running' || device.run === 1 || device.status === 1
        ).length;
      }
    }
    
    if (dataGroups?.deviceFrequency?.length > 0) {
      if (deviceFrequency?.length === 0) {
        deviceTotal += dataGroups.deviceFrequency.length;
        deviceRunning += dataGroups.deviceFrequency.filter(device => 
          (device.status === 'running' || device.run === 1 || device.status === 1) || 
          (device.hz > 0)
        ).length;
      }
    }
    
    if (dataGroups?.isValve?.length > 0) {
      if (isValve?.length === 0) {
        deviceTotal += dataGroups.isValve.length;
        deviceRunning += dataGroups.isValve.filter(valve => 
          valve.status === 1 || valve.open === 1
        ).length;
      }
    }
    
    // 从所有数据组中计算设备数量
    allDataGroups.forEach(group => {
      // 确保组有类型
      const type = group.type || inferTypeFromId(group.id);
      
      // 如果是设备相关组且有数据
      if ((type === 'device' || type === 'valve' || type === 'frequency') && 
          Array.isArray(group.data) && group.data.length > 0) {
        // 避免重复计算
        if (!(group.id === 'devices' && devices?.length > 0) && 
            !(group.id === 'deviceFrequency' && deviceFrequency?.length > 0) &&
            !(group.id === 'isValve' && isValve?.length > 0)) {
          deviceTotal += group.data.length;
          
          // 根据不同设备类型判断运行状态
          if (type === 'device') {
            deviceRunning += group.data.filter(device => 
              device.status === 'running' || device.run === 1 || device.status === 1
            ).length;
          } else if (type === 'frequency') {
            deviceRunning += group.data.filter(device => 
              (device.status === 'running' || device.run === 1 || device.status === 1) || 
              (device.hz > 0)
            ).length;
          } else if (type === 'valve') {
            deviceRunning += group.data.filter(valve => 
              valve.status === 1 || valve.open === 1
            ).length;
          }
        }
      }
      
      // 如果是告警相关组且有数据
      if (type === 'alarm' && Array.isArray(group.data) && group.data.length > 0) {
        alarmTotal += group.data.length;
      }
    });
    
    // 处理直接返回的告警数据
    if (dataGroups.alarms && Array.isArray(dataGroups.alarms)) {
      alarmTotal += dataGroups.alarms.length;
    }
    
    // 返回计算结果
    return {
      deviceTotal,
      deviceRunning,
      alarmTotal
    };
  }, [dataGroups, devices, deviceFrequency, isValve, inferTypeFromId]);

  // 对数据组进行分类的辅助函数
  const categorizeDataGroups = (allGroups) => {
    if (!Array.isArray(allGroups)) return { deviceGroups: [], processGroups: [], alarmGroups: [] };
    
    const deviceGroups = [];
    const processGroups = [];
    const alarmGroups = [];
    
    // 分类逻辑
    allGroups.forEach(group => {
      // 确保组有ID和类型
      const type = group.type || inferTypeFromId(group.id);
      const safeGroup = { ...group, type };
      
      // 分类
      if (type === 'device' || type === 'valve' || type === 'frequency' || 
          safeGroup.id === 'devices' || safeGroup.id === 'deviceFrequency' || 
          safeGroup.id === 'isValve' || safeGroup.id === 'control_devices' || 
          safeGroup.id === 'control_valves' || safeGroup.id === 'freq_control' ||
          type === 'runtime' || safeGroup.id === 'equipments' || 
          type === 'health' || safeGroup.id === 'equipment_health') {
        // 设备相关组
        deviceGroups.push(safeGroup);
      } else if (type === 'alarm' || safeGroup.id === 'active_alarms' || 
                safeGroup.id === 'alarms' || safeGroup.id.includes('alarm')) {
        // 告警相关组
        alarmGroups.push(safeGroup);
      } else {
        // 工艺数据相关组（传感器、能耗、工艺参数等）
        processGroups.push(safeGroup);
      }
    });
    
    console.log('数据分类完成:', {
      设备组数量: deviceGroups.length,
      工艺组数量: processGroups.length,
      告警组数量: alarmGroups.length
    });
    
    return { deviceGroups, processGroups, alarmGroups };
  };

  const [wsCheckTimer, setWsCheckTimer] = useState(null);
  const [isPageLoaded, setIsPageLoaded] = useState(false);
  const pageLoadTimer = useRef(null);

  // 页面加载后10秒启动WebSocket检查
  useEffect(() => {
    setIsPageLoaded(false);
    pageLoadTimer.current = setTimeout(() => {
      setIsPageLoaded(true);
    }, 10000); // 10秒后设置页面已加载

    return () => {
      if (pageLoadTimer.current) {
        clearTimeout(pageLoadTimer.current);
      }
    };
  }, []);

  // WebSocket连接状态检查
  useEffect(() => {
    if (!isPageLoaded) return; // 如果页面未加载完成，不启动检查

    const checkWsConnection = () => {
      if (!wsConnected) {
        Modal.warning({
          title: '设备控制连接断开',
          content: '设备控制连接已断开，请检查网络连接或刷新页面重试。',
          okText: '我知道了',
          onOk: () => {
            // 用户确认后，尝试重新连接
            connect(siteId);
          }
        });
      }
    };

    // 设置定时器，每30秒检查一次连接状态
    const timer = setInterval(checkWsConnection, 30000);
    setWsCheckTimer(timer);

    // 清理函数
    return () => {
      if (timer) {
        clearInterval(timer);
      }
    };
  }, [wsConnected, isPageLoaded, connect, siteId]);

  // 组件卸载时清理所有定时器
  useEffect(() => {
    return () => {
      if (wsCheckTimer) {
        clearInterval(wsCheckTimer);
      }
      if (pageLoadTimer.current) {
        clearTimeout(pageLoadTimer.current);
      }
    };
  }, [wsCheckTimer]);

  // 切换全屏
  const toggleFullscreen = () => {
    if (!pageContainerRef.current) return;
    
    if (!document.fullscreenElement) {
      // 进入全屏
      pageContainerRef.current.requestFullscreen().catch(err => {
        message.error(`无法进入全屏模式: ${err.message}`);
      });
    } else {
      // 只有当前页面容器处于全屏状态时才退出全屏
      // 这样可以避免与TrendDataSection的全屏冲突
      if (document.fullscreenElement === pageContainerRef.current) {
        document.exitFullscreen().catch(err => {
          message.error(`无法退出全屏模式: ${err.message}`);
        });
      }
    }
  };

  // 监听全屏状态变化
  useEffect(() => {
    const handleFullscreenChange = () => {
      // 只有当全屏元素是当前页面容器时才更新状态
      setIsFullscreen(document.fullscreenElement === pageContainerRef.current);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  return (
    <SiteDetailRenderer
      // 传递现有的props
      refreshing={refreshing}
      error={error}
      dataGroups={dataGroups}
      fetchSiteDetail={fetchSiteDetail}
      handleRefresh={handleRefresh}
      apiManager={apiManager}
      siteId={siteId}
      navigate={navigate}
      wsConnected={wsConnected}
      connect={connect}
      pendingCommands={pendingCommands}
      hasControlPermission={hasControlPermission}
      handleDeviceControl={handleDeviceControl}
      handleValveControl={handleValveControl}
      handleSetFrequency={handleSetFrequency}
      modalVisible={modalVisible}
      setModalVisible={setModalVisible}
      selectedDevice={selectedDevice}
      newFrequency={newFrequency}
      setNewFrequency={setNewFrequency}
      inData={inData}
      outData={outData}
      devices={devices}
      deviceFrequency={deviceFrequency}
      isValve={isValve}
      visibleGroups={visibleGroups}
      toggleGroupVisibility={toggleGroupVisibility}
      hasGroupAlarm={hasGroupAlarm}
      logApiCall={logApiCall}
      printApiRegistry={printApiRegistry}
      fetchTrendData={fetchTrendData}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      activeDeviceTab={activeDeviceTab}
      setActiveDeviceTab={setActiveDeviceTab}
      activeProcessTab={activeProcessTab}
      setActiveProcessTab={setActiveProcessTab}
      handleSetDefaultDeviceTab={handleSetDefaultDeviceTab}
      handleSetDefaultProcessTab={handleSetDefaultProcessTab}
      handleSetDefaultMainTab={handleSetDefaultMainTab}
      calculateStats={calculateStats}
      renderGroups={renderGroups}
      renderGroupContent={renderGroupContent}
      renderGroupHeader={renderGroupHeader}
      inferTypeFromId={inferTypeFromId}
      safeRenderGroup={safeRenderGroup}
      renderSensorGroup={renderSensorGroup}
      renderDeviceGroup={renderDeviceGroup}
      renderValveGroup={renderValveGroup}
      renderEnergyGroup={renderEnergyGroup}
      renderRuntimeGroup={renderRuntimeGroup}
      renderProcessGroup={renderProcessGroup}
      renderAlarmGroup={renderAlarmGroup}
      renderLabGroup={renderLabGroup}
      renderHealthGroup={renderHealthGroup}
      renderProductionGroup={renderProductionGroup}
      renderFrequencyGroup={renderFrequencyGroup}
      safeFunctionCall={safeFunctionCall}
      categorizeDataGroups={categorizeDataGroups}
      // 添加全屏相关props
      isFullscreen={isFullscreen}
      toggleFullscreen={toggleFullscreen}
      pageContainerRef={pageContainerRef}
    />
  );
};

/**
 * 站点详情渲染组件 - 负责UI渲染，避免Hook顺序问题
 */
const SiteDetailRenderer = ({ 
  refreshing, 
  error, 
  dataGroups,
  fetchSiteDetail,
  handleRefresh,
  apiManager,
  siteId,
  navigate,
  wsConnected,
  connect,
  pendingCommands,
  hasControlPermission,
  handleDeviceControl,
  handleValveControl,
  handleSetFrequency,
  modalVisible,
  setModalVisible,
  selectedDevice,
  newFrequency,
  setNewFrequency,
  inData,
  outData,
  devices,
  deviceFrequency,
  isValve,
  visibleGroups,
  toggleGroupVisibility,
  hasGroupAlarm,
  logApiCall,
  printApiRegistry,
  fetchTrendData,
  activeTab,
  setActiveTab,
  activeDeviceTab,
  setActiveDeviceTab,
  activeProcessTab,
  setActiveProcessTab,
  handleSetDefaultDeviceTab,
  handleSetDefaultProcessTab,
  handleSetDefaultMainTab,
  calculateStats,
  renderGroups,
  renderGroupContent,
  renderGroupHeader,
  inferTypeFromId,
  safeRenderGroup,
  renderSensorGroup,
  renderDeviceGroup,
  renderValveGroup,
  renderEnergyGroup,
  renderRuntimeGroup,
  renderProcessGroup,
  renderAlarmGroup,
  renderLabGroup,
  renderHealthGroup,
  renderProductionGroup,
  renderFrequencyGroup,
  safeFunctionCall,
  categorizeDataGroups,
  // 添加全屏相关props
  isFullscreen,
  toggleFullscreen,
  pageContainerRef
}) => {
  // 使用useMemo计算统计数据，避免重复计算
  const stats = React.useMemo(() => {
    console.log("计算统计数据...");
    return calculateStats();
  }, [calculateStats, dataGroups, devices, deviceFrequency, isValve]);
  // 创建本地渲染函数，确保安全调用
  const localRenderGroups = (groups) => {
    try {
      console.log("SiteDetailRenderer: 调用renderGroups函数");
      if (typeof renderGroups !== 'function') {
        console.error('renderGroups不是一个函数:', renderGroups);
        return <Empty description="数据渲染函数缺失" />;
      }
      return renderGroups(groups);
    } catch (error) {
      console.error('调用renderGroups时出错:', error);
      return <Alert message="渲染错误" description={`渲染数据组时出错: ${error.message}`} type="error" />;
    }
  };
  
  // 创建本地分类函数，确保安全调用
  const localCategorizeDataGroups = (groups) => {
    try {
      console.log("SiteDetailRenderer: 调用categorizeDataGroups函数");
      if (typeof categorizeDataGroups !== 'function') {
        console.error('categorizeDataGroups不是一个函数:', categorizeDataGroups);
        return { deviceGroups: [], processGroups: [], alarmGroups: [] };
      }
      return categorizeDataGroups(groups);
    } catch (error) {
      console.error('调用categorizeDataGroups时出错:', error);
      return { deviceGroups: [], processGroups: [], alarmGroups: [] };
    }
  };
  
  const localRenderGroupContent = (group) => {
    try {
      console.log("SiteDetailRenderer: 调用renderGroupContent函数");
      if (typeof renderGroupContent !== 'function') {
        console.error('renderGroupContent不是一个函数:', renderGroupContent);
        return <Empty description="组件渲染函数缺失" />;
      }
      return renderGroupContent(group);
    } catch (error) {
      console.error('调用renderGroupContent时出错:', error);
      return <Alert message="渲染错误" description={`渲染组内容时出错: ${error.message}`} type="error" />;
    }
  };
  
  // 打印API注册信息
  useEffect(() => {
    // 延迟1秒执行，确保API已经注册完成
    const timer = setTimeout(() => {
      printApiRegistry();
    }, 1000);
    
    return () => {
      clearTimeout(timer);
    };
  }, [printApiRegistry]);

  // 输出统计信息
  useEffect(() => {
    // 创建一个定时器，每30秒打印一次API统计信息
    const statsTimer = setInterval(() => {
      const stats = window._API_STATS;
      if (!stats) return;
      
      console.log('📊 API调用统计信息 📊');
      console.table(Object.keys(stats).map(apiName => ({
        API名称: apiName,
        调用次数: stats[apiName].callCount,
        平均响应时间: stats[apiName].avgResponseTime ? `${stats[apiName].avgResponseTime.toFixed(2)}ms` : 'N/A',
        错误次数: stats[apiName].errors,
        上次调用: stats[apiName].lastCallTime ? new Date(stats[apiName].lastCallTime).toLocaleTimeString() : 'N/A',
        API地址: stats[apiName].url
      })));
    }, 30000);
    
    return () => {
      clearInterval(statsTimer);
    };
  }, []);

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

  // 全屏模式的样式
  const fullscreenStyle = isFullscreen ? {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    zIndex: 9999,
    padding: '20px',
    background: '#f0f2f5',
    overflow: 'auto'
  } : {};

  return (
    <div 
      className={`${styles.siteDetailContainer} ${isFullscreen ? styles.fullscreen : ''}`} 
      style={fullscreenStyle}
      ref={pageContainerRef}
    >
      {/* 页面头部 */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          {!isFullscreen && (
            <Button
              icon={<LeftOutlined />}
              onClick={() => navigate('/sites')}
              className={styles.backButton}
            >
              返回
            </Button>
          )}
          <h1 className={styles.pageTitle}>{dataGroups.name}</h1>
        </div>
        <div className={styles.headerActions}>
          <ApiEditorButton
            apiList={[
              { name: 'getSiteById', params: { id: siteId } },
              { name: 'getSiteAlarms', params: { siteId: siteId } },
              { name: 'getSiteUsers', params: { siteId: siteId } }
            ]}
            dialogTitle="站点相关API"
          />
          <Button
            type="primary"
            className={styles.actionButton}
            icon={<ReloadOutlined />}
            onClick={handleRefresh}
            loading={refreshing}
          >
            刷新
          </Button>
          <Button
            type="default"
            className={styles.actionButton}
            icon={isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
            onClick={toggleFullscreen}
          >
            {isFullscreen ? '退出全屏' : '全屏'}
          </Button>
        </div>
      </div>

      {/* 合并站点信息区和统计信息到同一行 */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        {/* 站点信息区 - 占左侧较大部分 */}
        <Col xs={24} md={16}>
          <Card 
            className={styles.siteInfoCard}
            style={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <div className={styles.siteInfoHeader}>
              <div className={styles.siteTitle}>
                <DashboardOutlined className={styles.siteTitleIcon} />
                <Text strong style={{ fontSize: 22, color: '#2E7D32' }}>{dataGroups.site?.name || dataGroups.name || '未知站点'}</Text>
                <Badge 
                  status={(dataGroups.site?.status || dataGroups.status) === '在线' ? 'success' : 'error'}
                  text={dataGroups.site?.status || dataGroups.status || '离线'} 
                  style={{ marginLeft: 14, fontSize: 16 }}
                />
                <Tag color={
                  (dataGroups.site?.alarm || dataGroups.alarm) === '设施正常' ? 'success' :
                  (dataGroups.site?.alarm || dataGroups.alarm) === '设施停用' ? 'warning' : 'error'
                } style={{ marginLeft: 10, fontSize: 14, padding: '2px 10px' }}>
                  {dataGroups.site?.alarm || dataGroups.alarm || '未知状态'}
                </Tag>
              </div>
              {/* 移除设备控制连接状态显示 */}
            </div>
            
            <Divider style={{ margin: '12px 0 16px' }} />
            
            <Row gutter={[24, 16]} style={{ flex: 1 }}>
              <Col xs={24} sm={8}>
                <div className={styles.infoItem}>
                  <DashboardOutlined className={styles.infoIcon} />
                  <div className={styles.infoContent}>
                    <div className={styles.infoLabel}>总进水量</div>
                    <div className={styles.infoValue}>
                      {(dataGroups.site?.totalInflow !== undefined && dataGroups.site?.totalInflow !== null) ? 
                        `${formatNumber(dataGroups.site.totalInflow)} 吨` : 
                        (dataGroups.totalInflow !== undefined && dataGroups.totalInflow !== null) ? 
                        `${formatNumber(dataGroups.totalInflow)} 吨` : '0.00 吨'}
                    </div>
                  </div>
                </div>
              </Col>
              
              <Col xs={24} sm={8}>
                <div className={styles.infoItem}>
                  <ClockCircleOutlined className={styles.infoIcon} />
                  <div className={styles.infoContent}>
                    <div className={styles.infoLabel}>最后更新时间</div>
                    <div className={styles.infoValue}>
                      {dataGroups.site?.lastUpdateTime || dataGroups.lastUpdate || new Date().toLocaleString()}
                    </div>
                  </div>
                </div>
              </Col>
              
              <Col xs={24} sm={8}>
                <div className={styles.infoItem}>
                  <TeamOutlined className={styles.infoIcon} />
                  <div className={styles.infoContent}>
                    <div className={styles.infoLabel}>管理部门</div>
                    <div className={styles.infoValue}>
                      {(dataGroups.site?.departments || dataGroups.departments) && 
                      (dataGroups.site?.departments || dataGroups.departments).length > 0 ? (
                        <div className={styles.departmentTags}>
                          {(dataGroups.site?.departments || dataGroups.departments).map((dept, index) => (
                            <Tag key={index} color="blue" style={{ marginRight: 10, marginBottom: 6, fontSize: 14 }}>
                              {dept}
                            </Tag>
                          ))}
                        </div>
                      ) : (
                        <Text type="secondary" style={{ fontSize: 16 }}>暂无管理部门信息</Text>
                      )}
                    </div>
                  </div>
                </div>
              </Col>
            </Row>
          </Card>
        </Col>

        {/* 站点统计信息 - 占右侧较小部分 */}
        <Col xs={24} md={8}>
          <Card 
            className={styles.statCardContainer}
            style={{
              height: '100%',
              padding: '16px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              borderRadius: '12px',
              background: '#fff'
            }}
            bodyStyle={{ 
              padding: '0',
              height: '100%'
            }}
          >
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(3, 1fr)', 
              gridTemplateRows: 'repeat(2, 1fr)',
              gap: '12px',
              height: '100%'
            }}>
              {/* 设备统计卡片 */}
              <div className={styles.statCard} style={{ 
                  borderTop: '4px solid #2E7D32',
                  borderRadius: '10px',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
                  display: 'flex',
                  flexDirection: 'column',
                  padding: '12px',
                  height: '100%',
                  background: '#fff'
                }}
              >
                <div className={styles.statContent} style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                  <div className={styles.statIconWrapper} style={{ 
                    backgroundColor: 'rgba(46, 125, 50, 0.15)',
                    width: 36,
                    height: 36,
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 8
                  }}>
                    <ApartmentOutlined style={{ fontSize: 18, color: '#2E7D32' }} />
              </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)', marginBottom: 2 }}>设备总数</div>
                    <div style={{ fontSize: 18, fontWeight: 600, color: '#2E7D32' }}>{stats.deviceTotal}</div>
              </div>
            </div>
              </div>
              
              <div className={styles.statCard} style={{ 
                  borderTop: '4px solid #52c41a',
                  borderRadius: '10px',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
                  display: 'flex',
                  flexDirection: 'column',
                  padding: '12px',
                  height: '100%',
                  background: '#fff'
                }}
              >
                <div className={styles.statContent} style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                  <div className={styles.statIconWrapper} style={{ 
                    backgroundColor: 'rgba(82, 196, 26, 0.15)',
                    width: 36,
                    height: 36,
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 8
                  }}>
                    <ThunderboltOutlined style={{ fontSize: 18, color: '#52c41a' }} />
              </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)', marginBottom: 2 }}>运行中</div>
                    <div style={{ fontSize: 18, fontWeight: 600, color: '#52c41a' }}>{stats.deviceRunning}</div>
            </div>
              </div>
              </div>
              
              <div className={styles.statCard} style={{ 
                  borderTop: '4px solid #ff4d4f',
                  borderRadius: '10px',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
                  display: 'flex',
                  flexDirection: 'column',
                  padding: '12px',
                  height: '100%',
                  background: '#fff'
                }}
              >
                <div className={styles.statContent} style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                  <div className={styles.statIconWrapper} style={{ 
                    backgroundColor: stats.alarmTotal > 0 ? 'rgba(255, 77, 79, 0.15)' : 'rgba(0, 0, 0, 0.06)',
                    width: 36,
                    height: 36,
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 8
                  }}>
                    <AlertOutlined style={{ fontSize: 18, color: stats.alarmTotal > 0 ? '#ff4d4f' : 'rgba(0, 0, 0, 0.45)' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)', marginBottom: 2 }}>告警数</div>
                    <div style={{ 
                      fontSize: 18, 
                      fontWeight: 600, 
                      color: stats.alarmTotal > 0 ? '#ff4d4f' : 'rgba(0, 0, 0, 0.45)' 
                    }}>{stats.alarmTotal}</div>
                  </div>
                </div>
              </div>

              {/* 产量统计卡片 */}
              <div className={styles.statCard} style={{ 
                  borderTop: '4px solid #1890ff',
                  borderRadius: '10px',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
                  display: 'flex',
                  flexDirection: 'column',
                  padding: '12px',
                  height: '100%',
                  background: '#fff'
                }}
              >
                <div className={styles.statContent} style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                  <div className={styles.statIconWrapper} style={{ 
                    backgroundColor: 'rgba(24, 144, 255, 0.15)',
                    width: 36,
                    height: 36,
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 8
                  }}>
                    <LineChartOutlined style={{ fontSize: 18, color: '#1890ff' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)', marginBottom: 2 }}>昨日产量</div>
                    <div style={{ fontSize: 18, fontWeight: 600, color: '#1890ff' }}>
                      {stats.yesterdayProduction ? `${stats.yesterdayProduction.toFixed(2)} 吨` : '0.00 吨'}
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.statCard} style={{ 
                  borderTop: '4px solid #722ed1',
                  borderRadius: '10px',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
                  display: 'flex',
                  flexDirection: 'column',
                  padding: '12px',
                  height: '100%',
                  background: '#fff'
                }}
              >
                <div className={styles.statContent} style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                  <div className={styles.statIconWrapper} style={{ 
                    backgroundColor: 'rgba(114, 46, 209, 0.15)',
                    width: 36,
                    height: 36,
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 8
                  }}>
                    <DashboardOutlined style={{ fontSize: 18, color: '#722ed1' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)', marginBottom: 2 }}>今日产量</div>
                    <div style={{ fontSize: 18, fontWeight: 600, color: '#722ed1' }}>
                      {stats.todayProduction ? `${stats.todayProduction.toFixed(2)} 吨` : '0.00 吨'}
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.statCard} style={{ 
                  borderTop: '4px solid #fa8c16',
                  borderRadius: '10px',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
                  display: 'flex',
                  flexDirection: 'column',
                  padding: '12px',
                  height: '100%',
                  background: '#fff'
                }}
              >
                <div className={styles.statContent} style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                  <div className={styles.statIconWrapper} style={{ 
                    backgroundColor: 'rgba(250, 140, 22, 0.15)',
                    width: 36,
                    height: 36,
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 8
                  }}>
                    <FundOutlined style={{ fontSize: 18, color: '#fa8c16' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)', marginBottom: 2 }}>差额产量</div>
                    <div style={{ 
                      fontSize: 18, 
                      fontWeight: 600, 
                      color: stats.productionDiff > 0 ? '#52c41a' : 
                             stats.productionDiff < 0 ? '#ff4d4f' : '#fa8c16'
                    }}>
                      {stats.productionDiff ? `${stats.productionDiff.toFixed(2)} 吨` : '0.00 吨'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 第三部分：工艺数据区（由后端API获取） */}
      <Card
        title={
          <div className={styles.sectionCardTitle}>
            <DashboardOutlined className={styles.sectionCardIcon} />
            <span>工艺数据</span>
            <Tag color="blue" className={styles.sectionCardTag}>API获取</Tag>
          </div>
        }
        className={styles.sectionCard}
      >
        {/* 工艺数据内容 */}
        {(() => {
          // 使用自动分类函数分类数据
          let allDataGroups = [];
          
          // 处理API返回的dataGroups数组
          if (Array.isArray(dataGroups.dataGroups) && dataGroups.dataGroups.length > 0) {
            allDataGroups = dataGroups.dataGroups;
          } 
          // 处理groups属性
          else if (dataGroups?.groups && dataGroups.groups.length > 0) {
            allDataGroups = dataGroups.groups;
          }
          // 处理dataArray属性
          else if (dataGroups?.isArray && dataGroups.dataArray && dataGroups.dataArray.length > 0) {
            allDataGroups = dataGroups.dataArray;
          }
          // 处理传统数据格式
          else if (dataGroups?.data && Array.isArray(dataGroups.data)) {
            allDataGroups = dataGroups.data;
          }
          // 处理legacyGroups
          else if (dataGroups?.legacyGroups && Array.isArray(dataGroups.legacyGroups)) {
            allDataGroups = dataGroups.legacyGroups;
          }
          
          // 分类数据
          const { processGroups } = localCategorizeDataGroups(allDataGroups);
          
          if (processGroups.length === 0) {
            return <Empty description="暂无工艺数据" />;
          }
          
          // 进一步对工艺数据进行细分
          const sensorGroups = processGroups.filter(group => 
            group.type === 'sensor' || group.id === 'indata' || group.id === 'outdata');
          
          const energyGroups = processGroups.filter(group => 
            group.type === 'energy' || group.id === 'energy_stats');
          
          const processParamGroups = processGroups.filter(group => 
            group.type === 'process' || group.id === 'process_parameters');
          
          const labGroups = processGroups.filter(group => 
            group.type === 'laboratory' || group.id === 'lab_results');
          
          const productionGroups = processGroups.filter(group => 
            group.type === 'production' || group.id === 'production_metrics');
          
          return (
            <Tabs 
              activeKey={activeProcessTab} 
              onChange={setActiveProcessTab}
              type="card"
              className={`${styles.processTabs} ${styles.modernTabs}`}
              tabBarExtraContent={
                <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)', marginRight: 8 }}>
                  提示: 双击选项卡可设为默认
                      </div>
              }
            >
              <TabPane
                tab={
                  <span onDoubleClick={() => handleSetDefaultProcessTab("sensors")}>
                    <DashboardOutlined />
                    传感器数据
                  </span>
                }
                key="sensors"
              >
                {sensorGroups.length > 0 ? (
                  localRenderGroups(sensorGroups)
                ) : (
                  <Empty description="暂无传感器数据" />
                )}
              </TabPane>
              
              <TabPane
                tab={
                  <span onDoubleClick={() => handleSetDefaultProcessTab("energy")}>
                    <ThunderboltOutlined />
                    能耗数据
                  </span>
                }
                key="energy"
              >
                {energyGroups.length > 0 ? (
                  localRenderGroups(energyGroups)
                ) : (
                  <Empty description="暂无能耗数据" />
                )}
              </TabPane>
              
              <TabPane
                tab={
                  <span onDoubleClick={() => handleSetDefaultProcessTab("process")}>
                    <SettingOutlined />
                    工艺参数
                  </span>
                }
                key="process"
              >
                {processParamGroups.length > 0 ? (
                  localRenderGroups(processParamGroups)
                ) : (
                  <Empty description="暂无工艺参数数据" />
                )}
              </TabPane>
              
              <TabPane
                tab={
                  <span onDoubleClick={() => handleSetDefaultProcessTab("lab")}>
                    <ExperimentOutlined />
                    化验数据
                  </span>
                }
                key="lab"
              >
                {labGroups.length > 0 ? (
                  localRenderGroups(labGroups)
                ) : (
                  <Empty description="暂无化验数据" />
                )}
              </TabPane>
              
              <TabPane
                tab={
                  <span onDoubleClick={() => handleSetDefaultProcessTab("production")}>
                    <FundOutlined />
                    生产指标
                  </span>
                }
                key="production"
              >
                {productionGroups.length > 0 ? (
                  localRenderGroups(productionGroups)
                ) : (
                  <Empty description="暂无生产指标数据" />
                )}
              </TabPane>
            </Tabs>
          );
        })()}
      </Card>

      {/* 第四部分：设备信息区（由后端API推送，可通过WebSocket控制） */}
      <Card
        title={
          <div className={styles.sectionCardTitle}>
            <ApartmentOutlined className={styles.sectionCardIcon} />
            <span>设备信息</span>
            <Tag color="blue" className={styles.sectionCardTag}>API获取 + WebSocket控制</Tag>
          </div>
        }
        className={styles.sectionCard}
      >
        {/* 分类设备数据并渲染 */}
        {(() => {
          // 使用自动分类函数分类数据
          let allDataGroups = [];
          
          // 处理API返回的dataGroups数组
          if (Array.isArray(dataGroups.dataGroups) && dataGroups.dataGroups.length > 0) {
            allDataGroups = dataGroups.dataGroups;
          } 
          // 处理groups属性
          else if (dataGroups?.groups && dataGroups.groups.length > 0) {
            allDataGroups = dataGroups.groups;
          }
          // 处理dataArray属性
          else if (dataGroups?.isArray && dataGroups.dataArray && dataGroups.dataArray.length > 0) {
            allDataGroups = dataGroups.dataArray;
          }
          // 处理传统数据格式
          else if (dataGroups?.data && Array.isArray(dataGroups.data)) {
            allDataGroups = dataGroups.data;
          }
          // 处理legacyGroups
          else if (dataGroups?.legacyGroups && Array.isArray(dataGroups.legacyGroups)) {
            allDataGroups = dataGroups.legacyGroups;
          }
          
          // 分类数据
          const { deviceGroups } = localCategorizeDataGroups(allDataGroups);
          
          if (deviceGroups.length === 0) {
            return <Empty description="暂无设备数据" />;
          }
          
          // 进一步对设备数据进行细分
          const controlDevices = deviceGroups.filter(group => 
            group.type === 'device' || group.id === 'devices' || group.id === 'control_devices');
          
          const valveDevices = deviceGroups.filter(group => 
            group.type === 'valve' || group.id === 'isValve' || group.id === 'control_valves');
          
          const frequencyDevices = deviceGroups.filter(group => 
            group.type === 'frequency' || group.id === 'deviceFrequency' || group.id === 'freq_control');
          
          const runtimeInfo = deviceGroups.filter(group => 
            group.type === 'runtime' || group.id === 'equipments');
          
          const healthInfo = deviceGroups.filter(group => 
            group.type === 'health' || group.id === 'equipment_health');

            return (
            <Tabs 
              activeKey={activeDeviceTab}
              onChange={setActiveDeviceTab}
              type="card"
              size="large"
            >
              <TabPane
                tab={
                  <span onDoubleClick={() => handleSetDefaultDeviceTab("control")}>
                    <ApartmentOutlined />
                    设备控制
                  </span>
                }
                key="control"
              >
                {controlDevices.length > 0 ? (
                  localRenderGroups(controlDevices)
                ) : (
                  <Empty description="暂无设备控制数据" />
                )}
              </TabPane>
              
              <TabPane
                tab={
                  <span onDoubleClick={() => handleSetDefaultDeviceTab("valve")}>
                    <SettingOutlined />
                    阀门控制
                  </span>
                }
                key="valve"
              >
                {valveDevices.length > 0 ? (
                  localRenderGroups(valveDevices)
                ) : (
                  <Empty description="暂无阀门控制数据" />
                )}
              </TabPane>
              
              <TabPane
                tab={
                  <span onDoubleClick={() => handleSetDefaultDeviceTab("frequency")}>
                    <ThunderboltOutlined />
                    频率控制
                  </span>
                }
                key="frequency"
              >
                {frequencyDevices.length > 0 ? (
                  localRenderGroups(frequencyDevices)
                ) : (
                  <Empty description="暂无频率控制数据" />
                )}
              </TabPane>
              
              <TabPane
                tab={
                  <span onDoubleClick={() => handleSetDefaultDeviceTab("runtime")}>
                    <ClockCircleOutlined />
                    运行时间
                  </span>
                }
                key="runtime"
              >
                {runtimeInfo.length > 0 ? (
                  localRenderGroups(runtimeInfo)
                ) : (
                  <Empty description="暂无运行时间数据" />
                )}
              </TabPane>
              
              <TabPane
                tab={
                  <span onDoubleClick={() => handleSetDefaultDeviceTab("health")}>
                    <HeartOutlined />
                    设备健康
                  </span>
                }
                key="health"
              >
                {healthInfo.length > 0 ? (
                  localRenderGroups(healthInfo)
                ) : (
                  <Empty description="暂无设备健康数据" />
                )}
              </TabPane>
            </Tabs>
          );
        })()}
      </Card>

      {/* 第二部分：告警信息和历史趋势区（使用API调用） */}
      <Card
        title={
          <div className={styles.sectionCardTitle}>
            <AlertOutlined className={styles.sectionCardIcon} />
            <span>告警信息和历史趋势</span>
            <Tag color="green" className={styles.sectionCardTag}>API调用</Tag>
          </div>
        }
        className={styles.sectionCard}
      >
        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab}
          className={styles.modernTabs}
          tabBarExtraContent={
            <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)', marginRight: 8 }}>
              提示: 双击选项卡可设为默认
            </div>
          }
        >
          <TabPane
            tab={
              <span onDoubleClick={() => handleSetDefaultMainTab("alarms")}>
                <AlertOutlined />
                告警记录
              </span>
            }
            key="alarms"
          >
            {(() => {
              // 处理告警数据
              let allAlarms = [];
              
              // 检查API直接返回的告警
              if (dataGroups.alarms && dataGroups.alarms.length > 0) {
                allAlarms = dataGroups.alarms;
              }
              
              // 处理可能存在于数据组中的告警
              const { alarmGroups } = localCategorizeDataGroups(dataGroups.dataGroups || 
                  dataGroups.groups || dataGroups.dataArray || []);
              
              // 如果数据组中有告警，合并它们
              if (alarmGroups.length > 0) {
                // 将所有告警组的数据合并
                const alarmGroupsData = alarmGroups.flatMap(group => group.data || []);
                if (alarmGroupsData.length > 0) {
                  allAlarms = [...allAlarms, ...alarmGroupsData];
                }
              }
              
              if (allAlarms.length === 0) {
                return <Empty description="暂无告警记录" />;
              }
              
              // 对告警按照级别分类
              const highAlarms = allAlarms.filter(alarm => 
                alarm.level === 'high' || alarm.level === 'error');
              
              const mediumAlarms = allAlarms.filter(alarm => 
                alarm.level === 'medium' || alarm.level === 'warning');
              
              const lowAlarms = allAlarms.filter(alarm => 
                alarm.level === 'low' || alarm.level === 'info');
              
              const unknownAlarms = allAlarms.filter(alarm => 
                !alarm.level || (!['high', 'error', 'medium', 'warning', 'low', 'info'].includes(alarm.level)));
              
              // 渲染告警项
              const renderAlarmItem = (alarm, index) => (
                <Alert
                  key={index}
                  className={styles.alarmAlert}
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
                      {alarm.device && <div>设备: {alarm.device}</div>}
                      {alarm.location && <div>位置: {alarm.location}</div>}
                      {alarm.actions && <div>推荐操作: {alarm.actions}</div>}
                    </div>
                  }
                  type={
                    alarm.level === 'error' || alarm.level === 'high' ? 'error' :
                    alarm.level === 'medium' ? 'warning' :
                    alarm.level === 'low' ? 'info' :
                    'warning'
                  }
                  showIcon
                  style={{ marginBottom: 16 }}
                />
              );
              
              return (
                <Tabs defaultActiveKey="all" type="card" className={`${styles.alarmSubTabs} ${styles.modernTabs}`}>
                  <TabPane
                    tab={
                      <span>
                        <Badge count={allAlarms.length} offset={[10, 0]}>
                          全部告警
                        </Badge>
                      </span>
                    }
                    key="all"
                  >
                    {allAlarms.map(renderAlarmItem)}
          </TabPane>
          <TabPane
            tab={
              <span>
                        <Badge count={highAlarms.length} offset={[10, 0]} style={{ backgroundColor: '#ff4d4f' }}>
                          高级告警
                        </Badge>
                      </span>
                    }
                    key="high"
                  >
                    {highAlarms.length > 0 ? 
                      highAlarms.map(renderAlarmItem) : 
                      <Empty description="暂无高级告警" />
                    }
                  </TabPane>
                  <TabPane
                    tab={
                      <span>
                        <Badge count={mediumAlarms.length} offset={[10, 0]} style={{ backgroundColor: '#faad14' }}>
                          中级告警
                        </Badge>
                      </span>
                    }
                    key="medium"
                  >
                    {mediumAlarms.length > 0 ? 
                      mediumAlarms.map(renderAlarmItem) : 
                      <Empty description="暂无中级告警" />
                    }
                  </TabPane>
                  <TabPane
                    tab={
                      <span>
                        <Badge count={lowAlarms.length} offset={[10, 0]} style={{ backgroundColor: '#1890ff' }}>
                          低级告警
                        </Badge>
                      </span>
                    }
                    key="low"
                  >
                    {lowAlarms.length > 0 ? 
                      lowAlarms.map(renderAlarmItem) : 
                      <Empty description="暂无低级告警" />
                    }
                  </TabPane>
                </Tabs>
              );
            })()}
          </TabPane>
          <TabPane
            tab={
              <span onDoubleClick={() => handleSetDefaultMainTab("data")}>
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
                  inData={inData}
                  outData={outData}
                />
              ) : (
                <Empty description="请选择此选项卡查看数据趋势" />
              )}
            </div>
          </TabPane>
        </Tabs>
      </Card>

      {/* 频率设置模态框 */}
      <Modal
        title={`设置 ${selectedDevice?.name} 的频率`}
        visible={modalVisible}
        onCancel={() => setModalVisible(false)}
        className={styles.frequencyModal}
        footer={[
          <Button key="cancel" onClick={() => setModalVisible(false)}>
            取消
          </Button>,
          <Button
            key="submit"
            type="primary"
            onClick={() => {
              handleSetFrequency(selectedDevice, newFrequency);
              setModalVisible(false);
            }}
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