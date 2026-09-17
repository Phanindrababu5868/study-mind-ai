import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Numbered pagination control for list pages backed by the backend's
 * { page, limit, total, totalPages, hasNextPage, hasPrevPage } meta.
 *
 * Renders nothing if there's only one page (or no pages) of results.
 */
const Pagination = ({ pagination, onPageChange, className = "" }) => {
  if (!pagination || pagination.totalPages <= 1) return null;

  const { page, totalPages, hasNextPage, hasPrevPage } = pagination;

  const getPageNumbers = () => {
    const maxVisible = 5;
    if (totalPages <= maxVisible) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages = new Set([1, totalPages, page]);
    pages.add(Math.max(1, page - 1));
    pages.add(Math.min(totalPages, page + 1));

    return Array.from(pages)
      .filter((p) => p >= 1 && p <= totalPages)
      .sort((a, b) => a - b);
  };

  const pageNumbers = getPageNumbers();

  return (
    <nav
      role="navigation"
      aria-label="Pagination"
      className={`flex items-center justify-center gap-1.5 ${className}`}
    >
      <button
        type="button"
        onClick={() => onPageChange(page - 1)}
        disabled={!hasPrevPage}
        aria-label="Previous page"
        className="inline-flex items-center justify-center w-10 h-10 rounded-xl border-2 border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white"
      >
        <ChevronLeft className="w-4 h-4" strokeWidth={2.5} />
      </button>

      {pageNumbers.map((p, idx) => {
        const prev = pageNumbers[idx - 1];
        const showEllipsis = prev !== undefined && p - prev > 1;

        return (
          <React.Fragment key={p}>
            {showEllipsis && (
              <span className="px-1 text-sm text-slate-400 select-none">…</span>
            )}
            <button
              type="button"
              onClick={() => onPageChange(p)}
              aria-current={p === page ? "page" : undefined}
              className={`inline-flex items-center justify-center w-10 h-10 rounded-xl text-sm font-semibold transition-all duration-200 ${
                p === page
                  ? "bg-linear-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25"
                  : "border-2 border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300"
              }`}
            >
              {p}
            </button>
          </React.Fragment>
        );
      })}

      <button
        type="button"
        onClick={() => onPageChange(page + 1)}
        disabled={!hasNextPage}
        aria-label="Next page"
        className="inline-flex items-center justify-center w-10 h-10 rounded-xl border-2 border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white"
      >
        <ChevronRight className="w-4 h-4" strokeWidth={2.5} />
      </button>
    </nav>
  );
};

export default Pagination;