import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SendHorizontal, Star, Lock, Users } from 'lucide-react';
import type {
  ChatMessage,
  MessageSender,
  MessageAttachment,
  TeamMember,
  PartnerProfile,
  TaskStatus,
} from '../../data/partner';
import { TEAM_MEMBERS, DEFAULT_PARTNER } from '../../data/partner';

// ── Props ──
interface PartnerChatProps {
  messages: ChatMessage[];
  partner: PartnerProfile;
  onSendMessage: (text: string) => void;
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
  const scrollRef = useRef<HTMLDivElement>(null);
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

  const handleSend = () => {
    const trimmed = inputText.trim();
    if (!trimmed) return;
    onSendMessage(trimmed);
    setInputText('');
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

  return (
    <div className="flex flex-col h-full">
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

      {/* BOTTOM: Input bar */}
      <div className="px-4 py-3 border-t border-border-cream/20">
        <div className="relative bg-parchment/60 rounded-xl px-4 py-2.5 border border-border-cream/30 focus-within:border-terracotta/30 focus-within:ring-2 focus-within:ring-terracotta/5 transition-all">
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
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="给阿拓发消息..."
              className="flex-1 text-[13px] text-near-black bg-transparent outline-none placeholder:text-stone-gray/50"
            />
            <button
              onClick={handleSend}
              disabled={!inputText.trim()}
              className={`p-2 rounded-lg transition-all ${
                inputText.trim()
                  ? 'text-white bg-terracotta hover:bg-terracotta/90 shadow-sm'
                  : 'text-stone-gray/30 cursor-not-allowed'
              }`}
            >
              <SendHorizontal size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
