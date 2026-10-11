/**
 * A correlated demo week that always ends today: the nights with the least sleep precede the
 * worst knee flares. Anchored to `now` (not a fixed date) so it always lands inside Review's
 * default 30-day window.
 */
export function buildDemoWeek(now: number = Date.now()) {
  const pain = [2, 3, 6, 7, 5, 8, 3];
  const sleepMin = [450, 435, 330, 300, 360, 270, 450];
  const steps = [8200, 7600, 5100, 4300, 6000, 3800, 9000];
  const days = pain.map((_, i) => new Date(now - (pain.length - 1 - i) * 86_400_000).toISOString().slice(0, 10));
  return { days, pain, sleepMin, steps };
}
