// CENTAUR Hub OS — 数字员工完整档案
import type { DigitalEmployee } from '../types';

export const DIGITAL_EMPLOYEES: DigitalEmployee[] = [
  // ─── 0. 主管 Leader — COO / 首席运营官 ───
  {
    id: 'leader',
    name: '主管',
    englishName: 'Leader',
    role: 'COO · 首席运营官',
    tagline: '你的右臂，团队的大脑',
    introduction:
      '我是你的数字合伙人，团队的总管。我理解你的意图，拆解任务，协调团队，确保每件事都有人跟进、及时交付。我不当对讲机——我会主动思考、提出建议、预判风险。',
    avatar: '🧑‍💼',
    color: 'from-indigo-500 to-violet-400',
    accentColor: 'text-indigo-600',
    status: 'active',
    model: 'Claude Opus 4',
    capabilities: ['任务拆解', '团队协调', '进度跟踪', '风险预判', '汇报总结', '决策支持'],
    skills: [
      { name: '任务拆解与分配', icon: 'GitBranch', description: '将复杂目标拆解为可执行任务并分配给合适的员工' },
      { name: '进度跟踪与汇报', icon: 'BarChart', description: '实时掌握各任务进展，主动向老板汇报' },
      { name: '风险预判与预警', icon: 'AlertTriangle', description: '提前识别项目风险并给出应对建议' },
      { name: '团队协调与调度', icon: 'Users', description: '协调多员工协作，避免资源冲突与信息断层' },
    ],
    tools: [
      { name: '任务看板', icon: 'LayoutDashboard', category: 'data', description: '任务创建、分配与状态追踪' },
      { name: '进度仪表盘', icon: 'Activity', category: 'analysis', description: '团队整体进度可视化' },
      { name: '团队通讯', icon: 'MessageSquare', category: 'communication', description: '员工间任务流转与消息同步' },
      { name: '日报周报生成', icon: 'FileText', category: 'data', description: '自动汇总团队工作成果' },
    ],
    harness: [
      { title: '意图理解', content: '深度理解老板的战略意图，将模糊目标转化为清晰可执行的任务' },
      { title: '全局调度', content: '掌握团队每位成员的能力与状态，合理分配任务并跟进交付' },
    ],
    modelInfo: {
      base: 'Claude Opus 4',
      reasoning: '深度推理 + 全局规划',
      context: '200K tokens',
      specialization: '任务编排与团队协调',
    },
    memorySystem: {
      description: '团队记忆体——积累团队协作模式与老板决策偏好',
      layers: ['老板意图历史', '任务分配记录', '团队协作模式', '风险与复盘经验'],
    },
    workspace: {
      type: 'command-center',
      label: '指挥中心',
      description: '任务分配与进度监控',
    },
    onboardingPreferences: [],
    trainingDataSources: [],
    stats: { monthlyTasks: 320, hoursSaved: 150, satisfaction: 98 },
  },

  // ─── 1. 火花 Spark — CMO / 品牌创意总监 ───
  {
    id: 'spark',
    name: '火花',
    englishName: 'Spark',
    role: 'CMO · 品牌创意总监',
    tagline: '让每一个像素都讲述品牌故事',
    introduction:
      '我是火花，你的品牌创意总监。我擅长将商业策略转化为引人注目的视觉表达——从Logo设计到完整的VI系统，从公众号排版到小红书爆款内容。我理解中国市场的审美趋势，能为你的品牌打造独特的视觉语言。',
    avatar: '🔥',
    color: 'from-orange-500 to-amber-400',
    accentColor: 'text-orange-600',
    status: 'active',
    model: 'Claude Sonnet 4',
    capabilities: ['品牌设计', 'VI系统', 'Logo创作', '海报制作', '社媒内容', '文案撰写'],
    skills: [
      { name: '品牌视觉设计', icon: 'Palette', description: '从零打造完整品牌视觉体系' },
      { name: '社媒内容创作', icon: 'PenTool', description: '公众号、小红书、抖音内容制作' },
      { name: '商业文案', icon: 'FileText', description: '品牌文案、广告语、产品描述' },
      { name: '竞品分析', icon: 'Search', description: '视觉层面的竞品调研与趋势分析' },
    ],
    tools: [
      { name: 'Midjourney', icon: 'Image', category: 'generation', description: '高质量AI图像生成' },
      { name: 'DALL-E 3', icon: 'Sparkles', category: 'generation', description: '精准控制的图像创作' },
      { name: '公众号API', icon: 'MessageSquare', category: 'communication', description: '文章排版与发布' },
      { name: '小红书API', icon: 'Heart', category: 'communication', description: '笔记发布与数据追踪' },
    ],
    harness: [
      { title: '品牌理解', content: '深度理解品牌定位、目标受众和市场竞争格局' },
      { title: '创意执行', content: '将创意概念快速转化为高质量视觉产出' },
    ],
    modelInfo: {
      base: 'Claude Sonnet 4',
      reasoning: '高级推理 + 创意思维',
      context: '200K tokens',
      specialization: '视觉创意与品牌策略',
    },
    memorySystem: {
      description: '品牌记忆体——持续积累品牌资产认知',
      layers: ['品牌风格指南', '历史设计偏好', '客户反馈记录', '竞品视觉库'],
    },
    workspace: {
      type: 'chat-board',
      label: '火花工作台',
      description: '对话驱动 + 内容看板',
    },
    onboardingPreferences: [
      { key: 'industry', label: '所在行业', type: 'select', options: ['科技', '消费', '教育', '金融', '医疗', '其他'] },
      { key: 'brand_tone', label: '品牌调性', type: 'select', options: ['专业严谨', '年轻活力', '高端奢华', '温暖亲和'] },
      { key: 'brand_desc', label: '品牌简述', type: 'textarea', placeholder: '简单描述你的品牌...' },
    ],
    trainingDataSources: ['品牌手册PDF', 'Logo源文件', '历史设计稿', '竞品资料'],
    stats: { monthlyTasks: 156, hoursSaved: 82, satisfaction: 96 },
  },

  // ─── 2. 小可 Xiaoke — 获客增长经理 ───
  {
    id: 'xiaoke',
    name: '小可',
    englishName: 'Xiaoke',
    role: '获客增长经理',
    tagline: '用AI重新定义获客效率',
    introduction:
      '我是小可，专注于帮助企业实现高效获客。我能分析市场数据、优化投放策略、管理客户线索，并通过多渠道触达潜在客户。从线索获取到客户转化，我用数据驱动每一个增长决策。',
    avatar: '🎯',
    color: 'from-blue-500 to-cyan-400',
    accentColor: 'text-blue-600',
    status: 'active',
    model: 'Claude Sonnet 4',
    capabilities: ['线索获取', '客户培育', '投放优化', '数据分析', '渠道管理', 'CRM'],
    skills: [
      { name: '精准获客', icon: 'Target', description: '多渠道线索获取与筛选' },
      { name: '投放优化', icon: 'TrendingUp', description: '广告投放策略与ROI优化' },
      { name: '客户培育', icon: 'Users', description: '自动化客户培育与跟进' },
      { name: '数据洞察', icon: 'BarChart', description: '获客数据分析与趋势预测' },
    ],
    tools: [
      { name: '广告投放平台', icon: 'Megaphone', category: 'communication', description: '百度/头条/腾讯广告管理' },
      { name: 'CRM系统', icon: 'Database', category: 'data', description: '客户关系管理' },
      { name: '数据分析引擎', icon: 'BarChart', category: 'analysis', description: '多维度数据分析' },
      { name: '邮件营销', icon: 'Mail', category: 'communication', description: '自动化邮件营销' },
    ],
    harness: [
      { title: '市场洞察', content: '实时追踪市场动态与竞争格局' },
      { title: '增长策略', content: '制定数据驱动的增长策略' },
    ],
    modelInfo: {
      base: 'Claude Sonnet 4',
      reasoning: '数据分析 + 策略推理',
      context: '200K tokens',
      specialization: '增长营销与客户获取',
    },
    memorySystem: {
      description: '增长记忆体——持续优化获客模型',
      layers: ['客户画像库', '投放策略历史', '转化漏斗数据', '行业基准数据'],
    },
    workspace: {
      type: 'chat-board',
      label: '小可工作台',
      description: '对话驱动 + 线索看板',
    },
    onboardingPreferences: [
      { key: 'target_audience', label: '目标客户', type: 'textarea', placeholder: '描述你的理想客户...' },
      { key: 'channels', label: '主要获客渠道', type: 'select', options: ['搜索引擎', '社交媒体', '内容营销', '线下活动'] },
      { key: 'budget', label: '月度预算', type: 'select', options: ['1万以下', '1-5万', '5-20万', '20万以上'] },
    ],
    trainingDataSources: ['历史客户数据', '投放报表', '行业报告', 'CRM导出'],
    stats: { monthlyTasks: 203, hoursSaved: 95, satisfaction: 94 },
  },

  // ─── 3. 书熙 Shuxi — 法务合规顾问 ───
  {
    id: 'shuxi',
    name: '书熙',
    englishName: 'Shuxi',
    role: '法务合规顾问',
    tagline: '让法律风险无处遁形',
    introduction:
      '我是书熙，你的智能法务合规顾问。我能快速审阅合同、识别风险条款、查询法规政策，帮助企业建立完善的合规体系。我的记忆系统持续积累你的合同模板和审核偏好，越用越懂你。',
    avatar: '⚖️',
    color: 'from-purple-500 to-violet-400',
    accentColor: 'text-purple-600',
    status: 'inactive',
    model: 'Claude Sonnet 4',
    capabilities: ['合同审阅', '风险识别', '法规查询', '合规检查', '文书起草', '尽调'],
    skills: [
      { name: '合同智能审阅', icon: 'FileSearch', description: '快速审阅合同并标注风险条款' },
      { name: '法规政策查询', icon: 'BookOpen', description: '实时查询最新法律法规' },
      { name: '合规风险评估', icon: 'Shield', description: '全方位合规风险检测' },
      { name: '法律文书起草', icon: 'Edit', description: '标准法律文书自动生成' },
    ],
    tools: [
      { name: '法规数据库', icon: 'Database', category: 'legal', description: '全国法律法规实时检索' },
      { name: '合同模板库', icon: 'FileText', category: 'legal', description: '标准合同模板管理' },
      { name: '风险评估引擎', icon: 'AlertTriangle', category: 'analysis', description: '智能风险量化评估' },
      { name: '案例检索', icon: 'Search', category: 'legal', description: '司法判例智能检索' },
    ],
    harness: [
      { title: '法律知识', content: '覆盖公司法、合同法、劳动法等主要法律领域' },
      { title: '合规框架', content: '对接企业内部合规制度与审批流程' },
    ],
    modelInfo: {
      base: 'Claude Sonnet 4',
      reasoning: '精确推理 + 法律逻辑',
      context: '200K tokens',
      specialization: '法律文本分析与合规审查',
    },
    memorySystem: {
      description: '法务记忆体——积累企业特有法律偏好',
      layers: ['合同模板库', '审核意见历史', '企业合规规则', '法律法规更新'],
    },
    workspace: {
      type: 'chat-board',
      label: '法务工作台',
      description: '对话驱动 + 文档看板',
      comingSoon: true,
    },
    onboardingPreferences: [
      { key: 'legal_focus', label: '重点法律领域', type: 'select', options: ['合同法', '劳动法', '知识产权', '公司治理'] },
      { key: 'risk_level', label: '风险容忍度', type: 'select', options: ['保守', '适中', '积极'] },
    ],
    trainingDataSources: ['历史合同', '企业章程', '合规手册', '法律意见书'],
    stats: { monthlyTasks: 0, hoursSaved: 0, satisfaction: 0 },
  },

  // ─── 4. 税宝 Shuibao — 财税专家 ───
  {
    id: 'shuibao',
    name: '税宝',
    englishName: 'Shuibao',
    role: '财税专家',
    tagline: '精打细算，分毫必争',
    introduction:
      '我是税宝，你的专属财税专家。我精通中国税法、会计准则和财务管理，能处理发票识别、费用报销、税务筹划和财务报表生成。让复杂的财税工作变得简单高效。',
    avatar: '🧮',
    color: 'from-emerald-500 to-teal-400',
    accentColor: 'text-emerald-600',
    status: 'inactive',
    model: 'GPT-4o',
    capabilities: ['发票处理', '费用报销', '税务筹划', '报表生成', '预算管理', '审计'],
    skills: [
      { name: '智能票据识别', icon: 'ScanLine', description: '自动识别和分类各类发票' },
      { name: '税务筹划', icon: 'Calculator', description: '合法合规的税务优化建议' },
      { name: '财务报表', icon: 'BarChart', description: '自动生成各类财务报表' },
      { name: '费用管理', icon: 'Wallet', description: '费用审批与报销自动化' },
    ],
    tools: [
      { name: '发票OCR', icon: 'ScanLine', category: 'data', description: '智能发票识别与验真' },
      { name: '税务计算引擎', icon: 'Calculator', category: 'finance', description: '各税种自动计算' },
      { name: 'Excel导出', icon: 'Table', category: 'data', description: '财务数据表格导出' },
      { name: '银行对账', icon: 'RefreshCw', category: 'finance', description: '自动银行流水对账' },
    ],
    harness: [
      { title: '财税知识', content: '覆盖增值税、企业所得税、个人所得税等完整税种' },
      { title: '会计准则', content: '对接最新会计准则与财务制度' },
    ],
    modelInfo: {
      base: 'GPT-4o',
      reasoning: '精确计算 + 数值推理',
      context: '128K tokens',
      specialization: '财务分析与税务计算',
    },
    memorySystem: {
      description: '财税记忆体——积累企业财税特征',
      layers: ['企业税务档案', '历史报表', '费用规则', '税收政策更新'],
    },
    workspace: {
      type: 'chat-board',
      label: '财税工作台',
      description: '对话驱动 + 财税看板',
      comingSoon: true,
    },
    onboardingPreferences: [
      { key: 'company_type', label: '企业类型', type: 'select', options: ['一般纳税人', '小规模纳税人', '个体工商户'] },
      { key: 'industry', label: '所属行业', type: 'select', options: ['科技', '贸易', '服务', '制造', '其他'] },
    ],
    trainingDataSources: ['历史账簿', '税务申报表', '企业章程', '银行流水'],
    stats: { monthlyTasks: 0, hoursSaved: 0, satisfaction: 0 },
  },

  // ─── 5. 绿安 Lvan — 安全与风控专员 ───
  {
    id: 'lvan',
    name: '绿安',
    englishName: 'Lvan',
    role: '安全与风控专员',
    tagline: '守护数字资产，防患于未然',
    introduction:
      '我是绿安，负责企业数字安全与风险控制。我持续监控系统安全状态、检测异常行为、管理权限策略，确保你的数字员工团队在安全合规的环境中运行。',
    avatar: '🛡️',
    color: 'from-green-600 to-emerald-500',
    accentColor: 'text-green-600',
    status: 'activating',
    model: 'Claude Sonnet 4',
    capabilities: ['安全监控', '风险预警', '权限管理', '合规审计', '漏洞扫描', '应急响应'],
    skills: [
      { name: '实时安全监控', icon: 'Eye', description: '7x24系统安全状态监控' },
      { name: '风险预警', icon: 'AlertTriangle', description: '智能风险识别与预警' },
      { name: '权限治理', icon: 'Lock', description: '细粒度权限管理与审计' },
      { name: '应急响应', icon: 'Zap', description: '安全事件快速响应处置' },
    ],
    tools: [
      { name: '安全扫描器', icon: 'Shield', category: 'analysis', description: '系统漏洞与风险扫描' },
      { name: '日志分析', icon: 'FileSearch', category: 'analysis', description: '安全日志智能分析' },
      { name: '权限引擎', icon: 'Key', category: 'data', description: '权限策略管理' },
      { name: '告警系统', icon: 'Bell', category: 'communication', description: '多渠道安全告警' },
    ],
    harness: [
      { title: '安全策略', content: '基于企业安全等级的防护策略体系' },
      { title: '合规框架', content: '对接等保、GDPR等合规要求' },
    ],
    modelInfo: {
      base: 'Claude Sonnet 4',
      reasoning: '安全推理 + 异常检测',
      context: '200K tokens',
      specialization: '安全分析与风险评估',
    },
    memorySystem: {
      description: '安全记忆体——积累威胁情报与防护经验',
      layers: ['威胁情报库', '安全事件历史', '权限策略集', '合规规则库'],
    },
    workspace: {
      type: 'chat-board',
      label: '安全中心',
      description: '对话驱动 + 安全看板',
      comingSoon: true,
    },
    onboardingPreferences: [
      { key: 'security_level', label: '安全等级', type: 'select', options: ['基础防护', '等保二级', '等保三级'] },
      { key: 'compliance', label: '合规要求', type: 'select', options: ['等保', 'GDPR', 'SOC2', '无特殊要求'] },
    ],
    trainingDataSources: ['安全策略文档', '系统架构图', '权限清单', '历史安全报告'],
    stats: { monthlyTasks: 12, hoursSaved: 8, satisfaction: 88 },
  },
];
