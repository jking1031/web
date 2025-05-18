import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Modal, Form, Input, Select, InputNumber, Button, Spin, message, Tabs, Divider, Radio, Row, Col } from 'antd';
import {
  DatabaseOutlined,
  TableOutlined,
  FieldTimeOutlined,
  CodeOutlined,
  SearchOutlined,
  LineChartOutlined,
  AreaChartOutlined,
  BarChartOutlined,
  DashboardOutlined
} from '@ant-design/icons';
import api from '../../api/interceptors';
import styles from './RealTimeTrend.module.scss';

const { Option } = Select;
const { TabPane } = Tabs;

/**
 * 实时趋势编辑器组件
 * @param {Object} props - 组件属性
 * @param {boolean} props.visible - 是否可见
 * @param {Object} props.initialValues - 初始值
 * @param {Function} props.onCancel - 取消回调
 * @param {Function} props.onSave - 保存回调
 * @returns {JSX.Element} 实时趋势编辑器组件
 */
const RealTimeTrendEditor = ({ visible, initialValues, onCancel, onSave }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [tables, setTables] = useState([]);
  const [fields, setFields] = useState([]);
  const [selectedTable, setSelectedTable] = useState(initialValues?.tableName || '');
  const [queryMode, setQueryMode] = useState(initialValues?.queryName ? 'custom' : 'standard');
  const [customQueries, setCustomQueries] = useState([]);
  const [activeTab, setActiveTab] = useState(initialValues?.queryName ? 'custom' : 'standard');

  // 预设的数据库选项
  const dbOptions = [
    { label: 'nodered', value: 'nodered' },
    { label: 'zziot', value: 'zziot' }
  ];

  // 预设的表选项
  const tableOptions = [
    { label: '高铁厂运行数据', value: 'gt_data' },
    { label: '各设施处理量', value: 'leiji' },
    { label: '5000吨运行数据', value: 'yj_5000' },
    { label: '化验数据', value: 'huayan_data' },
    { label: '污泥化验数据', value: 'sludge_data' }
  ];

  // 刷新间隔选项
  const intervalOptions = [
    { label: '30秒', value: 30000 },
    { label: '1分钟', value: 60000 },
    { label: '5分钟', value: 300000 },
    { label: '10分钟', value: 600000 },
    { label: '30分钟', value: 1800000 },
    { label: '1小时', value: 3600000 }
  ];

  // 时间范围选项
  const timeRangeOptions = [
    { label: '最近1小时', value: 1/24 },
    { label: '最近3小时', value: 3/24 },
    { label: '最近6小时', value: 6/24 },
    { label: '最近12小时', value: 12/24 },
    { label: '最近24小时', value: 1 },
    { label: '最近2天', value: 2 },
    { label: '最近3天', value: 3 },
    { label: '最近5天', value: 5 },
    { label: '最近7天', value: 7 }
  ];

  // 数据保存时长选项
  const dataSaveTimeOptions = [
    { label: '1天', value: 1 },
    { label: '3天', value: 3 },
    { label: '7天', value: 7 },
    { label: '14天', value: 14 },
    { label: '30天', value: 30 },
    { label: '90天', value: 90 }
  ];

  // 图表类型选项
  const chartTypeOptions = [
    { label: '折线图', value: 'line', icon: <LineChartOutlined /> },
    { label: '面积图', value: 'area', icon: <AreaChartOutlined /> },
    { label: '柱状图', value: 'column', icon: <BarChartOutlined /> },
    { label: '指标图', value: 'indicator', icon: <DashboardOutlined /> },
  ];

  // 获取查询命令的标志
  const [queriesLoaded, setQueriesLoaded] = useState(false);

  // 防抖计时器引用
  const initTimerRef = useRef(null);
  const queryTimerRef = useRef(null);

  // 获取自定义查询命令 - 使用useCallback避免循环依赖
  const fetchCustomQueries = useCallback(() => {
    try {
      // 从本地存储获取查询命令
      const savedQueries = localStorage.getItem('dataQueries');
      if (savedQueries) {
        // 只获取启用的查询命令
        const queries = JSON.parse(savedQueries).filter(q => q.enabled);
        console.log(`[趋势图编辑器] 加载查询命令: ${queries.length} 个`);
        setCustomQueries(queries);
      } else {
        setCustomQueries([]);
      }
    } catch (error) {
      console.error('[趋势图编辑器] 获取查询命令失败:', error);
      message.error('获取查询命令失败');
      setCustomQueries([]);
    }
  }, []);

  // 初始化表单 - 只在可见性变化时执行
  useEffect(() => {
    if (visible) {
      // 清除之前的计时器
      if (initTimerRef.current) {
        clearTimeout(initTimerRef.current);
      }

      // 获取自定义查询命令
      fetchCustomQueries();
      setQueriesLoaded(false); // 重置标志

      // 打印完整的初始值，用于调试
      console.log('[趋势图编辑器] 接收到的初始值:', {
        title: initialValues.title,
        queryName: initialValues.queryName,
        refreshInterval: initialValues.refreshInterval,
        timeRange: initialValues.timeRange,
        dataSaveTime: initialValues.dataSaveTime,
        chartType: initialValues.chartType,
        unit: initialValues.unit,
        dbName: initialValues.dbName,
        tableName: initialValues.tableName,
        dataField: initialValues.dataField
      });

      // 使用防抖设置表单值，避免频繁更新
      initTimerRef.current = setTimeout(() => {
        // 重置表单
        form.resetFields();

        // 设置基本表单值 - 确保所有字段都被设置
        // 注意：这里直接使用initialValues，避免默认值覆盖传入的值
        const formValues = {
          title: initialValues.title || '实时趋势',
          queryName: initialValues.queryName || '',
          refreshInterval: initialValues.refreshInterval || 60000,
          timeRange: initialValues.timeRange || 1,
          dataSaveTime: initialValues.dataSaveTime || 7,
          chartType: initialValues.chartType || 'line',
          unit: initialValues.unit || '',
          dbName: initialValues.dbName || '',
          tableName: initialValues.tableName || '',
          dataField: initialValues.dataField || ''
        };

        // 只输出关键信息
        console.log('[趋势图编辑器] 设置表单值:', {
          title: formValues.title,
          queryName: formValues.queryName,
          refreshInterval: formValues.refreshInterval / 1000 + '秒',
          timeRange: formValues.timeRange + '天',
          dataSaveTime: formValues.dataSaveTime + '天',
          chartType: formValues.chartType,
          unit: formValues.unit
        });

        // 设置表单值
        form.setFieldsValue(formValues);

        // 设置选中的表
        setSelectedTable(formValues.tableName || '');

        // 如果有选择的表，获取字段列表
        if (formValues.tableName) {
          fetchTableFields(formValues.tableName);
        }

        // 设置查询模式
        setQueryMode(formValues.queryName ? 'custom' : 'standard');
        setActiveTab(formValues.queryName ? 'custom' : 'standard');
      }, 100);
    }

    // 组件卸载时清理
    return () => {
      if (initTimerRef.current) {
        clearTimeout(initTimerRef.current);
      }
    };
  }, [visible, initialValues, form, fetchCustomQueries]);

  // 单独处理查询命令加载后的逻辑
  useEffect(() => {
    // 只在对话框可见且查询命令已加载时执行
    if (visible && customQueries.length > 0 && !queriesLoaded) {
      // 清除之前的计时器
      if (queryTimerRef.current) {
        clearTimeout(queryTimerRef.current);
      }

      // 使用防抖处理查询命令
      queryTimerRef.current = setTimeout(() => {
        setQueriesLoaded(true); // 设置标志，避免重复执行

        // 获取当前表单值
        const currentValues = form.getFieldsValue(true);

        // 特别检查查询命令字段
        if (!currentValues.queryName) {
          // 如果没有查询命令但有可用的查询命令，自动选择第一个
          const enabledQueries = customQueries.filter(q => q.enabled);
          if (enabledQueries.length > 0) {
            const firstQuery = enabledQueries[0];
            form.setFieldValue('queryName', firstQuery.name);
            console.log(`[趋势图编辑器] 自动选择查询命令: ${firstQuery.name}`);
          }
        } else {
          // 验证查询命令是否存在
          const queryExists = customQueries.some(q =>
            q.enabled && q.name === currentValues.queryName
          );

          if (!queryExists) {
            console.warn(`[趋势图编辑器] 查询命令不存在: ${currentValues.queryName}`);

            // 尝试选择一个可用的查询命令
            const enabledQueries = customQueries.filter(q => q.enabled);
            if (enabledQueries.length > 0) {
              const firstQuery = enabledQueries[0];
              form.setFieldValue('queryName', firstQuery.name);
              console.log(`[趋势图编辑器] 替换为: ${firstQuery.name}`);
            }
          } else {
            console.log(`[趋势图编辑器] 使用已配置的查询命令: ${currentValues.queryName}`);
          }
        }

        // 确保所有其他字段都保持不变
        // 这里不需要重新设置其他字段，因为我们只修改了queryName字段

        // 打印当前表单的所有值，确认所有字段都已正确设置
        const allValues = form.getFieldsValue(true);
        console.log('[趋势图编辑器] 查询命令处理后的表单值:', {
          title: allValues.title,
          queryName: allValues.queryName,
          refreshInterval: allValues.refreshInterval / 1000 + '秒',
          timeRange: allValues.timeRange + '天',
          dataSaveTime: allValues.dataSaveTime + '天',
          chartType: allValues.chartType,
          unit: allValues.unit
        });
      }, 200);
    }

    // 组件卸载时清理
    return () => {
      if (queryTimerRef.current) {
        clearTimeout(queryTimerRef.current);
      }
    };
  }, [visible, customQueries, form, queriesLoaded, initialValues]);

  // 获取表字段
  const fetchTableFields = async (tableName) => {
    setLoading(true);
    try {
      // 这里我们模拟获取字段，实际项目中应该调用API
      // 根据不同的表返回不同的字段
      let fieldList = [];

      switch (tableName) {
        case 'gt_data':
          fieldList = [
            { label: '进水流量', value: 'flow_in' },
            { label: '出水流量', value: 'flow_out' },
            { label: '进水pH', value: 'ph_in' },
            { label: '出水pH', value: 'ph_out' },
            { label: '进水COD', value: 'cod_in' },
            { label: '出水COD', value: 'cod_out' }
          ];
          break;
        case 'leiji':
          fieldList = [
            { label: '累计处理量', value: 'total' },
            { label: '日处理量', value: 'daily' },
            { label: '月处理量', value: 'monthly' }
          ];
          break;
        case 'yj_5000':
          fieldList = [
            { label: '进水流量', value: 'flow_in' },
            { label: '出水流量', value: 'flow_out' },
            { label: '进水COD', value: 'cod_in' },
            { label: '出水COD', value: 'cod_out' },
            { label: '进水氨氮', value: 'nh3n_in' },
            { label: '出水氨氮', value: 'nh3n_out' }
          ];
          break;
        case 'huayan_data':
          fieldList = [
            { label: 'COD', value: 'cod' },
            { label: 'BOD', value: 'bod' },
            { label: '氨氮', value: 'nh3n' },
            { label: '总氮', value: 'tn' },
            { label: '总磷', value: 'tp' },
            { label: 'SS', value: 'ss' }
          ];
          break;
        case 'sludge_data':
          fieldList = [
            { label: '含水率', value: 'water_content' },
            { label: '污泥量', value: 'sludge_amount' },
            { label: 'MLSS', value: 'mlss' },
            { label: 'SV30', value: 'sv30' },
            { label: 'SVI', value: 'svi' }
          ];
          break;
        default:
          fieldList = [];
      }

      setFields(fieldList);
    } catch (error) {
      console.error('获取表字段失败:', error);
      message.error('获取表字段失败');
    } finally {
      setLoading(false);
    }
  };

  // 处理表选择变化
  const handleTableChange = (value) => {
    setSelectedTable(value);
    form.setFieldValue('dataField', undefined); // 清空字段选择
    fetchTableFields(value);
  };

  // 由于只使用自定义查询，不再需要处理标签页切换
  const handleTabChange = (key) => {
    // 保留此函数以防将来需要扩展
    console.log('标签页切换已禁用');
  };

  // 处理保存
  const handleSave = () => {
    form.validateFields()
      .then(values => {
        // 获取当前表单的所有值
        const formValues = form.getFieldsValue(true);

        // 打印表单当前值，用于调试
        console.log('[趋势图编辑器] 表单当前值:', formValues);

        // 直接使用表单值，不再合并初始值
        // 这样可以确保用户的修改被完整保存
        let finalValues = { ...formValues };

        // 确保必要字段存在
        if (!finalValues.title) {
          finalValues.title = '实时趋势';
        }

        // 确保数值类型正确
        if (typeof finalValues.refreshInterval === 'string') {
          finalValues.refreshInterval = parseInt(finalValues.refreshInterval, 10);
        } else if (finalValues.refreshInterval === undefined) {
          finalValues.refreshInterval = 60000; // 默认1分钟
        }

        if (typeof finalValues.timeRange === 'string') {
          finalValues.timeRange = parseFloat(finalValues.timeRange);
        } else if (finalValues.timeRange === undefined) {
          finalValues.timeRange = 1; // 默认1天
        }

        if (typeof finalValues.dataSaveTime === 'string') {
          finalValues.dataSaveTime = parseInt(finalValues.dataSaveTime, 10);
        } else if (finalValues.dataSaveTime === undefined) {
          finalValues.dataSaveTime = 7; // 默认7天
        }

        // 特别检查查询命令字段
        if (!finalValues.queryName) {
          message.error('请选择查询命令，否则无法获取数据');
          return; // 不继续保存
        }

        // 确保图表类型字段存在
        if (!finalValues.chartType) {
          finalValues.chartType = 'line';
        }

        // 确保单位字段存在
        if (finalValues.unit === undefined) {
          finalValues.unit = '';
        }

        // 只输出关键信息
        console.log('[趋势图编辑器] 保存配置:', {
          title: finalValues.title,
          queryName: finalValues.queryName,
          refreshInterval: finalValues.refreshInterval / 1000 + '秒',
          timeRange: finalValues.timeRange + '天',
          dataSaveTime: finalValues.dataSaveTime + '天',
          chartType: finalValues.chartType,
          unit: finalValues.unit
        });

        // 确保所有字段都被传递给主组件
        const configToSave = {
          title: finalValues.title,
          queryName: finalValues.queryName,
          refreshInterval: finalValues.refreshInterval,
          timeRange: finalValues.timeRange,
          dataSaveTime: finalValues.dataSaveTime,
          chartType: finalValues.chartType,
          unit: finalValues.unit,
          dbName: finalValues.dbName,
          tableName: finalValues.tableName,
          dataField: finalValues.dataField
        };

        // 打印传递给主组件的完整配置，用于调试
        console.log('[趋势图编辑器] 传递给主组件的完整配置:', configToSave);

        onSave(configToSave);
      })
      .catch(info => {
        console.error('[趋势图编辑器] 表单验证失败:', info);
        message.error('表单验证失败，请检查输入');
      });
  };

  return (
    <Modal
      title="编辑实时趋势"
      open={visible}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          取消
        </Button>,
        <Button key="save" type="primary" onClick={handleSave}>
          保存
        </Button>
      ]}
      destroyOnClose
      className="trend-editor"
      width={600}
    >
      <Spin spinning={loading}>
        <Form
          form={form}
          layout="vertical"
          // 不使用initialValues属性，而是在useEffect中手动设置
        >
          <Form.Item
            name="title"
            label="趋势图标题"
            rules={[{ required: true, message: '请输入趋势图标题' }]}
          >
            <Input placeholder="请输入趋势图标题" />
          </Form.Item>

          <div className="custom-query-section">
            <Form.Item
              name="queryName"
              label="查询命令"
              rules={[{ required: true, message: '请选择查询命令' }]}
              tooltip="必须选择一个查询命令，否则无法获取数据"
            >
              <Select
                placeholder="请选择查询命令"
                disabled={customQueries.length === 0}
                showSearch
                optionFilterProp="children"
                style={{ width: '100%' }}
              >
                {customQueries.map(query => (
                  <Option key={query.id} value={query.name}>
                    <CodeOutlined /> {query.name}
                    {query.description && (
                      <span style={{ color: '#999', marginLeft: 8 }}>
                        ({query.description})
                      </span>
                    )}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            {customQueries.length === 0 ? (
              <div style={{ color: '#ff4d4f', textAlign: 'center', padding: '16px 0', fontWeight: 'bold' }}>
                请先在系统设置中添加查询命令，否则无法获取数据
              </div>
            ) : customQueries.length > 0 && (
              <div style={{ color: '#52c41a', textAlign: 'center', padding: '8px 0' }}>
                已找到 {customQueries.length} 个可用的查询命令
              </div>
            )}
          </div>

          <Divider style={{ margin: '16px 0' }} />

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="refreshInterval"
                label="刷新间隔"
                rules={[{ required: true, message: '请选择刷新间隔' }]}
              >
                <Select placeholder="请选择刷新间隔">
                  {intervalOptions.map(option => (
                    <Option key={option.value} value={option.value}>
                      <FieldTimeOutlined /> {option.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="timeRange"
                label="数据时间范围"
                rules={[{ required: true, message: '请选择数据时间范围' }]}

              >
                <Select placeholder="请选择数据时间范围">
                  {timeRangeOptions.map(option => (
                    <Option key={option.value} value={option.value}>
                      <SearchOutlined /> {option.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="dataSaveTime"
                label="数据保存时长"
                tooltip="超出此时间范围的数据将被自动清除"
                rules={[{ required: true, message: '请选择数据保存时长' }]}

              >
                <Select placeholder="请选择数据保存时长">
                  {dataSaveTimeOptions.map(option => (
                    <Option key={option.value} value={option.value}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="unit"
                label="数值单位"
                tooltip="显示在Y轴和数值旁边的单位"
              >
                <Input placeholder="例如: m³/h, mg/L" />
              </Form.Item>
            </Col>
          </Row>

          <Divider style={{ margin: '16px 0' }} />

          <Form.Item
            name="chartType"
            label="图表类型"
            rules={[{ required: true, message: '请选择图表类型' }]}

          >
            <Radio.Group buttonStyle="solid">
              {chartTypeOptions.map(option => (
                <Radio.Button key={option.value} value={option.value}>
                  {option.icon} {option.label}
                </Radio.Button>
              ))}
            </Radio.Group>
          </Form.Item>
        </Form>
      </Spin>
    </Modal>
  );
};

export default RealTimeTrendEditor;
