import type { EmployeeTemplate } from '../types';

const baseRuntime = {
  model: 'gpt-4o',
  runtimeType: 'hermes' as const,
  knowledgeScopes: ['tax', 'customer-files'],
  memoryScopes: ['customer-preferences', 'corrections'],
};

export const TAX_EMPLOYEE_TEMPLATES: EmployeeTemplate[] = [
  {
    id: 'document_clerk',
    name: '资料整理员',
    shortName: '资料整理',
    description: '识别客户资料、分类归档、发现缺失项和异常文件。',
    promptHints: ['资料', '整理', '归档', '发票', '文件', '缺失'],
    blueprint: {
      name: '资料整理员',
      roleType: 'document_clerk',
      goal: '自动识别客户提交的财税资料，给出归档建议，并发现缺失、重复和异常文件。',
      serviceTarget: ['会计', '资料主管'],
      responsibilities: ['识别资料类型', '匹配客户和月份', '生成归档建议', '标记异常资料', '汇总缺失资料清单'],
      inputSources: [
        { id: 'local-folder', label: '本地资料文件夹', type: 'local_folder', required: true, description: '客户提交资料的本地同步目录。' },
        { id: 'im-files', label: '企业微信/飞书文件', type: 'im', required: false, description: '客户在 IM 中发送的文件和图片。' },
        { id: 'customer-ledger', label: '客户资料台账', type: 'spreadsheet', required: true, description: '客户名称、所属会计、服务月份等基础信息。' },
      ],
      workflow: [
        { id: 'receive', label: '接收资料', description: '监听本地文件夹和 IM 文件消息。' },
        { id: 'classify', label: '识别分类', description: '识别发票、银行回单、工资表、合同等资料类型。' },
        { id: 'match', label: '客户匹配', description: '根据文件名、内容和台账匹配客户与月份。' },
        { id: 'archive', label: '生成归档建议', description: '输出推荐客户、月份、分类和目录。', requiresApproval: true },
        { id: 'missing', label: '生成缺失清单', description: '对比应收资料清单，生成客户缺失项。' },
      ],
      toolPermissions: [
        { id: 'read-file', label: '读取本地文件', category: 'data', riskLevel: 'medium', description: '读取客户提交的文件用于识别。', approvalRequired: false },
        { id: 'write-archive', label: '写入归档目录', category: 'data', riskLevel: 'high', description: '把资料移动或复制到正式归档目录。', approvalRequired: true },
        { id: 'extract-table', label: '表格字段抽取', category: 'analysis', riskLevel: 'low', description: '解析 Excel/PDF/图片中的关键字段。', approvalRequired: false },
      ],
      approvalPolicies: [
        { id: 'low-confidence', action: '低置信度客户匹配', approverRole: '会计', reason: '避免资料归错客户。', required: true },
        { id: 'formal-archive', action: '正式归档', approverRole: '会计', reason: '正式档案变更需要人工确认。', required: true },
      ],
      exceptionPolicies: [
        { id: 'unknown-customer', condition: '无法识别客户', handling: '进入异常队列', escalation: '提醒资料主管' },
        { id: 'duplicate-file', condition: '疑似重复资料', handling: '标记重复并等待人工确认' },
        { id: 'blurred-file', condition: '图片模糊或字段缺失', handling: '要求客户重新提交' },
      ],
      acceptanceCriteria: [
        { id: 'archive-accuracy', metric: '归档建议准确率', target: '>= 90%', description: '样本中客户与月份匹配正确。' },
        { id: 'missing-coverage', metric: '缺失识别覆盖率', target: '>= 85%', description: '能发现主要缺失资料项。' },
      ],
      launchChecklist: [
        { id: 'folder', label: '已配置本地资料文件夹', status: 'pending', required: true },
        { id: 'approval', label: '正式归档前需要人工确认', status: 'passed', required: true },
      ],
      runtime: baseRuntime,
    },
    viewConfig: {
      template: 'document_processing',
      title: '资料整理员工作台',
      subtitle: '收资料、识别、匹配、归档、发现缺失项',
      kpis: [
        { key: 'newFiles', label: '新资料', value: '0' },
        { key: 'archived', label: '已归档', value: '0', tone: 'success' },
        { key: 'pending', label: '待确认', value: '0', tone: 'warning' },
        { key: 'exceptions', label: '异常', value: '0', tone: 'danger' },
      ],
      leftList: { title: '文件队列', filters: ['新收到', '待确认', '已归档', '异常', '重复'], primaryField: '文件名', secondaryField: '客户 / 月份' },
      mainPanel: [
        { key: 'preview', title: '文件预览', fields: ['文件类型', '关键字段', '识别置信度'] },
        { key: 'match', title: 'AI 匹配建议', fields: ['推荐客户', '推荐月份', '判断依据'] },
      ],
      rightActions: [
        { key: 'confirmArchive', label: '确认归档', approvalRequired: true, riskLevel: 'high' },
        { key: 'markException', label: '标记异常', approvalRequired: false, riskLevel: 'medium' },
        { key: 'rerun', label: '重新识别', approvalRequired: false, riskLevel: 'low' },
      ],
      bottomLogs: { title: '处理日志', fields: ['来源', '识别时间', '人工修改记录', '错误原因'] },
      highlightRules: [
        { key: 'lowConfidence', condition: '置信度低于 80%', tone: 'warning' },
        { key: 'unknownCustomer', condition: '客户无法匹配', tone: 'danger' },
      ],
    },
  },
  {
    id: 'collection_assistant',
    name: '客户催收员',
    shortName: '客户催收',
    description: '检查客户缺失资料，生成催收话术，人工确认后通过 IM 跟进。',
    promptHints: ['催', '客户', '跟进', '缺资料', '企微', '飞书', '话术'],
    blueprint: {
      name: '客户催收员',
      roleType: 'collection_assistant',
      goal: '每月检查客户资料齐套情况，生成温和专业的催收话术，并跟踪客户回复。',
      serviceTarget: ['会计', '主管'],
      responsibilities: ['读取缺失资料清单', '生成客户催收话术', '创建人工确认任务', '发送后跟踪回复', '逾期未回复升级提醒'],
      inputSources: [
        { id: 'missing-list', label: '缺失资料清单', type: 'system', required: true, description: '由资料整理员或台账生成的缺失项。' },
        { id: 'customer-profile', label: '客户档案', type: 'knowledge_base', required: true, description: '客户类型、负责人、历史沟通偏好。' },
        { id: 'im-channel', label: '企业微信/飞书通道', type: 'im', required: true, description: '发送确认后的催收消息。' },
      ],
      workflow: [
        { id: 'check', label: '检查缺失资料', description: '按客户和月份汇总未提交资料。' },
        { id: 'draft', label: '生成催收话术', description: '根据客户类型生成温和、专业、可发送的话术。' },
        { id: 'approve', label: '会计确认', description: '发送客户消息前必须由负责人确认。', requiresApproval: true },
        { id: 'send', label: '发送消息', description: '确认后通过授权通讯渠道发送。', requiresApproval: true },
        { id: 'follow', label: '跟踪回复', description: '客户未回复达到阈值后提醒主管。' },
      ],
      toolPermissions: [
        { id: 'read-missing', label: '读取缺失资料清单', category: 'data', riskLevel: 'low', description: '读取资料整理结果。', approvalRequired: false },
        { id: 'generate-script', label: '生成沟通话术', category: 'generation', riskLevel: 'low', description: '生成多版本催收话术。', approvalRequired: false },
        { id: 'send-im', label: '发送客户消息', category: 'communication', riskLevel: 'high', description: '通过企业微信或飞书发送消息。', approvalRequired: true },
      ],
      approvalPolicies: [
        { id: 'customer-message', action: '发送客户消息', approverRole: '会计', reason: '对外消息必须人工确认。', required: true },
      ],
      communicationStyle: {
        tone: '专业、温和、明确',
        forbiddenWords: ['催债', '最后通牒'],
        notes: '重点客户更温和，长期拖延客户可以更明确。',
      },
      exceptionPolicies: [
        { id: 'no-reply', condition: '客户 3 天未回复', handling: '加入未回复队列', escalation: '提醒主管' },
        { id: 'important-customer', condition: '重点客户', handling: '使用更温和话术并要求主管确认' },
      ],
      acceptanceCriteria: [
        { id: 'response-rate', metric: '催收响应率', target: '>= 60%', description: '客户在指定时间内回复或提交资料。' },
        { id: 'edit-rate', metric: '人工修改率', target: '<= 30%', description: '话术无需大量人工重写。' },
      ],
      launchChecklist: [
        { id: 'channel', label: '已配置企业微信或飞书本地通道', status: 'pending', required: true },
        { id: 'approval', label: '客户消息发送前需要人工确认', status: 'passed', required: true },
      ],
      runtime: baseRuntime,
    },
    viewConfig: {
      template: 'task_followup',
      title: '客户催收员工作台',
      subtitle: '检查缺失资料、生成话术、确认发送、跟踪回复',
      kpis: [
        { key: 'todo', label: '待跟进', value: '0', tone: 'warning' },
        { key: 'sent', label: '已发送', value: '0', tone: 'success' },
        { key: 'noReply', label: '未回复', value: '0', tone: 'danger' },
        { key: 'approval', label: '待确认', value: '0', tone: 'warning' },
      ],
      leftList: { title: '跟进对象', filters: ['待跟进', '待确认', '已发送未回复', '重点客户', '需主管介入'], primaryField: '客户名称', secondaryField: '缺失资料 / 状态' },
      mainPanel: [
        { key: 'customer', title: '客户跟进详情', fields: ['资料缺失项', '最近沟通记录', 'AI 判断'] },
        { key: 'script', title: 'AI 推荐话术', fields: ['温和版', '简洁版', '正式版'] },
      ],
      rightActions: [
        { key: 'approveSend', label: '确认发送', approvalRequired: true, riskLevel: 'high' },
        { key: 'rewriteGentle', label: '换成温和语气', approvalRequired: false, riskLevel: 'low' },
        { key: 'escalate', label: '提醒主管', approvalRequired: true, riskLevel: 'medium' },
      ],
      bottomLogs: { title: '跟进日志', fields: ['生成时间', '确认人', '发送状态', '客户回复'] },
      highlightRules: [
        { key: 'noReply3Days', condition: '3 天未回复', tone: 'danger' },
        { key: 'importantCustomer', condition: '重点客户', tone: 'warning' },
      ],
    },
  },
  {
    id: 'daily_reporter',
    name: '老板日报员',
    shortName: '老板日报',
    description: '汇总资料齐套率、逾期客户、异常风险和 AI 节省时间。',
    promptHints: ['日报', '老板', '汇报', '总结', '报表', '风险'],
    blueprint: {
      name: '老板日报员',
      roleType: 'daily_reporter',
      goal: '每天汇总资料整理和客户跟进结果，生成老板可读的经营简报。',
      serviceTarget: ['老板', '主管'],
      responsibilities: ['汇总关键指标', '提炼异常风险', '生成日报文本', '输出建议动作', '记录历史报告'],
      inputSources: [
        { id: 'run-logs', label: '员工运行日志', type: 'system', required: true, description: '资料整理员和催收员的运行结果。' },
        { id: 'approval-queue', label: '人工确认队列', type: 'system', required: true, description: '待确认和已确认动作。' },
      ],
      workflow: [
        { id: 'collect', label: '收集当日数据', description: '汇总任务、资料、异常、客户回复。' },
        { id: 'analyze', label: '分析关键变化', description: '提炼风险、趋势和需要老板关注的事项。' },
        { id: 'draft-report', label: '生成日报', description: '生成简洁的经营简报。' },
        { id: 'approve-report', label: '发送前确认', description: '正式发送前由主管确认。', requiresApproval: true },
      ],
      toolPermissions: [
        { id: 'read-logs', label: '读取运行日志', category: 'analysis', riskLevel: 'low', description: '读取员工处理记录。', approvalRequired: false },
        { id: 'generate-report', label: '生成日报', category: 'generation', riskLevel: 'medium', description: '生成日报文本和指标摘要。', approvalRequired: true },
      ],
      approvalPolicies: [
        { id: 'formal-report', action: '发送正式日报', approverRole: '主管', reason: '正式汇报发送前需要确认。', required: true },
      ],
      communicationStyle: { tone: '经营简报、简洁、只突出关键风险和动作' },
      exceptionPolicies: [
        { id: 'missing-data', condition: '关键数据缺失', handling: '标注数据缺口，不脑补结论' },
      ],
      acceptanceCriteria: [
        { id: 'report-clarity', metric: '报告可读性', target: '老板 1 分钟内看懂', description: '只保留关键指标、风险和建议动作。' },
      ],
      launchChecklist: [
        { id: 'logs', label: '已接入员工运行日志', status: 'pending', required: true },
        { id: 'approval', label: '正式日报发送前需要人工确认', status: 'passed', required: true },
      ],
      runtime: baseRuntime,
    },
    viewConfig: {
      template: 'report_analysis',
      title: '老板日报员工作台',
      subtitle: '汇总进度、异常、风险和建议动作',
      kpis: [
        { key: 'readyRate', label: '资料齐套率', value: '0%', tone: 'warning' },
        { key: 'risk', label: '异常风险', value: '0', tone: 'danger' },
        { key: 'saved', label: '节省时间', value: '0h', tone: 'success' },
      ],
      leftList: { title: '报告列表', filters: ['今日', '本周', '待确认', '已发送'], primaryField: '报告名称', secondaryField: '生成时间' },
      mainPanel: [
        { key: 'summary', title: '今日摘要', fields: ['一句话总结', '关键风险', '建议动作'] },
        { key: 'metrics', title: '指标与趋势', fields: ['齐套率', '逾期任务', '客户响应率'] },
      ],
      rightActions: [
        { key: 'approveReport', label: '确认发送', approvalRequired: true, riskLevel: 'medium' },
        { key: 'copyText', label: '复制日报', approvalRequired: false, riskLevel: 'low' },
      ],
      bottomLogs: { title: '报告记录', fields: ['生成时间', '确认人', '发送对象'] },
      highlightRules: [
        { key: 'riskCustomers', condition: '异常客户数量增加', tone: 'danger' },
      ],
    },
  },
];

export function findTaxTemplateByRole(roleType: string): EmployeeTemplate | undefined {
  return TAX_EMPLOYEE_TEMPLATES.find((template) => template.id === roleType);
}

export function detectTaxTemplate(text: string): EmployeeTemplate {
  const normalized = text.toLowerCase();
  const matched = TAX_EMPLOYEE_TEMPLATES.find((template) =>
    template.promptHints.some((hint) => normalized.includes(hint.toLowerCase())),
  );
  return matched ?? TAX_EMPLOYEE_TEMPLATES[1];
}
