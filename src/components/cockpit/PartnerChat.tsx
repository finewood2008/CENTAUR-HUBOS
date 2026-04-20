import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SendHorizontal, Star, Lock, Users, Paperclip, Mic, X, FileText, Image as ImageIcon } from 'lucide-react';
import type {
  ChatMessage,
  MessageSender,
  MessageAttachment,
  TeamMember,
  PartnerProfile,
  TaskStatus,
  InputFile,
} from '../../data/partner';
import { TEAM_MEMBERS, DEFAULT_PARTNER } from '../../data/partner';
import VoiceRecorder from './VoiceRecorder';

// ── Props ──
interface PartnerChatProps {
  messages: ChatMessage[];
  partner: PartnerProfile;
  onSendMessage: (text: string, files?: InputFile[]) => void;
  onMemberClick?: (id: string) => void;
}

export interface TeamBarProps {
  partner: PartnerProfile;
  onInsertMention: (name: string) => void;
  onMemberClick?: (id: string) => void;
}

// ── Status dot colors ──
const STATUS_DOT: Record<TeamMember['status'], string> = {
  online: 'bg-green-500 animate-pulse',
  working: 'bg-amber-400',
  offline: 'bg-gray-300',
};

// ── Attachment renderers ──

function DataCardAttachment({ att }: { att: Extract<MessageAttachment, { type: 'data-card' }> }) {
  return (
    <div className="card-glass mt-2 p-3">
      <p className="text-[11px] font-semibold text-near-black mb-2">{att.title}</p>
      <div className="grid grid-cols-2 gap-2">
        {att.metrics.map((m) => (
          <div key={m.label} className="text-center">
            <p className="text-[15px] font-serif font-bold text-terracotta">{m.value}</p>
            <p className="text-[11px] text-stone-gray">{m.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function TaskListAttachment({ att }: { att: Extract<MessageAttachment, { type: 'task-list' }> }) {
  return (
    <div className="mt-2 space-y-1.5">
      {att.tasks.map((t, i) => (
        <div key={i} className="flex items-center gap-2 card-glass p-2">
          <span className="text-base shrink-0">{t.avatar}</span>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] text-near-black truncate">{t.task}</p>
            <p className="text-[11px] text-stone-gray">{t.employee}</p>
          </div>
          <span className="text-[11px] text-terracotta shrink-0">{t.deadline}</span>
        </div>
      ))}
    </div>
  );
}

function ArticlePreviewAttachment({ att }: { att: Extract<MessageAttachment, { type: 'article-preview' }> }) {
  return (
    <div className="card-glass mt-2 p-3">
      <p className="text-[12px] font-semibold text-near-black leading-snug">{att.title}</p>
      <p className="text-[11px] text-charcoal-warm mt-1 leading-relaxed">{att.summary}</p>
      <div className="flex gap-3 mt-2 text-[11px] text-stone-gray">
        <span>👁 {att.reads.toLocaleString()} 阅读</span>
        <span>🔄 {att.shares} 转发</span>
      </div>
    </div>
  );
}

function ActionButtonsAttachment({ att }: { att: Extract<MessageAttachment, { type: 'action-buttons' }> }) {
  return (
    <div className="flex gap-2 mt-2 flex-wrap">
      {att.buttons.map((b, i) => (
        <button
          key={i}
          className={`text-[12px] px-3 py-1.5 rounded-lg transition-colors ${
            i === 0
              ? 'bg-terracotta text-ivory hover:bg-terracotta/90'
              : 'border border-border-cream text-stone-gray hover:text-near-black hover:border-near-black/20'
          }`}
        >
          {b.label}
        </button>
      ))}
    </div>
  );
}

function TaskCardAttachment({ att }: { att: Extract<MessageAttachment, { type: 'task-card' }> }) {
  const statusLabels: Record<TaskStatus, string> = {
    pending: '待开始',
    in_progress: '进行中',
    completed: '已完成',
    review: '待审批',
  };
  const statusColors: Record<TaskStatus, string> = {
    pending: 'bg-gray-100 text-gray-600',
    in_progress: 'bg-amber-50 text-amber-700',
    completed: 'bg-emerald-50 text-emerald-700',
    review: 'bg-orange-50 text-orange-700',
  };

  return (
    <div className="mt-2 bg-white/80 rounded-xl border border-border-cream/50 p-3 shadow-sm">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-base shrink-0">{att.assigneeAvatar}</span>
        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-semibold text-near-black truncate">{att.title}</p>
          <p className="text-[11px] text-stone-gray">{att.assignee}</p>
        </div>
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 ${statusColors[att.status]}`}>
          {statusLabels[att.status]}
        </span>
      </div>
      {att.progress != null && (
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 rounded-full bg-border-cream/80 overflow-hidden">
            <div
              className="h-full rounded-full bg-terracotta transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, att.progress))}%` }}
            />
          </div>
          <span className="text-[10px] text-stone-gray font-medium tabular-nums">{att.progress}%</span>
        </div>
      )}
    </div>
  );
}

function ImageAttachment({ att }: { att: Extract<MessageAttachment, { type: 'image' }> }) {
  return (
    <div className="mt-2">
      <img
        src={att.url}
        alt={att.name}
        className="max-w-[280px] max-h-[200px] rounded-lg object-cover border border-border-cream/30 cursor-pointer hover:opacity-90 transition-opacity"
        loading="lazy"
      />
      <p className="text-[10px] text-stone-gray mt-1 flex items-center gap-1">
        <ImageIcon size={10} /> {att.name}
      </p>
    </div>
  );
}

function FileAttachment({ att }: { att: Extract<MessageAttachment, { type: 'file' }> }) {
  return (
    <div className="mt-2 flex items-center gap-3 card-glass p-2.5 rounded-lg max-w-[260px] cursor-pointer hover:bg-parchment/80 transition-colors">
      <div className="w-9 h-9 rounded-lg bg-terracotta/10 flex items-center justify-center shrink-0">
        <FileText size={18} className="text-terracotta" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-medium text-near-black truncate">{att.name}</p>
        <p className="text-[10px] text-stone-gray">{att.size}</p>
      </div>
    </div>
  );
}

function VoiceAttachment({ att }: { att: Extract<MessageAttachment, { type: 'voice' }> }) {
  const mins = Math.floor(att.duration / 60);
  const secs = att.duration % 60;
  const barCount = Math.min(Math.max(Math.ceil(att.duration / 2), 6), 20);

  return (
    <div className="mt-2 flex items-center gap-2 card-glass px-3 py-2 rounded-full max-w-[200px] cursor-pointer hover:bg-parchment/80 transition-colors">
      <Mic size={14} className="text-terracotta shrink-0" />
      <div className="flex items-end gap-[2px] h-4 flex-1">
        {Array.from({ length: barCount }).map((_, i) => (
          <div
            key={i}
            className="w-[2px] rounded-full bg-terracotta/50"
            style={{ height: `${4 + Math.sin(i * 0.7) * 8 + Math.random() * 4}px` }}
          />
        ))}
      </div>
      <span className="text-[11px] text-stone-gray tabular-nums shrink-0">
        {mins}:{secs.toString().padStart(2, '0')}
      </span>
    </div>
  );
}

function AttachmentRenderer({ attachment }: { attachment: MessageAttachment }) {
  switch (attachment.type) {
    case 'data-card':
      return <DataCardAttachment att={attachment} />;
    case 'task-list':
      return <TaskListAttachment att={attachment} />;
    case 'article-preview':
      return <ArticlePreviewAttachment att={attachment} />;
    case 'action-buttons':
      return <ActionButtonsAttachment att={attachment} />;
    case 'task-card':
      return <TaskCardAttachment att={attachment} />;
    case 'image':
      return <ImageAttachment att={attachment} />;
    case 'file':
      return <FileAttachment att={attachment} />;
    case 'voice':
      return <VoiceAttachment att={attachment} />;
    default:
      return null;
  }
}

// ── Message bubble ──

function MessageBubble({ msg, partner }: { msg: ChatMessage; partner: PartnerProfile }) {
  const { sender } = msg;

  // System message — centered
  if (sender.type === 'system') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.15 }}
        className="flex justify-center my-2"
      >
        <p className="text-[11px] text-stone-gray bg-parchment/60 rounded-full px-3 py-1">
          {msg.content}
        </p>
      </motion.div>
    );
  }

  // User message — right aligned
  if (sender.type === 'user') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.15 }}
        className="flex justify-end mb-3"
      >
        <div className="max-w-[75%]">
          <div className="bg-terracotta/10 rounded-2xl rounded-br-md px-3.5 py-2.5">
            <p className="text-[13px] text-near-black leading-relaxed">{msg.content}</p>
            {msg.attachment && <AttachmentRenderer attachment={msg.attachment} />}
          </div>
          {msg.time && (
            <p className="text-[10px] text-stone-gray text-right mt-1 mr-1">{msg.time}</p>
          )}
        </div>
      </motion.div>
    );
  }

  // Partner message — left aligned
  if (sender.type === 'partner') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.15 }}
        className="flex items-start gap-2.5 mb-3"
      >
        <div className="w-8 h-8 rounded-full bg-parchment flex items-center justify-center text-base shrink-0 ring-2 ring-amber-300/40">
          {partner.avatar}
        </div>
        <div className="max-w-[75%]">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-[12px] font-semibold text-near-black">
              {partner.name || '合伙人'}
            </span>
            <Star size={11} className="text-amber-400 fill-amber-400" />
          </div>
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl rounded-tl-md px-3.5 py-2.5 border border-border-cream/50">
            <p className="text-[13px] text-charcoal-warm leading-relaxed">{msg.content}</p>
            {msg.attachment && <AttachmentRenderer attachment={msg.attachment} />}
          </div>
          {msg.time && (
            <p className="text-[10px] text-stone-gray mt-1 ml-1">{msg.time}</p>
          )}
        </div>
      </motion.div>
    );
  }

  // Employee message — left aligned, indented, colored border
  if (sender.type === 'employee') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.15 }}
        className="flex items-start gap-2 mb-3 ml-6"
      >
        <div className="w-7 h-7 rounded-full bg-parchment flex items-center justify-center text-sm shrink-0">
          {sender.avatar}
        </div>
        <div className="max-w-[72%]">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-[12px] font-semibold text-near-black">{sender.name}</span>
            {/* Role tag from TEAM_MEMBERS */}
            {(() => {
              const member = TEAM_MEMBERS.find((m) => m.id === sender.id);
              return member ? (
                <span className="text-[10px] text-stone-gray bg-parchment rounded-full px-1.5 py-0.5">
                  {member.role}
                </span>
              ) : null;
            })()}
          </div>
          <div
            className={`border-l-[3px] ${sender.color} bg-white/50 backdrop-blur-sm rounded-r-xl px-3.5 py-2.5`}
          >
            <p className="text-[13px] text-charcoal-warm leading-relaxed">{msg.content}</p>
            {msg.attachment && <AttachmentRenderer attachment={msg.attachment} />}
          </div>
          {msg.time && (
            <p className="text-[10px] text-stone-gray mt-1 ml-1">{msg.time}</p>
          )}
        </div>
      </motion.div>
    );
  }

  return null;
}

