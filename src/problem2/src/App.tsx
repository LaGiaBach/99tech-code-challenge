import { useCallback, useEffect, useState } from 'react';
import { fetchTokens, type Token } from './lib/tokens';
import { formatAmount } from './lib/format';
import { SwapForm, type SwapResult } from './components/SwapForm';

type Status = { kind: 'loading' } | { kind: 'error'; message: string } | { kind: 'ready' };

interface Toast {
  id: number;
  text: string;
}

/** Stand-in for a backend call. */
const mockSubmit = () => new Promise((resolve) => setTimeout(resolve, 1500));

export default function App() {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [status, setStatus] = useState<Status>({ kind: 'loading' });
  const [toast, setToast] = useState<Toast | null>(null);

  const load = useCallback((signal?: AbortSignal) => {
    setStatus({ kind: 'loading' });
    fetchTokens(signal)
      .then((list) => {
        setTokens(list);
        setStatus({ kind: 'ready' });
      })
      .catch((err: Error) => {
        if (err.name !== 'AbortError') setStatus({ kind: 'error', message: err.message });
      });
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  const swap = async ({ from, to, fromAmount, toAmount }: SwapResult) => {
    await mockSubmit();
    setTokens((list) =>
      list.map((t) =>
        t.symbol === from.symbol
          ? { ...t, balance: Math.max(0, t.balance - fromAmount) }
          : t.symbol === to.symbol
            ? { ...t, balance: t.balance + toAmount }
            : t,
      ),
    );
    setToast({
      id: Date.now(),
      text: `Swapped ${formatAmount(fromAmount)} ${from.symbol} for ${formatAmount(toAmount)} ${to.symbol}`,
    });
  };

  return (
    <main className="page">
      <div className="glow" aria-hidden />

      {status.kind === 'loading' && (
        <div className="card card--skeleton" aria-busy="true" aria-label="Loading prices">
          <div className="sk sk--title" />
          <div className="sk sk--panel" />
          <div className="sk sk--panel" />
          <div className="sk sk--button" />
        </div>
      )}

      {status.kind === 'error' && (
        <div className="card card--center">
          <h1>Couldn’t load prices</h1>
          <p className="muted">{status.message}</p>
          <button className="submit" onClick={() => load()}>
            Try again
          </button>
        </div>
      )}

      {status.kind === 'ready' && <SwapForm tokens={tokens} onSwap={swap} />}

      <p className="footnote">
        Prices from Switcheo · Balances and swaps are simulated
      </p>

      {toast && (
        <div key={toast.id} className="toast" role="status">
          <span className="toast__check">✓</span>
          {toast.text}
        </div>
      )}
    </main>
  );
}
