// TrialChat — 新员工试用对话（创建后试聊）
import { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Send, UserCheck, ArrowLeft, Sparkles } from 'lucide-react';
import type { DigitalEmployee } from '../../types';
import { getModelsModule } from '../../services/qeeclaw';

interface Props {
  employee: DigitalEmployee;
  onBack: () => void;
  onConfirm: () => void;
}

interface TrialMessage {
  role: 'user' | 'ai';
  content: string;
}

export default function TrialChat({ employee, onBack, onConfirm }: Props) {
  const [messages, setMessages] = useState<TrialMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages([{
      role: 'ai',
      content: `你好，我是 ${employee.name}。当前试聊将直接调用本地模型 API。`,
    }]);
  }, [employee]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, loading]);

  const send = useCallback(async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setMessages((prev) => [...prev, { role: 'user', content: userMsg }]);
    setInput('');
    setLoading(true);
    try {
      const prompt = [
        `你正在扮演 HubOS 数字员工「${employee.name}」。`,
        `员工角色：${employee.role}`,
        `定位：${employee.tagline || employee.introduction || '未设置'}`,
        `能力：${employee.capabilities.join('、') || '未设置'}`,
        `用户试聊消息：${userMsg}`,
      ].join('\n');
      const result = await getModelsModule().invoke({ prompt });
      const reply = String(
        typeof result === 'string'
          ? result
          : (result as unknown as Record<string, unknown>)?.text ||
            (result as unknown as Record<string, unknown>)?.content ||
            JSON.stringify(result)
      );
      setMessages((prev) => [...prev, { role: 'ai', content: reply }]);
    } catch (err) {
      const detail = err instanceof Error ? err.message : '模型 API 调用失败';
      setMessages((prev) => [...prev, { role: 'ai', content: `真实模型 API 暂不可用：${detail}` }]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, employee]);

  return (
    <div className="flex-1 flex flex-col bg-parchment">
      {/* Header */}
      <div className="shrink-0 px-6 py-4 border-b border-border-cream bg-parchment/80 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 text-sm text-olive-gray hover:text-terracotta transition-colors"
            >
              <ArrowLeft size={16} />
            </button>
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${employee.color} flex items-center justify-center text-lg shadow-sm`}>
              {employee.avatar}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif text-near-black font-semibold">{employee.name}</h3>
                <span className="text-xs text-olive-gray">{employee.englishName}</span>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/12 text-amber-600 text-[10px] font-medium">
                  试用中
                </span>
              </div>
              <p className="text-xs text-stone-gray">{employee.role}</p>
            </div>
          </div>
          <button
            onClick={onConfirm}
            className="btn-terracotta text-xs px-4 py-2 gap-1.5"
          >
            <UserCheck size={14} />
            确认加入团队
          </button>
        </div>
      </div>

      {/* Chat area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex items-start gap-2.5 max-w-[75%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              {msg.role === 'ai' && (
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${employee.color} flex items-center justify-center text-sm shrink-0 shadow-sm`}>
                  {employee.avatar}
                </div>
              )}
              <div
                className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-terracotta/10 text-near-black rounded-br-md'
                    : 'card-glass-warm text-olive-gray rounded-bl-md'
                }`}
              >
                {msg.content}
              </div>
            </div>
          </motion.div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="flex items-start gap-2.5">
              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${employee.color} flex items-center justify-center text-sm shrink-0 shadow-sm`}>
                {employee.avatar}
              </div>
              <div className="px-4 py-3 rounded-2xl rounded-bl-md card-glass-warm flex items-center gap-1.5">
                {[0, 1, 2].map((d) => (
                  <span
                    key={d}
                    className="w-1.5 h-1.5 bg-terracotta rounded-full animate-bounce"
                    style={{ animationDelay: `${d * 150}ms` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="shrink-0 px-6 py-4 border-t border-border-cream">
        <div className="flex items-center gap-1.5 mb-2">
          <Sparkles size={10} className="text-stone-gray" />
          <span className="text-[10px] text-stone-gray">
            试用模式 · 正式激活后将获得完整能力和记忆系统
          </span>
        </div>
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.nativeEvent.isComposing && !loading && send()}
            placeholder={`和 ${employee.name} 聊几句试试...`}
            disabled={loading}
            className="flex-1 px-4 py-2.5 bg-parchment border border-border-cream rounded-xl text-sm text-near-black placeholder-stone-gray focus:outline-none focus:border-terracotta/25 disabled:opacity-50"
          />
          <button
            onClick={send}
            disabled={loading || !input.trim()}
            className="px-4 py-2.5 bg-terracotta text-white rounded-xl hover:bg-coral transition-colors disabled:opacity-50"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