// ── Mention item type ──
interface MentionItem {
  id: string;
  name: string;
  avatar: string;
  role: string;
  isPartner?: boolean;
}

// ── @Mention popup ──

function MentionPopup({
  filter,
  onSelect,
  onClose,
  partnerName,
  partnerAvatar,
  highlightIndex,
}: {
  filter: string;
  onSelect: (name: string) => void;
  onClose: () => void;
  partnerName: string;
  partnerAvatar: string;
  highlightIndex: number;
}) {
  const listRef = useRef<HTMLDivElement>(null);

  // Build mention list: partner first, then unlocked team members
  const items: MentionItem[] = useMemo(() => {
    const partnerItem: MentionItem = {
      id: '__partner__',
      name: partnerName || '合伙人',
      avatar: partnerAvatar,
      role: '管家',
      isPartner: true,
    };

    const teamItems: MentionItem[] = TEAM_MEMBERS
      .filter((m) => !m.locked)
      .map((m) => ({
        id: m.id,
        name: m.name,
        avatar: m.avatar,
        role: m.role,
      }));

    const all = [partnerItem, ...teamItems];

    if (!filter) return all;

    const lowerFilter = filter.toLowerCase();
    return all.filter(
      (item) =>
        item.name.toLowerCase().includes(lowerFilter) ||
        item.role.toLowerCase().includes(lowerFilter)
    );
  }, [filter, partnerName, partnerAvatar]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (listRef.current && highlightIndex >= 0) {
      const el = listRef.current.children[highlightIndex] as HTMLElement | undefined;
      el?.scrollIntoView({ block: 'nearest' });
    }
  }, [highlightIndex]);

  if (items.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 6 }}
      transition={{ duration: 0.12 }}
      className="absolute bottom-full left-0 right-0 mb-1 bg-white rounded-xl shadow-lg border border-border-cream/50 max-h-[200px] overflow-y-auto z-50"
      ref={listRef}
    >
      {items.map((item, idx) => (
        <button
          key={item.id}
          className={`w-full flex items-center gap-2 py-2 px-3 text-left transition-colors ${
            idx === highlightIndex ? 'bg-parchment' : 'hover:bg-parchment/60'
          }`}
          onMouseDown={(e) => {
            e.preventDefault(); // prevent input blur
            onSelect(item.name);
          }}
        >
          <span className="text-base shrink-0">{item.avatar}</span>
          <span className="text-[13px] font-medium text-near-black">{item.name}</span>
          {item.isPartner && <Star size={10} className="text-amber-400 fill-amber-400 shrink-0" />}
          <span className="text-[11px] text-stone-gray ml-auto shrink-0">{item.role}</span>
        </button>
      ))}
    </motion.div>
  );
}

