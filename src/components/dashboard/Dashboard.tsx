// Hub OS - Dashboard 控制台首页（时间线动态流）
import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircle2, FileText, Users, Mail, BarChart3,
  AlertTriangle, Lightbulb, MessageSquare, ChevronRight,
  Clock, Sparkles,
} from 'lucide-react';
import type { Agent, ActivityItem } from '../../types';

interface DashboardProps {
  agents: Agent[];
  activities: ActivityItem[];
}

// 动态类型 → 图标 & 色彩映射
const typeConfig: Record<string, { icon: typeof CheckCircle2; color: string; bg: string; glass: string }> = {
  task_done:         { icon: CheckCircle2,   color: 'text-success-green',   bg: 'bg-success-green/10', glass: 'card-glass-success' },
  content_published: { icon: FileText,       color: 'text-terracotta',   bg: 'bg-terracotta/10', glass: 'card-glass-warm' },
  lead_captured:     { icon: Users,          color: 'text-success-green',   bg: 'bg-success-green/10', glass: 'card-glass-success' },
  email_sent:        { icon: Mail,           color: 'text-olive-gray',   bg: 'bg-stone-gray/10', glass: 'card-glass' },
  report_ready:      { icon: BarChart3,      color: 'text-focus-blue',   bg: 'bg-focus-blue/10', glass: 'card-glass-blue' },
  alert:             { icon: AlertTriangle,  color: 'text-error-crimson', bg: 'bg-error-crimson/10', glass: 'card-glass-alert' },
  approval_needed:   { icon: Clock,          color: 'text-terracotta',   bg: 'bg-terracotta/10', glass: 'card-glass-warm' },
  customer_reply:    { icon: MessageSquare,  color: 'text-focus-blue',   bg: 'bg-focus-blue/10', glass: 'card-glass-blue' },
  insight:           { icon: Lightbulb,      color: 'text-amber-warm',   bg: 'bg-amber-warm/10', glass: 'card-glass-warm' },
};

// 优先级左侧条颜色
const priorityBar: Record<string, string> = {
  urgent: 'bg-error-crimson',
  high:   'bg-terracotta',
  normal: 'bg-transparent',
};

type FilterKey = 'all' | 'needs_action' | 'updates';

