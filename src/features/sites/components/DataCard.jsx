import React from 'react';
import { Card, Statistic, Tag, Badge, Progress, Typography, Space, Divider, Button } from 'antd';
import {
  DashboardOutlined,
  ThunderboltOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  ExperimentOutlined,
  HeartOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  AlertOutlined
} from '@ant-design/icons';

const { Text } = Typography;

/**
 * 通用数据卡片组件
 * 根据数据类型渲染不同的UI
 * 严格按照移动端的数据处理和渲染功能实现
 */
const DataCard = ({ data, type }) => {
  // 根据数据类型渲染不同的内容
  const renderContent = () => {
    // 传感器数据 (进水/出水数据)
    if (data.data !== undefined && data.dw !== undefined) {
      return (
        <Statistic
          value={data.data?.toFixed(2) || '0.00'}
          suffix={data.dw || ''}
          precision={2}
          valueStyle={{ color: data.alarm === 1 ? '#FF5252' : '#1890ff' }}
        />
      );
    }

    // 能耗数据
    if (data.value !== undefined && data.unit !== undefined && data.trend !== undefined) {
      return (
        <>
          <Statistic
            value={data.value?.toFixed(2) || '0.00'}
            suffix={data.unit || 'kWh'}
            precision={2}
            valueStyle={{
              color: data.value > data.threshold ? '#FF5252' : '#1890ff'
            }}
          />
          <div style={{
            marginTop: 8,
            padding: '4px 8px',
            borderRadius: 4,
            display: 'inline-block',
            backgroundColor: data.trend > 0 ? 'rgba(255, 82, 82, 0.1)' : 'rgba(76, 175, 80, 0.1)'
          }}>
            {data.trend > 0 ? (
              <Text style={{ color: '#FF5252' }}>
                <ArrowUpOutlined /> {data.trend.toFixed(1)}%
              </Text>
            ) : (
              <Text style={{ color: '#4CAF50' }}>
                <ArrowDownOutlined /> {Math.abs(data.trend).toFixed(1)}%
              </Text>
            )}
          </div>
          {data.threshold && (
            <div style={{ marginTop: 8 }}>
              <Text type="secondary">阈值: {data.threshold} {data.unit}</Text>
            </div>
          )}
        </>
      );
    }

    // 设备运行时间数据
    if (data.dailyHours !== undefined && data.totalHours !== undefined) {
      return (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ textAlign: 'center', flex: 1 }}>
              <div style={{ fontSize: 20, fontWeight: 'bold', color: '#1890ff' }}>
                {data.dailyHours?.toFixed(1) || '0.0'}
              </div>
              <div style={{ fontSize: 12, color: 'rgba(0, 0, 0, 0.45)' }}>
                今日运行(小时)
              </div>
            </div>
            <Divider type="vertical" style={{ height: 40, margin: '0 16px' }} />
            <div style={{ textAlign: 'center', flex: 1 }}>
              <div style={{ fontSize: 20, fontWeight: 'bold', color: '#1890ff' }}>
                {data.totalHours || '0'}
              </div>
              <div style={{ fontSize: 12, color: 'rgba(0, 0, 0, 0.45)' }}>
                总运行(小时)
              </div>
            </div>
          </div>
          {data.nextMaintenance !== undefined && (
            <div style={{
              marginTop: 8,
              padding: '4px 8px',
              borderRadius: 4,
              backgroundColor: data.nextMaintenance < 100 ? 'rgba(255, 82, 82, 0.1)' : 'rgba(0, 0, 0, 0.05)'
            }}>
              <Text style={{
                color: data.nextMaintenance < 100 ? '#FF5252' : 'rgba(0, 0, 0, 0.65)',
                fontSize: 12
              }}>
                距离下次维护: {data.nextMaintenance} 小时
              </Text>
            </div>
          )}
        </>
      );
    }

    // 工艺参数数据
    if (data.value !== undefined && data.unit !== undefined && data.lowerLimit !== undefined && data.upperLimit !== undefined) {
      const isNormal = data.status === 'normal' ||
        (data.value >= data.lowerLimit && data.value <= data.upperLimit);

      return (
        <>
          <div style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <Text style={{ marginRight: 8 }}>当前值：</Text>
              <Text style={{
                fontSize: 18,
                fontWeight: 'bold',
                color: isNormal ? '#1890ff' : '#FF5252'
              }}>
                {data.value?.toFixed(2) || '0.00'}{data.unit}
              </Text>
            </div>
          </div>
          <div style={{ marginBottom: 8 }}>
            <Text type="secondary">正常范围: {data.lowerLimit.toFixed(1)}-{data.upperLimit.toFixed(1)}{data.unit}</Text>
          </div>
          {data.coefficient && data.coefficient !== 1 && (
            <div style={{ marginBottom: 8 }}>
              <Text type="secondary">系数: {data.coefficient.toFixed(2)}</Text>
            </div>
          )}
          {!isNormal && (
            <div style={{
              marginTop: 8,
              padding: '4px 8px',
              borderRadius: 4,
              backgroundColor: 'rgba(255, 82, 82, 0.1)'
            }}>
              <Text style={{ color: '#FF5252', fontSize: 12 }}>
                工艺参数异常
              </Text>
            </div>
          )}
        </>
      );
    }

    // 化验数据
    if (data.value !== undefined && data.standard !== undefined && data.isQualified !== undefined) {
      return (
        <>
          <div style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <Text style={{ marginRight: 8 }}>检测值：</Text>
              <Text style={{
                fontSize: 18,
                fontWeight: 'bold',
                color: data.isQualified ? '#4CAF50' : '#FF5252'
              }}>
                {data.value?.toFixed(2) || '0.00'}{data.unit}
              </Text>
            </div>
          </div>
          <div style={{ marginBottom: 8 }}>
            <Text type="secondary">标准值: {data.standard}</Text>
          </div>
          <div style={{
            marginTop: 8,
            padding: '4px 8px',
            borderRadius: 4,
            backgroundColor: data.isQualified ? 'rgba(76, 175, 80, 0.1)' : 'rgba(255, 82, 82, 0.1)'
          }}>
            <Badge
              status={data.isQualified ? 'success' : 'error'}
              text={data.isQualified ? '合格' : '不合格'}
            />
          </div>
          {data.sampleTime && (
            <div style={{ marginTop: 8, fontSize: '12px', color: 'rgba(0, 0, 0, 0.45)' }}>
              采样时间: {new Date(data.sampleTime).toLocaleString()}
            </div>
          )}
        </>
      );
    }

    // 设备健康状态
    if (data.healthScore !== undefined) {
      // 计算健康状态
      let healthColor = '#4CAF50'; // 绿色 (良好)
      let statusText = '状态良好';

      if (data.healthScore < 50) {
        healthColor = '#FF5252'; // 红色 (差)
        statusText = '需要维修';
      } else if (data.healthScore < 80) {
        healthColor = '#FF9800'; // 橙色 (一般)
        statusText = '需要关注';
      }

      return (
        <>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
            <div style={{
              width: 60,
              height: 60,
              borderRadius: 30,
              borderWidth: 3,
              borderStyle: 'solid',
              borderColor: healthColor,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: 16
            }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: healthColor }}>
                {data.healthScore}%
              </Text>
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 'bold', color: healthColor, marginBottom: 4 }}>
                {statusText}
              </div>
              {data.lastMaintenance && (
                <div style={{ fontSize: 12, color: 'rgba(0, 0, 0, 0.45)' }}>
                  上次维护: {new Date(data.lastMaintenance).toLocaleDateString()}
                </div>
              )}
              {data.issues && data.issues.length > 0 && (
                <div style={{ fontSize: 12, color: '#FF5252' }}>
                  存在 {data.issues.length} 个问题
                </div>
              )}
            </div>
          </div>
          {data.issues && data.issues.length > 0 && (
            <div style={{ marginTop: 8 }}>
              <Text type="danger">问题:</Text>
              <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
                {data.issues.map((issue, index) => (
                  <li key={index} style={{ fontSize: '12px' }}>{issue}</li>
                ))}
              </ul>
            </div>
          )}
          <Button
            type="primary"
            size="small"
            style={{ marginTop: 8, width: '100%' }}
            onClick={() => {
              // 这里可以添加查看详情的逻辑
              console.log('查看设备健康详情:', data);
            }}
          >
            查看详情
          </Button>
        </>
      );
    }

    // 生产指标
    if (data.current !== undefined && data.target !== undefined && data.efficiency !== undefined) {
      // 安全处理数值
      const current = Number(data.current) || 0;
      const target = Number(data.target) || 1; // 避免除以零
      const efficiency = Number(data.efficiency) || 0;

      // 确定效率文本颜色
      let efficiencyColor = '#FF9800'; // 默认橙色(低效率)
      if (efficiency >= 90) {
        efficiencyColor = '#4CAF50'; // 绿色(高效率)
      } else if (efficiency >= 70) {
        efficiencyColor = '#2196F3'; // 蓝色(中等效率)
      }

      return (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ textAlign: 'center', flex: 1 }}>
              <div style={{ fontSize: 20, fontWeight: 'bold', color: '#1890ff' }}>
                {current}
              </div>
              <div style={{ fontSize: 12, color: 'rgba(0, 0, 0, 0.45)' }}>
                当前产量
              </div>
            </div>
            <Divider type="vertical" style={{ height: 40, margin: '0 16px' }} />
            <div style={{ textAlign: 'center', flex: 1 }}>
              <div style={{ fontSize: 20, fontWeight: 'bold', color: '#1890ff' }}>
                {target}
              </div>
              <div style={{ fontSize: 12, color: 'rgba(0, 0, 0, 0.45)' }}>
                目标产量
              </div>
            </div>
          </div>
          <div style={{ marginTop: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
              <Text style={{ marginRight: 8, fontSize: 12 }}>效率:</Text>
              <Text style={{ color: efficiencyColor, fontSize: 14, fontWeight: 'bold' }}>
                {efficiency}%
              </Text>
            </div>
            <Progress
              percent={efficiency}
              size="small"
              strokeColor={efficiencyColor}
              showInfo={false}
            />
          </div>
          {data.unit && (
            <div style={{ marginTop: 8, fontSize: 12, color: 'rgba(0, 0, 0, 0.45)' }}>
              单位: {data.unit}
            </div>
          )}
        </>
      );
    }

    // 告警信息
    if (data.message !== undefined && data.level !== undefined) {
      // 确定告警级别颜色
      let levelColor = '#2196F3'; // 默认蓝色(低级别)
      if (data.level === 'high') {
        levelColor = '#FF5252'; // 红色(高级别)
      } else if (data.level === 'medium') {
        levelColor = '#FF9800'; // 橙色(中级别)
      }

      return (
        <>
          <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 8 }}>
            <div style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: levelColor,
              marginTop: 6,
              marginRight: 8
            }} />
            <div>
              <div style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 4 }}>
                {data.message}
              </div>
              <div style={{ fontSize: 12, color: 'rgba(0, 0, 0, 0.45)' }}>
                时间: {data.time || new Date(data.timestamp).toLocaleString()}
              </div>
              {data.status && (
                <div style={{
                  marginTop: 4,
                  padding: '2px 6px',
                  borderRadius: 4,
                  display: 'inline-block',
                  fontSize: 12,
                  backgroundColor: data.status === 'confirmed' ? 'rgba(76, 175, 80, 0.1)' : 'rgba(255, 82, 82, 0.1)',
                  color: data.status === 'confirmed' ? '#4CAF50' : '#FF5252'
                }}>
                  {data.status === 'confirmed' ? '已确认' : '未确认'}
                </div>
              )}
            </div>
          </div>
        </>
      );
    }

    // 默认显示
    return (
      <div style={{ padding: '16px 0' }}>
        <Text type="secondary">未知数据类型: {JSON.stringify(data)}</Text>
      </div>
    );
  };

  // 确定卡片的边框颜色
  const getBorderColor = () => {
    // 传感器数据
    if (data.alarm === 1) {
      return '#FF5252';
    }

    // 能耗数据
    if (data.value !== undefined && data.threshold !== undefined && data.value > data.threshold) {
      return '#FF5252';
    }

    // 工艺参数
    if (data.status === 'abnormal' ||
        (data.value !== undefined && data.lowerLimit !== undefined && data.upperLimit !== undefined &&
         (data.value < data.lowerLimit || data.value > data.upperLimit))) {
      return '#FF5252';
    }

    // 化验数据
    if (data.isQualified === false) {
      return '#FF5252';
    }

    // 设备健康状态
    if (data.healthScore !== undefined && data.healthScore < 60) {
      return '#FF5252';
    }

    // 告警信息
    if (data.level === 'high' || data.level === 'medium') {
      return '#FF5252';
    }

    // 默认颜色
    return '#1890ff';
  };

  // 根据类型选择图标
  const getIcon = () => {
    if (type === 'sensor') {
      return <DashboardOutlined />;
    } else if (type === 'energy') {
      return <ThunderboltOutlined />;
    } else if (type === 'runtime') {
      return <ClockCircleOutlined />;
    } else if (type === 'process') {
      return <SettingOutlined />;
    } else if (type === 'laboratory') {
      return <ExperimentOutlined />;
    } else if (type === 'health') {
      return <HeartOutlined />;
    } else if (type === 'alarm') {
      return <AlertOutlined />;
    }
    return null;
  };

  return (
    <Card
      hoverable
      style={{
        borderTop: '4px solid',
        borderTopColor: getBorderColor()
      }}
    >
      <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center' }}>
        {getIcon() && <span style={{ marginRight: 8 }}>{getIcon()}</span>}
        <Text strong>{data.name}</Text>
      </div>
      {renderContent()}
      {data.alarm === 1 && (
        <Tag color="error" style={{ marginTop: 8 }}>异常</Tag>
      )}
    </Card>
  );
};

export default DataCard;
