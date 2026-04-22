// TabMemory — 个人记忆
import { useState, useEffect } from 'react';
import { Brain, Plus, Trash2 } from 'lucide-react';
import { usePersonaStore } from '../../../stores/personaStore';
import { SOUL_DEFAULTS } from '../../../data/persona-defaults';
import type { DigitalEmployee } from '../../../types';
import { useMemoryData } from '../../../hooks/useQeeClaw';

interface Props {
  emp: DigitalEmployee;
  readonly?: boolean;
}

const CATEGORY_LABELS: Record<string, { label: string; color: string }> = {
  preference:  { label: '偏好', color: 'bg-terracotta/10 text-terracotta' },
  fact:        { label: '事实', color: 'bg-olive-gray/10 text-olive-gray' },
  lesson:      { label: '经验', color: 'bg-amber-500/10 text-amber-600' },
  correction:  { label: '纠正', color: 'bg-success-green/10 text-success-green' },
};

type MemoryCategory = 'preference' | 'fact' | 'lesson' | 'correction';

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  } catch {
    return iso;
  }
}

export default function TabMemory({ emp, readonly }: Props) {
  const initializeEmployee = usePersonaStore((state) => state.initializeEmployee);
  const charLimit = usePersonaStore((state) => state.employees[emp.id]?.memoryCharLimit ?? 2000);
  const [newMem, setNewMem] = useState('');
  const [newCat, setNewCat] = useState<MemoryCategory>('fact');
  const [toast, setToast] = useState('');
  const {
    memories,
    stats,
    loading,
    usingFallback,
    didTruncate,
    supportsOrganize,
    addMemory,
    deleteMemory,
  } = useMemoryData(emp);

  // Initialize employee persona on mount if not exists
  useEffect(() => {
    const defaultSoul = SOUL_DEFAULTS.find((s) => s.employeeId === emp.id)?.soul ?? '';
    initializeEmployee(emp.id, defaultSoul);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [emp.id]);

  const charUsed = memories.reduce((sum, m) => sum + m.content.length, 0);
  const charPercent = charLimit > 0 ? Math.min(100, Math.round((charUsed / charLimit) * 100)) : 0;

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2000);
  };

  const handleAdd = async () => {
    if (!newMem.trim() || readonly) return;
    if (charUsed + newMem.trim().length > charLimit) {
      showToast('字符超限，请先清理旧记忆');
      return;
    }
    const result = await addMemory(newMem.trim(), newCat);
    if (!result.ok) return;

    setNewMem('');
    showToast(result.usedFallback ? '记忆已保存到本地，等待同步' : '记忆已保存');
  };

  const handleDelete = async (memoryId: string) => {
    if (readonly) return;
    const result = await deleteMemory(memoryId);
    if (result.usedFallback) {
      showToast('删除已在本地生效，等待同步');
    }
  };

  return (
    <div className="space-y-5">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 px-4 py-2 rounded-lg bg-near-black/80 text-white text-xs shadow-lg animate-fade-in">
          {toast}
        </div>
      )}

      {/* Stats */}
      <section className="card-glass-warm p-5">
        <div className="flex items-center gap-2 mb-3">
          <Brain size={14} className="text-terracotta" />
          <h3 className="font-serif text-sm text-near-black font-medium">{emp.name}的记忆体</h3>
          <span className="ml-auto text-[11px] text-stone-gray">共 {stats.total} 条</span>
        </div>

        {usingFallback && (
          <p className="mb-3 text-[11px] text-stone-gray">SDK 不可用，当前显示本地回退记忆</p>
        )}

        {didTruncate && (
          <p className="mb-3 text-[11px] text-stone-gray">当前仅展示最近部分记忆，完整列表需要服务端分页支持</p>
        )}

        {/* Char usage progress bar */}
        <div className="mb-3">
          <div className="flex items-center justify-between text-[10px] text-olive-gray mb-1">
            <span>字符用量</span>
            <span>{charUsed} / {charLimit}</span>
          </div>
          <div className="w-full h-1.5 bg-warm-sand/60 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                charPercent > 90 ? 'bg-red-400' : charPercent > 70 ? 'bg-amber-400' : 'bg-terracotta/60'
              }`}
              style={{ width: `${charPercent}%` }}
            />
          </div>
        </div>

        {/* Category breakdown */}
        {memories.length > 0 && (
          <div className="grid grid-cols-4 gap-2">
            {(Object.keys(CATEGORY_LABELS) as MemoryCategory[]).map((cat) => {
              const count = memories.filter((m) => m.category === cat).length;
              const meta = CATEGORY_LABELS[cat];
              return (
                <div key={cat} className={`rounded-lg p-2.5 text-center ${meta.color}`}>
                  <p className="text-lg font-serif">{count}</p>
                  <p className="text-[10px] opacity-80">{meta.label}</p>
                </div>
              );
            })}
          </div>
        )}

        {supportsOrganize && <div className="mt-3" />}
      </section>

      {/* Add memory */}
      <section className="card-glass-warm p-5">
        <h3 className="font-serif text-sm text-near-black font-medium mb-3 flex items-center gap-2">
          <Plus size={14} className="text-terracotta" />
          添加记忆
        </h3>
        <div className="space-y-2">
          <textarea
            value={newMem}
            onChange={(e) => setNewMem(e.target.value)}
            disabled={readonly}
            placeholder={readonly ? '该员工尚未激活' : '记住这件事... 例如: 用户偏好温暖色调,讨厌花哨设计'}
            className="w-full text-xs bg-warm-sand/30 border border-border-cream rounded-lg p-3 min-h-[60px] focus:outline-none focus:border-terracotta/40 disabled:opacity-60"
          />
          <div className="flex items-center gap-2">
            <select
              value={newCat}
              onChange={(e) => setNewCat(e.target.value as MemoryCategory)}
              disabled={readonly}
              className="text-xs bg-warm-sand/30 border border-border-cream rounded-lg px-2 py-1.5 focus:outline-none focus:border-terracotta/40"
            >
              {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
            <button
              onClick={handleAdd}
              disabled={readonly || !newMem.trim()}
              className="btn-terracotta ml-auto text-xs px-3 py-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              保存
            </button>
          </div>
        </div>
      </section>

      {/* Memory list */}
      <section className="card-glass-warm p-5">
        <h3 className="font-serif text-sm text-near-black font-medium mb-3 flex items-center gap-2">
          <Brain size={14} className="text-terracotta" />
          记忆列表
        </h3>
        {loading ? (
          <p className="text-[11px] text-stone-gray text-center py-6">加载记忆中...</p>
        ) : memories.length > 0 ? (
          <div className="space-y-2">
            {[...memories].reverse().map((m) => {
              const meta = CATEGORY_LABELS[m.category] || CATEGORY_LABELS.fact;
              return (
                <div key={m.id} className="flex items-start gap-2 p-2.5 rounded-lg bg-warm-sand/30">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-near-black leading-relaxed break-words">{m.content}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] ${meta.color}`}>
                        {meta.label}
                      </span>
                      <span className="text-[10px] text-stone-gray">{formatDate(m.createdAt)}</span>
                    </div>
                  </div>
                  {!readonly && (
                    <button
                      onClick={() => handleDelete(m.id)}
                      className="flex-shrink-0 p-1 rounded hover:bg-red-50 text-stone-gray hover:text-red-400 transition-colors"
                      title="删除记忆"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-[11px] text-stone-gray text-center py-6">暂无记忆条目</p>
        )}
      </section>
    </div>
  );
}
