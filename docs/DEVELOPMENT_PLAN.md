# Hub OS 数字员工平台 · 开发计划

**版本目标**: v0.10.0 → v1.0.0
**核心理念**: 数字员工 = LLM + Harness + Skills + RAG + Memory + GUI卡片

---

## ✅ 已完成：数字员工配置页（v0.10.0）

> 2026-04-20 完成。EmployeeConfigPanel 二栏配置面板 + 7 个 Tab 模块。

- [x] EmployeeConfigPanel 二栏布局（左Tab导航 + 右内容区）
- [x] TabOverview — 员工概览（基本信息+状态）
- [x] TabModel — 模型配置（绑定的 LLM）
- [x] TabHarness — Harness 配置（agent-loop/context/memory/standards/security）
- [x] TabSkills — 技能管理（clawhub.ai 映射，启用/禁用+调用统计）
- [x] TabKnowledge — 知识库/RAG 配置
- [x] TabMemory — 个人记忆系统
- [x] TabWorkspace — 工作台入口（小可已接通 XiaokeWorkspace）
- [x] employee-harness.ts — 5员工 Harness 数据
- [x] employee-skills.ts — 5员工 Skills 数据
- [x] useEmployeeConfig hook — SDK/mock 双模式
- [x] 锁定逻辑（active 可编辑 / inactive 只读）
- [x] zustand 依赖补充

---

## Phase 0：架构基础（卡片系统 + 对话流重构）

> 这是所有后续工作的地基，必须先做。

### 0.1 卡片协议与注册表
- [ ] 定义 CardMessage 协议：`{ type: 'card', template: string, data: object, editable: boolean }`
- [ ] 创建 `src/components/cards/CardRegistry.ts` — 模板注册表
- [ ] 创建 `src/components/cards/CardRenderer.tsx` — 统一渲染器（根据 template 分发）
- [ ] 定义卡片通用 props：`{ data, onEdit, onAction }`

### 0.2 统一对话流引擎
- [ ] 创建 `src/components/chat-engine/ChatFlow.tsx` — 通用对话流组件
  - 消息列表（文本消息 + 卡片消息混排）
  - 流式打字机效果
  - 底部输入框 + 快捷指令
- [ ] 创建 `src/components/chat-engine/MessageBubble.tsx` — 文本消息
- [ ] 创建 `src/components/chat-engine/CardSlot.tsx` — 卡片消息插槽（调用 CardRenderer）
- [ ] 所有员工共用这套对话流，不再各写各的 ChatColumn/ChatPanel

### 0.3 统一工作台外壳
- [ ] 创建 `src/components/workspace/WorkspaceShell.tsx` — 双栏外壳
  - 左栏：对话流（主，flex-[6]）
  - 右栏：看板区（flex-[4]，可折叠）
  - 顶部 bar：返回 + 员工名 + 看板切换
- [ ] 创建 `src/components/workspace/BoardPanel.tsx` — 看板容器（可编辑布局）
- [ ] 重构火花/小可工作台，统一使用 WorkspaceShell

---

## Phase 1：卡片模板开发

> 首批 8 个卡片，覆盖内容类 + 商务类。

### 1.1 内容类卡片（4个）
- [ ] `ArticleEditorCard` — 文章编辑卡片（标题/正文/标签，可编辑，带平台预览切换）
- [ ] `SocialPostCard` — 社媒帖子卡片（朋友圈/小红书/抖音，含配图占位）
- [ ] `ContentOutlineCard` — 大纲确认卡片（树形大纲，可拖拽调序，确认/修改按钮）
- [ ] `ContentCalendarCard` — 内容日历卡片（周视图，每天的选题计划）

### 1.2 商务类卡片（4个）
- [ ] `QuotationCard` — 报价单卡片（客户/项目表格/合计，可编辑行项，导出PDF）
- [ ] `CustomerInfoCard` — 客户信息卡片（联系人/公司/标签/跟进记录）
- [ ] `FollowUpCard` — 跟进提醒卡片（客户/事项/时间/状态，可标记完成）
- [ ] `InvoiceSummaryCard` — 发票摘要卡片（已开/待开/统计图，提醒操作）

---

## Phase 2：Harness 工作流引擎

> 让数字员工从"问答机器人"变成"有流程的同事"。

### 2.1 Harness 运行时
- [ ] 定义 `HarnessStep` 类型：`{ id, type: 'ai'|'confirm'|'tool'|'branch', prompt?, card?, next }`
- [ ] 创建 `src/engine/HarnessRunner.ts` — 流程执行器
  - 按步骤推进
  - 遇到 confirm 步骤 → 渲染卡片等用户确认
  - 遇到 tool 步骤 → 调用 skill
  - 遇到 branch → 根据条件分流
