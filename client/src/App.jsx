import { useUrls } from './hooks/useUrls';
import { ShortenForm } from './components/ShortenForm';
import { UrlList } from './components/UrlList';

export default function App() {
  const { urls, loading, error, pagination, fetchUrls, createUrl, removeUrl } = useUrls();

  return (
    <div className="app">
      <header className="header">
        <h1 className="header__wordmark">
          sn<span>i</span>p
        </h1>
        <span className="header__tagline">url shortener</span>
      </header>

      <main>
        <ShortenForm onShorten={createUrl} loading={loading} />

        {error && (
          <div className="alert alert--error">
            <span>✗</span> {error}
          </div>
        )}

        <div className="section-header">
          <span className="section-title">
            Your links {pagination ? `(${pagination.total})` : ''}
          </span>
          <button
            className="btn btn--ghost"
            onClick={() => fetchUrls(1)}
            disabled={loading}
            style={{ background: 'transparent', color: 'var(--muted)', border: '1.5px solid rgba(26,26,26,0.15)', fontSize: '0.72rem', padding: '0.35rem 0.75rem' }}
          >
            {loading ? <span className="spinner" style={{ width: '12px', height: '12px', borderWidth: '1.5px' }} /> : '↺ Refresh'}
          </button>
        </div>

        <UrlList
          urls={urls}
          loading={loading}
          pagination={pagination}
          onFetch={fetchUrls}
          onDelete={removeUrl}
        />
      </main>

      <footer className="footer">
        <span className="footer__text">snip — built with Node.js, Express, MongoDB, React</span>
        <span className="footer__text" style={{ color: 'var(--amber)' }}>v1.0.0</span>
      </footer>
    </div>
  );
}
