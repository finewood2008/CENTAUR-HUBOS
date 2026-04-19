// 线索漏斗可视化
interface FunnelStage {
  label: string;
  count: number;
  color: string;
}

const DEMO_STAGES: FunnelStage[] = [
  { label: '曝光', count: 12500, color: 'bg-blue-400' },
  { label: '点击', count: 3200, color: 'bg-cyan-400' },
  { label: '留资', count: 680, color: 'bg-teal-400' },
  { label: '跟进', count: 245, color: 'bg-emerald-400' },
  { label: '成交', count: 52, color: 'bg-green-500' },
];

export default function LeadFunnel({ stages = DEMO_STAGES }: { stages?: FunnelStage[] }) {
  const maxCount = stages[0]?.count || 1;

  return (
    <div className="space-y-2">
      {stages.map((stage, i) => {
        const widthPct = Math.max((stage.count / maxCount) * 100, 12);
        const rate = i > 0 ? ((stage.count / stages[i - 1].count) * 100).toFixed(1) : null;
        return (
          <div key={stage.label} className="flex items-center gap-3">
            <span className="text-[11px] text-stone-gray w-8 text-right">{stage.label}</span>
            <div className="flex-1 h-7 bg-warm-sand/30 rounded-lg overflow-hidden relative">
              <div
                className={`h-full ${stage.color} rounded-lg transition-all duration-700 flex items-center px-2`}
                style={{ width: `${widthPct}%` }}
              >
                <span className="text-[10px] text-white font-medium whitespace-nowrap">
                  {stage.count.toLocaleString()}
                </span>
              </div>
            </div>
            {rate && (
              <span className="text-[10px] text-olive-gray w-12">{rate}%</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
