import type { ReactNode } from 'react';
import { cn } from '../lib/cn';
import { formatJourneyAirportCode } from '../core/airportDisplay';
import { getRegionTone } from '../lib/regionTone';

type RegionBadgeProps = {
  /** النص كما يُعرض (مدينة، مطار خام، أو نص مطابق لـ formatJourneyAirportCode) */
  label: string | null | undefined;
  className?: string;
  title?: string;
  /** إذا وُجد، يُستخرج اللون من القيمة الخام قبل التنسيق */
  rawForTone?: string | null;
  children?: ReactNode;
};

/**
 * شارة مدينة/مطار: success للمدينة ومطار المدينة، danger لمكة وجدة…، warning لمنى
 */
export function RegionBadge({ label, className, title, rawForTone, children }: RegionBadgeProps) {
  const display = (label ?? '').trim() || '—';
  const toneSource = (rawForTone ?? label ?? '').trim();
  const tone = toneSource ? getRegionTone(toneSource) : 'neutral';

  return (
    <span
      title={title ?? (display !== '—' ? display : undefined)}
      className={cn(
        'inline-flex max-w-full items-center rounded-full border px-2.5 py-1 text-xs font-bold leading-tight',
        tone === 'success' && 'border-emerald-400/70 bg-emerald-50 text-emerald-900',
        tone === 'danger' && 'border-red-400/70 bg-red-50 text-red-900',
        tone === 'warning' && 'border-amber-400/80 bg-amber-50 text-amber-950',
        tone === 'neutral' && 'border-border bg-gray-100 text-gray-700',
        className,
      )}
    >
      <span className="min-w-0 truncate">{children ?? display}</span>
    </span>
  );
}

/** عرض مطار مع تنسيق العرض وتلوين حسب الرمز/النص */
export function AirportBadge({ code }: { code: string | null | undefined }) {
  const raw = (code ?? '').trim();
  if (!raw) {
    return <RegionBadge label="—" />;
  }
  const formatted = formatJourneyAirportCode(raw);
  return <RegionBadge label={formatted} rawForTone={raw} title={`${formatted} (${raw})`} />;
}
