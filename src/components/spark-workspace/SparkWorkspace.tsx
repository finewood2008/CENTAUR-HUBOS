// SparkWorkspace.tsx — 火花创意工作台 三栏外壳
import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Brain, FileText } from 'lucide-react';
import ChatColumn, { type ChatMsg } from './ChatColumn';
import EditorColumn from './EditorColumn';
import PreviewColumn from './PreviewColumn';
import { streamChat } from '../../lib/spark-ai';
import { SPARK_SYSTEM_PROMPT, PLATFORM_PROMPTS, type Platform } from '../../data/spark-prompts';
import { useSparkMemory } from '../../stores/sparkMemoryStore';

interface Props {
  onBack: () => void;
}

const PLATFORMS: { key: Platform; label: string; icon: string }[] = [
  { key: 'xiaohongshu', label: '小红书', icon: '📕' },
  { key: 'wechat', label: '公众号', icon: '💚' },
  { key: 'douyin', label: '抖音', icon: '🎵' },
];

let msgIdCounter = 0;
function nextId() { return `msg-${Date.now()}-${++msgIdCounter}`; }

export default function SparkWorkspace({ onBack }: Props) {
  const [currentPlatform, setCurrentPlatform] = useState<Platform>('xiaohongshu');
  const [editorContent, setEditorContent] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [showMemory, setShowMemory] = useState(false);

  const memory = useSparkMemory();

  const handleSend = useCallback(
    (text: string) => {
      // 用户消息
      const userMsg: ChatMsg = {
        id: nextId(),
        role: 'user',
        content: text,
        timestamp: Date.now(),
      };

      // 自动检测平台切换
      if (text.includes('小红书')) setCurrentPlatform('xiaohongshu');
      else if (text.includes('公众号')) setCurrentPlatform('wechat');
      else if (text.includes('抖音')) setCurrentPlatform('douyin');

      // 助手占位
      const assistantId = nextId();
      const assistantMsg: ChatMsg = {
        id: assistantId,
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
      };

      setChatMessages((prev) => [...prev, userMsg, assistantMsg]);
      setIsStreaming(true);

      // 拼装 system prompt
      const memoryCtx = memory.getFullContext('full');
      const systemPrompt = [
        SPARK_SYSTEM_PROMPT,
        PLATFORM_PROMPTS[currentPlatform],
        memoryCtx ? `\n---\n以下是用户的品牌记忆:\n${memoryCtx}` : '',
      ].join('\n\n');

      // 构建消息历史（只送最近 20 条）
      const historyMsgs = [...chatMessages.slice(-18), userMsg].map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));

      let fullContent = '';

      streamChat({
        messages: historyMsgs,
        systemPrompt,
        onDelta: (delta) => {
          fullContent += delta;
          setChatMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, content: fullContent } : m,
            ),
          );
        },
        onDone: () => {
          setIsStreaming(false);
          // 如果回复像是一篇文章（超过 100 字），自动填充到编辑器
          if (fullContent.length > 100) {
            setEditorContent(fullContent);
          }
          // 记录上下文
          memory.addContext('最近话题', text);
        },
        onError: (err) => {
          setIsStreaming(false);
          setChatMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? { ...m, content: `⚠️ 请求失败: ${err.message}` }
                : m,
            ),
          );
        },
      });
    },
    [chatMessages, currentPlatform, memory],
  );

  return (
    <motion.div
      className="flex flex-col h-full bg-parchment"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.3 }}
    >
      {/* ── 顶部 bar ── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border-cream bg-white/60 backdrop-blur-sm">
        {/* 左: 返回 */}
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-olive-gray hover:text-terracotta transition-colors"
        >
          <ArrowLeft size={16} />
          <span>返回团队</span>
        </button>

        {/* 中: 标题 */}
        <h1 className="font-serif text-base text-near-black font-semibold flex items-center gap-1.5">
          🔥 火花创意工作台
        </h1>

        {/* 右: 平台切换 + 工具 */}
        <div className="flex items-center gap-2">
          {/* 平台切换 */}
          <div className="flex items-center bg-warm-sand/60 rounded-lg p-0.5">
            {PLATFORMS.map((p) => (
              <button
                key={p.key}
                onClick={() => setCurrentPlatform(p.key)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                  currentPlatform === p.key
                    ? 'bg-white shadow-sm text-terracotta'
                    : 'text-olive-gray hover:text-near-black'
                }`}
              >
                <span>{p.icon}</span>
                {p.label}
              </button>
            ))}
          </div>

          <div className="h-5 w-px bg-border-cream" />

          {/* 记忆按钮 */}
          <button
            onClick={() => setShowMemory(!showMemory)}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-colors ${
              showMemory
                ? 'bg-terracotta/10 text-terracotta'
                : 'text-olive-gray hover:text-terracotta hover:bg-warm-sand'
            }`}
          >
            <Brain size={13} />
            记忆
          </button>

          {/* 草稿按钮 */}
          <button className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-olive-gray hover:text-terracotta hover:bg-warm-sand transition-colors">
            <FileText size={13} />
            草稿
          </button>
        </div>
      </div>

      {/* ── 记忆面板 (可折叠) ── */}
      {showMemory && (
        <div className="px-4 py-3 border-b border-border-cream bg-warm-sand/20 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-near-black">品牌记忆</span>
            <button
              onClick={() => memory.clearAll()}
              className="text-[10px] text-stone-gray hover:text-red-500 transition-colors"
            >
              清空全部
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {/* 品牌档案 */}
            <div className="bg-white/60 rounded-lg p-2.5">
              <p className="text-[10px] text-stone-gray mb-1.5">📋 品牌档案</p>
              {memory.identity.length === 0 ? (
                <p className="text-[10px] text-stone-gray/50">暂无</p>
              ) : (
                memory.identity.map((it) => (
                  <p key={it.key} className="text-[10px] text-olive-gray truncate">
                    {it.key}: {it.value}
                  </p>
                ))
              )}
            </div>
            {/* 偏好 */}
            <div className="bg-white/60 rounded-lg p-2.5">
              <p className="text-[10px] text-stone-gray mb-1.5">⭐ 偏好</p>
              {memory.preferences.length === 0 ? (
                <p className="text-[10px] text-stone-gray/50">暂无</p>
              ) : (
                memory.preferences.map((it) => (
                  <p key={it.key} className="text-[10px] text-olive-gray truncate">
                    {it.key}: {it.value}
                  </p>
                ))
              )}
            </div>
            {/* 上下文 */}
            <div className="bg-white/60 rounded-lg p-2.5">
              <p className="text-[10px] text-stone-gray mb-1.5">💭 上下文</p>
              {memory.context.length === 0 ? (
                <p className="text-[10px] text-stone-gray/50">暂无</p>
              ) : (
                memory.context.slice(-3).map((it) => (
                  <p key={it.key + it.updatedAt} className="text-[10px] text-olive-gray truncate">
                    {it.value}
                  </p>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── 三栏主体 ── */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左: 对话 */}
        <div className="flex-[3] border-r border-border-cream min-w-0">
          <ChatColumn
            messages={chatMessages}
            onSend={handleSend}
            isStreaming={isStreaming}
          />
        </div>

        {/* 中: 编辑器 */}
        <div className="flex-[4] border-r border-border-cream min-w-0">
          <EditorColumn
            content={editorContent}
            onChange={setEditorContent}
            platform={currentPlatform}
          />
        </div>

        {/* 右: 预览 */}
        <div className="flex-[3] min-w-0">
          <PreviewColumn
            content={editorContent}
            platform={currentPlatform}
          />
        </div>
      </div>
    </motion.div>
  );
}
