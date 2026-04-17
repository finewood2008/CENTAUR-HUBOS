import { Users, Clock, Zap, CheckCircle } from 'lucide-react';

// ── 团队概览 ──
export function TeamOverviewWidget() {
  const agents = [
    { name: '火花 Spark',  emoji: '🔥', status: 'working' as const },
    { name: 'HR 助理',     emoji: '👤', status: 'idle' as const },
    { name: '数据分析师',   emoji: '📊', status: 'working' as const },
    { name: '客服专员',     emoji: '💬', status: 'waiting' as const },
  ];

  const statusLabel: Record<string, string> = {
    working: '工作中', idle: '空闲', waiting: '等待中',
  };
  const statusDot: Record<string, string> = {
    working: 'status-dot-active', idle: 'status-dot-idle', waiting: 'bg-amber',
  };

  return (
    <div className="card-glass p-4">
      <div className="flex items-center gap-2 mb-3">
        <Users size={15} className="text-terracotta" />
        <h3 className="text-[13px] font-semibold text-near-black">团队概览</h3>
        <span className="text-[11px] text-stone-gray ml-auto">
          {agents.filter(a => a.status === 'working').length}/{agents.length} 工作中
        </span>
      </div>
      <div className="space-y-2">
        {agents.map(a => (
          <div key={a.name} className="flex items-center gap-2.5 py-1">
            <span className="text-base">{a.emoji}</span>
            <span className="text-[12px] text-charcoal-warm flex-1 truncate">{a.name}</span>
            <span className={`status-dot ${statusDot[a.status]}`} />
            <span className="text-[11px] text-stone-gray w-12 text-right">{statusLabel[a.status]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── 待办事项 ──
export function PendingTasksWidget() {
  const tasks = [
    { id: 1, text: '审批：新员工张三入职', agent: '🔥', urgent: true },
    { id: 2, text: '确认：本周内容排期表', agent: '📊', urgent: false },
    { id: 3, text: '回复：3条客户咨询', agent: '💬', urgent: true },
  ];

  return (
    <div className="card-glass p-4">
      <div className="flex items-center gap-2 mb-3">
        <Clock size={15} className="text-terracotta" />
        <h3 className="text-[13px] font-semibold text-near-black">待办事项</h3>
        <span className="badge-terracotta text-[10px] px-1.5 py-0 ml-auto">{tasks.length}</span>
      </div>
      <div className="space-y-2">
        {tasks.map(t => (
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
export function QuickActionsWidget() {
  const actions = [
    { label: '分配任务',   emoji: '📝' },
    { label: '查看报表',   emoji: '📊' },
    { label: '发布内容',   emoji: '📣' },
    { label: '招聘管理',   emoji: '👥' },
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
