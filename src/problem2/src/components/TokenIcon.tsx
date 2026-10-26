import { useState } from 'react';

interface Props {
  symbol: string;
  src: string;
  size?: number;
}

/** Token logo, falling back to a coloured monogram when the SVG is missing. */
export function TokenIcon({ symbol, src, size = 28 }: Props) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    let hue = 0;
    for (const ch of symbol) hue = (hue * 31 + ch.charCodeAt(0)) % 360;
    return (
      <span
        className="token-icon token-icon--fallback"
        style={{ width: size, height: size, fontSize: size * 0.42, background: `hsl(${hue} 60% 45%)` }}
        aria-hidden
      >
        {symbol.slice(0, 2).toUpperCase()}
      </span>
    );
  }

  return (
    <img
      className="token-icon"
      src={src}
      alt=""
      width={size}
      height={size}
      onError={() => setFailed(true)}
    />
  );
}
