import type { Pilgrim, GroupedData, ChartDataPoint } from './types';
import { getAgeBucket } from './filterEngine';

type Dimension = keyof Pilgrim | 'age_bucket';

export function groupBy(data: Pilgrim[], dimension: Dimension): GroupedData {
  return data.reduce<GroupedData>((acc, pilgrim) => {
    const key =
      dimension === 'age_bucket'
        ? getAgeBucket(pilgrim.age)
        : String(pilgrim[dimension as keyof Pilgrim]);
    if (!acc[key]) acc[key] = [];
    acc[key].push(pilgrim);
    return acc;
  }, {});
}

export function aggregate(
  grouped: GroupedData,
  metric: 'count' | 'sum' | 'average',
  sumField?: keyof Pilgrim
): Record<string, number> {
  const result: Record<string, number> = {};
  for (const [key, items] of Object.entries(grouped)) {
    if (metric === 'count') {
      result[key] = items.length;
    } else if (metric === 'sum' && sumField) {
      result[key] = items.reduce((s, p) => s + Number(p[sumField]), 0);
    } else if (metric === 'average' && sumField) {
      result[key] = items.reduce((s, p) => s + Number(p[sumField]), 0) / items.length;
    }
  }
  return result;
}

export function toChartData(
  aggregated: Record<string, number>,
  selectedValue: string | null,
  sortDesc = true
): ChartDataPoint[] {
  const points: ChartDataPoint[] = Object.entries(aggregated).map(([label, value]) => ({
    label,
    value,
    isSelected: selectedValue === null || label === selectedValue,
  }));

  if (sortDesc) {
    points.sort((a, b) => b.value - a.value);
  }

  return points;
}

export function toSortedChartData(
  aggregated: Record<string, number>,
  selectedValue: string | null,
  sortBy: 'label' | 'value' = 'label'
): ChartDataPoint[] {
  const points: ChartDataPoint[] = Object.entries(aggregated).map(([label, value]) => ({
    label,
    value,
    isSelected: selectedValue === null || label === selectedValue,
  }));

  if (sortBy === 'label') {
    points.sort((a, b) => a.label.localeCompare(b.label));
  } else {
    points.sort((a, b) => b.value - a.value);
  }

  return points;
}
