# Changelog

## [0.12.0] - 2026-04-22

### 🏢 像素风虚拟办公室 — pixel-agents 引擎移植 + 全套美术素材

#### 新增：像素风虚拟办公室重构
- 移植 pixel-agents (6.9k⭐ MIT) Canvas 2D 引擎，纯原生 Canvas 渲染
- 去除 Phaser 依赖（-2MB），性能更优、包体更小
- A*寻路、角色状态机、深度排序、家具碰撞检测

#### 新增：全套像素美术素材
- 6 个角色精灵（sprite sheets）
- 25+ 家具贴图
- 9 种地板纹理
- 墙壁贴图素材
- 所有素材存放于 `public/assets/`（characters, furniture, floors, walls）

#### 新增：自定义办公室布局（hubosLayout.ts）
- 主管独立办公室 + 5 员工工位区 + 休息区
- 主管固定在独立办公室，始终保持工作状态
- 支持自定义布局编辑

#### 新增：资产加载器（assetLoader.ts）
- 自动从 `public/assets/` 扫描并加载 PNG 资源
- 统一的资产管理和缓存机制

#### 技术架构
- 新增目录 `src/components/office/`（engine/, sprites/, layout/, editor/, components/）
- 核心组件：`VirtualOffice.tsx`（办公室主视图）
- 引擎来源：pixel-agents (MIT 协议) — 纯 Canvas 2D，无第三方游戏框架依赖

---

## [0.11.0] - 2026-04-22

### 🧠 主管角色系统 + 记忆中心三视图 + 团队感UI强化

#### 新增：主管（Leader）角色 — 团队核心中枢
- `src/data/digital-employees.ts`：新增 leader 数字员工档案（COO · 首席运营官），含完整技能标签和业绩指标
- `src/data/persona-defaults.ts`：新增 leader 灵魂定义（SOUL），3000字符记忆上限（高于普通员工2200）
- `src/data/partner.ts`：ALL_EMPLOYEES 新增 leader 条目，团队成员添加列表自动排除主管
- 主管定位：不是普通团队成员，是老板的右臂、团队的大脑，统管所有数字员工

#### 新增：记忆中心 — 三视图可视化（Memory Center）
- `src/components/memory/MemoryCenter.tsx`：主页面，3-tab 切换（总览/时间线/图谱）
- `src/components/memory/DashboardView.tsx`：总览仪表盘 — 统计卡片 + 共享认知 + 员工认知卡片
  - 主管卡片置顶C位，独占一行，紫色边框 + ☆团队领导徽章
  - 普通员工卡片横排展示
- `src/components/memory/TimelineView.tsx`：时间线视图 — 按日期分组、操作类型筛选、员工筛选
- `src/components/memory/GraphView.tsx`：认知图谱 — react-force-graph-2d 力导向图
  - 中心节点为主管（非老板），主管连接所有员工和老板
  - 节点颜色对应员工品牌色
- 导航栏新增"记忆"入口（Brain图标），位于通讯与知识库之间
- NavTab 类型扩展：新增 'memory'

#### 新增：PersonaStore 升级 — OpenClaw 标准对齐
- `src/stores/personaStore.ts`：完全重写，对齐 OpenClaw 标准
  - 双轨记忆：`target: 'memory' | 'user'`（agent笔记 vs 用户画像）
  - § 分隔符序列化，2200/1375 字符限制
  - 新增 getStats / getTimeline / getGraphData 方法
  - confidence 和 relatedTo 字段支持
  - localStorage 持久化（key: hubos-persona-store）
- 新增依赖：`react-force-graph-2d`、`date-fns`

#### 改进：员工页面 — 主管置顶特殊化
- `src/components/team/Team.tsx`：主管从员工列表抽出，置顶单独一行展示
  - 紫色左边框 + ☆团队领导徽章 + 全宽大卡片
  - 无"进入工作台"按钮（主管通过首页对话交互）
  - 与普通员工网格布局形成明确层级区分

#### 改进：首页 TeamHeader — 团队感强化
- 主管头像放大（w-14 h-14）+ 紫色光晕（ring-3 ring-indigo-300/40）
- 皇冠徽章改为紫色调（bg-indigo-500）
- 新增"COO · 统管团队"角色标签
- 团队成员区域新增"团队在线 N人"标签
- 成员头像群外围加 bg-warm-sand/20 背景框，增强团队归属感
- 添加按钮移至 overflow 容器外，弹窗向下右对齐展开，不再被遮挡
- 添加列表自动排除主管（主管不是可添加的团队成员）

