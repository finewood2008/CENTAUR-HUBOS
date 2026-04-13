# 本地网关与 API 对接规范 (API_GATEWAY_PRD)

## 核心原则
所有外部系统（企微、OA、大屏硬件）**严禁**直接调用大模型厂商的 API，也严禁直接操作 QeeClaw 底层。
必须通过 HTTP 调用 Centaur Hub 暴露的本地局域网接口。

## 鉴权方式 (Agent_Key)
在 Hub 控制台生成数字员工时，会分配唯一的 `Agent_Key`。
外部调用必须在 Header 中携带此 Key：
`x-agent-key: ak_xxxxxxxxxxxxxxx`

## 核心接口
`POST http://<hub-local-ip>:3000/api/v1/chat/completions`
网关会根据 `x-agent-key` 自动路由到对应的 Agent 沙盒，并进行算力配额检查。如果配额耗尽，将返回 `402 Payment Required`。
