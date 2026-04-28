import { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, FlaskConical, History, Settings2, X, ArrowRight } from 'lucide-react';
import type { BuilderProject } from '../../features/builder/types';
import type { CanvasNode } from './BuilderCanvas';
import type { NavFocusIntent, NavTab } from '../../types';

export interface NodeDetailPanelProps {
  node: CanvasNode | null;
  project: BuilderProject | null;
  onClose: () => void;
  onRunTest: () => void;
  onNavigate?: (tab: NavTab, intent?: NavFocusIntent) => void;
  onRollback?: (versionId: string) => void;
}

type TabKey = 'property' | 'test' | 'version';

const TABS: { key: TabKey; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }[] = [
  { key: 'property', label: '属性', icon: Settings2 },
  { key: 'test', label: '测试', icon: FlaskConical },
  { key: 'version', label: '版本', icon: History },
];

function resolveChecklistTarget(itemId: string, label: string): { tab: NavTab; label: string; intent: NavFocusIntent } | null {
  const text = `${itemId} ${label}`;
  if (/飞书/.test(text)) {
    return { tab: 'channels', label: '去飞书配置', intent: { tab: 'channels', target: 'feishu', source: 'builder-preflight' } };
  }
  if (/企业微信|企微/.test(text)) {
    return { tab: 'channels', label: '去企业微信配置', intent: { tab: 'channels', target: 'wechat_work', source: 'builder-preflight' } };
  }
  if (/channel|通讯/.test(text)) {
    return { tab: 'channels', label: '去通讯中心处理', intent: { tab: 'channels', source: 'builder-preflight' } };
  }
  if (/knowledge|资料|知识/.test(text)) {
    return { tab: 'knowledge', label: '去知识库处理', intent: { tab: 'knowledge', action: 'upload', target: 'Builder 资料源', source: 'builder-preflight' } };
  }
  return null;
}

function snapshotDiff(project: BuilderProject, versionId: string): { label: string; current: string; snapshot: string }[] {
  const version = project.versions.find((item) => item.id === versionId);
  if (!version?.snapshot) return [];
  const snapshot = version.snapshot;
  return [
    { label: '岗位名称', current: project.blueprint.name, snapshot: snapshot.blueprint.name },
    { label: '岗位目标', current: project.blueprint.goal, snapshot: snapshot.blueprint.goal },
    { label: '服务对象', current: project.blueprint.serviceTarget.join('、'), snapshot: snapshot.blueprint.serviceTarget.join('、') },
    { label: '工作台', current: project.viewConfig?.title || '-', snapshot: snapshot.viewConfig?.title || '-' },
    { label: '工具数量', current: String(project.blueprint.toolPermissions.length), snapshot: String(snapshot.blueprint.toolPermissions.length) },
  ].filter((item) => item.current !== item.snapshot);
}

