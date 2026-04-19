// 超级工作台 — 信息流 Mock 数据（与 5 名核心数字员工统一）
export interface FeedItem {
  id: string;
  agentId: string;
  agentName: string;
  agentAvatar: string;        // emoji 或首字符
  agentColor: string;         // 头像背景色
  type: 'report' | 'task_done' | 'approval' | 'alert' | 'insight';
  content: string;
  detail?: string;            // 可展开的详情
  timestamp: string;          // ISO string
  read: boolean;
  actionable?: boolean;       // 需要用户操作
  actionLabel?: string;
}

// Mock 信息流数据（注意：实际使用的是 mock.ts 的 ACTIVITY_FEED，此处保留作为 fallback/参考）
const now = Date.now();
const mins = (n: number) => new Date(now - n * 60_000).toISOString();

export const MOCK_FEED: FeedItem[] = [
  {
    id: 'f1',
    agentId: 'spark',
    agentName: '火花 Spark',
    agentAvatar: '🔥',
    agentColor: '#c96442',
    type: 'task_done',
    content: '品牌 VI 手册第 3 版已生成完毕',
    detail: '包含 Logo 规范、色彩体系、字体规范、名片模板共 28 页，已导出 PDF 至品牌资料库。',
    timestamp: mins(3),
    read: false,
  },
  {
    id: 'f2',
    agentId: 'shuxi',
    agentName: '书熙 Shuxi',
    agentAvatar: '⚖️',
    agentColor: '#7c5ea0',
    type: 'approval',
    content: '供应商合同审阅完成，发现 2 处风险条款',
    detail: '深圳某科技有限公司采购合同：第7条违约金比例偏高，第12条知识产权归属约定模糊。',
    timestamp: mins(12),
    read: false,
    actionable: true,
    actionLabel: '去审批',
  },
  {
    id: 'f3',
    agentId: 'xiaoke',
    agentName: '小可 Xiaoke',
    agentAvatar: '🎯',
    agentColor: '#3b82f6',
    type: 'insight',
    content: '本周线索转化率环比提升 23%，百度渠道表现最佳',
    detail: '百度搜索渠道获客成本降至 ¥45/条，ROI 达到 3.2。建议加大百度投放预算。',
    timestamp: mins(28),
    read: true,
  },
  {
    id: 'f4',
    agentId: 'spark',
    agentName: '火花 Spark',
    agentAvatar: '🔥',
    agentColor: '#c96442',
    type: 'report',
    content: '小红书账号本周数据：新增粉丝 186，互动率 4.2%',
    detail: '表现最好的内容是"AI 如何帮中小企业做品牌"系列第 3 篇，阅读量 2.8w。',
    timestamp: mins(45),
    read: true,
  },
  {
    id: 'f5',
    agentId: 'lvan',
    agentName: '绿安 Lvan',
    agentAvatar: '🛡️',
    agentColor: '#16a34a',
    type: 'alert',
    content: '检测到异常登录尝试，来源 IP 已加入黑名单',
    detail: '来自海外 IP（美国）的暴力破解尝试，已触发防护规则并封禁。建议检查账号安全设置。',
    timestamp: mins(68),
    read: false,
    actionable: true,
    actionLabel: '立即处理',
  },
  {
    id: 'f6',
    agentId: 'shuibao',
    agentName: '税宝 Shuibao',
    agentAvatar: '🧮',
    agentColor: '#0d9488',
    type: 'task_done',
    content: '月度财务报表已自动生成',
    detail: '4 月收入 ¥128,500，支出 ¥86,200，净利润 ¥42,300。详细报表已同步至知识库。',
    timestamp: mins(120),
    read: true,
  },
  {
    id: 'f7',
    agentId: 'shuibao',
    agentName: '税宝 Shuibao',
    agentAvatar: '🧮',
    agentColor: '#0d9488',
    type: 'report',
    content: '增值税申报截止日临近，建议本周内完成',
    detail: '当前已整理进项发票 47 张（¥86,400），销项发票 32 张（¥128,500），税差 ¥4,210。',
    timestamp: mins(180),
    read: true,
  },
];
