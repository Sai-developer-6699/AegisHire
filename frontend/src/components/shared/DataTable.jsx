import React from 'react';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { EmptyState } from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Inbox } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Standardized data table container with integrated Loading, Empty, and Pagination states.
 * Guarantees layout consistency for candidate lists, requirements, and logs.
 */
export function DataTable({
  columns, // [{ header: string, accessor: string | function, className?: string }]
  data = [],
  isLoading = false,
  emptyTitle = "No records found",
  emptyDescription = "There is currently no data loaded in this view.",
  emptyCtaText,
  onEmptyCtaClick,
  emptyIcon = Inbox,
  // Pagination
  pagination, // { currentPage, totalPages, onPageChange }
  onRowClick,
  className,
}) {
  return (
    <div className={cn("space-y-4 w-full select-none", className)}>
      <div className="rounded-xl border border-border/60 bg-card/15 overflow-hidden">
        <Table>
          <TableHeader className="bg-secondary/20">
            <TableRow className="border-b border-border/60 hover:bg-transparent">
              {columns.map((col, idx) => (
                <TableHead key={idx} className={cn("h-10 text-xs font-semibold uppercase tracking-wider text-muted-foreground/80 px-4", col.className)}>
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              // Loading Skeleton State
              Array.from({ length: 5 }).map((_, rIdx) => (
                <TableRow key={rIdx} className="border-b border-border/40 hover:bg-transparent">
                  {columns.map((col, cIdx) => (
                    <TableCell key={cIdx} className="px-4 py-4.5">
                      <div className="h-4 w-full animate-pulse rounded bg-secondary/60" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : data.length === 0 ? (
              // Empty State Row
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={columns.length} className="p-0">
                  <div className="py-12 px-4 flex justify-center">
                    <EmptyState
                      icon={emptyIcon}
                      title={emptyTitle}
                      description={emptyDescription}
                      ctaText={emptyCtaText}
                      onCtaClick={onEmptyCtaClick}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              // Data Population
              data.map((row, rIdx) => (
                <TableRow
                  key={rIdx}
                  onClick={() => onRowClick && onRowClick(row)}
                  className={cn(
                    "border-b border-border/40 transition-colors last:border-0",
                    onRowClick ? "cursor-pointer hover:bg-secondary/35" : "hover:bg-transparent"
                  )}
                >
                  {columns.map((col, cIdx) => {
                    const content = typeof col.accessor === 'function'
                      ? col.accessor(row)
                      : row[col.accessor];
                    return (
                      <TableCell key={cIdx} className={cn("px-4 py-3.5 text-xs text-foreground/85 font-medium", col.className)}>
                        {content}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Footer */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between px-2 text-xs text-muted-foreground select-none">
          <div>
            Showing Page <span className="font-semibold text-foreground/90">{pagination.currentPage}</span> of{" "}
            <span className="font-semibold text-foreground/90">{pagination.totalPages}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="icon-xs"
              onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage <= 1}
              className="border-border disabled:opacity-40"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline"
              size="icon-xs"
              onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage >= pagination.totalPages}
              className="border-border disabled:opacity-40"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DataTable;
