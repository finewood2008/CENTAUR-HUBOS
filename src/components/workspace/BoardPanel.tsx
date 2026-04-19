// BoardPanel — 看板容器，支持可编辑的数据展示
interface BoardItem {
  id: string;
  title: string;
  subtitle?: string;
  status?: string;
  statusColor?: string;
  meta?: string;
  data?: Record<string, any>;
}

interface BoardColumn {
  key: string;
  label: string;
  color: string;
  items: BoardItem[];
}

interface Props {
  title?: string;
  columns?: BoardColumn[];
  listItems?: BoardItem[];
  mode?: 'kanban' | 'list';
  onItemClick?: (item: BoardItem) => void;
  onStatusChange?: (itemId: string, newStatus: string) => void;
  children?: React.ReactNode;
}

export default function BoardPanel({ title, columns, listItems, mode = 'list', onItemClick, onStatusChange, children }: Props) {
  if (children) {
    return <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">{children}</div>;
  }

  if (mode === 'kanban' && columns) {
    return (
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {title && <h3 className="font-serif text-sm text-near-black font-medium mb-3">{title}</h3>}
        <div className="flex gap-3 overflow-x-auto pb-2">
          {columns.map((col) => (
            <div key={col.key} className="min-w-[200px] flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className={`w-2 h-2 rounded-full ${col.color}`} />
                <span className="text-xs text-olive-gray font-medium">{col.label}</span>
                <span className="text-[10px] text-stone-gray bg-warm-sand/60 px-1.5 rounded-full">{col.items.length}</span>
              </div>
              <div className="space-y-2">
                {col.items.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl bg-ivory/80 border border-border-cream hover:border-terracotta/20 cursor-pointer transition-colors"
                    onClick={() => onItemClick?.(item)}
                  >
                    <p className="text-xs text-near-black font-medium">{item.title}</p>
                    {item.subtitle && <p className="text-[10px] text-stone-gray mt-0.5">{item.subtitle}</p>}
                    {item.meta && <p className="text-[10px] text-olive-gray mt-1">{item.meta}</p>}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // list mode
  return (
    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
      {title && <h3 className="font-serif text-sm text-near-black font-medium mb-3">{title}</h3>}
      <div className="space-y-2">
        {(listItems || []).map((item) => (
          <div
            key={item.id}
            className="p-3 rounded-xl bg-ivory/80 border border-border-cream hover:border-terracotta/20 cursor-pointer transition-colors flex items-center gap-3"
            onClick={() => onItemClick?.(item)}
          >
            {item.statusColor && <span className={`w-2 h-2 rounded-full shrink-0 ${item.statusColor}`} />}
            <div className="flex-1 min-w-0">
              <p className="text-xs text-near-black font-medium truncate">{item.title}</p>
              {item.subtitle && <p className="text-[10px] text-stone-gray mt-0.5 truncate">{item.subtitle}</p>}
            </div>
            {item.meta && <span className="text-[10px] text-stone-gray shrink-0">{item.meta}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
