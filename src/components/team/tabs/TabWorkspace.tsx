// TabWorkspace — 工作台预览入口
import { Monitor, Play, Lock, Layout, MessageSquare, LayoutGrid } from 'lucide-react';
import type { DigitalEmployee } from '../../../types';

interface Props {
  emp: DigitalEmployee;
  unlocked: boolean;
  onOpen: () => void;
}

const WORKSPACE_PREVIEWS: Record<string, { title: string; desc: string; columns: string[] }> = {
  spark: {
    title: '三栏创作工作台',
    desc: '对话指令 · 内容画布 · 实时预览 · 三栏联动让创作行云流水',
    columns: ['对话指令', '内容画布', '平台预览'],
  },
  xiaoke: {
    title: '获客看板工作台',
    desc: '对话 + 动态仪表盘 · 线索池/渠道ROI/转化漏斗 一屏掌握',
    columns: ['对话指令', '实时看板', '数据流'],
  },
  shuxi: {
    title: '法务审查工作台',
    desc: '合同对照 · 风险标注 · 条款建议 · 即将上线',
    columns: ['合同原文', '风险标注', '修订建议'],
  },
  shuibao: {
    title: '财税工作台',
    desc: '票据识别 · 科目归类 · 税务计算 · 即将上线',
    columns: ['票据池', '科目账本', '申报摘要'],
  },
  lvan: {
    title: '安全驾驶舱',
    desc: '资产拓扑 · 威胁情报 · 风险处置 · 即将上线',
    columns: ['资产拓扑', '告警流', '处置面板'],
  },
};

export default function TabWorkspace({ emp, unlocked, onOpen }: Props) {
  const preview = WORKSPACE_PREVIEWS[emp.id] || {
    title: emp.workspace.label,
    desc: emp.workspace.description,
    columns: ['对话', '工作区', '预览'],
  };

  return (
    <div className="space-y-5">
      <section className="card-glass-warm p-5">
        <div className="flex items-center gap-2 mb-2">
          <Monitor size={14} className="text-terracotta" />
          <h3 className="font-serif text-sm text-near-black font-medium">{preview.title}</h3>
        </div>
        <p className="text-xs text-olive-gray">{preview.desc}</p>
      </section>

      {/* 预览示意 */}
      <section className="card-glass-warm p-6">
        <div className="grid grid-cols-3 gap-3 mb-5">
          {preview.columns.map((col, i) => {
            const Icon = [MessageSquare, LayoutGrid, Layout][i] || Layout;
            return (
              <div key={col} className="rounded-xl bg-warm-sand/40 border border-border-cream p-4 aspect-[3/4] flex flex-col">
                <div className="flex items-center gap-1.5 mb-2">
                  <Icon size={12} className="text-terracotta" />
                  <span className="text-[11px] text-near-black font-medium">{col}</span>
                </div>
                <div className="flex-1 space-y-1.5">
                  <div className="h-2 bg-warm-sand/80 rounded" />
                  <div className="h-2 bg-warm-sand/80 rounded w-4/5" />
                  <div className="h-2 bg-warm-sand/80 rounded w-3/5" />
                  <div className="h-6 bg-terracotta/15 rounded mt-3" />
                  <div className="h-2 bg-warm-sand/80 rounded" />
                  <div className="h-2 bg-warm-sand/80 rounded w-2/3" />
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        {unlocked ? (
          <button onClick={onOpen} className="btn-terracotta w-full py-3 text-sm gap-2">
            <Play size={16} /> 进入 {emp.name} 工作台
          </button>
        ) : (
          <div className="space-y-2">
            <button disabled className="w-full py-3 rounded-xl bg-warm-sand text-stone-gray text-sm font-medium flex items-center justify-center gap-2 cursor-not-allowed">
              <Lock size={14} /> 工作台即将上线
            </button>
            <p className="text-[11px] text-stone-gray text-center">
              该员工档案与配置已就位,工作台 UI 正在打磨中
            </p>
          </div>
        )}
      </section>

      {/* Workspace meta */}
      <section className="card-glass-warm p-5">
        <h3 className="font-serif text-sm text-near-black font-medium mb-3">工作台信息</h3>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <InfoCell label="类型" value={emp.workspace.type} />
          <InfoCell label="状态" value={unlocked ? '已开放' : '即将上线'} />
          <InfoCell label="名称" value={emp.workspace.label} />
          <InfoCell label="描述" value={emp.workspace.description} />
        </div>
      </section>
    </div>
  );
}

function InfoCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-warm-sand/50 rounded-lg p-3">
      <p className="text-stone-gray">{label}</p>
      <p className="text-near-black font-medium mt-0.5">{value}</p>
    </div>
  );
}
