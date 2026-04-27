// Hub OS - QeeClaw 数据加载 hooks
// 策略：全部使用 SDK 真实数据，无 mock fallback
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  checkConnection,
  getBridgePort,
  getChannelsClientAsync,
  getChannelsLocalOnlyError,
  getClientAsync,
} from '../services/qeeclaw';
import { DIGITAL_EMPLOYEES } from '../data/digital-employees';
// mock 数据已移除，全部使用 SDK 真实数据
import type { Agent, Template, Alert, UsageStat, ActivityItem, DigitalEmployee } from '../types';
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

  const runCheck = useCallback(async (showChecking: boolean) => {
    if (showChecking) {
      setChecking(true);
    }
    const result = await checkConnection();
    setConnected(result.connected);
    setChecking(false);
    return result.connected;
  }, []);

  useEffect(() => {
    let cancelled = false;

    const safeCheck = async (showChecking: boolean) => {
      if (showChecking && !cancelled) {
        setChecking(true);
      }
      const result = await checkConnection();
      if (!cancelled) {
        setConnected(result.connected);
        setChecking(false);
      }
    };

    void safeCheck(true);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        void safeCheck(false);
      }
    };

    const handleFocus = () => {
      void safeCheck(false);
    };

    const timer = window.setInterval(() => {
      void safeCheck(false);
    }, 10000);

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleFocus);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleFocus);
    };
  }, [runCheck]);

  const recheck = useCallback(async () => {
    return runCheck(true);
  }, [runCheck]);

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
    port: getBridgePort(),
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

export type OfficeAgentActivity = 'active' | 'workflow' | 'standby' | 'offline' | 'attention';

export interface OfficeRuntimeState {
  runtimeLabel: string;
  runtimeStatus: string;
  runtimeStage: string;
  notes: string;
  runtimeOnline: boolean;
}

export interface OfficeAgentData {
  id: number;
  code: string;
  hubId: string;
  name: string;
  role: string;
  avatar: string;
  isLeader: boolean;
  model: string;
  runtimeLabel: string;
  activity: OfficeAgentActivity;
  lastActive: string | null;
  activeTaskStatus: string | null;
  activeTaskProgress: number | null;
  activeTaskBrief: string | null;
  workflowCount: number;
  primaryWorkflowId: string | null;
  primaryWorkflowName: string | null;
}

export type OfficeActionKind = 'pat' | 'task' | 'coffee' | 'rush';

export interface OfficeActionOptions {
  taskContent?: string;
}

export interface OfficeActionResult {
  ok: boolean;
  emoji: string;
  message: string;
}

type OfficeWorkflowLike = {
  id: string;
  name?: string;
  description?: string | null;
  enabled?: boolean;
};

const OFFICE_PROFILE_ORDER = new Map(DIGITAL_EMPLOYEES.map((employee, index) => [employee.id, index]));

function normalizeOfficeToken(value: string | null | undefined): string {
  return (value ?? '').trim().toLowerCase().replace(/[\s_-]+/g, '');
}

function findOfficeProfile(agent: MyAgent): DigitalEmployee | null {
  const codeToken = normalizeOfficeToken(agent.code);
  const nameToken = normalizeOfficeToken(agent.name);

  return DIGITAL_EMPLOYEES.find((employee) => {
    const tokens = [employee.id, employee.englishName, employee.name]
      .map((value) => normalizeOfficeToken(String(value)))
      .filter(Boolean);
    return tokens.some((token) => {
      if (!token) return false;
      return (
        codeToken === token ||
        nameToken === token ||
        codeToken.includes(token) ||
        nameToken.includes(token)
      );
    });
  }) ?? null;
}

function getWorkflowMatchesForAgent(
  agent: MyAgent,
  profile: DigitalEmployee | null,
  workflows: OfficeWorkflowLike[],
): OfficeWorkflowLike[] {
  const matchTokens = [agent.code, agent.name, profile?.id, profile?.englishName, profile?.name]
    .map((value) => normalizeOfficeToken(typeof value === 'string' ? value : String(value ?? '')))
    .filter(Boolean);

  return workflows.filter((workflow) => {
    if (workflow.enabled === false) return false;
    const haystack = normalizeOfficeToken([
      workflow.id,
      workflow.name ?? '',
      workflow.description ?? '',
    ].join(' '));
    return matchTokens.some((token) => haystack.includes(token));
  });
}

