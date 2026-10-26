const test = require('node:test');
const assert = require('node:assert/strict');

const { sum_to_n_a, sum_to_n_b, sum_to_n_c } = require('./sum-to-n.js');

const IMPLS = [
  ['sum_to_n_a', sum_to_n_a],
  ['sum_to_n_b', sum_to_n_b],
  ['sum_to_n_c', sum_to_n_c],
];

// Reference value: sum of 1..n for n >= 0, and -(1 + ... + |n|) for n < 0.
const expected = (n) => (Math.sign(n) * Math.abs(n) * (Math.abs(n) + 1)) / 2;

for (const [name, fn] of IMPLS) {
  test(`${name}: known positive values`, () => {
    assert.equal(fn(1), 1);
    assert.equal(fn(5), 15);
    assert.equal(fn(10), 55);
    assert.equal(fn(100), 5050);
  });

  test(`${name}: zero`, () => {
    assert.equal(fn(0), 0);
  });

  test(`${name}: negative n sums toward -1`, () => {
    assert.equal(fn(-1), -1);
    assert.equal(fn(-3), -6);
    assert.equal(fn(-100), -5050);
  });

  test(`${name}: matches the formula for -1000..1000`, () => {
    for (let n = -1000; n <= 1000; n++) {
      assert.equal(fn(n), expected(n), `n = ${n}`);
    }
  });
}

test('all three implementations agree', () => {
  for (let n = -500; n <= 500; n++) {
    assert.equal(sum_to_n_a(n), sum_to_n_b(n), `a vs b at n = ${n}`);
    assert.equal(sum_to_n_b(n), sum_to_n_c(n), `b vs c at n = ${n}`);
  }
});

test('sum_to_n_a and sum_to_n_b handle large n', () => {
  assert.equal(sum_to_n_a(1e6), 500000500000);
  assert.equal(sum_to_n_b(1e6), 500000500000);
  assert.equal(sum_to_n_a(-1e6), -500000500000);
});
