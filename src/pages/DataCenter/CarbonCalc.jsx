import React, { useState } from 'react';
import { Card, Form, InputNumber, Button, Row, Col, Divider, Statistic, message, Select, Spin } from 'antd';
import { CalculatorOutlined, ReloadOutlined, SaveOutlined } from '@ant-design/icons';
import api from '../../api/interceptors';
import styles from './CarbonCalc.module.scss';

const { Option } = Select;

/**
 * 碳排放计算器组件
 * @returns {JSX.Element} 碳排放计算页面
 */
const CarbonCalc = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [saveLoading, setSaveLoading] = useState(false);
  
  // 处理计算
  const handleCalculate = async (values) => {
    try {
      setLoading(true);
      
      // 实际项目中应调用API
      // const response = await api.post('/api/carbon/calculate', values);
      // setResult(response.data);
      
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 计算逻辑 (简化版)
      const { flowRate, cod, energyConsumption, treatmentProcess } = values;
      
      // 碳排放系数 (根据处理工艺不同)
      const carbonFactor = {
        'A2O': 0.56,
        'SBR': 0.62,
        'MBR': 0.48,
        'MBBR': 0.52
      }[treatmentProcess] || 0.6;
      
      // 计算碳排放总量 (简化公式)
      const carbonEmission = (flowRate * cod * 0.001 * carbonFactor) + (energyConsumption * 0.785);
      
      // 计算减排量 (假设直排系数为1.2)
      const directEmission = flowRate * cod * 0.001 * 1.2;
      const reductionAmount = directEmission - carbonEmission;
      
      // 计算减排率
      const reductionRate = (reductionAmount / directEmission) * 100;
      
      setResult({
        carbonEmission: parseFloat(carbonEmission.toFixed(2)),
        directEmission: parseFloat(directEmission.toFixed(2)),
        reductionAmount: parseFloat(reductionAmount.toFixed(2)),
        reductionRate: parseFloat(reductionRate.toFixed(2)),
        energyFactor: 0.785,
        carbonFactor,
        inputValues: values
      });
    } catch (error) {
      console.error('计算失败', error);
      message.error('计算失败，请重试');
    } finally {
      setLoading(false);
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
    
    try {
      setSaveLoading(true);
      
      // 实际项目中应调用API
      // await api.post('/api/carbon/save', {
      //   ...result.inputValues,
      //   results: {
      //     carbonEmission: result.carbonEmission,
      //     reductionAmount: result.reductionAmount,
      //     reductionRate: result.reductionRate
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
    <div className={styles.carbonCalcContainer}>
      <h1 className={styles.pageTitle}>碳排放计算器</h1>
      
      <Row gutter={[24, 24]}>
        <Col xs={24} md={12}>
          <Card title="输入参数" className={styles.inputCard}>
            <Form
              form={form}
              layout="vertical"
              onFinish={handleCalculate}
              initialValues={{
                flowRate: 10000,
                cod: 80,
                energyConsumption: 5000,
                treatmentProcess: 'A2O'
              }}
            >
              <Form.Item
                name="flowRate"
                label="处理水量 (m³/d)"
                rules={[
                  { required: true, message: '请输入处理水量' },
                  { type: 'number', min: 100, message: '处理水量必须大于100' }
                ]}
              >
                <InputNumber min={100} step={100} style={{ width: '100%' }} />
              </Form.Item>
              
              <Form.Item
                name="cod"
                label="出水COD (mg/L)"
                rules={[
                  { required: true, message: '请输入出水COD' },
                  { type: 'number', min: 1, max: 100, message: '出水COD通常在1-100之间' }
                ]}
              >
                <InputNumber min={1} max={100} step={1} style={{ width: '100%' }} />
              </Form.Item>
              
              <Form.Item
                name="energyConsumption"
                label="能耗 (kWh/d)"
                rules={[
                  { required: true, message: '请输入能耗' },
                  { type: 'number', min: 10, message: '能耗必须大于10' }
                ]}
              >
                <InputNumber min={10} step={10} style={{ width: '100%' }} />
              </Form.Item>
              
              <Form.Item
                name="treatmentProcess"
                label="处理工艺"
                rules={[{ required: true, message: '请选择处理工艺' }]}
              >
                <Select placeholder="选择处理工艺">
                  <Option value="A2O">A2O工艺</Option>
                  <Option value="SBR">SBR工艺</Option>
                  <Option value="MBR">MBR工艺</Option>
                  <Option value="MBBR">MBBR工艺</Option>
                </Select>
              </Form.Item>
              
              <Form.Item className={styles.actionButtons}>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  icon={<CalculatorOutlined />}
                  loading={loading}
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
            <p>碳排放计算基于水量、水质和能耗数据，结合不同工艺的排放系数。</p>
            <p>计算公式：</p>
            <div className={styles.formula}>
              <p>碳排放量 = 污水处理排放 + 能源消耗排放</p>
              <p>污水处理排放 = 水量 × COD × 处理工艺排放系数</p>
              <p>能源消耗排放 = 能耗 × 电力排放因子(0.785)</p>
            </div>
            <p>注：实际计算中应考虑更多因素，本计算器仅提供简化估算。</p>
          </Card>
        </Col>
        
        <Col xs={24} md={12}>
          <Card title="计算结果" className={styles.resultCard}>
            <Spin spinning={loading}>
              {result ? (
                <div className={styles.resultContent}>
                  <Row gutter={[16, 16]}>
                    <Col span={12}>
                      <Statistic 
                        title="碳排放量" 
                        value={result.carbonEmission} 
                        suffix="吨CO₂/d" 
                        precision={2} 
                      />
                    </Col>
                    <Col span={12}>
                      <Statistic 
                        title="直排碳排放" 
                        value={result.directEmission} 
                        suffix="吨CO₂/d" 
                        precision={2} 
                      />
                    </Col>
                    <Col span={12}>
                      <Statistic 
                        title="减排量" 
                        value={result.reductionAmount} 
                        suffix="吨CO₂/d" 
                        precision={2}
                        valueStyle={{ color: '#3f8600' }}
                      />
                    </Col>
                    <Col span={12}>
                      <Statistic 
                        title="减排率" 
                        value={result.reductionRate} 
                        suffix="%" 
                        precision={2}
                        valueStyle={{ color: '#3f8600' }}
                      />
                    </Col>
                  </Row>
                  
                  <Divider />
                  
                  <div className={styles.resultDetails}>
                    <h4>计算详情：</h4>
                    <p>碳排放系数: {result.carbonFactor}</p>
                    <p>电力排放因子: {result.energyFactor} tCO₂/MWh</p>
                  </div>
                  
                  <Divider />
                  
                  <div className={styles.inputSummary}>
                    <h4>输入参数：</h4>
                    <p>处理水量: {result.inputValues.flowRate} m³/d</p>
                    <p>出水COD: {result.inputValues.cod} mg/L</p>
                    <p>能耗: {result.inputValues.energyConsumption} kWh/d</p>
                    <p>处理工艺: {
                      {
                        'A2O': 'A2O工艺',
                        'SBR': 'SBR工艺',
                        'MBR': 'MBR工艺',
                        'MBBR': 'MBBR工艺'
                      }[result.inputValues.treatmentProcess]
                    }</p>
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
                <div className={styles.emptyResult}>
                  <p>请输入参数并点击计算</p>
                </div>
              )}
            </Spin>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default CarbonCalc; 