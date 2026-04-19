// WechatArticle.tsx — 微信公众号文章排版预览
import { ThumbsUp, MessageCircle, Star, Eye } from 'lucide-react';

interface Props {
  title: string;
  content: string;
  tags: string[];
}

export default function WechatArticle({ title, content, tags }: Props) {
  // 简单解析 markdown 引用和加粗
  const renderContent = (text: string) => {
    if (!text) return <p className="text-gray-400 text-sm">在这里预览你的公众号文章...</p>;

    return text.split('\n').map((line, i) => {
      // 引用块
      if (line.startsWith('> ')) {
        return (
          <blockquote
            key={i}
            className="border-l-[3px] border-green-500 pl-3 my-3 text-[14px] text-gray-600 italic bg-gray-50 py-2 pr-2 rounded-r"
          >
            {line.slice(2)}
          </blockquote>
        );
      }
      // 加粗处理
      const parts = line.split(/(\*\*[^*]+\*\*)/g);
      const rendered = parts.map((part, j) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <strong key={j} className="text-gray-900 font-bold">
              {part.slice(2, -2)}
            </strong>
          );
        }
        return <span key={j}>{part}</span>;
      });

      if (line.trim() === '') return <div key={i} className="h-4" />;

      return (
        <p key={i} className="text-[15px] text-gray-800 leading-[1.8] mb-1">
          {rendered}
        </p>
      );
    });
  };

  return (
    <div className="mx-auto max-w-[375px] bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
      {/* 公众号顶部 */}
      <div className="bg-white px-4 pt-4 pb-2 border-b border-gray-100">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white text-sm font-bold">
            品
          </div>
          <div>
            <p className="text-xs font-medium text-gray-900">品牌创意工作室</p>
            <p className="text-[10px] text-gray-400">刚刚</p>
          </div>
        </div>
      </div>

      {/* 文章标题 */}
      <div className="px-5 pt-4 pb-2">
        <h1 className="text-[20px] font-bold text-gray-900 leading-tight text-center">
          {title || '文章标题预览'}
        </h1>
      </div>

      {/* 文章正文 */}
      <div className="px-5 py-3 max-h-[400px] overflow-y-auto">
        {renderContent(content)}
      </div>

      {/* 标签 */}
      {tags.length > 0 && (
        <div className="px-5 pb-2 flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <span key={tag} className="text-[11px] text-green-600 bg-green-50 px-2 py-0.5 rounded">
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* 底部互动 */}
      <div className="px-5 py-3 border-t border-gray-100 space-y-2">
        <div className="flex items-center justify-between text-gray-400">
          <div className="flex items-center gap-5">
            <button className="flex items-center gap-1 text-xs">
              <ThumbsUp size={14} />
              <span>赞</span>
            </button>
            <button className="flex items-center gap-1 text-xs">
              <Star size={14} />
              <span>在看</span>
            </button>
            <button className="flex items-center gap-1 text-xs">
              <MessageCircle size={14} />
              <span>留言</span>
            </button>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-gray-300">
            <Eye size={12} />
            <span>1.2万</span>
          </div>
        </div>
        <button className="w-full text-center text-xs text-blue-500 py-1">
          阅读原文
        </button>
      </div>
    </div>
  );
}
