// Shared formatting helpers so every experience's mock numbers look like real
// product data (fixed decimals, thousands separators, units) instead of
// placeholder integers like "123" / "999".

export function formatUSD(value: number, opts?: { decimals?: number }): string {
  const decimals = opts?.decimals ?? (value >= 100 ? 2 : value >= 1 ? 2 : 4);
  return `$${value.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}

export function formatCompactUSD(value: number): string {
  if (value >= 1_000_000_000_000) return `$${(value / 1_000_000_000_000).toFixed(2)}T`;
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(2)}K`;
  return formatUSD(value);
}

export function formatPercent(value: number, opts?: { signed?: boolean }): string {
  const signed = opts?.signed ?? true;
  const sign = signed && value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

export function formatQty(value: number, decimals = 4): string {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatCompactNumber(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return String(value);
}

/** e.g. "2分钟前" / "3小时前" / "1天前" from a minutes-ago integer */
export function formatMinutesAgoZh(minutesAgo: number): string {
  if (minutesAgo < 1) return "刚刚";
  if (minutesAgo < 60) return `${minutesAgo} 分钟前`;
  const hours = Math.floor(minutesAgo / 60);
  if (hours < 24) return `${hours} 小时前`;
  const days = Math.floor(hours / 24);
  return `${days} 天前`;
}

export function truncateAddress(address: string, head = 6, tail = 4): string {
  if (address.length <= head + tail + 3) return address;
  return `${address.slice(0, head)}...${address.slice(-tail)}`;
}
