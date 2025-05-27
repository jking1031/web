/**
 * 项目主要TypeScript类型定义
 * 为项目TypeScript迁移提供基础类型支持
 */

// ================ 基础类型 ================

/**
 * API响应基础类型
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  code?: string | number;
  timestamp?: string;
}

/**
 * 分页响应类型
 */
export interface PaginatedResponse<T = any> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * 用户类型
 */
export interface User {
  id: string;
  username: string;
  name: string;
  email?: string;
  role: UserRole;
  avatar?: string;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt?: string;
  permissions?: string[];
}

/**
 * 用户角色类型
 */
export type UserRole = 'admin' | 'operator' | 'viewer' | 'maintainer';

// ================ 站点相关类型 ================

/**
 * 站点类型
 */
export interface Site {
  id: string;
  name: string;
  code: string;
  description?: string;
  location?: {
    latitude: number;
    longitude: number;
    address: string;
  };
  capacity?: number;
  type: SiteType;
  status: SiteStatus;
  createdAt: string;
  updatedAt?: string;
  devices?: Device[];
  statistics?: SiteStatistics;
}

/**
 * 站点类型
 */
export type SiteType = 'wwtp' | 'pump_station' | 'monitoring_station' | 'other';

/**
 * 站点状态
 */
export type SiteStatus = 'online' | 'offline' | 'maintenance' | 'alarm';

/**
 * 站点统计信息
 */
export interface SiteStatistics {
  totalDevices: number;
  onlineDevices: number;
  offlineDevices: number;
  alarmCount: number;
  averageUptime: number;
}

// ================ 设备相关类型 ================

/**
 * 设备类型
 */
export interface Device {
  id: string;
  name: string;
  code: string;
  type: DeviceType;
  category: DeviceCategory;
  status: DeviceStatus;
  siteId: string;
  description?: string;
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  installDate?: string;
  lastMaintenanceDate?: string;
  nextMaintenanceDate?: string;
  specifications?: Record<string, any>;
  dataPoints?: DataPoint[];
  createdAt: string;
  updatedAt?: string;
}

/**
 * 设备类型
 */
export type DeviceType = 'sensor' | 'actuator' | 'controller' | 'pump' | 'valve' | 'meter' | 'analyzer' | 'other';

/**
 * 设备分类
 */
export type DeviceCategory = 'water_quality' | 'flow' | 'level' | 'pressure' | 'temperature' | 'power' | 'control' | 'other';

/**
 * 设备状态
 */
export type DeviceStatus = 'online' | 'offline' | 'alarm' | 'maintenance' | 'error';

// ================ 数据点相关类型 ================

/**
 * 数据点类型
 */
export interface DataPoint {
  id: string;
  name: string;
  code: string;
  unit: string;
  dataType: DataType;
  deviceId: string;
  description?: string;
  minValue?: number;
  maxValue?: number;
  precision?: number;
  readOnly?: boolean;
  alarmLow?: number;
  alarmHigh?: number;
  warningLow?: number;
  warningHigh?: number;
  createdAt: string;
  updatedAt?: string;
}

/**
 * 数据类型
 */
export type DataType = 'number' | 'boolean' | 'string' | 'enum' | 'object' | 'array';

/**
 * 实时数据
 */
export interface RealtimeData {
  pointId: string;
  value: any;
  quality: DataQuality;
  timestamp: string;
  unit?: string;
}

/**
 * 数据质量
 */
export type DataQuality = 'good' | 'bad' | 'uncertain' | 'offline';

/**
 * 历史数据
 */
export interface HistoricalData {
  pointId: string;
  values: Array<{
    value: any;
    timestamp: string;
    quality: DataQuality;
  }>;
  startTime: string;
  endTime: string;
}

// ================ 告警相关类型 ================

/**
 * 告警类型
 */
export interface Alarm {
  id: string;
  title: string;
  message: string;
  level: AlarmLevel;
  type: AlarmType;
  status: AlarmStatus;
  sourceId: string;
  sourceType: AlarmSourceType;
  triggeredAt: string;
  acknowledgedAt?: string;
  acknowledgedBy?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  data?: Record<string, any>;
}

/**
 * 告警级别
 */
export type AlarmLevel = 'critical' | 'major' | 'minor' | 'warning' | 'info';

/**
 * 告警类型
 */
export type AlarmType = 'threshold' | 'communication' | 'system' | 'security' | 'maintenance' | 'other';

/**
 * 告警状态
 */
export type AlarmStatus = 'active' | 'acknowledged' | 'resolved' | 'suppressed';

