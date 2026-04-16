# Hub OS

> 半人马 AI 数字员工操作系统 — 让每一家中小企业都拥有自己的 AI 团队

**[▶ 在线预览](https://finewood2008.github.io/CENTAUR-HR/)**

Hub OS 把大模型 Agent 包装成"数字员工"，让企业老板像管理真实团队一样管理 AI —— 招聘、分配任务、查看工作汇报、控制权限和预算。

## 功能概览

| 模块 | 说明 |
|------|------|
| 信息流 | 公司早报风格的全局概览 — 员工状态 / 任务完成 / 算力消耗 / 告警 |
| 数字团队 | 5 名数字员工完整档案 — 火花(CMO)、小可(获客)、书熙(法务)、税宝(财税)、绿安(安全) |
| 财务中心 | API Key 管理 + 员工用量明细 + 月度预算 |
| 通讯中心 | 全局渠道监控大盘（企微/飞书/Telegram/钉钉/邮件） |
| 知识库 | 数字员工的知识来源管理 — 多库 + 权限分配 |
| 设置 | API 密钥配置 + 偏好设置 |

## 技术栈

- React 19 + TypeScript + Tailwind CSS v4
- Electron 22（macOS / Windows / Linux）
- Framer Motion + Lucide Icons
- Vite 8 + @qeeclaw/core-sdk

## 设计系统

Claude / Anthropic 风格暖色调设计：
- 暖色表面（parchment / ivory）
- 赤陶品牌色（terracotta #c96442）
- 衬线标题 (Georgia) + 无衬线正文
- 毛玻璃卡片 + 大圆角

## 快速开始

```bash
npm install

# Mock 服务器
node mock-server.cjs

# 浏览器开发
npm run dev

# Electron 桌面应用
npm run app:dev
```

## 项目结构

```
src/
├── App.tsx                    # 主入口 + 路由
├── types/index.ts             # TypeScript 类型
├── data/
│   ├── mock.ts                # Dashboard mock 数据
│   └── digital-employees.ts   # 数字员工 + 财务 mock 数据
├── components/
│   ├── layout/Sidebar.tsx     # 侧边导航
│   ├── dashboard/Dashboard.tsx
│   ├── team/Team.tsx          # 数字团队
│   ├── finance/Finance.tsx    # 财务中心
│   ├── channels/Channels.tsx
│   ├── knowledge/Knowledge.tsx
│   └── settings/Settings.tsx
├── hooks/useQeeClaw.ts        # SDK hooks（SDK-first + mock fallback）
└── services/qeeclaw.ts        # SDK 客户端

mock-server.cjs                # Proxy + Mock 控制面服务器
electron-main.cjs              # Electron 主进程
HANDOVER.md                    # 后端对接技术规范
```

## 许可

MIT
