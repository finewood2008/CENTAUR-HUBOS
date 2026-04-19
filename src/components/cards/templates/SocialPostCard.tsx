// 社媒帖子卡片 — 朋友圈/小红书/抖音，含配图占位
import { useState } from 'react';
import { Heart, MessageCircle, Share2, Image, Copy, Check } from 'lucide-react';
import type { CardProps } from '../types';

interface SocialPostData {
  content: string;
  platform: 'xiaohongshu' | 'douyin' | 'moments';
  images?: string[];
  hashtags?: string[];
  likes?: number;
  comments?: number;
}

export default function SocialPostCard({ data, editable, onEdit, onAction }: CardProps<SocialPostData>) {
  const [copied, setCopied] = useState(false);

  const platformStyles: Record<string, { label: string; bg: string; accent: string }> = {
    xiaohongshu: { label: '小红书', bg: 'bg-red-50', accent: 'text-red-500' },
    douyin: { label: '抖音', bg: 'bg-gray-50', accent: 'text-near-black' },
    moments: { label: '朋友圈', bg: 'bg-green-50', accent: 'text-green-600' },
  };

  const style = platformStyles[data.platform] || platformStyles.xiaohongshu;

  const handleCopy = () => {
    const text = data.content + (data.hashtags?.length ? '\n\n' + data.hashtags.map(t => '#' + t).join(' ') : '');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`rounded-xl border border-border-cream overflow-hidden ${style.bg}`}>
      {/* platform header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border-cream/50">
        <span className={`text-xs font-medium ${style.accent}`}>{style.label} 笔记</span>
        <button onClick={handleCopy} className="p-1 rounded hover:bg-white/50 transition-colors">
          {copied ? <Check size={12} className="text-success-green" /> : <Copy size={12} className="text-stone-gray" />}
        </button>
      </div>

      {/* image placeholder */}
      {(data.images?.length || 0) > 0 ? (
        <div className="grid grid-cols-3 gap-0.5 p-0.5">
          {data.images!.slice(0, 6).map((_, i) => (
            <div key={i} className="aspect-square bg-warm-sand/40 flex items-center justify-center">
              <Image size={16} className="text-stone-gray/40" />
            </div>
          ))}
        </div>
      ) : (
        <div className="mx-4 mt-3 aspect-[4/3] bg-warm-sand/30 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <Image size={24} className="text-stone-gray/30 mx-auto" />
            <p className="text-[10px] text-stone-gray/50 mt-1">配图占位</p>
          </div>
        </div>
      )}

      {/* content */}
      <div className="p-4 space-y-2">
        <p className="text-xs text-near-black leading-relaxed whitespace-pre-wrap">{data.content}</p>

        {data.hashtags && data.hashtags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {data.hashtags.map((tag) => (
              <span key={tag} className={`text-[10px] ${style.accent}`}>#{tag}</span>
            ))}
          </div>
        )}

        {/* engagement */}
        <div className="flex items-center gap-4 pt-2 border-t border-border-cream/30 text-[10px] text-stone-gray">
          <span className="flex items-center gap-1"><Heart size={10} />{data.likes || 0}</span>
          <span className="flex items-center gap-1"><MessageCircle size={10} />{data.comments || 0}</span>
          <span className="flex items-center gap-1"><Share2 size={10} />分享</span>
          <div className="flex-1" />
          <button onClick={() => onAction?.('edit')} className="text-terracotta hover:underline">编辑</button>
          <button onClick={() => onAction?.('publish')} className="text-terracotta hover:underline">发布</button>
        </div>
      </div>
    </div>
  );
}
