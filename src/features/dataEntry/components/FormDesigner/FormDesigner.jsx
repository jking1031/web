/**
 * 表单设计器组件
 * 基于 Formily + Designable 实现可视化表单设计
 * 仅管理员可访问
 */

import React, { useState, useEffect } from 'react';
import { Card, Button, message, Modal, Form, Input, Select, Space, Typography, Divider } from 'antd';
import { SaveOutlined, EyeOutlined, PublishedWithChangesOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { createForm } from '@formily/core';
import { FormProvider, FormConsumer } from '@formily/react';
import { 
  Designer, 
  DesignerToolsWidget, 
  ViewToolsWidget,
  Workspace,
  OutlineTreeWidget,
  ResourceWidget,
  HistoryWidget,
  StudioPanel,
  CompositePanel,
  WorkspacePanel,
  ToolbarPanel,
  ViewportPanel,
  ViewPanel,
  SettingsPanel,
  ComponentTreeWidget
} from '@designable/react';
import { SettingsForm, setNpmCDNRegistry } from '@designable/react-settings-form';
import { 
  createDesigner,
  GlobalRegistry,
  Keyboard,
  KeyCode,
} from '@designable/core';
import {
  transformToSchema,
  transformToTreeNode,
} from '@designable/formily-transformer';
import {
  Form as FormilyForm,
  FormItem,
  DatePicker,
  Checkbox,
  Cascader,
  Editable,
  Input as FormilyInput,
  NumberPicker,
  Switch,
  Password,
  PreviewText,
  Radio,
  Reset,
  Select as FormilySelect,
  Space as FormilySpace,
  Submit,
  TimePicker,
  Transfer,
  TreeSelect,
  Upload,
  FormGrid,
  FormLayout,
  FormTab,
  FormCollapse,
  ArrayTable,
  ObjectContainer,
  ArrayCards,
  ArrayItems,
  FormButtonGroup,
} from '@designable/formily-antd';
import { useAuth } from '../../../../context/AuthContext';
import formTemplateService from '../../services/formTemplateService';
import './FormDesigner.scss';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

// 设置 CDN 注册表
setNpmCDNRegistry('//unpkg.com');

// 全局注册组件
GlobalRegistry.registerDesignerLocales({
  'zh-CN': {
    sources: {
      Inputs: '输入控件',
      Layouts: '布局组件',
      Arrays: '自增组件',
      Displays: '展示组件',
    },
    components: {
      DesignableField: '可设计字段',
      Input: '输入框',
      Select: '选择框',
      Radio: '单选框',
      Checkbox: '复选框',
      DatePicker: '日期选择',
      TimePicker: '时间选择',
      NumberPicker: '数字输入',
      Password: '密码输入',
      PreviewText: '预览文本',
      FormItem: '表单项',
      FormGrid: '网格布局',
      FormLayout: '表单布局',
      FormTab: '选项卡',
      FormCollapse: '折叠面板',
      ArrayTable: '对象数组',
      ArrayCards: '卡片列表',
      ObjectContainer: '对象容器',
    },
  },
});

const FormDesigner = ({ templateId, onSave, onCancel }) => {
  const { user } = useAuth();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [saveModalVisible, setSaveModalVisible] = useState(false);
  const [categories, setCategories] = useState([]);
  const [currentSchema, setCurrentSchema] = useState(null);
  const [designer, setDesigner] = useState(null);

  // 初始化设计器
  useEffect(() => {
    const engine = createDesigner({
      shortcuts: [
        new Keyboard([KeyCode.Meta, KeyCode.S], () => {
          handleSave();
        }),
        new Keyboard([KeyCode.Meta, KeyCode.P], () => {
          setPreviewVisible(true);
        }),
      ],
      rootComponentName: 'Form',
    });
    setDesigner(engine);

    // 加载表单分类
    loadCategories();

    // 如果是编辑模式，加载现有模板
    if (templateId) {
      loadTemplate(templateId);
    }

    return () => {
      engine.unmount();
    };
  }, [templateId]);

  // 加载表单分类
  const loadCategories = async () => {
    try {
      const response = await formTemplateService.getCategories();
      if (response && response.success) {
        setCategories(response.data || []);
      }
    } catch (error) {
      console.error('加载表单分类失败:', error);
    }
  };

  // 加载模板数据
  const loadTemplate = async (id) => {
    try {
      setLoading(true);
      const response = await formTemplateService.getTemplate(id);
      if (response && response.success && response.data) {
        const template = response.data;
        form.setFieldsValue({
          name: template.name,
          description: template.description,
          category: template.category,
        });
        
        // 将 schema 转换为设计器树节点
        if (template.schema && designer) {
          const tree = transformToTreeNode(template.schema);
          designer.setCurrentTree(tree);
        }
      }
    } catch (error) {
      console.error('加载模板失败:', error);
      message.error('加载模板失败');
    } finally {
      setLoading(false);
    }
  };

  // 获取当前设计器的 schema
  const getCurrentSchema = () => {
    if (!designer) return null;
    return transformToSchema(designer.getCurrentTree());
  };

  // 保存模板
  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      const schema = getCurrentSchema();
      
      if (!schema || !schema.properties || Object.keys(schema.properties).length === 0) {
        message.warning('请先设计表单内容');
        return;
      }

      setLoading(true);
      
      const templateData = {
        name: values.name,
        description: values.description,
        category: values.category,
        schema: schema,
        version: '1.0.0',
        status: 'draft',
        createdBy: user?.id || user?.name,
      };

      let response;
      if (templateId) {
        response = await formTemplateService.updateTemplate(templateId, templateData);
      } else {
        response = await formTemplateService.createTemplate(templateData);
      }

      if (response && response.success) {
        message.success(templateId ? '模板更新成功' : '模板创建成功');
        setSaveModalVisible(false);
        if (onSave) {
          onSave(response.data);
        }
      }
    } catch (error) {
      console.error('保存模板失败:', error);
      message.error('保存模板失败');
    } finally {
      setLoading(false);
    }
  };

  // 预览表单
  const handlePreview = () => {
    const schema = getCurrentSchema();
    if (!schema || !schema.properties || Object.keys(schema.properties).length === 0) {
      message.warning('请先设计表单内容');
      return;
    }
    setCurrentSchema(schema);
    setPreviewVisible(true);
  };

  // 发布模板
  const handlePublish = async () => {
    if (!templateId) {
      message.warning('请先保存模板');
      return;
    }

    try {
      setLoading(true);
      const response = await formTemplateService.publishTemplate(templateId);
      if (response && response.success) {
        message.success('模板发布成功');
      }
    } catch (error) {
      console.error('发布模板失败:', error);
      message.error('发布模板失败');
    } finally {
      setLoading(false);
    }
  };

  // 预览表单组件
  const PreviewForm = ({ schema }) => {
    const form = createForm();
    
    return (
      <FormProvider form={form}>
        <FormilyForm
          form={form}
          layout="vertical"
          size="default"
          feedbackLayout="terse"
        >
          <FormConsumer>
            {() => (
              <div>
                {/* 这里会根据 schema 动态渲染表单 */}
                <div style={{ padding: '20px' }}>
                  <Text type="secondary">表单预览功能需要完整的 Formily 渲染器</Text>
                </div>
              </div>
            )}
          </FormConsumer>
        </FormilyForm>
      </FormProvider>
    );
  };

  return (
    <div className="form-designer-container">
      {/* 工具栏 */}
      <div className="designer-toolbar">
        <Space>
          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={onCancel}
          >
            返回
          </Button>
          <Divider type="vertical" />
          <Button 
            type="primary" 
            icon={<SaveOutlined />}
            onClick={() => setSaveModalVisible(true)}
            loading={loading}
          >
            保存模板
          </Button>
          <Button 
            icon={<EyeOutlined />}
            onClick={handlePreview}
          >
            预览
          </Button>
          {templateId && (
            <Button 
              icon={<PublishedWithChangesOutlined />}
              onClick={handlePublish}
              loading={loading}
            >
              发布
            </Button>
          )}
        </Space>
      </div>

      {/* 设计器主体 */}
      <div className="designer-workspace">
        {designer && (
          <Designer engine={designer}>
            <StudioPanel logo={<Title level={4}>表单设计器</Title>}>
              <CompositePanel>
                <CompositePanel.Item title="panels.Component" icon="Component">
                  <ResourceWidget
                    title="sources.Inputs"
                    sources={[
                      FormilyInput,
                      FormilySelect,
                      Radio,
                      Checkbox,
                      DatePicker,
                      TimePicker,
                      NumberPicker,
                      Password,
                      PreviewText,
                    ]}
                  />
                  <ResourceWidget
                    title="sources.Layouts"
                    sources={[FormGrid, FormTab, FormLayout, FormCollapse]}
                  />
                  <ResourceWidget
                    title="sources.Arrays"
                    sources={[ArrayTable, ArrayCards]}
                  />
                  <ResourceWidget
                    title="sources.Displays"
                    sources={[
                      FormilySpace,
                      FormButtonGroup,
                      Submit,
                      Reset,
                    ]}
                  />
                </CompositePanel.Item>
                <CompositePanel.Item title="panels.OutlinedTree" icon="Outline">
                  <OutlineTreeWidget />
                </CompositePanel.Item>
                <CompositePanel.Item title="panels.History" icon="History">
                  <HistoryWidget />
                </CompositePanel.Item>
              </CompositePanel>
              <Workspace id="form">
                <WorkspacePanel>
                  <ToolbarPanel>
                    <DesignerToolsWidget />
                    <ViewToolsWidget use={['DESIGNABLE', 'JSONTREE', 'PREVIEW']} />
                  </ToolbarPanel>
                  <ViewportPanel style={{ height: '100%' }}>
                    <ViewPanel type="DESIGNABLE">
                      {() => (
                        <ComponentTreeWidget
                          components={{
                            Form: FormilyForm,
                            Field: FormItem,
                            Input: FormilyInput,
                            Select: FormilySelect,
                            Radio,
                            Checkbox,
                            DatePicker,
                            TimePicker,
                            NumberPicker,
                            Password,
                            PreviewText,
                            FormGrid,
                            FormTab,
                            FormLayout,
                            FormCollapse,
                            ArrayTable,
                            ArrayCards,
                            ObjectContainer,
                            ArrayItems,
                            Space: FormilySpace,
                            FormButtonGroup,
                            Submit,
                            Reset,
                          }}
                        />
                      )}
                    </ViewPanel>
                    <ViewPanel type="JSONTREE" scrollable={false}>
                      {(tree, onChange) => (
                        <div style={{ padding: '10px' }}>
                          <pre style={{ fontSize: '12px', overflow: 'auto' }}>
                            {JSON.stringify(transformToSchema(tree), null, 2)}
                          </pre>
                        </div>
                      )}
                    </ViewPanel>
                    <ViewPanel type="PREVIEW">
                      {(tree) => {
                        const schema = transformToSchema(tree);
                        return <PreviewForm schema={schema} />;
                      }}
                    </ViewPanel>
                  </ViewportPanel>
                </WorkspacePanel>
              </Workspace>
              <SettingsPanel title="panels.PropertySettings">
                <SettingsForm uploadAction="" />
              </SettingsPanel>
            </StudioPanel>
          </Designer>
        )}
      </div>

      {/* 保存模板对话框 */}
      <Modal
        title={templateId ? "更新模板" : "保存模板"}
        open={saveModalVisible}
        onOk={handleSave}
        onCancel={() => setSaveModalVisible(false)}
        confirmLoading={loading}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="模板名称"
            rules={[{ required: true, message: '请输入模板名称' }]}
          >
            <Input placeholder="请输入模板名称" />
          </Form.Item>
          <Form.Item
            name="description"
            label="模板描述"
          >
            <TextArea rows={3} placeholder="请输入模板描述" />
          </Form.Item>
          <Form.Item
            name="category"
            label="模板分类"
            rules={[{ required: true, message: '请选择模板分类' }]}
          >
            <Select placeholder="请选择模板分类">
              {categories.map(category => (
                <Option key={category.id} value={category.id}>
                  {category.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* 预览对话框 */}
      <Modal
        title="表单预览"
        open={previewVisible}
        onCancel={() => setPreviewVisible(false)}
        footer={null}
        width={800}
        style={{ top: 20 }}
      >
        {currentSchema && <PreviewForm schema={currentSchema} />}
      </Modal>
    </div>
  );
};

export default FormDesigner; 