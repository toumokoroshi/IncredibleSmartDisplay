export function formatTimeLabel(date: Date) {
  return new Intl.DateTimeFormat("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

const shortWeekdayLabels = ["日", "月", "火", "水", "木", "金", "土"];

export function formatShortWeekdayLabel(date: Date) {
  return shortWeekdayLabels[date.getDay()];
}

export function formatHeaderDateLabel(date: Date) {
  return `${date.getMonth() + 1}月${date.getDate()}日(${formatShortWeekdayLabel(date)})`;
}

export function formatDistanceToNowLabel(iso: string) {
  const deltaMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.max(0, Math.floor(deltaMs / 60000));
  if (minutes < 1) {
    return "たった今";
  }
  if (minutes < 60) {
    return `${minutes}分前`;
  }
  const hours = Math.floor(minutes / 60);
  return `${hours}時間前`;
}

export function formatScheduleLabel(iso: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}
