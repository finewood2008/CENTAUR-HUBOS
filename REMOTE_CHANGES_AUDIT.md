# 远程新增文件 SDK 对接审计报告

## 📋 审计范围
检查从远程拉取的 11 个新提交中新增的组件，确认是否需要 SDK 对接。

---

## ✅ 无需对接（纯 UI 组件）

### 1. **DashboardGrid.tsx**
- **状态**: 使用硬编码 mock 数据
- **位置**: `src/components/dashboard/DashboardGrid.tsx`
- **数据源**: 
  - `INITIAL_WIDGETS` (line 20-24): 硬编码的 3 个 agent widget
  - `INITIAL_LAYOUT` (line 26-30): 硬编码的布局配置
- **建议**: 
  - ⚠️ 需要对接 `useAgentManagement()` 获取真实 agent 列表
  - ⚠️ 需要对接 `useConversationsData()` 获取最新消息
  - 可以保留 mock 作为 fallback

### 2. **EmployeeBuilder.tsx**
- **状态**: 纯前端对话流程，无需 SDK
- **位置**: `src/components/team/EmployeeBuilder.tsx`
- **说明**: 使用本地预设数据 `ROLE_PRESETS`，通过对话收集用户输入，最终生成 `DigitalEmployee` 对象
- **建议**: ✅ 无需修改（设计如此）

### 3. **TrialChat.tsx**
- **状态**: 使用 mock 回复
- **位置**: `src/components/team/TrialChat.tsx`
- **数据源**: `getMockReply()` 函数 (line 19-50)
- **建议**: 
  - ⚠️ 如果需要真实对话，应对接 `getModelsModule().chat()`
  - 当前设计可能是故意使用 mock（试用阶段）

### 4. **GenerationAnimation.tsx**
- **状态**: 纯动画组件
- **位置**: `src/components/team/GenerationAnimation.tsx`
- **说明**: 使用 `setTimeout` 模拟生成过程的视觉效果
- **建议**: ✅ 无需修改（纯 UI）

### 5. **FileUpload.tsx**
- **状态**: 使用 `setTimeout` 模拟上传
- **位置**: `src/components/knowledge/upload/FileUpload.tsx`
- **问题**: Line 47-48 注释说"实际接 SDK API"，但实际使用 `setTimeout(1500)`
- **建议**: 
  - ⚠️ 需要对接 `getKnowledgeModule().ingest()`
  - 注意：当前 Knowledge.tsx 已经有上传功能，FileUpload 可能是重复组件

### 6. **AgentFeedWidget.tsx**
- **状态**: 纯展示组件
- **位置**: `src/components/dashboard/widgets/AgentFeedWidget.tsx`
- **问题**: Line 59-60 "分配新任务" 按钮无 onClick 处理器
- **建议**: 
  - ⚠️ 需要添加 onClick 处理器（或用 toast 提示"功能开发中"）

### 7. **BaseWidget.tsx**
- **状态**: 纯 UI 容器组件
- **建议**: ✅ 无需修改

### 8. **AgentBuilder.tsx**
- **状态**: 已对接 SDK
- **位置**: `src/components/agents/AgentBuilder.tsx`
- **SDK 调用**: `getModelsModule().invoke()` (line 113)
- **Props**: 接收 `isConnected` prop
- **问题**: ⚠️ App.tsx 中未使用此组件
- **建议**: 如果需要使用，在 App.tsx 中添加路由并传递 `isConnected={connected}`

---

## 🔧 需要修复的问题

### 高优先级

#### 1. **DashboardGrid 硬编码数据**
```typescript
// 当前: 硬编码 mock
const INITIAL_WIDGETS: WidgetData[] = [
  { id: 'widget-1', type: 'agentFeed', agentId: 'spark', ... },
  ...
];

// 建议: 对接 SDK
interface DashboardGridProps {
  isConnected: boolean;
}

export default function DashboardGrid({ isConnected }: DashboardGridProps) {
  const { agents } = useAgentManagement(isConnected);
  const { data: convData } = useConversationsData(isConnected);
  
  // 从 agents 生成 widgets
  const widgets = agents.map(agent => ({
    id: `widget-${agent.id}`,
    type: 'agentFeed',
    agentId: agent.id,
    agentName: agent.name,
    status: agent.status,
    lastMessage: convData.find(c => c.agentId === agent.id)?.lastMessage,
  }));
  
  // 保留 INITIAL_WIDGETS 作为 fallback
  const displayWidgets = isConnected && agents.length > 0 ? widgets : INITIAL_WIDGETS;
}
```

#### 2. **FileUpload 模拟上传**
```typescript
// 当前: setTimeout 模拟
await new Promise(resolve => setTimeout(resolve, 1500));

// 建议: 对接 SDK
if (isConnected) {
  await getKnowledgeModule().ingest({
    teamId: 1,
    file: files[0],
    filename: files[0].name,
    sourceName: kbName,
  });
} else {
  // fallback: 模拟上传
  await new Promise(resolve => setTimeout(resolve, 1500));
}
```

**注意**: 检查 FileUpload 是否与 Knowledge.tsx 的上传功能重复。

#### 3. **AgentFeedWidget 死按钮**
```typescript
// 当前: 无 onClick
<button className="...">分配新任务</button>

// 建议: 添加处理器
<button 
  onClick={() => toast('info', '任务分配功能开发中')}
  className="..."
>
  分配新任务
</button>
```

### 中优先级

#### 4. **TrialChat mock 回复**
- 如果设计上需要真实对话，对接 `getModelsModule().chat()`
- 如果是故意的 mock（试用阶段），保持现状

#### 5. **AgentBuilder 未使用**
- 如果需要使用，在 App.tsx 添加路由
- 如果不需要，可以删除或保留作为未来功能

---

## 📊 统计

| 类型 | 数量 | 文件 |
|------|------|------|
| ✅ 无需修改 | 3 | GenerationAnimation, BaseWidget, EmployeeBuilder |
| ⚠️ 需要对接 SDK | 3 | DashboardGrid, FileUpload, AgentFeedWidget |
| ⚠️ 待确认 | 2 | TrialChat, AgentBuilder |
| ✅ 已对接 | 1 | AgentBuilder (但未使用) |

---

## 🎯 建议行动

### 立即修复
1. **DashboardGrid**: 对接 `useAgentManagement` + `useConversationsData`
2. **AgentFeedWidget**: 添加按钮 onClick 处理器
3. **FileUpload**: 检查是否重复，如需要则对接 SDK

### 待讨论
1. **TrialChat**: 确认是否需要真实对话
2. **AgentBuilder**: 确认是否需要在 App.tsx 中使用

### 可选
- 为 DashboardGrid 添加刷新逻辑（类似其他组件）
- 统一所有组件的 mock fallback 模式
