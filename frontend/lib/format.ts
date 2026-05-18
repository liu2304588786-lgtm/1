export function shortAddress(value: string) {
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

export function formatUsd6(raw: string) {
  const value = Number(raw) / 1e6;
  if (!Number.isFinite(value)) {
    return "$0.00";
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value < 0.01 ? 6 : 2
  }).format(value);
}

export function formatToken18(raw: string) {
  const value = Number(raw) / 1e18;
  return value.toLocaleString("en-US", {
    maximumFractionDigits: 2
  });
}

