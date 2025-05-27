/**
 * 表单嵌入类型
 */
export type FormEmbedType = 'link' | 'iframe';

/**
 * 表单状态
 */
export type FormStatus = boolean;

/**
 * 表单结构
 */
export interface Form {
  id: string;
  title: string;
  description?: string;
  embedType: FormEmbedType;
  embedUrl: string;
  embedCode?: string;
  status: FormStatus;
  createdAt: string;
  updatedAt?: string;
  enableWebhook?: boolean;
  webhookKey?: string;
}

/**
 * 表单提交来源
 */
export type SubmissionSource = 'direct' | 'webhook' | 'other';

/**
 * 表单提交状态
 */
export type SubmissionStatus = 'pending' | 'processed' | 'error';

/**
 * 表单提交结构
 */
export interface FormSubmission {
  id: string;
  formId: string;
  data: Record<string, any>;
  submittedAt: string;
  submittedBy: string;
  status: SubmissionStatus;
  source: SubmissionSource;
}

/**
 * Webhook信息
 */
export interface WebhookInfo {
  url: string;
  withKeyUrl: string;
  headers: {
    'Content-Type': string;
    'X-Webhook-Key': string;
  };
  formId?: string;
  formTitle?: string;
  webhookKey?: string;
}

/**
 * API响应结构
 */
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
} 