# 部门协同与集成对接板块 (Integration Board)

这里是 Centaur Hub OS 的跨部门技术对接区。为了实现软硬一体、公私分明的新架构，各团队请在此查阅对应的集成规范。

## 对接文档目录

1. **[本地网关与 API 对接规范 (API_GATEWAY_PRD.md)](./API_GATEWAY_PRD.md)**
   *   **面向对象**：内部 OA 团队、前端研发、企微/钉钉小程序开发团队。
   *   **内容**：说明如何获取 `Agent_Key`，以及如何通过 Hub 的本地 HTTP 接口呼叫特定的数字员工。
2. **[云端算力结算系统对接 (CLOUD_BILLING_PRD.md)](./CLOUD_BILLING_PRD.md)**
   *   **面向对象**：后端商业化团队、云端平台研发。
   *   **内容**：说明硬件 `Device_Key` 的发牌机制，以及 Gateway 如何拦截 Token 并计费。
3. **[Event Bus 任务总线规范 (EVENT_BUS_PRD.md)](./EVENT_BUS_PRD.md)**
   *   **面向对象**：AI 算法团队、Prompt 工程师。
   *   **内容**：说明不同数字员工（如 HR 与 PR）之间如何通过底层的结构化 JSON 事件进行任务交接。
