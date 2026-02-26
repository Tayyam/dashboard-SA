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

const SLICE_COLORS: Record<string, string> = {
  Male:   '#046A38',
  Female: '#2563eb',
};
const FALLBACK = ['#046A38', '#2563eb', '#d97706', '#7c3aed', '#dc2626'];

const tooltipStyle = {
  background: '#1e293b',
  border: '1px solid #046A38',
  borderRadius: 8,
  color: '#f8fafc',
  fontSize: 12,
};

const RADIAN = Math.PI / 180;

interface LabelProps {
  cx: number;
  cy: number;
  midAngle: number;
  innerRadius: number;
  outerRadius: number;
  value: number;
  name: string;
  percent: number;
}

function renderInnerLabel({ cx, cy, midAngle, innerRadius, outerRadius, value, name, percent }: LabelProps) {
  // Place label at 60% between inner and outer radius
  const radius = innerRadius + (outerRadius - innerRadius) * 0.60;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  if (percent < 0.05) return null;

  return (
    <text
      x={x}
      y={y}
      textAnchor="middle"
      dominantBaseline="central"
      style={{ pointerEvents: 'none', userSelect: 'none' }}
    >
      <tspan x={x} dy="-0.9em" fill="white" fontSize={11} fontWeight={600}>
        {name}
      </tspan>
      <tspan x={x} dy="1.3em" fill="white" fontSize={13} fontWeight={700}>
        {value.toLocaleString()}
      </tspan>
      <tspan x={x} dy="1.2em" fill="rgba(255,255,255,0.85)" fontSize={11}>
        {(percent * 100).toFixed(1)}%
      </tspan>
    </text>
  );
}

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
          innerRadius="30%"
          outerRadius="65%"
          dataKey="value"
          nameKey="label"
          paddingAngle={2}
          onClick={(d) => onSegmentClick(d.label)}
          cursor="pointer"
          label={renderInnerLabel as never}
          labelLine={false}
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
        <Tooltip
          contentStyle={tooltipStyle}
          formatter={(value, name) => {
            const formattedValue =
              typeof value === 'number' ? value.toLocaleString() : String(value ?? '');
            return [formattedValue, name];
          }}
        />
        <Legend
          formatter={(value) => (
            <span style={{ color: '#475569', fontSize: 12, fontWeight: 500 }}>{value}</span>
          )}
        />
      </RePieChart>
    </ResponsiveContainer>
  );
}
