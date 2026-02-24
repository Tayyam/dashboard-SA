import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import type { ChartDataPoint } from '../core/types';

interface HistogramProps {
  data: ChartDataPoint[];
  onSegmentClick: (label: string) => void;
}

// Bell-curve tint: center bars darker primary, edges lighter
function getBarColor(index: number, total: number): string {
  const mid = (total - 1) / 2;
  const dist = Math.abs(index - mid) / (mid || 1); // 0 = center, 1 = edge
  // Interpolate between #046A38 (center) and #7abf9c (edges)
  const r = Math.round(4  + dist * (122 - 4));
  const g = Math.round(106 + dist * (191 - 106));
  const b = Math.round(56  + dist * (156 - 56));
  return `rgb(${r},${g},${b})`;
}

const tooltipStyle = {
  background: '#1e293b',
  border: '1px solid #046A38',
  borderRadius: 8,
  color: '#f8fafc',
  fontSize: 12,
};

export function Histogram({ data, onSegmentClick }: HistogramProps) {
  const hasFilter = data.some((d) => !d.isSelected);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 4, right: 12, left: 4, bottom: 34 }} barCategoryGap="6%">
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fill: '#475569', fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          angle={-30}
          textAnchor="end"
          interval={1}
        />
        <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(4,106,56,0.05)' }} />
        <Bar
          isAnimationActive
          animationDuration={220}
          animationEasing="ease-out"
          dataKey="value"
          radius={[4, 4, 0, 0]}
          cursor="pointer"
          onClick={(d: unknown) => onSegmentClick((d as { label: string }).label)}
        >
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={getBarColor(index, data.length)}
              opacity={!hasFilter || entry.isSelected ? 1 : 0.25}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
