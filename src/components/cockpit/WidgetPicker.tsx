import { useState, useEffect } from 'react';
import { Settings, X, Check } from 'lucide-react';
import { WIDGET_REGISTRY } from './cockpitData';
import type { WidgetType } from './cockpitData';

const STORAGE_KEY = 'hubos_cockpit_widgets';

export function getEnabledWidgets(): WidgetType[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return WIDGET_REGISTRY.filter(w => w.defaultEnabled).map(w => w.type);
}

export function saveEnabledWidgets(types: WidgetType[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(types));
}

interface WidgetPickerProps {
  open: boolean;
  onClose: () => void;
  enabled: WidgetType[];
  onChange: (types: WidgetType[]) => void;
}

export default function WidgetPicker({ open, onClose, enabled, onChange }: WidgetPickerProps) {
  const [draft, setDraft] = useState<WidgetType[]>(enabled);

  useEffect(() => { setDraft(enabled); }, [enabled]);

  if (!open) return null;

  const toggle = (t: WidgetType) => {
    setDraft(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
  };

  const handleSave = () => {
    onChange(draft);
    saveEnabledWidgets(draft);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-near-black/30 backdrop-blur-sm">
      <div className="card-glass w-[420px] max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border-cream">
          <div className="flex items-center gap-2">
            <Settings size={16} className="text-terracotta" />
            <h3 className="heading-card text-[15px]">自定义工作台</h3>
          </div>
          <button onClick={onClose} className="btn-ghost p-1">
            <X size={16} />
          </button>
        </div>

        {/* Widget list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Left column widgets */}
          <div>
            <div className="text-overline mb-2">左侧面板</div>
            {WIDGET_REGISTRY.filter(w => w.side === 'left').map(w => (
              <label
                key={w.type}
                className="flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-parchment cursor-pointer transition-colors"
              >
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                  draft.includes(w.type)
                    ? 'bg-terracotta border-terracotta'
                    : 'border-border-warm bg-white'
                }`}>
                  {draft.includes(w.type) && <Check size={13} className="text-white" />}
                </div>
                <div className="flex-1">
                  <div className="text-[13px] font-medium text-near-black">{w.label}</div>
                  <div className="text-[11px] text-stone-gray">{w.description}</div>
                </div>
              </label>
            ))}
          </div>

          {/* Right column widgets */}
          <div>
            <div className="text-overline mb-2">右侧面板</div>
            {WIDGET_REGISTRY.filter(w => w.side === 'right').map(w => (
              <label
                key={w.type}
                className="flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-parchment cursor-pointer transition-colors"
              >
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                  draft.includes(w.type)
                    ? 'bg-terracotta border-terracotta'
                    : 'border-border-warm bg-white'
                }`}>
                  {draft.includes(w.type) && <Check size={13} className="text-white" />}
                </div>
                <div className="flex-1">
                  <div className="text-[13px] font-medium text-near-black">{w.label}</div>
                  <div className="text-[11px] text-stone-gray">{w.description}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border-cream flex justify-end gap-2">
          <button onClick={onClose} className="btn-sand text-[13px]">取消</button>
          <button onClick={handleSave} className="btn-terracotta text-[13px]">保存</button>
        </div>
      </div>
    </div>
  );
}
