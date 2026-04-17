// Hub OS - QeeClaw SDK 真实客户端（连接本地 bridge_server）
import { createQeeClawClient, type QeeClawCoreSDK } from '@qeeclaw/core-sdk';

// ── 本地开发环境配置 ──────────────────────────────
// 开发模式：使用相对路径，走 Vite proxy 到 bridge_server (21747)
// 生产模式：直接连接 bridge_server
const isDev = import.meta.env.DEV;
const BASE_URL = isDev
  ? '' // 相对路径，走 Vite proxy
  : (import.meta.env.VITE_BRIDGE_URL || 'http://127.0.0.1:21747');

console.log('[QeeClaw SDK] 初始化配置:', { isDev, BASE_URL });

// ── 创建客户端单例 ─────────────────────────────────
let _client: QeeClawCoreSDK | null = null;

export function getClient(): QeeClawCoreSDK {
  if (!_client) {
    _client = createQeeClawClient({
      baseUrl: BASE_URL,
      // 本地免鉴权，不需要 token
    });
    console.log('[QeeClaw SDK] 客户端已创建');
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
    const client = getClient();
    // 尝试获取钱包信息来验证连接
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
// 直接导出 client 的各模块，方便 hooks 调用
export function getAgentModule() {
  return getClient().agent;
}

export function getBillingModule() {
  return getClient().billing;
}

export function getModelsModule() {
  return getClient().models;
}

export function getChannelsModule() {
  return getClient().channels;
}

export function getKnowledgeModule() {
  return getClient().knowledge;
}

export function getMemoryModule() {
  return getClient().memory;
}

export function getConversationsModule() {
  return getClient().conversations;
}

export function getIamModule() {
  return getClient().iam;
}

export function getDevicesModule() {
  return getClient().devices;
}

export function getWorkflowModule() {
  return getClient().workflow;
}

export function getAuditModule() {
  return getClient().audit;
}

export function getApprovalModule() {
  return getClient().approval;
}

export function getApiKeyModule() {
  return getClient().apikey;
}

export function getTenantModule() {
  return getClient().tenant;
}

export function getPolicyModule() {
  return getClient().policy;
}

export function getFileModule() {
  return getClient().file;
}

export function getVoiceModule() {
  return getClient().voice;
}

// 向后兼容的 legacy 导出
export const qeeclawClient = {
  get models() {
    return getModelsModule();
  },
  get memory() {
    return getMemoryModule();
  },
};
