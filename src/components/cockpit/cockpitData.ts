// 超级工作台 — 信息流 Mock 数据
export interface FeedItem {
  id: string;
  agentId: string;
  agentName: string;
  agentAvatar: string;        // emoji 或首字符
  agentColor: string;         // 头像背景色
  type: 'report' | 'task_done' | 'approval' | 'alert' | 'insight';
  content: string;
  detail?: string;            // 可展开的详情
  timestamp: string;          // ISO string
  read: boolean;
  actionable?: boolean;       // 需要用户操作
  actionLabel?: string;
}

export type WidgetType =
  | 'team_overview'
  | 'pending_tasks'
  | 'quick_actions'
  | 'finance_snapshot'
  | 'channel_status'
  | 'knowledge_recent';

export interface WidgetConfig {
  type: WidgetType;
  label: string;
  description: string;
  side: 'left' | 'right';
  defaultEnabled: boolean;
}

// 所有可选小组件定义
export const WIDGET_REGISTRY: WidgetConfig[] = [
  { type: 'team_overview',    label: '团队概览',   description: '数字员工在线状态一览',     side: 'left',  defaultEnabled: true },
  { type: 'pending_tasks',    label: '待办事项',   description: '需要你确认/审批的事项',     side: 'left',  defaultEnabled: true },
  { type: 'quick_actions',    label: '快捷指令',   description: '常用操作快速入口',          side: 'left',  defaultEnabled: true },
  { type: 'finance_snapshot', label: '财务快照',   description: '余额、本月消耗速览',        side: 'right', defaultEnabled: true },
  { type: 'channel_status',   label: '通讯状态',   description: '各渠道连接状态',            side: 'right', defaultEnabled: true },
  { type: 'knowledge_recent', label: '知识库动态', description: '最近更新的文档',            side: 'right', defaultEnabled: true },
];

// Mock 信息流数据
const now = Date.now();
const mins = (n: number) => new Date(now - n * 60_000).toISOString();

export const MOCK_FEED: FeedItem[] = [
  {
    id: 'f1',
    agentId: 'spark',
    agentName: '火花 Spark',
    agentAvatar: '🔥',
    agentColor: '#c96442',
    type: 'task_done',
    content: '品牌VI手册第3版已生成完毕',
    detail: '包含Logo规范、色彩体系、字体规范、名片模板共28页，已导出PDF至品牌资料库。',
    timestamp: mins(3),
    read: false,
  },
  {
    id: 'f2',
    agentId: 'hr_bot',
    agentName: 'HR 助理',
    agentAvatar: '👤',
    agentColor: '#4a7c94',
    type: 'approval',
    content: '新员工入职审批：张三（前端工程师）',
    detail: '入职日期 2026-04-20，薪资方案已按模板生成，需要您确认。',
    timestamp: mins(12),
    read: false,
    actionable: true,
    actionLabel: '去审批',
  },
  {
    id: 'f3',
    agentId: 'data_analyst',
    agentName: '数据分析师',
    agentAvatar: '📊',
    agentColor: '#5a8a5e',
    type: 'insight',
    content: '本周外贸询盘量环比上涨 23%',
    detail: '主要增长来自东南亚地区，建议重点跟进印尼和越南客户。详细报告已生成。',
    timestamp: mins(28),
    read: true,
  },
  {
    id: 'f4',
    agentId: 'spark',
    agentName: '火花 Spark',
    agentAvatar: '🔥',
    agentColor: '#c96442',
    type: 'report',
    content: '小红书账号本周数据：新增粉丝 186，互动率 4.2%',
    detail: '表现最好的内容是"AI如何帮中小企业做品牌"系列第3篇，阅读量 2.8w。',
    timestamp: mins(45),
    read: true,
  },
  {
    id: 'f5',
    agentId: 'customer_service',
    agentName: '客服专员',
    agentAvatar: '💬',
    agentColor: '#8c64a0',
    type: 'alert',
    content: '检测到 3 条未回复的客户消息（超过2小时）',
    detail: '来自微信公众号的咨询，客户询问定价和服务范围。建议尽快处理。',
    timestamp: mins(68),
    read: false,
    actionable: true,
    actionLabel: '立即处理',
  },
  {
    id: 'f6',
    agentId: 'data_analyst',
    agentName: '数据分析师',
    agentAvatar: '📊',
    agentColor: '#5a8a5e',
    type: 'task_done',
    content: '月度财务报表已自动生成',
    detail: '3月总收入 ¥42,800，同比增长 15%。详细报表已同步至知识库。',
    timestamp: mins(120),
    read: true,
  },
  {
    id: 'f7',
    agentId: 'hr_bot',
    agentName: 'HR 助理',
    agentAvatar: '👤',
    agentColor: '#4a7c94',
    type: 'report',
    content: '本月团队考勤报告已汇总',
    detail: '全员出勤率 98.5%，无异常。已归档至HR知识库。',
    timestamp: mins(180),
    read: true,
  },
];
