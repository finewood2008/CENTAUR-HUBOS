# Hub OS — 半人马 AI 数字员工操作系统

> 让每一家中小企业都拥有自己的 AI 团队

**[▶ 在线预览 (v0.12.1)](https://finewood2008.github.io/CENTAUR-HUBOS/)**

Hub OS 把大模型 Agent 包装成"数字员工"，让企业老板像管理真实团队一样管理 AI —— 招聘、分配任务、查看工作汇报、控制权限和预算。

## 功能概览

| 模块 | 说明 | 状态 |
|------|------|------|
| 超级工作台 | 三栏 Cockpit — 左面板(审批/定时任务/快捷指令) + 中PartnerChat(C位) + 右数据面板 | ✅ v0.11 |
| 数字团队 | 6 名数字员工(含主管) + Builder V2 + 二栏配置面板(8 Tab) | ✅ v0.11 |
| 记忆中心 | 三视图(总览仪表盘/时间线/认知图谱) — 主管C位，图谱中心节点 | ✅ v0.11 |
| 虚拟办公室 | 像素风办公室 — pixel-agents Canvas 2D 引擎，6 角色 + 25+ 家具 + 互动系统 | ✅ v0.12.1 |
| 人格 & 记忆 | 员工人格SOUL + 双轨记忆(memory/user) + PromptAssembler 提示词组装 | ✅ v0.11 |
| 信息流 | 语义化 Feed 卡片 — 按类型/员工筛选 — 审批/警告/汇报/洞察 | ✅ v0.7 |
| 财务中心 | API Key 管理 + 员工用量明细 + 月度预算 | ✅ v0.4 |
| 通讯中心 | 全局渠道监控（企微/飞书/Telegram/钉钉/邮件） | ✅ v0.3 |
| 知识库 | 数字员工的知识来源管理 — 多库 + 权限分配 | ✅ v0.3 |
| 设置 | 设备信息/云端连接/企业信息/员工策略/通知/安全/外观 | ✅ v0.11 |

## 技术栈

- React 19 + TypeScript + Tailwind CSS v4
- Zustand v5（状态管理 + localStorage 持久化）
- Electron 22（macOS / Windows / Linux 桌面应用）
- pixel-agents Canvas 2D 引擎（虚拟办公室，MIT 协议）
- react-force-graph-2d + date-fns（记忆中心认知图谱）
- Framer Motion + Lucide Icons
- Vite 8 + @qeeclaw/core-sdk

## 架构

```
┌──────────────────────────────────────────────────────────┐
│                     Hub OS (前端)                          │
│                                                           │
│  App.tsx ─── Cockpit / Team / Memory / Office / ...      │
│       │                                                   │
│  useQeeClaw.ts (17 个 hooks)                              │
│       │                                                   │
│  qeeclaw.ts (SDK 适配层)     personaStore.ts (记忆/人格)   │
│       │                                                   │
│  ┌────┴─────────────────────────────────────────┐         │
│  │ 真实 SDK (@qeeclaw/core-sdk)                 │ ← 本地   │
│  │ Stub Client (Proxy-based fallback)           │ ← 线上   │
│  └──────────────────────────────────────────────┘         │
└──────────────────┬───────────────────────────────────────┘
                   │ HTTP API
                   ▼
         bridge_server (:21747)
          QeeClaw 后端 SDK
```

## 核心模块

### 主管（Leader）系统
老板只和主管(合伙人)对话，主管负责调度团队中的其他数字员工。
- 首页 PartnerChat 即与主管对话
- 主管在团队中置顶，带 ☆ 徽章和紫色光晕
- 记忆中心以主管为图谱中心节点

### 人格 & 记忆系统
基于 OpenClaw 标准的双轨人格记忆：
- `SOUL`：员工人格定义（可直接编辑）
- `memory`：工作知识（环境、工具、经验）
- `user`：用户画像（偏好、习惯、纠正记录）
- 记忆上限：员工 2200 字符 / 主管 3000 字符 / 用户共享 1375 字符
- `§` 分隔符标准，每次对话自动触发记忆写入（3问过滤器）

### 虚拟办公室
移植 [pixel-agents](https://github.com/nicholasgriffintn/pixel-agents) (6.9k⭐ MIT) Canvas 2D 引擎：
- 6 个像素角色精灵（16×32 帧，7帧×3方向 spritesheet）
- 25+ 家具资产（支持多层嵌套 manifest、旋转组、状态组、动画帧）
- A* 寻路 + 角色状态机 + 深度排序
- 随机活动系统（编码/写文档/开会/喝咖啡/摸鱼/发呆）
- 4 种交互按钮（拍一下/派任务/请咖啡/催一下）+ toast 通知

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
├── App.tsx                        # 主入口 + 路由（8 个导航页面）
├── types/index.ts                 # TypeScript 类型定义
├── data/
│   ├── mock.ts                    # Dashboard/Cockpit mock 数据
│   ├── digital-employees.ts       # 6 名数字员工（含主管）
│   └── persona-defaults.ts        # 员工人格/记忆默认值
├── components/
│   ├── layout/Sidebar.tsx         # 侧边导航
│   ├── cockpit/                   # 超级工作台（三栏：审批+Chat+数据）
│   ├── team/                      # 数字团队 + 员工配置面板
│   ├── memory/                    # 记忆中心（仪表盘/时间线/图谱）
│   ├── office/                    # 虚拟办公室
│   │   ├── engine/                #   Canvas 2D 引擎核心
│   │   ├── sprites/               #   精灵缓存 + 角色数据
│   │   ├── layout/                #   家具目录 + 布局序列化
│   │   └── VirtualOffice.tsx      #   办公室主视图（互动+状态栏）
│   ├── dashboard/                 # 信息流 Feed
│   ├── finance/                   # 财务中心
│   ├── channels/                  # 通讯中心
│   ├── knowledge/                 # 知识库
│   ├── settings/                  # 设置
│   ├── chat/                      # AI 对话
│   ├── builder/                   # 员工构建工作台
│   └── shared/                    # 共享组件
├── stores/
│   ├── useAppStore.tsx            # Zustand 全局状态
│   └── personaStore.ts            # 人格 + 记忆 Store（Zustand persist）
├── engine/PromptAssembler.ts      # 提示词组装引擎
├── hooks/useQeeClaw.ts            # 17 个 SDK hooks
├── services/qeeclaw.ts            # SDK 适配层（双模式）
└── gateway/                       # 网关 / 事件总线

public/assets/                     # 像素办公室美术资源
├── characters/                    #   6 个角色精灵 (char_0~5.png)
├── furniture/                     #   25+ 家具（每个含 manifest.json + PNG）
├── floors/                        #   9 种地板纹理
└── walls/                         #   墙壁贴图

.github/workflows/deploy.yml      # GitHub Pages CI/CD
CHANGELOG.md                       # 版本历史 (v0.1 ~ v0.12.1)
AI_HANDOVER.md                     # AI 开发者交接文档
docs/                              # 架构文档
  └── integration/                 # 后端对接 PRD
```

## 文档

- [CHANGELOG.md](./CHANGELOG.md) — 版本历史 (v0.1 ~ v0.12.1)
- [AI_HANDOVER.md](./AI_HANDOVER.md) — **AI 开发者交接文档**（项目状态 + 前后端对接契约）
- [docs/integration/](./docs/integration/) — 后端对接 PRD

## 许可

MIT
