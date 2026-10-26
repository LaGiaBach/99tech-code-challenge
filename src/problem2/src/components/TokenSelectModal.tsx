import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { Token } from '../lib/tokens';
import { formatAmount, formatUsd } from '../lib/format';
import { TokenIcon } from './TokenIcon';

interface Props {
  tokens: Token[];
  selected: Token | null;
  onSelect: (token: Token) => void;
  onClose: () => void;
}

const POPULAR = ['ETH', 'USDC', 'WBTC', 'ATOM', 'OSMO'];

export function TokenSelectModal({ tokens, selected, onSelect, onClose }: Props) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q ? tokens.filter((t) => t.symbol.toLowerCase().includes(q)) : tokens;
    // Exact match first, then tokens the user holds most of (in USD).
    return [...list].sort((a, b) => {
      const exact = Number(b.symbol.toLowerCase() === q) - Number(a.symbol.toLowerCase() === q);
      return exact || b.balance * b.price - a.balance * a.price;
    });
  }, [tokens, query]);

  const popular = tokens.filter((t) => POPULAR.includes(t.symbol));

  return createPortal(
    <div className="scrim" onMouseDown={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label="Select a token"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="modal__head">
          <h2>Select a token</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <input
          ref={inputRef}
          className="search"
          placeholder="Search by symbol"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && filtered[0] && onSelect(filtered[0])}
        />

        {!query && popular.length > 0 && (
          <div className="chips">
            {popular.map((t) => (
              <button
                key={t.symbol}
                className={`chip ${selected?.symbol === t.symbol ? 'chip--active' : ''}`}
                onClick={() => onSelect(t)}
              >
                <TokenIcon symbol={t.symbol} src={t.iconUrl} size={20} />
                {t.symbol}
              </button>
            ))}
          </div>
        )}

        <ul className="token-list">
          {filtered.map((t) => (
            <li key={t.symbol}>
              <button
                className={`token-row ${selected?.symbol === t.symbol ? 'token-row--active' : ''}`}
                onClick={() => onSelect(t)}
              >
                <TokenIcon symbol={t.symbol} src={t.iconUrl} size={34} />
                <span className="token-row__name">
                  <strong>{t.symbol}</strong>
                  <small>{formatUsd(t.price)}</small>
                </span>
                <span className="token-row__bal">
                  <strong>{formatAmount(t.balance)}</strong>
                  <small>{formatUsd(t.balance * t.price)}</small>
                </span>
              </button>
            </li>
          ))}
          {filtered.length === 0 && <li className="empty">No token matches “{query}”.</li>}
        </ul>
      </div>
    </div>,
    document.body,
  );
}
