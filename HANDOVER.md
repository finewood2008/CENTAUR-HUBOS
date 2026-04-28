# Hub OS 后端对接手册

当前架构：

```text
Hub OS 前端
  -> @qeeclaw/core-sdk
  -> Vite proxy / VITE_BRIDGE_URL
  -> bridge_server / qeeclaw-server

Hub OS 前端
  -> /api/hubos/*
  -> server/index.cjs
  -> SQLite 产品后端
```

## 已接入链路

| 模块 | 前端入口 | 后端链路 | 说明 |
| --- | --- | --- | --- |
| Agent | `client.agent.*` | QeeClaw bridge | 员工列表、创建、激活 |
| Models | `client.models.invoke()` | QeeClaw bridge | 所有工作台统一走平台模型路由 |
| Billing / API Key | `client.billing.*`, `client.apikey.*` | QeeClaw bridge | 财务中心真实数据 |
| Knowledge | `client.knowledge.*` | QeeClaw bridge | 知识库列表、统计、摄取 |
| Channels | `client.channels.*` | 本地 hermes-bridge only | 渠道配置不回落到云端 |
| Approval | `client.approval.*` | QeeClaw bridge | 驾驶舱审批读写 |
| Workflow | `client.workflow.*` | QeeClaw bridge | 日程来自工作流列表 |
| Audit / HubOS 产品 API | `/api/hubos/audit/*` | `server/index.cjs` | 本地 SQLite 审计数据 |

## 离线行为

- 不再使用 `mock-server.cjs` 作为开发中间层。
- SDK 离线时页面展示空态或明确错误态。
- Builder 草稿和自定义员工只作为本地显示缓存；远程保存失败会触发 toast 提示“本地草稿”状态。
- 附件和语音上传当前未在 SDK 暴露写入接口，驾驶舱会阻断并提示用户，不再伪装为已上传。

## 运行

```bash
npm install
npm run dev
```

真实 bridge 地址可通过环境变量覆盖：

```bash
VITE_BRIDGE_URL=http://127.0.0.1:21747 npm run dev
```

HubOS 产品后端：

```bash
node server/index.cjs
```
