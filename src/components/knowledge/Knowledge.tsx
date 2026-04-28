// Hub OS - 知识库工作台（SDK knowledge API）
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Database,
  FileSearch,
  FileText,
  FolderOpen,
  Globe,
  HardDrive,
  Layers,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  Upload,
  User,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import type { KnowledgeBase, KnowledgeData } from '../../hooks/useQeeClaw';
import { getClientAsync } from '../../services/qeeclaw';
import { useToast } from '../shared/Toast';

interface KnowledgeProps {
  knowledgeData: KnowledgeData;
  knowledgeLoading: boolean;
  isConnected: boolean;
  onRefresh?: () => void;
  focusAction?: string;
  focusQuery?: string;
}

type UploadMode = 'create' | 'append';
type SearchResult = {
  id: string;
  title: string;
  snippet: string;
  score?: number | null;
  sourceName?: string;
};

const MAX_QUOTA_BYTES = 50 * 1073741824;

function getFileExtension(name: string): string {
  const idx = name.lastIndexOf('.');
  return idx >= 0 ? name.slice(idx).toLowerCase() : '';
}

function resolveUploadFilename(sourceName: string, file: File): string {
  const cleanSource = sourceName.trim();
  if (!cleanSource) return file.name;
  if (getFileExtension(cleanSource)) return cleanSource;
  return `${cleanSource}${getFileExtension(file.name) || '.txt'}`;
}

function getKbIcon(name: string): string {
  if (name.includes('品牌') || name.includes('设计')) return '🎨';
  if (name.includes('员工') || name.includes('档案') || name.includes('人事')) return '👥';
  if (name.includes('产品') || name.includes('文档') || name.includes('技术')) return '📦';
  if (name.includes('销售') || name.includes('客户') || name.includes('数据')) return '📊';
  if (name.includes('制度') || name.includes('手册') || name.includes('规范')) return '📋';
  if (name.includes('媒体') || name.includes('素材') || name.includes('图片')) return '📸';
  return '📁';
}

function formatSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  if (bytes >= 1073741824) return `${(bytes / 1073741824).toFixed(1)} GB`;
  if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${bytes} B`;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '未知';
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

function normalizeResultItems(value: unknown): SearchResult[] {
  if (!value || typeof value !== 'object') return [];
  const raw = value as Record<string, unknown>;
  const items = (raw.results || raw.items || raw.chunks || raw.documents || []) as Record<string, unknown>[];
  if (!Array.isArray(items)) return [];

  return items.map((item, index) => ({
    id: String(item.id || item.chunk_id || `result-${index}`),
    title: String(item.title || item.source_name || item.filename || `片段 ${index + 1}`),
    snippet: String(item.text || item.content || item.snippet || item.chunk || ''),
    score: typeof item.score === 'number' ? item.score : null,
    sourceName: item.source_name ? String(item.source_name) : undefined,
  })).filter((item) => item.title || item.snippet);
}

function getSourceName(kb: KnowledgeBase): string {
  return kb.source_name || kb.name || kb.filename || kb.id;
}

export default function Knowledge({
  knowledgeData,
  knowledgeLoading,
  isConnected,
  onRefresh,
  focusAction,
  focusQuery,
}: KnowledgeProps) {
  const { bases, stats } = knowledgeData;
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadMode, setUploadMode] = useState<UploadMode>('create');
  const [targetSource, setTargetSource] = useState<string | null>(null);
  const [sourceName, setSourceName] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadText, setUploadText] = useState('');
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [probeQuery, setProbeQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);

  const sortedBases = useMemo(() => (
    [...bases].sort((a, b) => String(b.updated_time || '').localeCompare(String(a.updated_time || '')))
  ), [bases]);

  const filteredBases = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return sortedBases;
    return sortedBases.filter((kb) => [
      kb.name,
      kb.description,
      kb.filename,
      kb.agent_code,
      kb.source_name,
    ].some((value) => String(value || '').toLowerCase().includes(query)));
  }, [searchTerm, sortedBases]);

  const selected = useMemo(() => {
    if (!filteredBases.length) return null;
    return filteredBases.find((kb) => kb.id === selectedId) || filteredBases[0];
  }, [filteredBases, selectedId]);

  useEffect(() => {
    if (selected && selected.id !== selectedId) {
      setSelectedId(selected.id);
    }
  }, [selected, selectedId]);

  useEffect(() => {
    if (focusAction !== 'upload') return;
    openCreate(focusQuery || 'Builder 资料源');
  }, [focusAction, focusQuery]);

  const totalSources = stats?.total_bases ?? bases.length;
  const totalChunks = stats?.total_files ?? bases.reduce((sum, kb) => sum + (kb.chunk_count ?? kb.file_count), 0);
  const totalSize = stats?.total_size ?? bases.reduce((sum, kb) => sum + (kb.total_chars ?? kb.total_size), 0);
  const quotaPercent = Math.min((totalSize / MAX_QUOTA_BYTES) * 100, 100);

  function openCreate(initialName = '') {
    setUploadMode('create');
    setTargetSource(null);
    setSourceName(initialName);
    setUploadFile(null);
    setUploadText('');
    setShowUpload(true);
  }

  function openAppend(kb: KnowledgeBase) {
    if (!isConnected) {
      toast('info', 'SDK 离线，暂无法追加资料');
      return;
    }
    const name = getSourceName(kb);
    setUploadMode('append');
    setTargetSource(name);
    setSourceName(name);
    setUploadFile(null);
    setUploadText('');
    setShowUpload(true);
  }

  async function handleIngest() {
    if (!isConnected) {
      toast('error', 'SDK 离线，无法上传');
      return;
    }

    const finalSource = (targetSource || sourceName || uploadFile?.name || '未命名知识库').trim();
    if (!finalSource) {
      toast('error', '请输入知识源名称');
      return;
    }
    if (!uploadFile && !uploadText.trim()) {
      toast('error', '请选择文件或粘贴文本内容');
      return;
    }

    setUploading(true);
    try {
      const client = await getClientAsync();
      await client.knowledge.ingest({
        teamId: 1,
        file: uploadFile || undefined,
        filename: uploadFile ? resolveUploadFilename(finalSource, uploadFile) : undefined,
        contentType: uploadFile?.type || undefined,
        content: uploadFile ? undefined : uploadText,
        sourceName: finalSource,
      });

      toast('success', uploadMode === 'append' ? '资料已追加并开始索引' : '知识源已创建并开始索引');
      setShowUpload(false);
      setSourceName('');
      setUploadFile(null);
      setUploadText('');
      setTargetSource(null);
      await onRefresh?.();
      setSearchResults([]);
    } catch (err) {
      toast('error', err instanceof Error ? err.message : '上传失败，请稍后重试');
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete() {
    if (!selected || !isConnected) return;
    const source = getSourceName(selected);
    setDeleting(true);
    try {
      const client = await getClientAsync();
      await client.knowledge.delete({ teamId: 1, sourceName: source });
      toast('success', `已删除「${selected.name}」`);
      setSelectedId(null);
      setSearchResults([]);
      await onRefresh?.();
    } catch (err) {
      toast('error', err instanceof Error ? err.message : '删除失败');
    } finally {
      setDeleting(false);
    }
  }

  async function handleSearchProbe() {
    if (!isConnected) {
      toast('error', 'SDK 离线，无法检索');
      return;
    }
    if (!probeQuery.trim()) {
      toast('info', '请输入要验证的问题或关键词');
      return;
    }

    setSearching(true);
    try {
      const client = await getClientAsync();
      const result = await client.knowledge.search({
        teamId: 1,
        query: probeQuery.trim(),
        filename: selected ? getSourceName(selected) : undefined,
        limit: 6,
      });
      setSearchResults(normalizeResultItems(result));
    } catch (err) {
      toast('error', err instanceof Error ? err.message : '检索失败');
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }

  const emptyText = !isConnected
    ? '连接本地运行时后可查看和上传知识源'
    : searchTerm
      ? '没有匹配的知识源'
      : '还没有上传任何知识源';

  return (
    <div className="flex-1 overflow-y-auto bg-parchment">
      <div className="px-6 pt-6 pb-4">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-2 font-serif text-2xl text-near-black">
              <Database size={22} className="text-terracotta" />
              知识库
            </h1>
            <p className="mt-1 text-sm text-stone-gray">上传、索引和验证数字员工可用的企业资料。</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-gray" />
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="搜索知识源"
                className="h-9 w-56 rounded-lg border border-border-warm bg-border-cream pl-8 pr-3 text-xs text-near-black outline-none placeholder:text-stone-gray focus:border-terracotta/35"
              />
            </div>
            {onRefresh && (
              <button
                onClick={onRefresh}
                disabled={knowledgeLoading}
                className="flex h-9 items-center gap-1.5 rounded-lg border border-border-warm bg-border-cream px-3 text-xs text-olive-gray transition-colors hover:text-near-black disabled:opacity-40"
              >
                <RefreshCw size={13} className={knowledgeLoading ? 'animate-spin' : ''} />
                刷新
              </button>
            )}
            <button
              onClick={() => openCreate()}
              className="flex h-9 items-center gap-1.5 rounded-lg border border-terracotta/20 bg-terracotta/10 px-3 text-xs font-medium text-terracotta transition-colors hover:bg-terracotta/15"
            >
              <Plus size={14} />
              上传资料
            </button>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          <StatCard icon={<FolderOpen size={16} />} label="知识源" value={String(totalSources)} hint="按 source_name 归档" />
          <StatCard icon={<Layers size={16} />} label="索引片段" value={totalChunks.toLocaleString()} hint="可被检索引用" />
          <StatCard icon={<HardDrive size={16} />} label="存储/字符" value={formatSize(totalSize)} hint={`${quotaPercent.toFixed(2)}% / 50 GB`} />
          <StatCard icon={<ShieldCheck size={16} />} label="权限范围" value={selected?.agent_code || '全员'} hint={selected ? '当前选中知识源' : '默认团队可用'} />
        </div>
      </div>

      <div className="grid min-h-[560px] grid-cols-[minmax(320px,0.95fr)_minmax(420px,1.25fr)] gap-4 px-6 pb-6 max-xl:grid-cols-1">
        <section className="rounded-xl border border-border-cream bg-white/55">
          <div className="flex items-center justify-between border-b border-border-cream px-4 py-3">
            <div>
              <h2 className="font-serif text-sm text-near-black">知识源</h2>
              <p className="mt-0.5 text-[11px] text-stone-gray">点击查看详情，使用上传按钮追加资料。</p>
            </div>
            {knowledgeLoading && <Loader2 size={15} className="animate-spin text-stone-gray" />}
          </div>

          <div className="max-h-[640px] overflow-y-auto p-3">
            {filteredBases.length === 0 ? (
              <EmptyState text={emptyText} onCreate={() => openCreate()} isConnected={isConnected} />
            ) : (
              <div className="space-y-2">
                {filteredBases.map((kb, index) => {
                  const active = selected?.id === kb.id;
                  const chunks = kb.chunk_count ?? kb.file_count;
                  const chars = kb.total_chars ?? kb.total_size;
                  return (
                    <motion.button
                      key={kb.id}
                      type="button"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.025 }}
                      onClick={() => {
                        setSelectedId(kb.id);
                        setSearchResults([]);
                      }}
                      className={`w-full rounded-lg border px-3 py-3 text-left transition-colors ${
                        active
                          ? 'border-terracotta/35 bg-terracotta/8'
                          : 'border-border-cream bg-parchment/55 hover:bg-parchment-hover'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-warm-sand text-xl">
                          {getKbIcon(kb.name)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="truncate text-sm font-medium text-near-black">{kb.name}</div>
                              <div className="mt-0.5 truncate text-[11px] text-stone-gray">
                                {kb.filename || getSourceName(kb)}
                              </div>
                            </div>
                            <ChevronRight size={14} className={active ? 'text-terracotta' : 'text-stone-gray'} />
                          </div>
                          <div className="mt-2 flex flex-wrap gap-1.5 text-[10px]">
                            <Badge>{chunks.toLocaleString()} 片段</Badge>
                            <Badge>{formatSize(chars)}</Badge>
                            <Badge tone={kb.status === 'indexed' ? 'green' : 'warm'}>{kb.status || 'indexed'}</Badge>
                          </div>
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        <section className="rounded-xl border border-border-cream bg-white/55">
          {selected ? (
            <div className="flex h-full flex-col">
              <div className="border-b border-border-cream px-5 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="mb-2 flex items-center gap-2">
                      <span className="text-2xl">{getKbIcon(selected.name)}</span>
                      <h2 className="truncate font-serif text-xl text-near-black">{selected.name}</h2>
                    </div>
                    <div className="flex flex-wrap gap-2 text-[11px] text-stone-gray">
                      <span className="inline-flex items-center gap-1">
                        {selected.agent_code ? <User size={12} /> : <Globe size={12} />}
                        {selected.agent_code ? `授权给 ${selected.agent_code}` : '团队全员可用'}
                      </span>
                      <span>更新于 {formatTime(selected.updated_time)}</span>
                      {selected.mime_type && <span>{selected.mime_type}</span>}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      onClick={() => openAppend(selected)}
                      className="flex h-8 items-center gap-1.5 rounded-lg border border-terracotta/20 bg-terracotta/10 px-3 text-xs text-terracotta hover:bg-terracotta/15"
                    >
                      <Upload size={13} />
                      追加
                    </button>
                    <button
                      onClick={handleDelete}
                      disabled={deleting}
                      className="flex h-8 items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 text-xs text-red-600 hover:bg-red-100 disabled:opacity-50"
                    >
                      {deleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                      删除
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 border-b border-border-cream px-5 py-4 md:grid-cols-3">
                <Metric label="索引片段" value={(selected.chunk_count ?? selected.file_count).toLocaleString()} />
                <Metric label="字符/存储" value={formatSize(selected.total_chars ?? selected.total_size)} />
                <Metric label="状态" value={selected.status || 'indexed'} />
              </div>

              <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
                <div className="rounded-lg border border-border-cream bg-parchment/60 p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <FileSearch size={16} className="text-terracotta" />
                    <h3 className="font-serif text-sm text-near-black">检索验证</h3>
                  </div>
                  <div className="flex gap-2">
                    <input
                      value={probeQuery}
                      onChange={(event) => setProbeQuery(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' && !searching) void handleSearchProbe();
                      }}
                      placeholder="输入一个员工可能会问的问题，验证能否命中资料"
                      className="min-w-0 flex-1 rounded-lg border border-border-warm bg-white/70 px-3 py-2 text-sm text-near-black outline-none placeholder:text-stone-gray focus:border-terracotta/35"
                    />
                    <button
                      onClick={handleSearchProbe}
                      disabled={searching}
                      className="flex items-center gap-1.5 rounded-lg bg-terracotta px-3 py-2 text-sm text-ivory hover:bg-coral disabled:opacity-50"
                    >
                      {searching ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                      检索
                    </button>
                  </div>

                  <div className="mt-3 space-y-2">
                    {searchResults.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-border-cream px-3 py-4 text-center text-xs text-stone-gray">
                        {probeQuery ? '暂无检索结果，换个关键词试试。' : '检索结果会显示命中的片段和来源。'}
                      </div>
                    ) : (
                      searchResults.map((item) => (
                        <div key={item.id} className="rounded-lg border border-border-cream bg-white/70 p-3">
                          <div className="flex items-center justify-between gap-2">
                            <div className="truncate text-xs font-medium text-near-black">{item.title}</div>
                            {item.score != null && <span className="text-[10px] text-stone-gray">score {item.score.toFixed(3)}</span>}
                          </div>
                          <p className="mt-1 line-clamp-3 text-xs leading-5 text-olive-gray">{item.snippet || '该结果未返回可展示文本。'}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="rounded-lg border border-border-cream bg-parchment/60 p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <FileText size={16} className="text-terracotta" />
                    <h3 className="font-serif text-sm text-near-black">资料说明</h3>
                  </div>
                  <div className="grid gap-2 text-xs text-olive-gray">
                    <InfoRow label="知识源标识" value={getSourceName(selected)} />
                    <InfoRow label="文件名" value={selected.filename || selected.name} />
                    <InfoRow label="权限" value={selected.agent_code ? `仅 ${selected.agent_code}` : '团队全员'} />
                    <InfoRow label="更新时间" value={formatTime(selected.updated_time)} />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <EmptyDetail isConnected={isConnected} onCreate={() => openCreate()} />
          )}
        </section>
      </div>

      <UploadDialog
        show={showUpload}
        mode={uploadMode}
        sourceName={sourceName}
        targetSource={targetSource}
        uploadFile={uploadFile}
        uploadText={uploadText}
        uploading={uploading}
        fileInputRef={fileInputRef}
        onClose={() => {
          if (!uploading) setShowUpload(false);
        }}
        onSourceNameChange={setSourceName}
        onFileChange={setUploadFile}
        onTextChange={setUploadText}
        onSubmit={handleIngest}
      />
    </div>
  );
}

function StatCard({ icon, label, value, hint }: { icon: React.ReactNode; label: string; value: string; hint: string }) {
  return (
    <div className="rounded-xl border border-border-cream bg-white/55 p-4">
      <div className="mb-2 flex items-center gap-2 text-xs text-stone-gray">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-terracotta/8 text-terracotta">{icon}</span>
        {label}
      </div>
      <div className="text-2xl font-semibold text-near-black">{value}</div>
      <div className="mt-1 text-[11px] text-stone-gray">{hint}</div>
    </div>
  );
}

function Badge({ children, tone = 'neutral' }: { children: React.ReactNode; tone?: 'neutral' | 'green' | 'warm' }) {
  const cls = tone === 'green'
    ? 'bg-sage-green/10 text-sage-green'
    : tone === 'warm'
      ? 'bg-terracotta/10 text-terracotta'
      : 'bg-warm-sand text-olive-gray';
  return <span className={`rounded-md px-2 py-0.5 ${cls}`}>{children}</span>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-parchment/70 px-3 py-3">
      <div className="text-[11px] text-stone-gray">{label}</div>
      <div className="mt-1 truncate text-sm font-medium text-near-black">{value}</div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-md bg-white/60 px-3 py-2">
      <span className="text-stone-gray">{label}</span>
      <span className="truncate text-right text-near-black">{value}</span>
    </div>
  );
}

function EmptyState({ text, onCreate, isConnected }: { text: string; onCreate: () => void; isConnected: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border-cream px-6 py-16 text-center">
      <Database size={28} className="text-stone-gray" />
      <p className="mt-3 text-sm text-near-black">{text}</p>
      {isConnected && (
        <button onClick={onCreate} className="mt-4 rounded-lg bg-terracotta px-3 py-2 text-xs text-ivory hover:bg-coral">
          上传第一份资料
        </button>
      )}
    </div>
  );
}

function EmptyDetail({ isConnected, onCreate }: { isConnected: boolean; onCreate: () => void }) {
  return (
    <div className="flex h-full min-h-[520px] flex-col items-center justify-center px-8 text-center">
      {isConnected ? <CheckCircle2 size={34} className="text-sage-green" /> : <AlertTriangle size={34} className="text-terracotta" />}
      <h2 className="mt-4 font-serif text-lg text-near-black">{isConnected ? '选择知识源查看详情' : '知识库离线'}</h2>
      <p className="mt-2 max-w-sm text-sm leading-6 text-stone-gray">
        {isConnected ? '上传资料后，可以在这里验证检索结果、追加文件或删除知识源。' : '请先启动本地 bridge，再上传和检索资料。'}
      </p>
      {isConnected && (
        <button onClick={onCreate} className="mt-5 rounded-lg bg-terracotta px-4 py-2 text-sm text-ivory hover:bg-coral">
          上传资料
        </button>
      )}
    </div>
  );
}

function UploadDialog({
  show,
  mode,
  sourceName,
  targetSource,
  uploadFile,
  uploadText,
  uploading,
  fileInputRef,
  onClose,
  onSourceNameChange,
  onFileChange,
  onTextChange,
  onSubmit,
}: {
  show: boolean;
  mode: UploadMode;
  sourceName: string;
  targetSource: string | null;
  uploadFile: File | null;
  uploadText: string;
  uploading: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onClose: () => void;
  onSourceNameChange: (value: string) => void;
  onFileChange: (file: File | null) => void;
  onTextChange: (value: string) => void;
  onSubmit: () => void;
}) {
  const canSubmit = Boolean((uploadFile || uploadText.trim()) && (targetSource || sourceName.trim()));

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-[560px] rounded-xl border border-border-cream bg-ivory p-5 shadow-2xl"
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h3 className="font-serif text-lg text-near-black">
                  {mode === 'append' ? `追加资料到「${targetSource}」` : '上传知识资料'}
                </h3>
                <p className="mt-1 text-xs text-stone-gray">支持文件上传，也可以直接粘贴文本创建知识源。</p>
              </div>
              <button onClick={onClose} disabled={uploading} className="rounded-md p-1 text-stone-gray hover:text-near-black disabled:opacity-40">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3">
              <label className="block">
                <span className="mb-1 block text-xs text-stone-gray">知识源名称</span>
                <input
                  value={targetSource || sourceName}
                  onChange={(event) => onSourceNameChange(event.target.value)}
                  disabled={mode === 'append'}
                  placeholder="例如：品牌手册、销售话术、产品 FAQ"
                  className="w-full rounded-lg border border-border-warm bg-parchment px-3 py-2 text-sm text-near-black outline-none placeholder:text-stone-gray focus:border-terracotta/35 disabled:opacity-70"
                />
              </label>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed border-border-cream bg-parchment/55 px-4 py-7 text-center transition-colors hover:border-terracotta/35"
              >
                <Upload size={22} className="text-terracotta" />
                <span className="text-sm text-near-black">{uploadFile ? uploadFile.name : '点击选择文件'}</span>
                <span className="text-xs text-stone-gray">PDF / TXT / MD / DOCX / CSV</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.txt,.md,.docx,.csv"
                onChange={(event) => onFileChange(event.target.files?.[0] || null)}
              />

              <label className="block">
                <span className="mb-1 block text-xs text-stone-gray">或粘贴文本</span>
                <textarea
                  value={uploadText}
                  onChange={(event) => onTextChange(event.target.value)}
                  rows={5}
                  placeholder="适合 FAQ、话术、制度片段等轻量资料..."
                  className="w-full resize-none rounded-lg border border-border-warm bg-parchment px-3 py-2 text-sm leading-6 text-near-black outline-none placeholder:text-stone-gray focus:border-terracotta/35"
                />
              </label>

              <div className="flex items-center justify-between gap-3 pt-2">
                <p className="text-[11px] text-stone-gray">
                  文件会进入本地 knowledge API 索引，上传完成后列表自动刷新。
                </p>
                <button
                  onClick={onSubmit}
                  disabled={uploading || !canSubmit}
                  className="flex h-9 min-w-[110px] items-center justify-center gap-1.5 rounded-lg bg-terracotta px-4 text-sm text-ivory hover:bg-coral disabled:opacity-50"
                >
                  {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                  {mode === 'append' ? '追加' : '上传'}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
