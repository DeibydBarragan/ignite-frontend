"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

function getPageNumbers(current: number, total: number): (number | "...")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  if (current <= 4) {
    return [1, 2, 3, 4, 5, "...", total];
  }
  if (current >= total - 3) {
    return [1, "...", total - 4, total - 3, total - 2, total - 1, total];
  }
  return [1, "...", current - 1, current, current + 1, "...", total];
}

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
}: PaginationProps) {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-black/5 dark:border-white/5">
      <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
        Mostrando{" "}
        <span className="font-semibold text-slate-900 dark:text-white">
          {(currentPage - 1) * itemsPerPage + 1}
        </span>
        –
        <span className="font-semibold text-slate-900 dark:text-white">
          {Math.min(currentPage * itemsPerPage, totalItems)}
        </span>{" "}
        de{" "}
        <span className="font-semibold text-slate-900 dark:text-white">
          {totalItems}
        </span>{" "}
        canciones
      </div>

      <div className="flex items-center gap-1.5 flex-wrap justify-center">
        {/* Botón Anterior */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="glass-btn px-2.5 py-1.5 text-xs flex items-center gap-1 text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:text-purple-400 hover:border-purple-500/30 transition-all cursor-pointer"
          aria-label="Página anterior"
        >
          <ChevronLeft size={14} />
          <span className="hidden sm:inline">Anterior</span>
        </button>

        {/* Números de página */}
        <div className="flex items-center gap-1">
          {getPageNumbers(currentPage, totalPages).map((p, idx) =>
            p === "..." ? (
              <span
                key={`dots-${idx}`}
                className="px-2 py-1 text-xs text-slate-400 select-none"
              >
                …
              </span>
            ) : (
              <button
                key={p}
                type="button"
                onClick={() => onPageChange(p)}
                className={`min-w-[32px] h-8 px-2 rounded-xl text-xs font-semibold flex items-center justify-center transition-all cursor-pointer ${
                  currentPage === p
                    ? "bg-purple-600 text-white shadow-md shadow-purple-600/30 ring-1 ring-purple-500"
                    : "glass-btn text-slate-600 dark:text-slate-300 hover:text-purple-400 hover:border-purple-500/30"
                }`}
              >
                {p}
              </button>
            )
          )}
        </div>

        {/* Botón Siguiente */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="glass-btn px-2.5 py-1.5 text-xs flex items-center gap-1 text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:text-purple-400 hover:border-purple-500/30 transition-all cursor-pointer"
          aria-label="Página siguiente"
        >
          <span className="hidden sm:inline">Siguiente</span>
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
