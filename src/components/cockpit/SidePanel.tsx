import { useState } from 'react';
import { FileText, LayoutGrid } from 'lucide-react';
import ReportStream from './ReportStream';
import DashboardCards from './DashboardCards';
import type { ReportItem, DashboardCard, DashboardCardType } from '../../data/partner';
import type { NavTab } from '../../types';

interface SidePanelProps {
  reports: ReportItem[];
  cards: DashboardCard[];
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  onToggleCard?: (type: DashboardCardType) => void;
  onNav?: (tab: NavTab) => void;
}

type PanelTab = 'reports' | 'dashboard';

export default function SidePanel({
  reports,
  cards,
  onApprove,
  onReject,
  onToggleCard,
  onNav,
}: SidePanelProps) {
  const [activeTab, setActiveTab] = useState<PanelTab>('reports');

  const pendingCount = reports.filter(r => r.type === 'approval' && r.status === 'pending').length;

  return (
    <div className="flex flex-col h-full">
      {/* Tab switcher */}
      <div className="flex items-center gap-1 px-5 pt-4 pb-0 border-b border-border-cream/30 shrink-0">
        <button
          onClick={() => setActiveTab('reports')}
          className={`flex items-center gap-1.5 pb-3 px-3 text-[13px] font-medium transition-colors relative ${
            activeTab === 'reports'
              ? 'text-near-black'
              : 'text-stone-gray hover:text-near-black'
          }`}
        >
          <FileText size={14} />
          汇报
          {pendingCount > 0 && (
            <span className="ml-0.5 w-4 h-4 rounded-full bg-terracotta text-white text-[10px] flex items-center justify-center font-semibold shrink-0">
              {pendingCount}
            </span>
          )}
          {activeTab === 'reports' && (
            <span className="absolute bottom-0 left-1 right-1 h-[2px] bg-terracotta rounded-t-full" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex items-center gap-1.5 pb-3 px-3 text-[13px] font-medium transition-colors relative ${
            activeTab === 'dashboard'
              ? 'text-near-black'
              : 'text-stone-gray hover:text-near-black'
          }`}
        >
          <LayoutGrid size={14} />
          看板
          {activeTab === 'dashboard' && (
            <span className="absolute bottom-0 left-1 right-1 h-[2px] bg-terracotta rounded-t-full" />
          )}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-5 py-4">
        {activeTab === 'reports' ? (
          <ReportStream
            reports={reports}
            onApprove={onApprove}
            onReject={onReject}
          />
        ) : (
          <DashboardCards
            cards={cards.filter(c => c.enabled)}
            onToggleCard={onToggleCard}
            onNav={onNav}
          />
        )}
      </div>
    </div>
  );
}
