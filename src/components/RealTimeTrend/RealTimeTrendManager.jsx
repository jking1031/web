import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { Row, Col, Button, Card, Form, message, App } from 'antd';
import { PlusOutlined, LineChartOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import RealTimeTrend from './RealTimeTrend';
import RealTimeTrendEditor from './RealTimeTrendEditor';
import styles from './RealTimeTrendManager.module.scss';

/**
 * 实时趋势管理组件
 * 用于在主页上添加和管理多个实时趋势图
 * @returns {JSX.Element} 实时趋势管理组件
 */
const RealTimeTrendManager = () => {
  const [trends, setTrends] = useState([]);
  const [editorVisible, setEditorVisible] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);

  // 初始化 - 从本地存储加载趋势配置
  useEffect(() => {
    const loadTrends = () => {
      try {
        const savedTrends = localStorage.getItem('realTimeTrends');
        if (savedTrends) {
          setTrends(JSON.parse(savedTrends));
        } else {
          // 如果没有保存的趋势，添加一个默认的
          const defaultTrend = {
            id: `trend-${Date.now()}`,
            title: '进水流量趋势',
            dbName: 'nodered',
            tableName: 'gt_data',
            dataField: 'flow_in',
            refreshInterval: 60000
          };
          setTrends([defaultTrend]);
          localStorage.setItem('realTimeTrends', JSON.stringify([defaultTrend]));
        }
      } catch (error) {
        console.error('加载趋势配置失败:', error);
        message.error('加载趋势配置失败');
      }
    };

    loadTrends();

    // 监听添加趋势的自定义事件
    const handleAddTrendEvent = () => {
      setEditorVisible(true);
    };

    window.addEventListener('addTrend', handleAddTrendEvent);

    // 清理函数
    return () => {
      window.removeEventListener('addTrend', handleAddTrendEvent);
    };
  }, []);

  // 保存趋势配置到本地存储
  const saveTrends = (newTrends) => {
    try {
      localStorage.setItem('realTimeTrends', JSON.stringify(newTrends));
    } catch (error) {
      console.error('保存趋势配置失败:', error);
      message.error('保存趋势配置失败');
    }
  };

  // 添加新趋势
  const handleAddTrend = () => {
    setEditorVisible(true);
  };

  // 保存新趋势
  const handleSaveTrend = (values) => {
    setConfirmLoading(true);

    try {
      const newTrend = {
        ...values,
        id: `trend-${Date.now()}`
      };

      const newTrends = [...trends, newTrend];
      setTrends(newTrends);
      saveTrends(newTrends);

      setEditorVisible(false);
      message.success('添加趋势成功');
    } catch (error) {
      console.error('添加趋势失败:', error);
      message.error('添加趋势失败');
    } finally {
      setConfirmLoading(false);
    }
  };

  // 删除趋势
  const handleDeleteTrend = (id) => {
    // 使用函数式组件创建确认对话框
    const ConfirmDialog = () => {
      const { modal } = App.useApp();

      // 使用useEffect在组件挂载时显示确认对话框
      useEffect(() => {
        modal.confirm({
      title: '确认删除',
      icon: <ExclamationCircleOutlined />,
      content: '确定要删除这个趋势图吗？',
      okText: '确认',
      cancelText: '取消',
      onOk: () => {
        try {
          const newTrends = trends.filter(trend => trend.id !== id);
          setTrends(newTrends);
          saveTrends(newTrends);
          message.success('删除趋势成功');
        } catch (error) {
          console.error('删除趋势失败:', error);
          message.error('删除趋势失败');
        }
      }
    });
      }, [modal]);

      return null;
    };

    // 渲染确认对话框
    const container = document.createElement('div');
    document.body.appendChild(container);

    // 使用createRoot渲染确认对话框
    const root = createRoot(container);
    root.render(
      <App>
        <ConfirmDialog />
      </App>
    );

    // 清理函数
    setTimeout(() => {
      root.unmount();
      container.remove();
    }, 1000); // 给对话框足够的时间显示
  };

  return (
    <div className={styles.trendManager}>
      <Row gutter={[16, 16]}>
        {trends.map(trend => (
          <Col xs={24} sm={24} md={12} lg={8} xl={8} key={trend.id}>
            <RealTimeTrend
              id={trend.id}
              title={trend.title}
              dbName={trend.dbName}
              tableName={trend.tableName}
              dataField={trend.dataField}
              refreshInterval={trend.refreshInterval}
              onDelete={handleDeleteTrend}
            />
          </Col>
        ))}
      </Row>

      {/* 添加趋势编辑器 */}
      <RealTimeTrendEditor
        visible={editorVisible}
        initialValues={{
          title: '新趋势图',
          dbName: 'nodered',
          tableName: 'gt_data',
          refreshInterval: 60000
        }}
        onCancel={() => setEditorVisible(false)}
        onSave={handleSaveTrend}
      />
    </div>
  );
};

export default RealTimeTrendManager;
