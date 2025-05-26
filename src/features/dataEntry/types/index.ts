/**
 * 数据填报中心类型定义
 */

// 表单模板类型
export interface FormTemplate {
  id: string;
  name: string;
  description?: string;
  category: string;
  schema: FormSchema;
  version: string;
  status: 'draft' | 'published' | 'archived';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  permissions: string[];
}

// 表单Schema类型
export interface FormSchema {
  type: 'object';
  properties: Record<string, FormField>;
  required?: string[];
  'x-component'?: string;
  'x-component-props'?: Record<string, any>;
}

// 表单字段类型
export interface FormField {
  type: string;
  title: string;
  description?: string;
  'x-component': string;
  'x-component-props'?: Record<string, any>;
  'x-decorator'?: string;
  'x-decorator-props'?: Record<string, any>;
  'x-validator'?: any[];
  'x-reactions'?: any[];
  enum?: Array<{ label: string; value: any }>;
  default?: any;
  required?: boolean;
}

// 表单提交数据类型
export interface FormSubmission {
  id: string;
  templateId: string;
  templateName: string;
  data: Record<string, any>;
  submittedBy: string;
  submittedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: string;
  reviewedAt?: string;
  comments?: string;
}

// 用户角色类型
export type UserRole = 'admin' | 'user';

// 权限类型
export interface Permission {
  resource: string;
  actions: string[];
}

// API响应类型
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// 表单分类类型
export interface FormCategory {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  order: number;
}

// 表单验证规则类型
export interface ValidationRule {
  type: 'required' | 'pattern' | 'min' | 'max' | 'custom';
  message: string;
  value?: any;
  validator?: (value: any) => boolean | string;
}

// 表单组件配置类型
export interface ComponentConfig {
  component: string;
  props?: Record<string, any>;
  children?: ComponentConfig[];
} 