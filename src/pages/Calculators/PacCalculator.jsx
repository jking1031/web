import React, { useState, useEffect } from 'react';
import { Card, Form, InputNumber, Button, Row, Col, Divider, Empty, message, Switch, List, Input, Modal, Table, Space, Popconfirm } from 'antd';
import { CalculatorOutlined, SaveOutlined, ReloadOutlined, HistoryOutlined, DeleteOutlined } from '@ant-design/icons';
import api from '../../api/interceptors';
import styles from './PacCalculator.module.scss';

/**
 * PAC药剂计算器组件
 * @returns {JSX.Element} PAC药剂计算器页面
 */
const PacCalculator = () => {
  const [form] = Form.useForm();
  const [result, setResult] = useState(null);
  const [saveLoading, setSaveLoading] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [histories, setHistories] = useState([]);
  const [schemeName, setSchemeName] = useState('');
  
  // 从本地存储加载历史方案
  useEffect(() => {
    loadHistories();
  }, []);
  
  // 加载历史方案
  const loadHistories = () => {
    try {
      const savedHistories = localStorage.getItem('pacHistories');
      if (savedHistories) {
        setHistories(JSON.parse(savedHistories));
      }
    } catch (error) {
      console.error('加载历史方案失败', error);
      message.error('加载历史方案失败');
    }
  };
  
  // 处理计算
  const handleCalculate = (values) => {
    const { isContinuousFlow, waterVolume, effectiveContent, targetConcentration } = values;
    
    // 确保输入有效
    if (!waterVolume || !effectiveContent || !targetConcentration) {
      message.error('请填写所有必填字段');
      return;
    }
    
    // 计算PAC用量 (kg)
    const pacAmount = (waterVolume * targetConcentration) / effectiveContent;
    
    // 设置结果
    setResult({
      pacAmount: parseFloat(pacAmount.toFixed(2)),
      hourlyPac: isContinuousFlow ? parseFloat(pacAmount.toFixed(2)) : 0,
      fixedPac: !isContinuousFlow ? parseFloat(pacAmount.toFixed(2)) : 0,
      inputValues: { ...values }
    });
  };
  
  // 重置表单
  const handleReset = () => {
    form.resetFields();
    setResult(null);
  };
  
  // 保存方案
  const handleSave = () => {
    if (!result) {
      message.warning('请先进行计算');
      return;
    }
    
    if (!schemeName.trim()) {
      message.warning('请输入方案名称');
      return;
    }
    
    try {
      setSaveLoading(true);
      
      const now = new Date();
      const dateString = now.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
      
      // 创建方案对象
      const newScheme = {
        id: Date.now().toString(),
        date: dateString,
        name: schemeName,
        ...result.inputValues,
        results: {
          pacAmount: result.pacAmount,
        }
      };
      
      let updatedHistories = [...histories, newScheme];
      // 限制最多保存50条记录
      if (updatedHistories.length > 50) {
        updatedHistories = updatedHistories.slice(updatedHistories.length - 50);
      }
      
      localStorage.setItem('pacHistories', JSON.stringify(updatedHistories));
      setHistories(updatedHistories);
      setSchemeName('');
      message.success('方案已保存');
    } catch (error) {
      console.error('保存方案失败:', error);
      message.error('保存方案失败');
    } finally {
      setSaveLoading(false);
    }
  };
  
  // 加载方案
  const loadScheme = (scheme) => {
    try {
      form.setFieldsValue({
        isContinuousFlow: scheme.isContinuousFlow,
        waterVolume: scheme.waterVolume,
        effectiveContent: scheme.effectiveContent,
        targetConcentration: scheme.targetConcentration,
      });
      
      // 触发计算以更新结果
      handleCalculate(scheme);
      setShowHistoryModal(false);
    } catch (error) {
      console.error('加载方案失败:', error);
      message.error('加载方案失败');
    }
  };
  
  // 删除方案
  const deleteScheme = (id) => {
    try {
      const updatedHistories = histories.filter(item => item.id !== id);
      localStorage.setItem('pacHistories', JSON.stringify(updatedHistories));
      setHistories(updatedHistories);
      message.success('方案已删除');
    } catch (error) {
      console.error('删除方案失败:', error);
      message.error('删除方案失败');
    }
  };
  
  // 历史方案表格列配置
  const historyColumns = [
    {
      title: '方案名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '创建时间',
      dataIndex: 'date',
      key: 'date',
    },
    {
      title: '模式',
      key: 'mode',
      render: (_, record) => (
        <span>{record.isContinuousFlow ? '连续投加' : '一次投加'}</span>
      ),
    },
    {
      title: '水量 (m³/h)',
      dataIndex: 'waterVolume',
      key: 'waterVolume',
    },
    {
      title: 'PAC用量 (kg)',
      dataIndex: ['results', 'pacAmount'],
      key: 'pacAmount',
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="small">
          <Button type="primary" size="small" onClick={() => loadScheme(record)}>
            加载
          </Button>
          <Popconfirm
            title="确定要删除此方案吗?"
            onConfirm={() => deleteScheme(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="primary" danger size="small" icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];
  
  return (
    <div className={styles.calculatorContainer}>
      <h1 className={styles.pageTitle}>PAC投加计算器</h1>
      
      <Row gutter={[24, 24]}>
        <Col xs={24} md={12}>
          <Card title="输入参数" className={styles.inputCard}>
            <Form
              form={form}
              layout="vertical"
              onFinish={handleCalculate}
              initialValues={{
                isContinuousFlow: false,
                waterVolume: 1000,
                effectiveContent: 26,
                targetConcentration: 10,
              }}
            >
              <Form.Item
                name="isContinuousFlow"
                label="投加模式"
                valuePropName="checked"
              >
                <Switch 
                  checkedChildren="连续投加" 
                  unCheckedChildren="一次投加" 
                />
              </Form.Item>
              
              <Form.Item
                name="waterVolume"
                label="水量 (m³/h)"
                rules={[
                  { required: true, message: '请输入水量' },
                  { type: 'number', min: 1, message: '水量必须大于1' }
                ]}
              >
                <InputNumber min={1} step={100} style={{ width: '100%' }} />
              </Form.Item>
              
              <Form.Item
                name="effectiveContent"
                label="PAC有效含量 (%)"
                rules={[
                  { required: true, message: '请输入PAC有效含量' },
                  { type: 'number', min: 1, max: 100, message: '有效含量必须在1%-100%之间' }
                ]}
              >
                <InputNumber min={1} max={100} step={1} style={{ width: '100%' }} />
              </Form.Item>
              
              <Form.Item
                name="targetConcentration"
                label="目标投加浓度 (mg/L)"
                rules={[
                  { required: true, message: '请输入目标投加浓度' },
                  { type: 'number', min: 1, max: 100, message: '浓度通常在1-100 mg/L之间' }
                ]}
              >
                <InputNumber min={1} max={100} step={1} style={{ width: '100%' }} />
              </Form.Item>
              
              <Form.Item className={styles.actionButtons}>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  icon={<CalculatorOutlined />}
                >
                  计算
                </Button>
                <Button 
                  onClick={handleReset}
                  icon={<ReloadOutlined />}
                >
                  重置
                </Button>
                <Button 
                  type="dashed" 
                  onClick={() => setShowHistoryModal(true)}
                  icon={<HistoryOutlined />}
                >
                  历史方案
                </Button>
              </Form.Item>
            </Form>
          </Card>
          
          <Card title="计算说明" className={styles.infoCard}>
            <p>PAC (聚合氯化铝) 是常用的混凝剂，计算投加量需要考虑水量、有效含量和目标浓度。</p>
            <p>计算公式：</p>
            <div className={styles.formula}>
              <p>PAC投加量(kg) = 水量(m³) × 投加浓度(mg/L) ÷ 有效含量(%)</p>
            </div>
            <p>注：实际投加中应考虑水质情况，可能需要调整投加量。</p>
          </Card>
        </Col>
        
        <Col xs={24} md={12}>
          <Card title="计算结果" className={styles.resultCard}>
            {result ? (
              <div className={styles.resultContent}>
                <div className={styles.resultItem}>
                  <span className={styles.resultLabel}>PAC总投加量：</span>
                  <span className={styles.resultValue}>{result.pacAmount} kg</span>
                </div>
                
                {result.inputValues.isContinuousFlow ? (
                  <div className={styles.resultItem}>
                    <span className={styles.resultLabel}>连续投加量：</span>
                    <span className={styles.resultValue}>{result.hourlyPac} kg/h</span>
                  </div>
                ) : (
                <div className={styles.resultItem}>
                    <span className={styles.resultLabel}>一次投加量：</span>
                    <span className={styles.resultValue}>{result.fixedPac} kg</span>
                </div>
                )}
                
                <Divider />
                
                <div className={styles.inputSummary}>
                  <h4>输入参数：</h4>
                  <p>投加模式: {result.inputValues.isContinuousFlow ? '连续投加' : '一次投加'}</p>
                  <p>水量: {result.inputValues.waterVolume} m³/h</p>
                  <p>PAC有效含量: {result.inputValues.effectiveContent} %</p>
                  <p>目标投加浓度: {result.inputValues.targetConcentration} mg/L</p>
                </div>
                
                <div className={styles.saveSection}>
                  <Row gutter={[16, 16]} align="middle">
                    <Col span={16}>
                      <Input 
                        placeholder="输入方案名称" 
                        value={schemeName}
                        onChange={(e) => setSchemeName(e.target.value)}
                        maxLength={20}
                      />
                    </Col>
                    <Col span={8}>
                  <Button 
                    type="primary" 
                    icon={<SaveOutlined />} 
                    onClick={handleSave}
                    loading={saveLoading}
                        disabled={!schemeName.trim()}
                  >
                        保存
                  </Button>
                    </Col>
                  </Row>
                </div>
              </div>
            ) : (
              <Empty description="请输入参数并点击计算" />
            )}
          </Card>
        </Col>
      </Row>
      
      {/* 历史方案模态框 */}
      <Modal
        title="历史方案"
        open={showHistoryModal}
        onCancel={() => setShowHistoryModal(false)}
        footer={null}
        width={900}
      >
        <Table 
          dataSource={histories} 
          columns={historyColumns} 
          rowKey="id" 
          pagination={{ pageSize: 5 }}
          locale={{ emptyText: '暂无保存的方案' }}
        />
      </Modal>
    </div>
  );
};

export default PacCalculator; 