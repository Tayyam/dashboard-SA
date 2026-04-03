import type { ReactNode } from 'react';

interface ChartWrapperProps {
  title: string;
  children: ReactNode;
  height?: number;
  /** عناصر إضافية بجانب العنوان (مثل منتقي داخل الرسم) */
  headerRight?: ReactNode;
}

export function ChartWrapper({ title, children, height = 260, headerRight }: ChartWrapperProps) {
  return (
    <div className="flex h-full flex-col rounded-card border border-border bg-card px-4 pt-3.5 pb-2.5 shadow-card transition-[box-shadow,border-color] duration-150 hover:border-primary hover:shadow-[0_4px_20px_rgba(4,106,56,0.1)]">
      <div className="mb-2 flex shrink-0 items-center justify-between gap-3 border-b border-gray-100 pb-2">
        <h3 className="min-w-0 text-[11px] font-bold tracking-wide text-fg-secondary uppercase">{title}</h3>
        {headerRight}
      </div>
      <div style={{ height }}>{children}</div>
    </div>
  );
}
