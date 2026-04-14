// Hub OS 类型定义

export type AgentStatus = 'running' | 'idle' | 'error';

export interface Agent {
  id: string;
  name: string;
  role: string;
  avatar: string;
  status: AgentStatus;
  model: string;
  port: number;
  harnessDir: string;
  skills: string[];
  tools: string[];
  dataSources: string[];
  budgetPercent: number;
  budgetUsed: number;
  hireDate: string;
  todayTasks: number;
  todaySummary: string;
}

export interface Template {
  id: string;
  name: string;
  avatar: string;
  desc: string;
  category: string;
  model: string;
  skills: string[];
  color: string;
}

export interface Alert {
  id: string;
  agentId: string;
  agentName: string;
  type: 'quota' | 'error' | 'security';
  message: string;
  time: string;
  severity: 'warning' | 'critical';
}

export interface UsageStat {
  date: string;
  tokens: number;
  cost: number;
}

export interface ChatMessage {
  role: 'user' | 'ai';
  content: string;
}

export type NavTab = 'dashboard' | 'agents' | 'channels' | 'knowledge';
