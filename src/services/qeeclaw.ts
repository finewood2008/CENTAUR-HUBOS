import { createQeeClawClient } from "@qeeclaw/core-sdk";
import { createQeeClawProductSDK } from "@qeeclaw/product-sdk";

// 针对桌面的离线/本地优先部署（Hermes Bridge C/S模式）
const BASE_URL = import.meta.env.VITE_QEECLAW_BASE_URL || "http://127.0.0.1:21737";
const TOKEN = import.meta.env.VITE_QEECLAW_TOKEN || "none";

// 实例化 Core SDK
export const qeeclawClient = createQeeClawClient({
  baseUrl: BASE_URL,
  token: TOKEN,
});

// 实例化 Product SDK (如需要场景化装配)
// @ts-ignore
export const qeeclawProduct = createQeeClawProductSDK(qeeclawClient);

// 定义全局的运行时上下文信息
export const globalRuntimeContext = {
  teamId: 1, // 本地单机部署默认
  runtimeType: "hermes" as const, // 明确使用 hermes agent 运行时
};

// --- 常用的封装接口调用示例 ---

/**
 * 测试连接状态
 */
export async function checkConnection() {
  try {
    const models = await qeeclawClient.models.listAvailable();
    return { connected: true, models };
  } catch (error) {
    console.error("QeeClaw Connection Error:", error);
    return { connected: false, error };
  }
}

/**
 * 记忆存储 (如: 将用户在界面配置好的SOUL.md存入底层)
 */
export async function storeAgentMemory(agentId: string, content: string, category: string = "system") {
  return qeeclawClient.memory.store({
    ...globalRuntimeContext,
    agentId,
    content,
    // @ts-ignore
    category,
    importance: 0.9,
  });
}
