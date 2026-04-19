// 统一卡片渲染器 — 根据 template 名称分发到对应组件
import { CardRegistry } from './CardRegistry';
import type { CardMessage, CardProps } from './types';

interface CardRendererProps {
  message: CardMessage;
  onEdit?: (field: string, value: any) => void;
  onAction?: (action: string, payload?: any) => void;
}

export default function CardRenderer({ message, onEdit, onAction }: CardRendererProps) {
  const info = CardRegistry.get(message.template);

  if (!info) {
    return (
      <div className="p-3 rounded-xl bg-amber-500/10 text-amber-700 text-xs">
        未知卡片模板: {message.template}
      </div>
    );
  }

  const Component = info.component;
  return (
    <Component
      data={message.data}
      editable={message.editable}
      onEdit={onEdit}
      onAction={onAction}
    />
  );
}
