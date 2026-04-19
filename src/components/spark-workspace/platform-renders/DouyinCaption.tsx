// DouyinCaption.tsx — 抖音视频脚本预览
import { Play, Camera, Mic, Type, Clock } from 'lucide-react';

interface Props {
  title: string;
  content: string;
  tags: string[];
}

interface Scene {
  id: number;
  time: string;
  visual: string;
  voiceover: string;
  subtitle: string;
}

function parseScenes(content: string): Scene[] {
  if (!content) return [];

  const scenes: Scene[] = [];
  const blocks = content.split(/【场景\d+】/g).filter(Boolean);

  blocks.forEach((block, i) => {
    const timeMatch = block.match(/(\d{2}:\d{2}[-–]\d{2}:\d{2})/);
    const visualMatch = block.match(/📷\s*画面[：:]\s*(.+)/);
    const voiceMatch = block.match(/🎤\s*口播[：:]\s*(.+)/);
    const subtitleMatch = block.match(/💬\s*字幕[：:]\s*(.+)/);

    scenes.push({
      id: i + 1,
      time: timeMatch?.[1] || `00:${String(i * 5).padStart(2, '0')}-00:${String((i + 1) * 5).padStart(2, '0')}`,
      visual: visualMatch?.[1]?.trim() || '',
      voiceover: voiceMatch?.[1]?.trim() || '',
      subtitle: subtitleMatch?.[1]?.trim() || '',
    });
  });

  return scenes;
}

export default function DouyinCaption({ title, content, tags }: Props) {
  const scenes = parseScenes(content);

  return (
    <div className="mx-auto max-w-[375px] bg-gray-950 rounded-3xl shadow-lg overflow-hidden text-white">
      {/* 手机状态栏模拟 */}
      <div className="px-5 pt-3 pb-2 flex items-center justify-between text-xs text-gray-400">
        <span>9:41</span>
        <div className="flex items-center gap-2">
          <span>抖音</span>
          <Play size={10} fill="white" />
        </div>
      </div>

      {/* 视频预览占位 */}
      <div className="relative w-full aspect-[9/10] bg-gradient-to-b from-gray-800 via-gray-900 to-black flex flex-col items-center justify-center">
        <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-3">
          <Play size={32} className="text-white/80 ml-1" />
        </div>
        <p className="text-sm text-white/60 font-medium">{title || '视频脚本预览'}</p>

        {/* 右侧互动栏 */}
        <div className="absolute right-3 bottom-20 flex flex-col gap-4 items-center">
          <div className="flex flex-col items-center gap-1">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">❤️</div>
            <span className="text-[10px]">12.3w</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">💬</div>
            <span className="text-[10px]">2846</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">⭐</div>
            <span className="text-[10px]">8.5w</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">↗️</div>
            <span className="text-[10px]">转发</span>
          </div>
        </div>
      </div>

      {/* 分镜脚本列表 */}
      <div className="px-4 py-3 space-y-3 max-h-[300px] overflow-y-auto">
        <h3 className="text-xs text-gray-400 font-medium flex items-center gap-1.5 mb-2">
          <Camera size={12} />
          分镜脚本 · {scenes.length} 个场景
        </h3>

        {scenes.length === 0 ? (
          <div className="text-center py-6 text-gray-500 text-sm">
            AI 生成的脚本将在这里以分镜形式展示
          </div>
        ) : (
          scenes.map((scene) => (
            <div
              key={scene.id}
              className="bg-white/5 rounded-xl p-3 space-y-2 border border-white/5"
            >
              {/* 场景头 */}
              <div className="flex items-center gap-2">
                <span className="bg-pink-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                  S{scene.id}
                </span>
                <span className="text-[11px] text-gray-400 flex items-center gap-1">
                  <Clock size={10} />
                  {scene.time}
                </span>
              </div>

              {/* 画面 */}
              {scene.visual && (
                <div className="flex items-start gap-1.5 text-xs">
                  <Camera size={11} className="text-blue-400 mt-0.5 shrink-0" />
                  <span className="text-gray-300">{scene.visual}</span>
                </div>
              )}

              {/* 口播 */}
              {scene.voiceover && (
                <div className="flex items-start gap-1.5 text-xs">
                  <Mic size={11} className="text-green-400 mt-0.5 shrink-0" />
                  <span className="text-gray-200">{scene.voiceover}</span>
                </div>
              )}

              {/* 字幕 */}
              {scene.subtitle && (
                <div className="flex items-start gap-1.5 text-xs">
                  <Type size={11} className="text-yellow-400 mt-0.5 shrink-0" />
                  <span className="text-yellow-200/80">{scene.subtitle}</span>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* 标签 */}
      {tags.length > 0 && (
        <div className="px-4 pb-3 flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <span key={tag} className="text-[11px] text-cyan-400">
              #{tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
