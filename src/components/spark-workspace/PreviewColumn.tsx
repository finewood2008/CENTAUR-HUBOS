// PreviewColumn.tsx — 右栏平台预览
import type { Platform } from '../../data/spark-prompts';
import XiaohongshuCard from './platform-renders/XiaohongshuCard';
import WechatArticle from './platform-renders/WechatArticle';
import DouyinCaption from './platform-renders/DouyinCaption';
import { Eye } from 'lucide-react';

interface Props {
  content: string;
  platform: Platform;
}

function parseContent(raw: string): { title: string; content: string; tags: string[] } {
  if (!raw.trim()) return { title: '', content: '', tags: [] };

  const lines = raw.split('\n');
  const title = lines[0] || '';
  const tags: string[] = [];
  const bodyLines: string[] = [];

  // 从第二行开始（跳过标题后的空行）
  let started = false;
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];

    // 收集标签（以 # 开头的行或行内 #tag）
    const tagMatches = line.match(/#([^\s#]+)/g);
    if (tagMatches) {
      tagMatches.forEach((t) => {
        const tag = t.slice(1).trim();
        if (tag && !tags.includes(tag)) tags.push(tag);
      });
    }

    // 检测是否是纯标签行
    const stripped = line.replace(/#[^\s#]+/g, '').trim();
    if (tagMatches && stripped === '') continue; // 纯标签行不加入正文

    if (!started && line.trim() === '') continue; // 跳过标题后的空行
    started = true;
    bodyLines.push(line);
  }

  return { title, content: bodyLines.join('\n').trim(), tags };
}

export default function PreviewColumn({ content, platform }: Props) {
  const parsed = parseContent(content);

  return (
    <div className="flex flex-col h-full">
      {/* 头部 */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border-cream bg-warm-sand/20">
        <Eye size={13} className="text-terracotta" />
        <span className="text-xs text-olive-gray font-medium">
          {platform === 'xiaohongshu' && '小红书预览'}
          {platform === 'wechat' && '公众号预览'}
          {platform === 'douyin' && '抖音预览'}
        </span>
        {!content && (
          <span className="ml-auto text-[10px] text-stone-gray">编辑内容后实时预览</span>
        )}
      </div>

      {/* 预览区 */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50/50">
        <div className="flex items-start justify-center min-h-full py-4">
          {platform === 'xiaohongshu' && (
            <XiaohongshuCard
              title={parsed.title}
              content={parsed.content}
              tags={parsed.tags}
            />
          )}
          {platform === 'wechat' && (
            <WechatArticle
              title={parsed.title}
              content={parsed.content}
              tags={parsed.tags}
            />
          )}
          {platform === 'douyin' && (
            <DouyinCaption
              title={parsed.title}
              content={parsed.content}
              tags={parsed.tags}
            />
          )}
        </div>
      </div>
    </div>
  );
}
