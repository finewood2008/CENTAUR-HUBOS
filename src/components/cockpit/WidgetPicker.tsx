import type { WidgetLayout, WidgetType } from './cockpitData';
import { getDefaultLayout, WIDGET_REGISTRY, getWidgetConfig } from './cockpitData';
import { Plus } from 'lucide-react';

// ── 持久化 ──
const STORAGE_KEY = 'hubos_cockpit_layout';

export function loadLayout(): WidgetLayout {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as WidgetLayout;
      // 验证所有type都合法
      const allTypes = WIDGET_REGISTRY.map(w => w.type);
      if (parsed.left.every(t => allTypes.includes(t)) &&
          parsed.right.every(t => allTypes.includes(t))) {
        return parsed;
      }
    }
  } catch { /* ignore */ }
  return getDefaultLayout();
}

export function saveLayout(layout: WidgetLayout) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
}

// ── 兼容旧版: 从enabled列表迁移 ──
export function getEnabledWidgets(): WidgetType[] {
  const layout = loadLayout();
  return [...layout.left, ...layout.right];
}

// ── 底部工具条：显示已删除的widget供添加回来 ──
interface EditToolbarProps {
  layout: WidgetLayout;
  onAdd: (type: WidgetType, side: 'left' | 'right') => void;
  onDone: () => void;
}

export function EditToolbar({ layout, onAdd, onDone }: EditToolbarProps) {
  const activeTypes = [...layout.left, ...layout.right];
  const disabled = WIDGET_REGISTRY.filter(w => !activeTypes.includes(w.type));

  return (
    <div className="flex items-center gap-3 px-5 py-2.5 border-t border-border-cream bg-parchment/80 backdrop-blur-sm">
      {disabled.length > 0 && (
        <>
          <span className="text-[11px] text-stone-gray shrink-0">已移除：</span>
          <div className="flex items-center gap-2 flex-1 overflow-x-auto">
            {disabled.map(w => {
              const cfg = getWidgetConfig(w.type);
              return (
                <button
                  key={w.type}
                  onClick={() => onAdd(w.type, w.side)}
                  className="flex items-center gap-1.5 text-[12px] px-2.5 py-1.5 rounded-lg bg-white border border-border-cream hover:border-terracotta/40 hover:bg-terracotta/5 transition-colors whitespace-nowrap"
                >
                  <Plus size={12} className="text-terracotta" />
                  <span>{cfg.emoji}</span>
                  <span className="text-charcoal-warm">{cfg.label}</span>
                </button>
              );
            })}
          </div>
        </>
      )}
      {disabled.length === 0 && (
        <span className="text-[11px] text-stone-gray flex-1">所有面板已启用</span>
      )}
      <button onClick={onDone} className="btn-terracotta text-[12px] py-1.5 px-4 shrink-0">
        完成编辑
      </button>
    </div>
  );
}

export default EditToolbar;
