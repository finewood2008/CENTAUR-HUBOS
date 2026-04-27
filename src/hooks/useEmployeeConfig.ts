// Hub OS — 员工配置数据 hook
// 连接 SDK agent/models/memory/knowledge 模块，提供统一配置接口
import { useState, useEffect, useCallback } from 'react';
import { getClientAsync } from '../services/qeeclaw';
import type { DigitalEmployee } from '../types';
import { normalizeMemoryStats } from '../features/memory/category';
import { searchAgentMemory, storeAgentMemory } from '../features/memory/repository';
import type { MemoryCategory } from '../features/memory/types';

// ── 类型定义 ──────────────────────────────────────

export interface ModelOption {
  id: number;
  providerName: string;
  modelName: string;
  label: string;
  isPreferred: boolean;
  status: string;
  unitPrice?: number;
  outputUnitPrice?: number;
  currency?: string;
}

export interface MemoryEntry {
  id: string;
  content: string;
  category: string;
  importance?: number;
  createdAt?: string;
}

export interface KnowledgeDoc {
  name: string;
  size?: number;
  status?: string;
  createdAt?: string;
}

export interface MemoryStats {
  total: number;
  categories: Record<string, number>;
}

export interface KnowledgeStats {
  totalDocs: number;
  totalChunks: number;
  indexStatus: string;
}

export interface EmployeeConfigData {
  // 模型
  availableModels: ModelOption[];
  currentModel: string;
  routeProfile: any;
  // 记忆
  memoryStats: MemoryStats;
  memoryEntries: MemoryEntry[];
  // 知识库
  knowledgeStats: KnowledgeStats;
  knowledgeDocs: KnowledgeDoc[];
}

const EMPTY_CONFIG: EmployeeConfigData = {
  availableModels: [],
  currentModel: '',
  routeProfile: null,
  memoryStats: { total: 0, categories: {} },
  memoryEntries: [],
  knowledgeStats: { totalDocs: 0, totalChunks: 0, indexStatus: 'unknown' },
  knowledgeDocs: [],
};

// ── 主 Hook ──────────────────────────────────────

export function useEmployeeConfig(employee: DigitalEmployee | null, isConnected: boolean) {
  const [data, setData] = useState<EmployeeConfigData>(EMPTY_CONFIG);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadConfig = useCallback(async () => {
    if (!employee) return;
    setLoading(true);
    setError(null);

    try {
      const client = await getClientAsync();
      const scope = { teamId: 1, runtimeType: 'hermes', agentId: employee.id };

      // 并行加载所有数据
      const [modelsResult, routeResult, memStatsResult, knowledgeResult] = await Promise.allSettled([
        client.models.listAvailable(),
        client.models.getRouteProfile(),
        client.memory.stats(scope),
        client.knowledge.list({ ...scope, page: 1, pageSize: 50 }),
      ]);

      const availableModels: ModelOption[] = modelsResult.status === 'fulfilled'
        ? modelsResult.value.map((m: any) => ({
            id: m.id,
            providerName: m.providerName,
            modelName: m.modelName,
            label: m.label,
            isPreferred: m.isPreferred,
            status: m.availabilityStatus,
            unitPrice: m.unitPrice,
            outputUnitPrice: m.outputUnitPrice,
            currency: m.currency,
          }))
        : [];

      const routeProfile = routeResult.status === 'fulfilled' ? routeResult.value : null;
      const currentModel = routeProfile?.resolvedModel || '';

      const memStats = memStatsResult.status === 'fulfilled'
        ? normalizeMemoryStats(memStatsResult.value as Record<string, unknown>)
        : { total: 0, categories: {} };

      const knowledgeDocs = knowledgeResult.status === 'fulfilled'
        ? (Array.isArray((knowledgeResult.value as any)?.items)
            ? (knowledgeResult.value as any).items
            : [])
        : [];

      setData({
        availableModels,
        currentModel,
        routeProfile,
        memoryStats: {
          total: memStats.total ?? 0,
          categories: memStats.categories ?? {},
        },
        memoryEntries: [],
        knowledgeStats: {
          totalDocs: knowledgeDocs.length,
          totalChunks: 0,
          indexStatus: 'ready',
        },
        knowledgeDocs: knowledgeDocs.map((d: any) => ({
          name: d.source_name || d.filename || d.name || 'unknown',
          size: d.size,
          status: d.status || 'indexed',
          createdAt: d.created_at,
        })),
      });
    } catch (err) {
      console.error('[EmployeeConfig] load error:', err);
      setError(err instanceof Error ? err.message : 'unknown error');
      // 移除 mock，直接置空
      setData(EMPTY_CONFIG);
    } finally {
      setLoading(false);
    }
  }, [employee, isConnected]);

  useEffect(() => {
    if (employee && isConnected) {
      loadConfig();
    } else if (employee) {
      // 离线模式：由于无 mock，直接用空配置
      setData(EMPTY_CONFIG);
    }
  }, [employee?.id, isConnected, loadConfig]);

  // ── 写操作 ──

  const updateModel = useCallback(async (modelName: string) => {
    if (!employee) return;
    try {
      const client = await getClientAsync();
      await client.models.setDefaultRoute(modelName);
      setData(prev => ({ ...prev, currentModel: modelName }));
    } catch {
      setData(prev => ({ ...prev, currentModel: modelName }));
    }
  }, [employee]);

  const addMemory = useCallback(async (content: string, category?: string) => {
    if (!employee) return;
    try {
      await storeAgentMemory(employee.id, content, (category as MemoryCategory | undefined) ?? 'correction');
      await loadConfig();
    } catch { /* mock fallback */ }
  }, [employee, loadConfig]);

  const searchMemory = useCallback(async (query: string) => {
    if (!employee) return [];
    try {
      return await searchAgentMemory(employee.id, query, 20);
    } catch {
      return [];
    }
  }, [employee]);

  const uploadKnowledge = useCallback(async (file: File) => {
    if (!employee) return;
    try {
      const client = await getClientAsync();
      await client.knowledge.ingest({
        teamId: 1,
        runtimeType: 'hermes',
        agentId: employee.id,
        file,
        filename: file.name,
        contentType: file.type,
      });
      await loadConfig();
    } catch { /* mock fallback */ }
  }, [employee, loadConfig]);

  return {
    data,
    loading,
    error,
    refresh: loadConfig,
    updateModel,
    addMemory,
    searchMemory,
    uploadKnowledge,
  };
}


