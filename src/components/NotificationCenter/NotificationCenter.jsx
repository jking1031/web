import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Drawer,
  Tabs,
  List,
  Badge,
  Button,
  Empty,
  Spin,
  Typography,
  Tooltip,
  Select,
  Switch,
  Divider,
  Tag,
  Space,
  message
} from 'antd';
import {
  BellOutlined,
  CheckOutlined,
  DeleteOutlined,
  FilterOutlined,
  ReloadOutlined,
  CloseCircleOutlined,
  WarningOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  SortAscendingOutlined,
  SortDescendingOutlined,
  CloseOutlined
} from '@ant-design/icons';
import api from '../../api/interceptors';
import styles from './NotificationCenter.module.scss';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

/**
 * 通知中心组件
 * @param {Object} props - 组件属性
 * @param {boolean} props.visible - 是否显示通知中心
 * @param {Function} props.onClose - 关闭通知中心的回调函数
 * @param {Function} props.onNotificationUpdate - 通知更新时的回调函数，用于更新顶部栏通知数量
 * @returns {JSX.Element} 通知中心组件
 */
const NotificationCenter = ({ visible, onClose, onNotificationUpdate }) => {
  // 状态管理
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [lastUpdateTime, setLastUpdateTime] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showRead, setShowRead] = useState(true);
  const [readNotifications, setReadNotifications] = useState(() => {
    try {
      const saved = localStorage.getItem('readNotifications');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // 更新间隔常量
  const UPDATE_INTERVAL = 60000; // 1分钟

  /**
   * 从缓存加载通知数据
   */
  const loadCachedNotifications = useCallback(() => {
    try {
      const cachedData = localStorage.getItem('cachedNotifications');
      if (cachedData) {
        const { notifications: cachedNotifications, timestamp } = JSON.parse(cachedData);
        // 检查缓存是否在30分钟内
        if (Date.now() - timestamp < 30 * 60 * 1000) {
          console.log('使用缓存的通知数据:', cachedNotifications.length);
          setNotifications(cachedNotifications);
          setLastUpdateTime(new Date(timestamp));
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('加载缓存通知数据失败:', error);
      return false;
    }
  }, []);

  /**
   * 获取通知数据
   */
  const fetchNotifications = useCallback(async (isManual = false) => {
    try {
      // 如果是手动刷新或者没有缓存数据，才发起API请求
      if (isManual || notifications.length === 0) {
        setLoading(true);
        console.log('获取通知数据...');

        // 使用与移动端相同的API端点
        const response = await api.get('https://nodered.jzz77.cn:9003/api/messages', {
          timeout: 5000,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });

        if (response.data) {
          let newNotifications = [];

          // 处理不同的响应格式
          if (Array.isArray(response.data)) {
            console.log('获取到通知数据:', response.data.length);
            newNotifications = [...response.data];
          } else if (response.data.messages && Array.isArray(response.data.messages)) {
            console.log('获取到嵌套通知数据:', response.data.messages.length);
            newNotifications = [...response.data.messages];
          }

          // 确保每个通知都有唯一ID
          newNotifications = newNotifications.map((notification, index) => ({
            ...notification,
            id: notification.id || `notification-${Date.now()}-${index}`
          }));

          // 更新状态
          setNotifications(newNotifications);
          const currentTime = new Date();
          setLastUpdateTime(currentTime);

          // 缓存数据
          localStorage.setItem('cachedNotifications', JSON.stringify({
            notifications: newNotifications,
            timestamp: currentTime.getTime()
          }));

          if (isManual) {
            message.success('通知数据已更新');
          }
        }
      } else {
        // 使用缓存数据
        loadCachedNotifications();
      }
    } catch (error) {
      console.error('获取通知数据失败:', error);

      // 尝试使用缓存数据
      if (!loadCachedNotifications() && isManual) {
        message.error('获取通知数据失败');
      }
    } finally {
      setLoading(false);
    }
  }, [notifications.length, loadCachedNotifications]);

  // 组件挂载时获取数据，并设置定时刷新
  useEffect(() => {
    if (visible) {
      console.log('初始化通知中心...');

      // 首先尝试从缓存加载
      if (!loadCachedNotifications()) {
        // 如果没有缓存，则从API获取
        fetchNotifications();
      }
    }
  }, [visible, loadCachedNotifications, fetchNotifications]);

  // 设置定时刷新
  useEffect(() => {
    if (visible) {
      // 设置定时器
      const timer = setInterval(() => fetchNotifications(), UPDATE_INTERVAL);
      console.log(`设置通知数据更新定时器，间隔: ${UPDATE_INTERVAL / 1000}秒`);

      return () => {
        console.log('清理通知数据更新定时器');
        clearInterval(timer);
      };
    }
  }, [visible, fetchNotifications]);

  /**
   * 格式化日期时间
   * @param {string|number|Date} timestamp - 时间戳或日期对象
   * @returns {string} 格式化后的日期时间字符串
   */
  const formatDateTime = (timestamp) => {
    if (!timestamp) return '';

    const date = new Date(timestamp);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  /**
   * 手动刷新通知数据
   */
  const handleRefresh = () => {
    fetchNotifications(true);
  };

  /**
   * 获取通知类型对应的样式
   * @param {string} type - 通知类型
   * @returns {string} 通知类型对应的样式
   */
  const getNotificationType = (type) => {
    switch (type?.toLowerCase()) {
      case 'alarm':
      case 'error':
      case 'high':
        return 'error';
      case 'warning':
      case 'medium':
        return 'warning';
      case 'info':
      case 'low':
      case 'notice':
        return 'info';
      case 'success':
        return 'success';
      default:
        return 'default';
    }
  };

  /**
   * 获取通知图标
   * @param {string} type - 通知类型
   * @returns {JSX.Element} 图标组件
   */
  const getNotificationIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'alarm':
      case 'error':
      case 'high':
        return <CloseCircleOutlined style={{ color: '#ff4d4f' }} />;
      case 'warning':
      case 'medium':
        return <WarningOutlined style={{ color: '#faad14' }} />;
      case 'info':
      case 'low':
      case 'notice':
        return <InfoCircleOutlined style={{ color: '#1890ff' }} />;
      case 'success':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      default:
        return <BellOutlined style={{ color: '#1890ff' }} />;
    }
  };

  /**
   * 检查通知是否已读
   * @param {Object} notification - 通知对象
   * @returns {boolean} 是否已读
   */
  const isNotificationRead = (notification) => {
    return readNotifications.includes(notification.id);
  };

  /**
   * 标记通知为已读
   * @param {Object} notification - 通知对象
   * @param {Event} e - 事件对象
   */
  const markAsRead = (notification, e) => {
    if (e) {
      e.stopPropagation();
    }

    if (!isNotificationRead(notification)) {
      const newReadNotifications = [...readNotifications, notification.id];
      setReadNotifications(newReadNotifications);

      // 保存到本地存储
      try {
        localStorage.setItem('readNotifications', JSON.stringify(newReadNotifications));

        // 通知父组件更新通知数量
        if (onNotificationUpdate) {
          // 计算新的未读通知数量
          const newUnreadCount = notifications.filter(item =>
            !newReadNotifications.includes(item.id)
          ).length;

          onNotificationUpdate(newUnreadCount);
        }
      } catch (error) {
        console.error('保存已读状态失败:', error);
      }
    }
  };

  /**
   * 标记所有通知为已读
   */
  const markAllAsRead = () => {
    const allIds = notifications.map(notification => notification.id);
    const newReadNotifications = [...new Set([...readNotifications, ...allIds])];
    setReadNotifications(newReadNotifications);

    // 保存到本地存储
    try {
      localStorage.setItem('readNotifications', JSON.stringify(newReadNotifications));
      message.success('已将所有通知标记为已读');

      // 通知父组件更新通知数量为0
      if (onNotificationUpdate) {
        onNotificationUpdate(0);
      }
    } catch (error) {
      console.error('保存已读状态失败:', error);
    }
  };

  /**
   * 清除所有已读标记
   */
  const clearAllReadMarks = () => {
    setReadNotifications([]);
    localStorage.removeItem('readNotifications');
    message.success('已清除所有已读标记');

    // 通知父组件更新通知数量为所有通知的数量
    if (onNotificationUpdate && notifications.length > 0) {
      onNotificationUpdate(notifications.length);
    }
  };

  /**
   * 过滤和排序通知
   */
  const filteredNotifications = useMemo(() => {
    // 首先按标签过滤
    let result = [...notifications];

    if (activeTab === 'unread') {
      result = result.filter(notification => !isNotificationRead(notification));
    }

    // 按类型过滤
    if (filterType !== 'all') {
      result = result.filter(notification => {
        const notificationType = (notification.type || notification.level || '').toLowerCase();
        return notificationType === filterType;
      });
    }

    // 过滤已读通知
    if (!showRead) {
      result = result.filter(notification => !isNotificationRead(notification));
    }

    // 然后排序
    result.sort((a, b) => {
      const dateA = new Date(a.datetime || a.timestamp || a.created_at || 0);
      const dateB = new Date(b.datetime || b.timestamp || b.created_at || 0);

      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

    return result;
  }, [notifications, activeTab, filterType, sortOrder, showRead, readNotifications]);

  // 未读通知数量
  const unreadCount = useMemo(() => {
    return notifications.filter(notification => !isNotificationRead(notification)).length;
  }, [notifications, readNotifications]);

  return (
    <Drawer
      title={
        <div className={styles.drawerTitle}>
          <Space align="center">
            <BellOutlined className={styles.bellIcon} />
            <Title level={4} className={styles.titleText}>通知中心</Title>
            <Badge count={unreadCount} className={styles.badge} />
          </Space>
          <Space>
            <Tooltip title="刷新">
              <Button
                type="text"
                icon={<ReloadOutlined spin={loading} />}
                onClick={handleRefresh}
                disabled={loading}
              />
            </Tooltip>
            <Tooltip title="标记全部为已读">
              <Button
                type="text"
                icon={<CheckOutlined />}
                onClick={markAllAsRead}
                disabled={loading || notifications.length === 0}
              />
            </Tooltip>
            <Tooltip title="关闭">
              <Button
                type="text"
                icon={<CloseOutlined />}
                onClick={onClose}
              />
            </Tooltip>
          </Space>
        </div>
      }
      closeIcon={false} // 隐藏默认关闭图标
      placement="right"
      onClose={onClose}
      open={visible}
      width={400}
      className={styles.notificationDrawer}
      bodyStyle={{ padding: '0 16px 16px' }}
      maskClosable={true} // 点击遮罩关闭抽屉
    >
      {/* 通知内容 */}
      <div className={styles.notificationContent}>
        {/* 过滤工具栏 */}
        <div className={styles.toolbar}>
          <div className={styles.toolbarLeft}>
            <div className={styles.filterItem}>
              <span className={styles.filterLabel}>类型:</span>
              <Select
                size="small"
                value={filterType}
                onChange={setFilterType}
                style={{ width: 90 }}
                options={[
                  { value: 'all', label: '全部' },
                  { value: 'high', label: '高级' },
                  { value: 'medium', label: '中级' },
                  { value: 'low', label: '低级' },
                  { value: 'alarm', label: '报警' },
                  { value: 'warning', label: '预警' },
                  { value: 'info', label: '信息' }
                ]}
              />
            </div>
            <Tooltip title={`${showRead ? '隐藏' : '显示'}已读通知`}>
              <Switch
                size="small"
                checked={showRead}
                onChange={setShowRead}
                checkedChildren="已读"
                unCheckedChildren="未读"
              />
            </Tooltip>
          </div>
          <div className={styles.toolbarRight}>
            <Tooltip title={sortOrder === 'desc' ? '最新的在前' : '最早的在前'}>
              <Button
                type="text"
                size="small"
                icon={sortOrder === 'desc' ? <SortDescendingOutlined /> : <SortAscendingOutlined />}
                onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
              />
            </Tooltip>
          </div>
        </div>

        {/* 标签页 */}
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          className={styles.tabs}
        >
          <TabPane
            tab={<span>全部</span>}
            key="all"
          />
          <TabPane
            tab={
              <Badge count={unreadCount} size="small" offset={[5, 0]}>
                <span>未读</span>
              </Badge>
            }
            key="unread"
          />
        </Tabs>

        {/* 上次更新时间 */}
        <div className={styles.lastUpdateInfo}>
          上次更新: {lastUpdateTime ? formatDateTime(lastUpdateTime) : '未知'}
        </div>

        {/* 通知列表 */}
        {loading ? (
          <div className={styles.loadingContainer}>
            <Spin />
            <Text className={styles.loadingText}>加载中...</Text>
          </div>
        ) : filteredNotifications.length > 0 ? (
          <List
            className={styles.notificationList}
            dataSource={filteredNotifications}
            renderItem={notification => (
              <List.Item
                className={`${styles.notificationItem} ${isNotificationRead(notification) ? styles.read : ''}`}
                actions={[
                  !isNotificationRead(notification) && (
                    <Tooltip title="标记为已读" key="read">
                      <Button
                        type="text"
                        size="small"
                        icon={<CheckOutlined />}
                        onClick={(e) => markAsRead(notification, e)}
                      />
                    </Tooltip>
                  )
                ].filter(Boolean)}
              >
                <List.Item.Meta
                  avatar={getNotificationIcon(notification.level || notification.type)}
                  title={
                    <div className={styles.notificationTitle}>
                      <Tooltip title={notification.title || notification.message}>
                        <Text strong ellipsis={{ tooltip: false }}>
                          {notification.title || notification.message}
                        </Text>
                      </Tooltip>
                      <Tag color={getNotificationType(notification.level || notification.type)}>
                        {notification.level || notification.type || '通知'}
                      </Tag>
                    </div>
                  }
                  description={
                    <div className={styles.notificationDescription}>
                      <div className={styles.siteName}>
                        <Tooltip title={notification.siteName || notification.site_name || '未知站点'}>
                          {notification.siteName || notification.site_name || '未知站点'}
                        </Tooltip>
                      </div>
                      <div className={styles.datetime}>
                        {notification.datetime || notification.timestamp || formatDateTime(notification.created_at)}
                      </div>
                      {notification.content && (
                        <div className={styles.content}>
                          <Tooltip
                            title={notification.content.length > 100 ? notification.content : ''}
                            placement="bottomLeft"
                          >
                            <div className={styles.contentText}>
                              {notification.content.length > 100
                                ? `${notification.content.substring(0, 100)}...`
                                : notification.content}
                            </div>
                          </Tooltip>
                        </div>
                      )}
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        ) : (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <Text type="secondary">
                {activeTab === 'unread' ? '没有未读通知' : '暂无通知'}
              </Text>
            }
            className={styles.emptyState}
          />
        )}
      </div>

      {/* 底部工具栏 */}
      <Divider style={{ margin: '16px 0 8px' }} />
      <div className={styles.footer}>
        <Button
          type="link"
          size="small"
          onClick={clearAllReadMarks}
        >
          清除已读标记
        </Button>
      </div>
    </Drawer>
  );
};

export default NotificationCenter;
