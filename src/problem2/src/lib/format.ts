const usdFormat = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
});

export function formatUsd(value: number): string {
  if (value > 0 && value < 0.01) return '< $0.01';
  return usdFormat.format(value);
}

/**
 * Format a token amount with enough significant digits to be useful for both
 * large (12,345.67) and tiny (0.00001234) values.
 */
export function formatAmount(value: number): string {
  if (!Number.isFinite(value) || value === 0) return '0';
  const abs = Math.abs(value);
  const digits = abs >= 1000 ? 2 : abs >= 1 ? 4 : Math.min(8, 2 - Math.floor(Math.log10(abs)) + 2);
  return value.toLocaleString('en-US', { maximumFractionDigits: digits });
}

/** Like formatAmount but without grouping, so it can go back into an <input>. */
export function toInputValue(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return '';
  return formatAmount(value).replace(/,/g, '');
}
