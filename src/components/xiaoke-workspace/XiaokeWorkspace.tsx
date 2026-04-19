// XiaokeWorkspace.tsx — 小可获客增长工作台 三栏外壳
import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Brain, Target, TrendingUp, Users, Mail } from 'lucide-react';
import ChatPanel, { type ChatMsg, nextMsgId } from './ChatPanel';
import DashboardPanel from './DashboardPanel';
import StrategyPanel from './StrategyPanel';
import { streamChat } from '../../lib/spark-ai';
import { XIAOKE_SYSTEM_PROMPT, CHANNEL_PROMPTS, type Channel } from '../../data/xiaoke-prompts';
import { useXiaokeMemory } from '../../stores/xiaokeMemoryStore';

interface Props {
  onBack: () => void;
}

const CHANNELS: { key: Channel; label: string; icon: typeof Target }[] = [
  { key: 'search', label: '搜索', icon: Target },
  { key: 'social', label: '社媒', icon: Users },
  { key: 'content', label: '内容', icon: TrendingUp },
  { key: 'email', label: '邮件', icon: Mail },
];

export default function XiaokeWorkspace({ onBack }: Props) {
  const [currentChannel, setCurrentChannel] = useState<Channel>('search');
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [strategyContent, setStrategyContent] = useState('');
  const memoryContext = useXiaokeMemory((s) => s.getFullContext);

  const handleSend = useCallback(async (text: string) => {
    const userMsg: ChatMsg = { id: nextMsgId(), role: 'user', content: text };
    const assistantMsg: ChatMsg = { id: nextMsgId(), role: 'assistant', content: '' };

    setChatMessages((prev) => [...prev, userMsg, assistantMsg]);
    setIsStreaming(true);

    // Build system prompt with memory context
    const memory = memoryContext();
    const channelHint = CHANNEL_PROMPTS[currentChannel];
    const systemPrompt = [
      XIAOKE_SYSTEM_PROMPT,
      memory ? `\n\n## 记忆上下文\n${memory}` : '',
      `\n\n## 当前渠道：${currentChannel}\n${channelHint}`,
    ].join('');

    const allMessages = [
      ...chatMessages.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      { role: 'user' as const, content: text },
    ];

    let fullText = '';

    await streamChat({
      messages: allMessages,
      systemPrompt,
      onDelta: (chunk) => {
        fullText += chunk;
        setChatMessages((prev) => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last && last.role === 'assistant') {
            updated[updated.length - 1] = { ...last, content: fullText };
          }
          return updated;
        });
      },
      onDone: () => {
        setIsStreaming(false);
        // If the response looks like a strategy, also show in dashboard & strategy panel
        if (fullText.includes('##') || fullText.includes('策略') || fullText.includes('方案') || fullText.length > 200) {
          setStrategyContent(fullText);
        }
      },
      onError: (err) => {
        setChatMessages((prev) => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last && last.role === 'assistant') {
            updated[updated.length - 1] = { ...last, content: `⚠️ ${err}` };
          }
          return updated;
        });
        setIsStreaming(false);
      },
    });
  }, [chatMessages, currentChannel, memoryContext]);

  return (
    <motion.div
      className="flex flex-col h-full bg-parchment"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.3 }}
    >
      {/* top bar */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-border-cream bg-parchment/80 backdrop-blur-sm">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-olive-gray hover:text-blue-500 transition-colors"
        >
          <ArrowLeft size={16} />
          <span>返回团队</span>
        </button>

        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-sm">
            🎯
          </div>
          <h1 className="font-serif text-near-black text-base tracking-tight">小可增长工作台</h1>
        </div>

        <div className="flex items-center gap-1">
          {/* channel switcher */}
          {CHANNELS.map((ch) => (
            <button
              key={ch.key}
              onClick={() => setCurrentChannel(ch.key)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-colors ${
                currentChannel === ch.key
                  ? 'bg-blue-500/12 text-blue-600'
                  : 'text-stone-gray hover:bg-warm-sand'
              }`}
            >
              <ch.icon size={12} />
              {ch.label}
            </button>
          ))}

          <div className="w-px h-5 bg-border-cream mx-1" />

          <button
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] text-stone-gray hover:bg-warm-sand transition-colors"
          >
            <Brain size={12} />
            记忆
          </button>
        </div>
      </div>

      {/* three columns */}
      <div className="flex flex-1 overflow-hidden">
        {/* left: chat */}
        <div className="flex-[3] border-r border-border-cream overflow-hidden">
          <ChatPanel
            messages={chatMessages}
            onSend={handleSend}
            isStreaming={isStreaming}
          />
        </div>

        {/* center: dashboard */}
        <div className="flex-[4] border-r border-border-cream overflow-hidden">
          <DashboardPanel strategyContent={strategyContent} />
        </div>

        {/* right: strategy detail */}
        <div className="flex-[3] overflow-hidden">
          <StrategyPanel
            content={strategyContent}
            currentChannel={currentChannel}
          />
        </div>
      </div>
    </motion.div>
  );
}
