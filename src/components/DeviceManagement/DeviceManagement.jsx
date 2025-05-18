/**
 * 设备管理功能增强
 * 提供更强大的设备管理界面和功能
 */
import React, { useState, useEffect } from 'react';
import { useDataCache } from '../../utils/dataCache';
import { VirtualList } from '../VirtualList/VirtualList';
import { RippleButton, AnimatedCard } from '../EnhancedInteraction/EnhancedInteraction';
import { LazyImage } from '../LazyImage/LazyImage';
import './DeviceManagement.module.scss';

/**
 * 设备状态标签组件
 */
const DeviceStatusBadge = ({ status }) => {
  const statusMap = {
    active: { label: '在线', color: '#52c41a' },
    inactive: { label: '离线', color: '#ff4d4f' },
    maintenance: { label: '维护中', color: '#faad14' },
    unknown: { label: '未知', color: '#d9d9d9' },
  };

  const { label, color } = statusMap[status] || statusMap.unknown;

  return (
    <span className="device-status-badge" style={{ backgroundColor: color }}>
      {label}
    </span>
  );
};

/**
 * 设备列表项组件
 */
const DeviceListItem = ({ device, onSelect }) => {
  return (
    <div className="device-list-item" onClick={() => onSelect(device)}>
      <div className="device-list-item-icon">
        <LazyImage
          src={device.icon || '/assets/device-placeholder.svg'}
          alt={device.name}
          width={40}
          height={40}
        />
      </div>
      <div className="device-list-item-info">
        <div className="device-list-item-name">{device.name}</div>
        <div className="device-list-item-type">{device.type}</div>
      </div>
      <div className="device-list-item-status">
        <DeviceStatusBadge status={device.status} />
      </div>
    </div>
  );
};

/**
 * 设备详情组件
 */
