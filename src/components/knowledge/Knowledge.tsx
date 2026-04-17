// Hub OS - 知识库（接入 SDK knowledge API）
import { Database, FolderOpen, FileText, Upload, Search, Plus, HardDrive, RefreshCw, User, Globe } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';
import type { KnowledgeData } from '../../hooks/useQeeClaw';
import FileUpload from './upload/FileUpload';

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
  
  const [uploadKbId, setUploadKbId] = useState<string | null>(null);
  const uploadKbName = uploadKbId ? bases.find(b => b.id === uploadKbId)?.name || '未知知识库' : '';

  // 计算统计（如果 API stats 没有就从 bases 汇总）
  const totalBases = stats?.total_bases ?? bases.length;
  const totalFiles = stats?.total_files ?? bases.reduce((s, k) => s + k.file_count, 0);
  const totalSize = stats?.total_size ?? bases.reduce((s, k) => s + k.total_size, 0);

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* 标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold flex items-center gap-2 text-near-black font-serif">
            <Database size={20} className="text-terracotta" />
            知识库
          </h1>
          <p className="text-sm mt-0.5 text-stone-gray">管理数字员工的知识来源和数据权限</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-gray" />
            <input
              placeholder="搜索知识库..."
              className="pl-8 pr-3 py-1.5 rounded-lg text-xs focus:outline-none w-48 bg-border-cream border border-border-warm text-near-black placeholder:text-stone-gray"
            />
          </div>
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={knowledgeLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg transition-colors disabled:opacity-40 bg-border-cream text-olive-gray border border-border-warm"
            >
              <RefreshCw size={12} className={knowledgeLoading ? 'animate-spin' : ''} />
            </button>
          )}
          <button
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg transition-colors bg-terracotta/10 text-terracotta border border-terracotta/20"
          >
            <Plus size={14} /> 新建知识库
          </button>
        </div>
      </div>

      {/* 总览 */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card-glass p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-teal/10 text-teal">
              <FolderOpen size={18} />
            </div>
            <span className="text-xs text-stone-gray">知识库</span>
          </div>
          <div className="text-2xl font-semibold text-near-black">{totalBases}</div>
          <div className="text-[11px] mt-1 text-stone-gray">个独立知识库</div>
        </div>
        <div className="card-glass p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-sage-green/10 text-sage-green">
              <FileText size={18} />
            </div>
            <span className="text-xs text-stone-gray">文件总数</span>
          </div>
          <div className="text-2xl font-semibold text-near-black">{totalFiles.toLocaleString()}</div>
          <div className="text-[11px] mt-1 text-stone-gray">份文档已索引</div>
        </div>
        <div className="card-glass p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-purple/10 text-purple">
              <HardDrive size={18} />
            </div>
            <span className="text-xs text-stone-gray">存储用量</span>
          </div>
          <div className="text-2xl font-semibold text-near-black">{formatSize(totalSize)}</div>
          <div className="text-[11px] mt-1 text-stone-gray">/ 50 GB 配额</div>
        </div>
      </div>

      {/* 知识库列表 */}
      <div className="card-glass p-5">
        <h2 className="text-sm font-medium mb-4 text-near-black font-serif">所有知识库</h2>
        {knowledgeLoading && !hasData ? (
          <div className="text-center py-8 text-xs text-stone-gray">加载中...</div>
        ) : (
          <div className="space-y-2">
            {bases.map((kb, i) => (
              <motion.div
                key={kb.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex items-center gap-4 p-3 rounded-lg transition-colors cursor-pointer group"
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f0eee6')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <span className="text-xl">{getKbIcon(kb.name)}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-near-black">{kb.name}</div>
                  <div className="text-[10px] mt-0.5 text-stone-gray">
                    {kb.description && <span className="mr-2">{kb.description}</span>}
                  </div>
                  <div className="text-[10px] mt-0.5 text-stone-gray">
                    {kb.file_count} 份文件 · {formatSize(kb.total_size)}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[10px] flex items-center gap-1 justify-end text-stone-gray">
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
                  <div className="text-[10px] mt-0.5 text-stone-gray">
                    更新于 {formatTime(kb.updated_time)}
                  </div>
                </div>
                <Upload 
                  size={14} 
                  className="shrink-0 transition-colors text-stone-gray hover:text-terracotta" 
                  onClick={(e) => {
                    e.stopPropagation();
                    setUploadKbId(kb.id);
                  }}
                />
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* 存储用量条 */}
      <div className="card-glass p-5">
        <h2 className="text-sm font-medium mb-3 text-near-black font-serif">存储用量</h2>
        <div className="w-full rounded-full h-2 mb-2 bg-warm-sand">
          <div
            className="h-2 rounded-full transition-all"
            style={{
              background: 'linear-gradient(to right, var(--color-terracotta), var(--color-coral))',
              width: `${Math.min((totalSize / (50 * 1073741824)) * 100, 100)}%`
            }}
          />
        </div>
        <div className="flex justify-between text-[11px] text-stone-gray">
          <span>已用 {formatSize(totalSize)}</span>
          <span>配额 50 GB</span>
        </div>
      </div>

      {/* 弹窗区域 */}
      {uploadKbId && (
        <FileUpload 
          kbName={uploadKbName} 
          onClose={() => setUploadKbId(null)} 
        />
      )}
    </div>
  );
}