/**
 * 告警源类型
 */
export type AlarmSourceType = 'device' | 'site' | 'system' | 'user';

// ================ 表单相关类型 ================

/**
 * 表单模板
 */
export interface FormTemplate {
  id: string;
  name: string;
  description?: string;
  category: string;
  version: string;
  status: FormTemplateStatus;
  schema: FormSchema;
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
  permissions?: string[];
}

/**
 * 表单模板状态
 */
export type FormTemplateStatus = 'draft' | 'published' | 'archived' | 'deprecated';

/**
 * 表单Schema
 */
export interface FormSchema {
  type: 'object';
  properties: Record<string, FormField>;
  required?: string[];
  'x-component'?: string;
  'x-component-props'?: Record<string, any>;
}

/**
 * 表单字段
 */
export interface FormField {
  type: string;
  title?: string;
  description?: string;
  'x-component': string;
  'x-decorator'?: string;
  'x-component-props'?: Record<string, any>;
  'x-decorator-props'?: Record<string, any>;
  'x-validator'?: FormValidator[];
  'x-reactions'?: FormReaction[];
  enum?: Array<{ label: string; value: any }>;
  properties?: Record<string, FormField>;
  default?: any;
}

/**
 * 表单验证器
 */
export interface FormValidator {
  required?: boolean;
  pattern?: string;
  min?: number;
  max?: number;
  message?: string;
  validator?: string;
}

/**
 * 表单反应
 */
export interface FormReaction {
  dependencies?: string[];
  when?: string;
  fulfill?: {
    state?: Record<string, any>;
    schema?: Record<string, any>;
  };
  otherwise?: {
    state?: Record<string, any>;
    schema?: Record<string, any>;
  };
}

/**
 * 表单提交
 */
export interface FormSubmission {
  id: string;
  templateId: string;
  templateName: string;
  data: Record<string, any>;
  submittedBy: string;
  submittedAt: string;
  status: SubmissionStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  comments?: string;
}

/**
 * 提交状态
 */
export type SubmissionStatus = 'pending' | 'approved' | 'rejected' | 'draft';

// ================ API相关类型 ================

/**
 * API配置
 */
export interface ApiConfig {
  id: string;
  key: string;
  name: string;
  url: string;
  method: HttpMethod;
  category: string;
  status: ApiStatus;
  description?: string;
  headers?: Record<string, string>;
  params?: Record<string, any>;
  data?: Record<string, any>;
  timeout?: number;
  retries?: number;
  cacheTime?: number;
  transform?: string;
  validate?: string;
  mock?: any;
  axiosInstance?: string;
  createdAt: string;
  updatedAt?: string;
}

/**
 * HTTP方法
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';

/**
 * API状态
 */
export type ApiStatus = 'enabled' | 'disabled' | 'testing' | 'deprecated';

/**
 * API调用选项
 */
export interface ApiCallOptions {
  timeout?: number;
  retries?: number;
  showError?: boolean;
  showSuccess?: boolean;
  cache?: boolean;
  cacheTime?: number;
}

// ================ 规则引擎相关类型 ================

/**
 * 规则
 */
export interface Rule {
  id: string;
  name: string;
  description?: string;
  category: string;
  priority: number;
  status: RuleStatus;
  conditions: RuleCondition[];
  actions: RuleAction[];
  schedule?: RuleSchedule;
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
  lastExecutedAt?: string;
  executionCount?: number;
}

/**
 * 规则状态
 */
export type RuleStatus = 'active' | 'inactive' | 'draft' | 'error';

/**
 * 规则条件
 */
export interface RuleCondition {
  id: string;
  type: ConditionType;
  field: string;
  operator: ConditionOperator;
  value: any;
  logicalOperator?: LogicalOperator;
}

/**
 * 条件类型
 */
export type ConditionType = 'data_point' | 'device_status' | 'time' | 'alarm' | 'custom';

/**
 * 条件操作符
 */
export type ConditionOperator = 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'nin' | 'contains' | 'regex';

/**
 * 逻辑操作符
 */
export type LogicalOperator = 'and' | 'or';

/**
 * 规则动作
 */
export interface RuleAction {
  id: string;
  type: ActionType;
  target: string;
  parameters: Record<string, any>;
  delay?: number;
}

/**
 * 动作类型
 */
export type ActionType = 'control_device' | 'send_alarm' | 'send_notification' | 'update_data' | 'execute_script' | 'call_api';

/**
 * 规则调度
 */
export interface RuleSchedule {
  type: ScheduleType;
  cron?: string;
  interval?: number;
  startTime?: string;
  endTime?: string;
  enabled: boolean;
}

