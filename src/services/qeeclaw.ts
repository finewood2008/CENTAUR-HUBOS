// Hub OS - QeeClaw SDK 适配层
// 本地开发: 使用真实 @qeeclaw/core-sdk 连接 bridge_server
// 未连接 bridge 时由调用方展示空态或错误态

import { createQeeClawClient } from '@qeeclaw/core-sdk';

// ── 类型定义 ──────────────────────────────────────
export type QeeClawCoreSDK = {
  billing: { getWallet: () => Promise<any>; listRecords: (...args: any[]) => Promise<any>; [key: string]: any };
  agent: any;
  builder: any;
  models: any;
  channels: any;
  knowledge: any;
  memory: any;
  conversations: any;
  iam: any;
  devices: any;
  workflow: any;
  audit: any;
  approval: any;
  apikey: any;
  tenant: any;
  policy: any;
  file: any;
  voice: any;
};

// ── 本地开发环境配置 ──────────────────────────────
const isDev = import.meta.env.DEV;
const BASE_URL = import.meta.env.VITE_BRIDGE_URL || window.location.origin;
const CHANNELS_ENV_URL = import.meta.env.VITE_CHANNELS_BRIDGE_URL || import.meta.env.VITE_BRIDGE_URL || '';
const CHANNELS_LOCAL_ONLY_ERROR = '通讯渠道仅允许连接本地 hermes-bridge。请在本机启动 bridge，并通过本地地址访问前端，或设置 VITE_CHANNELS_BRIDGE_URL 指向本地 bridge。';
const DEFAULT_REQUEST_TIMEOUT_MS = Number(import.meta.env.VITE_QEECLAW_REQUEST_TIMEOUT_MS || 300_000);

function isLocalUrl(urlString: string): boolean {
  try {
    const { hostname } = new URL(urlString);
    return hostname === 'localhost'
      || hostname === '127.0.0.1'
      || hostname === '0.0.0.0'
      || hostname === '::1'
      || hostname.endsWith('.local');
  } catch {
    return false;
  }
}

function resolveChannelsBaseUrl(): string | null {
  if (CHANNELS_ENV_URL) {
    return isLocalUrl(CHANNELS_ENV_URL) ? CHANNELS_ENV_URL : null;
  }

  if (typeof window !== 'undefined' && isLocalUrl(window.location.origin)) {
    return window.location.origin;
  }

  return null;
}

const CHANNELS_BASE_URL = resolveChannelsBaseUrl();

function resolvePort(urlString: string, fallback = 21747): number {
  try {
    const url = new URL(urlString);
    if (url.port) {
      return Number(url.port);
    }
    return url.protocol === 'https:' ? 443 : 80;
  } catch {
    return fallback;
  }
}

console.log('[QeeClaw SDK] 初始化配置:', { isDev, BASE_URL, CHANNELS_BASE_URL });

// ── 创建客户端单例 ─────────────────────────────────
let _client: QeeClawCoreSDK | null = null;
let _clientPromise: Promise<QeeClawCoreSDK> | null = null;
let _channelsClient: QeeClawCoreSDK | null = null;
let _channelsClientPromise: Promise<QeeClawCoreSDK> | null = null;

// 异步版本：等待 SDK 加载完成后再创建客户端（推荐使用）
export async function getClientAsync(): Promise<QeeClawCoreSDK> {
  if (!_clientPromise) {
    _clientPromise = (async () => {
      if (!_client) {
        _client = createQeeClawClient({ baseUrl: BASE_URL, timeoutMs: DEFAULT_REQUEST_TIMEOUT_MS }) as QeeClawCoreSDK;
        console.log('[QeeClaw SDK] 客户端已创建 (真实)');
      }

      return _client;
    })();
  }

  return _clientPromise;
}

export function isChannelsLocalBridgeAvailable(): boolean {
  return Boolean(CHANNELS_BASE_URL);
}

export function getChannelsBaseUrl(): string | null {
  return CHANNELS_BASE_URL;
}

export function getBridgePort(): number {
  return resolvePort(BASE_URL);
}

export function getChannelsLocalOnlyError(): string {
  return CHANNELS_LOCAL_ONLY_ERROR;
}

export async function getChannelsClientAsync(): Promise<QeeClawCoreSDK> {
  if (!CHANNELS_BASE_URL) {
    throw new Error(CHANNELS_LOCAL_ONLY_ERROR);
  }

  if (!_channelsClientPromise) {
    _channelsClientPromise = (async () => {
      if (!_channelsClient) {
        _channelsClient = createQeeClawClient({ baseUrl: CHANNELS_BASE_URL, timeoutMs: DEFAULT_REQUEST_TIMEOUT_MS }) as QeeClawCoreSDK;
        console.log('[QeeClaw SDK] Channels client 已创建 (local bridge only)');
      }

      return _channelsClient;
    })();
  }

  return _channelsClientPromise;
}

// 同步版本：立即返回（不推荐直接使用）
export function getClient(): QeeClawCoreSDK {
  if (!_client) {
    console.trace('[QeeClaw SDK] getClient() 被同步调用，调用栈：');
    _client = createQeeClawClient({ baseUrl: BASE_URL, timeoutMs: DEFAULT_REQUEST_TIMEOUT_MS }) as QeeClawCoreSDK;
    console.log('[QeeClaw SDK] 客户端已创建 (真实)');
  }
  return _client;
}

// 运行时上下文
export const globalRuntimeContext = {
  teamId: 1,
  runtimeType: 'hermes' as const,
};

// ── 连接检查 ──────────────────────────────────────
export async function checkConnection(): Promise<{
  connected: boolean;
  error?: string;
}> {
  try {
    const client = await getClientAsync();
    try {
      await client.devices.getOnlineState();
    } catch {
      await client.agent.listMyAgents();
    }
    console.log('[QeeClaw SDK] 连接检查成功');
    return { connected: true };
  } catch (err) {
    console.error('[QeeClaw SDK] 连接检查失败:', err);
    return {
      connected: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// ── 便捷访问器 ────────────────────────────────────
export function getAgentModule() { return getClient().agent; }
export function getBuilderModule() { return getClient().builder; }
export function getBillingModule() { return getClient().billing; }
export function getModelsModule() { return getClient().models; }
export function getChannelsModule() {
  if (!CHANNELS_BASE_URL) {
    throw new Error(CHANNELS_LOCAL_ONLY_ERROR);
  }
  if (!_channelsClient) {
    _channelsClient = createQeeClawClient({ baseUrl: CHANNELS_BASE_URL, timeoutMs: DEFAULT_REQUEST_TIMEOUT_MS }) as QeeClawCoreSDK;
  }
  return _channelsClient.channels;
}
export function getKnowledgeModule() { return getClient().knowledge; }
export function getMemoryModule() { return getClient().memory; }
export function getConversationsModule() { return getClient().conversations; }
export function getIamModule() { return getClient().iam; }
export function getDevicesModule() { return getClient().devices; }
export function getWorkflowModule() { return getClient().workflow; }
export function getAuditModule() { return getClient().audit; }
export function getApprovalModule() { return getClient().approval; }
export function getApiKeyModule() { return getClient().apikey; }
export function getTenantModule() { return getClient().tenant; }
export function getPolicyModule() { return getClient().policy; }
export function getFileModule() { return getClient().file; }
export function getVoiceModule() { return getClient().voice; }

// 向后兼容的 legacy 导出
export const qeeclawClient = {
  get models() { return getModelsModule(); },
  get memory() { return getMemoryModule(); },
};
