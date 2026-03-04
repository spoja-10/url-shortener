import { useState } from 'react';
import { getUrlStats } from '../utils/api';
import { useClipboard } from '../hooks/useClipboard';

function MiniChart({ dailyClicks }) {
  const entries = Object.entries(dailyClicks).slice(-14);
  if (entries.length === 0) return <p style={{ fontFamily: 'var(--mono)', fontSize: '0.75rem', color: 'var(--muted)' }}>No click data yet</p>;

  const max = Math.max(...entries.map(([, v]) => v), 1);

  return (
    <div>
      <p style={{ fontFamily: 'var(--mono)', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)', marginBottom: '0.5rem' }}>
        Clicks (last 14 days)
      </p>
      <div className="mini-chart" title="Daily clicks">
        {entries.map(([day, count]) => (
          <div
            key={day}
            className="mini-chart__bar"
            style={{ height: `${(count / max) * 100}%` }}
            title={`${day}: ${count} click${count !== 1 ? 's' : ''}`}
          />
        ))}
      </div>
    </div>
  );
}

export function UrlCard({ url, onDelete, onRefresh }) {
  const [expanded, setExpanded] = useState(false);
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const { copied, copy } = useClipboard();

  const toggleStats = async () => {
    if (expanded) {
      setExpanded(false);
      return;
    }
    setExpanded(true);
    if (!stats) {
      setLoadingStats(true);
      try {
        const data = await getUrlStats(url.shortCode);
        setStats(data);
      } catch (err) {
        console.error('Stats fetch error:', err);
      } finally {
        setLoadingStats(false);
      }
    }
  };

  const isExpired = url.expiresAt && new Date() > new Date(url.expiresAt);
  const shortUrl = url.shortUrl || `${window.location.origin.replace('5173', '5000')}/${url.shortCode}`;
  const createdDate = new Date(url.createdAt).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div className="url-card">
      <div className="url-card__left">
        <a className="url-card__short" href={shortUrl} target="_blank" rel="noopener noreferrer">
          {shortUrl}
        </a>
        <span className="url-card__original">{url.originalUrl}</span>
        <div className="url-card__meta">
          <span className="badge badge--clicks">↗ {url.clicks} clicks</span>
          <span className="badge badge--date">{createdDate}</span>
          {url.customCode && <span className="badge badge--custom">custom</span>}
          {isExpired && <span className="badge badge--expired">expired</span>}
        </div>
      </div>

      <div className="url-card__actions">
        <button
          className={`btn btn--copy${copied ? ' copied' : ''}`}
          onClick={() => copy(shortUrl)}
          title="Copy short URL"
        >
          {copied ? '✓' : 'Copy'}
        </button>
        <button
          className="btn btn--ghost"
          onClick={toggleStats}
          title="View analytics"
          style={{ background: 'transparent', color: 'var(--muted)', border: '1.5px solid rgba(26,26,26,0.2)', fontSize: '0.75rem', padding: '0.4rem 0.75rem' }}
        >
          {expanded ? '▲ stats' : '▼ stats'}
        </button>
        <button className="btn btn--danger" onClick={() => onDelete(url.shortCode)} title="Delete">
          ✕
        </button>
      </div>

      {expanded && (
        <div className="stats-drawer">
          {loadingStats ? (
            <div className="loading-row">
              <span className="spinner" />
              <span>Loading stats…</span>
            </div>
          ) : stats ? (
            <>
              <div className="stats-grid">
                <div className="stat-box">
                  <div className="stat-box__num">{stats.clicks}</div>
                  <div className="stat-box__label">Total Clicks</div>
                </div>
                <div className="stat-box">
                  <div className="stat-box__num">{Object.keys(stats.dailyClicks || {}).length}</div>
                  <div className="stat-box__label">Active Days</div>
                </div>
                <div className="stat-box">
                  <div className="stat-box__num">
                    {stats.expiresAt ? Math.max(0, Math.ceil((new Date(stats.expiresAt) - Date.now()) / 86400000)) : '∞'}
                  </div>
                  <div className="stat-box__label">Days Left</div>
                </div>
              </div>
              <MiniChart dailyClicks={stats.dailyClicks || {}} />
            </>
          ) : (
            <p style={{ fontFamily: 'var(--mono)', fontSize: '0.8rem', color: 'var(--muted)' }}>Could not load stats</p>
          )}
        </div>
      )}
    </div>
  );
}
