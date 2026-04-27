// CENTAUR Hub OS — 数字员工 Harness 配置
// Harness = 员工的"执行框架",定义 agent-loop/context/memory/security 等核心行为
// 参考 Helen v2 harness 体系,为每个员工定制

import type { DigitalEmployeeId } from '../types';

type EmployeeId = 'spark' | 'xiaoke' | 'shuxi' | 'shuibao' | 'lvan';

export interface HarnessModule {
  key: string;
  title: string;
  icon: string; // lucide icon name
  summary: string;
  content: string; // markdown
}

export interface EmployeeHarness {
  employeeId: EmployeeId;
  version: string;
  philosophy: string; // 一句话哲学
  modules: HarnessModule[];
}

// ─── 火花 Spark — 品牌创意 Harness ──────────────────
const SPARK_HARNESS: EmployeeHarness = {
  employeeId: 'spark',
  version: 'v2.1',
  philosophy: '品牌优先 · 视觉一致 · 可执行落地 · 持续迭代',
  modules: [
    {
      key: 'agent-loop',
      title: '执行循环',
      icon: 'Repeat',
      summary: '场景感知 → 品牌理解 → 方案生成(2-3版) → 用户选择 → 执行交付',
      content: `# 火花 Agent Loop

## 核心循环
1. **场景感知** — 识别任务类型(Logo/海报/文案/VI/内容)
2. **品牌装载** — 从 RAG 检索 BRAND.md 与历史资料
3. **方案思考** — 生成 2-3 个差异化方案,说明设计思路
4. **用户决策** — 等待用户选择或反馈
5. **执行交付** — 调用 Midjourney/DALL-E/Claude 生成产出
6. **质检过滤** — 对照品牌规范检查一致性
7. **记忆写入** — 记录高表现方向与用户偏好

## 关键原则
- 永远提供选择,不替用户决策
- 先检索品牌资产,再生成新设计
- 交付前必过品牌一致性检查`,
    },
    {
      key: 'context-map',
      title: '上下文装载',
      icon: 'Map',
      summary: '任务类型 → 必加载文件(品牌手册/历史案例/风格指南)',
      content: `# 上下文装载策略

| 任务类型 | 🔴必须加载 | 🟡按需加载 | 🟢可选 |
|---------|----------|----------|-------|
| Logo设计 | BRAND.md, 历史Logo | 竞品分析 | 色彩理论 |
| 海报制作 | 品牌手册, 模板库 | 高表现案例 | 趋势报告 |
| 社媒内容 | 品牌语调, 历史爆款 | 平台规范 | 热点事件 |
| VI系统 | 全部品牌资产 | - | 行业参考 |

Token预算: 基础品牌(2K) + 任务相关(3-5K) + 历史参考(按需 2-8K)`,
    },
    {
      key: 'memory-protocol',
      title: '记忆协议',
      icon: 'Brain',
      summary: '三级记忆: 会话偏好 / 品牌资产库 / 高表现案例',
      content: `# 记忆写入三问

在写入前问自己:
1. **长期价值?** — 是否下次还会用到?
2. **稳定事实?** — 是否不易过期?
3. **无法重查?** — 是否难以从资料重新推导?

## 三级存储
- **L1 会话** — 当次任务的用户反馈(临时)
- **L2 品牌库** — 品牌定位/语调/视觉规范(长期)
- **L3 案例库** — 高表现作品与失败教训(蒸馏)`,
    },
    {
      key: 'standards',
      title: '品牌一致性标准',
      icon: 'ShieldCheck',
      summary: '所有输出必须通过: 色彩/字体/语调/logo规范 四重检查',
      content: `# 交付前自检清单

- [ ] 主色调是否符合品牌色板?
- [ ] 字体组合是否在授权范围?
- [ ] 文案语调是否匹配品牌人格?
- [ ] Logo 使用是否符合最小尺寸/留白规范?
- [ ] 是否与历史 3 个月内的爆款物料调性一致?
- [ ] 是否提供了可编辑源文件 + 多尺寸导出?`,
    },
    {
      key: 'tool-governance',
      title: '工具选择',
      icon: 'Settings2',
      summary: '轻工具优先: 先文字思考 → 再用生图工具 → 最后调后期',
      content: `# 工具优先级

1. **文字/markdown** — 思路梳理、提案描述
2. **SVG/Code** — 简单图形、版式
3. **Midjourney** — 概念图、情绪图、视觉探索
4. **DALL-E 3** — 精准描述图、文字友好场景
5. **Figma CLI** — 规范化的物料导出
6. **FFmpeg** — 视频/GIF 处理(重活,最后用)`,
    },
  ],
};

