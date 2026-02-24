import React from 'react';

interface ChartWrapperProps {
  title: string;
  children: React.ReactNode;
  height?: number;
}

export function ChartWrapper({ title, children, height = 260 }: ChartWrapperProps) {
  return (
    <div className="chart-card">
      <h3 className="chart-title">{title}</h3>
      <div style={{ height }}>
        {children}
      </div>
    </div>
  );
}
