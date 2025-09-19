export function formatSeriesLabel(series?: string | null): string | null {
  if (!series) return null;

  return series
    .split('-')
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
}
