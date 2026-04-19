import { useState } from 'react';
import { CheckCircle, XCircle, AlertCircle, Clock } from 'lucide-react';
import type { ReportItem } from '../../data/partner';

interface ReportStreamProps {
  reports: ReportItem[];
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
}

// ── 审批卡片 ──
function ApprovalCard({
  item,
  handled,
  onApprove,
  onReject,
}: {
  item: ReportItem;
  handled: 'approved' | 'rejected' | null;
  onApprove?: () => void;
  onReject?: () => void;
}) {
  const isHandled = handled !== null;

  return (
    <div
      className={`rounded-xl overflow-hidden transition-all ${
        isHandled ? 'opacity-60' : 'shadow-[0_1px_3px_rgba(0,0,0,0.04),0_2px_8px_rgba(0,0,0,0.04)]'
      } bg-white/80 border border-border-cream/30`}
    >
      {/* Left color border */}
      <div className={`flex ${item.employeeColor}`}>
        <div className="w-1 shrink-0 self-stretch bg-current" />
        <div className="flex-1 p-3">
          {/* Header: avatar + name + time */}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-base leading-none">{item.employeeAvatar}</span>
            <span className="text-[13px] font-semibold text-near-black">
              {item.employeeName}
            </span>
            <Clock size={11} className="text-stone-gray ml-auto" />
            <span className="text-[11px] text-stone-gray">{item.time}</span>
          </div>

          {/* Title */}
          <p className="text-[13px] font-semibold text-near-black leading-snug">
            {item.title}
          </p>

          {/* Approval data: amount + description */}
          {item.approvalData && (
            <div className="mt-2">
              {item.approvalData.amount && (
                <div className="text-lg font-bold text-near-black font-serif">
                  {item.approvalData.amount}
                </div>
              )}
              <p className="text-[12px] text-charcoal-warm leading-relaxed mt-0.5">
                {item.approvalData.description}
              </p>
            </div>
          )}

          {/* Action area */}
          {isHandled ? (
            <div className="mt-3 pt-2 border-t border-border-cream flex items-center justify-end gap-1.5">
              {handled === 'approved' ? (
                <>
                  <CheckCircle size={14} className="text-success-green" />
                  <span className="text-[12px] font-medium text-success-green">
                    已通过
                  </span>
                </>
              ) : (
                <>
                  <XCircle size={14} className="text-terracotta" />
                  <span className="text-[12px] font-medium text-terracotta">
                    已驳回
                  </span>
                </>
              )}
            </div>
          ) : (
            <div className="mt-3 pt-2 border-t border-border-cream flex justify-end gap-2">
              <button
                onClick={onReject}
                className="text-[12px] py-1.5 px-3 rounded-lg border border-terracotta/40 text-terracotta hover:bg-terracotta/5 transition-colors"
              >
                驳回
              </button>
              <button
                onClick={onApprove}
                className="text-[12px] py-1.5 px-4 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-all shadow-sm font-medium"
              >
                批准
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── 汇报卡片 ──
function ReportCard({ item }: { item: ReportItem }) {
  return (
    <div className="rounded-xl overflow-hidden bg-white/80 border border-border-cream/30 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
      <div className={`flex ${item.employeeColor}`}>
        <div className="w-1 shrink-0 self-stretch bg-current" />
        <div className="flex-1 p-3">
          {/* Header: avatar + name + time */}
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-base leading-none">{item.employeeAvatar}</span>
            <span className="text-[13px] font-semibold text-near-black">
              {item.employeeName}
            </span>
            <span className="text-[11px] text-stone-gray ml-auto">{item.time}</span>
          </div>

          {/* Title */}
          <p className="text-[13px] font-medium text-near-black leading-snug">
            {item.title}
          </p>

          {/* Detail */}
          {item.detail && (
            <p className="text-[12px] text-charcoal-warm leading-relaxed mt-1">
              {item.detail}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── 主组件 ──
export default function ReportStream({
  reports,
  onApprove,
  onReject,
}: ReportStreamProps) {
  // Track locally handled approvals: id → 'approved' | 'rejected'
  const [handledMap, setHandledMap] = useState<Record<string, 'approved' | 'rejected'>>({});

  const handleApprove = (id: string) => {
    setHandledMap(prev => ({ ...prev, [id]: 'approved' }));
    onApprove?.(id);
  };

  const handleReject = (id: string) => {
    setHandledMap(prev => ({ ...prev, [id]: 'rejected' }));
    onReject?.(id);
  };

  // Split into approval items (pending first) and report items
  const approvalItems = reports.filter(r => r.type === 'approval');
  const reportItems = reports.filter(r => r.type !== 'approval');

  // Pending = status pending AND not yet handled locally
  const pendingCount = approvalItems.filter(
    r => r.status === 'pending' && !handledMap[r.id]
  ).length;

  return (
    <div className="flex flex-col gap-4">
      {/* ── 需要确认 section ── */}
      {approvalItems.length > 0 && (
        <div>
          {/* Section header with red dot badge */}
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle size={15} className="text-terracotta" />
            <h3 className="text-[13px] font-semibold text-near-black">
              需要你确认
            </h3>
            {pendingCount > 0 && (
              <span className="relative flex items-center">
                <span className="badge-terracotta text-[11px] px-1.5 py-0.5 leading-none">
                  {pendingCount}
                </span>
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              </span>
            )}
          </div>

          {/* Approval cards — pending first */}
          <div className="space-y-2.5">
            {approvalItems
              .sort((a, b) => {
                const aPending = a.status === 'pending' && !handledMap[a.id] ? 0 : 1;
                const bPending = b.status === 'pending' && !handledMap[b.id] ? 0 : 1;
                return aPending - bPending;
              })
              .map(item => (
                <ApprovalCard
                  key={item.id}
                  item={item}
                  handled={handledMap[item.id] ?? null}
                  onApprove={() => handleApprove(item.id)}
                  onReject={() => handleReject(item.id)}
                />
              ))}
          </div>
        </div>
      )}

      {/* ── 今日汇报 section ── */}
      {reportItems.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Clock size={15} className="text-stone-gray" />
            <h3 className="text-[13px] font-semibold text-near-black">
              今日汇报
            </h3>
            <span className="text-[11px] text-stone-gray">
              {reportItems.length} 条
            </span>
          </div>

          <div className="space-y-2">
            {reportItems.map(item => (
              <ReportCard key={item.id} item={item} />
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {reports.length === 0 && (
        <div className="flex flex-col items-center justify-center py-8 text-stone-gray">
          <Clock size={24} className="mb-2 opacity-40" />
          <span className="text-[13px]">暂无汇报</span>
        </div>
      )}
    </div>
  );
}
