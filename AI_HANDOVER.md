# AI_HANDOVER.md — Hub OS 项目交接文档

> 给其他 AI 开发者（Claude Code / Codex / OpenCode 等）的项目状态说明
> 最后更新: 2026-04-22 v0.11.0

---

## 一、项目概览

Hub OS 是半人马 AI 的数字员工操作系统前端。把大模型 Agent 包装成"数字员工"，企业老板像管理真实团队一样管理 AI。

- 仓库: `finewood2008/CENTAUR-HUBOS`
- 线上预览: https://finewood2008.github.io/CENTAUR-HUBOS/
- 技术栈: React 19 + TypeScript + Tailwind CSS v4 + Vite 8 + Electron 22
- 设计系统: Claude/Anthropic 暖色调（parchment/terracotta/Georgia衬线标题）
- 后端 SDK: `@qeeclaw/core-sdk`（未发布到 npm，本地开发通过 npm link 引入）

## 二、当前状态

### ✅ 已完成的功能模块

| 模块 | 组件路径 | 版本 | 说明 |
|------|---------|------|------|
| 超级工作台 | `components/cockpit/` | v0.11 | 三栏布局，左面板(审批/定时任务/快捷指令) + 中PartnerChat + 右数据面板(默认关闭) |
| 信息流 | `components/dashboard/` | v0.7 | 语义化 Feed 卡片，按类型/员工筛选，审批操作按钮 |
| 数字团队 | `components/team/` | v0.11 | 6 名员工(含主管) + Builder V2 + EmployeeConfigPanel 二栏配置页，主管置顶特殊展示 |
| 员工配置面板 | `components/team/EmployeeConfigPanel.tsx` | v0.11 | 左导航+右内容二栏布局，8 Tab(概览/模型/Harness/技能/RAG/记忆/人格/工作台) |
| 记忆中心 | `components/memory/` | v0.11 | 三视图(总览仪表盘/时间线/认知图谱)，主管置顶C位，图谱中心节点为主管 |
| 员工构建工作台 | `components/builder/` | v0.8 | 三栏布局(Chat+Canvas+Detail)，Gemini AI 对话驱动，三层可视化画布 |
| 财务中心 | `components/finance/` | v0.4 | API Key 管理 + 员工用量明细 + 月度预算 |
| 通讯中心 | `components/channels/` | v0.3 | 渠道监控大盘（企微/飞书/Telegram/钉钉/邮件） |
| 知识库 | `components/knowledge/` | v0.3 | 文档管理 + 统计 + 权限分配 |
| 设置 | `components/settings/` | v0.11 | 设备信息/云端连接/企业信息/员工策略/通知/安全/外观（已移除系统记忆板块） |
| AI 对话 | `components/chat/` | v0.2 | 对话区，接 models.invoke() |

### ⚠️ 当前限制

1. **GitHub Pages 运行在 stub 模式** — 无真实后端，所有数据来自 `src/data/mock.ts` 和 `src/data/digital-employees.ts`
2. **SDK 类型来自 `@qeeclaw/core-sdk`** — 编译时需要该包存在于 node_modules（通过 npm link 或本地路径引用）
3. **所有 hooks 都有 mock fallback** — `useQeeClaw.ts` 中每个 hook 先尝试 SDK 真实调用，catch 后 fallback 到 mock 数据

### 🔴 需要后端对接的地方

详见下方「前后端 API 契约」章节。

---

## 三、代码架构