export default function NodeDetailPanel({ node, project, onClose, onRunTest, onNavigate, onRollback }: NodeDetailPanelProps) {
  const [tab, setTab] = useState<TabKey>('property');
  const [compareVersionId, setCompareVersionId] = useState<string | null>(null);
  if (!node) return null;

  const latestRun = project?.testRuns[0];
  const launchChecklist = project?.blueprint.launchChecklist ?? [];
  const compareDiff = project && compareVersionId ? snapshotDiff(project, compareVersionId) : [];

  return (
    <motion.aside
      initial={{ x: 80, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 80, opacity: 0 }}
      className="flex h-full w-80 flex-col border-l border-border-cream bg-ivory"
    >
      <div className="border-b border-border-cream px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-serif text-sm font-semibold text-near-black">{node.title}</h3>
            <p className="mt-0.5 text-[11px] text-stone-gray">{node.subtitle || '岗位蓝图节点'}</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-full text-stone-gray transition-colors hover:bg-warm-sand hover:text-near-black"
          >
            <X size={16} />
          </button>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-1 rounded-xl bg-warm-sand/50 p-1">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center justify-center gap-1 rounded-lg px-2 py-1.5 text-[11px] transition-colors ${tab === key ? 'bg-ivory text-terracotta shadow-sm' : 'text-stone-gray hover:text-near-black'}`}
            >
              <Icon size={12} />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {tab === 'property' && (
          <div className="space-y-4">
            <div>
              <p className="mb-1 text-xs font-medium text-stone-gray">业务说明</p>
              <p className="rounded-xl bg-warm-sand/40 p-3 text-sm leading-relaxed text-charcoal-warm">
                {node.subtitle || '该节点由 Builder 根据业务访谈生成，后续会映射到员工蓝图和工作台配置。'}
              </p>
            </div>
            <div>
              <p className="mb-1 text-xs font-medium text-stone-gray">已生成参数</p>
              <div className="space-y-2">
                {Object.entries(node.data ?? {}).map(([key, value]) => (
                  <div key={key} className="rounded-xl border border-border-warm bg-parchment p-3">
                    <p className="text-[11px] font-medium text-stone-gray">{key}</p>
                    <p className="mt-1 text-sm leading-relaxed text-near-black">
                      {Array.isArray(value) ? value.join('、') : String(value)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === 'test' && (
          <div className="space-y-4">
            <button
              onClick={onRunTest}
              disabled={!project}
              className="btn-terracotta w-full justify-center py-2 text-sm disabled:opacity-50"
            >
              运行样本测试
            </button>
            {latestRun ? (
              <div className="space-y-3">
                <div className={`rounded-xl p-3 ${
                  latestRun.status === 'passed'
                    ? 'bg-success-green/10 text-success-green'
                    : latestRun.status === 'failed'
                      ? 'bg-red-500/10 text-red-500'
                      : latestRun.status === 'running'
                        ? 'bg-terracotta/10 text-terracotta'
                        : 'bg-warm-sand text-stone-gray'
                }`}>
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <CheckCircle2 size={15} />
                    {latestRun.status === 'passed' ? '测试通过' : latestRun.status === 'failed' ? '测试失败' : latestRun.status === 'running' ? '测试中...' : '测试待运行'}
                  </div>
                  <p className="mt-1 text-xs text-olive-gray">{latestRun.outputPreview.title}</p>
                </div>
                {latestRun.outputPreview.lines.map((line) => (
                  <p key={line} className="rounded-xl bg-warm-sand/40 p-3 text-sm leading-relaxed text-charcoal-warm">{line}</p>
                ))}
                <div>
                  <p className="mb-1 text-xs font-medium text-stone-gray">人工确认点</p>
                  <div className="flex flex-wrap gap-1.5">
                    {latestRun.approvalPoints.map((item) => (
                      <span key={item} className="rounded-full bg-terracotta/10 px-2.5 py-1 text-[11px] text-terracotta">{item}</span>
                    ))}
                  </div>
                </div>
                {launchChecklist.length > 0 && (
                  <div>
                    <p className="mb-1 text-xs font-medium text-stone-gray">上线清单</p>
                    <div className="space-y-2">
                      {launchChecklist.map((item) => (
                        <div key={item.id} className="rounded-xl border border-border-warm bg-parchment p-3">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-medium text-near-black">{item.label}</p>
                            <span className={`rounded-full px-2 py-0.5 text-[10px] ${
                              item.status === 'passed'
                                ? 'bg-success-green/10 text-success-green'
                                : item.status === 'blocked'
                                  ? 'bg-red-500/10 text-red-500'
                                  : 'bg-warm-sand text-stone-gray'
                            }`}>
                              {item.status === 'passed' ? '已通过' : item.status === 'blocked' ? '阻塞' : '待确认'}
                            </span>
                          </div>
                          {item.reason && <p className="mt-1 text-[11px] leading-relaxed text-stone-gray">{item.reason}</p>}
                          {(() => {
                            const target = resolveChecklistTarget(item.id, item.label);
                            if (!target || item.status === 'passed') return null;
                            return (
                              <button
                                onClick={() => onNavigate?.(target.tab, target.intent)}
                                className="mt-2 inline-flex items-center gap-1 rounded-lg border border-border-warm px-2.5 py-1.5 text-[11px] font-medium text-olive-gray transition-colors hover:border-terracotta/30 hover:text-terracotta"
                              >
                                {target.label}
                                <ArrowRight size={12} />
                              </button>
                            );
                          })()}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="rounded-xl border border-dashed border-border-warm p-3 text-xs leading-relaxed text-stone-gray">
                上线前必须运行样本测试。测试会展示输入样本、输出预览、风险和人工确认点。
              </p>
            )}
          </div>
        )}

        {tab === 'version' && (
          <div className="space-y-3">
            {(project?.versions ?? []).map((version) => (
              <div key={version.id} className="rounded-xl border border-border-warm bg-parchment p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-near-black">{version.version}</p>
                  <span className="text-[10px] text-stone-gray">{new Date(version.createdAt).toLocaleString()}</span>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-olive-gray">{version.summary}</p>
                <div className="mt-3 flex items-center gap-2">
                  <button
                    onClick={() => setCompareVersionId((prev) => (prev === version.id ? null : version.id))}
                    disabled={!version.snapshot}
                    className="rounded-lg border border-border-warm px-2.5 py-1.5 text-[11px] text-olive-gray transition-colors hover:border-terracotta/30 hover:text-terracotta disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {compareVersionId === version.id ? '收起对比' : '对比当前'}
                  </button>
                  <button
                    onClick={() => onRollback?.(version.id)}
                    disabled={!version.snapshot}
                    className="rounded-lg border border-border-warm px-2.5 py-1.5 text-[11px] text-olive-gray transition-colors hover:border-terracotta/30 hover:text-terracotta disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    回滚
                  </button>
                </div>
                {compareVersionId === version.id && (
                  <div className="mt-3 space-y-2">
                    {compareDiff.length > 0 ? compareDiff.map((item) => (
                      <div key={item.label} className="rounded-lg bg-warm-sand/40 p-2">
                        <p className="text-[11px] font-medium text-stone-gray">{item.label}</p>
                        <p className="mt-1 text-[11px] text-near-black">当前：{item.current}</p>
                        <p className="mt-0.5 text-[11px] text-olive-gray">版本：{item.snapshot}</p>
                      </div>
                    )) : (
                      <p className="rounded-lg bg-warm-sand/40 p-2 text-[11px] text-stone-gray">与当前蓝图无差异。</p>
                    )}
                  </div>
                )}
              </div>
            ))}
            {!project?.versions.length && (
              <p className="rounded-xl border border-dashed border-border-warm p-3 text-xs text-stone-gray">
                版本会在生成蓝图、测试、上线和后续优化时记录。
              </p>
            )}
          </div>
        )}
      </div>
    </motion.aside>
  );
}
