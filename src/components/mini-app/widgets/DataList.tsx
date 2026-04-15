// Mini App Widget: 列表（支持多种模板）
import type { ListWidget as ListWidgetConfig } from '../../../types/mini-app';

interface Props {
  config: ListWidgetConfig;
  data: Record<string, unknown>[];
}

export default function DataList({ config, data }: Props) {
  const titleKey = config.titleKey || 'title';
  const subtitleKey = config.subtitleKey || 'subtitle';
  const avatarKey = config.avatarKey || 'avatar';

  if (data.length === 0) {
    return (
      <div className="py-8 text-center text-gray-600 text-sm">
        {config.emptyText || '暂无数据'}
      </div>
    );
  }

  if (config.template === 'timeline') {
    return (
      <div className="relative pl-6 space-y-4">
        <div className="absolute left-[9px] top-2 bottom-2 w-px bg-white/10" />
        {data.map((item, i) => (
          <div key={i} className="relative">
            <div className="absolute -left-6 top-1.5 w-[7px] h-[7px] rounded-full bg-orange-400 ring-2 ring-gray-950" />
            <div className="bg-white/[0.03] rounded-xl border border-white/5 p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-white">{String(item[titleKey] ?? '')}</span>
                {item.time && <span className="text-[10px] text-gray-600">{String(item.time)}</span>}
              </div>
              {item[subtitleKey] && (
                <p className="text-xs text-gray-500">{String(item[subtitleKey])}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (config.template === 'card') {
    return (
      <div className="grid grid-cols-2 gap-3">
        {data.map((item, i) => (
          <div key={i} className="bg-white/[0.03] rounded-xl border border-white/5 p-4 hover:border-white/10 transition-colors">
            <div className="flex items-center gap-3 mb-2">
              {item[avatarKey] && <span className="text-xl">{String(item[avatarKey])}</span>}
              <span className="text-sm font-medium text-white">{String(item[titleKey] ?? '')}</span>
            </div>
            {item[subtitleKey] && (
              <p className="text-xs text-gray-500 leading-relaxed">{String(item[subtitleKey])}</p>
            )}
          </div>
        ))}
      </div>
    );
  }

  // simple / feed
  return (
    <div className="space-y-2">
      {data.map((item, i) => (
        <div
          key={i}
          className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/[0.03] transition-colors"
        >
          {item[avatarKey] && <span className="text-lg">{String(item[avatarKey])}</span>}
          <div className="flex-1 min-w-0">
            <span className="text-sm text-white">{String(item[titleKey] ?? '')}</span>
            {item[subtitleKey] && (
              <p className="text-xs text-gray-500 mt-0.5 truncate">{String(item[subtitleKey])}</p>
            )}
          </div>
          {item.time && <span className="text-[10px] text-gray-600 shrink-0">{String(item.time)}</span>}
        </div>
      ))}
    </div>
  );
}
