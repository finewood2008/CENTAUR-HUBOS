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

export type MessageAttachment =
  | { type: 'data-card'; title: string; metrics: { label: string; value: string }[] }
  | { type: 'task-list'; tasks: { employee: string; avatar: string; task: string; deadline: string }[] }
  | { type: 'action-buttons'; buttons: { label: string; action: string }[] }
  | { type: 'article-preview'; title: string; summary: string; reads: number; shares: number };

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

export const TEAM_MEMBERS: TeamMember[] = [
  { id: 'spark', name: '火花', avatar: '🔥', color: 'border-l-orange-400', role: '品牌设计', status: 'working', locked: false },
  { id: 'xiaoke', name: '小可', avatar: '🎯', color: 'border-l-blue-400', role: '获客增长', status: 'online', locked: false },
  { id: 'shuxi', name: '书熙', avatar: '📚', color: 'border-l-emerald-400', role: '商业策划', status: 'offline', locked: true },
  { id: 'shuibao', name: '税宝', avatar: '💰', color: 'border-l-amber-400', role: '税务财务', status: 'offline', locked: true },
  { id: 'lvan', name: '绿安', avatar: '🛡', color: 'border-l-teal-400', role: '合规法务', status: 'offline', locked: true },
];

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
      type: 'task-list',
      tasks: [
        { employee: '火花', avatar: '🔥', task: '展会海报 + 宣传册设计', deadline: '周四' },
        { employee: '小可', avatar: '🎯', task: '客户案例集 + 现场获客方案', deadline: '周三' },
      ],
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