```
src/
├── App.tsx                        # 路由入口，NavTab 切换 7 个页面(含记忆中心)
├── types/index.ts                 # 所有 TypeScript 类型定义
├── services/qeeclaw.ts            # SDK 适配层（双模式：真实 SDK / Proxy stub）
├── hooks/
│   ├── useQeeClaw.ts              # 17 个 hooks，每个对应一组 SDK 调用
│   └── useEmployeeConfig.ts       # ★ v0.10 员工配置 hook（SDK/mock 双模式）
├── stores/
│   ├── useAppStore.tsx            # Zustand 全局状态
│   └── personaStore.ts            # ★ v0.11 人格+记忆 store（OpenClaw 标准，双轨§分隔）
├── engine/
│   └── PromptAssembler.ts         # ★ v0.11 提示词组装器（SOUL+MEMORY→system prompt）
├── data/
│   ├── mock.ts                    # 工作台/信息流 mock 数据
│   ├── digital-employees.ts       # ★ v0.11 数字员工档案(含主管) + 财务 mock 数据
│   ├── persona-defaults.ts        # ★ v0.11 灵魂默认值(6员工+共享层)
│   ├── partner.ts                 # 合伙人/团队成员数据模型
│   ├── employee-harness.ts        # ★ v0.10 5员工 Harness 配置（agent-loop/context/memory/standards/security）
│   └── employee-skills.ts         # ★ v0.10 5员工 Skills 映射（clawhub.ai 技能库+调用统计）
├── gateway/
│   ├── auth.ts                    # 鉴权桩
│   └── event-bus.ts               # 事件总线
└── components/
    ├── cockpit/                   # 超级工作台
    │   ├── Cockpit.tsx            #   主容器（三栏布局）
    │   ├── SidePanel.tsx          #   左侧信息面板
    │   └── FeedStream.tsx         #   右侧信息流
    ├── builder/                   # ★ v0.8 员工构建工作台
    │   ├── index.ts               #   导出入口
    │   ├── EmployeeBuilderV2.tsx   #   主容器（三栏 Chat+Canvas+Detail + header + footer）
    │   ├── BuilderChat.tsx         #   左栏：对话式构建（接 Gemini）
    │   ├── BuilderCanvas.tsx       #   中栏：三层可视化画布（身份/能力/工作流）
    │   └── NodeDetailPanel.tsx     #   右栏：节点详情编辑面板
    ├── dashboard/Dashboard.tsx    # 信息流 Feed
    ├── team/                      # ★ v0.10 数字团队（重大更新）
    │   ├── Team.tsx               #   团队主页（DetailPanel → EmployeeConfigPanel）
    │   ├── EmployeeConfigPanel.tsx #   ★ 二栏配置面板（左Tab导航+右内容）
    │   └── tabs/                  #   ★ 7 个配置 Tab 组件
    │       ├── TabOverview.tsx     #     概览：员工基本信息+状态
    │       ├── TabModel.tsx        #     模型：绑定的 LLM 配置
    │       ├── TabHarness.tsx      #     Harness：agent-loop/context/memory/standards/security
    │       ├── TabSkills.tsx       #     技能：clawhub.ai 映射技能库+启用状态+调用统计
    │       ├── TabKnowledge.tsx    #     知识库：RAG 数据源配置
    │       ├── TabMemory.tsx       #     记忆：个人记忆系统配置
    │       └── TabWorkspace.tsx    #     工作台：入口配置（小可已接通 XiaokeWorkspace）
    ├── finance/Finance.tsx        # 财务中心
    ├── channels/Channels.tsx      # 通讯中心
    ├── knowledge/Knowledge.tsx    # 知识库
    ├── settings/Settings.tsx      # 设置
    ├── chat/ChatArea.tsx          # AI 对话
    ├── agents/                    # Agent 创建/管理（旧版，保留兼容）
    │   ├── EmployeeBuilder.tsx    #   旧版对话式创建器（已被 builder/ 取代）
    │   ├── GenerationAnimation.tsx#   生成动画
    │   └── TrialChat.tsx          #   试聊确认
    ├── layout/Sidebar.tsx         # 侧边导航栏
    └── shared/                    # 共享组件（Toast/Modal 等）
```

### 数据流向

```
用户操作 → Component → useXxxHook() → getXxxModule() → SDK/Stub → HTTP → bridge_server
                                                                ↓ (失败)
                                                          mock 数据 fallback
```

---

## 四、前后端 API 契约

以下是前端 hooks 调用的所有 SDK 方法，后端开发者需要确保这些 API 端点可用。

### 4.1 SDK 模块 → API 方法映射

#### agent 模块 (员工管理)

| 方法 | 方向 | 前端 Hook | 参数 | 返回值 |
|------|------|----------|------|--------|
| `agent.listMyAgents()` | READ | useDashboardData, useAgentManagement | 无 | `MyAgent[]` — `{id, name, code, description, avatar, model}` |
| `agent.listDefaultTemplates()` | READ | useAgentManagement | 无 | `AgentTemplate[]` — `{code, name, avatar, description, allowedTools}` |
| `agent.create()` | WRITE | useAgentActions | `{name, description, model, runtimeType:'hermes'}` | 创建结果对象 |

#### billing 模块 (财务)

