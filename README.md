# Hub OS

> 半人马 AI 数字员工操作系统 — 让每一家中小企业都拥有自己的 AI 团队

Hub OS 是一个本地部署的 AI Agent 管理平台。它把大模型 Agent 包装成"数字员工"的概念，让企业老板像管理真实团队一样管理 AI —— 招聘、分配任务、查看工作汇报、控制权限和预算。

## 核心理念

**不是又一个 AI 聊天工具，而是一个 AI 人事系统。**

- 每个 Agent 是一名"员工"，有档案、岗位、技能、权限
- 通过"架构师面谈"对话式创建新员工，不需要写代码
- Dashboard 是"公司早报"，一眼掌握全局
- 知识库是"公司资料室"，按权限分配给不同员工

## 功能模块

### 控制台 (Dashboard)
公司早报风格的全局概览：
- 在线员工状态 / 今日任务完成数 / 算力消耗 / 安全告警
- 每位员工的今日工作汇报
- 近 7 日算力消耗趋势图
- 异常告警（配额耗尽、越权访问、API 故障）

### 员工管理 (Agents)
三个子视图：
- **员工市场** — 预配置的岗位模板（销售、客服、财务、法务等），一键入职（已接入 SDK `agent.create`）
- **花名册** — 在册员工列表 + 详细档案卡（通讯渠道、能力标签、工具权限、数据权限、算力预算）
- **架构师面谈** — 对话式 Agent Builder，通过自然语言定义岗位、选模型、配权限

### 通讯中心 (Channels)
全局渠道监控大盘（只读）：
- 统计概览 — 员工总数 / 渠道在线 / 异常 / 未接入
- 员工渠道状态表 — 每行一个员工，对应渠道类型、名称、在线状态
- 渠道配置入口在员工档案卡，通讯中心只做总览监控

### 知识库 (Knowledge)
数字员工的知识来源管理：
- 多个独立知识库（品牌资料库、员工档案库、产品文档等）
- 按员工分配数据权限
- 文件索引和存储用量统计

### 设置 (Settings)
- 用户信息编辑（姓名、邮箱、手机）
- 模型偏好选择
- 后端连接状态实时检测

## 技术栈

- **前端**: React 19 + TypeScript + Tailwind CSS v4
- **桌面**: Electron 22（macOS / Windows / Linux）
- **动效**: Framer Motion
- **图标**: Lucide React
- **构建**: Vite 8
- **SDK**: @qeeclaw/core-sdk 0.1.0

## 快速开始

```bash
# 安装依赖
npm install

# 启动 Mock + Proxy 控制面服务器
node mock-server.cjs

# 浏览器开发模式（另一个终端）
npm run dev

# Electron 桌面应用开发模式
npm run app:dev
```

## 项目结构

```
src/
├── App.tsx                         # 主应用入口 + 路由
├── main.tsx                        # React 挂载点
├── index.css                       # 全局样式
├── types/
│   └── index.ts                    # TypeScript 类型定义
├── data/
│   └── mock.ts                     # Mock 数据（员工/模板/告警/用量）
├── services/
│   └── qeeclaw.ts                  # QeeClaw SDK 客户端单例 + 模块访问器
├── hooks/
│   └── useQeeClaw.ts               # SDK 数据加载 hooks（SDK-first + mock fallback）
└── components/
    ├── layout/
    │   └── Sidebar.tsx             # 侧边导航栏（沉浸式标题栏 + drag 区域）
    ├── dashboard/
    │   └── Dashboard.tsx           # 控制台首页
    ├── agents/
    │   └── AgentManagement.tsx     # 员工管理（市场+花名册+面谈+档案）
    ├── channels/
    │   └── Channels.tsx            # 通讯中心
    ├── knowledge/
    │   └── Knowledge.tsx           # 知识库
    ├── chat/
    │   └── ChatArea.tsx            # 聊天区域
    ├── roster/
    │   └── Roster.tsx              # 花名册
    └── settings/
        └── Settings.tsx            # 设置页面

mock-server.cjs                     # Proxy + Mock 控制面服务器
electron-main.cjs                   # Electron 主进程
```

---

## 产品状态 (v0.2.0)

### 前端完成度

