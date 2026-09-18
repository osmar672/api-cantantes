import React from 'react';

export default function Pagination({
  offset,
  limit,
  total,
  onPageChange,
  loading = false,
}) {
  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const canPrev = offset > 0 && !loading;
  const canNext = offset + limit < total && !loading;

  return (
    <div className="pagination">
      <button
        type="button"
        className="page-btn"
        disabled={!canPrev}
        onClick={() => onPageChange(Math.max(0, offset - limit))}
      >
        ← Anterior
      </button>

      <span className="page-info">
        Página {currentPage} de {totalPages}
        {total > 0 && (
          <span className="page-total"> ({total} resultados)</span>
        )}
      </span>

      <button
        type="button"
        className="page-btn"
        disabled={!canNext}
        onClick={() => onPageChange(offset + limit)}
      >
        Siguiente →
      </button>
    </div>
  );
}
