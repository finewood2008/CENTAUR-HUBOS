import { AlertCircle, Zap, Clock, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Task, ScheduledTask } from '../../data/partner';

interface LeftPanelProps {
  reviewTasks: Task[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onQuickAction: (action: string) => void;
  scheduledTasks: ScheduledTask[];
  onScheduleToggle: (id: string, enabled: boolean) => void;
  onScheduleDelete: (id: string) => void;
}

const QUICK_ACTIONS = [
  { emoji: '📝', label: '写篇文章' },
  { emoji: '📊', label: '看下数据' },
  { emoji: '🎨', label: '做个海报' },
  { emoji: '🎯', label: '跟进线索' },
];

export default function LeftPanel({
  reviewTasks,
  onApprove,
  onReject,
  onQuickAction,
  scheduledTasks,
  onScheduleToggle,
  onScheduleDelete,
}: LeftPanelProps) {

  const getScheduleLabel = (task: ScheduledTask) => {
    const { schedule } = task;
    const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
    switch (schedule.type) {
      case 'daily': return `每天 ${schedule.time}`;
      case 'weekly': return `每周${weekdays[schedule.weekday ?? 0]} ${schedule.time}`;
      case 'monthly': return `每月${schedule.dayOfMonth}日 ${schedule.time}`;
      case 'once': return `${schedule.date} ${schedule.time}`;
      default: return schedule.time;
    }
  };

  return (
    <div className="h-full overflow-y-auto custom-scrollbar px-3 py-4 space-y-5">
      {/* ── Section 1: Action Queue ── */}
      <section>
        <div className="flex items-center gap-1.5 mb-3">
          <AlertCircle size={14} className="text-amber-500" />
          <h3 className="text-[12px] font-semibold text-charcoal-warm">需要拍板</h3>
        </div>

        {reviewTasks.length === 0 ? (
          <div className="text-[12px] text-emerald-500 py-2 px-3">暂无待办 ✓</div>
        ) : (
          <div className="space-y-2">
            {reviewTasks.map((task) => (
              <div
                key={task.id}
                className="bg-white rounded-xl border border-border-cream/30 p-3 border-l-[3px] border-l-amber-400"
              >
                {/* Avatar + Title */}
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-sm">{task.assigneeAvatar}</span>
                  <span className="text-[12px] font-medium text-near-black truncate">
                    {task.title}
                  </span>
                </div>

                {/* Description */}
                {task.description && (
                  <p className="text-[11px] text-stone-gray truncate mb-2">
                    {task.description}
                  </p>
                )}

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onApprove(task.id)}
                    className="h-6 px-3 rounded-lg bg-emerald-500 text-white text-[11px] hover:bg-emerald-600 transition-colors"
                  >
                    批准
                  </button>
                  <button
                    onClick={() => onReject(task.id)}
                    className="h-6 px-3 rounded-lg border border-red-400 text-red-500 text-[11px] hover:bg-red-50 transition-colors"
                  >
                    驳回
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Section 2: Scheduled Tasks ── */}
      <section>
        <div className="flex items-center gap-1.5 mb-3">
          <Clock size={14} className="text-terracotta" />
          <h3 className="text-[12px] font-semibold text-charcoal-warm flex-1">定时任务</h3>
        </div>

        {scheduledTasks.length === 0 ? (
          <p className="text-[11px] text-stone-gray py-2 px-3">
            暂无定时任务，在对话中输入即可创建
          </p>
        ) : (
          <div className="space-y-1.5">
            <AnimatePresence initial={false}>
              {scheduledTasks.map((task) => (
                <motion.div
                  key={task.id}
                  layout
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.15 }}
                  className="group"
                >
                  <div className="flex items-start gap-2 py-2 px-2.5 rounded-lg bg-parchment/40 hover:bg-parchment/80 transition-colors">
                    {/* Toggle */}
                    <button
                      onClick={() => onScheduleToggle(task.id, !task.enabled)}
                      className={`mt-0.5 w-7 h-4 rounded-full transition-colors shrink-0 relative ${
                        task.enabled ? 'bg-terracotta' : 'bg-stone-gray/20'
                      }`}
                    >
                      <div
                        className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow-sm transition-transform ${
                          task.enabled ? 'left-3.5' : 'left-0.5'
                        }`}
                      />
                    </button>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-[12px] font-medium truncate ${
                        task.enabled ? 'text-near-black' : 'text-stone-gray'
                      }`}>
                        {task.title}
                      </p>
                      <p className="text-[10px] text-stone-gray truncate">
                        {getScheduleLabel(task)}
                        {task.nextRun && ` · 下次 ${task.nextRun}`}
                      </p>
                    </div>
                    {/* Delete */}
                    <button
                      onClick={() => onScheduleDelete(task.id)}
                      className="mt-0.5 p-0.5 rounded text-stone-gray/0 group-hover:text-stone-gray hover:!text-red-500 transition-colors shrink-0"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </section>

      {/* ── Section 3: Quick Actions ── */}
      <section>
        <div className="flex items-center gap-1.5 mb-3">
          <Zap size={14} className="text-charcoal-warm" />
          <h3 className="text-[12px] font-semibold text-charcoal-warm">快捷指令</h3>
        </div>

        <div className="space-y-1.5">
          {QUICK_ACTIONS.map((action) => (
            <button
              key={action.label}
              onClick={() => onQuickAction(action.label)}
              className="w-full flex items-center gap-2 py-2 px-3 rounded-lg bg-parchment/60 hover:bg-warm-sand/50 text-[12px] text-charcoal-warm transition-colors text-left"
            >
              <span>{action.emoji}</span>
              {action.label}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
