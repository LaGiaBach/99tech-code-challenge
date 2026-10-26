# Problem 1 — Three ways to sum to n

[`sum-to-n.js`](./sum-to-n.js) — three implementations of
`sum_to_n(n) = 1 + 2 + ... + n`.
[`sum-to-n.test.js`](./sum-to-n.test.js) — tests using Node's built-in test
runner, no dependencies.

## Run

```bash
cd src/problem1
node sum-to-n.js     # prints a few sample results
node --test          # runs the tests
```

## Behaviour

| Input | Result | Example |
|---|---|---|
| `n > 0` | `1 + 2 + ... + n` | `sum_to_n(5) === 15` |
| `n = 0` | `0` | `sum_to_n(0) === 0` |
| `n < 0` | `-1 + -2 + ... + n` | `sum_to_n(-3) === -6` |

Input is assumed to be an integer, and the result is assumed to be below
`Number.MAX_SAFE_INTEGER`, as the problem statement guarantees.

## The three approaches

| | Approach | Time | Space |
|---|---|---|---|
| `sum_to_n_a` | Gauss formula `n(n+1)/2` | O(1) | O(1) |
| `sum_to_n_b` | `for` loop | O(n) | O(1) |
| `sum_to_n_c` | recursion | O(n) | O(n) call stack |

- **`sum_to_n_a`** computes the answer directly from `|n|` and puts the sign
  back afterwards. It is the fastest and the one to use in practice.
- **`sum_to_n_b`** steps from `±1` towards `n` (step `+1` or `-1` depending on
  the sign), adding each value.
- **`sum_to_n_c`** reduces `n` by one towards zero on each call. Each call adds
  a stack frame, so very large `|n|` (around 10,000 and up in Node) throws
  `RangeError: Maximum call stack size exceeded`.
