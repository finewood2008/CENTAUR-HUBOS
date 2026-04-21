// 合伙人(数字合伙人)数据模型 + mock对话数据
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

export const ALL_EMPLOYEES: TeamMember[] = [
  { id: 'leader', name: '主管', avatar: '🧑‍💼', color: 'border-l-indigo-400', role: '团队统管', status: 'online', locked: false },
  { id: 'spark', name: '火花', avatar: '🔥', color: 'border-l-orange-400', role: '品牌设计', status: 'working', locked: false },
  { id: 'xiaoke', name: '小可', avatar: '🎯', color: 'border-l-blue-400', role: '获客增长', status: 'online', locked: false },
  { id: 'shuxi', name: '书熙', avatar: '📚', color: 'border-l-emerald-400', role: '商业策划', status: 'offline', locked: true },
  { id: 'shuibao', name: '税宝', avatar: '💰', color: 'border-l-amber-400', role: '税务财务', status: 'offline', locked: true },
  { id: 'lvan', name: '绿安', avatar: '🛡', color: 'border-l-teal-400', role: '合规法务', status: 'offline', locked: true },
];

// Backward compat alias
export const TEAM_MEMBERS = ALL_EMPLOYEES;

// Default team: only active (unlocked) employees
export const DEFAULT_TEAM_IDS: DigitalEmployeeId[] = ['spark', 'xiaoke'];

// ── Mock 对话数据 ──
export const MOCK_MORNING_BRIEFING: ChatMessage[] = [
  {
    id: 'msg-1',
    sender: { type: 'partner' },
    content: '早上好老板。昨天团队完成了8项任务，跟你汇报一下重点：',
    time: '09:00',
  },
  {
    id: 'msg-2',
    sender: { type: 'partner' },
    content: '火花昨天发了2篇文章，数据不错；小可那边新增了12条线索，有3个高意向客户。另外有2件事需要你拍板。',
    time: '09:00',
    attachment: {
      type: 'data-card',
      title: '昨日团队成果',
      metrics: [
        { label: '完成任务', value: '8项' },
        { label: '文章发布', value: '2篇' },
        { label: '新增线索', value: '12条' },
        { label: '高意向客户', value: '3个' },
      ],
    },
  },
  {
    id: 'msg-3',
    sender: { type: 'user' },
    content: '文章数据具体怎么样？',
    time: '09:02',
  },
  {
    id: 'msg-4',
    sender: { type: 'partner' },
    content: '我让火花来汇报一下。',
    time: '09:02',
  },
  {
    id: 'msg-5',
    sender: { type: 'employee', id: 'spark', name: '火花', avatar: '🔥', color: 'border-l-orange-400' },
    content: '昨天发的那篇《AI趋势2026》阅读1,240，转发86次，比上周平均高了30%。另一篇产品介绍阅读680，中规中矩。',
    time: '09:03',
    attachment: {
      type: 'article-preview',
      title: 'AI趋势2026：中小企业的机遇与挑战',
      summary: '深度解析AI技术如何赋能中小企业降本增效...',
      reads: 1240,
      shares: 86,
    },
  },
  {
    id: 'msg-6',
    sender: { type: 'partner' },
    content: '数据不错。要不要让火花沿这个方向再写一篇？',
    time: '09:03',
  },
  {
    id: 'msg-7',
    sender: { type: 'user' },
    content: '好，再写一篇。另外帮我准备下下周展会的物料。',
    time: '09:05',
  },
  {
    id: 'msg-8',
    sender: { type: 'partner' },
    content: '收到。文章的事我让火花安排了。展会物料我拆一下任务：',
    time: '09:05',
    attachment: {
      type: 'task-card',
      taskId: 'task-1',
      title: '展会海报设计',
      assignee: '火花',
      assigneeAvatar: '🔥',
      status: 'in_progress' as TaskStatus,
      progress: 65,
    },
  },
  {
    id: 'msg-8b',
    sender: { type: 'partner' },
    content: '',
    time: '09:05',
    attachment: {
      type: 'task-card',
      taskId: 'task-2',
      title: '客户案例集整理',
      assignee: '小可',
      assigneeAvatar: '🎯',
      status: 'in_progress' as TaskStatus,
      progress: 40,
    },
  },
  {
    id: 'msg-9',
    sender: { type: 'partner' },
    content: '周四前出初稿，到时候我汇总给你过目。有什么特别要求吗？',
    time: '09:06',
  },
];

