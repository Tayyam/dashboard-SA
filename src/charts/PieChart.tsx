import {
  PieChart as RePieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { ChartDataPoint } from '../core/types';

interface PieChartProps {
  data: ChartDataPoint[];
  onSegmentClick: (label: string) => void;
}

// Brand-aligned palette
const SLICE_COLORS: Record<string, string> = {
  Male:   '#046A38',   // primary green
  Female: '#2563eb',   // blue
};
const FALLBACK = ['#046A38', '#2563eb', '#d97706', '#7c3aed', '#dc2626'];

const tooltipStyle = {
  background: '#1e293b',
  border: '1px solid #046A38',
  borderRadius: 8,
  color: '#f8fafc',
  fontSize: 12,
};

export function PieChart({ data, onSegmentClick }: PieChartProps) {
  const hasFilter = data.some((d) => !d.isSelected);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <RePieChart>
        <Pie
          isAnimationActive
          animationDuration={220}
          animationEasing="ease-out"
          data={data}
          cx="50%"
          cy="44%"
          innerRadius="36%"
          outerRadius="62%"
          dataKey="value"
          nameKey="label"
          paddingAngle={3}
          onClick={(d) => onSegmentClick(d.label)}
          cursor="pointer"
        >
          {data.map((entry, index) => {
            const base = SLICE_COLORS[entry.label] ?? FALLBACK[index % FALLBACK.length];
            return (
              <Cell
                key={`cell-${index}`}
                fill={base}
                opacity={!hasFilter || entry.isSelected ? 1 : 0.2}
                stroke={hasFilter && entry.isSelected ? '#ffffff' : 'transparent'}
                strokeWidth={hasFilter && entry.isSelected ? 2 : 0}
              />
            );
          })}
        </Pie>
        <Tooltip contentStyle={tooltipStyle} />
        <Legend
          formatter={(value) => (
            <span style={{ color: '#475569', fontSize: 12, fontWeight: 500 }}>{value}</span>
          )}
        />
      </RePieChart>
    </ResponsiveContainer>
  );
}
