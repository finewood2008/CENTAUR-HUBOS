// 关键指标行
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface Metric {
  label: string;
  value: string;
  change: number; // percentage, positive = up
  unit?: string;
}

const DEMO_METRICS: Metric[] = [
  { label: '本月线索', value: '680', change: 12.5 },
  { label: '转化率', value: '7.6%', change: 1.2 },
  { label: '获客成本', value: '¥128', change: -8.3 },
  { label: '客户LTV', value: '¥12.5K', change: 5.7 },
];

export default function MetricsRow({ metrics = DEMO_METRICS }: { metrics?: Metric[] }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {metrics.map((m) => {
        const isUp = m.change > 0;
        const isDown = m.change < 0;
        return (
          <div key={m.label} className="card-glass-warm p-3">
            <p className="text-[10px] text-stone-gray mb-1">{m.label}</p>
            <p className="text-xl font-serif text-near-black">{m.value}</p>
            <div className="flex items-center gap-1 mt-1">
              {isUp && <TrendingUp size={10} className="text-green-600" />}
              {isDown && <TrendingDown size={10} className="text-red-500" />}
              {!isUp && !isDown && <Minus size={10} className="text-stone-gray" />}
              <span className={`text-[10px] font-medium ${isUp ? 'text-green-600' : isDown ? 'text-red-500' : 'text-stone-gray'}`}>
                {isUp ? '+' : ''}{m.change}%
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
