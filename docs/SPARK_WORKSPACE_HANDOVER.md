# 火花数字员工工作台 · 交接文档

**最后更新**: 2026-04-19 会话暂停
**状态**: 刚开工，尚未写代码
**方案**: B — 从 spark-sparkle 移植核心，UI 用 Hub OS 暖色调重画

---

## 恢复指令（给火花）

用户回来说"继续"或"恢复火花工作台"时：
1. 不要重新分析项目，直接读本文档
2. 从 TODO 的第 1 项继续
3. 所有决策都已拍板，不要再问用户

---

## 已拍板的决策

| 决策点 | 选择 |
|---|---|
| 方案 | B（移植 sparkle 核心，去 Supabase） |
| 人格定位 | 企业 CMO 火花（与 sparkle 一致，非闺蜜） |
| 记忆存储 | localStorage 本地化 |
| 首要能力 | 新媒体文章写作 |
| UI 风格 | Hub OS 暖色调（parchment / terracotta），不引入 shadcn |
| MVP 验收 | 小红书种草笔记 demo 端到端跑通 |

---

## MVP Demo 目标

```
用户输入："帮我写一篇小红书种草笔记, 主题: AI 数字员工"
  ↓
左栏: 火花流式回复
中栏: markdown 编辑器同步出现，可编辑
右栏: 小红书卡片实时预览（封面/标题/正文/标签）
  ↓
用户点"切换公众号"或"切换抖音"看同一内容的不同平台排版
  ↓
用户点"保存草稿" → localStorage
```

---

## TODO 列表（按顺序执行）

```
[ ] 1. 搭建工作台目录结构 + Team.tsx 接入「进入工作台」按钮
[ ] 2. src/lib/spark-ai.ts — Gemini 代理流式客户端 + generateArticle
[ ] 3. src/stores/sparkMemoryStore.ts — Zustand + localStorage 三层记忆
[ ] 4. src/data/spark-prompts.ts — 企业 CMO 人格 + 平台写作 system prompts
[ ] 5. SparkWorkspace.tsx — 三栏外壳 + 顶部 bar（返回团队/记忆/草稿）
[ ] 6. ChatColumn.tsx — 对话列（流式 + 富消息：快捷建议、内容卡片）
[ ] 7. EditorColumn.tsx — 中栏 markdown 编辑器（textarea + 预览切换）
[ ] 8. PreviewColumn.tsx — 右栏 小红书/公众号/抖音 预览切换
[ ] 9. 端到端 demo 跑通：写小红书种草笔记
[ ] 10. commit + push + 更新 CHANGELOG
```

---

## 文件蓝图

```
src/
  components/
    spark-workspace/
      index.ts                     — export SparkWorkspace
      SparkWorkspace.tsx           — 三栏外壳 + 状态管理
      ChatColumn.tsx               — 左栏：对话
      EditorColumn.tsx             — 中栏：markdown 编辑器
      PreviewColumn.tsx            — 右栏：平台预览
      platform-renders/
        XiaohongshuCard.tsx        — 小红书卡片渲染
        WechatArticle.tsx          — 公众号排版
        DouyinCaption.tsx          — 抖音脚本
      MemoryDrawer.tsx             — 顶部抽屉：三层记忆
  stores/
    sparkMemoryStore.ts            — Zustand + persist(localStorage)
  lib/
    spark-ai.ts                    — 流式 Gemini（复用 BuilderChat 的 callGemini）
  data/
    spark-prompts.ts               — CMO 人格 + 平台 prompts
```

---

## 接入点修改

### App.tsx
- 新增 state: `const [sparkWorkspace, setSparkWorkspace] = useState(false)`
- tab === 'team' && sparkWorkspace → 渲染 `<SparkWorkspace onBack={() => setSparkWorkspace(false)} />`

### src/components/team/Team.tsx
- `handleWorkbench` 函数：当 `emp.id === 'spark'` 时，调用新 prop `onEnterSparkWorkspace()`
- 其他员工保留 toast("即将上线")

### 或者更简洁（推荐）
在 Team.tsx 内部直接用 `showSparkWorkspace` 状态，不影响 App.tsx。

---

## 关键技术参考

### Gemini 代理（已部署可用）
```ts
const GEMINI_PROXY = 'https://spark-gemini-proxy.finewood2008.workers.dev/v1/chat/completions';
// 格式 OpenAI 兼容，model 用 'gemini-2.5-flash'
```
参考：`src/components/builder/BuilderChat.tsx:51-110` 里 `callGemini()` 已经写好了，可复用模式。

### 需要支持流式
BuilderChat 是一次性返回。新工作台要改成 SSE 流式（`stream: true`）。
sparkle 的 `src/lib/ai-stream.ts:123-180` 有完整 SSE 解析代码，照抄（去掉 Supabase 依赖）。

### 已有依赖
- ✅ zustand — 不在 package.json，需要 `npm i zustand`
- ✅ framer-motion
- ✅ lucide-react
- ✅ clsx + tailwind-merge
- ❌ react-markdown — 需要 `npm i react-markdown`（或手写简单 md 渲染）

---

## sparkle 参考文件（已读）

| 文件 | 行数 | 用途 |
|---|---|---|
| `src/components/SparkChat.tsx` | 945 | 对话骨架 + 富消息类型 |
| `src/components/ChatLayout.tsx` | 275 | 整体布局思路 |
| `src/components/MemoryPanel.tsx` | 155 | 三层记忆面板 UI 模式 |
| `src/components/PlatformPreview.tsx` | 189 | 平台预览切换 |
| `src/components/ContentCard.tsx` | 837 | 文章卡片（不移植，参考） |
| `src/lib/ai-stream.ts` | 222 | 流式 AI（去 Supabase 后复用） |
| `src/types/memory.ts` | 81 | 三层记忆类型定义（直接复用） |
| `src/types/spark.ts` | - | ChatMessage 等 |
| `src/store/memoryStore.ts` | 232 | Zustand 结构（去 Supabase） |

**路径**: `~/Desktop/projects/spark-sparkle-spark-f0f2d2ff/`

---

## Hub OS 设计系统（复用这些 class）

```
.card-glass-warm           — 卡片容器
.btn-terracotta            — 主按钮
text-terracotta            — 主色
text-near-black            — 主文字
text-olive-gray            — 次要文字
text-stone-gray            — 辅助文字
bg-parchment               — 页面底色
bg-warm-sand               — 浅色块
border-border-cream        — 边框
font-serif                 — 标题字体
```

---

## 第一步要做什么（重启后直接动手）

```bash
cd ~/Desktop/projects/CENTAUR-HR
npm i zustand react-markdown
mkdir -p src/components/spark-workspace/platform-renders
```

然后按 TODO 1 → 10 顺序执行即可。不需要再跟用户确认方案。
