// 合伙人(数字合伙人)数据模型
import type { DigitalEmployeeId } from '../types';

// ── 合伙人档案 ──
export interface PartnerProfile {
  name: string;           // 用户取的名字，首次为空
  style: 'direct' | 'steady' | 'casual'; // 干练/稳重/随和
  avatar: string;
  tagline: string;
  isConfigured: boolean;  // 是否完成首次人格设定
}

export const DEFAULT_PARTNER: PartnerProfile = {
  name: '',
  style: 'steady',
  avatar: '🧑‍💼',
  tagline: '你的数字合伙人',
  isConfigured: false,
};

// ── 对话消息类型 ──
export type MessageSender =
  | { type: 'partner' }
  | { type: 'employee'; id: DigitalEmployeeId; name: string; avatar: string; color: string }
  | { type: 'user' }
  | { type: 'system' };

export interface ChatMessage {
  id: string;
  sender: MessageSender;
  content: string;
  time: string;
  // 富内容附件
  attachment?: MessageAttachment;
}

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'review';

export type MessageAttachment =
  | { type: 'data-card'; title: string; metrics: { label: string; value: string }[] }
  | { type: 'task-list'; tasks: { employee: string; avatar: string; task: string; deadline: string }[] }
  | { type: 'action-buttons'; buttons: { label: string; action: string }[] }
  | { type: 'article-preview'; title: string; summary: string; reads: number; shares: number }
  | { type: 'task-card'; taskId: string; title: string; assignee: string; assigneeAvatar: string; status: TaskStatus; progress?: number }
  | { type: 'image'; url: string; name: string; width?: number; height?: number }
  | { type: 'file'; url: string; name: string; size: string; mimeType?: string }
  | { type: 'voice'; url: string; duration: number };

// ── 输入文件附件 ──
export interface InputFile {
  id: string;
  file: File;
  type: 'image' | 'file';
  preview?: string; // data URL for image preview
  name: string;
  size: number;
}

// ── 定时任务 ──
export interface ScheduledTask {
  id: string;
  title: string;
  description?: string;
  schedule: {
    type: 'once' | 'daily' | 'weekly' | 'monthly' | 'cron';
    time: string; // HH:mm
    date?: string; // YYYY-MM-DD for 'once'
    weekday?: number; // 0-6 for 'weekly'
    dayOfMonth?: number; // 1-31 for 'monthly'
    cronExpr?: string; // for 'cron'
  };
  action: string; // the instruction/prompt
  assignee?: string; // employee id
  enabled: boolean;
  createdAt: string;
  lastRun?: string;
  nextRun?: string;
}

// ── 汇报流 ──
export interface ReportItem {
  id: string;
  employeeId: DigitalEmployeeId;
  employeeName: string;
  employeeAvatar: string;
  employeeColor: string;    // 左边框色
  type: 'approval' | 'report' | 'alert';
  title: string;
  detail?: string;
  time: string;
  // approval 特有
  approvalData?: {
    amount?: string;
    description: string;
  };
  status?: 'pending' | 'approved' | 'rejected';
}

// ── 看板卡片 ──
export type DashboardCardType =
  | 'todo'           // 今日待办
  | 'team-status'    // 员工动态
  | 'efficiency'     // 效率概览
  | 'schedule'       // 日程提醒
  | 'finance'        // 财务快照
  | 'leads'          // 获客数据
  | 'quick-actions'  // 快捷指令
  | 'recent-chats';  // 最近对话

export interface DashboardCard {
  type: DashboardCardType;
  label: string;
  emoji: string;
  enabled: boolean;
}

export const ALL_DASHBOARD_CARDS: DashboardCard[] = [
  { type: 'todo', label: '今日待办', emoji: '📋', enabled: true },
  { type: 'team-status', label: '员工动态', emoji: '👥', enabled: true },
  { type: 'efficiency', label: '效率概览', emoji: '⚡', enabled: true },
  { type: 'quick-actions', label: '快捷指令', emoji: '🚀', enabled: true },
  { type: 'schedule', label: '日程提醒', emoji: '📅', enabled: false },
  { type: 'finance', label: '财务快照', emoji: '💰', enabled: false },
  { type: 'leads', label: '获客数据', emoji: '🎯', enabled: false },
  { type: 'recent-chats', label: '最近对话', emoji: '💬', enabled: false },
];

// ── 员工信息(简化，给对话用) ──
export interface TeamMember {
  id: DigitalEmployeeId;
  name: string;
  avatar: string;
  color: string;       // border color class
  role: string;
  status: 'online' | 'working' | 'offline';
  locked: boolean;
}

// ── 任务数据模型 ──
export interface Task {
  id: string;
  title: string;
  assignee: DigitalEmployeeId;
  assigneeName: string;
  assigneeAvatar: string;
  status: TaskStatus;
  progress?: number;       // 0-100
  createdAt: string;
  deadline?: string;
  description?: string;
}

// ── 半人马指数 ──

export type CentaurLevel = 'manual' | 'initial' | 'centaur' | 'deep' | 'auto';

export interface CentaurDimension {
  key: string;
  label: string;
  ai: number;
  human: number;
  weight: number;
}

export interface CentaurIndex {
  overall: number;          // 0-100
  dimensions: CentaurDimension[];
  trend: number[];          // 最近7天
  level: CentaurLevel;
  levelLabel: string;
}

export const CENTAUR_LEVELS: Record<CentaurLevel, { label: string; color: string; range: string }> = {
  manual:  { label: '手工时代', color: 'text-gray-500',    range: '0-20' },
  initial: { label: '初步协作', color: 'text-blue-500',    range: '21-40' },
  centaur: { label: '半人马状态', color: 'text-emerald-500', range: '41-60' },
  deep:    { label: '深度融合', color: 'text-amber-500',   range: '61-80' },
  auto:    { label: '全面自动', color: 'text-purple-500',  range: '81-100' },
};

function getCentaurLevel(score: number): CentaurLevel {
  if (score <= 20) return 'manual';
  if (score <= 40) return 'initial';
  if (score <= 60) return 'centaur';
  if (score <= 80) return 'deep';
  return 'auto';
}

export function calcCentaurIndex(dims: CentaurDimension[]): CentaurIndex {
  let overall = 0;
  for (const d of dims) {
    const total = d.ai + d.human;
    const ratio = total > 0 ? (d.ai / total) * 100 : 0;
    overall += ratio * d.weight;
  }
  overall = Math.round(overall);
  const level = getCentaurLevel(overall);
  return {
    overall,
    dimensions: dims,
    trend: Array.from({ length: 7 }, () => overall),
    level,
    levelLabel: CENTAUR_LEVELS[level].label,
  };
}
