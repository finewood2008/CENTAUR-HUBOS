// Hub OS — 员工配置数据 hook
// 连接 SDK agent/models/memory/knowledge 模块，提供统一配置接口
import { useState, useEffect, useCallback } from 'react';
import { getClientAsync } from '../services/qeeclaw';
import type { DigitalEmployee } from '../types';

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
      const currentModel = routeProfile?.resolvedModel || employee.model || '';

      const memStats = memStatsResult.status === 'fulfilled'
        ? (memStatsResult.value as any)
        : { total: 0 };

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
      // 使用 mock 数据 fallback
      setData({
        ...EMPTY_CONFIG,
        currentModel: employee.model || 'Claude Sonnet 4',
        availableModels: MOCK_MODELS,
      });
    } finally {
      setLoading(false);
    }
  }, [employee, isConnected]);

  useEffect(() => {
    if (employee && isConnected) {
      loadConfig();
    } else if (employee) {
      // 离线模式：使用 mock
      setData({
        ...EMPTY_CONFIG,
        currentModel: employee.model || 'Claude Sonnet 4',
        availableModels: MOCK_MODELS,
        memoryStats: MOCK_MEMORY_STATS[employee.id] || EMPTY_CONFIG.memoryStats,
        knowledgeDocs: MOCK_KNOWLEDGE[employee.id] || [],
        knowledgeStats: {
          totalDocs: (MOCK_KNOWLEDGE[employee.id] || []).length,
          totalChunks: 0,
          indexStatus: 'demo',
        },
      });
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
      const client = await getClientAsync();
      await client.memory.store({
        teamId: 1,
        runtimeType: 'hermes',
        agentId: employee.id,
        content,
        category: (category as any) || 'other',
      });
      await loadConfig();
    } catch { /* mock fallback */ }
  }, [employee, loadConfig]);

  const searchMemory = useCallback(async (query: string) => {
    if (!employee) return [];
    try {
      const client = await getClientAsync();
      return await client.memory.search({
        teamId: 1,
        runtimeType: 'hermes',
        agentId: employee.id,
        query,
        limit: 20,
      });
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

// ── Mock 数据 ──────────────────────────────────────

const MOCK_MODELS: ModelOption[] = [
  { id: 1, providerName: 'Anthropic', modelName: 'claude-sonnet-4-20250514', label: 'Claude Sonnet 4', isPreferred: true, status: 'available', unitPrice: 3, outputUnitPrice: 15, currency: 'USD' },
  { id: 2, providerName: 'Anthropic', modelName: 'claude-opus-4-20250514', label: 'Claude Opus 4', isPreferred: false, status: 'available', unitPrice: 15, outputUnitPrice: 75, currency: 'USD' },
  { id: 3, providerName: 'OpenAI', modelName: 'gpt-4o', label: 'GPT-4o', isPreferred: false, status: 'available', unitPrice: 2.5, outputUnitPrice: 10, currency: 'USD' },
  { id: 4, providerName: 'OpenAI', modelName: 'gpt-4o-mini', label: 'GPT-4o Mini', isPreferred: false, status: 'available', unitPrice: 0.15, outputUnitPrice: 0.6, currency: 'USD' },
  { id: 5, providerName: 'Google', modelName: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro', isPreferred: false, status: 'available', unitPrice: 1.25, outputUnitPrice: 10, currency: 'USD' },
  { id: 6, providerName: 'DeepSeek', modelName: 'deepseek-r1', label: 'DeepSeek R1', isPreferred: false, status: 'available', unitPrice: 0.55, outputUnitPrice: 2.19, currency: 'USD' },
];

const MOCK_MEMORY_STATS: Record<string, MemoryStats> = {
  spark: { total: 47, categories: { preference: 12, fact: 18, decision: 8, entity: 9 } },
  xiaoke: { total: 31, categories: { preference: 8, fact: 14, decision: 5, entity: 4 } },
};

const MOCK_KNOWLEDGE: Record<string, KnowledgeDoc[]> = {
  spark: [
    { name: '品牌手册-半人马AI.pdf', size: 2400000, status: 'indexed', createdAt: '2026-04-10' },
    { name: 'Logo设计规范.md', size: 15000, status: 'indexed', createdAt: '2026-04-08' },
    { name: '竞品视觉分析.pdf', size: 1800000, status: 'indexed', createdAt: '2026-04-05' },
    { name: '色彩心理学参考.pdf', size: 980000, status: 'indexed', createdAt: '2026-03-28' },
  ],
  xiaoke: [
    { name: '目标客户画像.md', size: 28000, status: 'indexed', createdAt: '2026-04-12' },
    { name: '获客渠道ROI分析.xlsx', size: 450000, status: 'indexed', createdAt: '2026-04-09' },
    { name: '行业转化率基准.pdf', size: 1200000, status: 'indexed', createdAt: '2026-04-01' },
  ],
};