function parseOfficeTimestamp(value: string | null | undefined): number {
  if (!value) return 0;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function isRuntimeOnline(onlineState: {
  runtimeStatus?: string;
  onlineTeamIds?: number[];
} | null): boolean {
  if (!onlineState) return false;

  if (Array.isArray(onlineState.onlineTeamIds) && onlineState.onlineTeamIds.includes(1)) {
    return true;
  }

  const status = String(onlineState.runtimeStatus ?? '').toLowerCase();
  return ['online', 'running', 'ready', 'connected', 'healthy'].includes(status);
}

function deriveOfficeActivity(
  runtimeOnline: boolean,
  runtimeStatus: string,
  lastActive: string | null,
  workflowCount: number,
  activeTaskStatus?: string | null,
): OfficeAgentActivity {
  if (!runtimeOnline) return 'offline';

  const loweredStatus = runtimeStatus.toLowerCase();
  if (['error', 'failed', 'degraded'].includes(loweredStatus)) {
    return 'attention';
  }

   const loweredTaskStatus = String(activeTaskStatus ?? '').toLowerCase();
   if (['processing', 'running', 'pending', 'queued'].includes(loweredTaskStatus)) {
     return 'active';
   }

  const lastActiveTs = parseOfficeTimestamp(lastActive);
  if (lastActiveTs > 0 && Date.now() - lastActiveTs <= 10 * 60 * 1000) {
    return 'active';
  }

  if (workflowCount > 0) {
    return 'workflow';
  }

  return 'standby';
}

function sortOfficeAgents(agents: OfficeAgentData[]): OfficeAgentData[] {
  return [...agents].sort((left, right) => {
    const leftOrder = OFFICE_PROFILE_ORDER.get(left.hubId) ?? Number.MAX_SAFE_INTEGER;
    const rightOrder = OFFICE_PROFILE_ORDER.get(right.hubId) ?? Number.MAX_SAFE_INTEGER;
    if (leftOrder !== rightOrder) {
      return leftOrder - rightOrder;
    }
    return left.name.localeCompare(right.name, 'zh-CN');
  });
}

export function useOfficeData(isConnected: boolean) {
  const [agents, setAgents] = useState<OfficeAgentData[]>([]);
  const [runtime, setRuntime] = useState<OfficeRuntimeState>({
    runtimeLabel: 'Hermes',
    runtimeStatus: 'offline',
    runtimeStage: 'phase_device_bridge_only',
    notes: '当前未连接到办公室运行时。',
    runtimeOnline: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!isConnected) {
      setAgents([]);
      setRuntime({
        runtimeLabel: 'Hermes',
        runtimeStatus: 'offline',
        runtimeStage: 'phase_device_bridge_only',
        notes: '当前未连接到办公室运行时。',
        runtimeOnline: false,
      });
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const client = await getClientAsync();
      const [agentList, onlineState, historyResult, workflowsResult] = await Promise.all([
        client.agent.listMyAgents().catch(() => []),
        client.devices.getOnlineState().catch(() => null),
        client.conversations.listHistory({ teamId: 1, limit: 100 }).catch(() => []),
        client.workflow.list().catch(() => []),
      ]);

      const runtimeState = {
        runtimeLabel: onlineState?.runtimeLabel ?? 'Hermes',
        runtimeStatus: onlineState?.runtimeStatus ?? 'unknown',
        runtimeStage: onlineState?.runtimeStage ?? 'phase_device_bridge_only',
        notes: onlineState?.notes ?? '办公室运行时未返回额外说明。',
        runtimeOnline: isRuntimeOnline(onlineState),
      };

      const histories = Array.isArray(historyResult) ? historyResult : [];
      const workflows = (Array.isArray(workflowsResult) ? workflowsResult : []) as OfficeWorkflowLike[];
      const latestHistoryByAgent = new Map<number, ConversationHistoryMessage>();

      for (const item of histories) {
        if (typeof item.agentId !== 'number') continue;
        const existing = latestHistoryByAgent.get(item.agentId);
        if (!existing) {
          latestHistoryByAgent.set(item.agentId, item);
          continue;
        }
        if (parseOfficeTimestamp(item.createdTime) >= parseOfficeTimestamp(existing.createdTime)) {
          latestHistoryByAgent.set(item.agentId, item);
        }
      }

      const officeAgents = sortOfficeAgents(
        (Array.isArray(agentList) ? agentList : []).map((agent) => {
          const profile = findOfficeProfile(agent);
          const matchedWorkflows = getWorkflowMatchesForAgent(agent, profile, workflows);
          const latestHistory = latestHistoryByAgent.get(agent.id);
          const lastActive = agent.lastActiveTime ?? latestHistory?.createdTime ?? null;
          const activeTaskStatus = agent.activeTaskStatus ?? null;
          const runtimeStatus = agent.runtimeStatus ?? runtimeState.runtimeStatus;

          return {
            id: agent.id,
            code: agent.code,
            hubId: profile?.id ?? agent.code,
            name: profile?.name ?? agent.name,
            role: profile?.role ?? agent.description ?? '未设置角色',
            avatar: profile?.avatar ?? agent.avatar ?? '🤖',
            isLeader: (profile?.id ?? agent.code) === 'leader',
            model: agent.model ?? profile?.model ?? 'unknown',
            runtimeLabel: agent.runtimeLabel ?? runtimeState.runtimeLabel,
            activity: deriveOfficeActivity(
              runtimeState.runtimeOnline,
              runtimeStatus,
              lastActive,
              matchedWorkflows.length,
              activeTaskStatus,
            ),
            lastActive,
            activeTaskStatus,
            activeTaskProgress: agent.activeTaskProgress ?? null,
            activeTaskBrief: agent.activeTaskBrief ?? null,
            workflowCount: matchedWorkflows.length,
            primaryWorkflowId: matchedWorkflows[0]?.id ?? null,
            primaryWorkflowName: matchedWorkflows[0]?.name ?? null,
          };
        }),
      );

      setAgents(officeAgents);
      setRuntime(runtimeState);
      setError(null);
    } catch (err) {
      setAgents([]);
      setRuntime({
        runtimeLabel: 'Hermes',
        runtimeStatus: 'error',
        runtimeStage: 'phase_device_bridge_only',
        notes: '办公室数据拉取失败。',
        runtimeOnline: false,
      });
      setError(err instanceof Error ? err.message : 'office data unavailable');
    } finally {
      setLoading(false);
    }
  }, [isConnected]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!isConnected) return undefined;

    const timer = window.setInterval(() => {
      void refresh();
    }, 15000);

    return () => window.clearInterval(timer);
  }, [isConnected, refresh]);

  const triggerAction = useCallback(async (
    agentId: number,
    action: OfficeActionKind,
    options?: OfficeActionOptions,
  ): Promise<OfficeActionResult> => {
    if (!isConnected) {
      return { ok: false, emoji: '⚠️', message: '当前离线，无法发送办公室指令' };
    }

    const target = agents.find((agent) => agent.id === agentId);
    if (!target) {
      return { ok: false, emoji: '⚠️', message: '未找到目标智体' };
    }

    const taskContent = options?.taskContent?.trim() ?? '';
    if (action === 'task' && !taskContent) {
      return { ok: false, emoji: '⚠️', message: '请输入任务内容' };
    }

    try {
      const client = await getClientAsync();

      if (action === 'task' && target.primaryWorkflowId) {
        await client.workflow.run(target.primaryWorkflowId, {
          source: 'virtual-office',
          teamId: 1,
          agentId: target.id,
          agentCode: target.code,
          agentName: target.name,
          taskBrief: taskContent,
          prompt: taskContent,
        });
        void refresh();
        return {
          ok: true,
          emoji: '📋',
          message: `已为 ${target.name} 启动工作流${target.primaryWorkflowName ? `：${target.primaryWorkflowName}` : ''}`,
        };
      }

      const messages: Record<Exclude<OfficeActionKind, 'task'>, string> = {
        pat: '[virtual-office] 老板刚刚拍了拍你，请同步当前进展。',
        coffee: '[virtual-office] 老板请你喝杯咖啡，休整后继续当前任务并回复进度。',
        rush: '[virtual-office] 请优先处理当前任务，并尽快反馈阻塞点和预计完成时间。',
      };
      const feedback: Record<OfficeActionKind, { emoji: string; message: string }> = {
        pat: { emoji: '👋', message: `已提醒 ${target.name} 同步当前进展` },
        task: { emoji: '📋', message: `已向 ${target.name} 下发任务请求` },
        coffee: { emoji: '☕', message: `已给 ${target.name} 发送休息提醒` },
        rush: { emoji: '🔔', message: `已催办 ${target.name} 当前任务` },
      };

      const content = action === 'task'
        ? `[virtual-office] 新任务：${taskContent}\n请回复执行计划、预计完成时间，以及当前可能阻塞点。`
        : messages[action];

      await client.conversations.sendMessage({
        teamId: 1,
        agentId: target.id,
        content,
      });

      void refresh();
      return {
        ok: true,
        emoji: feedback[action].emoji,
        message: feedback[action].message,
      };
    } catch (err) {
      return {
        ok: false,
        emoji: '⚠️',
        message: err instanceof Error ? err.message : '办公室动作执行失败',
      };
    }
  }, [agents, isConnected, refresh]);

  return {
    agents,
    runtime,
    loading,
    error,
    refresh,
    triggerAction,
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
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    if (!isConnected) {
      setData(null);
      setError(null);
      setLoading(false);
      return;
    }
    try {
      const client = await getChannelsClientAsync();
      const overview = await client.channels.getOverview(1);
      setData(overview as unknown as ChannelsData);
      setError(null);
    } catch (err) {
      setData(null);
      setError(err instanceof Error ? err.message : getChannelsLocalOnlyError());
    } finally {
      setLoading(false);
    }
  }, [isConnected]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { data, loading, error, refresh };
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
  void agentId;

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
    [],
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
