import type { MemoryEntry as StoreMemoryEntry } from '../../stores/personaStore';

export type MemoryEntry = StoreMemoryEntry;
export type MemoryCategory = StoreMemoryEntry['category'];

export interface MemoryStatsSummary {
  total: number;
  categories: Record<MemoryCategory, number>;
}

export interface MemoryMutationResult {
  ok: boolean;
  usedFallback: boolean;
  error?: string;
}

export interface AgentMemorySnapshot {
  memories: MemoryEntry[];
  stats: MemoryStatsSummary;
  loading: boolean;
  error: string | null;
  usingFallback: boolean;
  didTruncate: boolean;
}

export const EMPTY_MEMORY_STATS: MemoryStatsSummary = {
  total: 0,
  categories: {
    preference: 0,
    fact: 0,
    lesson: 0,
    correction: 0,
  },
};

export const EMPTY_AGENT_MEMORY_SNAPSHOT: AgentMemorySnapshot = {
  memories: [],
  stats: EMPTY_MEMORY_STATS,
  loading: false,
  error: null,
  usingFallback: false,
  didTruncate: false,
};