| 方法 | 方向 | 前端 Hook | 参数 | 返回值 |
|------|------|----------|------|--------|
| `billing.getWallet()` | READ | useConnection, useDashboardData, useFinanceData | 无 | `WalletSummary` — `{balance, currency, currentMonthSpent, totalSpent}` |
| `billing.listRecords()` | READ | useFinanceData, useEnhancedDashboardData | `{page:1, pageSize:50}` | `{items: BillingRecord[]}` |

#### models 模块 (模型调用)

| 方法 | 方向 | 前端 Hook | 参数 | 返回值 |
|------|------|----------|------|--------|
| `models.invoke()` | WRITE | useQeeClawAgent, useChatConversation | `{prompt: string}` | `{text: string, ...}` |
| `models.getQuota()` | READ | useFinanceData | 无 | `ModelQuotaSummary` |
| `models.getUsage()` | READ | useFinanceData | `{days: 7}` | `ModelUsageSummary` |
| `models.getCost()` | READ | useFinanceData | `{days: 7}` | `ModelCostSummary` |

#### channels 模块 (通讯渠道)

| 方法 | 方向 | 前端 Hook | 参数 | 返回值 |
|------|------|----------|------|--------|
| `channels.getOverview()` | READ | useChannelsData | `teamId=1` | `ChannelsData` — `{supportedCount, configuredCount, activeCount, items[]}` |

#### knowledge 模块 (知识库)

| 方法 | 方向 | 前端 Hook | 参数 | 返回值 |
|------|------|----------|------|--------|
| `knowledge.list()` | READ | useKnowledgeData | `{teamId: 1}` | `{documents: [{source_name, chunk_count, total_chars, ...}]}` |
| `knowledge.stats()` | READ | useKnowledgeData | `{teamId: 1}` | `{document_count, chunk_count, total_chars, ...}` |

#### conversations 模块 (对话管理)

| 方法 | 方向 | 前端 Hook | 参数 | 返回值 |
|------|------|----------|------|--------|
| `conversations.getStats()` | READ | useConversationsData | `teamId=1` | 会话统计 |
| `conversations.listGroups()` | READ | useConversationsData | `{teamId: 1}` | 会话分组列表 |
| `conversations.listHistory()` | READ | useChatConversation | `{teamId:1, limit:50}` | `ConversationHistoryMessage[]` |
| `conversations.sendMessage()` | WRITE | useChatConversation | `{teamId:1, content, agentId, direction}` | `ConversationHistoryMessage` |

#### audit 模块 (审计)

| 方法 | 方向 | 前端 Hook | 参数 | 返回值 |
|------|------|----------|------|--------|
| `audit.getSummary()` | READ | useAuditData | 无 | 审计摘要 |
| `audit.listEvents()` | READ | useAuditData, useEnhancedDashboardData | `{page:1, pageSize:20}` | `{items: AuditEvent[]}` |

#### approval 模块 (审批)

| 方法 | 方向 | 前端 Hook | 参数 | 返回值 |
|------|------|----------|------|--------|
| `approval.list()` | READ | useApprovalData | `{page:1, pageSize:20}` | `{items: ApprovalItem[]}` |

#### devices 模块 (设备)

| 方法 | 方向 | 前端 Hook | 参数 | 返回值 |
|------|------|----------|------|--------|
| `devices.list()` | READ | useDevicesData | 无 | 设备列表 |
| `devices.getOnlineState()` | READ | useDevicesData | 无 | 在线状态 |

#### apikey 模块 (密钥管理)

| 方法 | 方向 | 前端 Hook | 参数 | 返回值 |
|------|------|----------|------|--------|
| `apikey.list()` | READ | useApiKeyData, useFinanceData | 无 | `{items: AppKeyRecord[]}` |
| `apikey.listLLMKeys()` | READ | useApiKeyData, useFinanceData | 无 | `LLMKeyRecord[]` |

#### workflow 模块 (工作流)

| 方法 | 方向 | 前端 Hook | 参数 | 返回值 |
|------|------|----------|------|--------|
| `workflow.list()` | READ | useWorkflowData | 无 | 工作流列表 |

#### tenant 模块 (租户)

| 方法 | 方向 | 前端 Hook | 参数 | 返回值 |
|------|------|----------|------|--------|
| `tenant.getCurrentContext()` | READ | useTenantContext | 无 | 租户上下文 |

