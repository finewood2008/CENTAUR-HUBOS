# Hub OS 后端对接手册

> 本文档包含前后端对接的完整技术规范。供后端团队和 AI Agent 参考。

## 当前架构

```
[Hub OS 前端] → @qeeclaw/core-sdk → [mock-server.cjs :3456]
                                          ├── Mock 响应（agent/billing/models/channels/iam/conversations/memory）
                                          └── Proxy → [qeeclaw-server :21747]（knowledge/gateway/wechat/invoke）
```

## 目标架构

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

## SDK 对接状态

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

## 需要后端实现的 API

以下是 SDK 期望的 API 路径和数据格式。所有响应需包裹在 `{ code: 0, data: ..., message: "success" }` 信封中。

### 1. Agent 管理（优先级：P0）

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

### 2. 计费系统（优先级：P0）

```
GET  /api/billing/wallet
  → 返回: { balance, currency, total_spent, total_recharge, current_month_spent, updated_time }

GET  /api/billing/records?page=1&page_size=20
  → 返回: { total, page, page_size, items: BillingRecord[] }
  → BillingRecord: { id, product_name, record_type, text_input_length, text_output_length, unit_price, output_unit_price, amount, currency, remark, balance_snapshot, created_time }

GET  /api/billing/summary
  → 返回: { total_spent, total_recharge }
```

### 3. 模型管理（优先级：P1）

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

### 4. 渠道管理（优先级：P1）

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

### 5. 用户/IAM（优先级：P1）

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

### 6. 对话记录（优先级：P2）

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

### 7. 记忆存储（优先级：P2）

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

## Mock 数据参考

`mock-server.cjs` 中包含了所有 API 的完整 Mock 实现和示例数据，后端团队可以直接参考其中的数据结构和响应格式。

## 对接步骤建议

1. **Phase 1 — Agent + Billing（核心链路）**
   - 实现 agent CRUD + wallet/records API
   - 前端即可完成"入职 → 管理 → 计费"完整流程

2. **Phase 2 — Models + Channels + IAM**
   - 实现模型管理、渠道配置、用户系统
   - 前端设置页面和通讯中心完全打通

3. **Phase 3 — Conversations + Memory**
   - 实现对话记录和记忆存储
   - 支持 Agent 工作历史回溯和知识积累

## 注意事项

- 所有 API 响应必须包裹在 `{ code: 0, data: ..., message: "success" }` 信封中
- SDK 使用 `/api/platform/xxx` 路径前缀，后端实际路径可以不同，通过网关或 mock-server 做路径映射
- 前端已实现 SDK-first + mock fallback 策略，后端 API 上线后前端无需改动，自动切换到真实数据
- knowledge / gateway / wechat / invoke 已通过 proxy 打通 qeeclaw-server，无需重复实现
