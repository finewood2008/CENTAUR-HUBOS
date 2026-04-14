# Hub OS

> 半人马 AI 数字员工操作系统 — 让每一家中小企业都拥有自己的 AI 团队

Hub OS 是一个本地部署的 AI Agent 管理平台。它把大模型 Agent 包装成"数字员工"的概念，让企业老板像管理真实团队一样管理 AI —— 招聘、分配任务、查看工作汇报、控制权限和预算。

## 核心理念

**不是又一个 AI 聊天工具，而是一个 AI 人事系统。**

- 每个 Agent 是一名"员工"，有档案、岗位、技能、权限
- 通过"架构师面谈"对话式创建新员工，不需要写代码
- Dashboard 是"公司早报"，一眼掌握全局
- 知识库是"公司资料室"，按权限分配给不同员工

## 功能模块

### 控制台 (Dashboard)
公司早报风格的全局概览：
- 在线员工状态 / 今日任务完成数 / 算力消耗 / 安全告警
- 每位员工的今日工作汇报
- 近 7 日算力消耗趋势图
- 异常告警（配额耗尽、越权访问、API 故障）

### 员工管理 (Agents)
三个子视图：
- **员工市场** — 预配置的岗位模板（销售、客服、财务、法务等），一键入职
- **花名册** — 在册员工列表 + 详细档案卡（能力标签、工具权限、数据权限、算力预算）
- **架构师面谈** — 对话式 Agent Builder，通过自然语言定义岗位、选模型、配权限

### 通讯中心 (Channels)
管理数字员工的对外沟通渠道：
- 企业微信 / 邮件 / 飞书 / 钉钉集成
- 消息路由 — 自动将外部消息分配给对应员工处理
- 会话记录查看

### 知识库 (Knowledge)
数字员工的知识来源管理：
- 多个独立知识库（品牌资料库、员工档案库、产品文档等）
- 按员工分配数据权限
- 文件索引和存储用量统计

## 技术栈

- **前端**: React 19 + TypeScript + Tailwind CSS v4
- **桌面**: Electron 22（macOS / Windows / Linux）
- **动效**: Framer Motion
- **图标**: Lucide React
- **构建**: Vite 8

## 快速开始

```bash
# 安装依赖
npm install

# 浏览器开发模式
npm run dev

# Electron 桌面应用开发模式
npm run app:dev
```

## 项目结构

```
src/
├── App.tsx                         # 主应用入口 + 路由
├── main.tsx                        # React 挂载点
├── index.css                       # 全局样式
├── types/
│   └── index.ts                    # TypeScript 类型定义
├── data/
│   └── mock.ts                     # Mock 数据（员工/模板/告警/用量）
└── components/
    ├── layout/
    │   └── Sidebar.tsx             # 侧边导航栏
    ├── dashboard/
    │   └── Dashboard.tsx           # 控制台首页
    ├── agents/
    │   └── AgentManagement.tsx     # 员工管理（市场+花名册+面谈+档案）
    ├── channels/
    │   └── Channels.tsx            # 通讯中心
    └── knowledge/
        └── Knowledge.tsx           # 知识库
```

## 当前状态

🟢 **原型阶段** — Dashboard 和员工管理为高保真 Mock 原型，通讯中心和知识库为框架占位。

### 已完成
- [x] 组件化架构重构
- [x] 侧边导航（4 模块 + 设置）
- [x] Dashboard 公司早报（指标卡 + 汇报 + 趋势图 + 告警）
- [x] 员工市场（App Store 风格模板浏览）
- [x] 花名册 + 员工档案卡
- [x] 架构师面谈（对话式 Agent Builder）
- [x] 通讯中心框架
- [x] 知识库框架

### 下一步
- [ ] 接入 QeeClaw SDK 实现真实 Agent 管理
- [ ] 员工入职流程打通后端
- [ ] 知识库文件上传 + 向量索引
- [ ] 通讯渠道真实对接（企微/飞书）
- [ ] Agent 间协作工作流

## 许可

MIT