// ── Team member bar (named export for use in Cockpit card header) ──

export function TeamBar({
  partner,
  onInsertMention,
  onMemberClick,
}: TeamBarProps) {
  return (
    <div className="flex items-center gap-2 px-4 py-2.5 overflow-x-auto border-b border-border-cream/60 custom-scrollbar">
      {/* Partner pill */}
      <button
        className="flex items-center gap-1.5 bg-parchment rounded-full px-2.5 py-1 shrink-0 hover:bg-warm-sand transition-colors"
        onClick={() => onInsertMention(partner.name || '合伙人')}
      >
        <span className="text-sm">{partner.avatar}</span>
        <span className="text-[11px] text-near-black font-medium">
          {partner.name || '合伙人'}
        </span>
        <Star size={10} className="text-amber-400 fill-amber-400" />
        <span className={`w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse`} />
      </button>

      {/* Divider */}
      <div className="w-px h-5 bg-border-cream shrink-0" />

      {/* Team members */}
      {TEAM_MEMBERS.map((m) => (
        <button
          key={m.id}
          className="flex items-center gap-1.5 bg-parchment rounded-full px-2.5 py-1 shrink-0 hover:bg-warm-sand transition-colors group"
          onClick={() => {
            if (m.locked) return;
            onInsertMention(m.name);
            onMemberClick?.(m.id);
          }}
          title={m.locked ? '尚未解锁' : m.name}
        >
          <span className="text-sm">{m.avatar}</span>
          <span className={`text-[11px] font-medium ${m.locked ? 'text-stone-gray' : 'text-near-black'}`}>
            {m.name}
          </span>
          {m.locked ? (
            <Lock size={10} className="text-stone-gray" />
          ) : (
            <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[m.status]}`} />
          )}
        </button>
      ))}
    </div>
  );
}

// ── Main component ──

export default function PartnerChat({
  messages,
  partner,
  onSendMessage,
  onMemberClick,
}: PartnerChatProps) {
  const [inputText, setInputText] = useState('');
  const [showMentionPopup, setShowMentionPopup] = useState(false);
  const [mentionFilter, setMentionFilter] = useState('');
  const [mentionStartIndex, setMentionStartIndex] = useState(-1);
  const [mentionHighlight, setMentionHighlight] = useState(0);
  const [attachedFiles, setAttachedFiles] = useState<InputFile[]>([]);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Compute filtered mention count (needed for arrow key wrap-around)
  const mentionItemCount = useMemo(() => {
    const partnerItem = { name: partner.name || '合伙人', role: '管家' };
    const teamItems = TEAM_MEMBERS.filter((m) => !m.locked).map((m) => ({ name: m.name, role: m.role }));
    const all = [partnerItem, ...teamItems];
    if (!mentionFilter) return all.length;
    const lf = mentionFilter.toLowerCase();
    return all.filter(
      (item) => item.name.toLowerCase().includes(lf) || item.role.toLowerCase().includes(lf)
    ).length;
  }, [mentionFilter, partner.name]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages]);

  const closeMention = useCallback(() => {
    setShowMentionPopup(false);
    setMentionFilter('');
    setMentionStartIndex(-1);
    setMentionHighlight(0);
  }, []);

  const handleMentionSelect = useCallback(
    (name: string) => {
      // Replace @partial with @name
      const before = inputText.substring(0, mentionStartIndex);
      const after = inputText.substring(
        inputRef.current?.selectionStart ?? inputText.length
      );
      const newText = `${before}@${name} ${after}`;
      setInputText(newText);
      closeMention();

      // Re-focus the input
      requestAnimationFrame(() => {
        if (inputRef.current) {
          const cursorPos = before.length + name.length + 2; // +2 for @ and space
          inputRef.current.focus();
          inputRef.current.setSelectionRange(cursorPos, cursorPos);
        }
      });
    },
    [inputText, mentionStartIndex, closeMention]
  );

  // ── File handling ──
  const processFiles = useCallback((fileList: FileList | File[]) => {
    const files = Array.from(fileList);
    const newInputFiles: InputFile[] = files.map((file) => {
      const isImage = file.type.startsWith('image/');
      const inputFile: InputFile = {
        id: `file-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        file,
        type: isImage ? 'image' : 'file',
        name: file.name,
        size: file.size,
      };
      if (isImage) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setAttachedFiles((prev) =>
            prev.map((f) => (f.id === inputFile.id ? { ...f, preview: e.target?.result as string } : f))
          );
        };
        reader.readAsDataURL(file);
      }
      return inputFile;
    });
    setAttachedFiles((prev) => [...prev, ...newInputFiles]);
  }, []);

  const removeFile = useCallback((id: string) => {
    setAttachedFiles((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        processFiles(e.target.files);
        e.target.value = ''; // reset so same file can be re-selected
      }
    },
    [processFiles]
  );

  // ── Paste handler (Ctrl+V images) ──
  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      const imageFiles: File[] = [];
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (file) imageFiles.push(file);
        }
      }
      if (imageFiles.length > 0) {
        e.preventDefault();
        processFiles(imageFiles);
      }
    },
    [processFiles]
  );

  // ── Drag & drop ──
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      if (e.dataTransfer.files.length > 0) {
        processFiles(e.dataTransfer.files);
      }
    },
    [processFiles]
  );

  // ── Voice ──
  const handleVoiceSend = useCallback(
    (_audioBlob: Blob, duration: number) => {
      // In real app, upload blob and get URL. For now mock it.
      onSendMessage(`[语音消息 ${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')}]`);
      setShowVoiceRecorder(false);
    },
    [onSendMessage]
  );

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };

  const handleSend = () => {
    const trimmed = inputText.trim();
    if (!trimmed && attachedFiles.length === 0) return;
    onSendMessage(trimmed, attachedFiles.length > 0 ? attachedFiles : undefined);
    setInputText('');
    setAttachedFiles([]);
    closeMention();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // If mention popup is open, handle navigation keys
    if (showMentionPopup && mentionItemCount > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setMentionHighlight((prev) => (prev + 1) % mentionItemCount);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setMentionHighlight((prev) => (prev - 1 + mentionItemCount) % mentionItemCount);
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        // Find the highlighted item and select it
        const partnerItem = { name: partner.name || '合伙人', role: '管家' };
        const teamItems = TEAM_MEMBERS.filter((m) => !m.locked).map((m) => ({ name: m.name, role: m.role }));
        const all = [partnerItem, ...teamItems];
        const lf = mentionFilter.toLowerCase();
        const filtered = !mentionFilter
          ? all
          : all.filter(
              (item) =>
                item.name.toLowerCase().includes(lf) || item.role.toLowerCase().includes(lf)
            );
        if (filtered[mentionHighlight]) {
          handleMentionSelect(filtered[mentionHighlight].name);
        }
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        closeMention();
        return;
      }
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const cursorPos = e.target.selectionStart ?? value.length;
    setInputText(value);

    // Detect @mention trigger
    // Walk backwards from cursor to find the @ sign
    let atIndex = -1;
    for (let i = cursorPos - 1; i >= 0; i--) {
      const ch = value[i];
      if (ch === '@') {
        // Valid if at start or preceded by a space
        if (i === 0 || value[i - 1] === ' ') {
          atIndex = i;
        }
        break;
      }
      if (ch === ' ') break; // stop at space before finding @
    }

    if (atIndex >= 0) {
      const filterText = value.substring(atIndex + 1, cursorPos);
      setShowMentionPopup(true);
      setMentionFilter(filterText);
      setMentionStartIndex(atIndex);
      setMentionHighlight(0);
    } else {
      if (showMentionPopup) {
        closeMention();
      }
    }
  };

  const handleInsertMention = (name: string) => {
    setInputText((prev) => {
      const prefix = prev.length > 0 && !prev.endsWith(' ') ? prev + ' ' : prev;
      return `${prefix}@${name} `;
    });
    // Focus the input after inserting mention from TeamBar
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const canSend = inputText.trim() || attachedFiles.length > 0;

  return (
    <div
      className="flex flex-col h-full relative"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag overlay */}
      <AnimatePresence>
        {isDragOver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-40 bg-terracotta/5 border-2 border-dashed border-terracotta/30 rounded-2xl flex items-center justify-center pointer-events-none"
          >
            <div className="text-center">
              <Paperclip size={32} className="text-terracotta mx-auto mb-2" />
              <p className="text-[13px] text-terracotta font-medium">松开即可上传文件</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MIDDLE: Chat flow */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-5 py-4 custom-scrollbar"
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-stone-gray">
            <Users size={28} className="mb-2 opacity-30" />
            <p className="text-[12px]">暂无消息</p>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageBubble key={msg.id} msg={msg} partner={partner} />
          ))
        )}
      </div>

      {/* BOTTOM: Input area */}
      <div className="px-4 py-3 border-t border-border-cream/20">
        {/* File preview bar */}
        <AnimatePresence>
          {attachedFiles.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="overflow-hidden"
            >
              <div className="flex gap-2 pb-2 overflow-x-auto custom-scrollbar">
                {attachedFiles.map((f) => (
                  <div
                    key={f.id}
                    className="relative shrink-0 group"
                  >
                    {f.type === 'image' && f.preview ? (
                      <div className="w-16 h-16 rounded-lg overflow-hidden border border-border-cream/30">
                        <img src={f.preview} alt={f.name} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-lg border border-border-cream/30 bg-parchment/80 flex flex-col items-center justify-center gap-1">
                        <FileText size={18} className="text-terracotta" />
                        <span className="text-[9px] text-stone-gray truncate max-w-[56px] px-0.5">{f.name}</span>
                      </div>
                    )}
                    {/* Remove button */}
                    <button
                      onClick={() => removeFile(f.id)}
                      className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-stone-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={10} />
                    </button>
                    <p className="text-[9px] text-stone-gray mt-0.5 text-center truncate max-w-[64px]">
                      {formatFileSize(f.size)}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="relative bg-parchment/60 rounded-xl px-3 py-2 border border-border-cream/30 focus-within:border-terracotta/30 focus-within:ring-2 focus-within:ring-terracotta/5 transition-all">
          {/* @mention popup */}
          <AnimatePresence>
            {showMentionPopup && (
              <MentionPopup
                filter={mentionFilter}
                onSelect={handleMentionSelect}
                onClose={closeMention}
                partnerName={partner.name || '合伙人'}
                partnerAvatar={partner.avatar}
                highlightIndex={mentionHighlight}
              />
            )}
          </AnimatePresence>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar"
            onChange={handleFileInputChange}
            className="hidden"
          />

          {/* Input row: [📎 | input | 🎤 ➤] */}
          <div className="flex items-center gap-1.5">
            {/* Left action buttons */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-1.5 rounded-lg text-stone-gray hover:text-terracotta hover:bg-terracotta/5 transition-colors"
              title="上传附件"
            >
              <Paperclip size={16} />
            </button>

            {/* Divider */}
            <div className="w-px h-5 bg-border-cream/50 mx-0.5" />

            {/* Text input */}
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              placeholder="给阿拓发消息..."
              className="flex-1 text-[13px] text-near-black bg-transparent outline-none placeholder:text-stone-gray/50"
            />

            {/* Right action buttons */}
            <button
              onClick={() => setShowVoiceRecorder(true)}
              className="p-1.5 rounded-lg text-stone-gray hover:text-terracotta hover:bg-terracotta/5 transition-colors"
              title="语音输入"
            >
              <Mic size={16} />
            </button>
            <button
              onClick={handleSend}
              disabled={!canSend}
              className={`p-1.5 rounded-lg transition-all ${
                canSend
                  ? 'text-white bg-terracotta hover:bg-terracotta/90 shadow-sm'
                  : 'text-stone-gray/30 cursor-not-allowed'
              }`}
            >
              <SendHorizontal size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Voice recorder overlay */}
      <AnimatePresence>
        {showVoiceRecorder && (
          <VoiceRecorder
            onClose={() => setShowVoiceRecorder(false)}
            onSend={handleVoiceSend}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
