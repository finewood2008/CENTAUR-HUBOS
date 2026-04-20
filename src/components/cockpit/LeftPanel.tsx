import { AlertCircle, Zap } from 'lucide-react';
import type { Task } from '../../data/partner';

interface LeftPanelProps {
  reviewTasks: Task[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onQuickAction: (action: string) => void;
}

const QUICK_ACTIONS = [
  { emoji: '📝', label: '写篇文章' },
  { emoji: '📊', label: '看下数据' },
  { emoji: '🎨', label: '做个海报' },
  { emoji: '🎯', label: '跟进线索' },
];

export default function LeftPanel({ reviewTasks, onApprove, onReject, onQuickAction }: LeftPanelProps) {
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

      {/* ── Section 2: Quick Actions ── */}
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
