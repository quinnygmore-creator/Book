/** Format milliseconds as m:ss (e.g. 1:07). */
export function formatDuration(millis: number): string {
  const totalSec = Math.max(0, Math.floor(millis / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/** Format an ISO date as "Jun 3 · 2:14 PM". */
export function formatDate(iso: string): string {
  const d = new Date(iso);
  const date = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  const time = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  return `${date} · ${time}`;
}

/** Format an ISO date as "Tuesday, June 3" — for the page header. */
export function formatLongDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}