#### 删除：设置页"系统记忆"板块
- `src/components/settings/Settings.tsx`：移除 SystemMemory 引用和渲染
- 记忆功能已独立为记忆中心页面，不再重复出现在设置中

#### 技术改进
- `src/services/qeeclaw.ts`：Vite 8 动态 import 加 `/* @vite-ignore */` 修复分析错误
- `vite.config.ts`：optimizeDeps.exclude 排除 @qeeclaw 包

---

## [0.10.0] - 2026-04-20

### 🧩 完整数字员工配置页 — 7 模块二栏配置面板

#### 新增：EmployeeConfigPanel — 二栏配置页取代 DetailPanel
- **左侧 Tab 导航 + 右侧内容区**的二栏布局，取代原有 DetailPanel 单页滚动
- **7 个配置模块**：概览 / 模型 / Harness / 技能Skills / 知识库RAG / 个人记忆 / 工作台
- 组件路径: `src/components/team/EmployeeConfigPanel.tsx` + `src/components/team/tabs/Tab*.tsx`

#### 新增：员工 Harness 配置数据
- `src/data/employee-harness.ts`：5 名员工各自定制的 Harness 配置
- 包含 agent-loop / context-map / memory-protocol / standards / security 五大维度
- 每位员工独立的 agent 循环策略、上下文窗口、记忆协议、合规标准、安全策略

#### 新增：员工技能映射数据
- `src/data/employee-skills.ts`：5 名员工从 clawhub.ai 映射的技能库
- 每个技能包含启用/禁用状态 + 调用统计（总次数/成功率/平均耗时）
- 技能分类：内容创作、社媒运营、获客转化、法务合规、财税管理、安全审计等

#### 新增：useEmployeeConfig Hook
- `src/hooks/useEmployeeConfig.ts`：SDK/mock 双模式数据接口
- 自动检测 SDK 连接状态，无 SDK 时降级到 mock 数据
- 提供 harness/skills/knowledge/memory 等配置的统一访问接口

#### 交互逻辑
- **火花/小可**（status=active）：全部 7 个模块可交互编辑
- **书熙/税宝/绿安**（status=inactive）：所有模块只读预览，带锁定提示
- 小可工作台 Tab 已接通 `XiaokeWorkspace` 入口

#### Bug Fix
- 补充 `zustand` 依赖到 package.json（小可记忆模块 store 依赖）

#### 相关 Commits
- `d943de0` fix: add zustand dependency for xiaoke memory store
- `729d0ef` feat(team): 完整数字员工配置页 — 7模块(概览/模型/Harness/技能/RAG/记忆/工作台)

---

## [0.9.0] - 2026-04-19

### 🔥 火花工作台端到端跑通 + Harness 引擎关键 Bug 修复

#### Bug Fix：Context 注入垃圾数据导致 Write Step 失效
- **根因**：`HarnessRunner.confirmCard()` 存储的是 `mapXXX()` 解析后的卡片数据对象，而非原始 AI 响应
- **影响**：后续 AI 步骤（write step）收到的上下文是被解析后的对象，而非 `outline` JSON + 说明文字
- **修复**：
  - `useHarnessChat.ts`：新增 `rawTextByStep` 追踪每个 step 的原始 AI 文本
  - Context 注入逻辑：跳过 `confirm-*` keys，优先使用原始 AI 文本中的 JSON
  - `onCardRender` 回调：同时存储原始 AI 文本供后续 context 使用

#### UX 优化：小红书流程更顺畅
- `SPARK_WRITE_XIAOHONGSHU`：`understand` 步骤 `waitForUser: false`，跳过追问直接推进到 write
- Write step prompt：明确要求"直接输出笔记内容，不要加引导语/署名"
- `mapSocialPostData`：`---` 分隔符处理，去除 AI 引导语前缀

#### SocialPostCard 健壮性
- 正则修正：`/^#[\u4e00-\u9fa5a-zA-Z0-9_]+/g` 确保匹配行首 hashtag
- 空行裁剪：hashtag 提取后正确裁剪末尾空行

### 🎯 端到端验证通过
- 火花工作台 → "写小红书笔记"快捷按钮 → AI 理解需求 → 用户回复 → 流式生成完整文章 → SocialPostCard 渲染 ✅
- 全流程通过 CF Worker 代理 Gemini 2.5 Flash API ✅

## [0.8.0] - 2026-04-18

### 🏗️ Builder V2 三栏构建工作台 + 团队页精简

