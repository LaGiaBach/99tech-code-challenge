import { useState, type FormEvent } from 'react';
import type { Token } from '../lib/tokens';
import { convert, rate, sanitizeAmount, validateSwap, type SwapError } from '../lib/swap';
import { formatAmount, formatUsd, toInputValue } from '../lib/format';
import { TokenIcon } from './TokenIcon';
import { TokenSelectModal } from './TokenSelectModal';

type Side = 'from' | 'to';

export interface SwapResult {
  from: Token;
  to: Token;
  fromAmount: number;
  toAmount: number;
}

interface Props {
  tokens: Token[];
  onSwap: (result: SwapResult) => Promise<void>;
}

const BUTTON_LABEL: Record<SwapError, (from: Token | null) => string> = {
  'select-token': () => 'Select a token',
  'same-token': () => 'Pick two different tokens',
  'enter-amount': () => 'Enter an amount',
  'insufficient-balance': (from) => `Insufficient ${from?.symbol} balance`,
};

export function SwapForm({ tokens, onSwap }: Props) {
  const find = (symbol: string) => tokens.find((t) => t.symbol === symbol) ?? null;

  const [fromSymbol, setFromSymbol] = useState(() => find('ETH')?.symbol ?? tokens[0]?.symbol);
  const [toSymbol, setToSymbol] = useState(() => find('USDC')?.symbol ?? tokens[1]?.symbol);
  // Amounts are entered on either side; the other side is derived from it.
  const [editedSide, setEditedSide] = useState<Side>('from');
  const [editedAmount, setEditedAmount] = useState('');
  const [picking, setPicking] = useState<Side | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [invertRate, setInvertRate] = useState(false);

  // Look tokens up by symbol so balances stay current after a swap.
  const from = fromSymbol ? find(fromSymbol) : null;
  const to = toSymbol ? find(toSymbol) : null;

  const editedValue = Number(editedAmount) || 0;
  const derived =
    from && to && editedValue > 0
      ? editedSide === 'from'
        ? convert(editedValue, from, to)
        : convert(editedValue, to, from)
      : 0;

  const fromInput = editedSide === 'from' ? editedAmount : toInputValue(derived);
  const toInput = editedSide === 'to' ? editedAmount : toInputValue(derived);
  const fromAmount = editedSide === 'from' ? editedValue : derived;
  const toAmount = editedSide === 'to' ? editedValue : derived;

  const error = validateSwap({ from, to, amount: fromAmount > 0 ? String(fromAmount) : '' });

  const setAmount = (side: Side, raw: string) => {
    const clean = sanitizeAmount(raw);
    if (clean === null) return;
    setEditedSide(side);
    setEditedAmount(clean);
  };

  const flip = () => {
    setFromSymbol(toSymbol);
    setToSymbol(fromSymbol);
    setEditedSide(editedSide === 'from' ? 'to' : 'from');
  };

  const pick = (token: Token) => {
    const other = picking === 'from' ? toSymbol : fromSymbol;
    // Picking the token already on the other side swaps the two.
    if (token.symbol === other) flip();
    else if (picking === 'from') setFromSymbol(token.symbol);
    else setToSymbol(token.symbol);
    setPicking(null);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (error || !from || !to || submitting) return;
    setSubmitting(true);
    try {
      await onSwap({ from, to, fromAmount, toAmount });
      setEditedAmount('');
    } finally {
      setSubmitting(false);
    }
  };

  const panel = (side: Side) => {
    const token = side === 'from' ? from : to;
    const value = side === 'from' ? fromInput : toInput;
    const amount = side === 'from' ? fromAmount : toAmount;
    const insufficient = side === 'from' && error === 'insufficient-balance';

    return (
      <div className={`panel ${insufficient ? 'panel--error' : ''}`}>
        <div className="panel__top">
          <label htmlFor={`amount-${side}`}>{side === 'from' ? 'You pay' : 'You receive'}</label>
          {token && (
            <span className="balance">
              Balance: {formatAmount(token.balance)}
              {side === 'from' && token.balance > 0 && (
                <button
                  type="button"
                  className="max-btn"
                  onClick={() => setAmount('from', String(token.balance))}
                >
                  MAX
                </button>
              )}
            </span>
          )}
        </div>

        <div className="panel__main">
          <input
            id={`amount-${side}`}
            className="amount"
            inputMode="decimal"
            autoComplete="off"
            placeholder="0"
            value={value}
            onChange={(e) => setAmount(side, e.target.value)}
            aria-invalid={insufficient}
          />
          <button type="button" className="token-btn" onClick={() => setPicking(side)}>
            {token ? (
              <>
                <TokenIcon symbol={token.symbol} src={token.iconUrl} />
                <span>{token.symbol}</span>
              </>
            ) : (
              <span>Select</span>
            )}
            <span className="caret">▾</span>
          </button>
        </div>

        <div className="panel__bottom">
          <span>{token && amount > 0 ? formatUsd(amount * token.price) : ' '}</span>
          {insufficient && <span className="error-text">Exceeds your balance</span>}
        </div>
      </div>
    );
  };

  return (
    <form className="card" onSubmit={submit} noValidate>
      <div className="card__head">
        <h1>Swap</h1>
        <span className="pill">Live prices</span>
      </div>

      {panel('from')}
      <div className="flip-wrap">
        <button type="button" className="flip" onClick={flip} aria-label="Switch tokens">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M7 4v16M3 16l4 4 4-4M17 20V4M13 8l4-4 4 4" />
          </svg>
        </button>
      </div>
      {panel('to')}

      {from && to && from.symbol !== to.symbol && (
        <button type="button" className="rate" onClick={() => setInvertRate(!invertRate)}>
          {invertRate
            ? `1 ${to.symbol} = ${formatAmount(rate(to, from))} ${from.symbol}`
            : `1 ${from.symbol} = ${formatAmount(rate(from, to))} ${to.symbol}`}
          <span className="rate__usd">
            ({formatUsd((invertRate ? to : from).price)})
          </span>
        </button>
      )}

      <button className="submit" type="submit" disabled={!!error || submitting}>
        {submitting ? (
          <>
            <span className="spinner" aria-hidden /> Swapping…
          </>
        ) : error ? (
          BUTTON_LABEL[error](from)
        ) : (
          'Swap'
        )}
      </button>

      {picking && (
        <TokenSelectModal
          tokens={tokens}
          selected={picking === 'from' ? from : to}
          onSelect={pick}
          onClose={() => setPicking(null)}
        />
      )}
    </form>
  );
}
