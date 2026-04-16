# Changelog

## [0.4.0] - 2026-04-17

### 🏢 数字团队 & 财务中心 — 员工板块全面升级

本次版本将原有的 agents 板块重构为全新的"数字团队"系统，新增财务中心，建立完整的数字员工管理体验。

#### 新增：数字团队页 (Team)
- **5 名数字员工完整档案**：火花(CMO)、小可(获客)、书熙(法务)、税宝(财税)、绿安(安全)
- **员工卡片网格**：头像 + 渐变色 + 状态徽章 + 能力标签 + 实时统计
- **详情面板**：点击卡片展开完整档案，含自我介绍、核心能力、模型信息、技能清单、工具集、记忆系统、工作台配置
- **状态系统**：在岗(active) / 激活中(activating) / 待入职(inactive) 三态
- **激活入口**：待入职员工可触发激活流程（Coming Soon 标识）
- **framer-motion 动画**：卡片错位渐入 + 详情面板滑入 + 状态切换

#### 新增：财务中心 (Finance)
- **三卡概览**：账户余额 / 本月消费(带进度条) / 月度预算
- **API Key 管理**：密钥列表 + 脱敏显示/切换 + 绑定员工 + 状态徽章 + 额度进度条
- **员工用量明细**：每位员工月度 Token 和费用 + 7 天柱状图(CSS 动画 + hover tooltip)

#### 重构：导航系统
- Sidebar: `agents` → `team`(团队)，新增 `finance`(财务) 入口
- NavTab 类型扩展：`'dashboard' | 'team' | 'channels' | 'knowledge' | 'finance' | 'settings'`
- App.tsx: 移除旧 AgentManagement，接入 Team + Finance 组件

#### 类型系统扩展 (types/index.ts)
- `DigitalEmployee`: 完整员工档案类型（18 个字段）
- `DigitalEmployeeId`: 5 个员工 ID 联合类型
- `ActivationStatus / ActivationState / ActivationStep`: 激活流程类型
- `ApiKey / EmployeeUsage / FinanceOverview`: 财务管理类型
- `WorkspaceConfig / OnboardingPreference`: 工作台与入职配置

#### 数据层 (data/digital-employees.ts)
- `DIGITAL_EMPLOYEES`: 5 名员工完整 mock 数据
- `FINANCE_DATA`: 财务概览 + 3 把 API Key + 2 名员工用量明细

## [0.3.0] - 2025-04-17

### 🎨 Claude / Anthropic 设计系统全面改造

本次大版本将 Hub OS 的视觉风格从原有的科技蓝主题，彻底迁移到 Claude / Anthropic 风格的暖色调设计系统。目标是打造一个温暖、专业、有人情味的 AI 管理界面。

#### 设计理念

参考 Anthropic 官网和 Claude 产品界面的设计语言：
- **色调**：从冷色科技感 → 暖色人文感，用羊皮纸色 (#f5f4ed) 替代纯白/灰底
- **排版**：标题用衬线体 Georgia，正文用系统无衬线体，形成视觉层次
- **卡片**：毛玻璃 (frosted glass) 质感 + 大圆角 (16px)，悬浮时微微上浮
- **交互**：赤陶色 (terracotta) 作为品牌强调色，取代蓝色

#### 色彩系统 — 30+ 语义化 Token

| 分类 | Token | 色值 | 用途 |
|------|-------|------|------|
| 表面 | `parchment` | #f5f4ed | 主背景 |
| 表面 | `ivory` | #faf9f5 | 卡片/内容背景 |
| 表面 | `warm-sand` | #e8e6dc | 次级表面/按钮 |
| 表面 | `dark-surface` | #30302e | 侧边栏/深色区域 |
| 品牌 | `terracotta` | #c96442 | 主强调色/CTA |
| 品牌 | `coral` | #d97757 | hover/渐变 |
| 文字 | `near-black` | #141413 | 标题/主文字 |
| 文字 | `olive-gray` | #5e5d59 | 正文 |
| 文字 | `stone-gray` | #87867f | 说明/辅助文字 |
| 语义 | `sage-green` | #5a8a5e | 成功/在线 |
| 语义 | `teal` | #4a7c94 | 信息/已配置 |
| 语义 | `amber` | #b48c3c | 警告/中风险 |
| 语义 | `purple` | #8c64a0 | 特殊/存储 |

完整 token 列表见 `src/index.css` 的 `@theme inline` 块。

#### 字体系统

```
标题: Georgia, 'Noto Serif SC', serif     → font-serif
正文: system-ui, -apple-system, sans-serif → font-sans  
代码: 'SF Mono', 'Fira Code', monospace   → font-mono
```

排版类：`heading-display` / `heading-section` / `heading-card` / `text-body` / `text-caption` / `text-label` / `text-overline`

#### 卡片系统

- `card-glass` — 基础毛玻璃卡片（暖色半透明 + 模糊 + 内发光）
- `card-glass-success` — 绿色调（成功/健康状态）
- `card-glass-warm` — 赤陶色调（品牌/强调）
- `card-glass-blue` — 蓝色调（信息/数据）
- `card-glass-alert` — 红色调（告警/异常）

#### 按钮库

- `btn-terracotta` — 主 CTA（赤陶底 + 大圆角）
- `btn-sand` — 次级（暖砂底 + 环形阴影）
- `btn-dark` — 深色（深灰底）
- `btn-ghost` — 幽灵（透明底 + hover 浮现）

#### 组件级改动

| 组件 | 改动内容 |
|------|----------|
| `Sidebar.tsx` | 深色 (#141413) 背景 + 赤陶活跃态 + serif 品牌名 |
| `Dashboard.tsx` | 全部色彩 token 化，动态卡片用 card-glass 变体 |
| `AgentManagement.tsx` | 员工市场/花名册/面谈 统一暖色调 |
| `AgentBuilder.tsx` | 对话区赤陶消息气泡 + 暖色输入框 |
| `Channels.tsx` | 状态 badge 全部用 Tailwind 类（去掉 inline style），StatCard 改用 colorClass |
| `Knowledge.tsx` | 统计图标用 teal/sage-green/purple 语义色 |
| `Roster.tsx` | 花名册卡片 card-glass 化 |
| `Settings.tsx` | 表单和开关统一暖色交互 |
| `ChatArea.tsx` | 消息气泡赤陶渐变 + serif 标题 |

#### 代码质量

- **零硬编码 hex**：所有组件中的 Tailwind 颜色类全部使用 token（`text-terracotta` 而非 `text-[#c96442]`）
- **零 inline style 颜色**：Channels.tsx / Knowledge.tsx 中的动态颜色全部改为 Tailwind 类名拼接
- **hover 统一**：表格行 hover 从 `onMouseEnter/Leave + style` 改为 `hover:bg-parchment-hover`
- **CSS 变量体系**：阴影、圆角、行高全部用 CSS 自定义属性

---

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
