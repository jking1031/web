import React, { useState } from 'react';
import { Card, Form, InputNumber, Button, Row, Col, Divider, Empty, Select, message } from 'antd';
import { CalculatorOutlined, SaveOutlined, ReloadOutlined } from '@ant-design/icons';
import api from '../../api/interceptors';
import styles from './DosingCalculator.module.scss';

const { Option } = Select;

/**
 * 药剂投加计算器组件
 * @returns {JSX.Element} 药剂投加计算器页面
 */
const DosingCalculator = () => {
  const [form] = Form.useForm();
  const [result, setResult] = useState(null);
  const [saveLoading, setSaveLoading] = useState(false);
  
  // 药剂类型选项
  const chemicalOptions = [
    { value: 'pac', label: 'PAC (聚合氯化铝)', density: 1.25, unit: 'kg/L' },
    { value: 'pam', label: 'PAM (聚丙烯酰胺)', density: 0.8, unit: 'g/L' },
    { value: 'naoh', label: '液碱 (NaOH)', density: 1.53, unit: 'kg/L' },
    { value: 'hcl', label: '盐酸 (HCl)', density: 1.19, unit: 'kg/L' },
    { value: 'fecl3', label: '三氯化铁 (FeCl3)', density: 1.42, unit: 'kg/L' },
    { value: 'carbon', label: '活性炭', density: 0.5, unit: 'kg/L' },
    { value: 'custom', label: '自定义药剂', density: 1.0, unit: 'kg/L' },
  ];
  
  // 处理计算
  const handleCalculate = (values) => {
    const { chemicalType, flowRate, targetDose, solutionConcentration, customDensity } = values;
    
    // 确保输入有效
    if (!chemicalType || !flowRate || !targetDose || !solutionConcentration) {
      message.error('请填写所有必填字段');
      return;
    }
    
    // 获取当前选择的药剂信息
    let chemicalInfo = chemicalOptions.find(item => item.value === chemicalType);
    
    // 如果是自定义药剂，使用自定义密度
    if (chemicalType === 'custom' && customDensity) {
      chemicalInfo = { ...chemicalInfo, density: customDensity };
    }
    
    // 计算每小时需要的原液药剂量 (L/h)
    // 公式: 药剂量(L/h) = 流量(m³/h) × 投加量(mg/L) / (浓度(%) × 10 × 密度(kg/L))
    const hourlyDosage = (flowRate * targetDose) / (solutionConcentration * 10 * chemicalInfo.density);
    
    // 计算每天需要的原液药剂量 (L/d)
    const dailyDosage = hourlyDosage * 24;
    
    // 计算药剂消耗量 (kg/d)
    const chemicalConsumption = dailyDosage * chemicalInfo.density * (solutionConcentration / 100);
    
    // 设置结果
    setResult({
      hourlyDosage: parseFloat(hourlyDosage.toFixed(2)),
      dailyDosage: parseFloat(dailyDosage.toFixed(2)),
      chemicalConsumption: parseFloat(chemicalConsumption.toFixed(2)),
      chemicalInfo,
      inputValues: { ...values }
    });
  };
  
  // 处理药剂类型变化
  const handleChemicalTypeChange = (value) => {
    // 如果不是自定义药剂，重置自定义密度字段
    if (value !== 'custom') {
      form.setFieldValue('customDensity', undefined);
    }
  };
  
  // 重置表单
  const handleReset = () => {
    form.resetFields();
    setResult(null);
  };
  
  // 保存计算结果
  const handleSave = async () => {
    if (!result) return;
    
    setSaveLoading(true);
    
    try {
      // 实际项目中应调用API
      // await api.post('/api/calculators/save', {
      //   type: 'dosing',
      //   input: result.inputValues,
      //   output: {
      //     hourlyDosage: result.hourlyDosage,
      //     dailyDosage: result.dailyDosage,
      //     chemicalConsumption: result.chemicalConsumption
      //   }
      // });
      
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 500));
      
      message.success('计算结果已保存');
    } catch (error) {
      console.error('保存计算结果失败', error);
      message.error('保存失败，请重试');
    } finally {
      setSaveLoading(false);
    }
  };
  
  return (
    <div className={styles.calculatorContainer}>
      <h1 className={styles.pageTitle}>药剂投加计算器</h1>
      
      <Row gutter={[24, 24]}>
        <Col xs={24} md={12}>
          <Card title="输入参数" className={styles.inputCard}>
            <Form
              form={form}
              layout="vertical"
              onFinish={handleCalculate}
              initialValues={{
                chemicalType: 'pac',
                flowRate: 1000,
                targetDose: 20,
                solutionConcentration: 10,
              }}
            >
              <Form.Item
                name="chemicalType"
                label="药剂类型"
                rules={[{ required: true, message: '请选择药剂类型' }]}
              >
                <Select 
                  placeholder="选择药剂类型" 
                  onChange={handleChemicalTypeChange}
                >
                  {chemicalOptions.map(option => (
                    <Option key={option.value} value={option.value}>
                      {option.label} ({option.density} {option.unit})
                    </Option>
                  ))}
                </Select>
              </Form.Item>
              
              {form.getFieldValue('chemicalType') === 'custom' && (
                <Form.Item
                  name="customDensity"
                  label="自定义药剂密度 (kg/L)"
                  rules={[
                    { required: true, message: '请输入药剂密度' },
                    { type: 'number', min: 0.1, max: 5, message: '密度必须在0.1到5之间' }
                  ]}
                >
                  <InputNumber min={0.1} max={5} step={0.01} style={{ width: '100%' }} />
                </Form.Item>
              )}
              
              <Form.Item
                name="flowRate"
                label="水量 (m³/h)"
                rules={[
                  { required: true, message: '请输入水量' },
                  { type: 'number', min: 0.1, message: '水量必须大于0.1' }
                ]}
              >
                <InputNumber min={0.1} step={0.1} style={{ width: '100%' }} />
              </Form.Item>
              
              <Form.Item
                name="targetDose"
                label="投加量 (mg/L)"
                rules={[
                  { required: true, message: '请输入投加量' },
                  { type: 'number', min: 0.1, message: '投加量必须大于0.1' }
                ]}
              >
                <InputNumber min={0.1} step={0.1} style={{ width: '100%' }} />
              </Form.Item>
              
              <Form.Item
                name="solutionConcentration"
                label="溶液浓度 (%)"
                rules={[
                  { required: true, message: '请输入溶液浓度' },
                  { type: 'number', min: 0.1, max: 100, message: '浓度必须在0.1%到100%之间' }
                ]}
              >
                <InputNumber min={0.1} max={100} step={0.1} style={{ width: '100%' }} />
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
              </Form.Item>
            </Form>
          </Card>
          
          <Card title="计算说明" className={styles.infoCard}>
            <p>药剂投加量计算基于水量、目标投加量和药剂浓度。</p>
            <p>计算公式：</p>
            <div className={styles.formula}>
              <p>药剂量(L/h) = 流量(m³/h) × 投加量(mg/L) / (浓度(%) × 10 × 密度(kg/L))</p>
              <p>日用量(L/d) = 药剂量(L/h) × 24</p>
              <p>药剂消耗量(kg/d) = 日用量(L/d) × 密度(kg/L) × 浓度(%)/100</p>
            </div>
            <p>注：实际投加中应考虑工艺波动，建议预留一定的余量。</p>
          </Card>
        </Col>
        
        <Col xs={24} md={12}>
          <Card title="计算结果" className={styles.resultCard}>
            {result ? (
              <div className={styles.resultContent}>
                <div className={styles.resultItem}>
                  <span className={styles.resultLabel}>药剂投加量：</span>
                  <span className={styles.resultValue}>{result.hourlyDosage} L/h</span>
                </div>
                
                <div className={styles.resultItem}>
                  <span className={styles.resultLabel}>日用量：</span>
                  <span className={styles.resultValue}>{result.dailyDosage} L/d</span>
                </div>
                
                <div className={styles.resultItem}>
                  <span className={styles.resultLabel}>药剂消耗量：</span>
                  <span className={styles.resultValue}>{result.chemicalConsumption} kg/d</span>
                </div>
                
                <Divider />
                
                <div className={styles.inputSummary}>
                  <h4>输入参数：</h4>
                  <p>药剂类型: {
                    chemicalOptions.find(item => item.value === result.inputValues.chemicalType)?.label
                  }</p>
                  <p>水量: {result.inputValues.flowRate} m³/h</p>
                  <p>投加量: {result.inputValues.targetDose} mg/L</p>
                  <p>溶液浓度: {result.inputValues.solutionConcentration} %</p>
                  {result.inputValues.customDensity && (
                    <p>自定义密度: {result.inputValues.customDensity} kg/L</p>
                  )}
                </div>
                
                <div className={styles.saveAction}>
                  <Button 
                    type="primary" 
                    icon={<SaveOutlined />} 
                    onClick={handleSave}
                    loading={saveLoading}
                  >
                    保存结果
                  </Button>
                </div>
              </div>
            ) : (
              <Empty description="请输入参数并点击计算" />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default DosingCalculator; 