// ── Mock 汇报流 ──
export const MOCK_REPORTS: ReportItem[] = [
  {
    id: 'rpt-1',
    employeeId: 'shuibao',
    employeeName: '税宝',
    employeeAvatar: '💰',
    employeeColor: 'border-l-amber-400',
    type: 'approval',
    title: '4月增值税申报',
    time: '10:30',
    approvalData: {
      amount: '¥12,450',
      description: '4月增值税纳税申报，请确认金额后提交',
    },
    status: 'pending',
  },
  {
    id: 'rpt-2',
    employeeId: 'spark',
    employeeName: '火花',
    employeeAvatar: '🔥',
    employeeColor: 'border-l-orange-400',
    type: 'report',
    title: '文章初稿完成',
    detail: '《AI趋势2026续篇》初稿已完成，共2,800字，含3张配图。',
    time: '10:30',
  },
  {
    id: 'rpt-3',
    employeeId: 'xiaoke',
    employeeName: '小可',
    employeeAvatar: '🎯',
    employeeColor: 'border-l-blue-400',
    type: 'report',
    title: '新增高意向线索3条',
    detail: '来自百度SEM渠道，行业分布：科技2条、教育1条。建议48小时内跟进。',
    time: '09:15',
  },
  {
    id: 'rpt-4',
    employeeId: 'lvan',
    employeeName: '绿安',
    employeeAvatar: '🛡',
    employeeColor: 'border-l-teal-400',
    type: 'approval',
    title: '供应商合同审核',
    time: '昨天',
    approvalData: {
      description: '新供应商合作协议，合同期1年，建议增加违约条款',
    },
    status: 'pending',
  },
];

// ── 首次开机对话 ──
export const ONBOARDING_MESSAGES: ChatMessage[] = [
  {
    id: 'onboard-1',
    sender: { type: 'partner' },
    content: '你好！我是你的数字合伙人，你团队的领班。我来帮你管理团队、安排工作、汇报进展。',
    time: '',
  },
  {
    id: 'onboard-2',
    sender: { type: 'partner' },
    content: '先认识一下——你想怎么称呼我？',
    time: '',
  },
];

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

export const MOCK_TASKS: Task[] = [
  {
    id: 'task-1',
    title: '展会海报设计',
    assignee: 'spark',
    assigneeName: '火花',
    assigneeAvatar: '🔥',
    status: 'in_progress',
    progress: 65,
    createdAt: '09:05',
    deadline: '周四',
    description: '设计下周展会用的主视觉海报和易拉宝',
  },
  {
    id: 'task-2',
    title: '客户案例集整理',
    assignee: 'xiaoke',
    assigneeName: '小可',
    assigneeAvatar: '🎯',
    status: 'in_progress',
    progress: 40,
    createdAt: '09:05',
    deadline: '周三',
    description: '整理3个标杆客户案例，含数据和testimonial',
  },
  {
    id: 'task-3',
    title: '《AI趋势2026》续篇',
    assignee: 'spark',
    assigneeName: '火花',
    assigneeAvatar: '🔥',
    status: 'review',
    progress: 100,
    createdAt: '09:05',
    description: '基于上篇高表现数据，撰写续篇文章',
  },
  {
    id: 'task-4',
    title: '4月增值税申报',
    assignee: 'shuibao',
    assigneeName: '税宝',
    assigneeAvatar: '💰',
    status: 'pending',
    createdAt: '昨天',
    deadline: '本周五',
    description: '4月增值税纳税申报，金额¥12,450',
  },
  {
    id: 'task-5',
    title: '竞品分析报告',
    assignee: 'xiaoke',
    assigneeName: '小可',
    assigneeAvatar: '🎯',
    status: 'completed',
    progress: 100,
    createdAt: '昨天',
    description: '分析3家主要竞品的获客策略和定价',
  },
];

// ── Mock 定时任务 ──
export const MOCK_SCHEDULED_TASKS: ScheduledTask[] = [
  {
    id: 'st-1',
    title: '每日晨报',
    description: '汇总昨日数据，生成晨报',
    schedule: { type: 'daily', time: '09:00' },
    action: '生成昨日团队工作晨报',
    enabled: true,
    createdAt: '2026-04-15',
    nextRun: '明天 09:00',
  },
  {
    id: 'st-2',
    title: '周五周报',
    description: '汇总本周工作，生成周报',
    schedule: { type: 'weekly', time: '17:00', weekday: 5 },
    action: '生成本周团队工作周报',
    enabled: true,
    createdAt: '2026-04-10',
    nextRun: '周五 17:00',
  },
  {
    id: 'st-3',
    title: '月度获客分析',
    description: '分析本月获客数据',
    schedule: { type: 'monthly', time: '10:00', dayOfMonth: 1 },
    action: '分析上月获客数据并生成报告',
    assignee: 'xiaoke',
    enabled: false,
    createdAt: '2026-04-01',
  },
];

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
    trend: [54, 57, 59, 62, 64, 66, overall],
    level,
    levelLabel: CENTAUR_LEVELS[level].label,
  };
}

export const MOCK_CENTAUR_DIMENSIONS: CentaurDimension[] = [
  { key: 'tasks',         label: '任务执行', ai: 18, human: 5,  weight: 0.4 },
  { key: 'content',       label: '内容生产', ai: 6,  human: 2,  weight: 0.25 },
  { key: 'decisions',     label: '决策处理', ai: 30, human: 20, weight: 0.2 },
  { key: 'communication', label: '沟通协调', ai: 50, human: 80, weight: 0.15 },
];

export const MOCK_CENTAUR_INDEX: CentaurIndex = calcCentaurIndex(MOCK_CENTAUR_DIMENSIONS);