### 4.2 未使用的 SDK 模块

以下模块已在 `qeeclaw.ts` 中注册但前端 hooks 尚未调用：

- `memory` — 记忆模块
- `iam` — 身份与权限
- `policy` — 策略管理
- `file` — 文件管理
- `voice` — 语音模块

### 4.3 统计汇总

```
总 API 调用点:   34
├── READ  调用:  30 (88%)  — 数据获取
└── WRITE 调用:   4 (12%)  — agent.create / models.invoke / conversations.sendMessage x2

SDK 模块覆盖: 12/17 已使用，5/17 预留
最高频模块:   agent(5次) / billing(5次) / models(5次) / conversations(5次)
```

---

## 五、Mock 数据结构

当 SDK 不可用时，前端 fallback 到以下 mock 数据：

### 文件: `src/data/mock.ts`
- `AGENTS: Agent[]` — 4 名员工（火花/Linda/Helen/老张）
- `TEMPLATES: Template[]` — 9 个模板（2 live / 3 coming / 4 planned）
- `ALERTS: Alert[]` — 3 条告警
- `USAGE_7DAYS: UsageStat[]` — 7 天用量趋势
- `ACTIVITY_FEED: ActivityItem[]` — 10 条员工动态

### 文件: `src/data/digital-employees.ts`
- `DIGITAL_EMPLOYEES: DigitalEmployee[]` — 5 名员工完整档案（火花/小可/书熙/税宝/绿安）
- `FINANCE_DATA: FinanceOverview` — 财务概览 + 3 把 API Key + 2 名员工用量明细

### Cockpit 面板 mock（内联在 components 中）
- 团队概览: 4 名员工状态（工作中/空闲/等待中）
- 待办事项: 1 条待办
- 财务快照: 余额 ¥128.50，月消耗 ¥42.3，预算 33%
- 通讯状态: 5 个渠道，4 在线，Telegram 离线
- 知识库动态: 4 条最近更新
- 信息流: 7 条 Feed（1 待审批 / 1 警告 / 2 已完成 / 2 汇报 / 1 洞察）

---

## 六、开发指南

### 本地开发（有 SDK）
```bash
# 1. 确保 bridge_server 运行在 :21747
# 2. npm link @qeeclaw/core-sdk
npm install
npm run dev
# 页面自动连接真实 SDK，上方不会显示 "SDK 离线" 提示
```

### 本地开发（无 SDK）
```bash
npm install
npm run dev
# 页面显示 "SDK 离线 · 使用演示数据"，所有功能用 mock 数据运行
```

### 新增一个 SDK 对接 hook
```typescript
// 1. 在 src/hooks/useQeeClaw.ts 中添加
export function useNewFeatureData(isConnected: boolean) {
  const [data, setData] = useState(null);
  useEffect(() => {
    if (!isConnected) {
      setData(MOCK_DATA); // fallback
      return;
    }
    (async () => {
      try {
        const result = await getXxxModule().someMethod();
        setData(result);
      } catch {
        setData(MOCK_DATA); // fallback on error
      }
    })();
  }, [isConnected]);
  return { data };
}

// 2. 在对应组件中使用
const { connected } = useConnection();
const { data } = useNewFeatureData(connected);
```

### 新增一个页面模块
1. 在 `src/components/xxx/` 创建组件
2. 在 `src/types/index.ts` 添加类型
3. 在 `NavTab` union type 中加入新 tab
4. 在 `App.tsx` 中添加路由
5. 在 `Sidebar.tsx` 中添加导航项

---

## 七、注意事项

1. **SDK 适配层 (`qeeclaw.ts`)** 使用 `new Function('return import(...)')` 隐藏动态 import，这是为了骗过 Vite/Rolldown 的静态分析。不要改回普通 `import()`，否则 CI 构建会失败。

2. **GitHub Pages 部署** 使用 `actions/upload-pages-artifact` + `actions/deploy-pages`（不是 `peaceiris/actions-gh-pages`）。Pages 配置为 `build_type: workflow`。

3. **Tailwind v4** 使用 `@theme inline` 在 `index.css` 中定义设计 token，不是 `tailwind.config.js`。

4. **设计约束** 所有颜色使用语义化 token（`text-terracotta` 而非 `text-[#c96442]`），标题用 `font-serif`，正文用 `font-sans`。

