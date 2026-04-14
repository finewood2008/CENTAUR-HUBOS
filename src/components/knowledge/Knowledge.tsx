// Hub OS - 知识库（接入 SDK knowledge API）
import { Database, FolderOpen, FileText, Upload, Search, Plus, HardDrive, RefreshCw, User, Globe } from 'lucide-react';
import { motion } from 'framer-motion';
import type { KnowledgeData } from '../../hooks/useQeeClaw';

// 知识库图标映射（按关键词匹配）
function getKbIcon(name: string): string {
  if (name.includes('品牌') || name.includes('设计')) return '🎨';
  if (name.includes('员工') || name.includes('档案') || name.includes('人事')) return '👥';
  if (name.includes('产品') || name.includes('文档') || name.includes('技术')) return '📦';
  if (name.includes('销售') || name.includes('客户') || name.includes('数据')) return '📊';
  if (name.includes('制度') || name.includes('手册') || name.includes('规范')) return '📋';
  if (name.includes('媒体') || name.includes('素材') || name.includes('图片')) return '📸';
  return '📁';
}

// 格式化文件大小
function formatSize(bytes: number): string {
  if (bytes >= 1073741824) return `${(bytes / 1073741824).toFixed(1)} GB`;
  if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(0)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${bytes} B`;
}

// 格式化时间
function formatTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffH = Math.floor(diffMs / 3600000);
  const diffD = Math.floor(diffMs / 86400000);

  if (diffH < 1) return '刚刚';
  if (diffH < 24) return `${diffH} 小时前`;
  if (diffD === 1) return '昨天';
  if (diffD < 7) return `${diffD} 天前`;
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

interface KnowledgeProps {
  knowledgeData: KnowledgeData;
  knowledgeLoading: boolean;
  onRefresh?: () => void;
}

export default function Knowledge({ knowledgeData, knowledgeLoading, onRefresh }: KnowledgeProps) {
  const { bases, stats } = knowledgeData;
  const hasData = bases.length > 0;

  // 计算统计（如果 API stats 没有就从 bases 汇总）
  const totalBases = stats?.total_bases ?? bases.length;
  const totalFiles = stats?.total_files ?? bases.reduce((s, k) => s + k.file_count, 0);
  const totalSize = stats?.total_size ?? bases.reduce((s, k) => s + k.total_size, 0);

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* 标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white flex items-center gap-2">
            <Database size={20} className="text-orange-400" />
            知识库
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">管理数字员工的知识来源和数据权限</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              placeholder="搜索知识库..."
              className="pl-8 pr-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-white placeholder-gray-600 focus:outline-none focus:border-orange-500/30 w-48"
            />
          </div>
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={knowledgeLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 text-gray-400 text-xs rounded-lg hover:bg-white/10 transition-colors border border-white/10 disabled:opacity-40"
            >
              <RefreshCw size={12} className={knowledgeLoading ? 'animate-spin' : ''} />
            </button>
          )}
          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500/10 text-orange-400 text-xs rounded-lg hover:bg-orange-500/20 transition-colors border border-orange-500/20">
            <Plus size={14} /> 新建知识库
          </button>
        </div>
      </div>

      {/* 总览 */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white/[0.03] rounded-xl border border-white/5 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
              <FolderOpen size={18} />
            </div>
            <span className="text-xs text-gray-500">知识库</span>
          </div>
          <div className="text-2xl font-semibold text-white">{totalBases}</div>
          <div className="text-[11px] text-gray-500 mt-1">个独立知识库</div>
        </div>
        <div className="bg-white/[0.03] rounded-xl border border-white/5 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center text-green-400">
              <FileText size={18} />
            </div>
            <span className="text-xs text-gray-500">文件总数</span>
          </div>
          <div className="text-2xl font-semibold text-white">{totalFiles.toLocaleString()}</div>
          <div className="text-[11px] text-gray-500 mt-1">份文档已索引</div>
        </div>
        <div className="bg-white/[0.03] rounded-xl border border-white/5 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400">
              <HardDrive size={18} />
            </div>
            <span className="text-xs text-gray-500">存储用量</span>
          </div>
          <div className="text-2xl font-semibold text-white">{formatSize(totalSize)}</div>
          <div className="text-[11px] text-gray-500 mt-1">/ 50 GB 配额</div>
        </div>
      </div>

      {/* 知识库列表 */}
      <div className="bg-white/[0.03] rounded-xl border border-white/5 p-5">
        <h2 className="text-sm font-medium text-white mb-4">所有知识库</h2>
        {knowledgeLoading && !hasData ? (
          <div className="text-center py-8 text-gray-600 text-xs">加载中...</div>
        ) : (
          <div className="space-y-2">
            {bases.map((kb, i) => (
              <motion.div
                key={kb.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex items-center gap-4 p-3 rounded-lg hover:bg-white/[0.03] transition-colors cursor-pointer group"
              >
                <span className="text-xl">{getKbIcon(kb.name)}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-white font-medium">{kb.name}</div>
                  <div className="text-[10px] text-gray-600 mt-0.5">
                    {kb.description && <span className="mr-2">{kb.description}</span>}
                  </div>
                  <div className="text-[10px] text-gray-600 mt-0.5">
                    {kb.file_count} 份文件 · {formatSize(kb.total_size)}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[10px] text-gray-500 flex items-center gap-1 justify-end">
                    {kb.agent_code ? (
                      <>
                        <User size={10} />
                        <span>授权给：{kb.agent_code}</span>
                      </>
                    ) : (
                      <>
                        <Globe size={10} />
                        <span>全员可用</span>
                      </>
                    )}
                  </div>
                  <div className="text-[10px] text-gray-600 mt-0.5">
                    更新于 {formatTime(kb.updated_time)}
                  </div>
                </div>
                <Upload size={14} className="text-gray-700 group-hover:text-orange-400 transition-colors shrink-0" />
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* 存储用量条 */}
      <div className="bg-white/[0.03] rounded-xl border border-white/5 p-5">
        <h2 className="text-sm font-medium text-white mb-3">存储用量</h2>
        <div className="w-full bg-white/5 rounded-full h-2 mb-2">
          <div
            className="bg-gradient-to-r from-orange-500 to-amber-400 h-2 rounded-full transition-all"
            style={{ width: `${Math.min((totalSize / (50 * 1073741824)) * 100, 100)}%` }}
          />
        </div>
        <div className="flex justify-between text-[11px] text-gray-500">
          <span>已用 {formatSize(totalSize)}</span>
          <span>配额 50 GB</span>
        </div>
      </div>
    </div>
  );
}
