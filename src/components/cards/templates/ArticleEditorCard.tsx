// 文章编辑卡片 — 标题/正文/标签，可编辑，带平台预览切换
import { useState, useMemo } from 'react';
import { FileText, Eye, Edit3, Hash, Copy, Check, Send } from 'lucide-react';
import type { CardProps } from '../types';

interface ArticleData {
  title: string;
  content: string;
  tags: string[];
  platform: 'wechat' | 'xiaohongshu' | 'douyin';
  wordCount?: number;
}

/**
 * 简易 Markdown 渲染：## 标题、### 子标题、**加粗**、段落分隔
 * 不引入外部库，用正则替换实现
 */
function renderMarkdown(text: string): string {
  // 按段落分割（连续换行视为段落分隔）
  const paragraphs = text.split(/\n{2,}/);

  return paragraphs
    .map((block) => {
      const trimmed = block.trim();
      if (!trimmed) return '';

      // ### 子标题（h3）— 先匹配 ### 再匹配 ##
      if (/^###\s+/.test(trimmed)) {
        const heading = trimmed.replace(/^###\s+/, '');
        return `<h3 class="text-sm font-semibold text-near-black mt-3 mb-1.5">${applyInline(heading)}</h3>`;
      }

      // ## 标题（h2）
      if (/^##\s+/.test(trimmed)) {
        const heading = trimmed.replace(/^##\s+/, '');
        return `<h2 class="text-base font-bold text-near-black mt-4 mb-2">${applyInline(heading)}</h2>`;
      }

      // 普通段落 — 处理单行换行为 <br>
      const lines = trimmed.split(/\n/).map((l) => applyInline(l)).join('<br/>');
      return `<p class="text-xs text-olive-gray leading-relaxed mb-2">${lines}</p>`;
    })
    .join('\n');
}

/** 行内样式：**加粗** */
function applyInline(text: string): string {
  // **加粗**
  return text.replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-near-black">$1</strong>');
}

export default function ArticleEditorCard({ data, editable = true, onEdit, onAction }: CardProps<ArticleData>) {
  const [isEditing, setIsEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [localTitle, setLocalTitle] = useState(data.title);
  const [localContent, setLocalContent] = useState(data.content);

  const platformLabel: Record<string, string> = { wechat: '公众号', xiaohongshu: '小红书', douyin: '抖音' };
  const platformColor: Record<string, string> = { wechat: 'bg-green-500', xiaohongshu: 'bg-red-500', douyin: 'bg-near-black' };
  const platformIcon: Record<string, string> = { wechat: '💬', xiaohongshu: '📕', douyin: '🎵' };

  // 缓存 Markdown 渲染结果
  const renderedContent = useMemo(() => renderMarkdown(data.content), [data.content]);

  // 字数统计：去掉空白和 Markdown 符号
  const wordCount = data.wordCount ?? data.content.replace(/[#*\s\n]/g, '').length;

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
    <div className="rounded-xl border border-border-cream bg-ivory/90 overflow-hidden shadow-sm">
      {/* 淡绿色顶部条 — 呼应公众号绿色 */}
      <div className="h-1.5 bg-gradient-to-r from-green-400 via-green-300 to-emerald-200" />

      {/* header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-warm-sand/30 border-b border-border-cream">
        <div className="flex items-center gap-2">
          <FileText size={14} className="text-terracotta" />
          <span className="text-xs font-medium text-near-black">文章编辑</span>
          <span className={`px-1.5 py-0.5 rounded text-[9px] text-white ${platformColor[data.platform] || 'bg-gray-500'}`}>
            {platformIcon[data.platform] || '📄'} {platformLabel[data.platform] || data.platform}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {editable && (
            <button onClick={() => isEditing ? handleSave() : setIsEditing(true)} className="p-1 rounded hover:bg-warm-sand transition-colors" title={isEditing ? '保存' : '编辑'}>
              <Edit3 size={12} className={isEditing ? 'text-terracotta' : 'text-stone-gray'} />
            </button>
          )}
          <button onClick={() => onAction?.('preview')} className="p-1 rounded hover:bg-warm-sand transition-colors" title="预览">
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
              className="w-full text-xs text-olive-gray bg-parchment border border-border-cream rounded-lg px-3 py-2 h-48 resize-none focus:outline-none focus:border-terracotta/40 custom-scrollbar"
              placeholder="正文内容（支持 Markdown: ## 标题、### 子标题、**加粗**）"
            />
          </>
        ) : (
          <>
            <h4 className="text-base font-serif font-semibold text-near-black leading-snug">{data.title}</h4>
            {/* 正文渲染区：max-height 400px + 滚动 */}
            <div
              className="max-h-[400px] overflow-y-auto pr-1 custom-scrollbar"
              dangerouslySetInnerHTML={{ __html: renderedContent }}
            />
          </>
        )}

        {/* 底部信息栏：标签 + 字数统计 + 平台 + 按钮 */}
        <div className="pt-3 border-t border-border-cream space-y-2.5">
          {/* 标签 */}
          {data.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {data.tags.map((tag) => (
                <span key={tag} className="flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-terracotta/8 text-[10px] text-terracotta">
                  <Hash size={8} />{tag}
                </span>
              ))}
            </div>
          )}

          {/* 字数统计 + 平台标识 + 操作按钮 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-[10px] text-stone-gray">
              <span>📝 {wordCount} 字</span>
              <span className="flex items-center gap-1">
                {platformIcon[data.platform]} {platformLabel[data.platform] || data.platform}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {isEditing && (
                <button onClick={handleSave} className="px-2.5 py-1 rounded-md bg-terracotta text-ivory text-[10px] font-medium hover:bg-terracotta/90 transition-colors">
                  保存
                </button>
              )}
              {/* 复制全文按钮 */}
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 px-2.5 py-1 rounded-md border border-border-cream text-[10px] text-stone-gray hover:bg-warm-sand/50 transition-colors"
              >
                {copied ? <Check size={10} className="text-green-500" /> : <Copy size={10} />}
                {copied ? '已复制' : '复制全文'}
              </button>
              {/* 发布按钮：橙色背景 + 白色文字 */}
              <button
                onClick={() => onAction?.('publish')}
                className="flex items-center gap-1 px-3 py-1 rounded-md bg-orange-500 text-white text-[10px] font-medium hover:bg-orange-600 transition-colors shadow-sm"
              >
                <Send size={10} />
                发布
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