export default function Dashboard({ agents, activities }: DashboardProps) {
  const [filter, setFilter] = useState<FilterKey>('all');

  const totalTasks = agents.reduce((s, a) => s + a.todayTasks, 0);
  const runningCount = agents.filter((a) => a.status === 'running').length;

  // 需要你处理的 = approval_needed | alert | customer_reply(priority high/urgent)
  const needsAction = activities.filter(
    (a) => a.actionType === 'approve' || a.actionType === 'reply' || a.type === 'alert'
  );
  const updates = activities.filter(
    (a) => a.actionType !== 'approve' && a.actionType !== 'reply' && a.type !== 'alert'
  );

  const filtered = filter === 'needs_action' ? needsAction
    : filter === 'updates' ? updates
    : activities;

  return (
    <div className="flex-1 overflow-y-auto">
      {/* 顶部摘要区 */}
      <div className="px-8 pt-8 pb-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="heading-section text-xl text-near-black">
              {getGreeting()} 👋
            </h1>
            <p className="text-sm text-stone-gray mt-1">
              {new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' })}
            </p>
          </div>
        </div>

        {/* 一句话总结条 */}
        <div className="mt-4 flex items-center gap-4 p-3.5 card-glass-warm">
          <Sparkles size={16} className="text-terracotta shrink-0" />
          <p className="text-sm text-olive-gray">
            今天 <span className="text-near-black font-medium">{runningCount}</span> 名员工在线，
            已完成 <span className="text-near-black font-medium">{totalTasks}</span> 项任务
            {needsAction.length > 0 && (
              <>，有 <span className="text-terracotta font-medium">{needsAction.length}</span> 件事需要你处理</>
            )}
          </p>
        </div>
      </div>

      {/* 筛选标签 */}
      <div className="px-8 pb-3 flex items-center gap-1">
        <FilterTab
          label="全部动态"
          count={activities.length}
          active={filter === 'all'}
          onClick={() => setFilter('all')}
        />
        <FilterTab
          label="待我处理"
          count={needsAction.length}
          active={filter === 'needs_action'}
          onClick={() => setFilter('needs_action')}
          highlight={needsAction.length > 0}
        />
        <FilterTab
          label="工作进展"
          count={updates.length}
          active={filter === 'updates'}
          onClick={() => setFilter('updates')}
        />
      </div>

      {/* 时间线动态流 */}
      <div className="px-8 pb-8">
        <div className="space-y-2">
          {filtered.map((item, i) => (
            <ActivityCard key={item.id} item={item} index={i} />
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16 text-stone-gray text-sm">
            暂无动态
          </div>
        )}
      </div>
    </div>
  );
}

// ── 单条动态卡片 ──────────────────────────────────
function ActivityCard({ item, index }: { item: ActivityItem; index: number }) {
  const config = typeConfig[item.type] || typeConfig.task_done;
  const Icon = config.icon;
  const barColor = priorityBar[item.priority || 'normal'];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
      className={`relative flex items-start gap-3 p-4 ${config.glass} group`}
    >
      {/* 优先级左侧色条 */}
      {item.priority && item.priority !== 'normal' && (
        <div className={`absolute left-0 top-3 bottom-3 w-[3px] rounded-full ${barColor}`} />
      )}

      {/* 头像 */}
      <div className="shrink-0 mt-0.5">
        <div className={`w-9 h-9 rounded-full ${config.bg} flex items-center justify-center`}>
          <span className="text-base">{item.agentAvatar}</span>
        </div>
      </div>

      {/* 内容 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-xs text-stone-gray font-medium">{item.agentName}</span>
          <span className="text-[10px] text-warm-silver">·</span>
          <span className="text-[10px] text-warm-silver">{item.time}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Icon size={14} className={`shrink-0 ${config.color}`} />
          <h3 className="text-sm text-near-black font-medium truncate">{item.title}</h3>
        </div>
        {item.detail && (
          <p className="text-xs text-olive-gray mt-1 leading-relaxed line-clamp-2">{item.detail}</p>
        )}
      </div>

      {/* 操作按钮 */}
      {item.actionLabel && (
        <button
          className={`shrink-0 self-center text-xs font-medium px-3 py-1.5 rounded-lg transition-all
            ${item.actionType === 'approve'
              ? 'btn-terracotta !text-[11px] !px-3 !py-1.5'
              : 'btn-sand !text-[11px] !px-3 !py-1.5'
            }
          `}
        >
          {item.actionLabel}
          <ChevronRight size={12} className="ml-0.5 inline" />
        </button>
      )}
    </motion.div>
  );
}

// ── 筛选标签 ──────────────────────────────────────
function FilterTab({
  label, count, active, onClick, highlight,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
  highlight?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all
        ${active
          ? 'card-glass text-near-black !rounded-lg'
          : 'text-stone-gray hover:text-olive-gray hover:bg-warm-sand/30'
        }
      `}
    >
      {label}
      <span className={`min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-[10px] font-semibold
        ${active && highlight ? 'bg-terracotta text-ivory' :
          highlight ? 'bg-terracotta/15 text-terracotta' :
          active ? 'bg-warm-sand text-olive-gray' :
          'bg-warm-sand/50 text-stone-gray'}
      `}>
        {count}
      </span>
    </button>
  );
}

// ── 问候语 ────────────────────────────────────────
function getGreeting() {
  const h = new Date().getHours();
  if (h < 6) return '夜深了';
  if (h < 11) return '早上好';
  if (h < 14) return '中午好';
  if (h < 18) return '下午好';
  return '晚上好';
}
