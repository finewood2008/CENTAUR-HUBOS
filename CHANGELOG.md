# Changelog

## [0.2.0] - 2025-04-15

### 新增
- **员工入职流程** — 员工市场模板一键入职，调用 SDK `agent.create` 创建真实 Agent，带确认弹窗和成功/失败反馈
- **设置页面** — 用户信息编辑、模型偏好选择、后端连接状态检测，localStorage 持久化
- **Electron 沉浸式标题栏** — `hiddenInset` 模式，macOS 红绿灯融入 Sidebar，深色主题统一

### 改进
- Sidebar 底部新增设置入口，NavTab 扩展 settings 路由
- Sidebar 设为 drag 区域，按钮 no-drag，桌面端拖拽体验优化

### 架构
- 引入 `mock-server.cjs` — Proxy + Mock 混合控制面服务器
  - Mock 层：agent / billing / models / channels（前端开发自给自足）
  - Proxy 层：knowledge / gateway / wechat / invoke（透传到 qeeclaw-server :21747）
- SDK 路径转译：前端用 `/api/platform/xxx`，后端用 `/xxx`，mock-server 自动桥接

## [0.1.0] - 2025-04-14

### 初始版本
- 组件化架构（Dashboard / Agents / Channels / Knowledge）
- Dashboard 公司早报（指标卡 + 员工汇报 + 趋势图 + 告警）
- 员工市场（App Store 风格模板浏览）
- 花名册 + 员工档案卡（通讯渠道一对一绑定）
- 架构师面谈（对话式 Agent Builder）
- 通讯中心只读监控大盘
- 知识库框架
- QeeClaw SDK 集成（`useQeeClaw` hooks，SDK-first + mock fallback）
