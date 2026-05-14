export function formatCurrency(value: number, compact = false): string {
  if (compact && Math.abs(value) >= 1e9) {
    return "$" + (value / 1e9).toFixed(2) + "B";
  }
  if (compact && Math.abs(value) >= 1e6) {
    return "$" + (value / 1e6).toFixed(2) + "M";
  }
  if (compact && Math.abs(value) >= 1e3) {
    return "$" + (value / 1e3).toFixed(1) + "K";
  }
  if (Math.abs(value) < 1 && value !== 0) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 4,
      maximumFractionDigits: 6,
    }).format(value);
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatLargeNumber(value: number): string {
  if (value >= 1e12) return (value / 1e12).toFixed(2) + "T";
  if (value >= 1e9) return (value / 1e9).toFixed(2) + "B";
  if (value >= 1e6) return (value / 1e6).toFixed(2) + "M";
  if (value >= 1e3) return (value / 1e3).toFixed(2) + "K";
  return value.toFixed(2);
}

export function formatPercent(value: number): string {
  return Math.abs(value).toFixed(2) + "%";
}

export function formatTimeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}