5. **前端类型** `@qeeclaw/core-sdk` 的类型（`MyAgent`, `AgentTemplate`, `WalletSummary` 等）在 `useQeeClaw.ts` 的 import 中声明。本地开发需要该包存在。如果不可用，构建会跳过类型检查（CI 中 `tsc -b` 在失败后有 fallback step 直接跑 `vite build`）。

6. **Builder V2 入口有两处** — `App.tsx`（顶部导航"添加员工"按钮）和 `Team.tsx`（团队页底部"添加数字员工"卡片）都引用 `components/builder/`。修改 Builder 时需确认两个入口都正常。

7. **团队页不追加 SDK 额外 agent** — `Team.tsx` 只展示 `digital-employees.ts` 中预设的 5 名核心员工 + 用户通过 Builder 自建的员工。SDK 中有但预设列表里没有的 agent 会被忽略，避免演示时出现多余卡片。

---

## 八、v0.10 关键设计决策

### 为什么用二栏配置页（EmployeeConfigPanel）取代原有 DetailPanel？
- DetailPanel 是单页滚动，信息密度低，7 个模块挤在一起用户难以聚焦
- 二栏布局（左Tab导航+右内容区）让每个模块独立呈现，信息层级清晰
- Tab 切换比滚动更适合配置型界面，用户可快速跳转到目标模块
- 为后续模块扩展（如日志、监控）预留空间，只需新增 Tab

### Harness 数据结构设计（employee-harness.ts）
- 每位员工独立的 Harness 配置对象，包含 5 个维度：
  - `agentLoop`: agent 循环策略（最大轮次、超时、重试策略）
  - `contextMap`: 上下文窗口管理（token 限制、优先级排序）
  - `memoryProtocol`: 记忆读写协议（存储策略、召回阈值）
  - `standards`: 合规标准（输出格式、审核规则）
  - `security`: 安全策略（权限边界、敏感信息过滤）
- 数据结构为静态 mock，预留后端 API 对接接口

### Skills 来源（employee-skills.ts）
- 技能定义来自 clawhub.ai 技能市场的映射
- 每个技能包含：名称、描述、启用状态、调用统计（总次数/成功率/平均耗时）
- 不同员工根据角色绑定不同技能集
- 统计数据为 mock，真实环境从 SDK billing/usage 模块获取

### 锁定逻辑
- 火花(Spark)和小可(Xiaoke) status=active → 全模块可交互
- 书熙/税宝/绿安 status=inactive → 所有模块只读预览 + 锁定提示
- 锁定状态在 EmployeeConfigPanel 层统一控制，各 Tab 通过 props 接收 `readonly` 标志

---

## 九、已知问题 & 下一步

### 已知问题
1. **Builder V2 Gemini 依赖** — BuilderChat 通过 CF Worker 代理调用 Gemini 2.5 Flash，需要网络可用。离线时 AI 对话不可用，但画布和手动编辑仍可操作。
2. **旧版 EmployeeBuilder 未删除** — `components/agents/EmployeeBuilder.tsx` 仍保留，但已无入口引用。可安全删除。
3. **Builder 演示数据** — 当前 Builder 打开时所有节点为空（status='empty'），投资人演示时需手动走完对话流程或考虑加入预填充 mock 数据。
4. **mock.ts 中的 AGENTS** — 仍包含 Linda/Helen/老张，这些数据被 Cockpit/Dashboard 使用，与团队页的 `DIGITAL_EMPLOYEES` 是两套独立数据源。如需统一，需重构数据层。
5. **Tab 组件 mock 数据硬编码** — TabHarness/TabSkills/TabKnowledge/TabMemory 的数据来自静态文件，需要后续接入 SDK 真实 API。
6. **inactive 员工解锁流程** — 当前只有只读预览，尚未实现激活付费/解锁交互。

### 下一步优先级
1. **P0** — Phase 0 卡片系统 + 对话流引擎（所有工作台的基础）
2. **P0** — 统一工作台外壳 WorkspaceShell（对话+看板双栏）
3. **P1** — 火花/小可 Harness 工作流跑通（从配置页直接进入）
4. **P1** — TabHarness/TabSkills 接入真实 SDK API
5. **P2** — 书熙/税宝/绿安激活流程 + 解锁交互
6. **P2** — Channel 对接层（飞书/企微 bot 配置）
