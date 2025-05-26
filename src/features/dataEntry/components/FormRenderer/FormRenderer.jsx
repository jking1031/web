/**
 * 表单渲染器组件
 * 基于 Formily 动态渲染表单模板
 * 供普通用户填写表单数据
 */

import React, { useState, useEffect } from 'react';
import { Card, Button, message, Space, Typography, Spin, Alert } from 'antd';
import { SaveOutlined, SendOutlined, ArrowLeftOutlined, ReloadOutlined } from '@ant-design/icons';
import { createForm } from '@formily/core';
import { FormProvider, createSchemaField } from '@formily/react';
import { 
  Form,
  FormItem,
  Input,
  Select,
  Radio,
  Checkbox,
  DatePicker,
  TimePicker,
  NumberPicker,
  Password,
  PreviewText,
  FormGrid,
  FormLayout,
  FormTab,
  FormCollapse,
  ArrayTable,
  ArrayCards,
  Space as FormilySpace,
  Submit,
  Reset,
} from '@formily/antd-v5';
import { useAuth } from '../../../../context/AuthContext';
import formSubmissionService from '../../services/formSubmissionService';
import './FormRenderer.scss';

const { Title, Text } = Typography;

// 创建 Schema 字段组件
const SchemaField = createSchemaField({
  components: {
    FormItem,
    Input,
    'Input.TextArea': Input.TextArea,
    Select,
    Radio,
    Checkbox,
    DatePicker,
    TimePicker,
    NumberPicker,
    Password,
    PreviewText,
    FormGrid,
    FormLayout,
    FormTab,
    FormCollapse,
    ArrayTable,
    ArrayCards,
    Space: FormilySpace,
    Submit,
    Reset,
  },
});

const FormRenderer = ({ 
  template, 
  initialData = {}, 
  onSubmit, 
  onCancel, 
  readonly = false,
  showActions = true 
}) => {
  const { user } = useAuth();
  const [form] = useState(() => createForm({
    initialValues: initialData,
    readOnly: readonly,
  }));
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // 重置表单数据
  const handleReset = () => {
    form.reset();
    message.info('表单已重置');
  };

  // 保存草稿
  const handleSaveDraft = async () => {
    try {
      setLoading(true);
      const values = form.getFormState().values;
      
      const submissionData = {
        templateId: template.id,
        templateName: template.name,
        data: values,
        status: 'draft',
        submittedBy: user?.id || user?.name,
      };

      const response = await formSubmissionService.submitForm(submissionData);
      
      if (response && response.success) {
        message.success('草稿保存成功');
        if (onSubmit) {
          onSubmit(response.data, 'draft');
        }
      }
    } catch (error) {
      console.error('保存草稿失败:', error);
      message.error('保存草稿失败');
    } finally {
      setLoading(false);
    }
  };

  // 提交表单
  const handleSubmit = async () => {
    try {
      // 验证表单
      await form.validate();
      
      setSubmitting(true);
      const values = form.getFormState().values;
      
      const submissionData = {
        templateId: template.id,
        templateName: template.name,
        data: values,
        status: 'pending',
        submittedBy: user?.id || user?.name,
        submittedAt: new Date().toISOString(),
      };

      const response = await formSubmissionService.submitForm(submissionData);
      
      if (response && response.success) {
        message.success('表单提交成功');
        if (onSubmit) {
          onSubmit(response.data, 'submitted');
        }
      }
    } catch (error) {
      console.error('提交表单失败:', error);
      
      // 处理验证错误
      if (error.name === 'ValidateError') {
        message.error('请检查表单填写是否正确');
      } else {
        message.error('提交表单失败，请重试');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // 渲染表单内容
  const renderFormContent = () => {
    if (!template || !template.schema) {
      return (
        <Alert
          message="表单模板错误"
          description="无法加载表单模板，请联系管理员"
          type="error"
          showIcon
        />
      );
    }

    return (
      <FormProvider form={form}>
        <Form
          form={form}
          layout="vertical"
          size="default"
          feedbackLayout="terse"
          className="dynamic-form"
        >
          <SchemaField schema={template.schema} />
        </Form>
      </FormProvider>
    );
  };

  // 渲染操作按钮
  const renderActions = () => {
    if (!showActions || readonly) {
      return null;
    }

    return (
      <div className="form-actions">
        <Space>
          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={onCancel}
          >
            返回
          </Button>
          <Button 
            icon={<ReloadOutlined />} 
            onClick={handleReset}
          >
            重置
          </Button>
          <Button 
            icon={<SaveOutlined />}
            onClick={handleSaveDraft}
            loading={loading}
          >
            保存草稿
          </Button>
          <Button 
            type="primary"
            icon={<SendOutlined />}
            onClick={handleSubmit}
            loading={submitting}
          >
            提交表单
          </Button>
        </Space>
      </div>
    );
  };

  return (
    <div className="form-renderer-container">
      {/* 表单头部 */}
      <div className="form-header">
        <Title level={3}>{template?.name || '表单填写'}</Title>
        {template?.description && (
          <Text type="secondary">{template.description}</Text>
        )}
        {readonly && (
          <Alert
            message="只读模式"
            description="当前表单为只读模式，无法编辑"
            type="info"
            showIcon
            style={{ marginTop: 16 }}
          />
        )}
      </div>

      {/* 表单内容 */}
      <Card className="form-content">
        {renderFormContent()}
      </Card>

      {/* 操作按钮 */}
      {renderActions()}
    </div>
  );
};

export default FormRenderer; 