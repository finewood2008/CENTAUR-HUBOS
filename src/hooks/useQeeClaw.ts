// Hub OS - QeeClaw 数据加载 hooks
// 策略：全部使用 SDK 真实数据，无 mock fallback
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  checkConnection,
  getClientAsync,
} from '../services/qeeclaw';
// mock 数据已移除，全部使用 SDK 真实数据
import type { Agent, Template, Alert, UsageStat, ActivityItem } from '../types';
import type {
  MyAgent, AgentTemplate,
  WalletSummary, ModelQuotaSummary,
  AppKeyRecord, LLMKeyRecord,
  ModelUsageSummary, ModelCostSummary,
  BillingRecord,
  ConversationHistoryMessage,
  AuditEvent,
} from '@qeeclaw/core-sdk';

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
  activities: ActivityItem[];
  wallet: {
    balance: number;
    currency: string;
    currentMonthSpent: number;
    totalSpent: number;
  } | null;
}

export function useDashboardData(isConnected: boolean) {
  const [data, setData] = useState<DashboardData>({
    agents: [],
    alerts: [],
    usage: [],
    activities: [],
    wallet: null,
  });
  const [loading, setLoading] = useState(true);
  const fetchedRef = useRef(false);

  const refresh = useCallback(async () => {
    if (!isConnected) {
      setData({ agents: [], alerts: [], usage: [], activities: [], wallet: null });
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const client = await getClientAsync();
      const [agentList, wallet] = await Promise.all([
        client.agent.listMyAgents().catch(() => null),
        client.billing.getWallet().catch(() => null),
      ]);

      const agents = agentList
        ? agentList.map(sdkAgentToHubAgent)
        : [];

      setData({
        agents,
        alerts: [],
        usage: [],
        activities: [],
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
      setData({ agents: [], alerts: [], usage: [], activities: [], wallet: null });
    } finally {
      setLoading(false);
    }
  }, [isConnected]);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    refresh();
  }, [refresh]);

  return { data, loading, refresh };
}

// ── 员工管理数据加载 ──────────────────────────────
export interface AgentManagementData {
  agents: Agent[];
  templates: Template[];
}

export function useAgentManagement(isConnected: boolean) {
  const [data, setData] = useState<AgentManagementData>({
    agents: [],
    templates: [],
  });
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!isConnected) {
      setData({ agents: [], templates: [] });
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const client = await getClientAsync();
      const [agentList, templateList] = await Promise.all([
        client.agent.listMyAgents().catch(() => null),
        client.agent.listDefaultTemplates().catch(() => null),
      ]);

      const agents = agentList
        ? agentList.map(sdkAgentToHubAgent)
        : [];

      const templates = templateList
        ? templateList.map(sdkTemplateToHubTemplate)
        : [];

      setData({ agents, templates });
    } catch {
      setData({ agents: [], templates: [] });
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
        const client = await getClientAsync();
        const result = await client.agent.create({
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
      const client = await getClientAsync();
      const overview = await client.channels.getOverview(1);
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
      const client = await getClientAsync();
      const [listRes, statsRes] = await Promise.all([
        client.knowledge.list({ teamId: 1 }).catch(() => null),
        client.knowledge.stats({ teamId: 1 }).catch(() => null),
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
        const client = await getClientAsync();
      const result = await client.models.invoke({ prompt });
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

// ── 设备管理 hook ────────────────────────────────
export function useDevicesData(isConnected: boolean) {
  const [devices, setDevices] = useState<unknown[]>([]);
  const [onlineState, setOnlineState] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!isConnected) { setLoading(false); return; }
    setLoading(true);
    try {
      const client = await getClientAsync();
      const [list, online] = await Promise.all([
        client.devices.list().catch(() => []),
        client.devices.getOnlineState().catch(() => null),
      ]);
      setDevices(list);
      setOnlineState(online);
    } catch { /* fallback empty */ }
    finally { setLoading(false); }
  }, [isConnected]);

  useEffect(() => { refresh(); }, [refresh]);
  return { devices, onlineState, loading, refresh };
}

// ── 审计日志 hook ────────────────────────────────
export function useAuditData(isConnected: boolean) {
  const [summary, setSummary] = useState<unknown>(null);
  const [events, setEvents] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!isConnected) { setLoading(false); return; }
    setLoading(true);
    try {
      const [sumRes, evtsRes] = await Promise.all([
        fetch('/api/hubos/audit/summary').then(r => r.json()).catch(() => null),
        fetch('/api/hubos/audit/events?page=1&page_size=20').then(r => r.json()).catch(() => null),
      ]);
      setSummary(sumRes?.data ?? null);
      setEvents(evtsRes?.data?.items ?? []);
    } catch { /* fallback empty */ }
    finally { setLoading(false); }
  }, [isConnected]);

  useEffect(() => { refresh(); }, [refresh]);
  return { summary, events, loading, refresh };
}

