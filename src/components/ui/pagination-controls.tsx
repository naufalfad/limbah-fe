import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function PaginationControls({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  className
}: PaginationControlsProps) {
  if (totalPages <= 1 && totalItems === 0) return null;

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  // Simple page window logic (show up to 5 pages)
  let pages = [];
  let startPage = Math.max(1, currentPage - 2);
  let endPage = Math.min(totalPages, startPage + 4);

  if (endPage - startPage < 4) {
    startPage = Math.max(1, endPage - 4);
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  return (
    <div className={cn("flex flex-col md:flex-row items-center justify-between px-4 py-3 bg-white border-t border-slate-200 gap-4", className)}>
      <div className="flex-1 text-sm text-slate-500 font-medium text-center md:text-left">
        Menampilkan <span className="font-bold text-slate-800">{totalItems === 0 ? 0 : startItem}</span> - <span className="font-bold text-slate-800">{endItem}</span> dari <span className="font-bold text-slate-800">{totalItems}</span> data
      </div>
      
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          className="h-8 w-8 p-0 rounded-none border-slate-200"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
        >
          <span className="sr-only">Previous Page</span>
          <ChevronLeft size={14} />
        </Button>
        
        {pages.map(p => (
          <Button
            key={p}
            variant={currentPage === p ? "default" : "outline"}
            size="sm"
            className={cn(
              "h-8 w-8 p-0 rounded-none font-bold text-xs",
              currentPage === p 
                ? "bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600" 
                : "border-slate-200 text-slate-600 hover:bg-slate-50"
            )}
            onClick={() => onPageChange(p)}
          >
            {p}
          </Button>
        ))}

        <Button
          variant="outline"
          size="sm"
          className="h-8 w-8 p-0 rounded-none border-slate-200"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
        >
          <span className="sr-only">Next Page</span>
          <ChevronRight size={14} />
        </Button>
      </div>
    </div>
  );
}
