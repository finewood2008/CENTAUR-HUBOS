// 卡片消息插槽 — 在对话流中渲染卡片
import CardRenderer from '../cards/CardRenderer';
import type { CardMessage } from '../cards/types';

interface Props {
  card: CardMessage;
  avatar?: string;
  onEdit?: (field: string, value: any) => void;
  onAction?: (action: string, payload?: any) => void;
}

export default function CardSlot({ card, avatar, onEdit, onAction }: Props) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="w-7 h-7 rounded-lg bg-warm-sand/80 flex items-center justify-center text-base shrink-0 mt-0.5">
        {avatar || '🤖'}
      </div>
      <div className="flex-1 max-w-[90%]">
        <CardRenderer message={card} onEdit={onEdit} onAction={onAction} />
      </div>
    </div>
  );
}
