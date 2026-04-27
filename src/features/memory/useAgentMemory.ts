import { useCallback, useEffect, useState } from 'react';
import type { DigitalEmployee } from '../../types';
import { deleteAgentMemory, getMemoryCharLimit, loadAgentMemory, loadCachedAgentMemory, storeAgentMemory } from './repository';
import { EMPTY_AGENT_MEMORY_SNAPSHOT, type AgentMemorySnapshot, type MemoryCategory, type MemoryMutationResult } from './types';

export function useAgentMemory(employee: DigitalEmployee | null) {
  const [snapshot, setSnapshot] = useState<AgentMemorySnapshot>(EMPTY_AGENT_MEMORY_SNAPSHOT);

  const refresh = useCallback(async () => {
    if (!employee) {
      setSnapshot(EMPTY_AGENT_MEMORY_SNAPSHOT);
      return;
    }

    setSnapshot((current) => ({
      ...current,
      loading: true,
      error: null,
    }));

    const nextSnapshot = await loadAgentMemory(employee.id);
    setSnapshot(nextSnapshot);
  }, [employee]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addMemory = useCallback(async (content: string, category: MemoryCategory): Promise<MemoryMutationResult> => {
    if (!employee) return { ok: false, usedFallback: false, error: 'employee is missing' };

    const result = await storeAgentMemory(employee.id, content, category);
    if (!result.ok) {
      return result;
    }

    if (result.usedFallback) {
      setSnapshot(loadCachedAgentMemory(employee.id, result.error));
      return result;
    }

    await refresh();
    return result;
  }, [employee, refresh]);

  const deleteMemory = useCallback(async (memoryId: string): Promise<MemoryMutationResult> => {
    if (!employee) return { ok: false, usedFallback: false, error: 'employee is missing' };

    const result = await deleteAgentMemory(employee.id, memoryId);
    if (result.usedFallback) {
      setSnapshot(loadCachedAgentMemory(employee.id, result.error));
      return result;
    }

    await refresh();
    return result;
  }, [employee, refresh]);

  return {
    memories: snapshot.memories,
    stats: snapshot.stats,
    loading: snapshot.loading,
    error: snapshot.error,
    usingFallback: snapshot.usingFallback,
    didTruncate: snapshot.didTruncate,
    supportsOrganize: false,
    charLimit: employee ? getMemoryCharLimit(employee.id) : 2000,
    refresh,
    addMemory,
    deleteMemory,
  };
}