// Mini App Widget: 统计卡片
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { StatWidget as StatWidgetConfig } from '../../../types/mini-app';

interface Props {
  config: StatWidgetConfig;
}

export default function StatCards({ config }: Props) {
  const cols = config.columns || config.items.length;
  const gridClass =
    cols === 2 ? 'grid-cols-2' :
    cols === 3 ? 'grid-cols-3' :
    cols === 4 ? 'grid-cols-4' : `grid-cols-${Math.min(cols, 4)}`;

  return (
    <div className={`grid ${gridClass} gap-3`}>
      {config.items.map((item, i) => (
        <div
          key={i}
          className="bg-white/[0.03] rounded-xl border border-white/5 p-4"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-500">{item.label}</span>
            {item.icon && <span className="text-base">{item.icon}</span>}
          </div>
          <div className="text-xl font-semibold text-white">{item.value}</div>
          {item.change && (
            <div className={`flex items-center gap-1 mt-1 text-xs ${
              item.trend === 'up' ? 'text-green-400' :
              item.trend === 'down' ? 'text-red-400' : 'text-gray-500'
            }`}>
              {item.trend === 'up' ? <TrendingUp size={12} /> :
               item.trend === 'down' ? <TrendingDown size={12} /> :
               <Minus size={12} />}
              {item.change}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
