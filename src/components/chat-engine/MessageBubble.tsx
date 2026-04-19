// 文本消息气泡
import { Bot, User } from 'lucide-react';

interface Props {
  role: 'user' | 'assistant';
  content: string;
  avatar?: string;
  accentColor?: string;
  isStreaming?: boolean;
}

export default function MessageBubble({ role, content, avatar, accentColor = 'text-terracotta', isStreaming }: Props) {
  if (role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] px-4 py-2.5 rounded-2xl rounded-tr-md bg-terracotta text-ivory text-sm leading-relaxed shadow-sm">
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2.5">
      <div className="w-7 h-7 rounded-lg bg-warm-sand/80 flex items-center justify-center text-base shrink-0 mt-0.5">
        {avatar || '🤖'}
      </div>
      <div className="max-w-[85%] px-4 py-2.5 rounded-2xl rounded-tl-md bg-warm-sand/60 text-near-black text-sm leading-relaxed">
        {content}
        {isStreaming && (
          <span className={`inline-block w-1.5 h-4 ml-0.5 rounded-sm ${accentColor?.replace('text-', 'bg-') || 'bg-terracotta'} animate-pulse`} />
        )}
      </div>
    </div>
  );
}
