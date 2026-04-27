import { getClientAsync } from '../../services/qeeclaw';
import { usePersonaStore } from '../../stores/personaStore';
import { buildMemoryStats, mapUiMemoryCategory, normalizeMemoryStats, normalizeSdkMemoryEntry, sortMemories } from './category';
import { EMPTY_MEMORY_STATS, type AgentMemorySnapshot, type MemoryCategory, type MemoryMutationResult } from './types';

const MEMORY_SCOPE = {
  teamId: 1,
  runtimeType: 'hermes' as const,
};

const DEFAULT_MEMORY_FETCH_LIMIT = 200;
const MAX_MEMORY_FETCH_LIMIT = 2000;

function readCachedAgentMemory(agentId: string, error?: string): AgentMemorySnapshot {
  const cachedMemories = sortMemories(usePersonaStore.getState().getCachedMemories(agentId));
  return {
    memories: cachedMemories,
    stats: buildMemoryStats(cachedMemories),
    loading: false,
    error: error ?? null,
    usingFallback: true,
    didTruncate: false,
  };
}

async function syncPendingMemoryOperations(agentId: string) {
  const client = await getClientAsync();
  const store = usePersonaStore.getState();
  const pendingOps = store.getPendingMemoryOps(agentId)
    .slice()
    .sort((left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime());

  for (const op of pendingOps) {
    if (op.type === 'add' && op.entry) {
      await client.memory.store({
        ...MEMORY_SCOPE,
        agentId,
        content: op.entry.content,
        category: mapUiMemoryCategory(op.entry.category),
        importance: op.entry.confidence,
      });
      store.resolvePendingMemoryOp(op.opId);
      store.appendSystemLog(
        'memory_added',
        `Memory synced for ${agentId}: [${op.entry.category}] ${op.entry.content.slice(0, 60)}`,
        agentId,
      );
    }

    if (op.type === 'delete' && op.memoryId) {
      await client.memory.delete(op.memoryId, {
        ...MEMORY_SCOPE,
        agentId,
      });
      store.resolvePendingMemoryOp(op.opId);
      store.appendSystemLog(
        'memory_removed',
        `Memory deletion synced for ${agentId}: ${op.memoryId}`,
        agentId,
      );
    }
  }
}

export async function loadAgentMemory(agentId: string): Promise<AgentMemorySnapshot> {
  try {
    const client = await getClientAsync();
    await syncPendingMemoryOperations(agentId);

    const rawStats = await client.memory.stats({
      ...MEMORY_SCOPE,
      agentId,
    }).catch(() => null);

    const normalizedStats = normalizeMemoryStats(rawStats as Record<string, unknown> | null);
    const requestedLimit = Math.max(DEFAULT_MEMORY_FETCH_LIMIT, normalizedStats.total || 0);
    const effectiveLimit = Math.min(requestedLimit, MAX_MEMORY_FETCH_LIMIT);

    const result = await client.memory.search({
      ...MEMORY_SCOPE,
      agentId,
      query: '',
      limit: effectiveLimit,
      threshold: 0,
    });

    const normalized = Array.isArray(result)
      ? sortMemories(
          result
            .map((item) => normalizeSdkMemoryEntry(item as Record<string, unknown>))
            .filter((item): item is NonNullable<typeof item> => item !== null),
        )
      : [];

    usePersonaStore.getState().replaceCachedMemories(agentId, normalized);

    return {
      memories: sortMemories(usePersonaStore.getState().getCachedMemories(agentId)),
      stats: normalizedStats.total > 0 ? normalizedStats : buildMemoryStats(normalized),
      loading: false,
      error: null,
      usingFallback: false,
      didTruncate: normalizedStats.total > normalized.length || requestedLimit > effectiveLimit,
    };
  } catch (err) {
    return readCachedAgentMemory(agentId, err instanceof Error ? err.message : 'memory sdk unavailable');
  }
}

export function loadCachedAgentMemory(agentId: string, error?: string): AgentMemorySnapshot {
  return readCachedAgentMemory(agentId, error);
}

export async function searchAgentMemory(
  agentId: string,
  query: string,
  limit: number = 20,
) {
  try {
    const client = await getClientAsync();
    const result = await client.memory.search({
      ...MEMORY_SCOPE,
      agentId,
      query,
      limit,
      threshold: 0,
    });

    return Array.isArray(result)
      ? sortMemories(
          result
            .map((item) => normalizeSdkMemoryEntry(item as Record<string, unknown>))
            .filter((item): item is NonNullable<typeof item> => item !== null),
        )
      : [];
  } catch {
    const loweredQuery = query.trim().toLowerCase();
    const cached = usePersonaStore.getState().getCachedMemories(agentId);
    if (!loweredQuery) {
      return sortMemories(cached).slice(-limit);
    }

    return sortMemories(
      cached.filter((entry) => entry.content.toLowerCase().includes(loweredQuery)),
    ).slice(-limit);
  }
}

export async function storeAgentMemory(
  agentId: string,
  content: string,
  category: MemoryCategory,
): Promise<MemoryMutationResult> {
  const trimmed = content.trim();
  if (!trimmed) {
    return { ok: false, usedFallback: false, error: 'memory content is empty' };
  }

  try {
    const client = await getClientAsync();
    await client.memory.store({
      ...MEMORY_SCOPE,
      agentId,
      content: trimmed,
      category: mapUiMemoryCategory(category),
      importance: 1,
    });

    usePersonaStore.getState().appendSystemLog(
      'memory_added',
      `Memory added for ${agentId}: [${category}] ${trimmed.slice(0, 60)}`,
      agentId,
    );

    return { ok: true, usedFallback: false };
  } catch (err) {
    const queued = usePersonaStore.getState().queuePendingMemoryAdd(agentId, {
      content: trimmed,
      source: 'manual',
      category,
      target: 'memory',
      confidence: 1,
    });

    if (!queued) {
      return {
        ok: false,
        usedFallback: true,
        error: err instanceof Error ? err.message : 'memory sdk unavailable',
      };
    }

    return {
      ok: true,
      usedFallback: true,
      error: err instanceof Error ? err.message : 'memory sdk unavailable',
    };
  }
}

export async function deleteAgentMemory(agentId: string, memoryId: string): Promise<MemoryMutationResult> {
  try {
    const client = await getClientAsync();
    await client.memory.delete(memoryId, {
      ...MEMORY_SCOPE,
      agentId,
    });

    usePersonaStore.getState().appendSystemLog(
      'memory_removed',
      `Memory removed for ${agentId}: ${memoryId}`,
      agentId,
    );

    return { ok: true, usedFallback: false };
  } catch (err) {
    usePersonaStore.getState().queuePendingMemoryDelete(agentId, memoryId);
    return {
      ok: true,
      usedFallback: true,
      error: err instanceof Error ? err.message : 'memory sdk unavailable',
    };
  }
}

export function getMemoryCharLimit(agentId: string): number {
  return usePersonaStore.getState().employees[agentId]?.memoryCharLimit ?? 2000;
}

export { EMPTY_MEMORY_STATS };