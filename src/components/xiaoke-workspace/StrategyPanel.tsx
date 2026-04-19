// 小可策略面板 — 右栏
import { useState } from 'react';
import { Lightbulb, Copy, Download, Check, BarChart } from 'lucide-react';
import type { Channel } from '../../data/xiaoke-prompts';

interface Props {
  content: string;
  currentChannel: Channel;
}

export default function StrategyPanel({ content, currentChannel }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!content) return;
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const channelLabels: Record<Channel, { label: string; icon: string }> = {
    search: { label: '搜索引擎', icon: '🔍' },
    social: { label: '社交媒体', icon: '📱' },
    content: { label: '内容营销', icon: '📝' },
    email: { label: '邮件营销', icon: '✉️' },
  };

  const ch = channelLabels[currentChannel];

  return (
    <div className="flex flex-col h-full">
      {/* header */}
      <div className="px-4 pt-4 pb-2 border-b border-border-cream">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lightbulb size={14} className="text-blue-500" />
            <h3 className="font-serif text-sm text-near-black font-medium">策略详情</h3>
          </div>
          {content && (
            <div className="flex items-center gap-1">
              <button
                onClick={handleCopy}
                className="p-1.5 rounded-lg hover:bg-warm-sand transition-colors"
                title="复制"
              >
                {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} className="text-stone-gray" />}
              </button>
              <button
                className="p-1.5 rounded-lg hover:bg-warm-sand transition-colors"
                title="导出"
              >
                <Download size={12} className="text-stone-gray" />
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {content ? (
          <div className="space-y-4">
            {/* channel badge */}
            <div className="flex items-center gap-2">
              <span className="text-lg">{ch.icon}</span>
              <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 text-[10px] font-medium">
                {ch.label}
              </span>
            </div>

            {/* strategy content */}
            <div className="text-sm text-olive-gray leading-relaxed whitespace-pre-wrap">
              {content}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-12 h-12 rounded-2xl bg-warm-sand/50 flex items-center justify-center mb-3">
              <BarChart size={20} className="text-stone-gray" />
            </div>
            <p className="text-sm text-stone-gray mb-1">策略详情</p>
            <p className="text-xs text-stone-gray/70 max-w-[180px]">
              在左侧对话中描述获客需求，<br/>小可会在这里展示详细策略
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
