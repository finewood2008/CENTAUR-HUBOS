import { Users, Clock, Zap, CheckCircle } from 'lucide-react';
import type { Agent, ActivityItem, NavTab } from '../../types';

// ── Mock fallback 数据 ──
const MOCK_AGENTS = [
  { name: '火花 Spark',  emoji: '🔥', status: 'working' as const },
  { name: 'HR 助理',     emoji: '👤', status: 'idle' as const },
  { name: '数据分析师',   emoji: '📊', status: 'working' as const },
  { name: '客服专员',     emoji: '💬', status: 'waiting' as const },
];

const MOCK_TASKS = [
  { id: 1, text: '审批：新员工张三入职', agent: '🔥', urgent: true },
  { id: 2, text: '确认：本周内容排期表', agent: '📊', urgent: false },
  { id: 3, text: '回复：3条客户咨询', agent: '💬', urgent: true },
];

// ── 团队概览 ──
interface TeamOverviewProps {
  agents?: Agent[];
  loading?: boolean;
  isConnected?: boolean;
}

export function TeamOverviewWidget({ agents, loading, isConnected }: TeamOverviewProps) {
  // SDK 数据可用时用真实数据，否则 fallback mock
  const useSDK = isConnected && agents && agents.length > 0;

  const statusLabel: Record<string, string> = {
    running: '工作中', idle: '空闲', error: '异常', working: '工作中', waiting: '等待中',
  };
  const statusDot: Record<string, string> = {
    running: 'status-dot-active', working: 'status-dot-active',
    idle: 'status-dot-idle',
    error: 'bg-red-400',
    waiting: 'bg-amber-400',
  };

  if (loading) {
    return (
      <div className="card-glass p-4">
        <div className="flex items-center gap-2 mb-3">
          <Users size={15} className="text-terracotta" />
          <h3 className="text-[13px] font-semibold text-near-black">团队概览</h3>
        </div>
        <div className="space-y-2">
          {[1,2,3].map(i => (
            <div key={i} className="h-6 bg-border-cream/60 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const items = useSDK
    ? agents!.map(a => ({
        name: a.name,
        emoji: a.avatar || '🤖',
        status: a.status === 'running' ? 'working' : a.status === 'error' ? 'error' : 'idle',
      }))
    : MOCK_AGENTS;

  const workingCount = items.filter(a =>
    a.status === 'working' || a.status === 'running'
  ).length;

  return (
    <div className="card-glass p-4">
      <div className="flex items-center gap-2 mb-3">
        <Users size={15} className="text-terracotta" />
        <h3 className="text-[13px] font-semibold text-near-black">团队概览</h3>
        <span className="text-[11px] text-stone-gray ml-auto">
          {workingCount}/{items.length} 工作中
        </span>
      </div>
      <div className="space-y-2">
        {items.map(a => (
          <div key={a.name} className="flex items-center gap-2.5 py-1">
            <span className="text-base">{a.emoji}</span>
            <span className="text-[12px] text-charcoal-warm flex-1 truncate">{a.name}</span>
            <span className={`status-dot ${statusDot[a.status] || 'status-dot-idle'}`} />
            <span className="text-[11px] text-stone-gray w-12 text-right">
              {statusLabel[a.status] || a.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── 待办事项 ──
interface PendingTasksProps {
  approvals?: unknown[];
  activities?: ActivityItem[];
  loading?: boolean;
  isConnected?: boolean;
}

export function PendingTasksWidget({ approvals, activities, loading, isConnected }: PendingTasksProps) {
  // 优先用 SDK approvals，其次用 activities 中的 approval_needed，最后 mock
  const useSDK = isConnected && approvals && approvals.length > 0;
  const useActivities = !useSDK && activities && activities.filter(a => a.type === 'approval_needed').length > 0;

  if (loading) {
    return (
      <div className="card-glass p-4">
        <div className="flex items-center gap-2 mb-3">
          <Clock size={15} className="text-terracotta" />
          <h3 className="text-[13px] font-semibold text-near-black">待办事项</h3>
        </div>
        <div className="space-y-2">
          {[1,2,3].map(i => (
            <div key={i} className="h-6 bg-border-cream/60 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  type TaskItem = { id: string | number; text: string; agent: string; urgent: boolean };
  let tasks: TaskItem[];

  if (useSDK) {
    tasks = approvals!.map((a: any, i: number) => ({
      id: a.id || `approval-${i}`,
      text: a.title || a.summary || `审批项 ${i + 1}`,
      agent: '📋',
      urgent: a.status === 'pending' || a.priority === 'high',
    }));
  } else if (useActivities) {
    tasks = activities!
      .filter(a => a.type === 'approval_needed')
      .map(a => ({
        id: a.id,
        text: a.title,
        agent: a.agentAvatar || '📋',
        urgent: a.priority === 'urgent' || a.priority === 'high',
      }));
  } else {
    tasks = MOCK_TASKS;
  }

  return (
    <div className="card-glass p-4">
      <div className="flex items-center gap-2 mb-3">
        <Clock size={15} className="text-terracotta" />
        <h3 className="text-[13px] font-semibold text-near-black">待办事项</h3>
        <span className="badge-terracotta text-[10px] px-1.5 py-0 ml-auto">{tasks.length}</span>
      </div>
      <div className="space-y-2">
        {tasks.slice(0, 5).map(t => (
          <div
            key={t.id}
            className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-parchment transition-colors cursor-pointer group"
          >
            <span className="text-sm">{t.agent}</span>
            <span className={`text-[12px] flex-1 truncate ${t.urgent ? 'text-near-black font-medium' : 'text-charcoal-warm'}`}>
              {t.text}
            </span>
            {t.urgent && <span className="w-1.5 h-1.5 rounded-full bg-terracotta shrink-0" />}
            <CheckCircle
              size={14}
              className="text-stone-gray opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── 快捷指令 ──
interface QuickActionsProps {
  onNav?: (tab: NavTab) => void;
}

export function QuickActionsWidget({ onNav }: QuickActionsProps) {
  const actions: { label: string; emoji: string; tab: NavTab }[] = [
    { label: '团队管理', emoji: '👥', tab: 'team' },
    { label: '财务报表', emoji: '📊', tab: 'finance' },
    { label: '通讯渠道', emoji: '📣', tab: 'channels' },
    { label: '知识库',   emoji: '📚', tab: 'knowledge' },
  ];

  return (
    <div className="card-glass p-4">
      <div className="flex items-center gap-2 mb-3">
        <Zap size={15} className="text-terracotta" />
        <h3 className="text-[13px] font-semibold text-near-black">快捷指令</h3>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {actions.map(a => (
          <button
            key={a.label}
            onClick={() => onNav?.(a.tab)}
            className="flex items-center gap-2 py-2 px-3 rounded-lg bg-parchment hover:bg-warm-sand text-[12px] text-charcoal-warm transition-colors text-left"
          >
            <span>{a.emoji}</span>
            {a.label}
          </button>
        ))}
      </div>
    </div>
  );
}
