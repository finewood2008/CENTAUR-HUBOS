// TabModel — 模型选择与参数
import { Cpu, Check, Star, DollarSign } from 'lucide-react';
import type { DigitalEmployee } from '../../../types';

interface Props {
  emp: DigitalEmployee;
  config: ReturnType<typeof import('../../../hooks/useEmployeeConfig').useEmployeeConfig>;
  readonly?: boolean;
}

export default function TabModel({ emp, config, readonly }: Props) {
  const { data, loading, updateModel } = config;
  const hasCurrentModel = Boolean(data.currentModel);

  return (
    <div className="space-y-5">
      {/* 当前模型 */}
      <section className="card-glass-warm p-5">
        <div className="flex items-center gap-2 mb-4">
          <Cpu size={14} className="text-terracotta" />
          <h3 className="font-serif text-sm text-near-black font-medium">当前模型</h3>
        </div>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <InfoCell label="基座模型" value={hasCurrentModel ? data.currentModel : '未配置'} muted={!hasCurrentModel} />
          <InfoCell label="推理能力" value={emp.modelInfo.reasoning} />
          <InfoCell label="上下文" value={emp.modelInfo.context} />
          <InfoCell label="专精方向" value={emp.modelInfo.specialization} />
        </div>
      </section>

      {/* 可选模型 */}
      <section className="card-glass-warm p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-serif text-sm text-near-black font-medium">可切换的模型</h3>
          {loading && <span className="text-[10px] text-stone-gray">加载中...</span>}
        </div>
        <div className="space-y-2">
          {data.availableModels.map((m) => {
            const selected = data.currentModel === m.modelName || data.currentModel === m.label;
            return (
              <button
                key={m.id}
                disabled={readonly}
                onClick={() => !readonly && updateModel(m.modelName)}
                className={`
                  w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all
                  ${selected ? 'bg-terracotta/10 border border-terracotta/30' : 'bg-warm-sand/30 hover:bg-warm-sand/50 border border-transparent'}
                  ${readonly ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}
                `}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${selected ? 'bg-terracotta/20' : 'bg-warm-sand/60'}`}>
                  <Cpu size={14} className={selected ? 'text-terracotta' : 'text-olive-gray'} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-near-black font-medium truncate">{m.label}</p>
                    {m.isPreferred && <Star size={10} className="text-amber-500 fill-amber-500" />}
                  </div>
                  <p className="text-[10px] text-stone-gray truncate">{m.providerName} · {m.modelName}</p>
                </div>
                <div className="text-right text-[10px] text-stone-gray">
                  {m.unitPrice !== undefined && (
                    <p className="flex items-center gap-0.5"><DollarSign size={9} />{m.unitPrice}/1M in</p>
                  )}
                  {m.outputUnitPrice !== undefined && (
                    <p className="flex items-center gap-0.5"><DollarSign size={9} />{m.outputUnitPrice}/1M out</p>
                  )}
                </div>
                {selected && <Check size={14} className="text-terracotta" />}
              </button>
            );
          })}
          {data.availableModels.length === 0 && !loading && (
            <div className="text-center py-6 space-y-1">
              <p className="text-xs text-stone-gray">暂无可用模型</p>
              <p className="text-[11px] text-olive-gray">当前本地 bridge 未配置真实 LLM 凭证</p>
            </div>
          )}
        </div>
      </section>

      {readonly && (
        <p className="text-[11px] text-stone-gray italic text-center">
          该员工尚未激活,模型配置为只读预览
        </p>
      )}
    </div>
  );
}

function InfoCell({ label, value, muted = false }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="bg-warm-sand/50 rounded-lg p-3">
      <p className="text-stone-gray">{label}</p>
      <p className={`font-medium mt-0.5 ${muted ? 'text-stone-gray' : 'text-near-black'}`}>{value}</p>
    </div>
  );
}
