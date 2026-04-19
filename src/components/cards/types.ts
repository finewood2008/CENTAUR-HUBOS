// 卡片系统类型定义
export interface CardMessage {
  type: 'card';
  template: string;
  data: Record<string, any>;
  editable: boolean;
  id?: string;
}

export interface CardProps<T = Record<string, any>> {
  data: T;
  onEdit?: (field: string, value: any) => void;
  onAction?: (action: string, payload?: any) => void;
  editable?: boolean;
}

// 卡片模板注册信息
export interface CardTemplateInfo {
  name: string;
  label: string;
  category: 'content' | 'business' | 'system';
  description: string;
  component: React.ComponentType<CardProps<any>>;
}
