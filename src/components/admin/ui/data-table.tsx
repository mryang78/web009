"use client";

import { useMemo, useState, type ReactNode } from "react";
import { Search, Download, ChevronLeft, ChevronRight } from "lucide-react";
import { useToast } from "@/components/admin/ui/toast";
import { EmptyState } from "@/components/product-kit/empty-state";
import { commonActions, emptyStateCopy } from "@/config/copy";
import { cn } from "@/lib/utils";

export interface DataTableColumn<T> {
  key: string;
  label: string;
  render?: (row: T) => ReactNode;
  className?: string;
  hideOnMobile?: boolean;
}

export interface DataTableFilter {
  label: string;
  value: string;
}

export function DataTable<T>({
  data,
  columns,
  rowKey,
  searchPlaceholder = commonActions.searchPlaceholder,
  searchFn,
  filters,
  filterFn,
  pageSize = 8,
  selectable = false,
  onRowClick,
  exportLabel = commonActions.export,
  emptyDescription,
}: {
  data: T[];
  columns: DataTableColumn<T>[];
  rowKey: (row: T) => string;
  searchPlaceholder?: string;
  searchFn?: (row: T, query: string) => boolean;
  filters?: DataTableFilter[];
  filterFn?: (row: T, value: string) => boolean;
  pageSize?: number;
  selectable?: boolean;
  onRowClick?: (row: T) => void;
  exportLabel?: string;
  /** 无搜索/筛选结果时的提示文案；缺省时回退到全局空状态文案库。 */
  emptyDescription?: string;
}) {
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState(filters?.[0]?.value ?? "all");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const toast = useToast();

  const filtered = useMemo(() => {
    let rows = data;
    if (filters && filterFn && activeFilter !== "all") {
      rows = rows.filter((r) => filterFn(r, activeFilter));
    }
    if (query.trim() && searchFn) {
      rows = rows.filter((r) => searchFn(r, query.trim().toLowerCase()));
    }
    return rows;
  }, [data, query, activeFilter, filters, filterFn, searchFn]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);

  const allOnPageSelected = pageRows.length > 0 && pageRows.every((r) => selected.has(rowKey(r)));

  function toggleAll() {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allOnPageSelected) {
        pageRows.forEach((r) => next.delete(rowKey(r)));
      } else {
        pageRows.forEach((r) => next.add(rowKey(r)));
      }
      return next;
    });
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // Generate visible page numbers for pagination
  function getPageNumbers(): (number | "...")[] {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages: (number | "...")[] = [1];
    if (page > 3) pages.push("...");
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
      pages.push(i);
    }
    if (page < totalPages - 2) pages.push("...");
    pages.push(totalPages);
    return pages;
  }

  return (
    <div className="glass-panel rounded-xl shadow-sm">
      {/* Toolbar */}
      <div className="flex flex-col gap-2.5 border-b border-border/70 p-3 sm:flex-row sm:items-center">
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground/50" />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder={searchPlaceholder}
            className="h-9 w-full rounded-lg border border-border/80 bg-background/60 pl-8 pr-3 text-[13px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow"
          />
        </div>

        <div className="flex items-center gap-2">
          {filters && (
            <div className="flex flex-wrap gap-1">
              {filters.map((f) => (
                <button
                  key={f.value}
                  onClick={() => {
                    setActiveFilter(f.value);
                    setPage(1);
                  }}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-[12px] font-medium transition-all duration-150",
                    activeFilter === f.value
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          )}

          {selectable && selected.size > 0 && (
            <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11.5px] font-medium text-primary">
              已选 {selected.size} 项
            </span>
          )}

          <button
            onClick={() => toast.success("分析模式：已生成导出任务。")}
            className="ml-auto inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-border/80 bg-secondary/20 px-3 text-[12.5px] font-medium text-foreground transition-colors hover:bg-secondary/60"
          >
            <Download className="size-3.5" />
            {exportLabel}
          </button>
        </div>
      </div>

      {pageRows.length === 0 ? (
        <EmptyState variant="no-results" description={emptyDescription ?? emptyStateCopy["default"]} className="border-0" />
      ) : (
        <div className="max-h-[min(70vh,640px)] overflow-auto">
          <table className="w-full text-left text-[13px]">
            <thead className="sticky top-0 z-10">
              <tr className="border-b border-border/70 bg-[color-mix(in_oklab,var(--muted)_92%,transparent)] text-[11px] uppercase tracking-wide text-muted-foreground backdrop-blur-sm">
                {selectable && (
                  <th className="w-9 px-3 py-3">
                    <input
                      type="checkbox"
                      checked={allOnPageSelected}
                      onChange={toggleAll}
                      className="size-3.5 rounded border-border accent-primary"
                    />
                  </th>
                )}
                {columns.map((c) => (
                  <th
                    key={c.key}
                    className={cn("px-4 py-3 font-semibold", c.hideOnMobile && "hidden sm:table-cell", c.className)}
                  >
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {pageRows.map((row) => {
                const id = rowKey(row);
                return (
                  <tr
                    key={id}
                    onClick={() => onRowClick?.(row)}
                    className={cn(
                      "group relative transition-colors duration-100",
                      onRowClick && "cursor-pointer hover:bg-primary/[0.03]"
                    )}
                  >
                    {selectable && (
                      <td className="px-3 py-3.5" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selected.has(id)}
                          onChange={() => toggleOne(id)}
                          className="size-3.5 rounded border-border accent-primary"
                        />
                      </td>
                    )}
                    {columns.map((c, ci) => (
                      <td
                        key={c.key}
                        className={cn(
                          "px-4 py-3.5",
                          ci === 0 && "relative",
                          c.hideOnMobile && "hidden sm:table-cell",
                          c.className
                        )}
                      >
                        {/* Left accent on first cell */}
                        {ci === 0 && onRowClick && (
                          <span className="pointer-events-none absolute inset-y-0 left-0 w-0.5 rounded-r-sm bg-primary opacity-0 transition-opacity duration-100 group-hover:opacity-100" />
                        )}
                        {c.render ? c.render(row) : String((row as Record<string, unknown>)[c.key] ?? "")}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {filtered.length > 0 && (
        <div className="flex items-center justify-between gap-3 border-t border-border/70 px-4 py-3 text-[12px] text-muted-foreground">
          <span className="font-medium">
            共 <span className="text-foreground">{filtered.length}</span> 条
          </span>
          <div className="flex items-center gap-1">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="inline-flex size-7 items-center justify-center rounded-md border border-border/80 text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground disabled:pointer-events-none disabled:opacity-35"
            >
              <ChevronLeft className="size-3.5" />
            </button>

            {getPageNumbers().map((p, i) =>
              p === "..." ? (
                <span key={`ellipsis-${i}`} className="px-1 text-muted-foreground/50">…</span>
              ) : (
                <button
                  key={p}
                  onClick={() => setPage(p as number)}
                  className={cn(
                    "inline-flex size-7 items-center justify-center rounded-md text-[12px] font-medium transition-colors",
                    page === p
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "border border-border/80 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                  )}
                >
                  {p}
                </button>
              )
            )}

            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="inline-flex size-7 items-center justify-center rounded-md border border-border/80 text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground disabled:pointer-events-none disabled:opacity-35"
            >
              <ChevronRight className="size-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
