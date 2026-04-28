// 双 Key 架构：内部网关的 Agent_Key 生成与验证
export function generateAgentKey() {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  return `ak_${Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')}`;
}

export const agentRegistry: Array<{
  id: string;
  name: string;
  key: string;
  quota: number;
  tools: string[];
}> = [];

export function verifyAgent(key: string) {
  return agentRegistry.find(a => a.key === key);
}
