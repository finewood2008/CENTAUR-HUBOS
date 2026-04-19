// ChatColumn.tsx — 左栏对话
import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, User, Bot } from 'lucide-react';

export interface ChatMsg {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

interface Props {
  messages: ChatMsg[];
  onSend: (text: string) => void;
  isStreaming: boolean;
  onArticleGenerated?: (content: string) => void;
}

const QUICK_SUGGESTIONS = [
  '写一篇小红书种草笔记',
  '帮我写公众号文章',
  '生成抖音脚本',
];

export default function ChatColumn({ messages, onSend, isStreaming }: Props) {
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    const text = input.trim();
    if (!text || isStreaming) return;
    onSend(text);
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  };

  return (
    <div className="flex flex-col h-full">
      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4 py-12">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center text-3xl shadow-md">
              🔥
            </div>
            <div>
              <p className="font-serif text-lg text-near-black font-semibold">你好，我是火花</p>
              <p className="text-sm text-stone-gray mt-1">你的品牌创意总监，随时准备为你创作内容</p>
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            {/* 头像 */}
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                msg.role === 'user'
                  ? 'bg-terracotta/10 text-terracotta'
                  : 'bg-gradient-to-br from-orange-500 to-amber-400 text-white'
              }`}
            >
              {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
            </div>

            {/* 气泡 */}
            <div
              className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'bg-terracotta text-white rounded-tr-md'
                  : 'bg-warm-sand/80 text-near-black rounded-tl-md'
              }`}
            >
              {msg.content}
              {msg.role === 'assistant' && isStreaming && msg.id === messages[messages.length - 1]?.id && (
                <span className="inline-block w-1.5 h-4 bg-terracotta/60 ml-0.5 animate-pulse" />
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* 快捷建议 */}
      {messages.length === 0 && (
        <div className="px-4 pb-2 flex flex-wrap gap-2">
          {QUICK_SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => onSend(s)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-warm-sand/60 text-xs text-olive-gray hover:bg-terracotta/10 hover:text-terracotta transition-colors"
            >
              <Sparkles size={11} />
              {s}
            </button>
          ))}
        </div>
      )}

      {/* 输入框 */}
      <div className="p-3 border-t border-border-cream">
        <div className="flex items-end gap-2 bg-warm-sand/40 rounded-xl px-3 py-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder="告诉火花你想创作什么..."
            rows={1}
            className="flex-1 bg-transparent text-sm text-near-black placeholder:text-stone-gray outline-none resize-none max-h-[120px]"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isStreaming}
            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
              input.trim() && !isStreaming
                ? 'bg-terracotta text-white hover:bg-terracotta/90'
                : 'bg-warm-sand text-stone-gray'
            }`}
          >
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