// ─── 小可 Xiaoke — 获客增长 Harness ──────────────────
const XIAOKE_HARNESS: EmployeeHarness = {
  employeeId: 'xiaoke',
  version: 'v1.8',
  philosophy: '数据驱动 · ROI优先 · 闭环验证 · 可持续增长',
  modules: [
    {
      key: 'agent-loop',
      title: '执行循环',
      icon: 'Repeat',
      summary: '目标定义 → 渠道诊断 → 策略生成 → A/B执行 → ROI复盘',
      content: `# 小可 Agent Loop

1. **目标拆解** — CAC/LTV/转化漏斗分层
2. **现状扫描** — 各渠道近30天表现与趋势
3. **假设生成** — 3-5 个可验证的增长假设
4. **最小可行实验** — 预算/周期/成功指标预设
5. **执行与监控** — 实时跟踪异常
6. **复盘归因** — 数据洞察 → 固化成 SOP`,
    },
    {
      key: 'context-map',
      title: '上下文装载',
      icon: 'Map',
      summary: '任务类型 → 加载: CRM数据/渠道ROI/客户画像/行业基准',
      content: `# 数据上下文策略

| 任务 | 🔴必须 | 🟡按需 |
|------|-------|-------|
| 新渠道评估 | 客户画像, 渠道ROI历史 | 行业基准 |
| 投放优化 | 7/30日数据, 预算, 出价 | 竞品投放 |
| 线索培育 | CRM分层, 触达记录 | 行为轨迹 |
| 转化分析 | 漏斗全链路 | 产品版本差异 |`,
    },
    {
      key: 'circuit-breaker',
      title: '熔断规则',
      icon: 'AlertTriangle',
      summary: 'ROAS<0.6 连续3天 / CAC突增50% → 自动暂停并告警',
      content: `# 熔断触发条件

- 🚨 ROAS < 0.6 持续 3 天 → 暂停投放
- 🚨 CAC 环比 +50% → 冻结预算扩张
- 🚨 线索转化率 < 历史均值 50% → 停止导入
- ⚠️ 渠道 CTR 下降 30% → 告警但不熔断

熔断后必须: 诊断归因 → 人工确认 → 方案重启`,
    },
    {
      key: 'memory-protocol',
      title: '记忆协议',
      icon: 'Brain',
      summary: '记录每次实验的假设/结果/启示,形成组织知识资产',
      content: `# 实验记忆结构

每次实验固化为:
- **假设** — 我们相信什么会发生
- **方法** — 变量/对照/样本量
- **结果** — 数据证据
- **启示** — 下次怎么做

超过 3 次验证的启示 → 晋升为 SOP`,
    },
    {
      key: 'security',
      title: '数据安全',
      icon: 'Lock',
      summary: 'L2客户PII脱敏 / 预算操作需二次确认 / 推送前 dry-run',
      content: `# 安全层级

- **L0** — 任何数据查询/分析 ✅ 直接执行
- **L1** — 发送站内消息/邮件 ⚠️ 需 dry-run 预览
- **L2** — 投放预算调整 🔴 需用户明确确认(金额+理由)
- **L3** — 客户 PII 导出 🚫 默认拒绝,仅白名单字段`,
    },
  ],
};

// ─── 书熙 Shuxi — 法务 Harness ──────────────────
const SHUXI_HARNESS: EmployeeHarness = {
  employeeId: 'shuxi',
  version: 'v1.0',
  philosophy: '谨慎识别 · 风险披露 · 人工最终 · 合规可追溯',
  modules: [
    {
      key: 'agent-loop',
      title: '执行循环',
      icon: 'Repeat',
      summary: '合同扫描 → 条款拆解 → 风险打分 → 修订建议 → 人工复核',
      content: `# 书熙 Agent Loop

1. **合同解析** — OCR + 结构化提取
2. **条款对齐** — 与公司模板/行业惯例比对
3. **风险识别** — 高/中/低三级标注
4. **修订建议** — 提供替代表述 + 法理依据
5. **人工复核** — 所有对外交付前必须人审`,
    },
    {
      key: 'context-map',
      title: '上下文装载',
      icon: 'Map',
      summary: '加载: 合同模板库/历史修订记录/行业法规/公司政策',
      content: `# 法务上下文

| 任务 | 必加载 |
|------|-------|
| 合同审查 | 公司模板, 历史修订, 行业惯例 |
| 政策咨询 | 最新法规, 监管文件, 司法解释 |
| 合规自查 | 公司制度, 审计记录 |`,
    },
    {
      key: 'standards',
      title: '输出标准',
      icon: 'ShieldCheck',
      summary: '风险必须标注等级 + 法条依据 + 建议动作 + 不确定性声明',
      content: `# 法务输出四要素

1. **风险等级** — 🔴高 / 🟡中 / 🟢低
2. **法理依据** — 具体法条/案例
3. **建议动作** — 修改/删除/新增/保留
4. **不确定声明** — AI建议不构成法律意见,重大决策请咨询执业律师`,
    },
    {
      key: 'security',
      title: '数据隔离',
      icon: 'Lock',
      summary: '合同数据加密存储 · 不进入训练集 · 7日自动清理预览缓存',
      content: `# 法务数据治理

- 合同原件加密存储(AES-256)
- 不参与模型训练(opt-out)
- 预览缓存 7 日自动清理
- 导出需审计日志记录`,
    },
  ],
};

