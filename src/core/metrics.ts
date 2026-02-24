export const METRICS = {
  COUNT: 'count',
  SUM: 'sum',
  AVERAGE: 'average',
} as const;

export type MetricKey = keyof typeof METRICS;
