import { useRef } from 'react';

interface DateRangeSliderProps {
  label: string;
  dates: string[];
  fromDate: string | null;
  toDate: string | null;
  onChange: (from: string | null, to: string | null) => void;
}

export function DateRangeSlider({
  label,
  dates,
  fromDate,
  toDate,
  onChange,
}: DateRangeSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);

  if (dates.length === 0) return null;

  const minIdx = 0;
  const maxIdx = dates.length - 1;

  const fromIdx = fromDate ? dates.indexOf(fromDate) : minIdx;
  const toIdx = toDate ? dates.indexOf(toDate) : maxIdx;

  const safeFrom = fromIdx < 0 ? minIdx : fromIdx;
  const safeTo = toIdx < 0 ? maxIdx : toIdx;

  const leftPct = (safeFrom / maxIdx) * 100;
  const widthPct = ((safeTo - safeFrom) / maxIdx) * 100;

  const handleFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const idx = Math.min(+e.target.value, safeTo);
    onChange(idx === minIdx ? null : dates[idx], toDate);
  };

  const handleToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const idx = Math.max(+e.target.value, safeFrom);
    onChange(fromDate, idx === maxIdx ? null : dates[idx]);
  };

  const fmt = (d: string) => {
    const [, m, day] = d.split('-');
    return `${day}/${m}`;
  };

  return (
    <div className="mb-[11px]">
      <label className="mb-1 block text-[10px] font-semibold tracking-wide text-white/65 uppercase">{label}</label>
      <div className="relative my-2 mb-0.5 h-7" ref={trackRef}>
        <div className="pointer-events-none absolute start-0 end-0 top-1/2 h-1 -translate-y-1/2 rounded bg-white/20" />
        <div
          className="absolute top-1/2 h-1 -translate-y-1/2 rounded bg-white"
          style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
        />
        <input
          type="range"
          className="range-input-native range-input-from"
          min={minIdx}
          max={maxIdx}
          value={safeFrom}
          onChange={handleFromChange}
        />
        <input
          type="range"
          className="range-input-native range-input-to"
          min={minIdx}
          max={maxIdx}
          value={safeTo}
          onChange={handleToChange}
        />
      </div>
      <div className="mt-0.5 flex justify-between text-[10px] font-medium text-white/75">
        <span>{fmt(dates[safeFrom])}</span>
        <span>{fmt(dates[safeTo])}</span>
      </div>
    </div>
  );
}
