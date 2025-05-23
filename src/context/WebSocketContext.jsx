import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { WS_BASE_URL } from '../api/config';

// 创建WebSocket上下文
const WebSocketContext = createContext();

/**
 * WebSocket提供组件
 * @param {Object} props - 组件属性
 * @param {React.ReactNode} props.children - 子组件
 */
export const WebSocketProvider = ({ children }) => {
  const { user, isLoggedIn } = useAuth();
  const [connected, setConnected] = useState(false);
  const [activeSiteId, setActiveSiteId] = useState(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [lastMessage, setLastMessage] = useState(null);

  // WebSocket引用
  const wsRef = useRef(null);
  const heartbeatRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  // 清理函数
  const cleanup = useCallback(() => {
    // 清理心跳
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }

    // 清理重连定时器
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    // 关闭WebSocket连接
    if (wsRef.current) {
      // 移除所有事件监听器
      wsRef.current.onclose = null;
      wsRef.current.onerror = null;
      wsRef.current.onopen = null;
      wsRef.current.onmessage = null;

      // 关闭连接
      if (wsRef.current.readyState === WebSocket.CONNECTING ||
          wsRef.current.readyState === WebSocket.OPEN) {
        try {
          wsRef.current.close(1000, "Normal closure");
        } catch (e) {
          console.error('关闭WebSocket连接错误:', e);
        }
      }

      wsRef.current = null;
      setConnected(false);
    }
  }, []);

  // 设置心跳
  const setupHeartbeat = useCallback(() => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
    }

    heartbeatRef.current = setInterval(() => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        try {
          wsRef.current.send(JSON.stringify({
            type: 'ping',
            timestamp: Date.now(),
            siteId: activeSiteId,
            clientId: `web_${Math.random().toString(36).substring(7)}`
          }));
        } catch (e) {
          console.error('发送心跳失败:', e);
          // 心跳失败，尝试重新连接
          if (wsRef.current) {
            wsRef.current.close();
          }
        }
      }
    }, 15000); // 15秒发送一次心跳
  }, [activeSiteId]);

  // 连接WebSocket
  const connect = useCallback((siteId) => {
    // 如果未登录，不连接
    if (!isLoggedIn) {
      console.log('用户未登录，不连接WebSocket');
      return;
    }

    // 如果没有站点ID，不连接
    if (!siteId) {
      console.log('未提供站点ID，不连接WebSocket');
      return;
    }

    // 如果已经连接到相同站点，不重新连接
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && activeSiteId === siteId) {
      console.log('已连接到站点', siteId);
      return;
    }

    // 如果已经连接到不同站点，先断开
    if (wsRef.current) {
      cleanup();
    }

    // 设置当前站点ID
    setActiveSiteId(siteId);

    // 创建新连接
    try {
      // 添加时间戳和随机数，避免缓存问题
      const wsUrl = `${WS_BASE_URL}/device${siteId}?t=${Date.now()}&client=web`;
      console.log('连接WebSocket:', wsUrl);

      const socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        console.log('WebSocket连接成功');
        setConnected(true);
        setReconnectAttempts(0);

        // 连接建立后立即发送一个初始化消息
        try {
          socket.send(JSON.stringify({
            type: 'init',
            siteId,
            clientInfo: {
              platform: 'web',
              version: '1.0.0',
              timestamp: Date.now()
            }
          }));
        } catch (e) {
          console.error('发送初始化消息失败:', e);
        }

        // 连接成功后延迟1秒再请求设备状态
        setTimeout(() => {
          if (socket.readyState === WebSocket.OPEN) {
            try {
              socket.send(JSON.stringify({
                type: 'get_device_status',
                siteId
              }));
            } catch (e) {
              console.error('发送状态请求失败:', e);
            }
          }
        }, 1000);

        // 设置心跳
        setupHeartbeat();
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          // 保存最后一条消息
          setLastMessage(data);

          // 处理心跳响应
          if (data.type === 'pong') {
            return;
          }

          // 其他消息类型在使用WebSocket的组件中处理
        } catch (error) {
          console.error('解析WebSocket消息失败:', error);
        }
      };

      socket.onclose = (event) => {
        console.log('WebSocket连接关闭:', event.code, event.reason);
        setConnected(false);

        // 清理心跳
        if (heartbeatRef.current) {
          clearInterval(heartbeatRef.current);
          heartbeatRef.current = null;
        }

        // 正常关闭(1000)或未授权(1003)不需要重试
        if (event.code === 1000 || event.code === 1003) {
          return;
        }

        // 重连逻辑
        const baseDelay = event.reason && event.reason.includes('502') ? 5000 : 1000;
        const maxReconnectDelay = 60000; // 最大60秒重连间隔
        const delay = Math.min(baseDelay * Math.pow(1.5, reconnectAttempts), maxReconnectDelay);

        reconnectTimeoutRef.current = setTimeout(() => {
          if (isLoggedIn) {
            setReconnectAttempts(prev => prev + 1);
            connect(siteId);
          }
        }, delay);
      };

      socket.onerror = (error) => {
        console.error('WebSocket连接错误:', error);
      };

      wsRef.current = socket;

    } catch (error) {
      console.error('创建WebSocket连接失败:', error);
      setConnected(false);

      // 连接失败也增加重试计数
      const delay = Math.min(1000 * Math.pow(1.5, reconnectAttempts), 30000);
      reconnectTimeoutRef.current = setTimeout(() => {
        if (isLoggedIn) {
          setReconnectAttempts(prev => prev + 1);
          connect(siteId);
        }
      }, delay);
    }
  }, [isLoggedIn, activeSiteId, reconnectAttempts, cleanup, setupHeartbeat]);

  // 断开WebSocket连接
  const disconnect = useCallback(() => {
    cleanup();
    setActiveSiteId(null);
  }, [cleanup]);

  // 发送WebSocket消息
  const sendMessage = useCallback((message) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.error('WebSocket未连接，无法发送消息');
      return Promise.reject(new Error('WebSocket未连接'));
    }

    try {
      wsRef.current.send(JSON.stringify({
        ...message,
        siteId: activeSiteId,
        timestamp: Date.now()
      }));
      return Promise.resolve();
    } catch (error) {
      console.error('发送WebSocket消息失败:', error);
      return Promise.reject(error);
    }
  }, [activeSiteId]);

  // 当用户登录状态变化时，处理WebSocket连接
  // 注意：我们不会在用户登录时自动连接WebSocket，只在需要时（如进入站点详情页面）才连接
  useEffect(() => {
    if (!isLoggedIn) {
      // 用户登出，断开连接
      disconnect();
    }

    // 返回清理函数，确保组件卸载时断开连接
    return () => {
      if (wsRef.current) {
        cleanup();
      }
    };
  }, [isLoggedIn, disconnect, cleanup]);

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return (
    <WebSocketContext.Provider
      value={{
        connected,
        activeSiteId,
        lastMessage,
        connect,
        disconnect,
        sendMessage
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
};

/**
 * 使用WebSocket的自定义钩子
 * @returns {Object} 包含WebSocket状态和方法的对象
 */
export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};
