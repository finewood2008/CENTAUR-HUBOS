import { useCallback, useEffect, useState } from 'react';
import { loadAgentMemory, loadCachedAgentMemory } from './repository';
import type { AgentMemorySnapshot, MemoryEntry } from './types';

export const MEMORY_CENTER_AGENT_IDS = ['leader', 'spark', 'xiaoke', 'shuxi', 'shuibao', 'lvan'] as const;

type AgentId = (typeof MEMORY_CENTER_AGENT_IDS)[number];

type AgentSnapshotMap = Record<AgentId, AgentMemorySnapshot>;
type AgentMemoryMap = Record<AgentId, MemoryEntry[]>;

function buildInitialSnapshotMap(): AgentSnapshotMap {
  return Object.fromEntries(
    MEMORY_CENTER_AGENT_IDS.map((agentId) => [agentId, loadCachedAgentMemory(agentId)]),
  ) as AgentSnapshotMap;
}

export function useMemoryCenter() {
  const [snapshots, setSnapshots] = useState<AgentSnapshotMap>(buildInitialSnapshotMap);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const results = await Promise.all(
        MEMORY_CENTER_AGENT_IDS.map(async (agentId) => [agentId, await loadAgentMemory(agentId)] as const),
      );

      setSnapshots(Object.fromEntries(results) as AgentSnapshotMap);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const agentMemories = Object.fromEntries(
    MEMORY_CENTER_AGENT_IDS.map((agentId) => [agentId, snapshots[agentId]?.memories ?? []]),
  ) as AgentMemoryMap;

  return {
    loading,
    refresh,
    snapshots,
    agentMemories,
  };
}