// TabKnowledge — RAG 知识库
import { useRef } from 'react';
import { BookOpen, Upload, FileText, Database, CheckCircle2 } from 'lucide-react';
import type { DigitalEmployee } from '../../../types';

interface Props {
  emp: DigitalEmployee;
  config: ReturnType<typeof import('../../../hooks/useEmployeeConfig').useEmployeeConfig>;
  readonly?: boolean;
}

export default function TabKnowledge({ emp, config, readonly }: Props) {
  const { data, uploadKnowledge } = config;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && !readonly) {
      await uploadKnowledge(file);
      e.target.value = '';
    }
  };

  const formatSize = (bytes?: number) => {
    if (!bytes) return '—';
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };

  return (
    <div className="space-y-5">
      {/* Stats */}
      <section className="grid grid-cols-3 gap-3">
        <StatCard icon={<FileText size={14} className="text-terracotta" />} value={data.knowledgeStats.totalDocs} label="知识文档" />
        <StatCard icon={<Database size={14} className="text-terracotta" />} value={data.knowledgeStats.totalChunks || '—'} label="索引分块" />
        <StatCard icon={<CheckCircle2 size={14} className="text-success-green" />} value={data.knowledgeStats.indexStatus} label="索引状态" />
      </section>

      {/* Upload */}
      <section className="card-glass-warm p-5">
        <div className="flex items-center gap-2 mb-3">
          <BookOpen size={14} className="text-terracotta" />
          <h3 className="font-serif text-sm text-near-black font-medium">{emp.name}的知识库</h3>
        </div>
        <p className="text-xs text-olive-gray mb-4">
          {emp.memorySystem.description} · 支持 PDF / DOCX / MD / TXT / XLSX
        </p>
        <input ref={fileInputRef} type="file" onChange={handleUpload} className="hidden" accept=".pdf,.docx,.md,.txt,.xlsx" />
        <button
          onClick={() => !readonly && fileInputRef.current?.click()}
          disabled={readonly}
          className={`
            w-full py-6 rounded-xl border-2 border-dashed flex flex-col items-center gap-2 transition-all
            ${readonly
              ? 'border-border-cream bg-warm-sand/20 cursor-not-allowed opacity-70'
              : 'border-border-cream hover:border-terracotta/40 hover:bg-terracotta/4 cursor-pointer'
            }
          `}
        >
          <Upload size={20} className={readonly ? 'text-stone-gray' : 'text-terracotta'} />
          <span className="text-xs text-stone-gray">
            {readonly ? '该员工尚未激活' : '点击上传文档到知识库'}
          </span>
        </button>
      </section>

      {/* Doc list */}
      <section className="card-glass-warm p-5">
        <h3 className="font-serif text-sm text-near-black font-medium mb-3">已索引文档</h3>
        {data.knowledgeDocs.length === 0 ? (
          <p className="text-xs text-stone-gray text-center py-6">暂无文档</p>
        ) : (
          <div className="space-y-1.5">
            {data.knowledgeDocs.map((doc, i) => (
              <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg bg-warm-sand/30 hover:bg-warm-sand/50 transition-colors">
                <div className="w-8 h-8 rounded-md bg-terracotta/10 flex items-center justify-center">
                  <FileText size={13} className="text-terracotta" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-near-black font-medium truncate">{doc.name}</p>
                  <p className="text-[10px] text-stone-gray">{formatSize(doc.size)} · {doc.createdAt || '—'}</p>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-success-green/10 text-success-green">{doc.status}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 数据源建议 */}
      {emp.trainingDataSources && emp.trainingDataSources.length > 0 && (
        <section className="card-glass-warm p-5">
          <h3 className="font-serif text-sm text-near-black font-medium mb-2">推荐喂入的资料</h3>
          <div className="flex flex-wrap gap-1.5">
            {emp.trainingDataSources.map((s) => (
              <span key={s} className="px-2 py-1 rounded-md bg-warm-sand/60 text-[10px] text-olive-gray">{s}</span>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function StatCard({ icon, value, label }: { icon: React.ReactNode; value: string | number; label: string }) {
  return (
    <div className="card-glass-warm p-3.5 text-center">
      <div className="flex justify-center mb-1">{icon}</div>
      <p className="font-serif text-xl text-near-black">{value}</p>
      <p className="text-[10px] text-stone-gray">{label}</p>
    </div>
  );
}
