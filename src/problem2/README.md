# Problem 2 — Fancy Form (currency swap)

A currency swap form built with **Vite + React + TypeScript**, plain CSS, no UI
library.

## Run

```bash
cd src/problem2
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check + production build
npm test         # unit tests for the swap logic (vitest)
```

## Features

- **Live prices** from `https://interview.switcheo.com/prices.json`. The feed
  has duplicate currencies and entries without a price; the app keeps the
  latest valid price per token and drops the rest.
- **Token icons** from the `Switcheo/token-icons` repo, with a coloured
  monogram fallback for tokens that have no SVG.
- **Two-way entry**: type in either "You pay" or "You receive" and the other
  side is calculated from the exchange rate.
- **Token picker**: searchable modal (Enter selects the top match, Esc closes),
  popular-token shortcuts, balance and USD value per token. Picking the token
  already on the other side swaps the two.
- **Validation**: only valid decimals can be typed (comma accepted as decimal
  point). The submit button explains what is missing — *Select a token*,
  *Enter an amount*, *Insufficient ETH balance* — and the pay panel turns red
  when the amount exceeds the balance.
- **Helpers**: MAX button, flip button, USD value under each amount, exchange
  rate line (click to invert).
- **Mock submit**: 1.5 s loading state, then a success toast; the simulated
  balances update.
- Loading skeleton, error state with retry, responsive down to phone width,
  respects `prefers-reduced-motion`.

## Structure

```
src/
  main.tsx                     entry
  App.tsx                      loads prices, loading/error states, mock submit, toast
  styles.css
  components/
    SwapForm.tsx               the form: amounts, flip, rate, submit
    TokenSelectModal.tsx       searchable token picker
    TokenIcon.tsx              SVG icon with monogram fallback
  lib/                         pure logic, unit tested
    tokens.ts                  fetch + clean price feed, mock balances
    swap.ts                    rate, conversion, input sanitising, validation
    format.ts                  USD / token amount formatting
    lib.test.ts
```

## Notes

- Wallet balances are mocked: each token gets a deterministic balance worth
  $20 – $5,000, derived from its symbol so it is stable across reloads.
- The exchange rate is `fromPrice / toPrice` (both prices are in USD). No fee
  or slippage is modelled.
