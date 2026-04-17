# 首页全息信息流模块设计 (Home Feed Dashboard Design)

## 1. 模块定位与核心业务映射
在“半人马 AI 人事部”的产品语境下，传统的 Dashboard (仪表盘) 将被重新定义：
* **传统术语**: Dashboard / Feed / Widget / Drag-and-drop
* **业务映射**: **老板中控台 / 员工汇报看板 / 员工工位安排**
* **核心价值**: 让企业主能像在实体办公室里一样，“一眼掌控全局”。不仅能看到宏观业务指标，还能直接听取各个“数字员工”的实时汇报，并能自由调整哪些员工坐在“第一排”（屏幕最显眼位置）。

## 2. 核心功能与特性 (Core Features)

### 2.1 模块化“数字员工卡片” (Agent Feed Widgets)
每个被雇佣（部署）的数字员工在首页都可以拥有一个或多个汇报卡片（Widget）。
* **卡片内容**: 员工的实时工作状态（如：正在设计Logo、空闲、等待审批）、最新产出的结果（如生成的品牌设计图）、重要预警消息。
* **交互操作**: 快速回复框（直接在卡片内给予简短反馈）、一键跳转到深度沟通（Chat）界面、卡片刷新与静音。

### 2.2 自由拖拽与配置 (Drag-and-Drop Layout)
* **编辑模式 (排位模式)**: 用户点击“调整工位”后，进入可编辑状态，支持鼠标拖放改变卡片位置。
* **自由缩放**: 卡片支持调节尺寸（例如：1x1 小卡片只显示状态，2x2 大卡片显示最新产出物缩略图和完整汇报文本）。

### 2.3 预设黄金模板 (Layout Templates)
考虑到非技术老板可能不擅长从零搭建界面，系统提供一键切换的预设模板：
1. **“晨会模式 (Morning Briefing)”**: 聚焦各个部门核心数字员工的“待办”和“预警”，适合一早查看。
2. **“专注模式 (Focus Mode)”**: 核心大卡片置中（例如当前正在攻关大项目的策划总监Agent），其他辅助角色卡片环绕四周。
3. **“部门矩阵 (Department Grid)”**: 按照营销、运营、研发等部门分列摆放员工汇报。

### 2.4 数据持久化与记忆
* 用户的界面布局偏好、所选模板、放入桌面的员工列表等信息将被保存，每次登录自动恢复。

## 3. 前端技术栈与实现思路 (Technical Approach)

### 3.1 核心组件选型
* **网格与拖拽库**: 推荐使用 **`react-grid-layout`**。它天然支持基于响应式网格的拖拽（Drag）、缩放（Resize），非常成熟且完美契合这种自由 Dashboard 的需求。
* **样式**: 继承现有的 Tailwind CSS 和磨砂玻璃质感，拖拽时增加悬浮阴影和高亮吸附区域。

### 3.2 组件架构设计
```text
src/
  components/
    dashboard/
      ├── DashboardGrid.tsx       # 核心网格容器，包装 react-grid-layout
      ├── EditModeToolbar.tsx     # 编辑模式下的工具栏（保存、模板切换、添加组件）
      ├── AgentWidgetPool.tsx     # “待安排”的数字员工组件池（侧边栏拖出）
      └── widgets/
          ├── BaseWidget.tsx      # Widget 基础外壳（含标题栏、拖拽手柄、删除按钮）
          ├── AgentFeedWidget.tsx # 专门渲染某个数字员工汇报信息流的业务组件
          └── MetricWidget.tsx    # （可选）专门渲染图表等大盘指标的组件
```

### 3.3 数据结构设计 (Layout State)
通过一组类似 JSON 的配置数组来定义当前信息流视图，方便对接 QeeClaw SDK 存储：
```json
[
  { "i": "agent-spark-1", "x": 0, "y": 0, "w": 4, "h": 2, "type": "AgentFeed", "agentId": "spark_cmo" },
  { "i": "agent-hr-2", "x": 4, "y": 0, "w": 2, "h": 2, "type": "AgentFeed", "agentId": "hr_manager" }
]
```

## 4. 实施与开发路径建议 (Next Steps)
一旦本设计确认，可以按照以下步骤启动开发：
1. **Phase 1: 静态框架与拖拽基建**：引入 `react-grid-layout`，实现纯静态的卡片拖放、保存布局坐标到 `localStorage` 的功能。
2. **Phase 2: 卡片业务化**：开发 `AgentFeedWidget`，并接入 mock 数据，演示如何在卡片内展现 Spark (火花) 的工作进展。
3. **Phase 3: 模板化与交互打磨**：实现预设模板一键切换、侧边栏拖入新员工卡片等高级交互逻辑。
4. **Phase 4: API 联调**：将布局状态通过 QeeClaw SDK 持久化，并监听后端的 Agent 真实流式输出显示在卡片中。
