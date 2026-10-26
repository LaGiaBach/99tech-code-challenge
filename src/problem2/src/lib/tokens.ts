export interface PriceRecord {
  currency: string;
  date: string;
  price: number;
}

export interface Token {
  symbol: string;
  price: number;
  iconUrl: string;
  /** Mock wallet balance, so the form has something to validate against. */
  balance: number;
}

const PRICES_URL = 'https://interview.switcheo.com/prices.json';
const ICON_BASE = 'https://raw.githubusercontent.com/Switcheo/token-icons/main/tokens';

export const iconUrl = (symbol: string) => `${ICON_BASE}/${symbol}.svg`;

/**
 * Deterministic mock balance worth roughly $20 - $5,000, derived from the
 * symbol so it stays the same across reloads.
 */
export function mockBalance(symbol: string, price: number): number {
  let hash = 0;
  for (const ch of symbol) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  const usd = 20 + (hash % 4981);
  const amount = usd / price;
  const decimals = amount >= 1000 ? 2 : amount >= 1 ? 4 : 6;
  return Number(amount.toFixed(decimals));
}

/**
 * The feed has duplicate currencies and some entries without a usable price.
 * Keep the most recent valid price per currency, sorted by symbol.
 */
export function parsePrices(records: PriceRecord[]): Token[] {
  const latest = new Map<string, PriceRecord>();
  for (const r of records) {
    if (!r.currency || !Number.isFinite(r.price) || r.price <= 0) continue;
    const prev = latest.get(r.currency);
    if (!prev || Date.parse(r.date) >= Date.parse(prev.date)) latest.set(r.currency, r);
  }
  return [...latest.values()]
    .map((r) => ({
      symbol: r.currency,
      price: r.price,
      iconUrl: iconUrl(r.currency),
      balance: mockBalance(r.currency, r.price),
    }))
    .sort((a, b) => a.symbol.localeCompare(b.symbol));
}

export async function fetchTokens(signal?: AbortSignal): Promise<Token[]> {
  const res = await fetch(PRICES_URL, { signal });
  if (!res.ok) throw new Error(`Price feed responded with ${res.status}`);
  return parsePrices((await res.json()) as PriceRecord[]);
}
