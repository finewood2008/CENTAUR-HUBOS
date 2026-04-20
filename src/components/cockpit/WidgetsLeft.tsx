import { useState } from 'react';
import { Users, Clock, Zap, CheckCircle, X, Cpu, Calendar, FileText } from 'lucide-react';
import type { Agent, ActivityItem, NavTab } from '../../types';

// ── 员工快捷详情面板 ──
function AgentDetailPopover({ agent, onClose, onNav }: { agent: Agent; onClose: () => void; onNav?: (tab: NavTab) => void }) {
  const statusColor = agent.status === 'running' ? 'text-success-green' : agent.status === 'error' ? 'text-red-500' : 'text-stone-gray';
  const statusLabel = agent.status === 'running' ? '🟢 工作中' : agent.status === 'error' ? '🔴 异常' : '⚪ 空闲';

  return (
    <div className="absolute left-full top-0 ml-2 w-[260px] card-glass p-4 shadow-lg z-50 border border-border-cream animate-in fade-in slide-in-from-left-2 duration-150">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{agent.avatar}</span>
          <div>
            <div className="text-[13px] font-semibold text-near-black">{agent.name}</div>
            <div className="text-[11px] text-stone-gray">{agent.role}</div>
          </div>
        </div>
        <button onClick={onClose} className="text-stone-gray hover:text-near-black transition-colors p-0.5">
          <X size={14} />
        </button>
      </div>

      <div className="space-y-2.5">
        {/* Status */}
        <div className="flex items-center gap-2 text-[12px]">
          <span className={statusColor}>{statusLabel}</span>
        </div>

        {/* Model */}
        <div className="flex items-center gap-2 text-[12px] text-charcoal-warm">
          <Cpu size={12} className="text-stone-gray shrink-0" />
          <span className="truncate">{agent.model}</span>
        </div>

        {/* Tasks */}
        <div className="flex items-center gap-2 text-[12px] text-charcoal-warm">
          <FileText size={12} className="text-stone-gray shrink-0" />
          <span>今日任务: {agent.todayTasks} 项</span>
        </div>

        {/* Hire Date */}
        {agent.hireDate && (
          <div className="flex items-center gap-2 text-[12px] text-charcoal-warm">
            <Calendar size={12} className="text-stone-gray shrink-0" />
            <span>入职: {agent.hireDate}</span>
          </div>
        )}

        {/* Today Summary */}
        {agent.todaySummary && (
          <div className="mt-2 p-2 bg-parchment rounded-lg">
            <div className="text-[11px] text-stone-gray mb-1">今日摘要</div>
            <p className="text-[12px] text-charcoal-warm leading-relaxed">{agent.todaySummary}</p>
          </div>
        )}

        {/* Skills */}
        {agent.skills && agent.skills.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {agent.skills.slice(0, 4).map(s => (
              <span key={s} className="text-[10px] px-1.5 py-0.5 bg-border-cream rounded-full text-olive-gray">{s}</span>
            ))}
            {agent.skills.length > 4 && (
              <span className="text-[10px] px-1.5 py-0.5 text-stone-gray">+{agent.skills.length - 4}</span>
            )}
          </div>
        )}

        {/* Budget */}
        <div className="mt-2">
          <div className="flex justify-between text-[11px] text-stone-gray mb-1">
            <span>预算使用</span>
            <span>{agent.budgetUsed}% / {agent.budgetPercent}%</span>
          </div>
          <div className="h-1.5 bg-border-cream rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${agent.budgetUsed > agent.budgetPercent * 0.9 ? 'bg-red-400' : 'bg-terracotta/60'}`}
              style={{ width: `${Math.min(100, (agent.budgetUsed / Math.max(agent.budgetPercent, 1)) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      <button
        onClick={() => { onClose(); onNav?.('employees'); }}
        className="w-full mt-3 text-[12px] py-1.5 rounded-lg bg-terracotta/10 text-terracotta hover:bg-terracotta/20 transition-colors"
      >
        查看详情 →
      </button>
    </div>
  );
}

// ── 团队概览 ──
interface TeamOverviewProps {
  agents?: Agent[];
  loading?: boolean;
  isConnected?: boolean;
  onNav?: (tab: NavTab) => void;
}

export function TeamOverviewWidget({ agents, loading, isConnected, onNav }: TeamOverviewProps) {
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
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

  const items = (useSDK ? agents! : []).map(a => ({
        name: a.name,
        emoji: a.avatar || '🤖',
        status: a.status === 'running' ? 'working' : a.status === 'error' ? 'error' : 'idle',
      }));

  // 完整 Agent 对象用于详情面板
  const fullAgents = useSDK ? agents! : [];

  const workingCount = items.filter(a =>
    a.status === 'working' || a.status === 'running'
  ).length;

  return (
    <div className="card-glass p-4 relative">
      <div className="flex items-center gap-2 mb-3">
        <Users size={15} className="text-terracotta" />
        <h3 className="text-[13px] font-semibold text-near-black">团队概览</h3>
        <span className="text-[11px] text-stone-gray ml-auto">
          {workingCount}/{items.length} 工作中
        </span>
      </div>
      <div className="space-y-2">
        {items.map((a, idx) => (
          <div
            key={a.name}
            className={`flex items-center gap-2.5 py-1 hover:bg-parchment rounded-lg px-1 transition-colors cursor-pointer ${selectedAgent?.name === a.name ? 'bg-parchment' : ''}`}
            onClick={() => {
              const agent = fullAgents.find(fa => fa.name === a.name) || fullAgents[idx];
              if (agent) {
                setSelectedAgent(selectedAgent?.name === a.name ? null : agent);
              }
            }}
          >
            <span className="text-base">{a.emoji}</span>
            <span className="text-[12px] text-charcoal-warm flex-1 truncate">{a.name}</span>
            <span className={`status-dot ${statusDot[a.status] || 'status-dot-idle'}`} />
            <span className="text-[11px] text-stone-gray w-12 text-right">
              {statusLabel[a.status] || a.status}
            </span>
          </div>
        ))}
      </div>

      {/* Detail popover */}
      {selectedAgent && (
        <AgentDetailPopover
          agent={selectedAgent}
          onClose={() => setSelectedAgent(null)}
          onNav={onNav}
        />
      )}
    </div>
  );
}

// ── 待办事项 ──
interface PendingTasksProps {
  approvals?: unknown[];
  activities?: ActivityItem[];
  loading?: boolean;
  isConnected?: boolean;
  onNav?: (tab: NavTab) => void;
  onAction?: (id: string | number, action: 'approved' | 'rejected') => void;
}

export function PendingTasksWidget({ approvals, activities, loading, isConnected, onNav, onAction }: PendingTasksProps) {
  const [expandedId, setExpandedId] = useState<string | number | null>(null);
  const [handledItems, setHandledItems] = useState<Map<string | number, 'approved' | 'rejected'>>(new Map());
  const [notes, setNotes] = useState<Record<string | number, string>>({});

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

  type TaskItem = { id: string | number; text: string; agent: string; urgent: boolean; detail?: string };
  let tasks: TaskItem[];

  if (useSDK) {
    tasks = approvals!.map((a: any, i: number) => ({
      id: a.id || `approval-${i}`,
      text: a.title || a.summary || `审批项 ${i + 1}`,
      agent: '📋',
      urgent: a.status === 'pending' || a.priority === 'high',
      detail: a.detail || a.description || '',
    }));
  } else if (useActivities) {
    tasks = activities!
      .filter(a => a.type === 'approval_needed')
      .map(a => ({
        id: a.id,
        text: a.title,
        agent: a.agentAvatar || '📋',
        urgent: a.priority === 'urgent' || a.priority === 'high',
        detail: '',
      }));
  } else {
    tasks = [];
  }

  const handleAction = (id: string | number, action: 'approved' | 'rejected') => {
    setHandledItems(prev => new Map(prev).set(id, action));
    setExpandedId(null);
    onAction?.(id, action);
  };

  const toggleExpand = (id: string | number) => {
    if (handledItems.has(id)) return;
    setExpandedId(prev => (prev === id ? null : id));
  };

  return (
    <div className="card-glass p-4">
      <div className="flex items-center gap-2 mb-3">
        <Clock size={15} className="text-terracotta" />
        <h3
          className="text-[13px] font-semibold text-near-black cursor-pointer hover:text-terracotta transition-colors"
          onClick={() => onNav?.('employees')}
        >
          待办事项
        </h3>
        <span className="badge-terracotta text-[10px] px-1.5 py-0 ml-auto">{tasks.length}</span>
      </div>
      <div className="space-y-2">
        {tasks.slice(0, 5).map(t => {
          const handled = handledItems.get(t.id);
          const isExpanded = expandedId === t.id && !handled;

          return (
            <div key={t.id} className="rounded-lg transition-colors">
              {/* Task row */}
              <div
                className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-parchment transition-colors cursor-pointer group"
                onClick={() => toggleExpand(t.id)}
              >
                <span className="text-sm">{t.agent}</span>
                <span className={`text-[12px] flex-1 truncate ${t.urgent ? 'text-near-black font-medium' : 'text-charcoal-warm'}`}>
                  {t.text}
                </span>
                {handled ? (
                  <span className={`text-[11px] shrink-0 ${handled === 'approved' ? 'text-success-green' : 'text-terracotta'}`}>
                    {handled === 'approved' ? '✅ 已通过' : '❌ 已驳回'}
                  </span>
                ) : (
                  <>
                    {t.urgent && <span className="w-1.5 h-1.5 rounded-full bg-terracotta shrink-0" />}
                    <CheckCircle
                      size={14}
                      className="text-stone-gray opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAction(t.id, 'approved');
                      }}
                    />
                  </>
                )}
              </div>

              {/* Expanded detail panel */}
              {isExpanded && (
                <div className="mx-2 mt-1 mb-2 p-3 bg-parchment rounded-lg border border-border-cream">
                  <p className="text-[12px] text-charcoal-warm mb-2 leading-relaxed">
                    {t.detail || '暂无详细信息'}
                  </p>
                  <textarea
                    className="w-full text-[11px] text-charcoal-warm bg-white/60 border border-border-cream rounded-md p-2 mb-2 resize-none focus:outline-none focus:border-terracotta/40 placeholder:text-stone-gray"
                    rows={2}
                    placeholder="添加备注（可选）…"
                    value={notes[t.id] || ''}
                    onChange={(e) => setNotes(prev => ({ ...prev, [t.id]: e.target.value }))}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="flex gap-2 justify-end">
                    <button
                      className="text-[11px] px-3 py-1 rounded-md border border-terracotta text-terracotta hover:bg-terracotta/10 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAction(t.id, 'rejected');
                      }}
                    >
                      驳回
                    </button>
                    <button
                      className="text-[11px] px-3 py-1 rounded-md bg-success-green text-white hover:bg-success-green/90 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAction(t.id, 'approved');
                      }}
                    >
                      通过
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
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
    { label: '团队管理', emoji: '👥', tab: 'employees' },
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
