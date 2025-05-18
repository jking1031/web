import React, { useState } from 'react';
import { Card, Form, InputNumber, Button, Row, Col, Divider, Empty, message } from 'antd';
import { CalculatorOutlined, SaveOutlined, ReloadOutlined } from '@ant-design/icons';
import api from '../../api/interceptors';
import styles from './PamCalculator.module.scss';

/**
 * PAM稀释计算器组件
 * @returns {JSX.Element} PAM稀释计算器页面
 */
const PamCalculator = () => {
  const [form] = Form.useForm();
  const [result, setResult] = useState(null);
  const [saveLoading, setSaveLoading] = useState(false);
  
  // 处理计算
  const handleCalculate = (values) => {
    const { pamAmount, waterVolume, concentration } = values;
    
    // 确保输入有效
    if (!pamAmount || !waterVolume || !concentration) {
      message.error('请填写所有必填字段');
      return;
    }
    
    // 检查数据有效性
    if (parseFloat(concentration) <= 0 || parseFloat(concentration) > 2) {
      message.error('溶液浓度通常在0.01-2%之间');
      return;
    }
    
    // 计算配制总体积
    const totalVolume = waterVolume + (pamAmount / 1000); // 粉剂体积忽略不计，近似认为总体积等于水体积
    
    // 计算实际浓度（精确度）
    const actualConcentration = (pamAmount / totalVolume) * 100;
    
    // 设置结果
    setResult({
      totalVolume: parseFloat(totalVolume.toFixed(2)),
      actualConcentration: parseFloat(actualConcentration.toFixed(2)),
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
      //   type: 'pam',
      //   input: result.inputValues,
      //   output: {
      //     totalVolume: result.totalVolume,
      //     actualConcentration: result.actualConcentration
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
      <h1 className={styles.pageTitle}>PAM稀释计算器</h1>
      
      <Row gutter={[24, 24]}>
        <Col xs={24} md={12}>
          <Card title="输入参数" className={styles.inputCard}>
            <Form
              form={form}
              layout="vertical"
              onFinish={handleCalculate}
              initialValues={{
                pamAmount: 100,
                waterVolume: 50,
                concentration: 0.2,
              }}
            >
              <Form.Item
                name="pamAmount"
                label="PAM粉剂用量 (g)"
                rules={[
                  { required: true, message: '请输入PAM粉剂用量' },
                  { type: 'number', min: 1, message: '用量必须大于1克' }
                ]}
              >
                <InputNumber min={1} step={1} style={{ width: '100%' }} />
              </Form.Item>
              
              <Form.Item
                name="waterVolume"
                label="水体积 (L)"
                rules={[
                  { required: true, message: '请输入水体积' },
                  { type: 'number', min: 1, message: '体积必须大于1升' }
                ]}
              >
                <InputNumber min={1} step={1} style={{ width: '100%' }} />
              </Form.Item>
              
              <Form.Item
                name="concentration"
                label="目标浓度 (%)"
                rules={[
                  { required: true, message: '请输入目标浓度' },
                  { type: 'number', min: 0.01, max: 2, message: '浓度通常在0.01%到2%之间' }
                ]}
              >
                <InputNumber min={0.01} max={2} step={0.01} style={{ width: '100%' }} />
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
            <p>聚丙烯酰胺(PAM)粉末溶解于水中形成一定浓度的溶液。</p>
            <p>配制时应先将水加入容器，再在搅拌状态下缓慢加入PAM粉末，避免结团。</p>
            <p>PAM溶液应熟化2-4小时后使用，浓度通常不超过0.5%。</p>
            <p>计算公式：</p>
            <div className={styles.formula}>
              <p>总体积 ≈ 水体积 + (PAM重量 / 1000)</p>
              <p>实际浓度 = (PAM重量 / 总体积) × 100%</p>
            </div>
            <p>注：PAM粉剂体积相对较小，计算中忽略不计。</p>
          </Card>
        </Col>
        
        <Col xs={24} md={12}>
          <Card title="计算结果" className={styles.resultCard}>
            {result ? (
              <div className={styles.resultContent}>
                <div className={styles.resultItem}>
                  <span className={styles.resultLabel}>配制总体积：</span>
                  <span className={styles.resultValue}>{result.totalVolume} L</span>
                </div>
                
                <div className={styles.resultItem}>
                  <span className={styles.resultLabel}>实际浓度：</span>
                  <span className={styles.resultValue}>{result.actualConcentration} %</span>
                </div>
                
                <div className={styles.recommendItem}>
                  {result.actualConcentration > 0.5 ? (
                    <div className={styles.warning}>
                      注意：计算得到的浓度高于推荐值(0.5%)，可能导致溶解不充分。
                    </div>
                  ) : null}
                </div>
                
                <Divider />
                
                <div className={styles.inputSummary}>
                  <h4>输入参数：</h4>
                  <p>PAM粉剂用量: {result.inputValues.pamAmount} g</p>
                  <p>水体积: {result.inputValues.waterVolume} L</p>
                  <p>目标浓度: {result.inputValues.concentration} %</p>
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

export default PamCalculator; 