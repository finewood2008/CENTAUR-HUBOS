// 小可仪表盘面板 — 中间栏
import { Target, TrendingUp, FileText } from 'lucide-react';
import MetricsRow from './dashboard-widgets/MetricsRow';
import LeadFunnel from './dashboard-widgets/LeadFunnel';
import LeadTable from './dashboard-widgets/LeadTable';

interface Props {
  strategyContent: string;
}

export default function DashboardPanel({ strategyContent }: Props) {
  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* header */}
      <div className="px-4 pt-4 pb-2 border-b border-border-cream">
        <div className="flex items-center gap-2">
          <TrendingUp size={14} className="text-blue-500" />
          <h3 className="font-serif text-sm text-near-black font-medium">增长仪表盘</h3>
        </div>
      </div>

      <div className="flex-1 px-4 py-4 space-y-4 overflow-y-auto">
        {/* metrics */}
        <MetricsRow />

        {/* funnel */}
        <div className="card-glass-warm p-4">
          <div className="flex items-center gap-2 mb-3">
            <Target size={12} className="text-blue-500" />
            <h4 className="text-xs font-medium text-near-black">转化漏斗</h4>
          </div>
          <LeadFunnel />
        </div>

        {/* strategy output */}
        {strategyContent && (
          <div className="card-glass-warm p-4">
            <div className="flex items-center gap-2 mb-3">
              <FileText size={12} className="text-blue-500" />
              <h4 className="text-xs font-medium text-near-black">获客方案</h4>
            </div>
            <div className="text-sm text-olive-gray leading-relaxed whitespace-pre-wrap">
              {strategyContent}
            </div>
          </div>
        )}

        {/* leads */}
        <div className="card-glass-warm p-4">
          <div className="flex items-center gap-2 mb-3">
            <Target size={12} className="text-blue-500" />
            <h4 className="text-xs font-medium text-near-black">线索管理</h4>
            <span className="ml-auto text-[10px] text-stone-gray">5 条线索</span>
          </div>
          <LeadTable />
        </div>
      </div>
    </div>
  );
}
