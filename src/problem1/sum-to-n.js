// Using Gauss fomula
var sum_to_n_a = function (n) {
  const sign = Math.sign(n);
  const m = Math.abs(n);
  return (sign * (m * (m + 1))) / 2;
};

//Using for loop

var sum_to_n_b = function (n) {
  const step = n < 0 ? -1 : 1;
  let sum = 0;
  for (let i = step; Math.abs(i) <= Math.abs(n); i += step) {
    sum += i;
  }
  return sum;
};

// Using recursion
var sum_to_n_c = function (n) {
  if (n === 0) return 0;
  return n + sum_to_n_c(n > 0 ? n - 1 : n + 1);
};

module.exports = { sum_to_n_a, sum_to_n_b, sum_to_n_c };

// Only runs with `node sum-to-n.js`, not when required by the tests.
if (require.main === module) {
  console.log(sum_to_n_a(5), sum_to_n_b(5), sum_to_n_c(5)); // 15 15 15
  console.log(sum_to_n_a(-3), sum_to_n_b(-3), sum_to_n_c(-3)); // -6 -6 -6
  console.log(sum_to_n_a(0), sum_to_n_b(0), sum_to_n_c(0)); // 0 0 0
}
