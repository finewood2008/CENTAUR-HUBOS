// EditorColumn.tsx — 中栏 markdown 编辑器
import { FileText, Type, AlignLeft } from 'lucide-react';
import type { Platform } from '../../data/spark-prompts';

interface Props {
  content: string;
  onChange: (content: string) => void;
  platform: Platform;
}

const platformLabel: Record<Platform, string> = {
  xiaohongshu: '小红书笔记',
  wechat: '公众号文章',
  douyin: '抖音脚本',
};

export default function EditorColumn({ content, onChange, platform }: Props) {
  const charCount = content.length;
  const lineCount = content ? content.split('\n').length : 0;

  // 从内容中提取第一行作为标题预览
  const firstLine = content.split('\n')[0] || '';

  return (
    <div className="flex flex-col h-full">
      {/* 工具栏 */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border-cream bg-warm-sand/20">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-olive-gray">
            <FileText size={13} className="text-terracotta" />
            <span className="font-medium">{platformLabel[platform]}</span>
          </div>
          <div className="h-3.5 w-px bg-border-cream" />
          <button className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] text-olive-gray hover:bg-warm-sand transition-colors">
            <Type size={11} />
            标题
          </button>
          <button className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] text-olive-gray hover:bg-warm-sand transition-colors">
            <AlignLeft size={11} />
            正文
          </button>
        </div>

        <div className="flex items-center gap-3 text-[11px] text-stone-gray">
          <span>{charCount} 字</span>
          <span>{lineCount} 行</span>
        </div>
      </div>

      {/* 标题预览 */}
      {firstLine && (
        <div className="px-5 pt-3 pb-1">
          <p className="font-serif text-base text-near-black font-semibold truncate">
            {firstLine}
          </p>
        </div>
      )}

      {/* 编辑器 */}
      <div className="flex-1 overflow-hidden">
        <textarea
          value={content}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`在这里编辑你的${platformLabel[platform]}内容...\n\n第一行会被识别为标题\n后续内容为正文\n最后以 # 开头的行会被识别为标签`}
          className="w-full h-full px-5 py-3 bg-transparent text-[14px] text-near-black leading-relaxed placeholder:text-stone-gray/50 outline-none resize-none font-sans"
          spellCheck={false}
        />
      </div>

      {/* 底部状态栏 */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-border-cream text-[10px] text-stone-gray">
        <span>Markdown 格式 · 自动保存</span>
        <span>
          {platform === 'xiaohongshu' && charCount > 0 && (
            charCount < 300
              ? `建议 300-800 字，还需 ${300 - charCount} 字`
              : charCount > 800
                ? `已超出建议字数 (800)`
                : '✓ 字数合适'
          )}
          {platform === 'wechat' && charCount > 0 && (
            charCount < 800
              ? `建议 800-2500 字，还需 ${800 - charCount} 字`
              : charCount > 2500
                ? `已超出建议字数 (2500)`
                : '✓ 字数合适'
          )}
          {platform === 'douyin' && '脚本格式'}
        </span>
      </div>
    </div>
  );
}
