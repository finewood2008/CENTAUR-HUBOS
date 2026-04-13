# Event Bus 任务总线规范 (EVENT_BUS_PRD)

## 背景
多个数字员工的协同，不能依赖群聊文本互殴。必须采用底层的发布-订阅（Pub/Sub）机制。

## 规范设计
当 Agent A 完成前置任务，需要交接给 Agent B 时，调用内部 Tool，发送标准事件：
```json
{
  "event_type": "EMPLOYEE_ONBOARDED",
  "payload": {
    "name": "张三",
    "department": "技术部",
    "highlights": ["10年架构经验", "开源社区贡献者"]
  },
  "target_agent": "agent_pr_01"
}
```
Hub 底层的 EventBus 会将此 Payload 注入到 `agent_pr_01` 的上下文中，并触发工作流。