#### 新增：EmployeeBuilder V2 — 三栏构建工作台
- **左栏 Chat**：自然语言对话驱动构建流程，接入 Gemini 2.5 Flash 模型
- **中栏 Canvas**：可视化三层架构画布（身份层 / 能力层 / 工作流层），节点随对话实时变色
- **右栏 Detail**：点击画布节点展开详情编辑面板，支持逐项修改
- **底栏层级导航**：三层切换指示器 + 整体进度条
- 组件路径: `src/components/builder/`（EmployeeBuilderV2 / BuilderChat / BuilderCanvas / NodeDetailPanel）

#### 修复：Team.tsx Builder 入口统一
- Team.tsx 内部原引用旧版 `EmployeeBuilder`，现统一切换到 `EmployeeBuilderV2`
- App.tsx 和 Team.tsx 两个入口均指向 V2

#### 优化：团队页卡片精简
- 移除 SDK 额外 agent 自动追加逻辑
- 团队页现在只展示 `digital-employees.ts` 预设的 5 名核心员工（火花/小可/书熙/税宝/绿安）+ 用户通过 Builder 自建的员工
- SDK 中的临时 agent（如 Linda/Helen/老张）不再污染团队卡片列表

## [0.7.0] - 2026-04-18

### 🚀 超级工作台 + GitHub Pages 全面上线

#### 新增：超级工作台 (Cockpit) — 三栏布局
- **左侧信息面板**：团队概览(2/4 工作中)、待办事项(红色角标)、财务快照(余额/消耗/预算进度条)、通讯状态(4/5 在线+离线警告)、知识库动态、快捷指令
- **右侧信息流 (FeedStream)**：7 条 Feed 卡片，支持按类型筛选(全部/待审批/警告/已完成/汇报/洞察) + 按员工筛选
- **交互联动**：审批通过/驳回 Toast 反馈、团队详情面板点击展开、通讯离线警告提示、知识库快捷跳转
- **自定义面板**：拖拽排序 + 删除/恢复 + 尺寸分类
- **语义化卡片**：信息流按类型使用不同卡片样式(待审批=橙色、警告=红色、已完成=绿色等)

#### 修复：GitHub Pages 部署
- `@qeeclaw/core-sdk` 未发布到 npm，浏览器 bare specifier 报错白屏
- 改为双模式架构：`new Function('return import(...)')` 隐藏动态 import，骗过 Vite 静态分析
- 本地开发用真实 SDK，GitHub Pages 自动降级为 Proxy stub
- 页面顶部显示 "SDK 离线 · 使用演示数据" 提示条
- 切换为 `actions/upload-pages-artifact` + `actions/deploy-pages` 官方 Action

#### 技术改进
- SDK 适配层重写 (`src/services/qeeclaw.ts`)：类型安全的 stub client + 动态加载真实 SDK
- 所有 17 个 SDK 模块导出便捷访问器
- 移除 `rollupOptions.external`，构建完全自包含

## [0.6.0] - 2026-04-18

### 🧑‍💼 自定义数字员工创建

#### 新增：Team 页面接入 EmployeeBuilder
- 头部新增「添加员工」按钮，网格末尾新增虚线「+」卡片入口
- 点击进入对话式 5 步创建流程（选角色→取名→英文名→定位→性格）
- 5 个预设角色模板：品牌设计师 / 数据分析师 / 客户经理 / 内容运营 / 财务助理
- 创建完成后播放 5 步生成动画（GenerationAnimation）
- 支持试聊（TrialChat）确认满意后加入团队
- 新员工默认 inactive 状态，可走正常激活流程

#### 技术细节
- customEmployees 运行时状态管理（useState），不修改预设数据
- EmployeeBuilder → GenerationAnimation → TrialChat 完整流转
- 预设 5 名员工数据保持不变

## [0.5.0] - 2026-04-17

### 🧹 全站精简 & GitHub Pages 部署

#### 重写：设置页 (Settings)
- 重新设计为简洁的 API Key + 偏好设置页
- 支持 Anthropic / OpenAI / Google AI / DeepSeek 四平台密钥管理
- 每个平台附带"获取 Key"直达链接
- 偏好设置：界面语言 / 任务通知 / 自动保存
- 保存即时反馈 toast

#### 精简：全站内容
- Dashboard 标题"控制台"改为"信息流"
- Sidebar 标签"控制台"改为"信息流"
- 移除多余的 filter / action 按钮
- 修复 framer-motion ease 类型错误（string → cubic-bezier 数组）

#### 新增：文档拆分
- README 重写为简洁的项目介绍 + 在线预览链接
- 后端对接技术规范独立到 HANDOVER.md（含完整 API 路径和数据格式）

#### 新增：GitHub Pages 自动部署
- 添加 `.github/workflows/deploy.yml`
- push main 自动构建并部署到 https://finewood2008.github.io/CENTAUR-HUBOS/

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
