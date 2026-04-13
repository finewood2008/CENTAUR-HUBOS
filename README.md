# 半人马 AI 人事部 (Centaur AI HR Hub)

## 📖 项目简介 (Project Overview)

**半人马 AI 人事部 (Centaur AI HR Hub)** 是一台面向中国中小企业的**“数字员工入职与管理硬件平台”**。

在底层，它是一个强大的 AI Agent Builder 基础设施（集成 Hermes Agent、向量数据库、模型路由器等）；在业务层，我们将其核心概念从传统的“技术/部署/开发”转换为“人事/面试/入职”。通过“架构师面谈区”（Chat-First 交互），没有技术背景的中小企业老板也能像面试真实员工一样，对话生成并管理专属于自己企业的 AI 数字员工（如：旗舰级预装员工——CMO 兼品牌设计专家“火花 Spark”）。

## 🎨 UI & 架构设计 (UI & Architecture)

项目采用 **Chat-First（对话优先）** 的双/三面板架构，核心视觉为现代企业级磨砂玻璃质感（Glassmorphism），品牌主题色为亮橙色 (`#FF6B35`)。

*   **左侧：花名册 (Roster)** - 管理与查看已“入职”的数字员工列表。
*   **中间：面谈区 (Chat/Interview)** - 核心交互区。用于“岗位生成”（构建新 Agent）以及与已有员工进行业务对话。
*   **右侧：工作区预览 (Workspace Preview)** - 动态展示生成的品牌资产、业务文件或 RAG 知识库内容。

## 🛠️ 技术栈 (Tech Stack)

*   **前端**：React, Tailwind CSS, Vite
*   **客户端打包**：Electron (桌面端硬件系统级应用适配)
*   **Agent 引擎**：基于 Hermes Agent 方案
*   **语言**：TypeScript

## 📂 核心机制 (Core Mechanisms)

*   **Harness 加载机制**：后端通过 `SparkAgent.ts` 和 `HarnessLoader.ts` 动态加载 `harness/` 目录下的配置文件（`context-map.md`, `workflows/`, `standards/` 等），实现数字员工行为的定义与约束。
*   **AI 协同与交接**：依赖 `PRD.md` 和 `SOUL.md` 进行 AI 之间的上下文无缝交接（AI-to-AI handoffs）。
*   **自我进化**：通过 `harness/errors/log.md` 记录错误和用户反馈，实现系统自我优化。

## 🚀 快速开始 (Getting Started)

```bash
# 1. 安装依赖
npm install

# 2. 启动前端开发服务器 (Vite)
npm run dev

# 3. 启动 Electron 桌面客户端
npm run electron
```

## 🤝 对于 AI 助手的交接指南 (For AI Agents)

如果你是接手此项目的其他 AI，请首先阅读项目根目录下的 **[PRD.md](./PRD.md)** 文件。它包含了当前的产品状态、开发进度、未完成的功能列表以及系统架构的详细说明，这是保证你能够无缝接手开发的关键文档。

## 📋 跨部门对接板块

请参阅 [docs/integration/README.md](docs/integration/README.md) 获取云端计费、内部网关、事件总线的对接规范。