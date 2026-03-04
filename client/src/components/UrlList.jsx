import { useEffect } from 'react';
import { UrlCard } from './UrlCard';

export function UrlList({ urls, loading, pagination, onFetch, onDelete }) {
  useEffect(() => {
    onFetch(1);
  }, []);

  if (loading && urls.length === 0) {
    return (
      <div className="loading-row">
        <span className="spinner" />
        <span>Loading links…</span>
      </div>
    );
  }

  if (!loading && urls.length === 0) {
    return (
      <div className="empty-state">
        <span className="empty-state__icon">✂</span>
        <p className="empty-state__text">No links yet — snip your first URL above</p>
      </div>
    );
  }

  return (
    <div>
      <div className="url-list">
        {urls.map((url) => (
          <UrlCard
            key={url.id || url.shortCode}
            url={url}
            onDelete={onDelete}
            onRefresh={() => onFetch(pagination?.page || 1)}
          />
        ))}
      </div>

      {pagination && pagination.pages > 1 && (
        <div className="pagination">
          <button
            className="pagination__btn"
            disabled={pagination.page <= 1 || loading}
            onClick={() => onFetch(pagination.page - 1)}
          >
            ← Prev
          </button>
          <span className="pagination__info">
            {pagination.page} / {pagination.pages}
          </span>
          <button
            className="pagination__btn"
            disabled={pagination.page >= pagination.pages || loading}
            onClick={() => onFetch(pagination.page + 1)}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