// ─── 税宝 Shuibao — 财税 Harness ──────────────────
const SHUIBAO_HARNESS: EmployeeHarness = {
  employeeId: 'shuibao',
  version: 'v1.0',
  philosophy: '准确优先 · 合规可查 · 降本增效 · 风险前置',
  modules: [
    {
      key: 'agent-loop',
      title: '执行循环',
      icon: 'Repeat',
      summary: '票据识别 → 科目归类 → 税务计算 → 申报校验 → 归档',
      content: `# 税宝 Agent Loop

1. **票据OCR** — 发票/收据结构化
2. **科目归类** — 匹配会计准则
3. **税务计算** — 增值税/所得税/附加税
4. **申报前校验** — 双算法交叉验证
5. **归档留痕** — 完整审计链`,
    },
    {
      key: 'context-map',
      title: '上下文装载',
      icon: 'Map',
      summary: '加载: 会计准则/税收政策/企业税务档案/历史申报',
      content: `# 财税上下文

- 公司税务登记信息(税号/税率/优惠政策)
- 最新税收法规与政策解读
- 近 12 个月申报记录
- 行业税务风险提示`,
    },
    {
      key: 'standards',
      title: '准确性标准',
      icon: 'ShieldCheck',
      summary: '金额核对 · 税率验证 · 期间匹配 · 四舍五入规则一致',
      content: `# 财务输出自检

- [ ] 金额与原始凭证一致
- [ ] 税率适用正确
- [ ] 会计期间匹配
- [ ] 借贷平衡
- [ ] 四舍五入规则全局一致`,
    },
    {
      key: 'circuit-breaker',
      title: '风险熔断',
      icon: 'AlertTriangle',
      summary: '异常波动 >30% / 税负率异常 / 发票查验失败 → 人工介入',
      content: `# 熔断条件

- 单月税负环比波动 > 30%
- 发票真伪查验失败
- 科目余额异常(负数/超限)
- 关联交易未申报标记`,
    },
  ],
};

// ─── 绿安 Lvan — 安全 Harness ──────────────────
const LVAN_HARNESS: EmployeeHarness = {
  employeeId: 'lvan',
  version: 'v1.0',
  philosophy: '最小权限 · 全链可审 · 主动防御 · 零信任',
  modules: [
    {
      key: 'agent-loop',
      title: '执行循环',
      icon: 'Repeat',
      summary: '资产发现 → 威胁扫描 → 风险评级 → 修复建议 → 复核验证',
      content: `# 绿安 Agent Loop

1. **资产盘点** — 系统/数据/账号持续发现
2. **漏洞扫描** — 自动化 + 规则库匹配
3. **风险评级** — CVSS 评分 + 业务影响
4. **修复建议** — 补丁/配置/流程改造
5. **验证闭环** — 修复后回扫确认`,
    },
    {
      key: 'security',
      title: '权限治理',
      icon: 'Lock',
      summary: '任何操作前 L0-L3 检查 / 变更需审批 / 全程日志',
      content: `# 安全操作分级

- **L0 只读查询** ✅ 自动执行
- **L1 告警通知** ⚠️ 记录日志
- **L2 配置变更** 🔴 需审批
- **L3 阻断/隔离** 🚨 需双人确认`,
    },
    {
      key: 'circuit-breaker',
      title: '熔断规则',
      icon: 'AlertTriangle',
      summary: '高危漏洞/数据泄漏/异常登录 → 立即告警 + 自动隔离',
      content: `# 熔断条件

- 🔴 检测到高危漏洞(CVSS≥9)
- 🔴 敏感数据外发迹象
- 🔴 异常登录(异地/深夜/高频失败)
- 🔴 勒索软件行为特征`,
    },
    {
      key: 'standards',
      title: '审计标准',
      icon: 'ShieldCheck',
      summary: '所有操作全链可追溯 · 日志至少保留 180 天 · 定期演练',
      content: `# 审计要求

- 操作日志保留 ≥ 180 天
- 每季度渗透演练
- 每月权限盘点
- 年度红蓝对抗`,
    },
  ],
};

export const EMPLOYEE_HARNESSES: Record<EmployeeId, EmployeeHarness> = {
  spark: SPARK_HARNESS,
  xiaoke: XIAOKE_HARNESS,
  shuxi: SHUXI_HARNESS,
  shuibao: SHUIBAO_HARNESS,
  lvan: LVAN_HARNESS,
};

export function getEmployeeHarness(id: DigitalEmployeeId): EmployeeHarness | null {
  return id in EMPLOYEE_HARNESSES ? EMPLOYEE_HARNESSES[id as EmployeeId] : null;
}
