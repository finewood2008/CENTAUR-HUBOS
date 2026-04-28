// Hub OS - 聊天区（SDK 对接版）
import { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Loader2 } from 'lucide-react';
import { useChatConversation } from '../../hooks/useQeeClaw';
import type { ConversationHistoryMessage } from '@qeeclaw/core-sdk';

interface ChatAreaProps {
  isConnected: boolean;
  agentId?: number;
  agentName?: string;
}

export default function ChatArea({ isConnected, agentId, agentName = 'Spark (火花)' }: ChatAreaProps) {
  const { messages, loading, sending, sendMessage } = useChatConversation(isConnected);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const hasSdkMessages = messages.length > 0;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const content = input.trim();
    setInput('');

    if (!isConnected) return;
    await sendMessage(content, agentId);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="w-full h-full flex flex-col relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-terracotta/5 blur-[100px]" />
      </div>

      {/* Header */}
      <div className="h-16 border-b border-border-cream flex items-center px-6 bg-ivory/60 backdrop-blur-md z-10">
        <div>
          <h2 className="text-near-black font-medium font-serif">架构师面谈区</h2>
          <p className="text-xs text-stone-gray">
            正在与 {agentName} 对话
            {isConnected && <span className="ml-1 text-success-green">· 在线</span>}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 z-10">
        {loading && (
          <div className="flex justify-center py-8">
            <Loader2 className="w-5 h-5 text-stone-gray animate-spin" />
          </div>
        )}

        {/* SDK messages */}
        {hasSdkMessages && messages.map((msg) => (
          <SdkMessageBubble key={msg.id} message={msg} />
        ))}

        {!hasSdkMessages && !loading && (
          <div className="rounded-2xl border border-dashed border-border-cream bg-parchment/50 p-4 text-sm text-stone-gray">
            {isConnected ? '暂无真实对话记录。发送消息后会写入本地会话 API。' : '当前未连接本地运行时，无法发送或展示对话。'}
          </div>
        )}

        {sending && (
          <div className="flex gap-4 flex-row-reverse">
            <div className="w-8 h-8 rounded-full bg-terracotta/15 border border-terracotta/25 flex items-center justify-center shrink-0">
              <Loader2 className="w-4 h-4 text-terracotta animate-spin" />
            </div>
            <div className="bg-terracotta/10 border border-terracotta/15 rounded-2xl rounded-tr-sm p-4 text-sm text-stone-gray max-w-[80%]">
              正在思考...
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-6 pt-2 z-10">
        <div className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入对话内容..."
            disabled={sending || !isConnected}
            className="input-warm w-full rounded-xl py-3 pl-4 pr-12 text-sm focus:border-terracotta/50 transition-colors disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={sending || !isConnected || !input.trim()}
            className="absolute right-2 p-2 bg-terracotta hover:bg-coral text-ivory rounded-lg transition-colors disabled:opacity-50"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}

function SdkMessageBubble({ message }: { message: ConversationHistoryMessage }) {
  const isUser = message.direction === 'user_to_agent';
  return (
    <div className={`flex gap-4 ${!isUser ? 'flex-row-reverse' : ''}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isUser ? 'bg-warm-sand' : 'bg-terracotta/15 border border-terracotta/25'}`}>
        {isUser ? <User className="w-4 h-4 text-stone-gray" /> : <Bot className="w-4 h-4 text-terracotta" />}
      </div>
      <div className={`rounded-2xl p-4 text-sm text-near-black max-w-[80%] ${isUser ? 'bg-warm-sand rounded-tl-sm' : 'bg-terracotta/10 border border-terracotta/15 rounded-tr-sm'}`}>
        {message.content || '(空消息)'}
      </div>
    </div>
  );
}
