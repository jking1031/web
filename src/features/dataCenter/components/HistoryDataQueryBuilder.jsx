import React, { useState, useEffect } from 'react';
import { QueryBuilder, formatQuery } from 'react-querybuilder';
import 'react-querybuilder/dist/query-builder.scss';
import { Card, Button, Space, message, Spin, Select, Typography, Row, Col, DatePicker, Radio, Tabs, Tooltip, Alert, Empty, Steps, Collapse, Badge } from 'antd';
import { SearchOutlined, ReloadOutlined, ClockCircleOutlined, SaveOutlined, FolderOpenOutlined, QuestionCircleOutlined, FilterOutlined, RightOutlined } from '@ant-design/icons';
import apiManager from '../../../services/api/core/apiManager';
import './HistoryDataQueryBuilder.scss';
import moment from 'moment';

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;
const { TabPane } = Tabs;
const { Panel } = Collapse;
const { Step } = Steps;

/**
 * 历史数据查询构建器组件
 * 使用 react-querybuilder 实现图形化查询界面
 * 通过 Node-RED 从 MariaDB 获取数据表结构
 */
const HistoryDataQueryBuilder = ({ onQuerySubmit }) => {
  const [query, setQuery] = useState({ combinator: 'and', rules: [] });
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(false);
  const [schemaLoading, setSchemaLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('builder');
  const [timeField, setTimeField] = useState(null);
  const [timeRange, setTimeRange] = useState(null);
  const [quickTimeRange, setQuickTimeRange] = useState('today');
  const [savedQueries, setSavedQueries] = useState([]);
  const [queryMode, setQueryMode] = useState('visual');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  
  // 获取数据库表列表
  const fetchTables = async () => {
    setSchemaLoading(true);
    try {
      const response = await apiManager.call('getDbTables', {}, {
        showError: true
      });

      if (response && response.success && Array.isArray(response.data)) {
        setTables(response.data);
      } else {
        throw new Error('获取数据表失败');
      }
    } catch (error) {
      console.error('获取数据表失败:', error);
      message.error('获取数据表列表失败，请检查 Node-RED 连接');
    } finally {
      setSchemaLoading(false);
    }
  };

  // 获取表字段
  const fetchTableFields = async (tableName) => {
    if (!tableName) return;

    setLoading(true);
    try {
      const response = await apiManager.call('getTableFields', { 
        tableName 
      }, {
        showError: true
      });

      if (response && response.success && Array.isArray(response.data)) {
        // 将字段信息转换为 react-querybuilder 需要的格式
        const fieldOptions = response.data.map(field => ({
          name: field.name,
          label: `${field.label || field.name} (${field.type})`,
          inputType: mapSqlTypeToInputType(field.type),
          // 根据字段类型设置可用的操作符
          operators: getOperatorsForFieldType(field.type),
          sqlType: field.type
        }));
        
        setFields(fieldOptions);
        // 自动识别时间字段
        const timeFieldObj = fieldOptions.find(f => 
          f.name.toLowerCase().includes('time') || 
          f.name.toLowerCase().includes('date') ||
          f.sqlType.toLowerCase().includes('time') ||
          f.sqlType.toLowerCase().includes('date')
        );
        
        if (timeFieldObj) {
          setTimeField(timeFieldObj.name);
          
          // 自动设置今日时间范围
          const start = moment().startOf('day');
          const end = moment().endOf('day');
          setTimeRange([start, end]);
          setQuickTimeRange('today');
          
          // 重置查询
          setQuery({ combinator: 'and', rules: [] });
          
          // 自动前进到时间筛选步骤
          setCurrentStep(1);
        } else {
          setTimeField(null);
          setTimeRange(null);
          setQuery({ combinator: 'and', rules: [] });
        }
      } else {
        throw new Error('获取表字段失败');
      }
    } catch (error) {
      console.error('获取表字段失败:', error);
      message.error('获取表字段失败，请检查 Node-RED 连接');
    } finally {
      setLoading(false);
    }
  };

  // 根据SQL类型映射输入类型
  const mapSqlTypeToInputType = (sqlType) => {
    const type = sqlType.toLowerCase();
    if (type.includes('int') || type.includes('float') || type.includes('double') || type.includes('decimal')) {
      return 'number';
    } else if (type.includes('date') || type.includes('time')) {
      return 'datetime-local';
    } else if (type.includes('bool')) {
      return 'checkbox';
    } else {
      return 'text';
    }
  };

  // 根据字段类型获取可用的操作符
  const getOperatorsForFieldType = (sqlType) => {
    const type = sqlType.toLowerCase();
    const numericOperators = [
      { name: '=', label: '等于' },
      { name: '!=', label: '不等于' },
      { name: '>', label: '大于' },
      { name: '<', label: '小于' },
      { name: '>=', label: '大于等于' },
      { name: '<=', label: '小于等于' },
      { name: 'between', label: '范围内' },
      { name: 'null', label: '为空' },
      { name: 'notNull', label: '非空' },
    ];

    const textOperators = [
      { name: '=', label: '等于' },
      { name: '!=', label: '不等于' },
      { name: 'contains', label: '包含' },
      { name: 'beginsWith', label: '开始于' },
      { name: 'endsWith', label: '结束于' },
      { name: 'null', label: '为空' },
      { name: 'notNull', label: '非空' },
    ];

    const dateOperators = [
      { name: '=', label: '等于' },
      { name: '!=', label: '不等于' },
      { name: '>', label: '晚于' },
      { name: '<', label: '早于' },
      { name: 'between', label: '期间' },
      { name: 'null', label: '为空' },
      { name: 'notNull', label: '非空' },
    ];

    if (type.includes('int') || type.includes('float') || type.includes('double') || type.includes('decimal')) {
      return numericOperators;
    } else if (type.includes('date') || type.includes('time')) {
      return dateOperators;
    } else {
      return textOperators;
    }
  };

  // 初始化时获取表列表和保存的查询
  useEffect(() => {
    // 注册API
    if (!apiManager.registry.get('getDbTables')) {
      apiManager.registry.register('getDbTables', {
        name: '获取数据库表列表',
        url: 'http://localhost:1880/api/database/tables',
        method: 'GET',
        category: 'database',
        status: 'enabled',
        description: '获取MariaDB数据表列表',
        timeout: 10000,
        retries: 1,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    if (!apiManager.registry.get('getTableFields')) {
      apiManager.registry.register('getTableFields', {
        name: '获取表字段列表',
        url: 'http://localhost:1880/api/database/fields',
        method: 'GET',
        category: 'database',
        status: 'enabled',
        description: '获取数据表字段列表',
        timeout: 10000,
        retries: 1,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    if (!apiManager.registry.get('queryHistoryData')) {
      apiManager.registry.register('queryHistoryData', {
        name: '查询历史数据',
        url: 'http://localhost:1880/api/database/query',
        method: 'POST',
        category: 'database',
        status: 'enabled',
        description: '根据条件查询历史数据',
        timeout: 30000,
        retries: 1,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    fetchTables();
    
    // 从localStorage加载保存的查询
    const savedQueriesJson = localStorage.getItem('savedHistoryDataQueries');
    if (savedQueriesJson) {
      try {
        const parsed = JSON.parse(savedQueriesJson);
        setSavedQueries(parsed);
      } catch (e) {
        console.error('解析保存的查询失败:', e);
      }
    }
  }, []);

  // 当选择表格时获取字段
  const handleTableChange = (value) => {
    setSelectedTable(value);
    fetchTableFields(value);
  };

  // 处理快速时间范围选择
  const handleQuickTimeRangeChange = (e) => {
    const value = e.target.value;
    setQuickTimeRange(value);
    
    let start, end;
    const now = moment();
    
    switch(value) {
      case 'today':
        start = moment().startOf('day');
        end = moment().endOf('day');
        break;
      case 'yesterday':
        start = moment().subtract(1, 'days').startOf('day');
        end = moment().subtract(1, 'days').endOf('day');
        break;
      case 'thisWeek':
        start = moment().startOf('week');
        end = moment().endOf('week');
        break;
      case 'lastWeek':
        start = moment().subtract(1, 'weeks').startOf('week');
        end = moment().subtract(1, 'weeks').endOf('week');
        break;
      case 'thisMonth':
        start = moment().startOf('month');
        end = moment().endOf('month');
        break;
      case 'lastMonth':
        start = moment().subtract(1, 'months').startOf('month');
        end = moment().subtract(1, 'months').endOf('month');
        break;
      case 'last24Hours':
        start = moment().subtract(24, 'hours');
        end = moment();
        break;
      case 'last7Days':
        start = moment().subtract(7, 'days').startOf('day');
        end = moment().endOf('day');
        break;
      case 'last30Days':
        start = moment().subtract(30, 'days').startOf('day');
        end = moment().endOf('day');
        break;
      default:
        start = null;
        end = null;
    }
    
    if (start && end) {
      setTimeRange([start, end]);
      
      // 时间范围选择后自动前进到下一步
      if (currentStep === 1) {
        setCurrentStep(2);
      }
    }
  };

  // 处理自定义时间范围选择
  const handleCustomTimeRangeChange = (dates) => {
    if (!dates || dates.length !== 2) {
      setTimeRange(null);
      return;
    }
    
    setTimeRange(dates);
    setQuickTimeRange('custom');
    
    // 时间范围选择后自动前进到下一步
    if (currentStep === 1) {
      setCurrentStep(2);
    }
  };

  // 应用常用查询模板
  const applyQueryTemplate = (templateName) => {
    if (!selectedTable || !fields.length) {
      message.warning('请先选择数据表');
      return;
    }
    
    // 根据模板名称创建预设查询
    let templateQuery = { combinator: 'and', rules: [] };
    
    switch(templateName) {
      case 'latest100':
        if (timeField) {
          templateQuery.rules.push({
            field: timeField,
            operator: '<',
            value: moment().format('YYYY-MM-DDTHH:mm:ss')
          });
          
          message.success('已应用"最近100条数据"模板，添加了时间筛选条件');
        } else {
          message.info('未检测到时间字段，无法应用模板');
        }
        break;
        
      case 'today':
        if (timeField) {
          const start = moment().startOf('day').format('YYYY-MM-DDTHH:mm:ss');
          const end = moment().endOf('day').format('YYYY-MM-DDTHH:mm:ss');
          
          templateQuery.rules.push({
            field: timeField,
            operator: 'between',
            value: [start, end]
          });
          
          setTimeRange([moment().startOf('day'), moment().endOf('day')]);
          setQuickTimeRange('today');
          
          message.success('已应用"今日数据"模板，添加了时间筛选条件');
        } else {
          message.info('未检测到时间字段，无法应用模板');
        }
        break;
        
      case 'abnormal':
        // 寻找数值型字段，用于异常值筛选
        const numericField = fields.find(f => 
          f.inputType === 'number' && 
          !f.name.toLowerCase().includes('id') &&
          !f.name.toLowerCase().includes('time')
        );
        
        if (numericField) {
          templateQuery.rules.push({
            field: numericField.name,
            operator: '>',
            value: 100 // 默认值，用户可以修改
          });
          
          message.success(`已应用"异常值筛选"模板，添加了${numericField.name}大于100的条件`);
        } else {
          message.info('未检测到适合的数值型字段，无法应用模板');
        }
        break;
        
      default:
        message.info('未知模板类型');
    }
    
    setQuery(templateQuery);
  };

  // 保存当前查询
  const saveCurrentQuery = () => {
    if (!selectedTable) {
      message.warning('请先选择数据表');
      return;
    }
    
    // 构建完整的查询对象，包括时间范围条件
    const finalQuery = buildFinalQuery();
    
    if (finalQuery.rules.length === 0) {
      message.warning('请添加至少一个查询条件');
      return;
    }
    
    // 弹出对话框让用户输入查询名称
    const queryName = prompt('请输入查询名称：', `${selectedTable}查询-${new Date().toLocaleString()}`);
    
    if (queryName) {
      const savedQuery = {
        id: Date.now().toString(),
        name: queryName,
        table: selectedTable,
        query: finalQuery,
        timeField: timeField,
        timeRange: timeRange ? [timeRange[0].format('YYYY-MM-DDTHH:mm:ss'), timeRange[1].format('YYYY-MM-DDTHH:mm:ss')] : null,
        createdAt: new Date().toISOString()
      };
      
      const updatedQueries = [...savedQueries, savedQuery];
      setSavedQueries(updatedQueries);
      
      // 保存到localStorage
      localStorage.setItem('savedHistoryDataQueries', JSON.stringify(updatedQueries));
      
      message.success(`查询"${queryName}"已保存`);
    }
  };

  // 加载保存的查询
  const loadSavedQuery = (queryId) => {
    const savedQuery = savedQueries.find(q => q.id === queryId);
    
    if (savedQuery) {
      // 先加载表
      setSelectedTable(savedQuery.table);
      
      fetchTableFields(savedQuery.table).then(() => {
        // 加载查询条件
        setQuery(savedQuery.query);
        
        // 加载时间范围
        if (savedQuery.timeField) {
          setTimeField(savedQuery.timeField);
          
          if (savedQuery.timeRange && savedQuery.timeRange.length === 2) {
            setTimeRange([
              moment(savedQuery.timeRange[0]), 
              moment(savedQuery.timeRange[1])
            ]);
          }
        }
        
        message.success(`已加载查询"${savedQuery.name}"`);
        
        // 自动前进到最后一步
        setCurrentStep(2);
        setActiveTab('builder');
      });
    }
  };

  // 构建最终的查询对象，整合时间范围和高级条件
  const buildFinalQuery = () => {
    // 创建查询的深拷贝，特别是rules数组
    let finalQuery = {
      ...query,
      rules: [...(query.rules || [])] // 确保rules是一个新数组
    };
    
    // 如果有时间字段和时间范围，自动添加时间条件
    if (timeField && timeRange) {
      // 检查是否已有针对此时间字段的条件
      const hasTimeCondition = finalQuery.rules.some(rule => 
        typeof rule.field === 'string' && rule.field === timeField && rule.operator === 'between'
      );
      
      // 如果没有，添加时间范围条件
      if (!hasTimeCondition) {
        finalQuery.rules.push({
          field: timeField,
          operator: 'between',
          value: [
            timeRange[0].format('YYYY-MM-DDTHH:mm:ss'), 
            timeRange[1].format('YYYY-MM-DDTHH:mm:ss')
          ]
        });
      }
    }
    
    return finalQuery;
  };

  // 处理查询提交
  const handleSubmit = () => {
    // 检查表是否选择
    if (!selectedTable) {
      message.warning('请选择数据表');
      return;
    }
    
    // 检查时间条件
    if (!timeField || !timeRange) {
      message.warning('请设置时间范围');
      return;
    }
    
    // 构建最终查询
    const finalQuery = buildFinalQuery();
    
    // 检查是否有查询条件
    if (finalQuery.rules.length === 0) {
      message.warning('请添加至少一个查询条件');
      return;
    }
    
    // 使用 formatQuery 将查询对象转换为 SQL 或其他格式
    const sqlQuery = formatQuery(finalQuery, 'sql');
    console.log('生成的SQL查询:', sqlQuery);
    
    if (onQuerySubmit) {
      onQuerySubmit({
        table: selectedTable,
        query: finalQuery,
        sql: sqlQuery,
        timeRange: timeRange ? [timeRange[0].format('YYYY-MM-DDTHH:mm:ss'), timeRange[1].format('YYYY-MM-DDTHH:mm:ss')] : null,
        timeField: timeField
      });
    }
    
    // 自动切换到已保存查询标签页，方便下次使用
    if (savedQueries.length > 0) {
      // 提示用户查询已执行，并引导保存
      message.success('查询已执行，您可以保存此查询以便下次使用');
    }
  };

  // 刷新表结构
  const handleRefresh = () => {
    if (selectedTable) {
      fetchTableFields(selectedTable);
    } else {
      fetchTables();
    }
  };

  // 渲染步骤内容
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        // 第一步：选择数据表
        return (
          <div className="step-content">
            <Alert
              message="第一步：选择数据表"
              description="选择要查询的历史数据表，系统将自动加载表字段并识别时间字段"
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
            
            <Row gutter={16} align="middle">
              <Col span={18}>
                <Select
                  placeholder="选择数据表"
                  style={{ width: '100%' }}
                  onChange={handleTableChange}
                  value={selectedTable}
                  loading={schemaLoading}
                  size="large"
                >
                  {tables.map(table => (
                    <Option key={table.name} value={table.name}>
                      {table.label || table.name}
                    </Option>
                  ))}
                </Select>
              </Col>
              
              <Col span={6}>
                <Button 
                  icon={<ReloadOutlined />} 
                  onClick={handleRefresh}
                  loading={loading || schemaLoading}
                >
                  刷新表列表
                </Button>
              </Col>
            </Row>
            
            {loading && (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <Spin tip="加载表字段..." />
              </div>
            )}
            
            {selectedTable && !loading && (
              <div style={{ marginTop: 16, textAlign: 'right' }}>
                <Button 
                  type="primary" 
                  onClick={() => setCurrentStep(1)}
                  disabled={!selectedTable || !timeField}
                >
                  下一步：设置时间范围 <RightOutlined />
                </Button>
              </div>
            )}
          </div>
        );
        
      case 1:
        // 第二步：设置时间范围
        return (
          <div className="step-content">
            <Alert
              message="第二步：设置时间范围"
              description={`选择时间字段 "${timeField}" 的查询范围，可以使用快速选项或自定义时间区间`}
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
            
            <Card title={`时间字段: ${timeField}`} size="small" style={{ marginBottom: 16 }}>
              <Row gutter={[16, 16]}>
                <Col span={24}>
                  <Radio.Group 
                    value={quickTimeRange} 
                    onChange={handleQuickTimeRangeChange}
                    buttonStyle="solid"
                    style={{ marginBottom: 16 }}
                    size="large"
                  >
                    <Radio.Button value="today">今天</Radio.Button>
                    <Radio.Button value="yesterday">昨天</Radio.Button>
                    <Radio.Button value="last7Days">近7天</Radio.Button>
                    <Radio.Button value="thisMonth">本月</Radio.Button>
                    <Radio.Button value="last30Days">近30天</Radio.Button>
                  </Radio.Group>
                </Col>
                
                <Col span={24}>
                  <RangePicker 
                    showTime
                    format="YYYY-MM-DD HH:mm:ss"
                    onChange={handleCustomTimeRangeChange}
                    value={timeRange}
                    style={{ width: '100%' }}
                    size="large"
                  />
                </Col>
              </Row>
            </Card>
            
            <Row gutter={8}>
              <Col span={12}>
                <Button 
                  onClick={() => setCurrentStep(0)}
                >
                  返回上一步
                </Button>
              </Col>
              <Col span={12} style={{ textAlign: 'right' }}>
                <Button 
                  type="primary" 
                  onClick={() => setCurrentStep(2)}
                  disabled={!timeRange}
                >
                  下一步：高级筛选 <RightOutlined />
                </Button>
              </Col>
            </Row>
          </div>
        );
        
      case 2:
        // 第三步：高级筛选和执行查询
        return (
          <div className="step-content">
            <Alert
              message="第三步：添加更多筛选条件（可选）"
              description="您可以添加其他字段的筛选条件，或直接执行查询"
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
            
            {/* 时间筛选条件摘要 */}
            <Card 
              title="已设置的查询条件" 
              size="small" 
              style={{ marginBottom: 16 }}
              extra={
                <Button 
                  type="link" 
                  onClick={() => setCurrentStep(1)}
                >
                  修改时间范围
                </Button>
              }
            >
              <Row>
                <Col span={24}>
                  <Badge status="processing" color="green" />
                  <Text strong>时间范围: </Text>
                  <Text>
                    {timeField} 在 {timeRange && timeRange[0].format('YYYY-MM-DD HH:mm:ss')} 至 {timeRange && timeRange[1].format('YYYY-MM-DD HH:mm:ss')} 之间
                  </Text>
                </Col>
                
                {query.rules.length > 0 && (
                  <Col span={24} style={{ marginTop: 8 }}>
                    <Badge status="processing" color="blue" />
                    <Text strong>高级条件: </Text>
                    <Text>{query.rules.length} 个条件</Text>
                    <Button 
                      type="link" 
                      size="small"
                      onClick={() => setShowAdvanced(!showAdvanced)}
                    >
                      {showAdvanced ? '隐藏' : '查看详情'}
                    </Button>
                  </Col>
                )}
              </Row>
            </Card>
            
            {/* 高级筛选条件(可展开/折叠) */}
            <Collapse
              activeKey={showAdvanced ? ['advanced'] : []}
              onChange={() => setShowAdvanced(!showAdvanced)}
              style={{ marginBottom: 16 }}
            >
              <Panel 
                header={
                  <span>
                    <FilterOutlined /> 高级筛选条件构建器
                    <Text type="secondary" style={{ marginLeft: 8 }}>
                      （可选）添加更多筛选条件
                    </Text>
                  </span>
                } 
                key="advanced"
              >
                {fields.length > 0 ? (
                  <QueryBuilder
                    fields={fields}
                    query={query}
                    onQueryChange={q => setQuery(q)}
                    controlClassnames={{
                      queryBuilder: 'queryBuilder-container',
                      ruleGroup: 'ruleGroup-container',
                      combinatorSelector: 'combinator-selector',
                      addRule: 'addRule-button',
                      addGroup: 'addGroup-button',
                      removeGroup: 'removeGroup-button',
                      rule: 'rule-container',
                    }}
                    controlElements={{
                      addRuleAction: props => (
                        <Button 
                          size="small" 
                          onClick={props.handleOnClick}
                          className={props.className}
                        >
                          添加条件
                        </Button>
                      ),
                      addGroupAction: props => (
                        <Button 
                          size="small" 
                          onClick={props.handleOnClick}
                          className={props.className}
                        >
                          添加组
                        </Button>
                      ),
                      removeGroupAction: props => (
                        <Button 
                          size="small" 
                          onClick={props.handleOnClick}
                          className={props.className}
                          danger
                        >
                          删除组
                        </Button>
                      ),
                      removeRuleAction: props => (
                        <Button 
                          size="small" 
                          onClick={props.handleOnClick}
                          className={props.className}
                          danger
                        >
                          删除
                        </Button>
                      )
                    }}
                    translations={{
                      fields: {
                        title: '字段',
                      },
                      operators: {
                        title: '操作符',
                      },
                      value: {
                        title: '值',
                      },
                      combinators: {
                        title: '组合方式',
                        and: '并且',
                        or: '或者',
                      },
                    }}
                    combinators={[
                      { name: 'and', label: '并且' },
                      { name: 'or', label: '或者' },
                    ]}
                  />
                ) : (
                  <Empty description="加载字段中..." />
                )}
              </Panel>
            </Collapse>
            
            {/* 查询模板 */}
            <Card title="快速应用查询模板" size="small" style={{ marginBottom: 16 }}>
              <Space wrap>
                <Button 
                  icon={<ClockCircleOutlined />} 
                  onClick={() => applyQueryTemplate('latest100')}
                >
                  最近100条数据
                </Button>
                <Button 
                  onClick={() => applyQueryTemplate('today')}
                >
                  今日数据
                </Button>
                <Button 
                  onClick={() => applyQueryTemplate('abnormal')}
                >
                  异常值筛选
                </Button>
              </Space>
            </Card>
            
            {/* 按钮组 */}
            <Row gutter={16}>
              <Col span={12}>
                <Space>
                  <Button onClick={() => setCurrentStep(1)}>
                    返回上一步
                  </Button>
                  
                  <Tooltip title="保存当前查询以便将来使用">
                    <Button 
                      icon={<SaveOutlined />} 
                      onClick={saveCurrentQuery}
                    >
                      保存查询
                    </Button>
                  </Tooltip>
                </Space>
              </Col>
              
              <Col span={12} style={{ textAlign: 'right' }}>
                <Button 
                  type="primary" 
                  icon={<SearchOutlined />} 
                  onClick={handleSubmit}
                  size="large"
                >
                  执行查询
                </Button>
              </Col>
            </Row>
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <Card style={{ marginBottom: 16 }}>
      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab="查询构建器" key="builder">
          {/* 步骤指示器 */}
          <Steps current={currentStep} style={{ marginBottom: 24 }}>
            <Step title="选择数据表" description="选择要查询的表" />
            <Step title="设置时间范围" description="设置查询时间区间" />
            <Step title="执行查询" description="添加更多条件并查询" />
          </Steps>
          
          {/* 步骤内容 */}
          {renderStepContent()}
        </TabPane>
        
        <TabPane 
          tab={
            <span>
              <FolderOpenOutlined />
              已保存的查询 {savedQueries.length > 0 && <Badge count={savedQueries.length} size="small" style={{ marginLeft: 5 }} />}
            </span>
          } 
          key="saved"
        >
          {savedQueries.length > 0 ? (
            <Row gutter={[16, 16]}>
              {savedQueries.map(savedQuery => (
                <Col key={savedQuery.id} xs={24} sm={12} md={8} lg={6}>
                  <Card 
                    hoverable
                    size="small" 
                    title={savedQuery.name}
                    extra={
                      <Button type="primary" size="small" onClick={() => loadSavedQuery(savedQuery.id)}>
                        加载
                      </Button>
                    }
                    style={{ height: '100%' }}
                  >
                    <p><Text strong>表: </Text>{savedQuery.table}</p>
                    <p>
                      <Text strong>时间范围: </Text>
                      {savedQuery.timeRange ? (
                        <span>
                          {moment(savedQuery.timeRange[0]).format('YYYY-MM-DD')} 到 {moment(savedQuery.timeRange[1]).format('YYYY-MM-DD')}
                        </span>
                      ) : '未设置'}
                    </p>
                    <p><Text strong>条件数: </Text>{savedQuery.query.rules.length}</p>
                    <p><Text strong>创建时间: </Text>{new Date(savedQuery.createdAt).toLocaleString()}</p>
                  </Card>
                </Col>
              ))}
            </Row>
          ) : (
            <Empty 
              description={
                <span>
                  暂无保存的查询
                  <br />
                  <Button 
                    type="link" 
                    onClick={() => setActiveTab('builder')}
                  >
                    创建并保存一个查询
                  </Button>
                </span>
              } 
            />
          )}
        </TabPane>
      </Tabs>
    </Card>
  );
};

export default HistoryDataQueryBuilder; 