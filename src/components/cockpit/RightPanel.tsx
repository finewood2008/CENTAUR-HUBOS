import {
  Sparkles,
  Zap,
  Activity,
} from 'lucide-react';
import type { CentaurIndex } from '../../data/partner';
import { CENTAUR_LEVELS } from '../../data/partner';

interface RightPanelProps {
  connected: boolean;
  centaur: CentaurIndex | null;
}

export default function RightPanel({ connected, centaur }: RightPanelProps) {
  const levelConfig = centaur ? CENTAUR_LEVELS[centaur.level] : null;
  const maxTrend = centaur ? Math.max(...centaur.trend) : 0;
  const trendDiff = centaur ? centaur.trend[centaur.trend.length - 1] - centaur.trend[0] : 0;
  const trend = centaur?.trend ?? [0, 0, 0, 0, 0, 0, 0];

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
            className={`text-[28px] font-bold font-serif ${centaur && levelConfig ? levelConfig.color : 'text-stone-gray/50'}`}
            style={{ lineHeight: 1 }}
          >
            {centaur ? centaur.overall : '--'}
          </span>
          <span className="text-[11px] text-stone-gray">/100</span>
        </div>
        <div className={`text-[11px] ${centaur && levelConfig ? levelConfig.color : 'text-stone-gray/60'} mb-3`}>
          {centaur ? centaur.levelLabel : connected ? '未接入真实指标' : '运行时离线'}
        </div>

        {/* Progress bar */}
        <div className="mb-1">
          <div className="h-2 rounded-full bg-gradient-to-r from-blue-200 to-blue-300 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-terracotta to-amber-400 transition-all"
              style={{ width: `${centaur ? centaur.overall : 0}%` }}
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
          {centaur
            ? (trendDiff !== 0 ? `近7天变化 ${trendDiff > 0 ? '+' : ''}${trendDiff}` : '近7天无显著变化')
            : '当前未接入可验证的半人马指数来源'}
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
          <div className="text-[16px] font-bold font-serif text-stone-gray/50">--</div>
          <div className="text-[10px] text-stone-gray mt-1">
            {connected ? '团队效能指标尚未接入真实数据源' : '连接本地运行时后显示真实团队效能'}
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
