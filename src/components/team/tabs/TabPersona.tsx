// TabPersona — 员工人格设定 (灵魂 + 认知概览)
import { useState, useEffect, useMemo } from 'react';
import { Sparkles, Eye, User, ChevronDown, ChevronRight, Pencil, Save, X } from 'lucide-react';
import type { DigitalEmployee } from '../../../types';
import { usePersonaStore } from '../../../stores/personaStore';
import { SOUL_DEFAULTS } from '../../../data/persona-defaults';
import { useSharedContext } from '../../../features/shared-context/useSharedContext';

interface Props {
  emp: DigitalEmployee;
  readonly?: boolean;
}

interface SoulSection {
  title: string;
  body: string;
}

function parseSoul(soul: string): SoulSection[] {
  if (!soul) return [];
  const parts = soul.split(/^## /m).filter(Boolean);
  return parts.map((part) => {
    const lines = part.trim().split('\n');
    const title = lines[0].replace(/^#+\s*/, '').trim();
    const body = lines.slice(1).join('\n').trim();
    return { title, body };
  });
}

export default function TabPersona({ emp, readonly }: Props) {
  const store = usePersonaStore();
  const { shared } = useSharedContext();
  const [editing, setEditing] = useState(false);
  const [soulDraft, setSoulDraft] = useState('');
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [toast, setToast] = useState('');

  // Initialize on mount
  useEffect(() => {
    const def = SOUL_DEFAULTS.find((s) => s.employeeId === emp.id);
    if (def) store.initializeEmployee(emp.id, def.soul);
  }, [emp.id]);

  const soul = store.getSoul(emp.id);
  const memories = store.getMemories(emp.id);
  const sections = useMemo(() => parseSoul(soul), [soul]);

  const toggleSection = (title: string) => {
    setCollapsed((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  const startEdit = () => {
    setSoulDraft(soul);
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
    setSoulDraft('');
  };

  const saveSoul = () => {
    store.setSoul(emp.id, soulDraft);
    setEditing(false);
    setToast('灵魂设定已保存');
    setTimeout(() => setToast(''), 2000);
  };

  const SECTION_ICONS: Record<string, string> = {
    '身份': '🎭', '性格特质': '💎', '说话方式': '💬',
    '工作原则': '📐', '能力范围': '🎯', '我的工具': '🔧',
  };

  return (
    <div className="space-y-5">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-4 right-4 z-50 bg-near-black text-white text-xs px-4 py-2 rounded-lg shadow-lg">
          {toast}
        </div>
      )}

      {/* Section 1: Soul */}
      <section className="card-glass-warm p-5">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles size={14} className="text-terracotta" />
          <h3 className="font-serif text-sm text-near-black font-medium">灵魂设定</h3>
          <span className="text-[10px] text-stone-gray ml-1">SOUL.md</span>
          {!readonly && !editing && (
            <button onClick={startEdit} className="ml-auto flex items-center gap-1 text-[11px] text-terracotta hover:text-terracotta/80">
              <Pencil size={11} />编辑
            </button>
          )}
          {editing && (
            <div className="ml-auto flex items-center gap-2">
              <button onClick={cancelEdit} className="flex items-center gap-1 text-[11px] text-stone-gray hover:text-near-black">
                <X size={11} />取消
              </button>
              <button onClick={saveSoul} className="flex items-center gap-1 text-[11px] text-white bg-terracotta hover:bg-terracotta/90 px-2.5 py-1 rounded-md">
                <Save size={11} />保存
              </button>
            </div>
          )}
        </div>

        {editing ? (
          <textarea
            value={soulDraft}
            onChange={(e) => setSoulDraft(e.target.value)}
            className="w-full text-xs bg-warm-sand/30 border border-border-cream rounded-lg p-4 min-h-[300px] focus:outline-none focus:border-terracotta/40 font-mono leading-relaxed"
            placeholder="# 员工的灵魂&#10;&#10;## 身份&#10;..."
          />
        ) : sections.length > 0 ? (
          <div className="space-y-1">
            {sections.map((sec) => {
              const isCollapsed = collapsed[sec.title] ?? false;
              const icon = SECTION_ICONS[sec.title] || '📌';
              return (
                <div key={sec.title} className="rounded-lg overflow-hidden">
                  <button
                    onClick={() => toggleSection(sec.title)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-warm-sand/40 rounded-lg transition-colors"
                  >
                    <span className="text-xs">{icon}</span>
                    {isCollapsed ? <ChevronRight size={12} className="text-stone-gray" /> : <ChevronDown size={12} className="text-stone-gray" />}
                    <span className="text-xs font-medium text-near-black">{sec.title}</span>
                  </button>
                  {!isCollapsed && sec.body && (
                    <div className="px-3 pb-3 pl-8">
                      <div className="text-xs text-olive-gray leading-relaxed whitespace-pre-wrap">
                        {sec.body.split('\n').map((line, i) => {
                          if (line.startsWith('- ')) {
                            return <div key={i} className="flex gap-1.5 py-0.5"><span className="text-terracotta/60 shrink-0">•</span><span>{line.slice(2)}</span></div>;
                          }
                          if (/^\d+\.\s/.test(line)) {
                            const num = line.match(/^(\d+)\./)?.[1];
                            const text = line.replace(/^\d+\.\s*/, '');
                            return <div key={i} className="flex gap-1.5 py-0.5"><span className="text-terracotta/60 shrink-0 w-3 text-right">{num}.</span><span>{text}</span></div>;
                          }
                          return line ? <p key={i} className="py-0.5">{line}</p> : <div key={i} className="h-1" />;
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-stone-gray text-center py-6">尚未设定灵魂，点击编辑开始</p>
        )}
      </section>

      {/* Section 2: Context Overview */}
      <section className="card-glass-warm p-5">
        <div className="flex items-center gap-2 mb-3">
          <Eye size={14} className="text-terracotta" />
          <h3 className="font-serif text-sm text-near-black font-medium">认知概览</h3>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl bg-warm-sand/40 p-3 text-center">
            <p className="text-lg font-serif text-near-black">{memories.length}</p>
            <p className="text-[10px] text-stone-gray">记忆条数</p>
          </div>
          <div className="rounded-xl bg-warm-sand/40 p-3 text-center">
            <p className="text-lg font-serif text-near-black">{shared.company ? '✓' : '—'}</p>
            <p className="text-[10px] text-stone-gray">企业认知</p>
          </div>
          <div className="rounded-xl bg-warm-sand/40 p-3 text-center">
            <p className="text-lg font-serif text-near-black">{shared.boss ? '✓' : '—'}</p>
            <p className="text-[10px] text-stone-gray">老板认知</p>
          </div>
        </div>
      </section>

      {/* Section 3: Identity Preview */}
      <section className="card-glass-warm p-5">
        <div className="flex items-center gap-2 mb-4">
          <User size={14} className="text-terracotta" />
          <h3 className="font-serif text-sm text-near-black font-medium">对外形象</h3>
        </div>
        <div className="flex items-start gap-4">
          <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${emp.color} flex items-center justify-center text-2xl shadow-sm`}>
            {emp.avatar}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-serif text-base text-near-black font-medium">{emp.name}</h4>
            <p className="text-xs text-terracotta">{emp.role}</p>
            <p className="text-xs text-olive-gray mt-1">{emp.tagline}</p>
            {sections[0]?.body && (
              <p className="text-[11px] text-stone-gray mt-2 line-clamp-2">
                {sections[0].body.split('\n').filter(Boolean)[0]}
              </p>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-3">
          {emp.capabilities.slice(0, 6).map((c) => (
            <span key={c} className="px-2 py-0.5 rounded-md bg-warm-sand/60 text-[10px] text-olive-gray">{c}</span>
          ))}
        </div>
      </section>
    </div>
  );
}
