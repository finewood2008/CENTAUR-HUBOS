// 小可记忆系统 — Zustand + localStorage
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface MemoryEntry {
  key: string;
  value: string;
  updatedAt: string;
}

interface XiaokeMemoryState {
  // 三层记忆
  customerProfile: MemoryEntry[];   // 客户画像库
  strategyHistory: MemoryEntry[];   // 投放策略历史
  funnelData: MemoryEntry[];        // 转化漏斗数据

  // actions
  setCustomerProfile: (entries: MemoryEntry[]) => void;
  addStrategy: (entry: MemoryEntry) => void;
  addFunnelData: (entry: MemoryEntry) => void;
  getFullContext: () => string;
  clearAll: () => void;
}

export const useXiaokeMemory = create<XiaokeMemoryState>()(
  persist(
    (set, get) => ({
      customerProfile: [],
      strategyHistory: [],
      funnelData: [],

      setCustomerProfile: (entries) => set({ customerProfile: entries }),

      addStrategy: (entry) => set((s) => ({
        strategyHistory: [...s.strategyHistory.slice(-19), entry],
      })),

      addFunnelData: (entry) => set((s) => ({
        funnelData: [...s.funnelData.slice(-19), entry],
      })),

      getFullContext: () => {
        const s = get();
        const parts: string[] = [];
        if (s.customerProfile.length) {
          parts.push('【客户画像】\n' + s.customerProfile.map(e => `${e.key}: ${e.value}`).join('\n'));
        }
        if (s.strategyHistory.length) {
          parts.push('【策略历史】\n' + s.strategyHistory.map(e => `${e.key}: ${e.value}`).join('\n'));
        }
        if (s.funnelData.length) {
          parts.push('【漏斗数据】\n' + s.funnelData.map(e => `${e.key}: ${e.value}`).join('\n'));
        }
        return parts.join('\n\n');
      },

      clearAll: () => set({ customerProfile: [], strategyHistory: [], funnelData: [] }),
    }),
    { name: 'xiaoke-memory' },
  ),
);
