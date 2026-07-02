export function formatTimestamp(seconds?: number): string {
  if (!seconds) return "-"
  return new Date(seconds * 1000).toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  })
}

export function formatClock(seconds?: number): string {
  if (!seconds) return "-"
  return new Date(seconds * 1000).toLocaleTimeString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
}

