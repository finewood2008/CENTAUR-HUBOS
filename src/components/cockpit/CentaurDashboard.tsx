import { useState } from 'react';
import {
  Sparkles, TrendingUp, Zap, CheckCircle2, Users, Target,
  ChevronDown, ChevronRight, AlertCircle, Loader, ClipboardList, Clock,
} from 'lucide-react';
import type { Task, CentaurIndex, CentaurDimension } from '../../data/partner';
import { CENTAUR_LEVELS } from '../../data/partner';

interface CentaurDashboardProps {
  tasks: Task[];
  centaur: CentaurIndex;
  onApproveTask?: (id: string) => void;
  onRejectTask?: (id: string) => void;
}

export default function CentaurDashboard({
  tasks,
  centaur,
  onApproveTask,
  onRejectTask,
}: CentaurDashboardProps) {
  const [completedExpanded, setCompletedExpanded] = useState(false);

  const reviewTasks = tasks.filter(t => t.status === 'review');
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress');
  const completedTasks = tasks.filter(t => t.status === 'completed');
  const levelInfo = CENTAUR_LEVELS[centaur.level];
  const maxTrend = Math.max(...centaur.trend, 1);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Panel header */}
      <div className="shrink-0 px-5 pt-4 pb-3 border-b border-border-cream/30">
        <div className="flex items-center gap-2">
          <ClipboardList size={16} className="text-terracotta" />
          <span className="text-[14px] font-semibold text-near-black">数据面板</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar px-5 py-4 space-y-5">

        {/* ═══ Section 1: 半人马指数详情 ═══ */}
        <section className="bg-gradient-to-br from-white to-parchment/50 rounded-xl border border-border-cream/40 p-4 shadow-sm">
          {/* Header */}
          <div className="flex items-center gap-1.5 mb-3">
            <Sparkles size={14} className="text-terracotta" />
            <span className="text-[12px] font-semibold text-charcoal-warm">半人马指数</span>
          </div>

          {/* Big number + level */}
          <div className="flex items-end justify-between mb-3">
            <div className="flex items-baseline gap-1">
              <span className={`text-[36px] font-bold leading-none ${levelInfo.color}`}>
                {centaur.overall}
              </span>
              <span className="text-[13px] text-stone-gray/60 font-medium">/100</span>
            </div>
            <div className="text-right">
              <span className={`text-[12px] font-semibold ${levelInfo.color}`}>{centaur.levelLabel}</span>
              <div className="text-[10px] text-stone-gray/60 mt-0.5">
                AI {centaur.overall}% · 人 {100 - centaur.overall}%
              </div>
            </div>
          </div>

          {/* Full progress bar */}
          <div className="flex items-center gap-2 mb-4">
            <span className="text-[9px] text-terracotta font-medium w-4">AI</span>
            <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden flex">
              <div
                className="h-full rounded-l-full bg-gradient-to-r from-terracotta to-amber-400 transition-all duration-700"
                style={{ width: `${centaur.overall}%` }}
              />
              <div
                className="h-full rounded-r-full bg-gradient-to-r from-blue-200 to-blue-300"
                style={{ width: `${100 - centaur.overall}%` }}
              />
            </div>
            <span className="text-[9px] text-blue-400 font-medium w-4 text-right">人</span>
          </div>

          {/* Dimension breakdown */}
          <div className="space-y-2">
            {centaur.dimensions.map(d => {
              const total = d.ai + d.human;
              const pct = total > 0 ? Math.round((d.ai / total) * 100) : 0;
              return (
                <div key={d.key} className="flex items-center gap-2">
                  <span className="text-[11px] text-charcoal-warm w-[52px] shrink-0">{d.label}</span>
                  <div className="flex-1 h-[5px] rounded-full bg-gray-100 overflow-hidden flex">
                    <div
                      className="h-full rounded-l-full bg-terracotta/70 transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-stone-gray tabular-nums w-8 text-right">{pct}%</span>
                  <span className="text-[9px] text-stone-gray/50 w-3 text-center">
                    {Math.round(d.weight * 100)}
                  </span>
                </div>
              );
            })}
            <div className="text-[9px] text-stone-gray/40 text-right">权重%</div>
          </div>

          {/* Trend */}
          <div className="mt-3 pt-3 border-t border-border-cream/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-stone-gray">7日趋势</span>
              <div className="flex items-center gap-1">
                <TrendingUp size={11} className="text-emerald-500" />
                <span className="text-[10px] text-emerald-600 font-medium">
                  +{centaur.trend[centaur.trend.length - 1] - centaur.trend[0]}
                </span>
              </div>
            </div>
            <div className="flex items-end gap-[4px] h-[32px]">
              {centaur.trend.map((v, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-t-sm transition-all"
                  style={{
                    height: `${(v / maxTrend) * 100}%`,
                    background: i === centaur.trend.length - 1
                      ? 'linear-gradient(to top, #c17f59, #e8a87c)'
                      : 'rgba(193,127,89,0.2)',
                  }}
                />
              ))}
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[9px] text-stone-gray/40">7天前</span>
              <span className="text-[9px] text-stone-gray/40">今天</span>
            </div>
          </div>
        </section>

        {/* ═══ Section 2: 团队效能 ═══ */}
        <section>
          <div className="flex items-center gap-1.5 mb-2.5">
            <Zap size={14} className="text-amber-500" />
            <span className="text-[12px] font-semibold text-charcoal-warm">团队效能</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { icon: CheckCircle2, color: 'text-emerald-500', value: '23项', label: '本周任务' },
              { icon: Clock, color: 'text-blue-500', value: '18h', label: '节省时间' },
              { icon: Target, color: 'text-terracotta', value: '87%', label: 'AI处理率' },
              { icon: Users, color: 'text-amber-500', value: '96%', label: '满意度' },
            ].map(m => (
              <div key={m.label} className="bg-white rounded-xl border border-border-cream/30 p-3 text-center shadow-sm">
                <m.icon size={15} className={`${m.color} mx-auto mb-1`} />
                <div className="text-[16px] font-bold text-near-black font-serif">{m.value}</div>
                <div className="text-[10px] text-stone-gray">{m.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ═══ Section 3: 任务概览 ═══ */}
        <section>
          <div className="flex items-center gap-1.5 mb-2.5">
            <ClipboardList size={14} className="text-terracotta" />
            <span className="text-[12px] font-semibold text-charcoal-warm">任务概览</span>
            <span className="text-[10px] text-stone-gray ml-auto">{tasks.length}项</span>
          </div>

          {/* Status distribution bar */}
          {tasks.length > 0 && (
            <div className="mb-3">
              <div className="h-2 rounded-full overflow-hidden flex bg-gray-100">
                {inProgressTasks.length > 0 && (
                  <div
                    className="h-full bg-terracotta"
                    style={{ width: `${(inProgressTasks.length / tasks.length) * 100}%` }}
                  />
                )}
                {reviewTasks.length > 0 && (
                  <div
                    className="h-full bg-amber-400"
                    style={{ width: `${(reviewTasks.length / tasks.length) * 100}%` }}
                  />
                )}
                {completedTasks.length > 0 && (
                  <div
                    className="h-full bg-emerald-400"
                    style={{ width: `${(completedTasks.length / tasks.length) * 100}%` }}
                  />
                )}
              </div>
              <div className="flex gap-3 mt-1.5">
                <span className="flex items-center gap-1 text-[10px] text-stone-gray">
                  <span className="w-2 h-2 rounded-full bg-terracotta" />进行中 {inProgressTasks.length}
                </span>
                <span className="flex items-center gap-1 text-[10px] text-stone-gray">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />待审批 {reviewTasks.length}
                </span>
                <span className="flex items-center gap-1 text-[10px] text-stone-gray">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />已完成 {completedTasks.length}
                </span>
              </div>
            </div>
          )}

          {/* Review tasks */}
          {reviewTasks.length > 0 && (
            <div className="space-y-2 mb-2">
              {reviewTasks.map(task => (
                <div key={task.id} className="bg-white rounded-xl shadow-sm border border-border-cream/40 border-l-[3px] border-l-amber-400 p-3">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-base leading-none">{task.assigneeAvatar}</span>
                    <span className="text-[12px] font-medium text-near-black truncate flex-1">{task.title}</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700 font-medium shrink-0">审批</span>
                  </div>
                  <div className="flex gap-2 pl-6">
                    <button onClick={() => onApproveTask?.(task.id)} className="flex-1 h-6 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-[11px] font-medium transition-colors">批准</button>
                    <button onClick={() => onRejectTask?.(task.id)} className="flex-1 h-6 rounded-lg border border-red-200 text-red-500 text-[11px] font-medium hover:bg-red-50 transition-colors">驳回</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* In-progress tasks */}
          {inProgressTasks.length > 0 && (
            <div className="space-y-2 mb-2">
              {inProgressTasks.map(task => (
                <div key={task.id} className="bg-white rounded-xl shadow-sm border border-border-cream/40 p-3">
                  <div className="flex items-center gap-2">
                    <span className="text-base leading-none">{task.assigneeAvatar}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-medium text-near-black truncate">{task.title}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] text-stone-gray">{task.assigneeName}</span>
                        {task.deadline && <span className="text-[10px] text-stone-gray/50">· 截止{task.deadline}</span>}
                      </div>
                    </div>
                  </div>
                  {task.progress != null && (
                    <div className="flex items-center gap-2 mt-2 pl-6">
                      <div className="flex-1 h-1.5 rounded-full bg-border-cream/80 overflow-hidden">
                        <div className="h-full rounded-full bg-terracotta transition-all" style={{ width: `${task.progress}%` }} />
                      </div>
                      <span className="text-[10px] text-stone-gray tabular-nums">{task.progress}%</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Completed (collapsible) */}
          {completedTasks.length > 0 && (
            <div>
              <button onClick={() => setCompletedExpanded(p => !p)} className="flex items-center gap-1.5 text-[11px] text-stone-gray hover:text-charcoal-warm transition-colors w-full">
                {completedExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                <CheckCircle2 size={12} className="text-emerald-400" />
                已完成 {completedTasks.length}
              </button>
              {completedExpanded && (
                <div className="space-y-1.5 mt-1.5">
                  {completedTasks.map(task => (
                    <div key={task.id} className="flex items-center gap-2 px-2 py-1.5 opacity-60">
                      <CheckCircle2 size={12} className="text-emerald-400 shrink-0" />
                      <span className="text-[11px] text-charcoal-warm truncate line-through decoration-stone-gray/30">{task.title}</span>
                      <span className="text-[10px] text-stone-gray shrink-0">{task.assigneeName}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>

        {/* ═══ Section 4: 今日活跃 ═══ */}
        <section>
          <div className="flex items-center gap-1.5 mb-2.5">
            <Clock size={14} className="text-stone-gray" />
            <span className="text-[12px] font-semibold text-charcoal-warm">今日活跃</span>
          </div>
          <div className="space-y-0">
            {[
              { time: '09:00', text: '阿拓 分配了3项任务', color: 'bg-amber-400' },
              { time: '09:30', text: '火花 完成文章初稿', color: 'bg-orange-400' },
              { time: '10:00', text: '小可 新增12条线索', color: 'bg-blue-400' },
              { time: '10:30', text: '税宝 提交税务申报', color: 'bg-amber-400' },
            ].map((item, i, arr) => (
              <div key={i} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className={`w-2 h-2 rounded-full ${item.color} shrink-0 mt-1.5`} />
                  {i < arr.length - 1 && <div className="w-px flex-1 bg-border-cream/50 my-0.5" />}
                </div>
                <div className="pb-3 min-w-0">
                  <span className="text-[10px] text-stone-gray/60">{item.time}</span>
                  <p className="text-[11px] text-charcoal-warm leading-snug">{item.text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}
