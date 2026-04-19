// 双 Key 架构：内部网关的 Agent_Key 生成与验证
export function generateAgentKey() {
  return 'ak_' + Math.random().toString(36).substr(2, 12);
}

// 模拟本地持久化数据库中的数字员工注册表
export const agentRegistry = [
  { id: 'spark',   name: '火花 Spark',     key: 'ak_spark_9f2x8k',   quota: 100, tools: ['midjourney', 'dalle3', 'wechat_publish', 'xiaohongshu'] },
  { id: 'xiaoke',  name: '小可 Xiaoke',    key: 'ak_xiaoke_7m3d1p',  quota: 80,  tools: ['ad_platform', 'crm', 'email_marketing', 'data_analytics'] },
  { id: 'shuxi',   name: '书熙 Shuxi',     key: 'ak_shuxi_5n8w2q',   quota: 40,  tools: ['legal_db', 'contract_tpl', 'risk_engine', 'case_search'] },
  { id: 'shuibao', name: '税宝 Shuibao',   key: 'ak_shuibao_3k6r9t', quota: 40,  tools: ['invoice_ocr', 'tax_engine', 'excel_export', 'bank_recon'] },
  { id: 'lvan',    name: '绿安 Lvan',      key: 'ak_lvan_1j4p7v',    quota: 60,  tools: ['security_scan', 'log_analysis', 'perm_engine', 'alert_sys'] },
];

export function verifyAgent(key: string) {
  return agentRegistry.find(a => a.key === key);
}
