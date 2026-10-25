/** Date helpers in India Standard Time (the platform's reporting timezone). */
export function todayIST(now = new Date()): string {
  return new Date(now.getTime() + 5.5 * 3600 * 1000).toISOString().slice(0, 10);
}

export function addDays(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export const RANGE_PRESETS = { "7d": 7, "30d": 30, "90d": 90 } as const;
export type RangePreset = keyof typeof RANGE_PRESETS;

/** Resolve ?range=30d or ?from=&to= into an inclusive date range (defaults to last 30 days). */
export function resolveRange(params: { range?: string; from?: string; to?: string }, now = new Date()): { from: string; to: string; label: string } {
  const iso = /^\d{4}-\d{2}-\d{2}$/;
  if (params.from && params.to && iso.test(params.from) && iso.test(params.to) && params.from <= params.to) {
    const span = (Date.parse(params.to) - Date.parse(params.from)) / 86400000;
    if (span <= 366) return { from: params.from, to: params.to, label: `${params.from} to ${params.to}` };
  }
  const preset = (params.range && params.range in RANGE_PRESETS ? params.range : "30d") as RangePreset;
  const to = todayIST(now);
  return { from: addDays(to, -(RANGE_PRESETS[preset] - 1)), to, label: `Last ${RANGE_PRESETS[preset]} days` };
}
