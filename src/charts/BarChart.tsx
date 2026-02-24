import {
  BarChart as ReBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import type { ChartDataPoint } from '../core/types';

interface BarChartProps {
  data: ChartDataPoint[];
  onSegmentClick: (label: string) => void;
  color?: string;
  layout?: 'vertical' | 'horizontal';
  maxLabelLen?: number;
}

const PRIMARY     = '#046A38';
const PRIMARY_SEL = '#034d28';
const FADED       = '#c8dfd3';

function truncate(str: string, max: number) {
  return str.length > max ? str.slice(0, max) + '…' : str;
}

const tooltipStyle = {
  background: '#1e293b',
  border: '1px solid #046A38',
  borderRadius: 8,
  color: '#f8fafc',
  fontSize: 12,
};

export function BarChart({
  data,
  onSegmentClick,
  color = PRIMARY,
  layout = 'horizontal',
  maxLabelLen = 14,
}: BarChartProps) {
  const hasFilter = data.some((d) => !d.isSelected);

  const getColor = (point: ChartDataPoint) => {
    if (!hasFilter) return color;
    return point.isSelected ? PRIMARY_SEL : FADED;
  };

  const getOpacity = (point: ChartDataPoint) =>
    !hasFilter || point.isSelected ? 1 : 0.45;

  const handleClick = (payload: unknown) => {
    const item = payload as ChartDataPoint;
    if (item?.label) onSegmentClick(item.label);
  };

  if (layout === 'vertical') {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <ReBarChart
          data={data}
          layout="vertical"
          margin={{ top: 4, right: 48, left: 4, bottom: 4 }}
          barCategoryGap="28%"
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
          <XAxis
            type="number"
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="label"
            tick={{ fill: '#475569', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={125}
            tickFormatter={(v) => truncate(String(v), maxLabelLen)}
          />
          <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(4,106,56,0.05)' }} />
          <Bar
            dataKey="value"
            radius={[0, 5, 5, 0]}
            cursor="pointer"
            onClick={handleClick}
            isAnimationActive
            animationDuration={220}
            animationEasing="ease-out"
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={getColor(entry)}
                opacity={getOpacity(entry)}
              />
            ))}
          </Bar>
        </ReBarChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ReBarChart
        data={data}
        margin={{ top: 4, right: 12, left: 4, bottom: 44 }}
        barCategoryGap="28%"
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fill: '#475569', fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          interval={0}
          angle={-35}
          textAnchor="end"
          tickFormatter={(v) => truncate(String(v), maxLabelLen)}
        />
        <YAxis
          tick={{ fill: '#94a3b8', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(4,106,56,0.05)' }} />
        <Bar
          dataKey="value"
          radius={[5, 5, 0, 0]}
          cursor="pointer"
          onClick={handleClick}
          isAnimationActive
          animationDuration={220}
          animationEasing="ease-out"
        >
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={getColor(entry)}
              opacity={getOpacity(entry)}
            />
          ))}
        </Bar>
      </ReBarChart>
    </ResponsiveContainer>
  );
}
