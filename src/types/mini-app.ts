// Hub OS - Mini App Schema 类型定义
// 架构师面谈产出的 App 配置规范

// ─── 顶层 Schema ───
export interface MiniAppSchema {
  id: string;
  meta: AppMeta;
  agent: AgentConfig;
  layout: LayoutConfig;
  panels: PanelConfig[];
  dataSources: DataSourceDef[];
  workflow?: WorkflowConfig;
}

// ─── 应用元信息 ───
export interface AppMeta {
  name: string;
  description: string;
  icon: string;           // emoji 或 lucide icon name
  color: string;          // tailwind gradient, e.g. "from-blue-500 to-cyan-500"
  version: string;
  author?: string;
  tags?: string[];
}

// ─── Agent 配置 ───
export interface AgentConfig {
  model: string;          // e.g. "claude-sonnet-4-20250514", "gpt-4o"
  systemPrompt: string;
  temperature?: number;
  tools?: string[];       // 允许使用的工具 id
  maxTokens?: number;
}

// ─── 布局 ───
export type LayoutType =
  | 'chat-workspace'      // 左聊天 + 右工作区（最常见）
  | 'workspace-only'      // 纯工作区，无聊天面板
  | 'chat-only'           // 纯聊天（简单 bot）
  | 'dashboard'           // 仪表盘网格布局
  | 'wizard';             // 分步向导

export interface LayoutConfig {
  type: LayoutType;
  chatWidth?: string;     // e.g. "40%", "380px"
}

// ─── 面板 ───
export interface PanelConfig {
  id: string;
  title: string;
  position: 'left' | 'right' | 'top' | 'bottom' | 'center' | 'modal';
  width?: string;
  height?: string;
  children: WidgetConfig[];
}

// ─── Widget 组件定义 ───
// 所有 UI 组件的联合类型
export type WidgetConfig =
  | ChatWidget
  | CardWidget
  | TableWidget
  | ListWidget
  | FormWidget
  | StatWidget
  | TabsWidget
  | ButtonGroupWidget
  | MarkdownWidget
  | ProgressWidget
  | TagCloudWidget
  | TimelineWidget
  | EmptyWidget;

// 组件基础字段
interface WidgetBase {
  id: string;
  visible?: boolean;           // 默认 true
  className?: string;          // 额外样式
  bindDataSource?: string;     // 绑定的数据源 id
}

// ── 聊天面板 ──
export interface ChatWidget extends WidgetBase {
  type: 'chat';
  placeholder?: string;
  welcomeMessage?: string;
}

// ── 卡片 ──
export interface CardWidget extends WidgetBase {
  type: 'card';
  title?: string;
  subtitle?: string;
  content?: string;
  footer?: string;
  variant?: 'default' | 'outlined' | 'elevated';
  children?: WidgetConfig[];
}

// ── 表格 ──
export interface TableColumn {
  key: string;
  label: string;
  width?: string;
  align?: 'left' | 'center' | 'right';
  render?: 'text' | 'badge' | 'progress' | 'date' | 'avatar';
}

export interface TableWidget extends WidgetBase {
  type: 'table';
  columns: TableColumn[];
  data?: Record<string, unknown>[];
  pageSize?: number;
  searchable?: boolean;
  selectable?: boolean;
  emptyText?: string;
}

// ── 列表 ──
export interface ListWidget extends WidgetBase {
  type: 'list';
  template: 'simple' | 'card' | 'timeline' | 'feed';
  data?: Record<string, unknown>[];
  titleKey?: string;
  subtitleKey?: string;
  avatarKey?: string;
  emptyText?: string;
}

// ── 表单 ──
export type FormFieldType =
  | 'text' | 'textarea' | 'number' | 'email' | 'url'
  | 'select' | 'multiselect' | 'checkbox' | 'radio'
  | 'date' | 'datetime' | 'file' | 'switch' | 'slider';

export interface FormField {
  key: string;
  label: string;
  type: FormFieldType;
  placeholder?: string;
  required?: boolean;
  defaultValue?: unknown;
  options?: { label: string; value: string }[];   // for select/radio/checkbox
  min?: number;
  max?: number;
  validation?: string;  // regex pattern
}

export interface FormWidget extends WidgetBase {
  type: 'form';
  fields: FormField[];
  submitLabel?: string;
  layout?: 'vertical' | 'horizontal' | 'grid';
  columns?: number;            // grid 模式下几列
  onSubmitAction?: string;     // workflow action id
}

// ── 统计数字 ──
export interface StatWidget extends WidgetBase {
  type: 'stat';
  items: {
    label: string;
    value: string | number;
    change?: string;           // e.g. "+12%"
    trend?: 'up' | 'down' | 'flat';
    icon?: string;
  }[];
  columns?: number;
}

// ── Tabs ──
export interface TabItem {
  key: string;
  label: string;
  icon?: string;
  children: WidgetConfig[];
}

export interface TabsWidget extends WidgetBase {
  type: 'tabs';
  items: TabItem[];
  defaultTab?: string;
}

// ── 按钮组 ──
export interface ButtonConfig {
  label: string;
  action: string;              // workflow action id
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  icon?: string;
  confirm?: string;            // 确认提示文案
}

export interface ButtonGroupWidget extends WidgetBase {
  type: 'button-group';
  buttons: ButtonConfig[];
  direction?: 'horizontal' | 'vertical';
}

// ── Markdown 渲染 ──
export interface MarkdownWidget extends WidgetBase {
  type: 'markdown';
  content: string;
}

// ── 进度条 ──
export interface ProgressWidget extends WidgetBase {
  type: 'progress';
  value: number;               // 0-100
  label?: string;
  color?: string;
  showPercent?: boolean;
}

// ── 标签墙 ──
export interface TagCloudWidget extends WidgetBase {
  type: 'tag-cloud';
  tags: { label: string; color?: string; count?: number }[];
}

// ── 时间线 ──
export interface TimelineWidget extends WidgetBase {
  type: 'timeline';
  items: {
    time: string;
    title: string;
    description?: string;
    status?: 'done' | 'active' | 'pending';
  }[];
}

// ── 空状态占位 ──
export interface EmptyWidget extends WidgetBase {
  type: 'empty';
  message: string;
  icon?: string;
  actionLabel?: string;
  action?: string;
}

// ─── 数据源 ───
export interface DataSourceDef {
  id: string;
  type: 'static' | 'api' | 'agent-output';
  initialData?: unknown;
  refreshInterval?: number;    // 秒，0 = 不自动刷新
  endpoint?: string;           // api 类型用
}

// ─── Workflow ───
export interface WorkflowConfig {
  triggers: WorkflowTrigger[];
  actions: WorkflowAction[];
}

export type WorkflowTrigger =
  | { type: 'chat_message'; filter?: string }
  | { type: 'form_submit'; formId: string }
  | { type: 'button_click'; buttonAction: string }
  | { type: 'schedule'; cron: string }
  | { type: 'data_change'; dataSourceId: string };

export interface WorkflowAction {
  id: string;
  type: 'agent_invoke' | 'update_data' | 'show_toast' | 'navigate' | 'export';
  params: Record<string, unknown>;
}

// ─── Runtime 状态 ───
export interface MiniAppState {
  schema: MiniAppSchema;
  dataStore: Record<string, unknown>;   // dataSourceId -> current data
  chatMessages: { role: 'user' | 'ai'; content: string }[];
  isLoading: boolean;
  activePanel?: string;
}
