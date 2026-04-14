# 产品需求与交接文档 (PRD & Handoff Document)

**项目名称**：半人马 AI 人事部 (Centaur AI HR Hub)
**目标受众**：中国中小企业老板/管理者（非技术背景，Non-technical Boss）
**核心愿景**：让不懂技术的企业主能够通过对话“面试”并“入职”专属的数字员工。

---

## 1. 核心业务概念映射 (Terminology & Concept Mapping)

为了适应非技术受众，我们对传统的 AI 平台开发术语进行了重构。**接手的 AI 必须在交互和代码注释中严格遵守这套命名规范：**

| 传统技术术语 (Tech Term) | 映射的人事术语 (HR Term) | 说明 |
| :--- | :--- | :--- |
| AI Agent Builder | **岗位生成区 / 架构师面谈区** | 用户通过对话创建新 Agent 的入口 |
| Deploy / 部署 | **入职** | Agent 准备就绪，可以开始工作 |
| Prompt Engineering | **岗位职责设定 / 架构师面谈** | 通过对话自然而然地设定 Prompt |
| Agent List | **员工花名册 (Roster)** | 管理已创建的 Agent |
| Configuration / Config | **员工档案** | Agent 的底层设定，但在前端尽量弱化展示 |
| Knowledge Base (RAG) | **企业资料库 / 培训手册** | Agent 参考的企业背景数据 |

---

## 2. 系统架构与文件结构约束 (Architecture & File Constraints)

### 前端架构 (UI)
*   **布局比例**：左侧 (花名册) : 中间 (对话区) : 右侧 (工作区) 约为 `1 : 2 : 1.5`（具体可根据屏幕尺寸微调，但必须保持 Chat-First）。
*   **样式框架**：严格使用 Tailwind CSS。
*   **视觉风格**：磨砂玻璃质感 (`backdrop-blur`)，主色调亮橙色 (`bg-orange-500`, `text-orange-500` 等，对应 `#FF6B35`)。

### 核心目录结构
当前（或规划中）的关键目录结构如下，AI 在添加新功能时应遵循此约定：

```text
centaur-hr/
├── src/
│   ├── components/
│   │   ├── roster/      # 左侧：员工花名册组件
│   │   ├── chat/        # 中间：架构师面谈区与日常对话组件
│   │   └── workspace/   # 右侧：动态工作区与资料预览组件
│   ├── App.tsx          # 主布局入口
│   └── main.tsx
├── harness/             # [重要] 存放 Agent 的行为配置和知识
│   ├── context-map.md   # 上下文映射
│   ├── workflows/       # 工作流定义
│   ├── standards/       # 交付标准
│   └── errors/log.md    # 错误与纠偏日志库 (用于 Agent 进化)
├── SOUL.md              # 旗舰员工 (如 Spark) 的核心灵魂定义/Prompt
├── BRAND.md             # 用户企业的品牌信息库 (由 Agent 动态生成和读取)
├── PRD.md               # 也就是本文件：开发进度与交接文档
└── electron-main.cjs    # Electron 桌面端主进程入口
```

---

## 3. 旗舰产品用例：Spark (火花)

**Spark** 是平台出厂预装的旗舰数字员工。
*   **角色**：CMO / 品牌设计专家 (Alex 偏好设定)。
*   **核心能力**：理解品牌战略，执行视觉设计 (Logo, 海报等)，确保品牌一致性。
*   **工作流参考**：它依赖 `SOUL.md` 进行人格定义，依赖 `BRAND.md` 作为企业上下文，工作时会在右侧 Workspace 动态展示设计草图或品牌档案。

### 技术栈后端：QeeClaw SDK
后端使用公司 CTO 自研的 **QeeClaw SDK**（AI PaaS 平台），仓库：git@github.com:longxipinglq5/qeeclaw-sdk.git
* **Monorepo 结构**：core / product / runtime-sidecar / firmware / hermes-bridge
* QeeClaw SDK 提供 Agent 运行时、记忆管理、工具编排等核心能力
* 前端通过 `src/services/qeeclaw.ts` 和 `src/hooks/useQeeClaw.ts` 与后端对接

---

## 4. 当前开发进度与交接任务 (Current Status & Next Steps)

**当前状态**：
*   项目已初始化为 React + Vite + Tailwind CSS 架构。
*   Electron 桌面端壳子已基础配置完成 (`electron-main.cjs`)。
*   Git 仓库已连接到 `https://github.com/finewood2008/CENTAUR-HR.git`。

**接手 AI 需要继续完成的 Backlog (待办事项)**：

1.  **UI 框架搭建**：
    *   [x] 完成三栏基础布局 (Roster | Chat | Workspace) 的 React 组件骨架。
    *   [x] 应用磨砂玻璃质感和 `#FF6B35` 亮橙色主题的 Tailwind 类。
2.  **核心交互逻辑模拟**：
    *   [x] 实现左侧花名册的列表渲染（预置 "Spark (火花)" 作为演示数据）。
    *   [x] 实现中间面谈区的基本聊天气泡 UI 和输入框。
    *   [x] 实现右侧工作区的占位符（例如：选中 Spark 时，右侧显示虚拟的 `SOUL.md` 内容预览或品牌设计稿占位图）。
3.  **Harness 目录结构建立**：
    *   [x] 在项目根目录创建 `harness/` 目录结构及占位文件，以便后续 Agent 逻辑接入。
4.  **QeeClaw SDK 集成**：
    *   [x] 编写 QeeClaw SDK 前端封装层 (`src/services/qeeclaw.ts`)。
    *   [x] 编写 React Hook (`src/hooks/useQeeClaw.ts`)。
    *   [ ] 与 CTO 后端联调，替换 mock 数据为真实 Agent 交互。

### 交接指令：
**接手的 AI，请在阅读完毕后，优先完成前端 UI 框架搭建与交互模拟。待基础外壳稳定后，开始进入第 4 步 QeeClaw SDK 的联调工作。每次完成阶段性任务，请更新本文件中的完成状态。**