| 模块 | 状态 | 说明 |
|------|------|------|
| Dashboard | ✅ 高保真 | 指标卡 + 汇报 + 趋势图 + 告警，已接 SDK 拉取真实数据 |
| 员工市场 | ✅ 可用 | 模板浏览 + 一键入职，已调用 `agent.create` |
| 花名册 | ✅ 可用 | 员工列表 + 档案卡（渠道/权限/预算） |
| 架构师面谈 | ✅ 原型 | 对话式 Agent Builder UI |
| 通讯中心 | 🟡 框架 | 只读监控大盘，渠道数据从 SDK 拉取 |
| 知识库 | 🟡 框架 | 列表 + 统计已接 SDK，文件上传待完善 |
| 设置 | ✅ 可用 | 用户信息 + 模型偏好 + 连接检测 |
| Electron 桌面 | ✅ 可用 | 沉浸式标题栏，macOS 红绿灯融入 |

### SDK 对接状态

前端通过 `@qeeclaw/core-sdk` 连接后端。当前开发环境使用 `mock-server.cjs`（:3456）作为中间层：

| SDK 模块 | 前端调用 | mock-server | 真实后端 | 状态 |
|----------|----------|-------------|----------|------|
| `agent.listMyAgents()` | ✅ | Mock | ❌ 未实现 | 需后端实现 |
| `agent.create()` | ✅ | Mock | ❌ 未实现 | 需后端实现 |
| `agent.listDefaultTemplates()` | ✅ | Mock | ❌ 未实现 | 需后端实现 |
| `billing.getWallet()` | ✅ | Mock | ❌ 未实现 | 需后端实现 |
| `billing.listRecords()` | ✅ | Mock | ❌ 未实现 | 需后端实现 |
| `models.list()` | ✅ | Mock | ❌ 未实现 | 需后端实现 |
| `models.invoke()` | ✅ | Proxy → :21747 | ✅ 已有 | 已打通 |
| `channels.getOverview()` | ✅ | Mock | ❌ 未实现 | 需后端实现 |
| `knowledge.list()` | ✅ | Proxy → :21747 | ✅ 已有 | 已打通 |
| `knowledge.stats()` | ✅ | Proxy → :21747 | ✅ 已有 | 已打通 |
| `knowledge.upload()` | ✅ | Proxy → :21747 | ✅ 已有 | 已打通 |
| `gateway.*` | ✅ | Proxy → :21747 | ✅ 已有 | 已打通 |
| `wechat.*` | ✅ | Proxy → :21747 | ✅ 已有 | 已打通 |
| `iam.getMe()` | ✅ | Mock | ❌ 未实现 | 需后端实现 |
| `conversations.*` | ✅ | Mock | ❌ 未实现 | 需后端实现 |
| `memory.*` | ✅ | Mock | ❌ 未实现 | 需后端实现 |

---

## 后端对接需求（给后端团队）

### 目标

将 Hub OS 前端从 Mock 数据切换到真实后端，实现前后端完全打通。

### 当前架构

```
[Hub OS 前端] → @qeeclaw/core-sdk → [mock-server.cjs :3456]
                                          ├── Mock 响应（agent/billing/models/channels/iam/conversations/memory）
                                          └── Proxy → [qeeclaw-server :21747]（knowledge/gateway/wechat/invoke）
```

### 目标架构

```
[Hub OS 前端] → @qeeclaw/core-sdk → [qeeclaw-server（真实控制面）]
                                          ├── Agent 管理 API
                                          ├── 计费 API
                                          ├── 模型管理 API
                                          ├── 渠道管理 API
                                          ├── 用户/IAM API
                                          ├── 对话记录 API
                                          ├── 记忆存储 API
                                          ├── 知识库 API（已有）
                                          ├── 网关 API（已有）
                                          └── 微信 API（已有）
```

### 需要后端实现的 API

以下是 SDK 期望的 API 路径和数据格式。所有响应需包裹在 `{ code: 0, data: ..., message: "success" }` 信封中。

#### 1. Agent 管理（优先级：P0）

```
GET  /api/agent/my-agents
  → 返回: Agent[] — { id, name, code, description, avatar, voice_id, runtime_type, runtime_label, model }

POST /api/agent/create
  → 请求: { name, description?, model?, runtime_type? }
  → 返回: { id, code, runtime_type }

GET  /agent_config/default
  → 返回: AgentTemplate[] — { id, code, name, description, avatar, allowed_tools }

GET  /agent_config/:code
  → 返回: AgentTemplate — 单个模板详情
```

#### 2. 计费系统（优先级：P0）

```
GET  /api/billing/wallet
  → 返回: { balance, currency, total_spent, total_recharge, current_month_spent, updated_time }

GET  /api/billing/records?page=1&page_size=20
  → 返回: { total, page, page_size, items: BillingRecord[] }
  → BillingRecord: { id, product_name, record_type, text_input_length, text_output_length, unit_price, output_unit_price, amount, currency, remark, balance_snapshot, created_time }

GET  /api/billing/summary
  → 返回: { total_spent, total_recharge }
```

