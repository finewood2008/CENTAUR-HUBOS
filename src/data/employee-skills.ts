// CENTAUR Hub OS — 数字员工 Skills 配置
// Skills 来源: clawhub.ai 技能库 (按员工角色匹配)
// 每个员工预装 8-12 个核心 skill,可启用/禁用

import type { DigitalEmployeeId } from '../types';

type EmployeeId = 'spark' | 'xiaoke' | 'shuxi' | 'shuibao' | 'lvan';

export interface EmployeeSkill {
  id: string;
  name: string;
  category: string;
  description: string;
  source: string; // clawhub.ai 来源标记
  version: string;
  enabled: boolean;
}

// ─── 火花 Spark ──────────────────────────────────
const SPARK_SKILLS: EmployeeSkill[] = [
  { id: 'spark-logo-design', name: 'spark-logo-design', category: 'creative', description: '品牌 Logo 设计工作流 — 温暖、有人情味的视觉语言', source: 'clawhub.ai/creative', version: 'v1.4', enabled: true },
  { id: 'baoyu-infographic', name: 'baoyu-infographic', category: 'creative', description: '21 种布局的专业信息图生成', source: 'clawhub.ai/creative', version: 'v2.1', enabled: true },
  { id: 'popular-web-designs', name: 'popular-web-designs', category: 'creative', description: '54 套生产级设计系统(从真实产品提取)', source: 'clawhub.ai/creative', version: 'v1.0', enabled: true },
  { id: 'awesome-design-systems', name: 'awesome-design-systems', category: 'creative', description: '58 个知名品牌 DESIGN.md 设计系统集合', source: 'clawhub.ai/creative', version: 'v1.0', enabled: true },
  { id: 'wechat-auto-writer', name: 'wechat-auto-writer', category: 'content', description: '自动撰写并发布文章到微信公众号草稿箱', source: 'clawhub.ai/content', version: 'v3.0', enabled: true },
  { id: 'email-design', name: 'email-design', category: 'design', description: '邮件营销设计 — 布局/标题/转化优化', source: 'clawhub.ai/sales', version: 'v1.2', enabled: true },
  { id: 'ascii-art', name: 'ascii-art', category: 'creative', description: 'ASCII 艺术生成(571 字体 + cowsay)', source: 'clawhub.ai/creative', version: 'v1.0', enabled: false },
  { id: 'three-panel-ai-workspace', name: 'three-panel-ai-workspace', category: 'product', description: '三栏 AI 工作台(对话+画布+预览)', source: 'clawhub.ai/creative', version: 'v1.0', enabled: true },
  { id: 'songwriting-and-ai-music', name: 'songwriting-and-ai-music', category: 'creative', description: '词曲创作 + Suno AI 音乐生成', source: 'clawhub.ai/creative', version: 'v1.0', enabled: false },
  { id: 'presentation-builder', name: 'presentation-builder', category: 'productivity', description: '可编辑演示文稿构建', source: 'clawhub.ai/sales', version: 'v1.0', enabled: true },
];

// ─── 小可 Xiaoke ──────────────────────────────────
const XIAOKE_SKILLS: EmployeeSkill[] = [
  { id: 'crm-automation', name: 'crm-automation', category: 'sales', description: 'HubSpot/Salesforce/Pipedrive 自动化', source: 'clawhub.ai/sales', version: 'v2.0', enabled: true },
  { id: 'sales-qualification', name: 'sales-qualification', category: 'sales', description: '销售线索资格评估(BANT/MEDDIC)', source: 'clawhub.ai/sales', version: 'v1.5', enabled: true },
  { id: 'enterprise-sales', name: 'enterprise-sales', category: 'sales', description: '企业大客户销售导航', source: 'clawhub.ai/sales', version: 'v1.0', enabled: true },
  { id: 'sales-enablement', name: 'sales-enablement', category: 'sales', description: '销售物料/Pitch deck 制作', source: 'clawhub.ai/sales', version: 'v1.2', enabled: true },
  { id: 'firecrawl', name: 'firecrawl', category: 'research', description: '网页抓取/搜索/爬取(官方 CLI)', source: 'clawhub.ai/research', version: 'v1.0', enabled: true },
  { id: 'feishu-lead-generation-webhook', name: 'feishu-lead-generation-webhook', category: 'web', description: '飞书 Lead Gen Webhook 集成', source: 'clawhub.ai/web', version: 'v1.0', enabled: true },
  { id: 'stock-analysis', name: 'stock-analysis', category: 'finance', description: '股票/加密货币 Yahoo Finance 分析', source: 'clawhub.ai/finance', version: 'v1.0', enabled: false },
  { id: 'xitter', name: 'xitter', category: 'social', description: 'X/Twitter 互动(发帖/监控)', source: 'clawhub.ai/social', version: 'v1.1', enabled: true },
  { id: 'webhook-subscriptions', name: 'webhook-subscriptions', category: 'devops', description: '事件驱动的 Webhook 订阅管理', source: 'clawhub.ai/devops', version: 'v1.0', enabled: true },
];

