// TabMemory — 个人记忆
import { useState } from 'react';
import { Brain, Plus, Search, Layers } from 'lucide-react';
import type { DigitalEmployee } from '../../../types';

interface Props {
  emp: DigitalEmployee;
  config: ReturnType<typeof import('../../../hooks/useEmployeeConfig').useEmployeeConfig>;
  readonly?: boolean;
}

const CATEGORY_LABELS: Record<string, { label: string; color: string }> = {
  preference: { label: '偏好', color: 'bg-terracotta/10 text-terracotta' },
  fact:       { label: '事实', color: 'bg-olive-gray/10 text-olive-gray' },
  decision:   { label: '决策', color: 'bg-amber-500/10 text-amber-600' },
  entity:     { label: '实体', color: 'bg-success-green/10 text-success-green' },
  other:      { label: '其他', color: 'bg-stone-gray/10 text-stone-gray' },
};

export default function TabMemory({ emp, config, readonly }: Props) {
  const { data, addMemory, searchMemory } = config;
  const [newMem, setNewMem] = useState('');
  const [newCat, setNewCat] = useState('fact');
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const handleAdd = async () => {
    if (!newMem.trim() || readonly) return;
    await addMemory(newMem.trim(), newCat);
    setNewMem('');
  };

  const handleSearch = async () => {
    if (!query.trim()) { setSearchResults([]); return; }
    const results = await searchMemory(query.trim());
    setSearchResults(Array.isArray(results) ? results : []);
  };

  const totalByCategory = Object.entries(data.memoryStats.categories || {});

  return (
    <div className="space-y-5">
      {/* Stats */}
      <section className="card-glass-warm p-5">
        <div className="flex items-center gap-2 mb-3">
          <Brain size={14} className="text-terracotta" />
          <h3 className="font-serif text-sm text-near-black font-medium">{emp.name}的记忆体</h3>
          <span className="ml-auto text-[11px] text-stone-gray">共 {data.memoryStats.total} 条</span>
        </div>
        <p className="text-xs text-olive-gray mb-4">{emp.memorySystem.description}</p>

        {/* Category breakdown */}
        {totalByCategory.length > 0 && (
          <div className="grid grid-cols-4 gap-2">
            {totalByCategory.map(([cat, count]) => {
              const meta = CATEGORY_LABELS[cat] || CATEGORY_LABELS.other;
              return (
                <div key={cat} className={`rounded-lg p-2.5 text-center ${meta.color}`}>
                  <p className="text-lg font-serif">{count}</p>
                  <p className="text-[10px] opacity-80">{meta.label}</p>
                </div>
              );
            })}
          </div>
        )}

        {/* Memory layers (from employee spec) */}
        <div className="flex flex-wrap gap-1.5 mt-4">
          {emp.memorySystem.layers.map((l) => (
            <span key={l} className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-warm-sand/60 text-[10px] text-olive-gray">
              <Layers size={9} className="text-terracotta" />{l}
            </span>
          ))}
        </div>
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
              onChange={(e) => setNewCat(e.target.value)}
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

      {/* Search */}
      <section className="card-glass-warm p-5">
        <h3 className="font-serif text-sm text-near-black font-medium mb-3 flex items-center gap-2">
          <Search size={14} className="text-terracotta" />
          记忆检索
        </h3>
        <div className="flex items-center gap-2 mb-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="搜索关键词..."
            className="flex-1 text-xs bg-warm-sand/30 border border-border-cream rounded-lg px-3 py-2 focus:outline-none focus:border-terracotta/40"
          />
          <button onClick={handleSearch} className="btn-terracotta text-xs px-3 py-2">搜索</button>
        </div>
        {searchResults.length > 0 ? (
          <div className="space-y-1.5">
            {searchResults.map((r, i) => (
              <div key={i} className="p-2.5 rounded-lg bg-warm-sand/30 text-xs text-olive-gray">
                {r.content || JSON.stringify(r)}
              </div>
            ))}
          </div>
        ) : query && (
          <p className="text-[11px] text-stone-gray text-center py-4">无匹配结果</p>
        )}
      </section>
    </div>
  );
}
