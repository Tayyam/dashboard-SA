import React from 'react';

interface ChartWrapperProps {
  title: string;
  children: React.ReactNode;
  height?: number;
}

export function ChartWrapper({ title, children, height = 260 }: ChartWrapperProps) {
  return (
    <div className="flex h-full flex-col rounded-card border border-border bg-card px-4 pt-3.5 pb-2.5 shadow-card transition-[box-shadow,border-color] duration-150 hover:border-primary hover:shadow-[0_4px_20px_rgba(4,106,56,0.1)]">
      <h3 className="mb-2 shrink-0 border-b border-gray-100 pb-2 text-[11px] font-bold tracking-wide text-fg-secondary uppercase">
        {title}
      </h3>
      <div style={{ height }}>{children}</div>
    </div>
  );
}
