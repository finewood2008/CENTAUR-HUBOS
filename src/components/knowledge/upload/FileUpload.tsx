// Hub OS - 知识库文件上传组件
import { Upload, X, FileText, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useCallback } from 'react';
import { getKnowledgeModule, globalRuntimeContext } from '../../../services/qeeclaw';

interface FileUploadProps {
  kbName: string;
  onClose: () => void;
}

export default function FileUpload({ kbName, onClose }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [error, setError] = useState('');

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = Array.from(e.dataTransfer.files);
    setFiles(prev => [...prev, ...dropped]);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  }, []);

  const removeFile = useCallback((index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleUpload = useCallback(async () => {
    if (files.length === 0) return;
    setUploading(true);
    setError('');
    try {
      const knowledge = getKnowledgeModule();
      for (const file of files) {
        await knowledge.ingest({
          ...globalRuntimeContext,
          file,
          filename: file.name,
          contentType: file.type || 'application/octet-stream',
        });
      }
      setUploaded(true);
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : '上传失败');
    } finally {
      setUploading(false);
    }
  }, [files, onClose]);

  const formatFileSize = (bytes: number) => {
    if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(1)} MB`;
    if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${bytes} B`;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-[480px] max-h-[80vh] rounded-xl shadow-xl overflow-hidden bg-cream"
        onClick={e => e.stopPropagation()}
      >
        {/* 标题栏 */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-warm">
          <div>
            <h3 className="text-sm font-semibold text-near-black font-serif">
              上传文件
            </h3>
            <p className="text-[11px] text-stone-gray mt-0.5">
              上传到知识库：{kbName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors hover:bg-border-cream text-stone-gray"
          >
            <X size={16} />
          </button>
        </div>

        {/* 拖拽区 */}
        <div className="p-5">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`
              border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer
              ${isDragging
                ? 'border-terracotta bg-terracotta/5'
                : 'border-border-warm hover:border-terracotta/40'
              }
            `}
            onClick={() => document.getElementById('file-input')?.click()}
          >
            {uploaded ? (
              <div className="flex flex-col items-center gap-2">
                <CheckCircle size={32} className="text-sage-green" />
                <span className="text-sm text-sage-green font-medium">上传完成！</span>
              </div>
            ) : (
              <>
                <Upload
                  size={28}
                  className={`mx-auto mb-3 ${isDragging ? 'text-terracotta' : 'text-stone-gray'}`}
                />
                <p className="text-sm text-near-black">
                  拖拽文件到此处，或 <span className="text-terracotta underline">点击选择</span>
                </p>
                <p className="text-[11px] text-stone-gray mt-1.5">
                  支持 PDF、Word、TXT、Markdown 等格式
                </p>
              </>
            )}
            <input
              id="file-input"
              type="file"
              multiple
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>

          {/* 文件列表 */}
          <AnimatePresence>
            {files.length > 0 && !uploaded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mt-4 space-y-2 overflow-hidden"
              >
                {files.map((file, i) => (
                  <motion.div
                    key={`${file.name}-${i}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-3 p-2.5 rounded-lg bg-border-cream"
                  >
                    <FileText size={16} className="text-terracotta shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-near-black truncate">{file.name}</div>
                      <div className="text-[10px] text-stone-gray">{formatFileSize(file.size)}</div>
                    </div>
                    <button
                      onClick={() => removeFile(i)}
                      className="w-5 h-5 flex items-center justify-center rounded transition-colors hover:bg-warm-sand text-stone-gray"
                    >
                      <X size={12} />
                    </button>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
          {error && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
              {error}
            </div>
          )}
        </div>

        {/* 底部操作 */}
        {!uploaded && (
          <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-border-warm">
            <button
              onClick={onClose}
              className="px-4 py-1.5 text-xs rounded-lg transition-colors bg-border-cream text-olive-gray border border-border-warm"
            >
              取消
            </button>
            <button
              onClick={handleUpload}
              disabled={files.length === 0 || uploading}
              className="px-4 py-1.5 text-xs rounded-lg transition-colors disabled:opacity-40 bg-terracotta text-white"
            >
              {uploading ? '上传中...' : `上传 ${files.length > 0 ? `(${files.length})` : ''}`}
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
