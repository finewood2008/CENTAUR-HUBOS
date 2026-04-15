// Hub OS - QeeClaw 数据加载 hooks
// 策略：先尝试 SDK 真实调用，失败则 fallback 到 mock 数据
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  checkConnection,
  getAgentModule,
  getBillingModule,
  getModelsModule,
  getChannelsModule,
  getKnowledgeModule,
} from '../services/qeeclaw';
import { AGENTS, TEMPLATES, ALERTS, USAGE_7DAYS } from '../data/mock';
import type { Agent, Template, Alert, UsageStat } from '../types';
import type { MyAgent, AgentTemplate } from '@qeeclaw/core-sdk';

// ── 连接状态 hook ─────────────────────────────────
export function useConnection() {
  const [connected, setConnected] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const result = await checkConnection();
      if (!cancelled) {
        setConnected(result.connected);
        setChecking(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const recheck = useCallback(async () => {
    setChecking(true);
    const result = await checkConnection();
    setConnected(result.connected);
    setChecking(false);
    return result.connected;
  }, []);

  return { connected, checking, recheck };
}

// ── 将 SDK MyAgent 转换为 Hub OS Agent 类型 ───────
function sdkAgentToHubAgent(agent: MyAgent): Agent {
  return {
    id: String(agent.id),
    name: agent.name,
    role: agent.description || '未设置角色',
    avatar: agent.avatar || '🤖',
    status: 'running', // SDK 目前没有 status 字段，默认 running
    model: agent.model || 'unknown',
    port: 21747,
    harnessDir: `/harness/${agent.code}/`,
    skills: [],
    tools: [],
    dataSources: [],
    budgetPercent: 0,
    budgetUsed: 0,
    hireDate: '',
    todayTasks: 0,
    todaySummary: '',
    // runtimeType/runtimeLabel 留作扩展
  };
}

// ── 将 SDK AgentTemplate 转换为 Hub OS Template ────
function sdkTemplateToHubTemplate(tpl: AgentTemplate): Template {
  return {
    id: tpl.code,
    name: tpl.name,
    avatar: tpl.avatar || '🧩',
    desc: tpl.description || '',
    category: '平台模板',
    model: 'gpt-4o',
    skills: tpl.allowedTools,
    color: 'from-blue-500 to-cyan-500',
    status: 'live' as const,
  };
}

// ── Dashboard 数据加载 ────────────────────────────
export interface DashboardData {
  agents: Agent[];
  alerts: Alert[];
  usage: UsageStat[];
  wallet: {
    balance: number;
    currency: string;
    currentMonthSpent: number;
    totalSpent: number;
  } | null;
}

export function useDashboardData(isConnected: boolean) {
  const [data, setData] = useState<DashboardData>({
    agents: AGENTS,
    alerts: ALERTS,
    usage: USAGE_7DAYS,
    wallet: null,
  });
  const [loading, setLoading] = useState(true);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    let cancelled = false;

    (async () => {
      if (!isConnected) {
        // 用 mock
        setData({ agents: AGENTS, alerts: ALERTS, usage: USAGE_7DAYS, wallet: null });
        setLoading(false);
        return;
      }

      try {
        // 并行拉取 agents + wallet
        const [agentList, wallet] = await Promise.all([
          getAgentModule().listMyAgents().catch(() => null),
          getBillingModule().getWallet().catch(() => null),
        ]);

        if (cancelled) return;
        fetchedRef.current = true;

        const agents = agentList
          ? agentList.map(sdkAgentToHubAgent)
          : AGENTS;

        setData({
          agents: agents.length > 0 ? agents : AGENTS,
          alerts: ALERTS, // alerts 暂无 SDK 接口，用 mock
          usage: USAGE_7DAYS, // usage 暂用 mock，后续接 billing.listRecords
          wallet: wallet
            ? {
                balance: wallet.balance,
                currency: wallet.currency,
                currentMonthSpent: wallet.currentMonthSpent,
                totalSpent: wallet.totalSpent,
              }
            : null,
        });
      } catch {
        // SDK 调用失败，fallback mock
        if (!cancelled) {
          setData({ agents: AGENTS, alerts: ALERTS, usage: USAGE_7DAYS, wallet: null });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [isConnected]);

  return { data, loading };
}

// ── 员工管理数据加载 ──────────────────────────────
export interface AgentManagementData {
  agents: Agent[];
  templates: Template[];
}

export function useAgentManagement(isConnected: boolean) {
  const [data, setData] = useState<AgentManagementData>({
    agents: AGENTS,
    templates: TEMPLATES,
  });
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!isConnected) {
      setData({ agents: AGENTS, templates: TEMPLATES });
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [agentList, templateList] = await Promise.all([
        getAgentModule().listMyAgents().catch(() => null),
        getAgentModule().listDefaultTemplates().catch(() => null),
      ]);

      const agents = agentList
        ? agentList.map(sdkAgentToHubAgent)
        : AGENTS;

      const templates = templateList
        ? templateList.map(sdkTemplateToHubTemplate)
        : TEMPLATES;

      setData({
        agents: agents.length > 0 ? agents : AGENTS,
        templates: templates.length > 0 ? templates : TEMPLATES,
      });
    } catch {
      setData({ agents: AGENTS, templates: TEMPLATES });
    } finally {
      setLoading(false);
    }
  }, [isConnected]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { data, loading, refresh };
}

// ── Agent 操作（创建/更新） ───────────────────────
export function useAgentActions(isConnected: boolean, onSuccess?: () => void) {
  const [submitting, setSubmitting] = useState(false);

  const createAgent = useCallback(
    async (name: string, description?: string, model?: string) => {
      if (!isConnected) return null;
      setSubmitting(true);
      try {
        const result = await getAgentModule().create({
          name,
          description,
          model,
          runtimeType: 'hermes',
        });
        onSuccess?.();
        return result;
      } catch (err) {
        console.error('创建 Agent 失败:', err);
        return null;
      } finally {
        setSubmitting(false);
      }
    },
    [isConnected, onSuccess],
  );

  return { createAgent, submitting };
}

// ── 通讯渠道数据加载 ────────────────────────────────
export interface ChannelItem {
  channelKey: string;
  channelName: string;
  channelGroup: string;
  configured: boolean;
  enabled: boolean;
  bindingEnabled: boolean;
  callbackUrl: string;
  riskLevel: string;
  updatedTime: string | null;
}

export interface ChannelsData {
  supportedCount: number;
  configuredCount: number;
  activeCount: number;
  items: ChannelItem[];
}

export function useChannelsData(isConnected: boolean) {
  const [data, setData] = useState<ChannelsData | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    if (!isConnected) {
      setData(null);
      setLoading(false);
      return;
    }
    try {
      const overview = await getChannelsModule().getOverview(1);
      setData(overview as unknown as ChannelsData);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [isConnected]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { data, loading, refresh };
}

// ── 知识库数据加载 ──────────────────────────────────
export interface KnowledgeBase {
  id: string;
  name: string;
  description: string;
  file_count: number;
  total_size: number;
  agent_code: string | null;
  updated_time: string;
}

export interface KnowledgeStats {
  total_bases: number;
  total_files: number;
  total_size: number;
}

export interface KnowledgeData {
  bases: KnowledgeBase[];
  stats: KnowledgeStats | null;
}

export function useKnowledgeData(isConnected: boolean) {
  const [data, setData] = useState<KnowledgeData>({ bases: [], stats: null });
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    if (!isConnected) {
      setData({ bases: [], stats: null });
      setLoading(false);
      return;
    }
    try {
      const [listRes, statsRes] = await Promise.all([
        getKnowledgeModule().list({ teamId: 1 }).catch(() => null),
        getKnowledgeModule().stats({ teamId: 1 }).catch(() => null),
      ]);

      // 后端返回 {documents: [...]} ，每个 document 有 source_name/chunk_count/total_chars 等
      // 需要映射为前端的 KnowledgeBase 格式
      let bases: KnowledgeBase[] = [];
      if (listRes && typeof listRes === 'object') {
        const raw = listRes as Record<string, unknown>;
        const docs = (raw.documents || raw.items || []) as Record<string, unknown>[];
        bases = docs.map((doc, i) => ({
          id: String(doc.id || doc.source_name || `kb-${i}`),
          name: String(doc.source_name || doc.name || `知识库 ${i + 1}`),
          description: String(doc.description || ''),
          file_count: Number(doc.file_count || doc.chunk_count || 0),
          total_size: Number(doc.total_size || doc.total_chars || 0),
          agent_code: (doc.agent_code as string) || null,
          updated_time: String(doc.updated_time || doc.created_at || new Date().toISOString()),
        }));
      }

      // 后端 stats 返回 {available, document_count, chunk_count, total_chars, ...}
      // 映射为前端 KnowledgeStats
      let stats: KnowledgeStats | null = null;
      if (statsRes && typeof statsRes === 'object') {
        const raw = statsRes as Record<string, unknown>;
        stats = {
          total_bases: Number(raw.total_bases || raw.document_count || bases.length),
          total_files: Number(raw.total_files || raw.chunk_count || bases.reduce((s, k) => s + k.file_count, 0)),
          total_size: Number(raw.total_size || raw.total_chars || bases.reduce((s, k) => s + k.total_size, 0)),
        };
      }

      setData({ bases, stats });
    } catch {
      setData({ bases: [], stats: null });
    } finally {
      setLoading(false);
    }
  }, [isConnected]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { data, loading, refresh };
}

// ── 模型调用 hook（聊天用） ───────────────────────
export function useQeeClawAgent(agentId: string) {
  const [loading, setLoading] = useState(false);

  const invokeModel = useCallback(
    async (prompt: string) => {
      setLoading(true);
      try {
        const result = await getModelsModule().invoke({ prompt });
        return result;
      } catch (error) {
        console.error('Invoke error:', error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [agentId],
  );

  return { invokeModel, loading };
}
