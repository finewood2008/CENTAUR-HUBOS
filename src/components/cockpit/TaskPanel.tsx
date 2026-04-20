import { useState } from 'react';
import { AlertCircle, Loader, CheckCircle2, ChevronDown, ChevronRight, ClipboardList } from 'lucide-react';
import type { Task, TaskStatus } from '../../data/partner';

interface TaskPanelProps {
  tasks: Task[];
  onApproveTask?: (id: string) => void;
  onRejectTask?: (id: string) => void;
}

export default function TaskPanel({ tasks, onApproveTask, onRejectTask }: TaskPanelProps) {
  const [completedExpanded, setCompletedExpanded] = useState(false);

  const reviewTasks = tasks.filter(t => t.status === 'review');
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress');
  const completedTasks = tasks.filter(t => t.status === 'completed');
  const totalCount = tasks.length;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Panel header */}
      <div className="shrink-0 px-5 pt-4 pb-3 border-b border-border-cream/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ClipboardList size={16} className="text-terracotta" />
            <span className="text-[14px] font-semibold text-near-black">任务面板</span>
          </div>
          <span className="text-[11px] text-stone-gray bg-border-cream/60 px-2 py-0.5 rounded-full">
            {totalCount} 项任务
          </span>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-5 py-4 space-y-5">

        {/* ── 待审批 Section ── */}
        {reviewTasks.length > 0 && (
          <section>
            <SectionHeader
              icon={<AlertCircle size={14} />}
              iconColor="text-amber-500"
              label="待审批"
              count={reviewTasks.length}
              badgeColor="bg-amber-500"
            />
            <div className="space-y-2.5 mt-2.5">
              {reviewTasks.map(task => (
                <div
                  key={task.id}
                  className="bg-white rounded-xl shadow-sm border border-border-cream/40 border-l-[3px] border-l-amber-400 p-3.5"
                >
                  <div className="flex items-start gap-2.5 mb-2">
                    <span className="text-lg leading-none shrink-0 mt-0.5">{task.assigneeAvatar}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-medium text-near-black leading-snug truncate">
                        {task.title}
                      </p>
                      <p className="text-[11px] text-stone-gray mt-0.5">
                        {task.assigneeName} · {task.createdAt}
                      </p>
                    </div>
                  </div>
                  {task.description && (
                    <p className="text-[12px] text-charcoal-warm leading-relaxed mb-2.5 pl-[30px]">
                      {task.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 pl-[30px]">
                    <button
                      onClick={() => onApproveTask?.(task.id)}
                      className="flex-1 h-7 rounded-lg bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white text-[12px] font-medium transition-colors"
                    >
                      批准
                    </button>
                    <button
                      onClick={() => onRejectTask?.(task.id)}
                      className="flex-1 h-7 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-600 text-[12px] font-medium transition-colors border border-red-200"
                    >
                      驳回
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── 进行中 Section ── */}
        {inProgressTasks.length > 0 && (
          <section>
            <SectionHeader
              icon={<Loader size={14} className="animate-spin" style={{ animationDuration: '3s' }} />}
              iconColor="text-terracotta"
              label="进行中"
              count={inProgressTasks.length}
              badgeColor="bg-terracotta"
            />
            <div className="space-y-2.5 mt-2.5">
              {inProgressTasks.map(task => (
                <div
                  key={task.id}
                  className="bg-white rounded-xl shadow-sm border border-border-cream/40 p-3.5"
                >
                  <div className="flex items-start gap-2.5">
                    <span className="text-lg leading-none shrink-0 mt-0.5">{task.assigneeAvatar}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-medium text-near-black leading-snug truncate">
                        {task.title}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] text-stone-gray">{task.assigneeName}</span>
                        {task.deadline && (
                          <>
                            <span className="text-[11px] text-stone-gray/40">·</span>
                            <span className="text-[11px] text-stone-gray">截止 {task.deadline}</span>
                          </>
                        )}
                      </div>
                      {/* Progress bar */}
                      {task.progress != null && (
                        <div className="mt-2.5 flex items-center gap-2">
                          <div className="flex-1 h-1.5 rounded-full bg-border-cream/80 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-terracotta transition-all duration-500 ease-out"
                              style={{ width: `${Math.min(100, Math.max(0, task.progress))}%` }}
                            />
                          </div>
                          <span className="text-[11px] text-stone-gray font-medium tabular-nums shrink-0">
                            {task.progress}%
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── 已完成 Section ── */}
        {completedTasks.length > 0 && (
          <section>
            <button
              onClick={() => setCompletedExpanded(prev => !prev)}
              className="w-full"
            >
              <SectionHeader
                icon={<CheckCircle2 size={14} />}
                iconColor="text-emerald-500"
                label="已完成"
                count={completedTasks.length}
                badgeColor="bg-emerald-500"
                trailing={
                  completedExpanded
                    ? <ChevronDown size={14} className="text-stone-gray" />
                    : <ChevronRight size={14} className="text-stone-gray" />
                }
              />
            </button>
            {completedExpanded && (
              <div className="space-y-2 mt-2.5">
                {completedTasks.map(task => (
                  <div
                    key={task.id}
                    className="bg-white/60 rounded-xl border border-border-cream/30 p-3 opacity-70"
                  >
                    <div className="flex items-center gap-2.5">
                      <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                      <span className="text-lg leading-none shrink-0">{task.assigneeAvatar}</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[12px] text-charcoal-warm leading-snug truncate line-through decoration-stone-gray/30">
                          {task.title}
                        </p>
                        <p className="text-[11px] text-stone-gray mt-0.5">
                          {task.assigneeName} · {task.createdAt}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Empty state */}
        {totalCount === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <ClipboardList size={32} className="text-stone-gray/40 mb-3" />
            <p className="text-[13px] text-stone-gray">暂无任务</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Section Header Sub-Component ── */

interface SectionHeaderProps {
  icon: React.ReactNode;
  iconColor: string;
  label: string;
  count: number;
  badgeColor: string;
  trailing?: React.ReactNode;
}

function SectionHeader({ icon, iconColor, label, count, badgeColor, trailing }: SectionHeaderProps) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={iconColor}>{icon}</span>
      <span className="text-[12px] font-semibold text-charcoal-warm">{label}</span>
      <span
        className={`ml-0.5 min-w-[18px] h-[18px] rounded-full ${badgeColor} text-white text-[10px] flex items-center justify-center font-semibold px-1`}
      >
        {count}
      </span>
      {trailing && <span className="ml-auto">{trailing}</span>}
    </div>
  );
}
