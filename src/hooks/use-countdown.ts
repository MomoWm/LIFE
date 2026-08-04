import { useEffect, useState } from 'react';

/**
 * Live "time until" string that re-renders on its own.
 *
 * A prayer time printed once is a fact the screen forgot about the moment it
 * rendered; a countdown makes the app feel like it is still watching the day
 * with you. Ticks once a minute above an hour out and every second inside the
 * last minute, so it is never busier than the information warrants.
 */
export function useCountdown(target: Date | null): string | null {
  const [, force] = useState(0);

  useEffect(() => {
    if (!target) return;
    const remaining = target.getTime() - Date.now();
    if (remaining <= 0) return;
    const interval = remaining < 60_000 ? 1_000 : 30_000;
    const id = setInterval(() => force((n) => n + 1), interval);
    return () => clearInterval(id);
  }, [target]);

  if (!target) return null;
  const ms = target.getTime() - Date.now();
  if (ms <= 0) return 'now';

  const totalMinutes = Math.floor(ms / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0) return `in ${hours}h ${minutes}m`;
  if (totalMinutes > 0) return `in ${totalMinutes}m`;
  return `in ${Math.max(1, Math.floor(ms / 1000))}s`;
}
