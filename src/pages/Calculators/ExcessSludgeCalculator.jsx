import React, { useState } from 'react';
import { Card, Form, InputNumber, Button, Row, Col, Divider, Empty, message } from 'antd';
import { CalculatorOutlined, SaveOutlined, ReloadOutlined } from '@ant-design/icons';
import api from '../../api/interceptors';
import styles from './ExcessSludgeCalculator.module.scss';

/**
 * 剩余污泥计算器组件
 * @returns {JSX.Element} 剩余污泥计算器页面
 */
const ExcessSludgeCalculator = () => {
  const [form] = Form.useForm();
  const [result, setResult] = useState(null);
  const [saveLoading, setSaveLoading] = useState(false);
  
  // 处理计算
  const handleCalculate = (values) => {
    const { flowRate, bodLoad, codLoad, ssLoad, srt, mlss, reactorVolume } = values;
    
    // 确保输入有效
    if (!flowRate || !bodLoad || !codLoad || !ssLoad || !srt || !mlss || !reactorVolume) {
      message.error('请填写所有必填字段');
      return;
    }
    
    // 计算BOD去除量 (kg/d)
    const bodRemoval = flowRate * bodLoad * 0.9 / 1000; // 假设BOD去除率为90%
    
    // 计算COD去除量 (kg/d)
    const codRemoval = flowRate * codLoad * 0.85 / 1000; // 假设COD去除率为85%
    
    // 计算SS去除量 (kg/d)
    const ssRemoval = flowRate * ssLoad * 0.95 / 1000; // 假设SS去除率为95%
    
    // 计算产泥系数 (kg污泥/kg BOD)
    const sludgeCoefficient = 0.8 - 0.072 * Math.log10(srt);
    
    // 计算BOD基准剩余污泥量 (kg/d)
    const bodBasedSludge = bodRemoval * sludgeCoefficient;
    
    // 计算实际剩余污泥量 (kg/d)，考虑反应器内生物量变化
    const actualSludge = bodBasedSludge + ssRemoval * 0.7;
    
    // 计算反应器中的总生物量 (kg)
    const totalBiomass = mlss * reactorVolume / 1000;
    
    // 计算理论排泥量 (m³/d)，假设排泥浓度为8000 mg/L
    const theoreticalDischarge = actualSludge / 8;
    
    // 计算污泥龄对应的排泥量 (m³/d)
    const srtBasedDischarge = totalBiomass / (srt * 8);
    
    // 取两种计算结果的平均值作为推荐排泥量
    const recommendedDischarge = (theoreticalDischarge + srtBasedDischarge) / 2;
    
    // 设置结果
    setResult({
      bodRemoval: parseFloat(bodRemoval.toFixed(2)),
      codRemoval: parseFloat(codRemoval.toFixed(2)),
      ssRemoval: parseFloat(ssRemoval.toFixed(2)),
      sludgeCoefficient: parseFloat(sludgeCoefficient.toFixed(3)),
      bodBasedSludge: parseFloat(bodBasedSludge.toFixed(2)),
      actualSludge: parseFloat(actualSludge.toFixed(2)),
      totalBiomass: parseFloat(totalBiomass.toFixed(2)),
      theoreticalDischarge: parseFloat(theoreticalDischarge.toFixed(2)),
      srtBasedDischarge: parseFloat(srtBasedDischarge.toFixed(2)),
      recommendedDischarge: parseFloat(recommendedDischarge.toFixed(2)),
      inputValues: { ...values }
    });
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
      //   type: 'excess-sludge',
      //   input: result.inputValues,
      //   output: {
      //     actualSludge: result.actualSludge,
      //     recommendedDischarge: result.recommendedDischarge,
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
      <h1 className={styles.pageTitle}>剩余污泥计算器</h1>
      
      <Row gutter={[24, 24]}>
        <Col xs={24} md={12}>
          <Card title="输入参数" className={styles.inputCard}>
            <Form
              form={form}
              layout="vertical"
              onFinish={handleCalculate}
              initialValues={{
                flowRate: 10000,
                bodLoad: 200,
                codLoad: 400,
                ssLoad: 220,
                srt: 15,
                mlss: 3500,
                reactorVolume: 2000,
              }}
            >
              <Form.Item
                name="flowRate"
                label="进水流量 (m³/d)"
                rules={[
                  { required: true, message: '请输入进水流量' },
                  { type: 'number', min: 1, message: '流量必须大于1' }
                ]}
              >
                <InputNumber min={1} step={10} style={{ width: '100%' }} />
              </Form.Item>
              
              <Form.Item
                name="bodLoad"
                label="BOD负荷 (mg/L)"
                rules={[
                  { required: true, message: '请输入BOD负荷' },
                  { type: 'number', min: 10, message: 'BOD负荷必须大于10' }
                ]}
              >
                <InputNumber min={10} step={10} style={{ width: '100%' }} />
              </Form.Item>
              
              <Form.Item
                name="codLoad"
                label="COD负荷 (mg/L)"
                rules={[
                  { required: true, message: '请输入COD负荷' },
                  { type: 'number', min: 10, message: 'COD负荷必须大于10' }
                ]}
              >
                <InputNumber min={10} step={10} style={{ width: '100%' }} />
              </Form.Item>
              
              <Form.Item
                name="ssLoad"
                label="SS负荷 (mg/L)"
                rules={[
                  { required: true, message: '请输入SS负荷' },
                  { type: 'number', min: 10, message: 'SS负荷必须大于10' }
                ]}
              >
                <InputNumber min={10} step={10} style={{ width: '100%' }} />
              </Form.Item>
              
              <Form.Item
                name="srt"
                label="污泥龄 (d)"
                rules={[
                  { required: true, message: '请输入污泥龄' },
                  { type: 'number', min: 3, max: 30, message: '污泥龄通常在3-30天之间' }
                ]}
              >
                <InputNumber min={3} max={30} step={1} style={{ width: '100%' }} />
              </Form.Item>
              
              <Form.Item
                name="mlss"
                label="活性污泥浓度 (mg/L)"
                rules={[
                  { required: true, message: '请输入活性污泥浓度' },
                  { type: 'number', min: 1000, max: 6000, message: '活性污泥浓度通常在1000-6000 mg/L之间' }
                ]}
              >
                <InputNumber min={1000} max={6000} step={100} style={{ width: '100%' }} />
              </Form.Item>
              
              <Form.Item
                name="reactorVolume"
                label="反应池容积 (m³)"
                rules={[
                  { required: true, message: '请输入反应池容积' },
                  { type: 'number', min: 10, message: '容积必须大于10' }
                ]}
              >
                <InputNumber min={10} step={10} style={{ width: '100%' }} />
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
        </Col>
        
        <Col xs={24} md={12}>
          <Card title="计算结果" className={styles.resultCard}>
            {result ? (
              <div className={styles.resultContent}>
                <div className={styles.resultItem}>
                  <span className={styles.resultLabel}>剩余污泥产量：</span>
                  <span className={styles.resultValue}>{result.actualSludge} kg/d</span>
                </div>
                
                <div className={styles.resultItem}>
                  <span className={styles.resultLabel}>推荐排泥量：</span>
                  <span className={styles.resultValue}>{result.recommendedDischarge} m³/d</span>
                </div>
                
                <Divider />
                
                <div className={styles.detailSection}>
                  <h4>详细计算结果：</h4>
                  <Row gutter={[16, 8]}>
                    <Col span={12} className={styles.detailItem}>
                      <span className={styles.detailLabel}>BOD去除量:</span>
                      <span className={styles.detailValue}>{result.bodRemoval} kg/d</span>
                    </Col>
                    <Col span={12} className={styles.detailItem}>
                      <span className={styles.detailLabel}>COD去除量:</span>
                      <span className={styles.detailValue}>{result.codRemoval} kg/d</span>
                    </Col>
                    <Col span={12} className={styles.detailItem}>
                      <span className={styles.detailLabel}>SS去除量:</span>
                      <span className={styles.detailValue}>{result.ssRemoval} kg/d</span>
                    </Col>
                    <Col span={12} className={styles.detailItem}>
                      <span className={styles.detailLabel}>产泥系数:</span>
                      <span className={styles.detailValue}>{result.sludgeCoefficient}</span>
                    </Col>
                    <Col span={12} className={styles.detailItem}>
                      <span className={styles.detailLabel}>BOD产泥量:</span>
                      <span className={styles.detailValue}>{result.bodBasedSludge} kg/d</span>
                    </Col>
                    <Col span={12} className={styles.detailItem}>
                      <span className={styles.detailLabel}>系统生物量:</span>
                      <span className={styles.detailValue}>{result.totalBiomass} kg</span>
                    </Col>
                  </Row>
                </div>
                
                <Divider />
                
                <div className={styles.inputSummary}>
                  <h4>输入参数：</h4>
                  <p>进水流量: {result.inputValues.flowRate} m³/d</p>
                  <p>BOD负荷: {result.inputValues.bodLoad} mg/L</p>
                  <p>COD负荷: {result.inputValues.codLoad} mg/L</p>
                  <p>SS负荷: {result.inputValues.ssLoad} mg/L</p>
                  <p>污泥龄: {result.inputValues.srt} d</p>
                  <p>活性污泥浓度: {result.inputValues.mlss} mg/L</p>
                  <p>反应池容积: {result.inputValues.reactorVolume} m³</p>
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
          
          <Card title="计算说明" className={styles.infoCard}>
            <p>剩余污泥计算基于进水负荷、污泥龄和活性污泥系统特性。</p>
            <p>计算公式：</p>
            <div className={styles.formula}>
              <p>产泥系数 = 0.8 - 0.072 × log(污泥龄)</p>
              <p>BOD基准剩余污泥量 = BOD去除量 × 产泥系数</p>
              <p>实际剩余污泥量 = BOD基准剩余污泥量 + SS去除量 × 0.7</p>
              <p>理论排泥量 = 剩余污泥量 / 排泥浓度</p>
            </div>
            <p>注：实际应用中请结合现场运行数据进行调整。</p>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ExcessSludgeCalculator; 