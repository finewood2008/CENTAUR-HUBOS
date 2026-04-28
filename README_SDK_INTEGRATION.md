# qeeshu-hubos SDK 集成说明

> 最后更新：2026-04-28

## 概述

qeeshu-hubos（CENTAUR-HUBOS）是一个基于 React 19 + Electron 22 的 AI 数字员工操作系统桌面应用。当前实现直接使用 `@qeeclaw/core-sdk` 连接本地 bridge_server，并使用 `/api/hubos/*` 产品后端承载本地审计、审批和组织数据。

## 架构变更

```
qeeshu-hubos (前端)
    ↓ 开发模式：相对路径 → Vite proxy
    ↓ 生产模式：http://127.0.0.1:21747
bridge_server.py (真实后端，145+ 端点)

qeeshu-hubos (前端)
    ↓ /api/hubos/*
server/index.cjs (HubOS 产品后端，SQLite)
```

## 主要改动

### 1. Vite 配置 ([vite.config.ts](vite.config.ts))

添加了 proxy 配置，开发模式下自动转发所有 API 请求到 bridge_server：

```typescript
server: {
  proxy: {
    '/api': { target: 'http://127.0.0.1:21747', changeOrigin: true },
    '/invoke': { target: 'http://127.0.0.1:21747', changeOrigin: true },
    '/agents': { target: 'http://127.0.0.1:21747', changeOrigin: true },
    // ... 其他路径
  },
}
```

### 2. SDK 客户端配置 ([src/services/qeeclaw.ts](src/services/qeeclaw.ts))

- **开发模式**：使用相对路径 `''`，走 Vite proxy
- **生产模式**：直接连接 `http://127.0.0.1:21747`
- 新增所有 17 个模块的便捷访问器：
  - `getAgentModule()` / `getBillingModule()` / `getModelsModule()`
  - `getChannelsModule()` / `getKnowledgeModule()` / `getMemoryModule()`
  - `getConversationsModule()` / `getIamModule()` / `getDevicesModule()`
  - `getWorkflowModule()` / `getAuditModule()` / `getApprovalModule()`
  - `getApiKeyModule()` / `getTenantModule()` / `getPolicyModule()`
  - `getFileModule()` / `getVoiceModule()`

### 3. 数据加载 Hooks ([src/hooks/useQeeClaw.ts](src/hooks/useQeeClaw.ts))

新增 8 个 SDK hooks，覆盖所有功能模块：

| Hook | 模块 | 用途 |
|------|------|------|
| `useConnection()` | billing | 连接检查 |
| `useDashboardData()` | agent, billing, models | 仪表盘数据 |
| `useChannelsData()` | channels | 渠道管理 |
| `useKnowledgeData()` | knowledge | 知识库 |
| `useDevicesData()` | devices | 设备管理 |
| `useAuditData()` | audit | 审计日志 |
| `useApprovalData()` | approval | 审批流 |
| `useApiKeyData()` | apikey | API Key 管理 |
| `useWorkflowData()` | workflow | 工作流 |
| `useTenantContext()` | tenant | 租户上下文 |
| `useConversationsData()` | conversations | 会话中心 |

### 4. 环境变量 ([.env.example](.env.example))

```bash
# 生产模式下的 bridge_server 地址
VITE_BRIDGE_URL=http://127.0.0.1:21747
```

## SDK 模块覆盖

qeeshu-hubos 现已集成 core-sdk 全部 17 个模块：

| 模块 | 端点数 | 集成状态 |
|------|--------|---------|
| agent | 11 | ✅ 已集成 |
| models | 9 | ✅ 已集成 |
| billing | 3 | ✅ 已集成 |
| channels | 14 | ✅ 已集成 |
| knowledge | 8 | ✅ 已集成 |
| memory | 5 | ✅ 已集成 |
| conversations | 6 | ✅ 已集成 |
| iam | 5 | ✅ 已集成 |
| tenant | 4 | ✅ 已集成 |
| devices | 8 | ✅ 已集成 |
| workflow | 5 | ✅ 已集成 |
| approval | 4 | ✅ 已集成 |
| audit | 3 | ✅ 已集成 |
| apikey | 10 | ✅ 已集成 |
| policy | 3 | ✅ 已集成 |
| file | 3 | ✅ 已集成 |
| voice | 3 | ⬜ Stub (501) |

**总计：17/17 模块，145+ 端点**

## 启动方式

### 1. 启动 bridge_server

```bash
cd qeeclaw-sdk/packages/hermes-bridge
python bridge_server.py
```

bridge_server 将在 `http://127.0.0.1:21747` 启动。

### 2. 启动前端开发服务器

```bash
cd qeeshu-hubos
npm install  # 首次运行
npm run dev
```

前端将在 `http://localhost:5173` 启动，所有 API 请求自动代理到 bridge_server。

### 3. 启动 Electron 桌面应用（可选）

```bash
npm run app:dev
```

同时启动 Vite dev server 和 Electron 窗口。

## 验证 SDK 连接

1. 打开浏览器访问 `http://localhost:5173/CENTAUR-HUBOS/`
2. 查看页面顶部状态栏：
   - ✅ **绿色**："已连接" → bridge_server 正常
   - ⚠️ **黄色**："离线" → bridge_server 未启动或连接失败，页面展示空态或本地草稿状态
3. 打开浏览器控制台，查看 `[QeeClaw SDK]` 日志

## 移除的旧链路

- ❌ `mock-server.cjs` — 不再需要中间层，前端直接连接 bridge_server

## 下一步工作

1. **测试所有页面**：Dashboard / Team / Finance / Channels / Knowledge / Settings
2. **补充 UI 组件**：将 devices/audit/approval/workflow 的更多字段接入对应页面
3. **错误处理**：继续完善 SDK 调用失败时的重试、回滚和用户提示
4. **生产构建**：测试 `npm run build` 后的 Electron 打包

## 技术栈

- **前端框架**：React 19 + TypeScript 6
- **构建工具**：Vite 8
- **样式**：Tailwind CSS v4
- **动画**：Framer Motion 12
- **桌面壳**：Electron 22
- **SDK**：@qeeclaw/core-sdk (本地 file 引用)

## 相关文档

- [QeeClaw Bridge Server API 参考手册](../qeeclaw-sdk/docs/QeeClaw_Bridge_Server_API参考手册.md)
- [QeeClaw 客户接入手册](../qeeclaw-sdk/docs/QeeClaw_客户接入手册.md)
- [hermes-bridge README](../qeeclaw-sdk/packages/hermes-bridge/README.md)
