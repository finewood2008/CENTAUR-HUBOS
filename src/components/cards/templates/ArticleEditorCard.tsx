// 文章编辑卡片 — 标题/正文/标签，可编辑，带平台预览切换
import { useState } from 'react';
import { FileText, Eye, Edit3, Hash, Copy, Check } from 'lucide-react';
import type { CardProps } from '../types';

interface ArticleData {
  title: string;
  content: string;
  tags: string[];
  platform: 'wechat' | 'xiaohongshu' | 'douyin';
  wordCount?: number;
}

export default function ArticleEditorCard({ data, editable = true, onEdit, onAction }: CardProps<ArticleData>) {
  const [isEditing, setIsEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [localTitle, setLocalTitle] = useState(data.title);
  const [localContent, setLocalContent] = useState(data.content);

  const platformLabel: Record<string, string> = { wechat: '公众号', xiaohongshu: '小红书', douyin: '抖音' };
  const platformColor: Record<string, string> = { wechat: 'bg-green-500', xiaohongshu: 'bg-red-500', douyin: 'bg-near-black' };

  const handleCopy = () => {
    navigator.clipboard.writeText(data.title + '\n\n' + data.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    onEdit?.('title', localTitle);
    onEdit?.('content', localContent);
    setIsEditing(false);
  };

  return (
    <div className="rounded-xl border border-border-cream bg-ivory/90 overflow-hidden">
      {/* header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-warm-sand/30 border-b border-border-cream">
        <div className="flex items-center gap-2">
          <FileText size={14} className="text-terracotta" />
          <span className="text-xs font-medium text-near-black">文章编辑</span>
          <span className={`px-1.5 py-0.5 rounded text-[9px] text-white ${platformColor[data.platform] || 'bg-gray-500'}`}>
            {platformLabel[data.platform] || data.platform}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {editable && (
            <button onClick={() => isEditing ? handleSave() : setIsEditing(true)} className="p-1 rounded hover:bg-warm-sand transition-colors">
              <Edit3 size={12} className={isEditing ? 'text-terracotta' : 'text-stone-gray'} />
            </button>
          )}
          <button onClick={handleCopy} className="p-1 rounded hover:bg-warm-sand transition-colors">
            {copied ? <Check size={12} className="text-success-green" /> : <Copy size={12} className="text-stone-gray" />}
          </button>
          <button onClick={() => onAction?.('preview')} className="p-1 rounded hover:bg-warm-sand transition-colors">
            <Eye size={12} className="text-stone-gray" />
          </button>
        </div>
      </div>

      {/* content */}
      <div className="p-4 space-y-3">
        {isEditing ? (
          <>
            <input
              value={localTitle}
              onChange={(e) => setLocalTitle(e.target.value)}
              className="w-full text-sm font-medium text-near-black bg-parchment border border-border-cream rounded-lg px-3 py-2 focus:outline-none focus:border-terracotta/40"
              placeholder="标题"
            />
            <textarea
              value={localContent}
              onChange={(e) => setLocalContent(e.target.value)}
              className="w-full text-xs text-olive-gray bg-parchment border border-border-cream rounded-lg px-3 py-2 h-32 resize-none focus:outline-none focus:border-terracotta/40 custom-scrollbar"
              placeholder="正文内容"
            />
          </>
        ) : (
          <>
            <h4 className="text-sm font-serif font-medium text-near-black">{data.title}</h4>
            <p className="text-xs text-olive-gray leading-relaxed line-clamp-6 whitespace-pre-wrap">{data.content}</p>
          </>
        )}

        {/* tags */}
        <div className="flex flex-wrap gap-1.5">
          {data.tags.map((tag) => (
            <span key={tag} className="flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-terracotta/8 text-[10px] text-terracotta">
              <Hash size={8} />{tag}
            </span>
          ))}
        </div>

        {/* word count */}
        <div className="flex items-center justify-between text-[10px] text-stone-gray pt-1 border-t border-border-cream">
          <span>{data.content.length} 字</span>
          <div className="flex gap-2">
            {isEditing && (
              <button onClick={handleSave} className="px-2 py-0.5 rounded bg-terracotta text-ivory text-[10px]">保存</button>
            )}
            <button onClick={() => onAction?.('publish')} className="px-2 py-0.5 rounded bg-terracotta/10 text-terracotta text-[10px] hover:bg-terracotta hover:text-ivory transition-colors">
              发布
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
