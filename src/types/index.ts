// Hub OS 类型定义

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
  statusLabel?: string;  // 自定义状态文案
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

// 员工动态流 — 时间线首页核心数据
export type ActivityType =
  | 'task_done'      // 完成任务
  | 'content_published' // 发布内容
  | 'lead_captured'  // 捕获线索
  | 'email_sent'     // 发送邮件
  | 'report_ready'   // 报告生成
  | 'alert'          // 异常/告警
  | 'approval_needed' // 需要审批
  | 'customer_reply' // 客户回复
  | 'insight';       // 洞察/建议

export interface ActivityItem {
  id: string;
  agentId: string;
  agentName: string;
  agentAvatar: string;
  type: ActivityType;
  title: string;
  detail?: string;
  time: string;         // 相对时间："3 分钟前"
  timestamp: number;    // 排序用
  actionLabel?: string; // 按钮文案："查看详情"、"去审批"
  actionType?: 'view' | 'approve' | 'reply' | 'dismiss';
  priority?: 'normal' | 'high' | 'urgent';
}

export type NavTab = 'dashboard' | 'agents' | 'channels' | 'knowledge' | 'settings';
