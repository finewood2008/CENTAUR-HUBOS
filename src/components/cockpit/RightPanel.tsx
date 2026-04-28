import {
  Sparkles,
  Zap,
  Activity,
} from 'lucide-react';
import type { CentaurIndex } from '../../data/partner';
import { CENTAUR_LEVELS } from '../../data/partner';
import type { ScheduledTask, Task, TeamMember } from '../../data/partner';

interface RightPanelProps {
  connected: boolean;
  centaur: CentaurIndex | null;
  teamMembers?: TeamMember[];
  reviewTasks?: Task[];
  scheduledTasks?: ScheduledTask[];
}

function deriveCentaurIndex(
  connected: boolean,
  teamMembers: TeamMember[],
  reviewTasks: Task[],
  scheduledTasks: ScheduledTask[],
): CentaurIndex | null {
  if (!connected) return null;

  const onlineMembers = teamMembers.filter((member) => member.status !== 'offline').length;
  const enabledSchedules = scheduledTasks.filter((task) => task.enabled).length;
  const pendingReview = reviewTasks.length;
  const overall = Math.max(0, Math.min(100, 35 + onlineMembers * 8 + enabledSchedules * 5 - pendingReview * 4));
  const level = overall > 80 ? 'auto' : overall > 60 ? 'deep' : overall > 40 ? 'centaur' : overall > 20 ? 'initial' : 'manual';
  const trend = Array.from({ length: 7 }, (_, index) => Math.max(0, Math.min(100, overall - (6 - index) * 2)));

  return {
    overall,
    dimensions: [
      { key: 'team', label: '团队在线', ai: onlineMembers, human: Math.max(teamMembers.length - onlineMembers, 0), weight: 0.4 },
      { key: 'workflow', label: '自动日程', ai: enabledSchedules, human: pendingReview, weight: 0.35 },
      { key: 'approval', label: '人工确认', ai: Math.max(0, 10 - pendingReview), human: pendingReview, weight: 0.25 },
    ],
    trend,
    level,
    levelLabel: CENTAUR_LEVELS[level].label,
  };
}

export default function RightPanel({
  connected,
  centaur,
  teamMembers = [],
  reviewTasks = [],
  scheduledTasks = [],
}: RightPanelProps) {
  const currentCentaur = centaur ?? deriveCentaurIndex(connected, teamMembers, reviewTasks, scheduledTasks);
  const levelConfig = currentCentaur ? CENTAUR_LEVELS[currentCentaur.level] : null;
  const maxTrend = currentCentaur ? Math.max(...currentCentaur.trend) : 0;
  const trendDiff = currentCentaur ? currentCentaur.trend[currentCentaur.trend.length - 1] - currentCentaur.trend[0] : 0;
  const trend = currentCentaur?.trend ?? [0, 0, 0, 0, 0, 0, 0];
  const enabledSchedules = scheduledTasks.filter((task) => task.enabled).length;
  const efficiencyScore = connected
    ? Math.max(0, Math.min(100, teamMembers.length * 12 + enabledSchedules * 8 - reviewTasks.length * 5))
    : null;

  return (
    <div className="h-full overflow-y-auto custom-scrollbar px-4 py-4 space-y-5">

      {/* ── Section 1: Centaur Index ── */}
      <div className="bg-white/60 rounded-xl p-4 border border-border-cream/20">
        {/* Title */}
        <div className="flex items-center gap-1.5 mb-2.5">
          <Sparkles size={14} className="text-terracotta" />
          <h3 className="text-[12px] font-semibold text-charcoal-warm">半人马指数</h3>
        </div>

        {/* Big number + level */}
        <div className="flex items-baseline gap-0.5 mb-1">
          <span
            className={`text-[28px] font-bold font-serif ${currentCentaur && levelConfig ? levelConfig.color : 'text-stone-gray/50'}`}
            style={{ lineHeight: 1 }}
          >
            {currentCentaur ? currentCentaur.overall : '--'}
          </span>
          <span className="text-[11px] text-stone-gray">/100</span>
        </div>
        <div className={`text-[11px] ${currentCentaur && levelConfig ? levelConfig.color : 'text-stone-gray/60'} mb-3`}>
          {currentCentaur ? currentCentaur.levelLabel : '运行时离线'}
        </div>

        {/* Progress bar */}
        <div className="mb-1">
          <div className="h-2 rounded-full bg-gradient-to-r from-blue-200 to-blue-300 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-terracotta to-amber-400 transition-all"
              style={{ width: `${currentCentaur ? currentCentaur.overall : 0}%` }}
            />
          </div>
          <div className="flex justify-between mt-0.5">
            <span className="text-[9px] text-terracotta/70">AI</span>
            <span className="text-[9px] text-blue-400/70">人</span>
          </div>
        </div>

        {/* 7-day sparkline */}
        <div className="mt-3">
          <div className="flex items-end gap-[3px] h-[28px]">
            {trend.map((value, i) => {
              const heightPct = maxTrend > 0 ? (value / maxTrend) * 100 : 0;
              const isLast = i === trend.length - 1;
              return (
                <div
                  key={i}
                  className={`flex-1 rounded-t-sm ${
                    isLast
                      ? 'bg-gradient-to-t from-[#c17f59] to-[#e8a87c]'
                      : ''
                  }`}
                  style={{
                    height: `${heightPct}%`,
                    ...(isLast
                      ? {}
                      : { backgroundColor: 'rgba(193,127,89,0.2)' }),
                  }}
                />
              );
            })}
          </div>
          <div className="flex justify-between mt-0.5">
            <span className="text-[9px] text-stone-gray/40">7天前</span>
            <span className="text-[9px] text-stone-gray/40">今天</span>
          </div>
        </div>

        {/* Trend diff */}
        <div className="text-[10px] text-stone-gray/60 mt-2">
          {currentCentaur
            ? (trendDiff !== 0 ? `近7天变化 ${trendDiff > 0 ? '+' : ''}${trendDiff}` : '近7天无显著变化')
            : '连接本地运行时后计算半人马指数'}
        </div>
      </div>

      {/* ── Section 2: Team Performance ── */}
      <div className="bg-white/60 rounded-xl p-4 border border-border-cream/20">
        {/* Title */}
        <div className="flex items-center gap-1.5 mb-2.5">
          <Zap size={14} className="text-amber-500" />
          <h3 className="text-[12px] font-semibold text-charcoal-warm">团队效能</h3>
        </div>

        <div className="bg-white rounded-xl border border-border-cream/30 p-3 text-center">
          <div className="text-[16px] font-bold font-serif text-terracotta">
            {efficiencyScore === null ? '--' : efficiencyScore}
          </div>
          <div className="text-[10px] text-stone-gray mt-1">
            {connected
              ? `${teamMembers.length} 位员工 · ${enabledSchedules} 个启用日程 · ${reviewTasks.length} 个待审`
              : '连接本地运行时后显示团队效能'}
          </div>
        </div>
      </div>

      {/* ── Section 3: Team Feed ── */}
      <div className="bg-white/60 rounded-xl p-4 border border-border-cream/20">
        {/* Title */}
        <div className="flex items-center gap-1.5 mb-2.5">
          <Activity size={14} className="text-stone-gray" />
          <h3 className="text-[12px] font-semibold text-charcoal-warm">团队动态</h3>
        </div>

        <div className="rounded-xl border border-border-cream/30 bg-white px-3 py-4 text-center text-[11px] text-stone-gray">
          {connected ? '暂无真实团队动态事件流' : '运行时离线，暂无团队动态'}
        </div>
      </div>
    </div>
  );
}
