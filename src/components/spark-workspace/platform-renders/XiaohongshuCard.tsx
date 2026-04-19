// XiaohongshuCard.tsx — 小红书笔记卡片预览
import { Heart, MessageCircle, Star, Share2, UserCircle } from 'lucide-react';

interface Props {
  title: string;
  content: string;
  tags: string[];
}

export default function XiaohongshuCard({ title, content, tags }: Props) {
  return (
    <div className="mx-auto max-w-[375px] bg-white rounded-3xl shadow-lg overflow-hidden border border-gray-100">
      {/* 封面图占位 */}
      <div className="w-full aspect-[4/3] bg-gradient-to-br from-rose-300 via-pink-200 to-orange-200 flex items-center justify-center">
        <span className="text-5xl">📸</span>
      </div>

      {/* 内容区 */}
      <div className="p-4 space-y-3">
        {/* 用户信息 */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-pink-400 flex items-center justify-center text-white text-xs">
            <UserCircle size={20} />
          </div>
          <span className="text-xs text-gray-600 font-medium">品牌创意工作室</span>
          <button className="ml-auto text-[10px] px-2 py-0.5 rounded-full border border-red-400 text-red-400">
            关注
          </button>
        </div>

        {/* 标题 */}
        <h3 className="font-bold text-[15px] leading-snug text-gray-900">
          {title || '笔记标题预览'}
        </h3>

        {/* 正文 */}
        <div className="text-[13px] text-gray-700 leading-relaxed whitespace-pre-wrap max-h-[200px] overflow-y-auto">
          {content || '在这里预览你的笔记正文内容...'}
        </div>

        {/* 标签 */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <span key={tag} className="text-[12px] text-blue-500">
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* 互动栏 */}
        <div className="flex items-center gap-6 pt-2 border-t border-gray-100">
          <button className="flex items-center gap-1 text-gray-400 text-xs">
            <Heart size={16} />
            <span>2.3k</span>
          </button>
          <button className="flex items-center gap-1 text-gray-400 text-xs">
            <Star size={16} />
            <span>846</span>
          </button>
          <button className="flex items-center gap-1 text-gray-400 text-xs">
            <MessageCircle size={16} />
            <span>128</span>
          </button>
          <button className="ml-auto text-gray-400">
            <Share2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
