// TrialChat — 新员工试用对话（创建后试聊）
import { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Send, UserCheck, ArrowLeft, Sparkles } from 'lucide-react';
import type { DigitalEmployee } from '../../types';

interface Props {
  employee: DigitalEmployee;
  onBack: () => void;
  onConfirm: () => void;
}

interface TrialMessage {
  role: 'user' | 'ai';
  content: string;
}

// Mock responses based on employee role
function getMockReply(employee: DigitalEmployee, userMsg: string, msgCount: number): string {
  const name = employee.name;
  const role = employee.role;
  const caps = employee.capabilities.slice(0, 3).join('、');

  const greetings = [
    `你好！我是${name}，很高兴认识你。作为你的${role}，我可以帮你处理${caps}等方面的工作。有什么想了解的吗？`,
    `嗨！${name}正式向你报到 🙌 我的专长是${caps}。你可以先给我一个小任务试试？`,
  ];

  const responses = [
    `明白了！这个需求属于我的核心能力范围。让我简单分析一下：基于你描述的情况，我建议从以下几个方面入手...\n\n1. 首先梳理现有资源和优先级\n2. 制定分阶段的执行计划\n3. 建立反馈和迭代机制\n\n正式入职后，我可以更深入地分析并给出具体方案。`,
    `好问题！这正是我擅长的领域。在${caps}方面，我可以提供系统化的解决方案。\n\n实际工作中，我会：\n• 先了解你的具体业务场景\n• 然后匹配最佳实践方案\n• 最后持续优化和迭代\n\n现在是试用阶段，正式激活后能力会更完整哦！`,
    `收到！这个任务我可以拆解为几个步骤来完成。在我的工具集中，有专门用于处理这类工作的能力模块。\n\n给我一点时间，我先整理一个初步方案给你看看... 对了，如果你觉得满意，可以点击"确认加入团队"把我正式留下来 😊`,
    `非常感谢你的信任！作为${role}，我会全力以赴。\n\n目前试用模式下，我可以展示基本的交互和思维方式。正式入职后，我的记忆系统会逐步学习你的业务偏好，服务会越来越精准。\n\n还有其他想测试的吗？`,
  ];

  if (msgCount === 0) {
    return greetings[Math.floor(Math.random() * greetings.length)];
  }

  return responses[Math.min(msgCount - 1, responses.length - 1)];
}

export default function TrialChat({ employee, onBack, onConfirm }: Props) {
  const [messages, setMessages] = useState<TrialMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const msgCountRef = useRef(0);

  // Send initial greeting
  useEffect(() => {
    const greeting = getMockReply(employee, '', 0);
    setMessages([{ role: 'ai', content: greeting }]);
  }, [employee]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, loading]);

  const send = useCallback(() => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setMessages((prev) => [...prev, { role: 'user', content: userMsg }]);
    setInput('');
    setLoading(true);
    msgCountRef.current += 1;

    // Simulate response delay
    setTimeout(() => {
      const reply = getMockReply(employee, userMsg, msgCountRef.current);
      setMessages((prev) => [...prev, { role: 'ai', content: reply }]);
      setLoading(false);
    }, 800 + Math.random() * 600);
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
