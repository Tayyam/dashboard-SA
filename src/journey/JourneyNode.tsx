import type { ChartDataPoint } from '../core/types';
import type { ReactNode } from 'react';

interface JourneyNodeProps {
  title: string;
  items: ChartDataPoint[];
  onItemClick: (label: string) => void;
  formatLabel?: (label: string) => string;
  maxItems?: number;
  staticNode?: boolean;
  staticRenderer?: () => ReactNode;
}

export function JourneyNode({
  title,
  items,
  onItemClick,
  formatLabel,
  maxItems = 8,
  staticNode = false,
  staticRenderer,
}: JourneyNodeProps) {
  const visibleItems = items.slice(0, maxItems);
  const total = items.reduce((s, i) => s + i.value, 0);
  const maxVal = Math.max(...visibleItems.map((i) => i.value), 1);
  const hasFilter = items.some((i) => !i.isSelected);

  return (
    <div className="journey-node">
      <div className="journey-node-header">
        <span className="journey-node-title">{title}</span>
        <span className="journey-node-badge">{total.toLocaleString()}</span>
      </div>

      <div className="journey-node-items">
        {staticNode && staticRenderer ? (
          <div className="journey-static-host">{staticRenderer()}</div>
        ) : visibleItems.map((item) => {
          const pct = (item.value / maxVal) * 100;
          const faded = hasFilter && !item.isSelected;
          return (
            <button
              key={item.label}
              className={`journey-item${item.isSelected && hasFilter ? ' journey-item--active' : ''}${faded ? ' journey-item--faded' : ''}`}
              onClick={() => onItemClick(item.label)}
              title={item.label}
            >
              <div className="journey-item-meta">
                <span className="journey-item-label">
                  {formatLabel ? formatLabel(item.label) : item.label}
                </span>
                <span className="journey-item-count">{item.value.toLocaleString()}</span>
              </div>
              <div className="journey-item-track">
                <div
                  className="journey-item-fill"
                  style={{ width: `${pct}%`, opacity: faded ? 0.25 : 1 }}
                />
              </div>
            </button>
          );
        })}
        {!staticNode && items.length > visibleItems.length && (
          <div className="journey-item-more">+{items.length - visibleItems.length} more</div>
        )}
      </div>
    </div>
  );
}
