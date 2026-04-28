// 超级工作台 — 信息流类型定义
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

