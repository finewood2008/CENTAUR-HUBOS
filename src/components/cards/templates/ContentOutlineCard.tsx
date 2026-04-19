// 大纲确认卡片 — 树形大纲，可确认/修改
import { useState } from 'react';
import { List, Check, RotateCcw, GripVertical, X } from 'lucide-react';
import type { CardProps } from '../types';

interface OutlineItem {
  id: string;
  title: string;
  children?: OutlineItem[];
}

interface OutlineData {
  title: string;
  items: OutlineItem[];
  status?: 'draft' | 'confirmed';
}

/* ── 单个大纲节点（递归） ── */
function OutlineNode({
  item,
  depth = 0,
  editable,
  onEdit,
  onRemove,
}: {
  item: OutlineItem;
  depth?: number;
  editable?: boolean;
  onEdit?: (field: string, value: any) => void;
  onRemove?: (id: string) => void;
}) {
  const isRoot = depth === 0;
  const bullet = isRoot ? '●' : '○';
  const indent = depth * 24; // 一级0px，二级24px

  return (
    <div>
      <div
        className={`
          flex items-center gap-2 py-1.5 rounded-lg
          transition-colors group cursor-default
          hover:bg-warm-sand/40
        `}
        style={{ paddingLeft: indent + 8, paddingRight: 8 }}
      >
        {/* 拖拽手柄（编辑态） */}
        {editable && (
          <GripVertical
            size={12}
            className="text-stone-gray/40 cursor-grab opacity-0 group-hover:opacity-100 shrink-0 transition-opacity"
          />
        )}

        {/* 圆点标记 */}
        <span
          className={`shrink-0 select-none ${
            isRoot ? 'text-terracotta' : 'text-stone-gray/60'
          }`}
          style={{ fontSize: isRoot ? 10 : 9, lineHeight: 1 }}
        >
          {bullet}
        </span>

        {/* 标题文字 */}
        {editable && isRoot ? (
          <span
            className="text-base font-semibold text-near-black flex-1 cursor-text
                       hover:underline hover:decoration-terracotta/30 hover:decoration-1
                       hover:underline-offset-2"
            onClick={() => onEdit?.(`item.${item.id}.title`, item.title)}
          >
            {item.title}
          </span>
        ) : (
          <span
            className={`flex-1 ${
              isRoot
                ? 'text-base font-semibold text-near-black'
                : 'text-sm text-olive-gray'
            }`}
          >
            {item.title}
          </span>
        )}

        {/* 删除按钮（编辑态） */}
        {editable && onRemove && (
          <button
            onClick={() => onRemove(item.id)}
            className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-red-50 transition-opacity shrink-0"
          >
            <X size={12} className="text-red-400" />
          </button>
        )}
      </div>

      {/* 递归渲染子节点 */}
      {item.children?.map((child) => (
        <OutlineNode
          key={child.id}
          item={child}
          depth={depth + 1}
          editable={editable}
          onEdit={onEdit}
          onRemove={onRemove}
        />
      ))}
    </div>
  );
}

/* ── 主卡片 ── */
export default function ContentOutlineCard({
  data,
  editable,
  onEdit,
  onAction,
}: CardProps<OutlineData>) {
  const [confirmed, setConfirmed] = useState(data.status === 'confirmed');

  const handleConfirm = () => {
    setConfirmed(true);
    onAction?.('confirm');
  };

  return (
    <div className="rounded-xl border border-border-cream bg-ivory/90 overflow-hidden">
      {/* ── 淡橙色渐变顶部条 ── */}
      <div className="h-1 bg-gradient-to-r from-terracotta/60 via-terracotta/30 to-transparent" />

      {/* ── 标题栏 ── */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-warm-sand/30 border-b border-border-cream">
        <div className="flex items-center gap-2">
          <List size={14} className="text-terracotta" />
          <span className="text-xs font-medium text-near-black">内容大纲</span>
          {confirmed && (
            <span className="px-1.5 py-0.5 rounded text-[9px] bg-success-green/10 text-success-green font-medium">
              已确认
            </span>
          )}
        </div>
      </div>

      {/* ── 内容区 ── */}
      <div className="p-3">
        {/* 大纲标题 */}
        <h4 className="text-base font-serif font-semibold text-near-black mb-3 px-2">
          {data.title}
        </h4>

        {/* 树状大纲列表 */}
        <div className="space-y-0.5">
          {data.items.map((item) => (
            <OutlineNode
              key={item.id}
              item={item}
              depth={0}
              editable={editable && !confirmed}
              onEdit={onEdit}
              onRemove={undefined}
            />
          ))}
        </div>

        {/* ── 操作按钮（已确认时隐藏） ── */}
        {!confirmed && (
          <div className="flex items-center gap-2 mt-3 pt-2 border-t border-border-cream">
            <button
              onClick={handleConfirm}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-terracotta text-ivory text-[11px] font-medium
                         hover:bg-terracotta/90 active:scale-[0.97] transition-all"
            >
              <Check size={12} />
              确认大纲
            </button>
            <button
              onClick={() => onAction?.('regenerate')}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-warm-sand text-olive-gray text-[11px]
                         hover:bg-terracotta/10 hover:text-terracotta transition-colors"
            >
              <RotateCcw size={12} />
              重新生成
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
