// Hub OS - QeeClaw SDK 真实客户端（连接本地 sidecar）
import { createQeeClawClient, type QeeClawCoreSDK } from '@qeeclaw/core-sdk';

// ── 本地开发环境配置 ──────────────────────────────
// 控制面 API 地址（mock server 或真实控制面）
const LOCAL_BASE_URL = 'http://127.0.0.1:3456';

// ── 创建客户端单例 ─────────────────────────────────
let _client: QeeClawCoreSDK | null = null;

export function getClient(): QeeClawCoreSDK {
  if (!_client) {
    _client = createQeeClawClient({
      baseUrl: LOCAL_BASE_URL,
      // 本地免鉴权，不需要 token
    });
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
    return { connected: true };
  } catch (err) {
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

// 向后兼容的 legacy 导出
export const qeeclawClient = {
  get models() {
    return getModelsModule();
  },
  get memory() {
    return getMemoryModule();
  },
};