- [ ] MVP 先硬编码流程定义，数据结构预留 YAML/JSON DSL 扩展

### 2.2 火花的 Harness
- [ ] 写公众号文章流程：需求理解 → 生成大纲(卡片确认) → 生成全文(编辑卡片) → 平台预览 → 发布
- [ ] 写小红书笔记流程：需求理解 → 生成内容(社媒卡片) → 预览 → 发布
- [ ] 内容日历流程：了解行业 → 生成周计划(日历卡片) → 用户调整 → 确认

### 2.3 小可的 Harness
- [ ] 写报价单流程：了解需求 → 生成报价(报价单卡片) → 编辑确认 → 导出/发送
- [ ] 客户跟进流程：录入客户(客户卡片) → 设置跟进(提醒卡片) → 自动提醒
- [ ] 催款流程：选择客户 → 生成催款话术 → 确认发送

### 2.4 书熙的 Harness
- [ ] 合同生成流程：了解需求 → 选模板 → 生成合同(文档卡片) → 编辑 → 导出
- [ ] 会议纪要流程：输入要点 → 生成纪要(文档卡片) → 确认 → 分发

### 2.5 税宝的 Harness
- [ ] 发票查询流程：查询条件 → 展示汇总(发票卡片) → 提醒操作
- [ ] 税务日历流程：展示本月待办(日历卡片) → 标记完成

---

## Phase 3：员工数据重构 + 看板

### 3.1 员工定义重构
- [ ] 重写 `digital-employees.ts`：火花(新媒体运营)、小可(客户管家)、书熙(行政文秘)、税宝(财税助手)
- [ ] 其他员工标记为"开发中"状态
- [ ] 每个员工的 workspace.type 统一为 'chat-board'（对话+看板）

### 3.2 员工专属看板
- [ ] 火花看板：内容日历 + 发布数据统计
- [ ] 小可看板：客户管道（新线索/跟进中/意向/成交） + 跟进提醒列表
- [ ] 书熙看板：待办文档列表 + 最近生成的文档
- [ ] 税宝看板：发票统计 + 税务日历

### 3.3 看板可编辑
- [ ] 看板内数据可直接编辑（改状态、改内容）
- [ ] 编辑后自动同步到 memory store

---

## Phase 4：Channel 对接层

### 4.1 Channel 配置 UI
- [ ] 每个员工详情页增加"渠道配置"板块
- [ ] 支持配置：飞书 bot / 企微 bot / 钉钉 bot / webhook
- [ ] 每个员工独立的 bot，独立的 token/secret

### 4.2 Channel 适配器（与后端 CTO 协作）
- [ ] 定义前后端接口协议：消息收发、卡片渲染指令、action callback
- [ ] 卡片降级渲染策略：Hub OS 富卡片 → 飞书消息卡片 → 纯文本 fallback
- [ ] Channel 状态监控：在线/离线/错误

---

## Phase 5：记忆与数据层

### 5.1 统一记忆系统
- [ ] 创建 `src/engine/MemoryManager.ts` — 统一记忆管理
- [ ] 每个员工独立的 memory namespace
- [ ] localStorage 存储，预留后端同步接口

### 5.2 企业数据（RAG 预留）
- [ ] 定义 RAG 数据源接口：品牌数据库、客户数据库、文档库
- [ ] MVP 用 localStorage mock，预留后端 RAG 接入点

---

## 里程碑

| 里程碑 | 内容 | 预计 | 状态 |
|-------|------|------|------|
| M-1 | 数字员工配置页 (EmployeeConfigPanel + 7 Tabs) | — | ✅ v0.10 完成 |
| M0 | Phase 0 完成，卡片系统 + 对话流 + 双栏工作台基础可用 | 第1周 | 🔜 下一步 |
| M1 | Phase 1 完成，8个卡片模板可渲染 | 第2周 | |
| M2 | Phase 2 完成，火花+小可的核心 harness 跑通 | 第3周 | |
| M3 | Phase 3 完成，4个员工全部有看板 | 第4周 | |
| M4 | Phase 4 + 5，Channel 对接 + 记忆系统 | 第5-6周 | |
| v1.0 | 端到端演示：用户在 Hub OS 找火花写文章，全流程卡片交互 | 第6周末 | |

---

## 技术决策记录

1. **卡片系统跨员工共享**：卡片是平台能力，不属于某个员工
2. **对话流是核心交互**：所有操作通过对话触发，卡片嵌入对话流
3. **双栏结构**：对话流(主) + 看板(辅)，看板可折叠
4. **Harness MVP 硬编码**：数据结构预留 DSL 扩展
5. **每个员工独立 bot**：IM Channel 每个员工一个独立机器人
6. **记忆本地化**：MVP 用 localStorage，预留后端同步
