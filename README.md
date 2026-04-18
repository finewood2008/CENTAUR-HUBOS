# Hub OS — 半人马 AI 数字员工操作系统

> 让每一家中小企业都拥有自己的 AI 团队

**[▶ 在线预览 (v0.7.0)](https://finewood2008.github.io/CENTAUR-HUBOS/)**

Hub OS 把大模型 Agent 包装成"数字员工"，让企业老板像管理真实团队一样管理 AI —— 招聘、分配任务、查看工作汇报、控制权限和预算。

## 功能概览

| 模块 | 说明 | 状态 |
|------|------|------|
| 超级工作台 | 三栏 Cockpit — 团队概览 / 待办 / 财务快照 / 通讯状态 / 信息流 | ✅ v0.7 |
| 数字团队 | 5 名数字员工完整档案 + 对话式创建新员工 | ✅ v0.6 |
| 信息流 | 语义化 Feed 卡片 — 按类型/员工筛选 — 审批/警告/汇报/洞察 | ✅ v0.7 |
| 财务中心 | API Key 管理 + 员工用量明细 + 月度预算 | ✅ v0.4 |
| 通讯中心 | 全局渠道监控（企微/飞书/Telegram/钉钉/邮件） | ✅ v0.3 |
| 知识库 | 数字员工的知识来源管理 — 多库 + 权限分配 | ✅ v0.3 |
| 设置 | API 密钥配置 + 偏好设置 | ✅ v0.5 |

## 技术栈

- React 19 + TypeScript + Tailwind CSS v4
- Electron 22（macOS / Windows / Linux）
- Framer Motion + Lucide Icons
- Vite 8 + @qeeclaw/core-sdk

## 架构

```
┌─────────────────────────────────────────────────────┐
│                    Hub OS (前端)                      │
│                                                      │
│  App.tsx ── Cockpit / Team / Finance / Channels ...  │
│       │                                              │
│  useQeeClaw.ts (17 个 hooks)                         │
│       │                                              │
│  qeeclaw.ts (SDK 适配层)                              │
│       │                                              │
│  ┌────┴─────────────────────────────────┐            │
│  │ 真实 SDK (@qeeclaw/core-sdk)         │ ← 本地开发  │
│  │ Stub Client (Proxy-based fallback)   │ ← 线上演示  │
│  └──────────────────────────────────────┘            │
└──────────────────┬──────────────────────────────────┘
                   │ HTTP API
                   ▼
        bridge_server (:21747)
         QeeClaw 后端 SDK
```

## 设计系统

Claude / Anthropic 风格暖色调设计：
- 暖色表面（parchment / ivory）
- 赤陶品牌色（terracotta #c96442）
- 衬线标题 (Georgia) + 无衬线正文
- 毛玻璃卡片 + 大圆角

## 快速开始

```bash
npm install

# 浏览器开发（使用 mock 数据）
npm run dev

# 连接真实 SDK（需要 bridge_server 运行在 :21747）
VITE_BRIDGE_URL=http://127.0.0.1:21747 npm run dev

# Electron 桌面应用
npm run app:dev
```

## 项目结构

```
src/
├── App.tsx                    # 主入口 + 路由
├── types/index.ts             # TypeScript 类型
├── data/
│   ├── mock.ts                # Dashboard/Cockpit mock 数据
│   └── digital-employees.ts   # 数字员工 + 财务 mock 数据
├── components/
│   ├── layout/Sidebar.tsx     # 侧边导航
│   ├── cockpit/               # 超级工作台（三栏布局）
│   ├── dashboard/             # 信息流 Feed
│   ├── team/                  # 数字团队
│   ├── finance/               # 财务中心
│   ├── channels/              # 通讯中心
│   ├── knowledge/             # 知识库
│   ├── settings/              # 设置
│   ├── chat/                  # AI 对话
│   ├── agents/                # Agent 创建/管理
│   └── shared/                # 共享组件
├── hooks/useQeeClaw.ts        # 17 个 SDK hooks
├── services/qeeclaw.ts        # SDK 适配层（双模式）
├── stores/useAppStore.tsx     # Zustand 状态管理
└── gateway/                   # 网关 / 事件总线

.github/workflows/deploy.yml  # GitHub Pages CI/CD
CHANGELOG.md                   # 版本历史
docs/                          # 架构文档
  └── integration/             # 后端对接 PRD
```

## 文档

- [CHANGELOG.md](./CHANGELOG.md) — 版本历史 (v0.1 ~ v0.7)
- [AI_HANDOVER.md](./AI_HANDOVER.md) — **AI 开发者交接文档**（项目状态 + 前后端对接契约）
- [docs/integration/](./docs/integration/) — 后端对接 PRD

## 许可

MIT
