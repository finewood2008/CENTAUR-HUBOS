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
      <div className="flex border-b border-border-cream bg-white/30 backdrop-blur-sm shrink-0">
        <button
          onClick={() => setActiveTab('reports')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[12px] font-medium transition-colors relative ${
            activeTab === 'reports'
              ? 'text-terracotta'
              : 'text-stone-gray hover:text-charcoal-warm'
          }`}
        >
          <FileText size={13} />
          汇报
          {pendingCount > 0 && (
            <span className="absolute top-1.5 right-[calc(50%-28px)] w-1.5 h-1.5 rounded-full bg-red-500" />
          )}
          {activeTab === 'reports' && (
            <span className="absolute bottom-0 left-1/4 right-1/4 h-[2px] bg-terracotta rounded-t-full" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[12px] font-medium transition-colors relative ${
            activeTab === 'dashboard'
              ? 'text-terracotta'
              : 'text-stone-gray hover:text-charcoal-warm'
          }`}
        >
          <LayoutGrid size={13} />
          看板
          {activeTab === 'dashboard' && (
            <span className="absolute bottom-0 left-1/4 right-1/4 h-[2px] bg-terracotta rounded-t-full" />
          )}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3">
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