const DeviceDetail = ({ device, onClose, onUpdate }) => {
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({ ...device });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdate(formData);
    setEditMode(false);
  };

  return (
    <AnimatedCard
      title={editMode ? '编辑设备' : '设备详情'}
      className="device-detail-card"
      extra={
        <div className="device-detail-actions">
          {editMode ? (
            <>
              <RippleButton type="default" size="small" onClick={() => setEditMode(false)}>
                取消
              </RippleButton>
              <RippleButton type="primary" size="small" onClick={handleSubmit}>
                保存
              </RippleButton>
            </>
          ) : (
            <>
              <RippleButton type="default" size="small" onClick={onClose}>
                关闭
              </RippleButton>
              <RippleButton type="primary" size="small" onClick={() => setEditMode(true)}>
                编辑
              </RippleButton>
            </>
          )}
        </div>
      }
    >
      {editMode ? (
        <form className="device-edit-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">设备名称</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="type">设备类型</label>
            <input
              type="text"
              id="type"
              name="type"
              value={formData.type}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="status">设备状态</label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              required
            >
              <option value="active">在线</option>
              <option value="inactive">离线</option>
              <option value="maintenance">维护中</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="description">设备描述</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
            />
          </div>
        </form>
      ) : (
        <div className="device-detail-content">
          <div className="device-detail-header">
            <LazyImage
              src={device.icon || '/assets/device-placeholder.svg'}
              alt={device.name}
              width={80}
              height={80}
              className="device-detail-icon"
            />
            <div className="device-detail-header-info">
              <h3 className="device-detail-name">{device.name}</h3>
              <div className="device-detail-meta">
                <span className="device-detail-type">{device.type}</span>
                <DeviceStatusBadge status={device.status} />
              </div>
            </div>
          </div>
          <div className="device-detail-section">
            <h4 className="device-detail-section-title">基本信息</h4>
            <div className="device-detail-info-grid">
              <div className="device-detail-info-item">
                <span className="device-detail-info-label">设备ID</span>
                <span className="device-detail-info-value">{device.id}</span>
              </div>
              <div className="device-detail-info-item">
                <span className="device-detail-info-label">创建时间</span>
                <span className="device-detail-info-value">
                  {new Date(device.createdAt).toLocaleString()}
                </span>
              </div>
              <div className="device-detail-info-item">
                <span className="device-detail-info-label">最后活动</span>
                <span className="device-detail-info-value">
                  {new Date(device.lastActivityTime).toLocaleString()}
                </span>
              </div>
              <div className="device-detail-info-item">
                <span className="device-detail-info-label">固件版本</span>
                <span className="device-detail-info-value">{device.firmwareVersion}</span>
              </div>
            </div>
          </div>
          <div className="device-detail-section">
            <h4 className="device-detail-section-title">设备描述</h4>
            <p className="device-detail-description">{device.description}</p>
          </div>
          <div className="device-detail-section">
            <h4 className="device-detail-section-title">最近遥测数据</h4>
            <div className="device-detail-telemetry">
              {device.telemetry && Object.entries(device.telemetry).map(([key, value]) => (
                <div key={key} className="device-detail-telemetry-item">
                  <span className="device-detail-telemetry-label">{key}</span>
                  <span className="device-detail-telemetry-value">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </AnimatedCard>
  );
};

/**
 * 设备管理组件
 */
export function DeviceManagement() {
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [filterText, setFilterText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // 使用数据缓存获取设备列表
  const { data: devices, isLoading, error, refetch } = useDataCache(
    'devices',
    async () => {
      // 模拟API调用
      return [
        {
          id: 'device-001',
          name: '温度传感器-01',
          type: '温度传感器',
          status: 'active',
          description: '用于监测环境温度的传感器',
          createdAt: '2025-01-15T08:30:00Z',
          lastActivityTime: '2025-05-17T14:25:30Z',
          firmwareVersion: 'v1.2.3',
          telemetry: {
            temperature: '24.5°C',
            humidity: '45%',
            battery: '87%',
          },
        },
        {
          id: 'device-002',
          name: '湿度传感器-01',
          type: '湿度传感器',
          status: 'inactive',
          description: '用于监测环境湿度的传感器',
          createdAt: '2025-01-20T10:15:00Z',
          lastActivityTime: '2025-05-16T09:12:45Z',
          firmwareVersion: 'v1.1.0',
          telemetry: {
            humidity: '52%',
            battery: '23%',
          },
        },
        {
          id: 'device-003',
          name: '压力传感器-01',
          type: '压力传感器',
          status: 'maintenance',
          description: '用于监测管道压力的传感器',
          createdAt: '2025-02-05T14:20:00Z',
          lastActivityTime: '2025-05-15T16:40:12Z',
          firmwareVersion: 'v2.0.1',
          telemetry: {
            pressure: '2.4 MPa',
            temperature: '32.1°C',
            battery: '91%',
          },
        },
      ];
    },
    {
      ttl: 60000, // 缓存60秒
    }
  );

  // 过滤设备
  const filteredDevices = devices
    ? devices.filter((device) => {
        const matchesText = device.name.toLowerCase().includes(filterText.toLowerCase()) ||
                           device.type.toLowerCase().includes(filterText.toLowerCase());
        const matchesStatus = statusFilter === 'all' || device.status === statusFilter;
        return matchesText && matchesStatus;
      })
    : [];

  // 处理设备选择
  const handleSelectDevice = (device) => {
    setSelectedDevice(device);
  };

  // 处理设备更新
  const handleUpdateDevice = (updatedDevice) => {
    // 在实际应用中，这里会调用API更新设备
    console.log('更新设备:', updatedDevice);
    
    // 模拟更新成功
    refetch();
  };

  // 处理设备创建
  const handleCreateDevice = () => {
    const newDevice = {
      id: `device-${Date.now()}`,
      name: '新设备',
      type: '未分类',
      status: 'inactive',
      description: '',
      createdAt: new Date().toISOString(),
      lastActivityTime: new Date().toISOString(),
      firmwareVersion: 'v1.0.0',
      telemetry: {},
    };
    
    setSelectedDevice(newDevice);
  };

  return (
    <div className="device-management">
      <div className="device-management-header">
        <h2 className="device-management-title">设备管理</h2>
        <div className="device-management-actions">
          <RippleButton type="primary" onClick={handleCreateDevice}>
            添加设备
          </RippleButton>
        </div>
      </div>
      
      <div className="device-management-filters">
        <div className="device-management-search">
          <input
            type="text"
            placeholder="搜索设备..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
          />
        </div>
        <div className="device-management-status-filter">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">所有状态</option>
            <option value="active">在线</option>
            <option value="inactive">离线</option>
            <option value="maintenance">维护中</option>
          </select>
        </div>
      </div>
      
      <div className="device-management-content">
        <div className="device-list-container">
          {isLoading ? (
            <div className="device-list-loading">加载中...</div>
          ) : error ? (
            <div className="device-list-error">
              <p>加载设备列表失败</p>
              <RippleButton type="default" size="small" onClick={refetch}>
                重试
              </RippleButton>
            </div>
          ) : (
            <VirtualList
              items={filteredDevices}
              height={500}
              itemHeight={72}
              renderItem={({ item }) => (
                <DeviceListItem
                  device={item}
                  onSelect={handleSelectDevice}
                />
              )}
            />
          )}
        </div>
        
        {selectedDevice && (
          <div className="device-detail-container">
            <DeviceDetail
              device={selectedDevice}
              onClose={() => setSelectedDevice(null)}
              onUpdate={handleUpdateDevice}
            />
          </div>
        )}
      </div>
    </div>
  );
}
