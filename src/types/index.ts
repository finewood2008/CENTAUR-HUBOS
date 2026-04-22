// Hub OS 类型定义

// ── 数字员工核心类型 ──────────────────────────────

export type DigitalEmployeeId = 'leader' | 'spark' | 'xiaoke' | 'shuxi' | 'shuibao' | 'lvan' | (string & {});

// ── 员工创建器中间状态 ──────────────────────────────
export interface EmployeeSpec {
  name?: string;
  englishName?: string;
  role?: string;
  tagline?: string;
  introduction?: string;
  avatar?: string;
  color?: string;
  accentColor?: string;
  model?: string;
  capabilities?: string[];
  skills?: { name: string; description: string }[];
  tools?: { name: string; category: string; description: string }[];
  memorylayers?: string[];
  workspaceType?: 'three-panel' | 'dashboard' | 'chat' | 'document';
  workspaceLabel?: string;
  personality?: string;
  confirmed?: boolean;
  workflow?: string[];
  personaTags?: string[];
  checklist?: string[];
  quickCommands?: string[];
  boundaries?: string[];
}

export type ActivationStatus = 'inactive' | 'activating' | 'active';

export interface DigitalEmployeeSkill {
  name: string;
  icon: string;        // lucide icon name
  description: string;
}

export interface DigitalEmployeeTool {
  name: string;
  icon: string;
  category: 'generation' | 'analysis' | 'communication' | 'data' | 'legal' | 'finance';
  description: string;
}

export interface HarnessSection {
  title: string;
  content: string;     // markdown-ish text for display
}

export interface MemoryEntry {
  category: string;
  key: string;
  value: string;
}

export interface WorkspaceConfig {
  type: 'three-panel' | 'dashboard' | 'chat' | 'document' | 'chat-board' | 'command-center';
  label: string;
  description: string;
  screenshot?: string;  // placeholder image path
  comingSoon?: boolean;
}

export interface OnboardingPreference {
  key: string;
  label: string;
  type: 'select' | 'text' | 'textarea';
  options?: string[];
  placeholder?: string;
}

export interface DigitalEmployee {
  id: DigitalEmployeeId;
  name: string;
  englishName: string;
  role: string;
  tagline: string;            // 一句话定位
  introduction: string;       // 第一人称自我介绍
  avatar: string;             // image path (3D pixar style)
  color: string;              // brand gradient tailwind classes
  accentColor: string;        // single accent color for badges etc
  status: ActivationStatus;
  model: string;
  
  // 能力
  capabilities: string[];     // 简短标签: '品牌设计', 'VI系统' ...
  skills: DigitalEmployeeSkill[];
  tools: DigitalEmployeeTool[];
  
  // 技术档案
  harness: HarnessSection[];
  modelInfo: {
    base: string;
    reasoning: string;
    context: string;
    specialization: string;
  };
  memorySystem: {
    description: string;
    layers: string[];
  };
  
  // 工作台
  workspace: WorkspaceConfig;
  
  // 入职配置
  onboardingPreferences: OnboardingPreference[];
  trainingDataSources: string[];  // 可导入的数据源
  
  // 工作统计 (mock)
  stats: {
    monthlyTasks: number;
    hoursSaved: number;
    satisfaction: number;     // 0-100
  };
}

// ── 激活流程 ──────────────────────────────

export type ActivationStep = 'welcome' | 'key' | 'company' | 'preferences' | 'complete';

export interface ActivationState {
  employeeId: DigitalEmployeeId;
  currentStep: ActivationStep;
  apiKey: string;
  companyInfo: {
    name: string;
    industry: string;
    business: string;
    brandFiles?: string[];
  };
  preferences: Record<string, string>;
}

// ── 财务/Key管理 ──────────────────────────────

export interface ApiKey {
  id: string;
  name: string;
  key: string;               // masked: sk-****1234
  employeeId: DigitalEmployeeId | 'all';
  createdAt: string;
  lastUsed: string;
  status: 'active' | 'disabled' | 'expired';
  monthlyLimit: number;      // ¥
  monthlyUsed: number;
}

export interface EmployeeUsage {
  employeeId: DigitalEmployeeId;
  employeeName: string;
  monthlyTokens: number;
  monthlyCost: number;
  dailyBreakdown: { date: string; tokens: number; cost: number }[];
}

export interface FinanceOverview {
  totalBalance: number;
  monthlySpent: number;
  monthlyBudget: number;
  keys: ApiKey[];
  employeeUsage: EmployeeUsage[];
}

// ── 保留旧类型（Dashboard/Channels/Knowledge仍在用）──

export type AgentStatus = 'running' | 'idle' | 'error';

export type ChannelType = 'wecom' | 'feishu' | 'telegram' | 'dingtalk' | 'email' | 'whatsapp' | 'slack' | 'webhook';

export interface AgentChannel {
  type: ChannelType;
  name: string;
  status: 'active' | 'inactive' | 'error';
}

export interface Agent {
  id: string;
  name: string;
  role: string;
  avatar: string;
  status: AgentStatus;
  model: string;
  port: number;
  harnessDir: string;
  skills: string[];
  tools: string[];
  dataSources: string[];
  budgetPercent: number;
  budgetUsed: number;
  hireDate: string;
  todayTasks: number;
  todaySummary: string;
  channel?: AgentChannel;
}

export type TemplateStatus = 'live' | 'coming' | 'planned';

export interface Template {
  id: string;
  name: string;
  avatar: string;
  desc: string;
  category: string;
  model: string;
  skills: string[];
  color: string;
  status: TemplateStatus;
  statusLabel?: string;
}

export interface Alert {
  id: string;
  agentId: string;
  agentName: string;
  type: 'quota' | 'error' | 'security';
  message: string;
  time: string;
  severity: 'warning' | 'critical';
}

export interface UsageStat {
  date: string;
  tokens: number;
  cost: number;
}

export interface ChatMessage {
  role: 'user' | 'ai';
  content: string;
}

// 员工动态流
export type ActivityType =
  | 'task_done'
  | 'content_published'
  | 'lead_captured'
  | 'email_sent'
  | 'report_ready'
  | 'alert'
  | 'approval_needed'
  | 'customer_reply'
  | 'insight';

export interface ActivityItem {
  id: string;
  agentId: string;
  agentName: string;
  agentAvatar: string;
  type: ActivityType;
  title: string;
  detail?: string;
  time: string;
  timestamp: number;
  actionLabel?: string;
  actionType?: 'view' | 'approve' | 'reply' | 'dismiss';
  priority?: 'normal' | 'high' | 'urgent';
}

export type NavTab = 'team' | 'employees' | 'channels' | 'memory' | 'knowledge' | 'finance' | 'office' | 'settings';
