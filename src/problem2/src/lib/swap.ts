import type { Token } from './tokens';

/** How many `to` tokens one `from` token buys. */
export const rate = (from: Token, to: Token) => from.price / to.price;

/** Convert an amount of `from` into the equivalent amount of `to`. */
export const convert = (amount: number, from: Token, to: Token) => amount * rate(from, to);

/**
 * Keep only what a user could mean by a decimal amount: digits and a single
 * decimal point. Commas are treated as a decimal point (common on mobile
 * keyboards in many locales). Returns null if the input should be rejected.
 */
export function sanitizeAmount(raw: string): string | null {
  const value = raw.replace(',', '.');
  if (value === '') return '';
  if (!/^\d*\.?\d*$/.test(value)) return null;
  // "007" -> "7", but keep "0." and "0.05".
  return value.replace(/^0+(?=\d)/, '');
}

export type SwapError =
  | 'select-token'
  | 'same-token'
  | 'enter-amount'
  | 'insufficient-balance';

export interface SwapInput {
  from: Token | null;
  to: Token | null;
  amount: string;
}

/** First problem that blocks the swap, or null if it can be submitted. */
export function validateSwap({ from, to, amount }: SwapInput): SwapError | null {
  if (!from || !to) return 'select-token';
  if (from.symbol === to.symbol) return 'same-token';
  const value = Number(amount);
  if (amount === '' || !Number.isFinite(value) || value <= 0) return 'enter-amount';
  if (value > from.balance) return 'insufficient-balance';
  return null;
}
