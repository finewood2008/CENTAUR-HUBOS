// 统一对话流类型
import type { CardMessage } from '../cards/types';

export interface ChatMsg {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  card?: CardMessage;     // 如果是卡片消息
}

export interface QuickAction {
  label: string;
  icon?: string;
  action: string;
}

export interface ChatFlowConfig {
  employeeId: string;
  employeeName: string;
  employeeAvatar: string;
  employeeColor: string;      // gradient class
  accentColor: string;        // text color class
  greeting: string;
  quickActions: QuickAction[];
  placeholder?: string;
}

let _msgCounter = 0;
export function nextMsgId(): string {
  return 'msg-' + Date.now() + '-' + (++_msgCounter);
}
