// Problem: useMemo, BoxProps, WalletRow, the hooks and `classes` were used without being imported
//          or declared (`classes.row` would throw a ReferenceError).
// Solution: Import everything the component uses. Paths are assumed, since the snippet does not
//           show the rest of the project.
import { useMemo } from 'react';
import { Box, type BoxProps } from '@mui/material';
import { useWalletBalances } from '../hooks/useWalletBalances';
import { usePrices } from '../hooks/usePrices';
import { WalletRow } from './WalletRow';
import classes from './WalletPage.module.css';

// Problem: `getPriority(blockchain: any)` accepted anything, so typos like 'osmosis' compiled fine
//          and silently fell through to the default branch.
// Solution: List the supported chains as a union type, so the priority table must cover every chain.
type Blockchain = 'Osmosis' | 'Ethereum' | 'Arbitrum' | 'Zilliqa' | 'Neo';

// Problem: A long switch statement inside the component, recreated on every render, plus a magic
//          `-99` meaning "unsupported" that the filter had to know about.
// Solution: A constant lookup table at module level, created once. A chain that is not in the
//           table is unsupported, so no sentinel value is needed.
const BLOCKCHAIN_PRIORITY: Readonly<Record<Blockchain, number>> = {
  Osmosis: 100,
  Ethereum: 50,
  Arbitrum: 30,
  Zilliqa: 20,
  Neo: 20,
};

const isSupportedBlockchain = (blockchain: string): blockchain is Blockchain =>
  Object.hasOwn(BLOCKCHAIN_PRIORITY, blockchain);

// Problem: `WalletBalance` had no `blockchain` field, yet the code read `balance.blockchain`
//          (a TypeScript error).
// Solution: Declare the field. It is a plain string because the API may return chains this page
//           does not support.
interface WalletBalance {
  currency: string;
  amount: number;
  blockchain: string;
}

// Problem: `FormattedWalletBalance` copied every field of `WalletBalance` by hand.
// Solution: Extend it, and add the priority so the sort does not have to look it up again.
interface FormattedWalletBalance extends WalletBalance {
  blockchain: Blockchain;
  priority: number;
  formatted: string;
}

// Problem: `amount.toFixed()` with no argument rounds to 0 decimals (0.75 ETH shows as "1") and
//          has no thousands separators.
// Solution: One shared Intl.NumberFormat, created once at module level.
const amountFormat = new Intl.NumberFormat('en-US', { maximumFractionDigits: 6 });

// Problem: If the hook returns undefined while loading, `balances.filter` throws.
// Solution: Fall back to a stable empty array. It is a module constant (not `?? []`) so useMemo
//           does not see a new array on every render.
const NO_BALANCES: WalletBalance[] = [];

// Problem: `interface Props extends BoxProps {}` was empty, and `React.FC<Props>` was combined with
//          a redundant `(props: Props)` annotation.
// Solution: A plain type alias and a normally typed function component.
type Props = BoxProps;

const WalletPage = ({ children, ...rest }: Props) => {
  const balances = useWalletBalances() ?? NO_BALANCES;
  const prices = usePrices();

  const sortedBalances = useMemo<FormattedWalletBalance[]>(() => {
    return (
      balances
        // Problem: The filter read `lhsPriority`, which is not defined (ReferenceError), and its
        //          condition was inverted: it KEPT balances with amount <= 0 and hid every real one.
        // Solution: Keep balances on a supported chain that have a positive amount.
        .filter(
          (balance): balance is WalletBalance & { blockchain: Blockchain } =>
            isSupportedBlockchain(balance.blockchain) && balance.amount > 0,
        )
        // Problem: getPriority was called twice per comparison, about 2·n·log(n) calls, and
        //          `formattedBalances` was a separate pass over the same array.
        // Solution: Work out the priority and the formatted amount once per balance, in a single pass.
        .map((balance) => ({
          ...balance,
          priority: BLOCKCHAIN_PRIORITY[balance.blockchain],
          formatted: amountFormat.format(balance.amount),
        }))
        // Problem: The comparator returned `undefined` for equal priorities instead of 0, which
        //          breaks the sort contract, and equal-priority chains (Zilliqa / Neo) came out in
        //          whatever order the API returned.
        // Solution: Return a number in every case: higher priority first, then currency A→Z.
        .sort((lhs, rhs) => rhs.priority - lhs.priority || lhs.currency.localeCompare(rhs.currency))
    );
    // Problem: `prices` was in the dependency array but not used inside, so every price tick
    //          re-filtered and re-sorted the list. `getPriority` was used but not listed, which
    //          breaks the exhaustive-deps rule.
    // Solution: Depend only on `balances`. The priority table now lives at module level, so it is
    //           not a dependency.
  }, [balances]);

  // Problem: `rows` mapped over `sortedBalances` instead of `formattedBalances`, so
  //          `balance.formatted` was always undefined, while the type annotation claimed otherwise.
  //          The rows were also rebuilt on every render.
  // Solution: Map over the already formatted list, and memoise on the two inputs that affect it.
  const rows = useMemo(
    () =>
      sortedBalances.map((balance) => {
        // Problem: `prices[currency] * amount` gives NaN when a token has no price.
        // Solution: Fall back to 0 when the price is missing.
        const price = prices?.[balance.currency];
        const usdValue = price !== undefined ? price * balance.amount : 0;

        return (
          <WalletRow
            className={classes.row}
            // Problem: `key={index}` lets React mix up rows when the list re-sorts, and
            //          `key={currency}` alone would collide (e.g. USDC on Ethereum and on Osmosis).
            // Solution: A key that is stable and unique per row: blockchain + currency.
            key={`${balance.blockchain}-${balance.currency}`}
            amount={balance.amount}
            usdValue={usdValue}
            formattedAmount={balance.formatted}
          />
        );
      }),
    [sortedBalances, prices],
  );

  // Problem: Props were typed as BoxProps but spread onto a plain <div>, so Box props such as `sx`
  //          or `p` were sent to the DOM (no effect, plus React warnings). `children` was taken out
  //          of props and then dropped without being rendered.
  // Solution: Render a real <Box> so its props work, and render `children` too.
  return (
    <Box {...rest}>
      {children}
      {rows}
    </Box>
  );
};

export default WalletPage;
