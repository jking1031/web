import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Card, Button, Spin, Empty, Tooltip, message } from 'antd';
import {
  LineChartOutlined,
  EditOutlined,
  ReloadOutlined,
  SettingOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined,
  DeleteOutlined,
  ColumnHeightOutlined
} from '@ant-design/icons';
import { Line, Area, Column } from '@ant-design/charts';
import { Resizable } from 'react-resizable';
import api from '../../api/interceptors';
import RealTimeTrendEditor from './RealTimeTrendEditor';
import styles from './RealTimeTrend.module.scss';
import 'react-resizable/css/styles.css';

/**
 * 实时趋势组件
 * 自动定时从数据库获取最新数据并展示趋势图
 * @param {Object} props - 组件属性
 * @param {string} props.title - 趋势图标题
 * @param {string} props.dbName - 数据库名称
 * @param {string} props.tableName - 表名
 * @param {string} props.dataField - 数据字段
 * @param {number} props.refreshInterval - 刷新间隔（毫秒）
 * @param {boolean} props.editable - 是否可编辑
 * @param {Function} props.onDelete - 删除回调
 * @param {string} props.id - 组件唯一ID
 * @returns {JSX.Element} 实时趋势组件
 */
const RealTimeTrend = ({
  title = '实时趋势',
  dbName = 'nodered',
  tableName = 'gt_data',
  dataField = 'flow_in',
  refreshInterval = 60000, // 默认1分钟刷新一次
  editable = true,
  onDelete,
  id
}) => {
  // 组件ID，用于本地存储
  // 使用固定的ID或组件位置信息生成唯一的存储键
  const generateUniqueKey = () => {
    // 如果有id，优先使用id
    if (id) return id;

    // 如果没有id，尝试从localStorage获取已保存的唯一ID
    const componentId = localStorage.getItem(`trend_component_id_${title}`);
    if (componentId) {
      console.log(`[趋势图] 使用已保存的组件ID: ${componentId}`);
      return componentId;
    }

    // 如果没有保存的ID，生成一个新的唯一ID
    // 使用标题和数据库/表名生成唯一键
    const titleKey = title ? title.replace(/\s+/g, '_').toLowerCase() : 'trend';
    const dbKey = dbName ? dbName.replace(/\s+/g, '_').toLowerCase() : '';
    const tableKey = tableName ? tableName.replace(/\s+/g, '_').toLowerCase() : '';
    const fieldKey = dataField ? dataField.replace(/\s+/g, '_').toLowerCase() : '';

    // 组合键，确保唯一性
    const newId = `${titleKey}_${dbKey}_${tableKey}_${fieldKey}`.replace(/__+/g, '_');

    // 保存到localStorage，确保下次使用相同的ID
    localStorage.setItem(`trend_component_id_${title}`, newId);
    console.log(`[趋势图] 生成并保存新的组件ID: ${newId}`);

    return newId;
  };

  // 生成唯一键并保存到ref，确保在组件生命周期内保持不变
  const uniqueKey = useMemo(() => generateUniqueKey(), [id, title]);
  const storageKey = `trend_data_${uniqueKey}`;
  const configStorageKey = `trend_config_${uniqueKey}`;

  console.log(`[趋势图] 使用存储键: ${uniqueKey} (数据: ${storageKey}, 配置: ${configStorageKey})`);

  // 尝试从本地存储加载初始配置
  let initialConfig = {
    title: title || '实时趋势',
    dbName,
    tableName,
    dataField,
    refreshInterval: refreshInterval || 60000, // 默认1分钟
    timeRange: 1, // 默认1天
    dataSaveTime: 7, // 默认7天
    unit: '',
    chartType: 'line', // 默认折线图
    queryName: '', // 查询命令名称
  };

  // 尝试从本地存储加载配置
  try {
    console.log(`[趋势图] 尝试从本地存储加载配置 (键: ${configStorageKey})`);
    const savedConfig = localStorage.getItem(configStorageKey);

    if (savedConfig) {
      console.log(`[趋势图] 找到本地存储配置，大小: ${savedConfig.length} 字节`);
      const parsedConfig = JSON.parse(savedConfig);

      // 验证配置完整性
      const requiredKeys = ['title', 'refreshInterval', 'timeRange', 'dataSaveTime', 'chartType'];
      const missingKeys = requiredKeys.filter(key => parsedConfig[key] === undefined);

      if (missingKeys.length > 0) {
        console.warn(`[趋势图] 加载的配置不完整，缺少字段: ${missingKeys.join(', ')}`);
      }

      console.log('[趋势图] 初始化时从本地存储加载配置:', {
        title: parsedConfig.title,
        queryName: parsedConfig.queryName,
        refreshInterval: parsedConfig.refreshInterval ? (parsedConfig.refreshInterval / 1000 + '秒') : '未设置',
        timeRange: parsedConfig.timeRange ? (parsedConfig.timeRange + '天') : '未设置',
        dataSaveTime: parsedConfig.dataSaveTime ? (parsedConfig.dataSaveTime + '天') : '未设置',
        chartType: parsedConfig.chartType || '未设置',
        unit: parsedConfig.unit || ''
      });

      // 合并默认配置和保存的配置
      initialConfig = {
        ...initialConfig,
        ...parsedConfig,
      };

      // 确保数值类型正确
      if (typeof initialConfig.refreshInterval === 'string') {
        initialConfig.refreshInterval = parseInt(initialConfig.refreshInterval, 10);
      }

      if (typeof initialConfig.timeRange === 'string') {
        initialConfig.timeRange = parseFloat(initialConfig.timeRange);
      }

      if (typeof initialConfig.dataSaveTime === 'string') {
        initialConfig.dataSaveTime = parseInt(initialConfig.dataSaveTime, 10);
      }

      console.log('[趋势图] 初始化配置:', {
        title: initialConfig.title,
        queryName: initialConfig.queryName,
        refreshInterval: initialConfig.refreshInterval / 1000 + '秒',
        timeRange: initialConfig.timeRange + '天',
        dataSaveTime: initialConfig.dataSaveTime + '天',
        chartType: initialConfig.chartType,
        unit: initialConfig.unit || ''
      });
    } else {
      console.log(`[趋势图] 本地存储中没有配置 (键: ${configStorageKey})，使用默认配置`);
    }
  } catch (error) {
    console.error('[趋势图] 初始化时加载配置失败:', error);
  }

  // 状态管理
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdateTime, setLastUpdateTime] = useState(null);
  const [editorVisible, setEditorVisible] = useState(false);
  const [config, setConfig] = useState(initialConfig);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // 调整大小相关状态
  const [chartHeight, setChartHeight] = useState(() => {
    // 尝试从localStorage加载保存的高度
    try {
      const savedHeight = localStorage.getItem(`trend_height_${uniqueKey}`);
      return savedHeight ? parseInt(savedHeight, 10) : 450; // 默认高度450px
    } catch (e) {
      return 450; // 默认高度
    }
  });
  const [isResizing, setIsResizing] = useState(false);

  // 引用
  const timerRef = useRef(null);
  const chartRef = useRef(null);
  const containerRef = useRef(null);

  // 从本地存储加载数据 - 只在组件挂载时执行一次
  useEffect(() => {
    // 获取查询命令列表
    const savedQueries = localStorage.getItem('dataQueries');
    let availableQueries = [];

    if (savedQueries) {
      try {
        availableQueries = JSON.parse(savedQueries);
        console.log(`[趋势图] 找到 ${availableQueries.length} 个可用的查询命令`);
      } catch (e) {
        console.error('[趋势图] 解析查询命令失败:', e);
      }
    }

    // 验证查询命令是否存在
    if (config.queryName && availableQueries.length > 0) {
      const queryExists = availableQueries.some(q =>
        q.enabled && q.name === config.queryName
      );

      if (!queryExists) {
        console.warn('[趋势图] 查询命令不存在或已禁用:', config.queryName);

        // 尝试选择一个可用的查询命令
        const enabledQueries = availableQueries.filter(q => q.enabled);
        if (enabledQueries.length > 0) {
          const newQueryName = enabledQueries[0].name;
          console.log(`[趋势图] 自动替换为可用查询命令: ${newQueryName}`);

          // 更新配置
          setConfig(prevConfig => ({
            ...prevConfig,
            queryName: newQueryName
          }));
        }
      }
    } else if (!config.queryName && availableQueries.length > 0) {
      // 如果没有查询命令但有可用的查询命令，自动选择第一个
      const enabledQueries = availableQueries.filter(q => q.enabled);
      if (enabledQueries.length > 0) {
        const newQueryName = enabledQueries[0].name;
        console.log(`[趋势图] 自动选择查询命令: ${newQueryName}`);

        // 更新配置
        setConfig(prevConfig => ({
          ...prevConfig,
          queryName: newQueryName
        }));
      }
    }

    // 2. 加载数据
    try {
      // 确保使用正确的存储键
      const currentStorageKey = `trend_data_${uniqueKey}`;
      console.log(`[趋势图] 尝试从本地存储加载数据 (键: ${currentStorageKey})`);
      const savedData = localStorage.getItem(currentStorageKey);

      if (savedData) {
        console.log(`[趋势图] 找到本地存储数据，大小: ${savedData.length} 字节`);
        const parsedData = JSON.parse(savedData);
        console.log(`[趋势图] 解析数据成功，原始数据: ${parsedData.length} 条`);

        // 验证数据格式
        if (!Array.isArray(parsedData)) {
          console.warn(`[趋势图] 加载的数据不是数组格式，跳过加载`);
          return;
        }

        // 转换时间字符串为Date对象
        const processedData = parsedData.map(item => {
          try {
            if (!item || typeof item !== 'object') {
              console.warn(`[趋势图] 无效的数据项: ${JSON.stringify(item)}，跳过`);
              return null;
            }

            // 确保时间是Date对象
            const timeObj = item.time instanceof Date ?
              item.time :
              new Date(item.time);

            // 验证时间对象是否有效
            if (isNaN(timeObj.getTime())) {
              console.warn(`[趋势图] 无效的时间格式: ${item.time}，使用当前时间代替`);
              return {
                ...item,
                time: new Date()
              };
            }

            // 验证值是否存在
            if (item.value === undefined || item.value === null) {
              console.warn(`[趋势图] 数据项缺少值: ${JSON.stringify(item)}，跳过`);
              return null;
            }

            return {
              ...item,
              time: timeObj,
              value: typeof item.value === 'string' ? parseFloat(item.value) : item.value
            };
          } catch (e) {
            console.warn(`[趋势图] 数据处理错误: ${e.message}，跳过该项`);
            return null;
          }
        }).filter(item => item !== null); // 过滤掉无效的数据项

        // 按时间排序
        processedData.sort((a, b) => a.time.getTime() - b.time.getTime());

        console.log(`[趋势图] 有效数据: ${processedData.length}/${parsedData.length} 条`);

        // 清理过期数据 - 使用当前配置的dataSaveTime
        const dataSaveTime = config.dataSaveTime || 7; // 默认7天
        const cleanedData = cleanExpiredData(processedData, dataSaveTime);
        console.log(`[趋势图] 清理过期数据: ${processedData.length} -> ${cleanedData.length} 条 (保存时长: ${dataSaveTime} 天)`);

        // 过滤数据，只显示时间范围内的数据
        const timeRangeDays = config.timeRange || 1; // 默认1天
        const now = new Date();
        const rangeStartTime = new Date(now.getTime() - timeRangeDays * 24 * 60 * 60 * 1000);
        console.log(`[趋势图] 过滤数据，时间范围: ${timeRangeDays} 天 (${rangeStartTime.toLocaleString()} 至今)`);

        const filteredData = cleanedData.filter(item => {
          const itemTime = item.time instanceof Date ? item.time : new Date(item.time);
          return itemTime >= rangeStartTime;
        });

        if (filteredData.length > 0) {
          // 设置数据状态
          setData(filteredData);
          setLastUpdateTime(new Date());
          console.log(`[趋势图] 加载历史数据: ${filteredData.length}/${cleanedData.length} 条 (时间范围: ${timeRangeDays} 天)`);

          // 输出数据范围信息
          if (filteredData.length > 0) {
            const oldestTime = new Date(Math.min(...filteredData.map(item => item.time.getTime())));
            const newestTime = new Date(Math.max(...filteredData.map(item => item.time.getTime())));
            console.log(`[趋势图] 数据时间范围: ${oldestTime.toLocaleString()} 至 ${newestTime.toLocaleString()}`);

            // 输出数据点间隔信息
            if (filteredData.length > 1) {
              const intervals = [];
              for (let i = 1; i < filteredData.length; i++) {
                intervals.push(filteredData[i].time.getTime() - filteredData[i-1].time.getTime());
              }
              const avgInterval = intervals.reduce((sum, val) => sum + val, 0) / intervals.length;
              console.log(`[趋势图] 数据点平均间隔: ${Math.round(avgInterval/1000)}秒`);
            }
          }

          // 保存数据到dataRef，确保组件卸载时能够正确保存数据
          dataRef.current = filteredData;

          // 保存清理后的数据，确保数据持久化
          saveDataToLocalStorage(cleanedData);
        } else if (cleanedData.length > 0) {
          // 如果过滤后没有数据，但清理后有数据，说明时间范围内没有数据
          console.log(`[趋势图] 时间范围 ${timeRangeDays} 天内没有数据，共有历史数据 ${cleanedData.length} 条`);

          // 保存清理后的数据到dataRef，确保组件卸载时能够正确保存数据
          dataRef.current = cleanedData;

          // 保存清理后的数据，确保数据持久化
          saveDataToLocalStorage(cleanedData);
        } else {
          console.log(`[趋势图] 没有可用的历史数据`);
        }
      } else {
        console.log(`[趋势图] 本地存储中没有数据 (键: ${currentStorageKey})`);
      }
    } catch (error) {
      console.error('[趋势图] 从本地存储加载数据失败:', error);
    }

    // 即使加载数据失败，也要继续执行

    // 打印当前配置，用于调试
    console.log('[趋势图] 组件挂载时的配置:', {
      title: config.title,
      queryName: config.queryName,
      refreshInterval: config.refreshInterval / 1000 + '秒',
      timeRange: config.timeRange + '天',
      dataSaveTime: config.dataSaveTime + '天',
      chartType: config.chartType,
      unit: config.unit
    });

    // 空依赖数组，确保只在组件挂载时执行一次
  }, []);

  // 获取数据 - 返回Promise以支持链式调用
  const fetchData = useCallback(async (showLoading = true) => {
    // 记录函数调用开始时间
    const startTime = new Date();

    if (showLoading) {
      setLoading(true);
    }
    setError(null);

    // 添加详细的日志
    console.log(`[趋势图] 开始获取数据: ${config.title} (${startTime.toLocaleTimeString()})`);

    try {
      // 计算时间范围 - 默认获取最近一周的数据
      const endDate = new Date();
      // 获取配置的时间范围，默认为7天（一周）
      const timeRangeInDays = config.timeRange || 7;
      const startDate = new Date(endDate.getTime() - timeRangeInDays * 24 * 60 * 60 * 1000);

      // 获取自定义查询命令
      const savedQueries = localStorage.getItem('dataQueries');
      let customQuery = null;

      if (savedQueries) {
        const queries = JSON.parse(savedQueries);
        // 查找匹配的查询命令
        customQuery = queries.find(q =>
          q.enabled &&
          q.name === config.queryName
        );
      }

      // 如果没有找到查询命令，显示错误但不抛出异常
      if (!customQuery) {
        console.error('找不到查询命令:', config.queryName);
        setError(`找不到查询命令: ${config.queryName || '未指定'}，请在系统设置中配置查询命令`);
        setLoading(false);
        return; // 直接返回，不继续执行
      }

      console.log('使用自定义查询命令:', customQuery.name);

      // 获取数据源配置
      const savedDataSources = localStorage.getItem('dataSources');
      let dataSource = null;

      if (savedDataSources) {
        const dataSources = JSON.parse(savedDataSources);
        dataSource = dataSources.find(ds => ds.id === customQuery.dataSourceId);
        console.log('找到数据源:', dataSource ? dataSource.name : '未找到', '数据源ID:', customQuery.dataSourceId);
      } else {
        console.log('本地存储中没有数据源配置');
      }

      if (!dataSource) {
        console.error('找不到数据源配置，ID:', customQuery.dataSourceId);
        console.log('可用数据源:', savedDataSources);
        throw new Error('找不到数据源配置');
      }

      // 打印数据源信息（不包含密码）
      console.log('使用数据源配置:', {
        id: dataSource.id,
        name: dataSource.name,
        type: dataSource.type,
        host: dataSource.host,
        port: dataSource.port,
        database: dataSource.database,
        username: dataSource.username
      });

      // 替换SQL中的参数
      let sql = customQuery.sql;

      // 替换时间参数
      const startDateStr = startDate.toISOString().slice(0, 19).replace('T', ' ');
      const endDateStr = endDate.toISOString().slice(0, 19).replace('T', ' ');

      sql = sql.replace(/\$\{startDate\}/g, `'${startDateStr}'`);
      sql = sql.replace(/\$\{endDate\}/g, `'${endDateStr}'`);
      sql = sql.replace(/\$\{startTimestamp\}/g, Math.floor(startDate.getTime() / 1000));
      sql = sql.replace(/\$\{endTimestamp\}/g, Math.floor(endDate.getTime() / 1000));

      // 构建请求参数
      const requestBody = {
        dataSource: {
          type: dataSource.type,
          host: dataSource.host,
          port: dataSource.port,
          database: dataSource.database,
          username: dataSource.username,
          password: dataSource.password
        },
        sql: sql,
        parameters: {}
      };

      console.log('查询参数:', JSON.stringify(requestBody, (key, value) =>
        key === 'password' ? '******' : value
      ));

      // 发送请求
      const response = await api.post('https://nodered.jzz77.cn:9003/custom-query', requestBody, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 15000
      });

      // 处理响应数据
      let responseData = [];

      if (response.data) {
        // 处理不同的响应格式
        if (Array.isArray(response.data)) {
          responseData = response.data;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          responseData = response.data.data;
        } else if (response.data.results && Array.isArray(response.data.results)) {
          responseData = response.data.results;
        }

        console.log(`获取到 ${responseData.length} 条数据`);

        if (responseData.length > 0) {
          // 检查第一条数据，确定时间字段名称
          const firstItem = responseData[0];
          const timeField = Object.keys(firstItem).find(key =>
            key.toLowerCase() === 'time' ||
            key.toLowerCase() === 'timestamp' ||
            key.toLowerCase() === 'datetime' ||
            key.toLowerCase() === 'date'
          ) || 'time';

          // 确定值字段名称 - 对于自定义查询，尝试找到合适的值字段
          let valueField = config.dataField;

          // 如果没有指定字段，或者指定的字段不存在，尝试找到第一个数值字段
          if (!valueField || !(valueField in firstItem)) {
            valueField = Object.keys(firstItem).find(key => {
              const value = firstItem[key];
              return (
                key !== timeField &&
                (typeof value === 'number' || !isNaN(parseFloat(value)))
              );
            });
          }

          console.log(`使用时间字段: ${timeField}, 值字段: ${valueField}`);

          // 处理数据
          const processedData = responseData.map(item => {
            // 确保时间格式正确
            let time;
            try {
              time = new Date(item[timeField]);
              if (isNaN(time.getTime())) {
                // 尝试不同的时间格式
                if (typeof item[timeField] === 'string') {
                  // 尝试替换 'T' 为空格
                  time = new Date(item[timeField].replace('T', ' '));
                }

                // 如果仍然无效，使用当前时间
                if (isNaN(time.getTime())) {
                  time = new Date();
                }
              }
            } catch (e) {
              time = new Date();
            }

            // 获取数据字段的值
            let value = item[valueField];

            // 确保值是数字
            if (typeof value !== 'number') {
              value = parseFloat(value);
              if (isNaN(value)) {
                value = 0;
              }
            }

            return {
              time,
              value,
              category: config.title || '实时趋势',
              raw: item // 保存原始数据，以便调试
            };
          });

          // 按时间排序
          processedData.sort((a, b) => a.time - b.time);

          // 合并新数据和现有数据
          const mergedData = [...data, ...processedData];

          // 记录合并前后的数据量
          console.log(`[趋势图] 合并数据: ${data.length} + ${processedData.length} = ${mergedData.length} 条`);

          // 按时间排序并去重
          const uniqueData = mergedData.reduce((acc, current) => {
            const x = acc.find(item => item.time.getTime() === current.time.getTime());
            if (!x) {
              return acc.concat([current]);
            } else {
              // 如果找到相同时间的数据，保留最新的值
              return acc.map(item =>
                item.time.getTime() === current.time.getTime() ? current : item
              );
            }
          }, []);

          console.log(`[趋势图] 去重后数据: ${uniqueData.length} 条`);

          // 清理过期数据
          const cleanedData = cleanExpiredData(uniqueData, config.dataSaveTime);

          // 过滤数据，只显示时间范围内的数据
          const timeRangeDays = config.timeRange || 1; // 默认1天
          const now = new Date();
          const rangeStartTime = new Date(now.getTime() - timeRangeDays * 24 * 60 * 60 * 1000);

          const filteredData = cleanedData.filter(item => {
            const itemTime = item.time instanceof Date ? item.time : new Date(item.time);
            return itemTime >= rangeStartTime;
          });

          // 更新状态
          setData(filteredData);
          setLastUpdateTime(new Date());

          // 保存数据到dataRef，确保组件卸载时能够正确保存数据
          dataRef.current = filteredData;

          // 输出数据统计信息
          console.log(`[趋势图] 获取数据: ${filteredData.length}/${cleanedData.length} 条 (时间范围: ${timeRangeDays} 天)`);

          // 输出数据范围信息
          if (filteredData.length > 0) {
            const oldestTime = new Date(Math.min(...filteredData.map(item => item.time.getTime())));
            const newestTime = new Date(Math.max(...filteredData.map(item => item.time.getTime())));
            console.log(`[趋势图] 数据时间范围: ${oldestTime.toLocaleString()} 至 ${newestTime.toLocaleString()}`);

            // 计算数据点间隔
            if (filteredData.length > 1) {
              const sortedData = [...filteredData].sort((a, b) => a.time - b.time);
              const intervals = [];
              for (let i = 1; i < sortedData.length; i++) {
                intervals.push(sortedData[i].time - sortedData[i-1].time);
              }
              const avgInterval = intervals.reduce((sum, val) => sum + val, 0) / intervals.length;
              const minInterval = Math.min(...intervals);
              const maxInterval = Math.max(...intervals);
              console.log(`[趋势图] 数据点间隔: 平均 ${Math.round(avgInterval/1000)}秒, 最小 ${Math.round(minInterval/1000)}秒, 最大 ${Math.round(maxInterval/1000)}秒`);
            }
          }

          // 保存到本地存储
          console.log(`[趋势图] 开始保存数据到本地存储: ${cleanedData.length} 条`);
          const saveStartTime = new Date();
          saveDataToLocalStorage(cleanedData);
          const saveEndTime = new Date();
          console.log(`[趋势图] 数据保存完成: 耗时 ${saveEndTime - saveStartTime}ms`);
        } else {
          console.warn('API返回的数据为空');
          setError('查询结果为空');
        }
      } else {
        console.warn('API返回的数据格式不正确:', response.data);
        setError('数据格式不正确');
      }
    } catch (err) {
      console.error('获取数据失败:', err);
      setError(err.message || '获取数据失败');
    } finally {
      if (showLoading) {
        setLoading(false);
      }

      // 计算函数执行耗时
      const endTime = new Date();
      const duration = endTime - startTime;
      console.log(`[趋势图] 数据获取处理完成: ${config.title} (耗时: ${duration}ms)`);
    }

    // 返回Promise以支持链式调用
    return Promise.resolve();
  }, [config]);

  // 初始化和配置更改时获取数据
  useEffect(() => {
    // 清除之前的定时器
    if (timerRef.current) {
      clearInterval(timerRef.current);
      console.log('[趋势图] 清除之前的定时器');
    }

    // 立即获取数据
    fetchData();

    // 记录定时器启动时间
    const timerStartTime = new Date();
    console.log(`[趋势图] 启动定时器: ${config.title} (间隔 ${config.refreshInterval / 1000} 秒)`);

    // 设置定时刷新
    timerRef.current = setInterval(() => {
      const now = new Date();
      const elapsedSeconds = Math.round((now - timerStartTime) / 1000);
      const elapsedMinutes = Math.floor(elapsedSeconds / 60);
      const remainingSeconds = elapsedSeconds % 60;
      const formattedTime = elapsedMinutes > 0
        ? `${elapsedMinutes}分${remainingSeconds}秒`
        : `${elapsedSeconds}秒`;

      // 添加更详细的定时器信息
      console.log(`[趋势图] 定时刷新: ${config.title} (已运行 ${formattedTime}, 间隔 ${config.refreshInterval / 1000}秒)`);

      // 记录刷新开始时间，用于计算性能
      const fetchStartTime = new Date();
      console.log(`[趋势图] 开始获取数据: ${fetchStartTime.toLocaleTimeString()}`);

      // 后台刷新，不显示加载状态
      fetchData(false).then(() => {
        // 计算数据获取耗时
        const fetchEndTime = new Date();
        const fetchDuration = fetchEndTime - fetchStartTime;
        console.log(`[趋势图] 数据获取完成: 耗时 ${fetchDuration}ms`);
      }).catch(err => {
        console.error(`[趋势图] 定时获取数据失败:`, err);
      });
    }, config.refreshInterval);

    // 组件卸载或配置变化时清理定时器
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
        console.log(`[趋势图] 停止定时器: ${config.title}`);
      }
    };
  }, [fetchData, config.refreshInterval, config.title]);

  // 组件卸载时保存数据和配置 - 使用ref捕获最新值，避免依赖
  const dataRef = useRef(data);
  const configRef = useRef(config);
  const uniqueKeyRef = useRef(uniqueKey);

  // 更新ref值
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  useEffect(() => {
    configRef.current = config;
  }, [config]);

  useEffect(() => {
    uniqueKeyRef.current = uniqueKey;
  }, [uniqueKey]);

  // 组件卸载时的清理函数
  useEffect(() => {
    return () => {
      console.log('[趋势图] 组件卸载，保存数据和配置');
      console.log('[趋势图] 当前配置状态:', {
        title: configRef.current.title,
        queryName: configRef.current.queryName,
        refreshInterval: configRef.current.refreshInterval / 1000 + '秒',
        timeRange: configRef.current.timeRange + '天',
        dataSaveTime: configRef.current.dataSaveTime + '天'
      });

      // 尝试从localStorage获取最新数据
      try {
        const savedData = localStorage.getItem(`trend_data_${uniqueKeyRef.current}`);
        if (savedData) {
          const parsedData = JSON.parse(savedData);
          console.log(`[趋势图] 卸载时从localStorage获取数据: ${parsedData.length} 条`);

          // 如果localStorage中的数据比内存中的多，使用localStorage中的数据
          if (parsedData.length > dataRef.current.length) {
            console.log(`[趋势图] 使用localStorage中的数据 (${parsedData.length} 条) 代替内存中的数据 (${dataRef.current.length} 条)`);
            dataRef.current = parsedData.map(item => ({
              ...item,
              time: new Date(item.time)
            }));
          }
        }
      } catch (e) {
        console.warn(`[趋势图] 卸载时获取localStorage数据失败: ${e.message}`);
      }

      console.log(`[趋势图] 当前数据状态: ${dataRef.current.length} 条数据`);
      console.log(`[趋势图] 使用存储键: ${uniqueKeyRef.current} (数据: trend_data_${uniqueKeyRef.current}, 配置: trend_config_${uniqueKeyRef.current})`);

      // 组件卸载时保存数据
      if (dataRef.current.length > 0) {
        // 直接使用localStorage保存，避免可能的异步问题
        try {
          // 确保数据中的时间是字符串格式
          const serializedData = dataRef.current.map(item => ({
            ...item,
            time: item.time instanceof Date ? item.time.toISOString() : item.time
          }));

          // 尝试加载已有数据并合并
          let existingData = [];
          try {
            const savedData = localStorage.getItem(`trend_data_${uniqueKeyRef.current}`);
            if (savedData) {
              const parsedData = JSON.parse(savedData);
              console.log(`[趋势图] 卸载时找到已有数据: ${parsedData.length} 条`);
              existingData = parsedData;
            }
          } catch (e) {
            console.warn(`[趋势图] 卸载时加载已有数据失败: ${e.message}`);
          }

          // 合并数据并去重
          const mergedData = [...existingData, ...serializedData];
          console.log(`[趋势图] 卸载时合并数据: ${existingData.length} + ${serializedData.length} = ${mergedData.length} 条`);

          // 按时间排序并去重
          const uniqueData = [];
          const timeMap = new Map();

          // 首先按时间排序
          mergedData.sort((a, b) => {
            const timeA = new Date(a.time).getTime();
            const timeB = new Date(b.time).getTime();
            return timeA - timeB;
          });

          // 然后去重，保留最新的数据
          for (const item of mergedData) {
            const timeKey = new Date(item.time).getTime().toString();
            timeMap.set(timeKey, item);
          }

          // 转换回数组
          for (const item of timeMap.values()) {
            uniqueData.push(item);
          }

          console.log(`[趋势图] 卸载时去重后数据: ${uniqueData.length} 条`);

          // 限制数据量，避免本地存储过大
          const maxDataPoints = 1000; // 最大数据点数量
          let dataToSave = uniqueData;

          if (uniqueData.length > maxDataPoints) {
            // 如果数据点过多，保留最新的数据
            dataToSave = uniqueData.slice(uniqueData.length - maxDataPoints);
            console.log(`[趋势图] 卸载时数据点过多，截取最新的 ${maxDataPoints} 条数据`);
          }

          const dataString = JSON.stringify(dataToSave);
          localStorage.setItem(`trend_data_${uniqueKeyRef.current}`, dataString);
          console.log(`[趋势图] 卸载时直接保存数据: ${dataToSave.length} 条，${dataString.length} 字节`);
        } catch (error) {
          console.error('[趋势图] 卸载时保存数据失败:', error);

          // 尝试保存更少的数据
          if (dataRef.current.length > 100) {
            try {
              const reducedData = dataRef.current.slice(dataRef.current.length - 100).map(item => ({
                ...item,
                time: item.time instanceof Date ? item.time.toISOString() : item.time
              }));
              const reducedDataString = JSON.stringify(reducedData);
              localStorage.setItem(`trend_data_${uniqueKeyRef.current}`, reducedDataString);
              console.log(`[趋势图] 卸载时保存减少后的数据: ${reducedData.length} 条`);
            } catch (retryError) {
              console.error('[趋势图] 卸载时即使减少数据量后仍然无法保存:', retryError);
            }
          }
        }
      }

      // 特殊处理：确保配置中包含查询命令
      const configToSave = { ...configRef.current };

      // 如果配置中没有查询命令，尝试从当前状态获取
      if (!configToSave.queryName && config && config.queryName) {
        console.log(`[趋势图] 卸载时恢复查询命令: ${config.queryName}`);
        configToSave.queryName = config.queryName;
      }

      // 直接保存配置，避免可能的异步问题
      try {
        const configString = JSON.stringify(configToSave);
        localStorage.setItem(`trend_config_${uniqueKeyRef.current}`, configString);
        console.log(`[趋势图] 卸载时直接保存配置: ${configString.length} 字节`);
      } catch (error) {
        console.error('[趋势图] 卸载时保存配置失败:', error);
      }
    };
  }, [config, uniqueKey]);

  // 调试用：监控配置变化
  useEffect(() => {
    console.log('[趋势图] 配置已更新:', {
      title: config.title,
      queryName: config.queryName,
      refreshInterval: config.refreshInterval / 1000 + '秒',
      timeRange: config.timeRange + '天',
      dataSaveTime: config.dataSaveTime + '天',
      chartType: config.chartType,
      unit: config.unit
    });
  }, [config]);

  // 当数据保存时长或时间范围配置变化时，清理和过滤数据
  useEffect(() => {
    if (data.length > 0) {
      // 清理过期数据
      const cleanedData = cleanExpiredData(data, config.dataSaveTime);

      // 过滤数据，只显示时间范围内的数据
      const timeRangeDays = config.timeRange || 1; // 默认1天
      const now = new Date();
      const rangeStartTime = new Date(now.getTime() - timeRangeDays * 24 * 60 * 60 * 1000);

      const filteredData = cleanedData.filter(item => {
        const itemTime = item.time instanceof Date ? item.time : new Date(item.time);
        return itemTime >= rangeStartTime;
      });

      // 只有当数据真正变化时才更新状态
      if (filteredData.length !== data.length) {
        console.log(`[趋势图] 配置变化，更新数据: ${filteredData.length}/${cleanedData.length} 条 (时间范围: ${timeRangeDays} 天)`);
        setData(filteredData);
        // 只保存清理后的数据，不保存过滤后的数据
        saveDataToLocalStorage(cleanedData);
      }
    }
  }, [config.dataSaveTime, config.timeRange, data]);

  // 单独处理配置保存，使用ref避免循环依赖
  const prevConfigRef = useRef();
  useEffect(() => {
    // 只有当配置真正变化时才保存
    if (prevConfigRef.current &&
        JSON.stringify(prevConfigRef.current) !== JSON.stringify(config)) {
      saveConfigToLocalStorage(config);
    }
    prevConfigRef.current = config;
  }, [config]);

  // 处理编辑
  const handleEdit = () => {
    setEditorVisible(true);
  };

  // 处理配置更新
  const handleConfigUpdate = (newConfig) => {
    // 打印接收到的新配置，用于调试
    console.log('[趋势图] 接收到新配置:', newConfig);

    // 直接使用新配置，不再合并原有配置
    const updatedConfig = { ...newConfig };

    // 确保必要字段存在
    if (!updatedConfig.title) {
      updatedConfig.title = '实时趋势';
    }

    // 确保数值类型正确
    if (typeof updatedConfig.refreshInterval === 'string') {
      updatedConfig.refreshInterval = parseInt(updatedConfig.refreshInterval, 10);
    } else if (updatedConfig.refreshInterval === undefined) {
      updatedConfig.refreshInterval = 60000; // 默认1分钟
    }

    if (typeof updatedConfig.timeRange === 'string') {
      updatedConfig.timeRange = parseFloat(updatedConfig.timeRange);
    } else if (updatedConfig.timeRange === undefined) {
      updatedConfig.timeRange = 1; // 默认1天
    }

    if (typeof updatedConfig.dataSaveTime === 'string') {
      updatedConfig.dataSaveTime = parseInt(updatedConfig.dataSaveTime, 10);
    } else if (updatedConfig.dataSaveTime === undefined) {
      updatedConfig.dataSaveTime = 7; // 默认7天
    }

    // 特别检查查询命令字段
    if (!updatedConfig.queryName) {
      console.warn('[趋势图] 更新配置时查询命令为空');
      // 如果新配置中没有查询命令，尝试保留原有的查询命令
      if (config && config.queryName) {
        updatedConfig.queryName = config.queryName;
      }
    }

    // 确保图表类型字段存在
    if (!updatedConfig.chartType) {
      updatedConfig.chartType = 'line';
    }

    // 确保单位字段存在
    if (updatedConfig.unit === undefined) {
      updatedConfig.unit = '';
    }

    // 只输出关键信息
    console.log('[趋势图] 配置已更新:', {
      title: updatedConfig.title,
      queryName: updatedConfig.queryName,
      refreshInterval: updatedConfig.refreshInterval / 1000 + '秒',
      timeRange: updatedConfig.timeRange + '天',
      dataSaveTime: updatedConfig.dataSaveTime + '天',
      chartType: updatedConfig.chartType,
      unit: updatedConfig.unit
    });

    // 更新状态
    setConfig(updatedConfig);
    setEditorVisible(false);

    // 保存配置到本地存储
    saveConfigToLocalStorage(updatedConfig);

    // 重置定时器
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    // 立即获取新数据
    fetchData();

    message.success('配置已更新并保存');
  };

  // 处理全屏切换
  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      } else if (containerRef.current.webkitRequestFullscreen) {
        containerRef.current.webkitRequestFullscreen();
      } else if (containerRef.current.msRequestFullscreen) {
        containerRef.current.msRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
    }
  };

  // 处理调整大小开始
  const handleResizeStart = () => {
    setIsResizing(true);
  };

  // 处理调整大小
  const handleResize = (event, { size }) => {
    setChartHeight(size.height);
  };

  // 处理调整大小结束
  const handleResizeStop = () => {
    setIsResizing(false);
    // 保存高度到localStorage
    try {
      localStorage.setItem(`trend_height_${uniqueKey}`, chartHeight.toString());
      console.log(`[趋势图] 保存图表高度: ${chartHeight}px (键: trend_height_${uniqueKey})`);
    } catch (e) {
      console.error('[趋势图] 保存图表高度失败:', e);
    }
  };

  // 监听全屏状态变化
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  // 清理过期数据
  const cleanExpiredData = (dataArray, saveTimeDays) => {
    if (!dataArray || dataArray.length === 0) return [];

    // 计算过期时间点
    const now = new Date();
    const expireTime = new Date(now.getTime() - saveTimeDays * 24 * 60 * 60 * 1000);

    // 过滤掉过期数据
    return dataArray.filter(item => {
      const itemTime = item.time instanceof Date ? item.time : new Date(item.time);
      return itemTime > expireTime;
    });
  };

  // 保存数据到本地存储
  const saveDataToLocalStorage = (dataArray) => {
    try {
      // 记录开始时间
      const startTime = new Date();
      console.log(`[趋势图] 开始处理数据存储: ${dataArray.length} 条数据 (${config.title})`);

      // 清理过期数据
      const cleanStartTime = new Date();
      const cleanedData = cleanExpiredData(dataArray, config.dataSaveTime);
      const cleanEndTime = new Date();
      const cleanDuration = cleanEndTime - cleanStartTime;

      console.log(`[趋势图] 清理过期数据: ${dataArray.length} -> ${cleanedData.length} 条 (耗时: ${cleanDuration}ms, 保存时长: ${config.dataSaveTime}天)`);

      // 限制数据量，避免本地存储过大
      const maxDataPoints = 1000; // 最大数据点数量
      let dataToSave = cleanedData;

      if (cleanedData.length > maxDataPoints) {
        // 如果数据点过多，保留最新的数据
        dataToSave = cleanedData.slice(cleanedData.length - maxDataPoints);
        console.log(`[趋势图] 数据点过多，截取最新的 ${maxDataPoints} 条数据`);
      }

      // 确保数据中的时间是字符串格式，避免JSON序列化问题
      const serializedData = dataToSave.map(item => ({
        ...item,
        time: item.time instanceof Date ? item.time.toISOString() : item.time
      }));

      // 尝试加载已有数据并合并
      let existingData = [];
      try {
        // 确保使用正确的存储键
        const currentStorageKey = `trend_data_${uniqueKeyRef.current}`;
        const savedData = localStorage.getItem(currentStorageKey);
        if (savedData) {
          const parsedData = JSON.parse(savedData);
          console.log(`[趋势图] 找到已有数据: ${parsedData.length} 条 (键: ${currentStorageKey})`);
          existingData = parsedData;

          // 更新dataRef，确保组件卸载时能够正确保存数据
          dataRef.current = parsedData.map(item => ({
            ...item,
            time: new Date(item.time)
          }));
        }
      } catch (e) {
        console.warn(`[趋势图] 加载已有数据失败: ${e.message}`);
      }

      // 合并数据并去重
      const mergedData = [...existingData, ...serializedData];
      console.log(`[趋势图] 合并后数据: ${existingData.length} + ${serializedData.length} = ${mergedData.length} 条`);

      // 按时间排序并去重
      const uniqueData = [];
      const timeMap = new Map();

      // 首先按时间排序
      mergedData.sort((a, b) => {
        const timeA = new Date(a.time).getTime();
        const timeB = new Date(b.time).getTime();
        return timeA - timeB;
      });

      // 然后去重，保留最新的数据
      for (const item of mergedData) {
        const timeKey = new Date(item.time).getTime().toString();
        timeMap.set(timeKey, item);
      }

      // 转换回数组
      for (const item of timeMap.values()) {
        uniqueData.push(item);
      }

      console.log(`[趋势图] 去重后数据: ${uniqueData.length} 条`);

      // 计算数据大小
      const dataString = JSON.stringify(uniqueData);
      const dataSizeKB = (dataString.length / 1024).toFixed(2);
      console.log(`[趋势图] 准备保存数据: ${uniqueData.length} 条，大小: ${dataSizeKB} KB`);

      // 保存到本地存储
      const saveStartTime = new Date();

      // 确保使用正确的存储键
      const currentStorageKey = `trend_data_${uniqueKeyRef.current}`;
      console.log(`[趋势图] 使用存储键保存数据: ${currentStorageKey}`);

      try {
        localStorage.setItem(currentStorageKey, dataString);
        const saveEndTime = new Date();
        const saveDuration = saveEndTime - saveStartTime;

        console.log(`[趋势图] 保存了 ${uniqueData.length} 条数据到本地存储 (键: ${currentStorageKey}, 耗时: ${saveDuration}ms)`);
      } catch (storageError) {
        // 如果存储失败，可能是因为超出了localStorage的大小限制
        console.error(`[趋势图] 保存数据到本地存储失败，可能超出大小限制: ${storageError.message}`);

        // 尝试保存更少的数据
        if (serializedData.length > 100) {
          const reducedData = serializedData.slice(serializedData.length - 100);
          const reducedDataString = JSON.stringify(reducedData);

          try {
            localStorage.setItem(currentStorageKey, reducedDataString);
            console.log(`[趋势图] 尝试保存减少后的数据: ${reducedData.length} 条，大小: ${(reducedDataString.length / 1024).toFixed(2)} KB`);
          } catch (retryError) {
            console.error(`[趋势图] 即使减少数据量后仍然无法保存: ${retryError.message}`);
          }
        }
      }

      // 验证保存是否成功
      const verifyStartTime = new Date();
      const savedData = localStorage.getItem(currentStorageKey);
      if (savedData) {
        try {
          const parsedData = JSON.parse(savedData);
          console.log(`[趋势图] 验证数据保存成功: ${parsedData.length} 条`);

          // 输出数据范围信息
          if (parsedData.length > 0) {
            try {
              const times = parsedData.map(item => new Date(item.time).getTime());
              const oldestTime = new Date(Math.min(...times));
              const newestTime = new Date(Math.max(...times));
              console.log(`[趋势图] 已保存数据时间范围: ${oldestTime.toLocaleString()} 至 ${newestTime.toLocaleString()}`);

              // 更新dataRef，确保组件卸载时能够正确保存数据
              dataRef.current = parsedData.map(item => ({
                ...item,
                time: new Date(item.time)
              }));
            } catch (e) {
              console.warn('[趋势图] 无法计算保存数据的时间范围:', e);
            }
          }
        } catch (parseError) {
          console.error(`[趋势图] 验证数据时解析失败: ${parseError.message}`);
        }
      } else {
        console.warn(`[趋势图] 数据保存失败: 无法读取保存的数据 (键: ${currentStorageKey})`);
      }
      const verifyEndTime = new Date();
      const verifyDuration = verifyEndTime - verifyStartTime;

      // 计算总耗时
      const totalDuration = verifyEndTime - startTime;
      console.log(`[趋势图] 数据存储过程完成: 总耗时 ${totalDuration}ms (清理: ${cleanDuration}ms, 验证: ${verifyDuration}ms)`);
    } catch (error) {
      console.error('[趋势图] 保存数据到本地存储失败:', error);
    }
  };

  // 保存配置到本地存储
  const saveConfigToLocalStorage = (configObj) => {
    try {
      // 打印原始配置对象，用于调试
      console.log('[趋势图] 准备保存的原始配置:', configObj);

      // 确保配置对象包含所有必要字段
      const configToSave = {
        ...configObj,
        title: configObj.title || '实时趋势', // 确保标题字段存在
      };

      // 确保数值类型正确
      if (typeof configToSave.refreshInterval === 'string') {
        configToSave.refreshInterval = parseInt(configToSave.refreshInterval, 10);
      } else if (configToSave.refreshInterval === undefined) {
        configToSave.refreshInterval = 60000; // 默认1分钟
      }

      if (typeof configToSave.timeRange === 'string') {
        configToSave.timeRange = parseFloat(configToSave.timeRange);
      } else if (configToSave.timeRange === undefined) {
        configToSave.timeRange = 1; // 默认1天
      }

      if (typeof configToSave.dataSaveTime === 'string') {
        configToSave.dataSaveTime = parseInt(configToSave.dataSaveTime, 10);
      } else if (configToSave.dataSaveTime === undefined) {
        configToSave.dataSaveTime = 7; // 默认7天
      }

      // 确保图表类型字段存在
      if (!configToSave.chartType) {
        configToSave.chartType = 'line';
      }

      // 确保单位字段存在
      if (configToSave.unit === undefined) {
        configToSave.unit = '';
      }

      // 特殊处理：确保查询命令字段存在且不为空
      if (!configToSave.queryName) {
        console.warn('[趋势图] 查询命令为空，尝试恢复');

        // 尝试从当前状态获取查询命令
        if (config && config.queryName) {
          configToSave.queryName = config.queryName;
        } else {
          // 尝试从本地存储获取查询命令
          try {
            // 确保使用正确的存储键
            const currentConfigStorageKey = `trend_config_${uniqueKeyRef.current}`;
            const savedConfig = localStorage.getItem(currentConfigStorageKey);
            if (savedConfig) {
              const parsedConfig = JSON.parse(savedConfig);
              if (parsedConfig.queryName) {
                configToSave.queryName = parsedConfig.queryName;
                console.log(`[趋势图] 从本地存储恢复查询命令: ${parsedConfig.queryName}`);
              }
            }
          } catch (e) {
            console.error('[趋势图] 恢复查询命令失败:', e);
          }
        }
      }

      // 保存到本地存储 - 确保保存完整的配置对象
      const configString = JSON.stringify(configToSave);

      // 确保使用正确的存储键
      const currentConfigStorageKey = `trend_config_${uniqueKeyRef.current}`;
      localStorage.setItem(currentConfigStorageKey, configString);

      // 只输出关键信息
      console.log(`[趋势图] 配置已保存 (键: ${currentConfigStorageKey}):`, {
        title: configToSave.title,
        queryName: configToSave.queryName,
        refreshInterval: configToSave.refreshInterval / 1000 + '秒',
        timeRange: configToSave.timeRange + '天',
        dataSaveTime: configToSave.dataSaveTime + '天',
        chartType: configToSave.chartType,
        unit: configToSave.unit
      });

      // 验证保存是否成功
      const savedConfig = localStorage.getItem(currentConfigStorageKey);
      if (savedConfig) {
        const parsedConfig = JSON.parse(savedConfig);
        // 验证关键字段是否保存成功
        const keysToCheck = ['title', 'queryName', 'refreshInterval', 'timeRange', 'dataSaveTime', 'chartType', 'unit'];
        const missingKeys = keysToCheck.filter(key => parsedConfig[key] === undefined);

        if (missingKeys.length > 0) {
          console.warn(`[趋势图] 配置保存不完整，缺少字段: ${missingKeys.join(', ')}`);
        } else {
          console.log('[趋势图] 验证配置保存成功:', {
            title: parsedConfig.title,
            queryName: parsedConfig.queryName,
            refreshInterval: parsedConfig.refreshInterval / 1000 + '秒',
            timeRange: parsedConfig.timeRange + '天',
            dataSaveTime: parsedConfig.dataSaveTime + '天',
            chartType: parsedConfig.chartType,
            unit: parsedConfig.unit
          });

          // 更新configRef，确保组件卸载时能够正确保存配置
          configRef.current = parsedConfig;
        }
      } else {
        console.warn(`[趋势图] 配置保存失败: 无法读取保存的配置 (键: ${currentConfigStorageKey})`);
      }
    } catch (error) {
      console.error('[趋势图] 保存配置失败:', error);
    }
  };

  // 计算数据的最小值和最大值，用于自动设置Y轴范围
  const calculateDataRange = () => {
    if (!data || data.length === 0) return { min: 0, max: 100 };

    // 获取所有数值
    const values = data.map(item => item.value);

    // 计算最小值和最大值
    let min = Math.min(...values);
    let max = Math.max(...values);

    // 为了更好的视觉效果，稍微扩大范围
    const range = max - min;
    min = Math.max(0, min - range * 0.1); // 最小值不小于0
    max = max + range * 0.1;

    // 如果最小值和最大值相等，设置一个默认范围
    if (min === max) {
      min = Math.max(0, min - 10);
      max = max + 10;
    }

    return { min, max };
  };

  // 获取数据范围
  const dataRange = calculateDataRange();

  // 移除未使用的选项变量，这些选项已移至编辑弹窗

  // 图表类型直接从config中获取，不再需要单独的状态

  // 图表配置 - ThingsBoard风格
  const chartConfig = {
    data,
    xField: 'time',
    yField: 'value',
    seriesField: 'category',

    // 自动设置Y轴范围
    yAxis: {
      min: dataRange.min,
      max: dataRange.max,
      label: {
        formatter: (v) => `${parseFloat(v).toFixed(2)}`,
        style: {
          fontSize: 12,
          opacity: 0.8,
        },
      },
      grid: {
        line: {
          style: {
            stroke: '#e0e0e0',
            lineWidth: 1,
            lineDash: [4, 4],
            strokeOpacity: 0.7,
          },
        },
      },
      title: {
        text: config.unit || '',
        style: {
          fontSize: 12,
          opacity: 0.8,
        },
      },
    },

    // X轴配置 - 显示日期和时间 (ThingsBoard风格)
    xAxis: {
      type: 'time',
      tickCount: 8,
      label: {
        formatter: (v) => {
          const date = new Date(v);
          return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
        },
        style: {
          fontSize: 12,
          opacity: 0.8,
        },
      },
      grid: {
        line: {
          style: {
            stroke: '#e0e0e0',
            lineWidth: 1,
            lineDash: [4, 4],
            strokeOpacity: 0.7,
          },
        },
      },
    },

    // 平滑曲线
    smooth: true,

    // 动画效果
    animation: {
      appear: {
        animation: 'path-in',
        duration: 800,
      },
    },

    // 提示框配置 (ThingsBoard风格)
    tooltip: {
      showCrosshairs: true,
      shared: true,
      crosshairs: {
        line: {
          style: {
            stroke: '#565656',
            lineDash: [4, 4],
          },
        },
      },
      formatter: (datum) => {
        const date = new Date(datum.time);
        const formattedDate = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
        const formattedTime = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;

        return {
          name: datum.category,
          value: `${parseFloat(datum.value).toFixed(2)}${config.unit ? ' ' + config.unit : ''}`,
          time: `${formattedDate} ${formattedTime}`,
        };
      },
      domStyles: {
        'g2-tooltip': {
          backgroundColor: 'rgba(50, 50, 50, 0.95)',
          color: '#fff',
          boxShadow: '0 3px 6px -4px rgba(0, 0, 0, 0.48)',
          borderRadius: '4px',
          padding: '12px',
          fontSize: '13px',
        },
        'g2-tooltip-title': {
          color: '#e0e0e0',
          marginBottom: '12px',
        },
      },
    },

    // 数据点样式 (ThingsBoard风格)
    point: {
      size: 3,
      shape: 'circle',
      style: (datum) => {
        return {
          fill: 'white',
          stroke: datum.category === config.title ? '#2E7D32' : '#5B8FF9',
          lineWidth: 2,
          fillOpacity: 0,
        };
      },
    },

    // 线条样式 (ThingsBoard风格)
    lineStyle: (datum) => {
      return {
        lineWidth: 2,
        stroke: datum.category === config.title ? '#2E7D32' : '#5B8FF9',
      };
    },

    // 图例配置 (ThingsBoard风格)
    legend: {
      position: 'top-right',
      itemName: {
        style: {
          fontSize: 12,
          opacity: 0.8,
        },
      },
      marker: {
        symbol: 'circle',
      },
    },

    // 交互配置
    interactions: [
      {
        type: 'element-active',
      },
      {
        type: 'legend-highlight',
      },
      {
        type: 'axis-label-highlight',
      },
      {
        type: 'brush',
        cfg: {
          brush: 'rect',
        },
      },
    ],

    // 图表边距
    padding: [30, 20, 50, 50],

    // 响应式配置
    responsive: true,
  };

  return (
    <div ref={containerRef} className={`${styles.trendContainer} ${isFullscreen ? styles.fullscreen : ''}`}>
      <Card
        className={styles.trendCard}
        title={
          <div className={styles.cardTitle}>
            <LineChartOutlined className={styles.titleIcon} />
            <span>{config.title}</span>
            {lastUpdateTime && (
              <span className={styles.updateTime}>
                更新于: {lastUpdateTime.toLocaleTimeString('zh-CN', { hour12: false })}
              </span>
            )}
          </div>
        }
        extra={
          <div className={styles.cardActions}>
            <Tooltip title="刷新">
              <Button
                type="text"
                icon={<ReloadOutlined />}
                onClick={() => fetchData()}
                disabled={loading}
              />
            </Tooltip>
            {editable && (
              <Tooltip title="编辑">
                <Button
                  type="text"
                  icon={<EditOutlined />}
                  onClick={handleEdit}
                />
              </Tooltip>
            )}
            <Tooltip title={isFullscreen ? "退出全屏" : "全屏"}>
              <Button
                type="text"
                icon={isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
                onClick={toggleFullscreen}
              />
            </Tooltip>
            {onDelete && (
              <Tooltip title="删除">
                <Button
                  type="text"
                  icon={<DeleteOutlined />}
                  onClick={() => onDelete(id)}
                  danger
                />
              </Tooltip>
            )}
          </div>
        }
        // 移除已弃用的bordered属性
      >
        {/* 移除工具栏，将设置选项移至编辑弹窗 */}

        {/* 图表容器 - 可调整大小 */}
        <div className={styles.chartContainer}>
          {loading ? (
            <div className={styles.loadingContainer}>
              <Spin tip="加载中..." />
            </div>
          ) : error ? (
            <div className={styles.errorContainer}>
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={`加载失败: ${error}`}
              />
              <Button type="primary" onClick={() => fetchData()}>
                重试
              </Button>
            </div>
          ) : data.length === 0 ? (
            <div className={styles.emptyContainer}>
              <Empty description="暂无数据" />
            </div>
          ) : (
            <Resizable
              height={chartHeight}
              width="100%"
              onResizeStart={handleResizeStart}
              onResize={handleResize}
              onResizeStop={handleResizeStop}
              handle={<div className={styles.resizeHandle}>
                <Tooltip title="拖动调整图表高度">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <ColumnHeightOutlined />
                    <span>调整大小</span>
                  </div>
                </Tooltip>
              </div>}
              handleSize={[20, 20]}
              resizeHandles={['s']}
              minConstraints={[300, 200]}
              maxConstraints={[1200, 800]}
            >
              <div style={{ height: `${chartHeight}px`, width: '100%', position: 'relative', marginBottom: '15px' }}>
                {(!config.chartType || config.chartType === 'line') && <Line {...chartConfig} ref={chartRef} />}
                {config.chartType === 'area' && <Area {...chartConfig} ref={chartRef} />}
                {config.chartType === 'column' && <Column {...chartConfig} ref={chartRef} />}
                {config.chartType === 'indicator' && (
                  <div className={styles.indicatorContainer}>
                    <div className={styles.indicatorValue}>
                      {data.length > 0 ? parseFloat(data[data.length - 1].value).toFixed(2) : '0.00'}
                      <span className={styles.indicatorUnit}>{config.unit || ''}</span>
                    </div>
                    <div className={styles.indicatorTitle}>{config.title}</div>
                    <div className={styles.indicatorChart}>
                      <Area
                        {...{
                          ...chartConfig,
                          padding: [0, 0, 0, 0],
                          xAxis: { ...chartConfig.xAxis, label: null, line: null, grid: null },
                          yAxis: { ...chartConfig.yAxis, label: null, line: null, grid: null },
                          tooltip: false,
                          legend: false,
                          animation: false,
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </Resizable>
          )}
        </div>
      </Card>

      {/* 编辑模态框 */}
      <RealTimeTrendEditor
        visible={editorVisible}
        initialValues={config}
        onCancel={() => setEditorVisible(false)}
        onSave={handleConfigUpdate}
      />
    </div>
  );
};

export default RealTimeTrend;
