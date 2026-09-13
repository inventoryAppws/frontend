import { ChevronLeft, ChevronRight } from "lucide-react";

function Pagination({
  page,
  totalPages,
  onPageChange,
  totalItems,
  pageSize,
}) {
  if (!totalPages || totalPages <= 1) {
    return null;
  }

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages = [];
    const maxButtons = 5;
    let startPage = Math.max(1, page - 2);
    let endPage = Math.min(totalPages, startPage + maxButtons - 1);

    if (endPage - startPage + 1 < maxButtons) {
      startPage = Math.max(1, endPage - maxButtons + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  };

  const pageNumbers = getPageNumbers();

  const startItem = totalItems && pageSize ? (page - 1) * pageSize + 1 : null;
  const endItem = totalItems && pageSize ? Math.min(page * pageSize, totalItems) : null;

  return (
    <div className="pagination-container">
      {totalItems != null && startItem != null && endItem != null && (
        <div className="pagination-info">
          Showing <strong>{startItem}</strong>-<strong>{endItem}</strong> of{" "}
          <strong>{totalItems}</strong> orders
        </div>
      )}

      <div className="pagination">
        <button
          type="button"
          className="pagination-btn pagination-nav"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label="Previous page"
        >
          <ChevronLeft size={16} />
          <span>Previous</span>
        </button>

        <div className="pagination-pages">
          {pageNumbers.map((p) => (
            <button
              key={p}
              type="button"
              className={`pagination-btn pagination-num ${p === page ? "active" : ""}`}
              onClick={() => onPageChange(p)}
              aria-current={p === page ? "page" : undefined}
            >
              {p}
            </button>
          ))}
        </div>

        <button
          type="button"
          className="pagination-btn pagination-nav"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          aria-label="Next page"
        >
          <span>Next</span>
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

export default Pagination;