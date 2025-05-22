/**
 * 仪表盘配置功能
 * 提供可视化仪表盘配置和展示功能
 */
import React, { useState, useEffect } from 'react';
import { useDataCache } from '../../utils/dataCache';
import { RippleButton, AnimatedCard } from '../EnhancedInteraction/EnhancedInteraction';
import './DashboardConfig.module.scss';

/**
 * 仪表盘配置组件
 */
export function DashboardConfig() {
  const [selectedDashboard, setSelectedDashboard] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [layout, setLayout] = useState([]);
  const [availableWidgets, setAvailableWidgets] = useState([]);

  // 使用数据缓存获取仪表盘列表
  const { data: dashboards, isLoading, error, refetch } = useDataCache(
    'dashboards',
    async () => {
      // 模拟API调用
      return [
        {
          id: 'dashboard-001',
          name: '设备监控仪表盘',
          description: '监控所有设备的实时状态和遥测数据',
          createdAt: '2025-03-10T09:15:00Z',
          updatedAt: '2025-05-15T14:30:00Z',
          layout: [
            { i: 'widget-1', x: 0, y: 0, w: 6, h: 4, type: 'device-status' },
            { i: 'widget-2', x: 6, y: 0, w: 6, h: 4, type: 'temperature-chart' },
            { i: 'widget-3', x: 0, y: 4, w: 12, h: 4, type: 'device-telemetry' },
          ],
        },
        {
          id: 'dashboard-002',
          name: '能源消耗分析',
          description: '分析设备能源消耗和效率',
          createdAt: '2025-04-05T11:20:00Z',
          updatedAt: '2025-05-10T16:45:00Z',
          layout: [
            { i: 'widget-1', x: 0, y: 0, w: 12, h: 4, type: 'energy-consumption' },
            { i: 'widget-2', x: 0, y: 4, w: 6, h: 4, type: 'efficiency-gauge' },
            { i: 'widget-3', x: 6, y: 4, w: 6, h: 4, type: 'energy-trend' },
          ],
        },
      ];
    },
    {
      ttl: 60000, // 缓存60秒
    }
  );

  // 获取可用的小部件
  useEffect(() => {
    // 模拟API调用
    const fetchWidgets = async () => {
      const widgets = [
        { id: 'device-status', name: '设备状态', description: '显示设备在线/离线状态', icon: 'status-icon' },
        { id: 'temperature-chart', name: '温度图表', description: '显示温度传感器数据图表', icon: 'chart-icon' },
        { id: 'device-telemetry', name: '设备遥测', description: '显示设备遥测数据表格', icon: 'table-icon' },
        { id: 'energy-consumption', name: '能源消耗', description: '显示能源消耗图表', icon: 'energy-icon' },
        { id: 'efficiency-gauge', name: '效率仪表', description: '显示设备效率仪表盘', icon: 'gauge-icon' },
        { id: 'energy-trend', name: '能源趋势', description: '显示能源消耗趋势', icon: 'trend-icon' },
        { id: 'alarm-list', name: '告警列表', description: '显示最近告警列表', icon: 'alarm-icon' },
        { id: 'device-location', name: '设备位置', description: '在地图上显示设备位置', icon: 'map-icon' },
      ];
      setAvailableWidgets(widgets);
    };

    fetchWidgets();
  }, []);

  // 处理仪表盘选择
  const handleSelectDashboard = (dashboard) => {
    setSelectedDashboard(dashboard);
    setLayout(dashboard.layout);
    setEditMode(false);
  };

  // 处理仪表盘创建
  const handleCreateDashboard = () => {
    const newDashboard = {
      id: `dashboard-${Date.now()}`,
      name: '新仪表盘',
      description: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      layout: [],
    };
    
    setSelectedDashboard(newDashboard);
    setLayout([]);
    setEditMode(true);
  };

  // 处理仪表盘更新
  const handleUpdateDashboard = () => {
    // 在实际应用中，这里会调用API更新仪表盘
    console.log('更新仪表盘:', {
      ...selectedDashboard,
      layout,
      updatedAt: new Date().toISOString(),
    });
    
    // 模拟更新成功
    setEditMode(false);
    refetch();
  };

  // 处理添加小部件
  const handleAddWidget = (widgetType) => {
    const newWidget = {
      i: `widget-${Date.now()}`,
      x: 0,
      y: 0,
      w: 6,
      h: 4,
      type: widgetType,
    };
    
    setLayout([...layout, newWidget]);
  };

  // 处理移除小部件
  const handleRemoveWidget = (widgetId) => {
    setLayout(layout.filter(widget => widget.i !== widgetId));
  };

  // 渲染小部件
  const renderWidget = (widget) => {
    const widgetType = widget.type;
    const widgetInfo = availableWidgets.find(w => w.id === widgetType) || {
      name: '未知小部件',
      description: '未知小部件类型',
    };
    
    return (
      <div className="dashboard-widget" key={widget.i}>
        <div className="dashboard-widget-header">
          <h4 className="dashboard-widget-title">{widgetInfo.name}</h4>
          {editMode && (
            <button
              className="dashboard-widget-remove"
              onClick={() => handleRemoveWidget(widget.i)}
            >
              ×
            </button>
          )}
        </div>
        <div className="dashboard-widget-content">
          <div className="dashboard-widget-placeholder">
            {widgetInfo.description}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="dashboard-config">
      <div className="dashboard-config-header">
        <h2 className="dashboard-config-title">仪表盘配置</h2>
        <div className="dashboard-config-actions">
          <RippleButton type="primary" onClick={handleCreateDashboard}>
            创建仪表盘
          </RippleButton>
        </div>
      </div>
      
      <div className="dashboard-config-content">
        <div className="dashboard-list-container">
          <h3 className="dashboard-list-title">仪表盘列表</h3>
          {isLoading ? (
            <div className="dashboard-list-loading">加载中...</div>
          ) : error ? (
            <div className="dashboard-list-error">
              <p>加载仪表盘列表失败</p>
              <RippleButton type="default" size="small" onClick={refetch}>
                重试
              </RippleButton>
            </div>
          ) : (
            <div className="dashboard-list">
              {dashboards && dashboards.map(dashboard => (
                <div
                  key={dashboard.id}
                  className={`dashboard-list-item ${selectedDashboard?.id === dashboard.id ? 'active' : ''}`}
                  onClick={() => handleSelectDashboard(dashboard)}
                >
                  <div className="dashboard-list-item-info">
                    <div className="dashboard-list-item-name">{dashboard.name}</div>
                    <div className="dashboard-list-item-description">{dashboard.description}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="dashboard-editor-container">
          {selectedDashboard ? (
            <>
              <div className="dashboard-editor-header">
                <h3 className="dashboard-editor-title">
                  {editMode ? '编辑仪表盘' : selectedDashboard.name}
                </h3>
                <div className="dashboard-editor-actions">
                  {editMode ? (
                    <>
                      <RippleButton
                        type="default"
                        size="small"
                        onClick={() => {
                          setEditMode(false);
                          setLayout(selectedDashboard.layout);
                        }}
                      >
                        取消
                      </RippleButton>
                      <RippleButton
                        type="primary"
                        size="small"
                        onClick={handleUpdateDashboard}
                      >
                        保存
                      </RippleButton>
                    </>
                  ) : (
                    <RippleButton
                      type="primary"
                      size="small"
                      onClick={() => setEditMode(true)}
                    >
                      编辑
                    </RippleButton>
                  )}
                </div>
              </div>
              
              {editMode && (
                <div className="dashboard-widget-selector">
                  <h4 className="dashboard-widget-selector-title">添加小部件</h4>
                  <div className="dashboard-widget-selector-list">
                    {availableWidgets.map(widget => (
                      <div
                        key={widget.id}
                        className="dashboard-widget-selector-item"
                        onClick={() => handleAddWidget(widget.id)}
                      >
                        <div className="dashboard-widget-selector-icon">
                          <span className={widget.icon}></span>
                        </div>
                        <div className="dashboard-widget-selector-info">
                          <div className="dashboard-widget-selector-name">{widget.name}</div>
                          <div className="dashboard-widget-selector-description">{widget.description}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="dashboard-preview">
                <div className="dashboard-grid">
                  {layout.map(widget => renderWidget(widget))}
                  {layout.length === 0 && (
                    <div className="dashboard-empty">
                      {editMode ? '拖放小部件到此处' : '此仪表盘没有小部件'}
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="dashboard-empty-state">
              <p>选择一个仪表盘或创建新仪表盘</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