/**
 * 调度类型
 */
export type ScheduleType = 'immediate' | 'interval' | 'cron' | 'manual';

// ================ 工单相关类型 ================

/**
 * 工单
 */
export interface Ticket {
  id: string;
  title: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  siteId?: string;
  deviceId?: string;
  assignedTo?: string;
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
  dueDate?: string;
  resolvedAt?: string;
  attachments?: TicketAttachment[];
  comments?: TicketComment[];
}

/**
 * 工单分类
 */
export type TicketCategory = 'maintenance' | 'repair' | 'inspection' | 'installation' | 'emergency' | 'other';

/**
 * 工单优先级
 */
export type TicketPriority = 'low' | 'medium' | 'high' | 'critical';

/**
 * 工单状态
 */
export type TicketStatus = 'open' | 'in_progress' | 'pending' | 'resolved' | 'closed' | 'cancelled';

/**
 * 工单附件
 */
export interface TicketAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  uploadedBy: string;
  uploadedAt: string;
}

/**
 * 工单评论
 */
export interface TicketComment {
  id: string;
  content: string;
  author: string;
  createdAt: string;
  isInternal?: boolean;
}

// ================ 报表相关类型 ================

/**
 * 报表
 */
export interface Report {
  id: string;
  name: string;
  description?: string;
  type: ReportType;
  category: string;
  template: ReportTemplate;
  parameters?: ReportParameter[];
  schedule?: ReportSchedule;
  status: ReportStatus;
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
  lastGeneratedAt?: string;
}

/**
 * 报表类型
 */
export type ReportType = 'data_summary' | 'alarm_summary' | 'device_status' | 'custom' | 'regulatory';

/**
 * 报表状态
 */
export type ReportStatus = 'active' | 'inactive' | 'draft' | 'archived';

/**
 * 报表模板
 */
export interface ReportTemplate {
  layout: string;
  sections: ReportSection[];
  styles?: Record<string, any>;
  variables?: Record<string, any>;
}

/**
 * 报表节
 */
export interface ReportSection {
  id: string;
  type: SectionType;
  title: string;
  config: Record<string, any>;
  order: number;
}

/**
 * 节类型
 */
export type SectionType = 'header' | 'text' | 'table' | 'chart' | 'image' | 'footer';

/**
 * 报表参数
 */
export interface ReportParameter {
  name: string;
  type: ParameterType;
  label: string;
  required: boolean;
  defaultValue?: any;
  options?: Array<{ label: string; value: any }>;
}

/**
 * 参数类型
 */
export type ParameterType = 'string' | 'number' | 'date' | 'daterange' | 'select' | 'boolean';

/**
 * 报表调度
 */
export interface ReportSchedule {
  enabled: boolean;
  frequency: ScheduleFrequency;
  time?: string;
  dayOfWeek?: number;
  dayOfMonth?: number;
  recipients?: string[];
  format?: ReportFormat;
}

/**
 * 调度频率
 */
export type ScheduleFrequency = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';

/**
 * 报表格式
 */
export type ReportFormat = 'pdf' | 'excel' | 'html' | 'csv';

// ================ 系统相关类型 ================

/**
 * 系统配置
 */
export interface SystemConfig {
  id: string;
  category: string;
  key: string;
  value: any;
  type: ConfigType;
  description?: string;
  isPublic: boolean;
  updatedBy?: string;
  updatedAt?: string;
}

/**
 * 配置类型
 */
export type ConfigType = 'string' | 'number' | 'boolean' | 'json' | 'array';

/**
 * 审计日志
 */
export interface AuditLog {
  id: string;
  action: string;
  resource: string;
  resourceId?: string;
  userId: string;
  userName: string;
  ipAddress?: string;
  userAgent?: string;
  details?: Record<string, any>;
  timestamp: string;
}

/**
 * 通知
 */
export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  level: NotificationLevel;
  targetType: NotificationTargetType;
  targetId?: string;
  userId?: string;
  isRead: boolean;
  data?: Record<string, any>;
  createdAt: string;
  readAt?: string;
}

/**
 * 通知类型
 */
export type NotificationType = 'alarm' | 'system' | 'maintenance' | 'report' | 'user' | 'other';

/**
 * 通知级别
 */
export type NotificationLevel = 'info' | 'warning' | 'error' | 'success';

/**
 * 通知目标类型
 */
export type NotificationTargetType = 'user' | 'role' | 'all';

// ================ 导出所有类型 ================

// 所有类型已在声明时导出，无需重复导出 