// ── 审批流 hook ──────────────────────────────────
export function useApprovalData(isConnected: boolean) {
  const [approvals, setApprovals] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!isConnected) { setLoading(false); return; }
    setLoading(true);
    try {
      const result = await fetch('/api/hubos/approvals?page=1&page_size=20').then(r => r.json());
      setApprovals(result?.data?.items ?? []);
    } catch { setApprovals([]); }
    finally { setLoading(false); }
  }, [isConnected]);

  useEffect(() => { refresh(); }, [refresh]);
  return { approvals, loading, refresh };
}

// ── API Key 管理 hook ────────────────────────────
export function useApiKeyData(isConnected: boolean) {
  const [appKeys, setAppKeys] = useState<unknown[]>([]);
  const [llmKeys, setLlmKeys] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!isConnected) { setLoading(false); return; }
    setLoading(true);
    try {
      const client = await getClientAsync();
      const [ak, lk] = await Promise.all([
        client.apikey.list().catch(() => null),
        client.apikey.listLLMKeys().catch(() => []),
      ]);
      setAppKeys(ak?.items ?? []);
      setLlmKeys(lk ?? []);
    } catch { /* fallback empty */ }
    finally { setLoading(false); }
  }, [isConnected]);

  useEffect(() => { refresh(); }, [refresh]);
  return { appKeys, llmKeys, loading, refresh };
}

// ── 工作流 hook ──────────────────────────────────
export function useWorkflowData(isConnected: boolean) {
  const [workflows, setWorkflows] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!isConnected) { setLoading(false); return; }
    setLoading(true);
    try {
      const client = await getClientAsync();
      const result = await client.workflow.list();
      setWorkflows(Array.isArray(result) ? result : []);
    } catch { setWorkflows([]); }
    finally { setLoading(false); }
  }, [isConnected]);

  useEffect(() => { refresh(); }, [refresh]);
  return { workflows, loading, refresh };
}

// ── 租户上下文 hook ──────────────────────────────
export function useTenantContext(isConnected: boolean) {
  const [context, setContext] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isConnected) { setLoading(false); return; }
    let cancelled = false;
    (async () => {
      try {
        const client = await getClientAsync();
      const result = await client.tenant.getCurrentContext();
        if (!cancelled) setContext(result);
      } catch { /* ignore */ }
      finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [isConnected]);

  return { context, loading };
}

// ── 会话中心 hook ────────────────────────────────
export function useConversationsData(isConnected: boolean) {
  const [stats, setStats] = useState<unknown>(null);
  const [groups, setGroups] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!isConnected) { setLoading(false); return; }
    setLoading(true);
    try {
      const client = await getClientAsync();
      const [s, g] = await Promise.all([
        client.conversations.getStats(1).catch(() => null),
        client.conversations.listGroups({ teamId: 1 }).catch(() => []),
      ]);
      setStats(s);
      setGroups(Array.isArray(g) ? g : []);
    } catch { /* fallback empty */ }
    finally { setLoading(false); }
  }, [isConnected]);

  useEffect(() => { refresh(); }, [refresh]);
  return { stats, groups, loading, refresh };
}

// ── 财务中心数据加载 ────────────────────────────────
export interface FinanceData {
  wallet: WalletSummary | null;
  quota: ModelQuotaSummary | null;
  appKeys: AppKeyRecord[];
  llmKeys: LLMKeyRecord[];
  usageSummary: ModelUsageSummary | null;
  costSummary: ModelCostSummary | null;
  billingRecords: BillingRecord[];
}

export function useFinanceData(isConnected: boolean) {
  const [data, setData] = useState<FinanceData>({
    wallet: null,
    quota: null,
    appKeys: [],
    llmKeys: [],
    usageSummary: null,
    costSummary: null,
    billingRecords: [],
  });
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!isConnected) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const client = await getClientAsync();
      const [wallet, quota, appKeysResult, llmKeys, usageSummary, costSummary, billingResult] = await Promise.all([
        client.billing.getWallet().catch(() => null),
        client.models.getQuota().catch(() => null),
        client.apikey.list().catch(() => null),
        client.apikey.listLLMKeys().catch(() => []),
        client.models.getUsage({ days: 7 }).catch(() => null),
        client.models.getCost({ days: 7 }).catch(() => null),
        client.billing.listRecords({ page: 1, pageSize: 50 }).catch(() => null),
      ]);

      setData({
        wallet,
        quota,
        appKeys: appKeysResult?.items ?? [],
        llmKeys: llmKeys ?? [],
        usageSummary,
        costSummary,
        billingRecords: billingResult?.items ?? [],
      });
    } catch { /* fallback empty */ }
    finally { setLoading(false); }
  }, [isConnected]);

  useEffect(() => { refresh(); }, [refresh]);
  return { data, loading, refresh };
}

