import { describe, expect, it } from 'vitest';
import { mockBalance, parsePrices, type Token } from './tokens';
import { convert, rate, sanitizeAmount, validateSwap } from './swap';
import { formatAmount, formatUsd, toInputValue } from './format';

const token = (symbol: string, price: number, balance = 100): Token => ({
  symbol,
  price,
  balance,
  iconUrl: '',
});

describe('parsePrices', () => {
  it('keeps the latest price per currency and drops invalid prices', () => {
    const tokens = parsePrices([
      { currency: 'ETH', date: '2023-08-29T07:10:00Z', price: 1600 },
      { currency: 'ETH', date: '2023-08-29T07:11:00Z', price: 1650 },
      { currency: 'BUSD', date: '2023-08-29T07:10:00Z', price: 1 },
      { currency: 'BAD', date: '2023-08-29T07:10:00Z', price: 0 },
      { currency: 'NAN', date: '2023-08-29T07:10:00Z', price: Number.NaN },
    ]);
    expect(tokens.map((t) => [t.symbol, t.price])).toEqual([
      ['BUSD', 1],
      ['ETH', 1650],
    ]);
  });
});

describe('mockBalance', () => {
  it('is deterministic and positive', () => {
    expect(mockBalance('ETH', 1650)).toBe(mockBalance('ETH', 1650));
    expect(mockBalance('ETH', 1650)).toBeGreaterThan(0);
  });
});

describe('rate / convert', () => {
  const eth = token('ETH', 2000);
  const usdc = token('USDC', 1);

  it('converts through USD prices', () => {
    expect(rate(eth, usdc)).toBe(2000);
    expect(convert(1.5, eth, usdc)).toBe(3000);
    expect(convert(3000, usdc, eth)).toBe(1.5);
  });
});

describe('sanitizeAmount', () => {
  it('accepts decimals and normalises commas and leading zeros', () => {
    expect(sanitizeAmount('')).toBe('');
    expect(sanitizeAmount('12.5')).toBe('12.5');
    expect(sanitizeAmount('0,5')).toBe('0.5');
    expect(sanitizeAmount('007')).toBe('7');
    expect(sanitizeAmount('0.')).toBe('0.');
    expect(sanitizeAmount('.5')).toBe('.5');
  });

  it('rejects anything else', () => {
    for (const bad of ['abc', '1.2.3', '-1', '1e5', '1 000']) {
      expect(sanitizeAmount(bad)).toBeNull();
    }
  });
});

describe('validateSwap', () => {
  const eth = token('ETH', 2000, 2);
  const usdc = token('USDC', 1);

  it('reports the first blocking problem', () => {
    expect(validateSwap({ from: null, to: usdc, amount: '1' })).toBe('select-token');
    expect(validateSwap({ from: eth, to: eth, amount: '1' })).toBe('same-token');
    expect(validateSwap({ from: eth, to: usdc, amount: '' })).toBe('enter-amount');
    expect(validateSwap({ from: eth, to: usdc, amount: '0' })).toBe('enter-amount');
    expect(validateSwap({ from: eth, to: usdc, amount: '.' })).toBe('enter-amount');
    expect(validateSwap({ from: eth, to: usdc, amount: '2.01' })).toBe('insufficient-balance');
  });

  it('passes a valid swap, including the full balance', () => {
    expect(validateSwap({ from: eth, to: usdc, amount: '2' })).toBeNull();
    expect(validateSwap({ from: eth, to: usdc, amount: '0.5' })).toBeNull();
  });
});

describe('format', () => {
  it('formats USD', () => {
    expect(formatUsd(1234.5)).toBe('$1,234.50');
    expect(formatUsd(0.001)).toBe('< $0.01');
    expect(formatUsd(0)).toBe('$0.00');
  });

  it('formats amounts by magnitude', () => {
    expect(formatAmount(12345.6789)).toBe('12,345.68');
    expect(formatAmount(1.23456789)).toBe('1.2346');
    expect(formatAmount(0.000012345)).toBe('0.00001235');
    expect(formatAmount(0)).toBe('0');
  });

  it('produces input-safe values', () => {
    expect(toInputValue(12345.6789)).toBe('12345.68');
    expect(toInputValue(0)).toBe('');
  });
});