#### 3. 模型管理（优先级：P1）

```
GET  /api/platform/models
  → 返回: Model[] — { id, provider_name, model_name, provider_model_id, label, is_preferred, availability_status, unit_price, output_unit_price, currency, billing_mode, text_unit_chars, text_min_amount }

GET  /api/platform/models/providers
  → 返回: Provider[] — { provider_name, configured, provider_status, visible_count, models[], ... }

GET  /api/platform/models/runtimes
  → 返回: Runtime[] — { runtime_type, runtime_label, runtime_status, runtime_stage, is_default, ... }

GET  /api/platform/models/route
  → 返回: { preferred_model, resolved_model, resolved_provider_name, selected: Model }

PUT  /api/platform/models/route
  → 请求: { preferred_model }
  → 返回: 同 GET route

GET  /api/platform/models/resolve?model_name=xxx
  → 返回: { requested_model, resolved_model, provider_name, provider_model_id, selected: Model }

GET  /api/platform/models/usage?days=7
  → 返回: { window_days, total_calls, breakdown: UsageBreakdown[] }

GET  /api/platform/models/cost?days=7
  → 返回: { window_days, total_amount, primary_currency, breakdown: CostBreakdown[] }

GET  /api/platform/models/quota
  → 返回: { wallet_balance, daily_limit, daily_spent, monthly_limit, monthly_spent, ... }
```

#### 4. 渠道管理（优先级：P1）

```
GET  /api/platform/channels
  → 返回: { supported_count, configured_count, active_count, items: ChannelItem[] }

GET  /api/platform/channels/:channel_key
  → 返回: ChannelItem + 渠道特有配置字段（corp_id/app_id/secret 等）

GET  /api/platform/channels/bindings
  → 返回: { items: Binding[], total }

POST /api/platform/channels/bindings
  → 请求: { agent_id, channel_key, ... }
  → 返回: { id, binding_code, status, created_time }
```

#### 5. 用户/IAM（优先级：P1）

```
GET  /api/users/me
  → 返回: { id, username, full_name, email, phone, role, is_active, last_login_time, wallet_balance, teams[] }

PUT  /api/users/me
  → 请求: { full_name?, email?, phone? }
  → 返回: 更新后的 User

PUT  /api/users/me/preference
  → 请求: { preferred_model }
  → 返回: { preferred_model }
```

#### 6. 对话记录（优先级：P2）

```
GET  /api/platform/conversations
  → 返回: { stats, groups: ConversationGroup[], history: Message[] }

GET  /api/platform/conversations/groups
  → 返回: ConversationGroup[] — { room_id, room_name, last_active, msg_count, member_count }

GET  /api/platform/conversations/groups/:room_id/messages
  → 返回: Message[] — { id, sender_name, sender_role, content, created_time }

POST /api/platform/conversations/messages
  → 请求: { agent_id, channel_id, direction, content }
  → 返回: Message
```

#### 7. 记忆存储（优先级：P2）

```
POST /api/platform/memory/store
  → 请求: { agent_id?, key, value, metadata? }
  → 返回: { id, stored: true }

POST /api/platform/memory/search
  → 请求: { query, agent_id?, limit? }
  → 返回: MemoryEntry[]

GET  /api/platform/memory/stats
  → 返回: { total_entries, total_agents }
```

### Mock 数据参考

`mock-server.cjs` 中包含了所有 API 的完整 Mock 实现和示例数据，后端团队可以直接参考其中的数据结构和响应格式。

### 对接步骤建议

1. **Phase 1 — Agent + Billing（核心链路）**
   - 实现 agent CRUD + wallet/records API
   - 前端即可完成"入职 → 管理 → 计费"完整流程

2. **Phase 2 — Models + Channels + IAM**
   - 实现模型管理、渠道配置、用户系统
   - 前端设置页面和通讯中心完全打通

3. **Phase 3 — Conversations + Memory**
   - 实现对话记录和记忆存储
   - 支持 Agent 工作历史回溯和知识积累

### 注意事项

- 所有 API 响应必须包裹在 `{ code: 0, data: ..., message: "success" }` 信封中
- SDK 使用 `/api/platform/xxx` 路径前缀，后端实际路径可以不同，通过网关或 mock-server 做路径映射
- 前端已实现 SDK-first + mock fallback 策略，后端 API 上线后前端无需改动，自动切换到真实数据
- knowledge / gateway / wechat / invoke 已通过 proxy 打通 qeeclaw-server，无需重复实现

## 许可

MIT