// ── 聊天对话 hook ───────────────────────────────────
export function useChatConversation(isConnected: boolean) {
  const [messages, setMessages] = useState<ConversationHistoryMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  const loadHistory = useCallback(async () => {
    if (!isConnected) return;
    setLoading(true);
    try {
      const client = await getClientAsync();
      const result = await client.conversations.listHistory({ teamId: 1, limit: 50 });
      setMessages(result);
    } catch { /* fallback empty */ }
    finally { setLoading(false); }
  }, [isConnected]);

  const sendMessage = useCallback(async (content: string, agentId?: number) => {
    if (!isConnected || !content.trim()) return null;
    setSending(true);
    try {
      const client = await getClientAsync();
      const userMsg = await client.conversations.sendMessage({
        teamId: 1,
        content,
        agentId,
        direction: 'user_to_agent',
      });
      setMessages(prev => [...prev, userMsg]);

      const aiResult = await client.models.invoke({ prompt: content });
      const aiMsg = await client.conversations.sendMessage({
        teamId: 1,
        content: aiResult.text,
        agentId,
        direction: 'agent_to_user',
      });
      setMessages(prev => [...prev, aiMsg]);
      return aiResult;
    } catch (err) {
      console.error('发送消息失败:', err);
      return null;
    } finally {
      setSending(false);
    }
  }, [isConnected]);

  useEffect(() => { loadHistory(); }, [loadHistory]);
  return { messages, loading, sending, sendMessage, refresh: loadHistory };
}

// ── 增强版 Dashboard 数据（含 SDK 动态）────────────
export interface EnhancedDashboardData extends DashboardData {
  auditEvents: AuditEvent[];
  billingRecords: BillingRecord[];
}

export function useEnhancedDashboardData(isConnected: boolean) {
  const { data: baseData, loading: baseLoading, refresh: baseRefresh } = useDashboardData(isConnected);
  const [extra, setExtra] = useState<{ auditEvents: AuditEvent[]; billingRecords: BillingRecord[] }>({
    auditEvents: [],
    billingRecords: [],
  });
  const [extraLoading, setExtraLoading] = useState(true);

  const loadExtra = useCallback(async () => {
    if (!isConnected) {
      setExtraLoading(false);
      return;
    }
    setExtraLoading(true);
    try {
      const client = await getClientAsync();
      const [auditResult, billingResult] = await Promise.all([
        fetch('/api/hubos/audit/events?page=1&page_size=20').then(r => r.json()).catch(() => null),
        client.billing.listRecords({ page: 1, pageSize: 10 }).catch(() => null),
      ]);
      setExtra({
        auditEvents: auditResult?.data?.items ?? [],
        billingRecords: billingResult?.data ?? [],
      });
    } catch {
      setExtra({ auditEvents: [], billingRecords: [] });
    } finally {
      setExtraLoading(false);
    }
  }, [isConnected]);

  useEffect(() => {
    loadExtra();
  }, [loadExtra]);

  const mergedAlerts: import('../types').Alert[] = extra.auditEvents.length > 0
    ? extra.auditEvents
        .filter(evt => evt.riskLevel === 'high' || evt.riskLevel === 'critical' || evt.category === 'approval')
        .map((evt, i) => ({
          id: evt.eventId || `alert-${i}`,
          agentId: 'system',
          agentName: evt.actor?.username || '系统',
          type: (evt.category === 'approval' ? 'security' : evt.riskLevel === 'critical' ? 'error' : 'quota') as 'quota' | 'error' | 'security',
          message: evt.title,
          time: evt.createdAt ? new Date(evt.createdAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) : '',
          severity: (evt.riskLevel === 'critical' ? 'critical' : 'warning') as 'warning' | 'critical',
        }))
    : baseData.alerts;

  const mergedActivities: ActivityItem[] = extra.auditEvents.length > 0
    ? extra.auditEvents.map((evt, i) => ({
        id: evt.eventId || `audit-${i}`,
        agentId: 'system',
        agentName: evt.actor?.username || '系统',
        agentAvatar: evt.category === 'approval' ? '📋' : '🔔',
        type: evt.category === 'approval' ? 'approval_needed' as const : 'task_done' as const,
        title: evt.title,
        detail: evt.summary ?? undefined,
        time: '', // 不再使用 time 显示字段，由 timestamp 驱动
        timestamp: evt.createdAt ? new Date(evt.createdAt).getTime() : Date.now(),
        actionLabel: evt.category === 'approval' ? '审批' : '查看',
        actionType: evt.category === 'approval' ? 'approve' as const : 'view' as const,
      }))
    : baseData.activities;

  const mergedUsage: import('../types').UsageStat[] = extra.billingRecords.length > 0
    ? extra.billingRecords.slice(0, 7).map(r => ({
        date: r.createdTime?.split('T')[0] ?? '',
        tokens: r.textInputLength + r.textOutputLength,
        cost: r.amount,
      }))
    : baseData.usage;

  return {
    data: {
      ...baseData,
      alerts: mergedAlerts,
      activities: mergedActivities,
      usage: mergedUsage,
      auditEvents: extra.auditEvents,
      billingRecords: extra.billingRecords,
    },
    loading: baseLoading || extraLoading,
    refresh: async () => {
      await baseRefresh();
      await loadExtra();
    },
  };
}
