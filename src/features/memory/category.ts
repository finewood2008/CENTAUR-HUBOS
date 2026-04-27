import type { MemoryEntry } from './types';
import { EMPTY_MEMORY_STATS, type MemoryCategory, type MemoryStatsSummary } from './types';

type SdkMemoryCategory = 'preference' | 'fact' | 'decision' | 'entity' | 'other';

function clampConfidence(value: unknown): number {
  if (typeof value !== 'number' || Number.isNaN(value)) return 1;
  return Math.min(1, Math.max(0, value));
}

export function mapSdkMemoryCategory(category: unknown): MemoryCategory {
  switch (category) {
    case 'preference':
      return 'preference';
    case 'fact':
    case 'entity':
      return 'fact';
    case 'decision':
      return 'lesson';
    case 'other':
      return 'correction';
    default:
      return 'fact';
  }
}

export function mapUiMemoryCategory(category: MemoryCategory): SdkMemoryCategory {
  switch (category) {
    case 'preference':
      return 'preference';
    case 'fact':
      return 'fact';
    case 'lesson':
      return 'decision';
    case 'correction':
      return 'other';
    default:
      return 'fact';
  }
}

export function normalizeSdkMemoryEntry(item: Record<string, unknown>): MemoryEntry | null {
  const content = typeof item.content === 'string' ? item.content.trim() : '';
  if (!content) return null;

  const id = typeof item.id === 'string'
    ? item.id
    : typeof item.entry_id === 'string'
      ? item.entry_id
      : `sdk-${Math.random().toString(36).slice(2, 10)}`;

  const createdAt = typeof item.created_at === 'string'
    ? item.created_at
    : typeof item.createdAt === 'string'
      ? item.createdAt
      : new Date().toISOString();

  const updatedAt = typeof item.updated_at === 'string'
    ? item.updated_at
    : typeof item.updatedAt === 'string'
      ? item.updatedAt
      : createdAt;

  return {
    id,
    content,
    source: 'manual',
    category: mapSdkMemoryCategory(item.category),
    target: 'memory',
    confidence: clampConfidence(item.importance),
    createdAt,
    updatedAt,
  };
}

export function buildMemoryStats(memories: MemoryEntry[]): MemoryStatsSummary {
  return memories.reduce<MemoryStatsSummary>((summary, entry) => {
    summary.total += 1;
    summary.categories[entry.category] += 1;
    return summary;
  }, {
    total: 0,
    categories: {
      ...EMPTY_MEMORY_STATS.categories,
    },
  });
}

export function normalizeMemoryStats(raw: Record<string, unknown> | null | undefined): MemoryStatsSummary {
  const categories: Record<MemoryCategory, number> = {
    ...EMPTY_MEMORY_STATS.categories,
  };

  const source = raw && typeof raw.by_category === 'object' && raw.by_category !== null
    ? raw.by_category as Record<string, unknown>
    : raw && typeof raw.categories === 'object' && raw.categories !== null
      ? raw.categories as Record<string, unknown>
      : {};

  for (const [key, value] of Object.entries(source)) {
    const mappedKey = mapSdkMemoryCategory(key);
    categories[mappedKey] += Number(value) || 0;
  }

  const total = typeof raw?.total === 'number'
    ? raw.total
    : Object.values(categories).reduce((sum, value) => sum + value, 0);

  return { total, categories };
}

export function sortMemories(memories: MemoryEntry[]): MemoryEntry[] {
  return [...memories].sort(
    (left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime(),
  );
}