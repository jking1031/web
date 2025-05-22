import React, { createContext, useState, useEffect, useCallback, useContext } from 'react';
import dbService from '../../../../services/dbService';

// 创建上下文
const DatabaseContext = createContext();

/**
 * 数据库上下文提供者
 * 简化版本，只包含查询相关的功能
 */
export const DatabaseProvider = ({ children }) => {
  // 数据库连接配置
  const [dbConnections, setDbConnections] = useState([]);
  const [activeConnection, setActiveConnection] = useState(null);
  
  // 查询状态
  const [queryHistory, setQueryHistory] = useState([]);
  const [savedQueries, setSavedQueries] = useState([]);

  // 加载数据库连接配置
  const loadDbConnections = useCallback(() => {
    try {
      // 从本地存储获取数据库连接配置
      const savedConnections = localStorage.getItem('dbConnections');
      if (savedConnections) {
        const parsedConnections = JSON.parse(savedConnections);
        setDbConnections(parsedConnections);

        // 设置活动连接为默认连接
        const defaultConnection = parsedConnections.find(conn => conn.isDefault);
        if (defaultConnection) {
          setActiveConnection(defaultConnection);
        } else if (parsedConnections.length > 0) {
          setActiveConnection(parsedConnections[0]);
        }
      } else {
        // 默认连接
        const defaultConnections = [
          {
            id: 'conn-1',
            name: 'MySQL默认连接',
            host: 'nodered.jzz77.cn',
            port: 9003,
            database: 'zziot',
            username: 'root',
            password: '',
            isDefault: true
          }
        ];
        setDbConnections(defaultConnections);
        setActiveConnection(defaultConnections[0]);
        localStorage.setItem('dbConnections', JSON.stringify(defaultConnections));
      }

      // 加载查询历史
      const savedQueryHistory = localStorage.getItem('queryHistory');
      if (savedQueryHistory) {
        setQueryHistory(JSON.parse(savedQueryHistory));
      }

      // 加载保存的查询
      const savedQueriesData = localStorage.getItem('savedQueries');
      if (savedQueriesData) {
        setSavedQueries(JSON.parse(savedQueriesData));
      }
    } catch (error) {
      console.error('获取数据库连接配置失败:', error);
    }
  }, []);

  // 保存数据库连接配置
  const saveDbConnections = useCallback((connections) => {
    try {
      localStorage.setItem('dbConnections', JSON.stringify(connections));
      setDbConnections(connections);
    } catch (error) {
      console.error('保存数据库连接配置失败:', error);
    }
  }, []);

  // 添加或更新数据库连接
  const addOrUpdateConnection = useCallback((connection) => {
    const newConnections = [...dbConnections];
    const existingIndex = newConnections.findIndex(conn => conn.id === connection.id);

    if (existingIndex >= 0) {
      // 更新现有连接
      newConnections[existingIndex] = connection;
    } else {
      // 添加新连接
      newConnections.push(connection);
    }

    // 如果设置为默认，将其他连接的默认状态设为false
    if (connection.isDefault) {
      newConnections.forEach(conn => {
        if (conn.id !== connection.id) {
          conn.isDefault = false;
        }
      });
    }

    // 如果没有默认连接，将第一个设为默认
    if (!newConnections.some(conn => conn.isDefault) && newConnections.length > 0) {
      newConnections[0].isDefault = true;
    }

    saveDbConnections(newConnections);

    // 如果是默认连接，设置为活动连接
    if (connection.isDefault) {
      setActiveConnection(connection);
    }

    return newConnections;
  }, [dbConnections, saveDbConnections]);

  // 删除数据库连接
  const deleteConnection = useCallback((connectionId) => {
    const newConnections = dbConnections.filter(conn => conn.id !== connectionId);

    // 如果删除后没有默认连接，将第一个设为默认
    if (newConnections.length > 0 && !newConnections.some(conn => conn.isDefault)) {
      newConnections[0].isDefault = true;
      setActiveConnection(newConnections[0]);
    }

    saveDbConnections(newConnections);
    return newConnections;
  }, [dbConnections, saveDbConnections]);

  // 设置活动连接
  const setActiveConnectionById = useCallback((connectionId) => {
    const connection = dbConnections.find(conn => conn.id === connectionId);
    if (connection) {
      setActiveConnection(connection);
    }
  }, [dbConnections]);

  // 测试数据库连接
  const testConnection = useCallback(async (connection) => {
    try {
      // 构建连接配置
      const config = {
        host: connection.host,
        port: connection.port,
        database: connection.database,
        username: connection.username,
        password: connection.password
      };

      // 测试连接
      const result = await dbService.testConnection(config);
      return result;
    } catch (error) {
      console.error('测试数据库连接失败:', error);
      throw error;
    }
  }, []);

  // 执行查询
  const executeQuery = useCallback(async (connection, sql, params = []) => {
    try {
      // 构建连接配置
      const config = {
        host: connection.host,
        port: connection.port,
        database: connection.database,
        username: connection.username,
        password: connection.password
      };

      // 执行查询
      const result = await dbService.query(config, sql, params, { includeFields: true });
      return result;
    } catch (error) {
      console.error('执行查询失败:', error);
      throw error;
    }
  }, []);

  // 添加查询历史
  const addQueryHistory = useCallback((query) => {
    const newHistory = [query, ...queryHistory.slice(0, 99)]; // 保留最近100条
    setQueryHistory(newHistory);
    localStorage.setItem('queryHistory', JSON.stringify(newHistory));
  }, [queryHistory]);

  // 保存查询
  const saveQuery = useCallback((query) => {
    const newSavedQueries = [...savedQueries, query];
    setSavedQueries(newSavedQueries);
    localStorage.setItem('savedQueries', JSON.stringify(newSavedQueries));
  }, [savedQueries]);

  // 更新保存的查询
  const updateSavedQuery = useCallback((queryId, updatedQuery) => {
    const newSavedQueries = savedQueries.map(q => 
      q.id === queryId ? { ...q, ...updatedQuery } : q
    );
    setSavedQueries(newSavedQueries);
    localStorage.setItem('savedQueries', JSON.stringify(newSavedQueries));
  }, [savedQueries]);

  // 删除保存的查询
  const deleteSavedQuery = useCallback((queryId) => {
    const newSavedQueries = savedQueries.filter(q => q.id !== queryId);
    setSavedQueries(newSavedQueries);
    localStorage.setItem('savedQueries', JSON.stringify(newSavedQueries));
  }, [savedQueries]);

  // 初始化
  useEffect(() => {
    loadDbConnections();
  }, [loadDbConnections]);

  // 上下文值
  const contextValue = {
    // 数据库连接
    dbConnections,
    activeConnection,
    // 查询
    queryHistory,
    savedQueries,
    // 方法
    loadDbConnections,
    addOrUpdateConnection,
    deleteConnection,
    setActiveConnectionById,
    testConnection,
    executeQuery,
    addQueryHistory,
    saveQuery,
    updateSavedQuery,
    deleteSavedQuery
  };

  return (
    <DatabaseContext.Provider value={contextValue}>
      {children}
    </DatabaseContext.Provider>
  );
};

// 自定义钩子，用于访问数据库上下文
export const useDatabase = () => useContext(DatabaseContext);

export default DatabaseContext;
