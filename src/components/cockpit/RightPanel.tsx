import {
  Sparkles,
  TrendingUp,
  Zap,
  CheckCircle2,
  Clock,
  Target,
  Users,
  Activity,
} from 'lucide-react';
import type { CentaurIndex } from '../../data/partner';
import { CENTAUR_LEVELS } from '../../data/partner';

interface RightPanelProps {
  centaur: CentaurIndex;
}

// ── Team Feed Items ──
const FEED_ITEMS = [
  { time: '10:30', text: '税宝 提交了4月税务申报', color: 'bg-amber-400' },
  { time: '10:00', text: '小可 新增12条线索', color: 'bg-blue-400' },
  { time: '09:30', text: '火花 完成文章初稿', color: 'bg-orange-400' },
  { time: '09:00', text: '阿拓 分配3项任务', color: 'bg-amber-500' },
];

// ── Team Performance Metrics ──
const PERF_METRICS = [
  { icon: CheckCircle2, color: 'text-emerald-500', value: '23项', label: '本周任务' },
  { icon: Clock, color: 'text-blue-500', value: '18h', label: '节省时间' },
  { icon: Target, color: 'text-terracotta', value: '87%', label: 'AI处理率' },
  { icon: Users, color: 'text-amber-500', value: '96%', label: '满意度' },
];

export default function RightPanel({ centaur }: RightPanelProps) {
  const levelConfig = CENTAUR_LEVELS[centaur.level];
  const maxTrend = Math.max(...centaur.trend);

  // Trend diff: last value minus first value
  const trendDiff = centaur.trend[centaur.trend.length - 1] - centaur.trend[0];

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
            className={`text-[28px] font-bold font-serif ${levelConfig.color}`}
            style={{ lineHeight: 1 }}
          >
            {centaur.overall}
          </span>
          <span className="text-[11px] text-stone-gray">/100</span>
        </div>
        <div className={`text-[11px] ${levelConfig.color} mb-3`}>
          {centaur.levelLabel}
        </div>

        {/* Progress bar */}
        <div className="mb-1">
          <div className="h-2 rounded-full bg-gradient-to-r from-blue-200 to-blue-300 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-terracotta to-amber-400 transition-all"
              style={{ width: `${centaur.overall}%` }}
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
            {centaur.trend.map((value, i) => {
              const heightPct = maxTrend > 0 ? (value / maxTrend) * 100 : 0;
              const isLast = i === centaur.trend.length - 1;
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
        {trendDiff !== 0 && (
          <div className="flex items-center gap-0.5 mt-1">
            <TrendingUp size={10} className="text-emerald-500" />
            <span className="text-[10px] text-emerald-500 font-medium">
              +{trendDiff}
            </span>
          </div>
        )}
      </div>

      {/* ── Section 2: Team Performance ── */}
      <div className="bg-white/60 rounded-xl p-4 border border-border-cream/20">
        {/* Title */}
        <div className="flex items-center gap-1.5 mb-2.5">
          <Zap size={14} className="text-amber-500" />
          <h3 className="text-[12px] font-semibold text-charcoal-warm">团队效能</h3>
        </div>

        {/* 2x2 Grid */}
        <div className="grid grid-cols-2 gap-2">
          {PERF_METRICS.map((metric) => {
            const Icon = metric.icon;
            return (
              <div
                key={metric.label}
                className="bg-white rounded-xl border border-border-cream/30 p-2.5 text-center"
              >
                <Icon size={15} className={`${metric.color} mx-auto mb-1`} />
                <div className="text-[16px] font-bold font-serif text-near-black">
                  {metric.value}
                </div>
                <div className="text-[10px] text-stone-gray">{metric.label}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Section 3: Team Feed ── */}
      <div className="bg-white/60 rounded-xl p-4 border border-border-cream/20">
        {/* Title */}
        <div className="flex items-center gap-1.5 mb-2.5">
          <Activity size={14} className="text-stone-gray" />
          <h3 className="text-[12px] font-semibold text-charcoal-warm">团队动态</h3>
        </div>

        {/* Timeline */}
        <div className="space-y-0">
          {FEED_ITEMS.map((item, i) => (
            <div key={i} className="flex gap-2.5 pb-2.5">
              {/* Left: dot + line */}
              <div className="flex flex-col items-center">
                <div className={`w-2 h-2 rounded-full ${item.color} shrink-0`} />
                {i < FEED_ITEMS.length - 1 && (
                  <div className="w-px flex-1 bg-border-cream/50 my-0.5" />
                )}
              </div>

              {/* Right: content */}
              <div className="min-w-0 flex-1">
                <div className="text-[10px] text-stone-gray/60">{item.time}</div>
                <div className="text-[11px] text-charcoal-warm leading-snug">
                  {item.text}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
