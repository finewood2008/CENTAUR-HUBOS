// 双 Key 架构：内部网关的 Agent_Key 生成与验证
export function generateAgentKey() {
  return 'ak_' + Math.random().toString(36).substr(2, 12);
}

// 模拟本地持久化数据库中的数字员工注册表
export const agentRegistry = [
  { id: 'agent_hr_01', name: 'HR 专员 (Linda)', key: 'ak_8f7d92nd8x1', quota: 20, tools: ['read_salary', 'write_offer'] },
  { id: 'agent_pr_01', name: '公关 大使 (Helen)', key: 'ak_9a8c7b6d5e4', quota: 60, tools: ['publish_post', 'web_search'] }
];

export function verifyAgent(key: string) {
  return agentRegistry.find(a => a.key === key);
}
