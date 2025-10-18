type Segment = [number, number];

export type RawVideoProgressRow = {
  course_id?: string | null;
  unit_id?: string | null;
  video_id?: string | null;
  video_duration?: number | null;
  covered_segments?: unknown;
};

export type AggregatedCourseProgress = {
  watchedSeconds: number;
  availableSeconds: number;
};

const toFiniteNumber = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
};

const collectSegments = (value: unknown, segments: Segment[]): void => {
  if (Array.isArray(value)) {
    if (value.length === 2) {
      const start = toFiniteNumber(value[0]);
      const end = toFiniteNumber(value[1]);
      if (start !== null && end !== null) {
        const normalizedStart = Math.min(start, end);
        const normalizedEnd = Math.max(start, end);
        segments.push([normalizedStart, normalizedEnd]);
        return;
      }
    }

    for (const item of value) {
      collectSegments(item, segments);
    }
    return;
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      collectSegments(parsed, segments);
    } catch {
      // Ignore invalid JSON strings
    }
    return;
  }

  if (value && typeof value === 'object') {
    const { start, end } = value as { start?: unknown; end?: unknown };
    const parsedStart = toFiniteNumber(start);
    const parsedEnd = toFiniteNumber(end);
    if (parsedStart !== null && parsedEnd !== null) {
      const normalizedStart = Math.min(parsedStart, parsedEnd);
      const normalizedEnd = Math.max(parsedStart, parsedEnd);
      segments.push([normalizedStart, normalizedEnd]);
    }
  }
};

const mergeSegments = (segments: Segment[]): Segment[] => {
  const sorted = segments
    .map(([start, end]) => {
      if (!Number.isFinite(start) || !Number.isFinite(end)) {
        return null;
      }

      if (end < start) {
        return [end, start] as Segment;
      }

      return [start, end] as Segment;
    })
    .filter((segment): segment is Segment => segment !== null)
    .sort((a, b) => a[0] - b[0]);

  if (sorted.length === 0) {
    return [];
  }

  const merged: Segment[] = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const [currentStart, currentEnd] = sorted[i];
    const last = merged[merged.length - 1];

    if (currentStart <= last[1]) {
      last[1] = Math.max(last[1], currentEnd);
    } else {
      merged.push([currentStart, currentEnd]);
    }
  }

  return merged;
};

const measureSegments = (segments: Segment[], videoDuration?: number | null): number => {
  if (!segments.length) {
    return 0;
  }

  const merged = mergeSegments(segments);
  let total = 0;

  for (const [start, end] of merged) {
    total += Math.max(0, end - start);
  }

  const normalizedVideoDuration = toFiniteNumber(videoDuration);
  if (normalizedVideoDuration !== null && normalizedVideoDuration >= 0) {
    return Math.min(total, normalizedVideoDuration);
  }

  return total;
};

export const extractCoveredSegments = (value: unknown): Segment[] => {
  const segments: Segment[] = [];
  collectSegments(value, segments);
  return segments;
};

export const aggregateWatchedByCourse = (
  rows: RawVideoProgressRow[] | null | undefined
): Map<string, AggregatedCourseProgress> => {
  const courseMap = new Map<
    string,
    Map<
      string,
      {
        watched: number;
        available: number;
      }
    >
  >();

  if (!rows) {
    return new Map();
  }

  for (const row of rows) {
    if (!row) continue;

    const courseId = typeof row.course_id === 'string' ? row.course_id.trim() : '';
    if (!courseId) continue;

    const unitIdRaw =
      (typeof row.unit_id === 'string' ? row.unit_id.trim() : '') ||
      (typeof row.video_id === 'string' ? row.video_id.trim() : '');
    const unitId = unitIdRaw || '__default__';

    const segments = extractCoveredSegments(row.covered_segments);
    const watchedSeconds = measureSegments(segments, row.video_duration);
    const availableSeconds = Math.max(
      0,
      toFiniteNumber(row.video_duration) ?? watchedSeconds
    );

    if (watchedSeconds <= 0 && availableSeconds <= 0) {
      continue;
    }

    let unitMap = courseMap.get(courseId);
    if (!unitMap) {
      unitMap = new Map();
      courseMap.set(courseId, unitMap);
    }

    const entry = unitMap.get(unitId) ?? { watched: 0, available: 0 };
    entry.watched = Math.max(entry.watched, watchedSeconds);
    entry.available = Math.max(entry.available, availableSeconds);
    unitMap.set(unitId, entry);
  }

  const aggregated = new Map<string, AggregatedCourseProgress>();

  for (const [courseId, unitMap] of courseMap.entries()) {
    let watchedSeconds = 0;
    let availableSeconds = 0;

    for (const entry of unitMap.values()) {
      watchedSeconds += entry.watched;
      availableSeconds += Math.max(entry.available, entry.watched);
    }

    aggregated.set(courseId, {
      watchedSeconds: Math.max(0, Math.round(watchedSeconds)),
      availableSeconds: Math.max(0, Math.round(availableSeconds)),
    });
  }

  return aggregated;
};
