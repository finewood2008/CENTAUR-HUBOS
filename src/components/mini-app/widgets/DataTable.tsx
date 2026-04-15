// Mini App Widget: 数据表格
import { useState } from 'react';
import { Search, ChevronUp, ChevronDown } from 'lucide-react';
import type { TableWidget as TableWidgetConfig } from '../../../types/mini-app';

interface Props {
  config: TableWidgetConfig;
  data: Record<string, unknown>[];
}

export default function DataTable({ config, data }: Props) {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(0);

  const pageSize = config.pageSize || 10;

  // 搜索过滤
  const filtered = search
    ? data.filter((row) =>
        config.columns.some((col) =>
          String(row[col.key] ?? '').toLowerCase().includes(search.toLowerCase())
        )
      )
    : data;

  // 排序
  const sorted = sortKey
    ? [...filtered].sort((a, b) => {
        const va = String(a[sortKey] ?? '');
        const vb = String(b[sortKey] ?? '');
        return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
      })
    : filtered;

  // 分页
  const totalPages = Math.ceil(sorted.length / pageSize);
  const paged = sorted.slice(page * pageSize, (page + 1) * pageSize);

  const toggleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const renderCell = (row: Record<string, unknown>, col: typeof config.columns[0]) => {
    const val = row[col.key];
    switch (col.render) {
      case 'badge':
        return (
          <span className="px-2 py-0.5 bg-white/10 text-gray-300 rounded-full text-[10px]">
            {String(val ?? '')}
          </span>
        );
      case 'progress': {
        const num = Number(val) || 0;
        return (
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-orange-500 rounded-full"
                style={{ width: `${Math.min(100, num)}%` }}
              />
            </div>
            <span className="text-[10px] text-gray-500">{num}%</span>
          </div>
        );
      }
      case 'avatar':
        return <span className="text-lg">{String(val ?? '👤')}</span>;
      default:
        return <span className="text-gray-300">{String(val ?? '-')}</span>;
    }
  };

  return (
    <div className="space-y-3">
      {/* 搜索栏 */}
      {config.searchable && (
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            placeholder="搜索..."
            className="w-full pl-8 pr-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-white placeholder-gray-600 focus:outline-none focus:border-orange-500/30"
          />
        </div>
      )}

      {/* 表格 */}
      <div className="overflow-x-auto rounded-xl border border-white/5">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-white/[0.03]">
              {config.columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => toggleSort(col.key)}
                  className={`px-4 py-3 font-medium text-gray-400 cursor-pointer hover:text-white transition-colors ${
                    col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                  }`}
                  style={col.width ? { width: col.width } : undefined}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    {sortKey === col.key && (
                      sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 ? (
              <tr>
                <td colSpan={config.columns.length} className="px-4 py-8 text-center text-gray-600">
                  {config.emptyText || '暂无数据'}
                </td>
              </tr>
            ) : (
              paged.map((row, i) => (
                <tr
                  key={i}
                  className="border-t border-white/5 hover:bg-white/[0.02] transition-colors"
                >
                  {config.columns.map((col) => (
                    <td
                      key={col.key}
                      className={`px-4 py-3 ${
                        col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                      }`}
                    >
                      {renderCell(row, col)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 分页 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-[10px] text-gray-500">
          <span>共 {sorted.length} 条</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 disabled:opacity-30"
            >
              上一页
            </button>
            <span className="px-2 text-gray-400">{page + 1} / {totalPages}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 disabled:opacity-30"
            >
              下一页
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