// ─── 书熙 Shuxi (法务) ──────────────────────────────────
const SHUXI_SKILLS: EmployeeSkill[] = [
  { id: 'ocr-and-documents', name: 'ocr-and-documents', category: 'productivity', description: 'PDF/扫描件文本提取', source: 'clawhub.ai/productivity', version: 'v1.0', enabled: true },
  { id: 'nano-pdf', name: 'nano-pdf', category: 'productivity', description: '自然语言指令编辑 PDF', source: 'clawhub.ai/productivity', version: 'v1.0', enabled: true },
  { id: 'notion', name: 'notion', category: 'productivity', description: 'Notion API 文档管理', source: 'clawhub.ai/productivity', version: 'v1.0', enabled: true },
  { id: 'google-workspace', name: 'google-workspace', category: 'productivity', description: 'Gmail/Drive/Docs 集成', source: 'clawhub.ai/productivity', version: 'v1.0', enabled: true },
  { id: 'arxiv', name: 'arxiv', category: 'research', description: '学术论文检索(用于法律研究)', source: 'clawhub.ai/research', version: 'v1.0', enabled: false },
  { id: 'obsidian', name: 'obsidian', category: 'note-taking', description: 'Obsidian 知识库读写', source: 'clawhub.ai/notes', version: 'v1.0', enabled: false },
];

// ─── 税宝 Shuibao (财税) ──────────────────────────────────
const SHUIBAO_SKILLS: EmployeeSkill[] = [
  { id: 'ocr-and-documents', name: 'ocr-and-documents', category: 'productivity', description: '发票/票据 OCR 识别', source: 'clawhub.ai/productivity', version: 'v1.0', enabled: true },
  { id: 'google-workspace', name: 'google-workspace', category: 'productivity', description: 'Google Sheets 财务表格处理', source: 'clawhub.ai/productivity', version: 'v1.0', enabled: true },
  { id: 'stock-analysis', name: 'stock-analysis', category: 'finance', description: '财务数据分析', source: 'clawhub.ai/finance', version: 'v1.0', enabled: true },
  { id: 'jupyter-live-kernel', name: 'jupyter-live-kernel', category: 'data-science', description: '实时 Python 内核(财务建模)', source: 'clawhub.ai/data', version: 'v1.0', enabled: true },
  { id: 'nano-pdf', name: 'nano-pdf', category: 'productivity', description: '财务报表 PDF 编辑', source: 'clawhub.ai/productivity', version: 'v1.0', enabled: true },
  { id: 'himalaya', name: 'himalaya', category: 'email', description: '邮件 IMAP/SMTP(税务通知)', source: 'clawhub.ai/email', version: 'v1.0', enabled: false },
];

// ─── 绿安 Lvan (安全) ──────────────────────────────────
const LVAN_SKILLS: EmployeeSkill[] = [
  { id: 'github-code-review', name: 'github-code-review', category: 'github', description: 'Git diff 安全审查 + 内联评论', source: 'clawhub.ai/github', version: 'v1.0', enabled: true },
  { id: 'codebase-inspection', name: 'codebase-inspection', category: 'github', description: '代码库巡检(LOC/复杂度/依赖)', source: 'clawhub.ai/github', version: 'v1.0', enabled: true },
  { id: 'github-issues', name: 'github-issues', category: 'github', description: 'GitHub Issues 管理(漏洞跟踪)', source: 'clawhub.ai/github', version: 'v1.0', enabled: true },
  { id: 'systematic-debugging', name: 'systematic-debugging', category: 'dev', description: '系统化调试方法', source: 'clawhub.ai/software', version: 'v1.0', enabled: true },
  { id: 'requesting-code-review', name: 'requesting-code-review', category: 'dev', description: '提交前安全扫描流水线', source: 'clawhub.ai/software', version: 'v1.0', enabled: true },
  { id: '1password', name: '1password', category: 'security', description: '1Password CLI 凭证管理', source: 'clawhub.ai/security', version: 'v1.0', enabled: true },
  { id: 'webhook-subscriptions', name: 'webhook-subscriptions', category: 'devops', description: '安全事件 Webhook 订阅', source: 'clawhub.ai/devops', version: 'v1.0', enabled: false },
];

export const EMPLOYEE_SKILLS: Record<EmployeeId, EmployeeSkill[]> = {
  spark: SPARK_SKILLS,
  xiaoke: XIAOKE_SKILLS,
  shuxi: SHUXI_SKILLS,
  shuibao: SHUIBAO_SKILLS,
  lvan: LVAN_SKILLS,
};

export function getEmployeeSkills(id: DigitalEmployeeId): EmployeeSkill[] {
  return id in EMPLOYEE_SKILLS ? EMPLOYEE_SKILLS[id as EmployeeId] : [];
}
