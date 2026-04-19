// 小可对话面板
import { useState, useRef, useEffect } from 'react';
import { Send, Target, TrendingUp, Users, BarChart } from 'lucide-react';

export interface ChatMsg {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface Props {
  messages: ChatMsg[];
  onSend: (text: string) => void;
  isStreaming: boolean;
}

const QUICK_ACTIONS = [
  { label: '制定获客方案', icon: Target },
  { label: '优化投放策略', icon: TrendingUp },
  { label: '分析客户画像', icon: Users },
  { label: '查看转化漏斗', icon: BarChart },
];

let msgId = 0;
export function nextMsgId() { return `xk-${Date.now()}-${++msgId}`; }

export default function ChatPanel({ messages, onSend, isStreaming }: Props) {
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    const text = input.trim();
    if (!text || isStreaming) return;
    onSend(text);
    setInput('');
  };

  return (
    <div className="flex flex-col h-full">
      {/* messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-2xl mb-3 shadow-sm">
              🎯
            </div>
            <h3 className="font-serif text-near-black text-lg mb-1">小可 · 获客增长经理</h3>
            <p className="text-xs text-stone-gray mb-5 max-w-[220px]">
              告诉我你的业务和目标客群，<br/>我来帮你制定获客方案
            </p>
            <div className="grid grid-cols-2 gap-2 w-full max-w-[280px]">
              {QUICK_ACTIONS.map((a) => (
                <button
                  key={a.label}
                  onClick={() => onSend(a.label)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-warm-sand/60 hover:bg-blue-50 text-[11px] text-olive-gray hover:text-blue-600 transition-colors text-left"
                >
                  <a.icon size={12} />
                  {a.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'bg-blue-500 text-white rounded-br-md'
                  : 'bg-warm-sand/60 text-near-black rounded-bl-md'
              }`}
            >
              {msg.content}
              {msg.role === 'assistant' && isStreaming && msg.id === messages[messages.length - 1]?.id && (
                <span className="inline-block w-1.5 h-4 bg-blue-400 ml-0.5 animate-pulse rounded-sm" />
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* input */}
      <div className="p-3 border-t border-border-cream">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="描述你的获客需求..."
            className="flex-1 px-3 py-2 rounded-xl bg-warm-sand/40 text-sm text-near-black placeholder:text-stone-gray outline-none focus:ring-1 focus:ring-blue-300 transition-shadow"
            disabled={isStreaming}
          />
          <button
            onClick={handleSend}
            disabled={isStreaming || !input.trim()}
            className="w-8 h-8 rounded-xl bg-blue-500 hover:bg-blue-600 disabled:opacity-40 flex items-center justify-center transition-colors"
          >
            <Send size={14} className="text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}
