// Mini App Widget: 小组件集合（卡片、进度条、标签云、时间线、按钮组、Markdown、空状态）
import type {
  CardWidget, ProgressWidget, TagCloudWidget, TimelineWidget,
  ButtonGroupWidget, MarkdownWidget, EmptyWidget, WidgetConfig,
} from '../../../types/mini-app';
import WidgetRenderer from '../WidgetRenderer';

// ── 卡片 ──
export function Card({
  config,
  dataStore,
  onAction,
  chatProps,
}: {
  config: CardWidget;
  dataStore: Record<string, unknown>;
  onAction: (id: string, payload?: unknown) => void;
  chatProps?: {
    messages: { role: 'user' | 'ai'; content: string }[];
    onSend: (msg: string) => void;
    isLoading: boolean;
  };
}) {
  const variants: Record<string, string> = {
    default: 'bg-white/[0.03] border-white/5',
    outlined: 'bg-transparent border-white/10',
    elevated: 'bg-white/[0.05] border-white/5 shadow-lg',
  };
  const v = variants[config.variant || 'default'];

  return (
    <div className={`rounded-xl border p-4 ${v}`}>
      {config.title && (
        <h3 className="text-sm font-medium text-white mb-1">{config.title}</h3>
      )}
      {config.subtitle && (
        <p className="text-xs text-gray-500 mb-3">{config.subtitle}</p>
      )}
      {config.content && (
        <p className="text-sm text-gray-300 leading-relaxed">{config.content}</p>
      )}
      {config.children && config.children.length > 0 && (
        <div className="space-y-3 mt-3">
          {config.children.map((child: WidgetConfig) => (
            <WidgetRenderer
              key={child.id}
              widget={child}
              dataStore={dataStore}
              onAction={onAction}
              chatProps={chatProps}
            />
          ))}
        </div>
      )}
      {config.footer && (
        <div className="mt-3 pt-3 border-t border-white/5 text-xs text-gray-500">
          {config.footer}
        </div>
      )}
    </div>
  );
}

// ── 进度条 ──
export function Progress({ config }: { config: ProgressWidget }) {
  const color = config.color || 'bg-orange-500';
  return (
    <div>
      {config.label && (
        <div className="flex justify-between text-xs mb-1.5">
          <span className="text-gray-400">{config.label}</span>
          {config.showPercent !== false && (
            <span className="text-gray-500">{config.value}%</span>
          )}
        </div>
      )}
      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${Math.min(100, Math.max(0, config.value))}%` }}
        />
      </div>
    </div>
  );
}

// ── 标签云 ──
export function TagCloud({ config }: { config: TagCloudWidget }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {config.tags.map((tag, i) => (
        <span
          key={i}
          className={`px-2 py-0.5 rounded-md text-[11px] border ${
            tag.color
              ? `bg-${tag.color}-500/10 text-${tag.color}-400 border-${tag.color}-500/10`
              : 'bg-white/5 text-gray-400 border-white/5'
          }`}
        >
          {tag.label}
          {tag.count !== undefined && (
            <span className="ml-1 text-[9px] opacity-60">{tag.count}</span>
          )}
        </span>
      ))}
    </div>
  );
}

// ── 时间线 ──
export function Timeline({ config }: { config: TimelineWidget }) {
  return (
    <div className="relative pl-6 space-y-4">
      <div className="absolute left-[9px] top-2 bottom-2 w-px bg-white/10" />
      {config.items.map((item, i) => {
        const dotColor =
          item.status === 'done' ? 'bg-green-400' :
          item.status === 'active' ? 'bg-orange-400 animate-pulse' :
          'bg-gray-600';
        return (
          <div key={i} className="relative">
            <div className={`absolute -left-6 top-1.5 w-[7px] h-[7px] rounded-full ${dotColor} ring-2 ring-gray-950`} />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-white">{item.title}</span>
                <span className="text-[10px] text-gray-600">{item.time}</span>
              </div>
              {item.description && (
                <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── 按钮组 ──
export function ButtonGroup({
  config,
  onAction,
}: {
  config: ButtonGroupWidget;
  onAction: (id: string, payload?: unknown) => void;
}) {
  const dir = config.direction === 'vertical' ? 'flex-col' : 'flex-row';
  const variants: Record<string, string> = {
    primary: 'bg-orange-500 text-white hover:bg-orange-600',
    secondary: 'bg-white/10 text-white hover:bg-white/15',
    danger: 'bg-red-500/15 text-red-400 hover:bg-red-500/25',
    ghost: 'bg-transparent text-gray-400 hover:text-white hover:bg-white/5',
  };

  const handleClick = (btn: typeof config.buttons[0]) => {
    if (btn.confirm) {
      if (window.confirm(btn.confirm)) onAction(btn.action);
    } else {
      onAction(btn.action);
    }
  };

  return (
    <div className={`flex ${dir} gap-2`}>
      {config.buttons.map((btn, i) => (
        <button
          key={i}
          onClick={() => handleClick(btn)}
          className={`px-4 py-2 rounded-xl text-sm transition-colors ${variants[btn.variant || 'secondary']}`}
        >
          {btn.icon && <span className="mr-1.5">{btn.icon}</span>}
          {btn.label}
        </button>
      ))}
    </div>
  );
}

// ── Markdown ──
export function MarkdownBlock({ config }: { config: MarkdownWidget }) {
  // 简单渲染，后续可接 react-markdown
  return (
    <div className="prose prose-invert prose-sm max-w-none text-gray-300 leading-relaxed whitespace-pre-wrap">
      {config.content}
    </div>
  );
}

// ── 空状态 ──
export function Empty({
  config,
  onAction,
}: {
  config: EmptyWidget;
  onAction: (id: string) => void;
}) {
  return (
    <div className="py-8 text-center">
      {config.icon && <div className="text-3xl mb-3">{config.icon}</div>}
      <p className="text-sm text-gray-500">{config.message}</p>
      {config.actionLabel && config.action && (
        <button
          onClick={() => onAction(config.action!)}
          className="mt-3 px-4 py-2 bg-orange-500/10 text-orange-400 text-xs rounded-lg hover:bg-orange-500/20 transition-colors border border-orange-500/20"
        >
          {config.actionLabel}
        </button>
      )}
    </div>
  );
}
