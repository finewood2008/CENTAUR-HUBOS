// ChatFlow — 统一对话流组件，所有员工共用
import { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import MessageBubble from './MessageBubble';
import CardSlot from './CardSlot';
import type { ChatMsg, ChatFlowConfig, QuickAction } from './types';

interface Props {
  config: ChatFlowConfig;
  messages: ChatMsg[];
  onSend: (text: string) => void;
  isStreaming: boolean;
  onCardEdit?: (msgId: string, field: string, value: any) => void;
  onCardAction?: (msgId: string, action: string, payload?: any) => void;
}

export default function ChatFlow({ config, messages, onSend, isStreaming, onCardEdit, onCardAction }: Props) {
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

  const handleQuickAction = (action: QuickAction) => {
    onSend(action.label);
  };

  return (
    <div className="flex flex-col h-full">
      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${config.employeeColor} flex items-center justify-center text-2xl shadow-md mb-3`}>
              {config.employeeAvatar}
            </div>
            <p className="text-sm text-near-black font-serif font-medium">
              你好，我是{config.employeeName}
            </p>
            <p className="text-xs text-stone-gray mt-1 max-w-[240px]">
              {config.greeting}
            </p>
            {/* 快捷操作 */}
            <div className="flex flex-wrap gap-2 mt-5 justify-center">
              {config.quickActions.map((qa) => (
                <button
                  key={qa.label}
                  onClick={() => handleQuickAction(qa)}
                  className="px-3 py-1.5 rounded-full bg-warm-sand/70 text-xs text-olive-gray hover:bg-terracotta/10 hover:text-terracotta transition-colors"
                >
                  {qa.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => {
          // 卡片消息
          if (msg.card) {
            return (
              <CardSlot
                key={msg.id}
                card={msg.card}
                avatar={config.employeeAvatar}
                onEdit={(field, value) => onCardEdit?.(msg.id, field, value)}
                onAction={(action, payload) => onCardAction?.(msg.id, action, payload)}
              />
            );
          }
          // 文本消息
          if (msg.role === 'system') return null;
          const isLast = i === messages.length - 1;
          return (
            <MessageBubble
              key={msg.id}
              role={msg.role}
              content={msg.content}
              avatar={config.employeeAvatar}
              accentColor={config.accentColor}
              isStreaming={isLast && msg.role === 'assistant' && isStreaming}
            />
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* 输入区域 */}
      <div className="p-3 border-t border-border-cream bg-ivory/50">
        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder={config.placeholder || `和${config.employeeName}说点什么...`}
            rows={1}
            className="flex-1 resize-none rounded-xl border border-border-cream bg-parchment px-3 py-2 text-sm text-near-black placeholder:text-stone-gray/60 focus:outline-none focus:border-terracotta/40 custom-scrollbar"
            style={{ maxHeight: 120 }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isStreaming}
            className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
              input.trim() && !isStreaming
                ? 'bg-terracotta text-ivory hover:bg-terracotta/90'
                : 'bg-warm-sand text-stone-gray cursor-not-allowed'
            }`}
          >
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
