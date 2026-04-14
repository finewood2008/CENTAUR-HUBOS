// Hub OS - 知识库（占位页面）
import { Database, FolderOpen, FileText, Upload, Search, Plus, HardDrive } from 'lucide-react';
import { motion } from 'framer-motion';

const knowledgeBases = [
  { name: '品牌资料库', icon: '🎨', files: 128, size: '2.3 GB', agent: '火花 Spark', updated: '今天 14:30' },
  { name: '员工档案库', icon: '👥', files: 45, size: '890 MB', agent: 'Linda', updated: '今天 09:15' },
  { name: '产品文档库', icon: '📦', files: 312, size: '5.1 GB', agent: '全员可用', updated: '昨天 18:00' },
  { name: '销售数据库', icon: '📊', files: 89, size: '1.7 GB', agent: '老张', updated: '今天 11:45' },
  { name: '制度手册', icon: '📋', files: 23, size: '156 MB', agent: 'Linda', updated: '3 天前' },
  { name: '媒体素材库', icon: '📸', files: 567, size: '12.8 GB', agent: 'Helen', updated: '昨天 15:20' },
];

export default function Knowledge() {
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
          <div className="text-2xl font-semibold text-white">{knowledgeBases.length}</div>
          <div className="text-[11px] text-gray-500 mt-1">个独立知识库</div>
        </div>
        <div className="bg-white/[0.03] rounded-xl border border-white/5 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center text-green-400">
              <FileText size={18} />
            </div>
            <span className="text-xs text-gray-500">文件总数</span>
          </div>
          <div className="text-2xl font-semibold text-white">{knowledgeBases.reduce((s, k) => s + k.files, 0)}</div>
          <div className="text-[11px] text-gray-500 mt-1">份文档已索引</div>
        </div>
        <div className="bg-white/[0.03] rounded-xl border border-white/5 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400">
              <HardDrive size={18} />
            </div>
            <span className="text-xs text-gray-500">存储用量</span>
          </div>
          <div className="text-2xl font-semibold text-white">23.0 GB</div>
          <div className="text-[11px] text-gray-500 mt-1">/ 50 GB 配额</div>
        </div>
      </div>

      {/* 知识库列表 */}
      <div className="bg-white/[0.03] rounded-xl border border-white/5 p-5">
        <h2 className="text-sm font-medium text-white mb-4">所有知识库</h2>
        <div className="space-y-2">
          {knowledgeBases.map((kb, i) => (
            <motion.div
              key={kb.name}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="flex items-center gap-4 p-3 rounded-lg hover:bg-white/[0.03] transition-colors cursor-pointer group"
            >
              <span className="text-xl">{kb.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-white font-medium">{kb.name}</div>
                <div className="text-[10px] text-gray-600 mt-0.5">{kb.files} 份文件 · {kb.size}</div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-[10px] text-gray-500">授权给：{kb.agent}</div>
                <div className="text-[10px] text-gray-600 mt-0.5">更新于 {kb.updated}</div>
              </div>
              <Upload size={14} className="text-gray-700 group-hover:text-orange-400 transition-colors shrink-0" />
            </motion.div>
          ))}
        </div>
      </div>

      {/* 提示 */}
      <div className="text-center py-8 text-gray-600 text-xs">
        🚧 知识库完整功能正在开发中 — 文件上传、向量索引、权限管理即将上线
      </div>
    </div>
  );
}
