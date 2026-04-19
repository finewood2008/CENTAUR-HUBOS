// sparkMemoryStore.ts — 三层记忆系统 (zustand + localStorage)
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface MemoryItem {
  key: string;
  value: string;
  updatedAt: string;
}

interface SparkMemoryState {
  // 三层记忆
  identity: MemoryItem[];     // 品牌档案: 公司名、行业、品牌调性…
  preferences: MemoryItem[];  // 偏好: 喜欢的风格、语气、排版习惯…
  context: MemoryItem[];      // 上下文: 最近话题、正在进行的项目…

  // actions
  setIdentity: (key: string, value: string) => void;
  addPreference: (key: string, value: string) => void;
  addContext: (key: string, value: string) => void;
  removeItem: (layer: 'identity' | 'preferences' | 'context', key: string) => void;
  getFullContext: (mode?: 'full' | 'brief') => string;
  clearAll: () => void;
}

const now = () => new Date().toISOString();

function upsert(list: MemoryItem[], key: string, value: string): MemoryItem[] {
  const idx = list.findIndex((it) => it.key === key);
  const item: MemoryItem = { key, value, updatedAt: now() };
  if (idx >= 0) {
    const next = [...list];
    next[idx] = item;
    return next;
  }
  return [...list, item];
}

export const useSparkMemory = create<SparkMemoryState>()(
  persist(
    (set, get) => ({
      identity: [],
      preferences: [],
      context: [],

      setIdentity: (key, value) =>
        set((s) => ({ identity: upsert(s.identity, key, value) })),

      addPreference: (key, value) =>
        set((s) => ({ preferences: upsert(s.preferences, key, value) })),

      addContext: (key, value) =>
        set((s) => ({ context: upsert(s.context, key, value) })),

      removeItem: (layer, key) =>
        set((s) => ({ [layer]: s[layer].filter((it) => it.key !== key) })),

      getFullContext: (mode = 'full') => {
        const { identity, preferences, context } = get();
        const lines: string[] = [];

        if (identity.length > 0) {
          lines.push('【品牌档案】');
          identity.forEach((it) => lines.push(`- ${it.key}: ${it.value}`));
        }

        if (preferences.length > 0) {
          lines.push('【用户偏好】');
          preferences.forEach((it) => lines.push(`- ${it.key}: ${it.value}`));
        }

        if (mode === 'full' && context.length > 0) {
          lines.push('【当前上下文】');
          // 只取最近 10 条
          context
            .slice(-10)
            .forEach((it) => lines.push(`- ${it.key}: ${it.value}`));
        }

        return lines.join('\n');
      },

      clearAll: () => set({ identity: [], preferences: [], context: [] }),
    }),
    {
      name: 'spark-memory',
    },
  ),
);
