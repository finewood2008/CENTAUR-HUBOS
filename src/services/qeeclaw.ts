// Hub OS - QeeClaw SDK 适配层
// 本地开发: 使用真实 @qeeclaw/core-sdk 连接 bridge_server
// 生产部署(GitHub Pages): 使用内置 stub，UI 以演示模式运行

// ── 类型定义 ──────────────────────────────────────
export type QeeClawCoreSDK = {
  billing: { getWallet: () => Promise<any>; listRecords: (...args: any[]) => Promise<any>; [key: string]: any };
  agent: any;
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

// ── Stub 客户端 (生产环境 / SDK 不可用时) ──────────
function createStubClient(): QeeClawCoreSDK {
  const noop = () => Promise.reject(new Error('SDK not available'));
  const stubModule = new Proxy({}, { get: () => noop });
  return new Proxy({} as QeeClawCoreSDK, {
    get: (_target, prop) => {
      if (prop === 'billing') return { getWallet: noop, listRecords: noop };
      return stubModule;
    },
  });
}

// ── 尝试动态加载真实 SDK ──────────────────────────
let _realCreateClient: ((opts: any) => QeeClawCoreSDK) | null = null;
let _loadAttempted = false;

async function tryLoadRealSDK(): Promise<boolean> {
  if (_loadAttempted) return _realCreateClient !== null;
  _loadAttempted = true;
  try {
    // 只在 node_modules 有真实 SDK 时才成功 (dev 环境)
    // @ts-ignore - dynamic import may fail at build time
    const mod = await (Function('return import("@qeeclaw/core-sdk")')());
    _realCreateClient = mod.createQeeClawClient;
    return true;
  } catch {
    console.log('[QeeClaw SDK] 真实 SDK 不可用，使用 stub 模式');
    return false;
  }
}

// ── 本地开发环境配置 ──────────────────────────────
const isDev = import.meta.env.DEV;
const BASE_URL = isDev
  ? '' // 相对路径，走 Vite proxy
  : (import.meta.env.VITE_BRIDGE_URL || 'http://127.0.0.1:21747');

console.log('[QeeClaw SDK] 初始化配置:', { isDev, BASE_URL });

// ── 创建客户端单例 ─────────────────────────────────
let _client: QeeClawCoreSDK | null = null;

export function getClient(): QeeClawCoreSDK {
  if (!_client) {
    if (_realCreateClient) {
      _client = _realCreateClient({ baseUrl: BASE_URL });
      console.log('[QeeClaw SDK] 客户端已创建 (真实)');
    } else {
      _client = createStubClient();
      console.log('[QeeClaw SDK] 客户端已创建 (stub)');
    }
  }
  return _client;
}

// 启动时尝试加载真实 SDK
tryLoadRealSDK().then(ok => {
  if (ok && !_client) {
    // 如果还没创建 client，下次 getClient() 会用真实 SDK
    console.log('[QeeClaw SDK] 真实 SDK 已就绪');
  }
});

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
    const client = getClient();
    await client.billing.getWallet();
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
export function getBillingModule() { return getClient().billing; }
export function getModelsModule() { return getClient().models; }
export function getChannelsModule() { return getClient().channels; }
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
