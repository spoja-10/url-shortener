import { useState } from 'react';
import { useClipboard } from '../hooks/useClipboard';

export function ShortenForm({ onShorten, loading }) {
  const [url, setUrl] = useState('');
  const [customCode, setCustomCode] = useState('');
  const [expiresIn, setExpiresIn] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const { copied, copy } = useClipboard();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!url.trim()) return;
    setError(null);
    setResult(null);

    try {
      const data = await onShorten({
        originalUrl: url.trim(),
        ...(customCode.trim() && { customCode: customCode.trim() }),
        ...(expiresIn && { expiresIn }),
      });
      setResult(data);
      setUrl('');
      setCustomCode('');
      setExpiresIn('');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <form className="shorten-card" onSubmit={handleSubmit}>
        <span className="shorten-card__label">// paste your long URL</span>

        <div className="shorten-card__row">
          <input
            className="input"
            type="url"
            placeholder="https://your-very-long-url.com/with/lots/of/path"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
          />
          <button className="btn btn--primary" type="submit" disabled={loading || !url.trim()}>
            {loading ? <span className="spinner" /> : 'Snip →'}
          </button>
        </div>

        <div className="shorten-card__advanced">
          <button
            type="button"
            className="shorten-card__advanced-toggle"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            {showAdvanced ? '▲ hide options' : '▼ advanced options'}
          </button>

          {showAdvanced && (
            <div className="advanced-fields">
              <div className="field-group">
                <label>Custom Code</label>
                <input
                  className="input"
                  type="text"
                  placeholder="my-link"
                  value={customCode}
                  onChange={(e) => setCustomCode(e.target.value)}
                  maxLength={20}
                />
              </div>
              <div className="field-group">
                <label>Expires In (days)</label>
                <input
                  className="input"
                  type="number"
                  placeholder="e.g. 7"
                  value={expiresIn}
                  onChange={(e) => setExpiresIn(e.target.value)}
                  min="1"
                  max="365"
                />
              </div>
            </div>
          )}
        </div>
      </form>

      {error && (
        <div className="alert alert--error">
          <span>✗</span> {error}
        </div>
      )}

      {result && (
        <div className="result-banner">
          <span className="result-banner__label">ready →</span>
          <a
            className="result-banner__url"
            href={result.shortUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            {result.shortUrl}
          </a>
          <button
            className={`btn btn--copy${copied ? ' copied' : ''}`}
            onClick={() => copy(result.shortUrl)}
          >
            {copied ? '✓ Copied' : 'Copy'}
          </button>
        </div>
      )}
    </div>
  );
}
