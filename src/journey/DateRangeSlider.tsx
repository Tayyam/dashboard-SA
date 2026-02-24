import { useRef } from 'react';

interface DateRangeSliderProps {
  label: string;
  dates: string[];          // sorted ascending YYYY-MM-DD
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
  const toIdx   = toDate   ? dates.indexOf(toDate)   : maxIdx;

  const safeFrom = fromIdx < 0 ? minIdx : fromIdx;
  const safeTo   = toIdx   < 0 ? maxIdx : toIdx;

  const leftPct  = (safeFrom / maxIdx) * 100;
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
    <div className="filter-group">
      <label className="filter-label">{label}</label>
      <div className="range-slider-wrap" ref={trackRef}>
        <div className="range-slider-track">
          <div
            className="range-slider-fill"
            style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
          />
        </div>
        <input
          type="range"
          className="range-input range-input-from"
          min={minIdx}
          max={maxIdx}
          value={safeFrom}
          onChange={handleFromChange}
        />
        <input
          type="range"
          className="range-input range-input-to"
          min={minIdx}
          max={maxIdx}
          value={safeTo}
          onChange={handleToChange}
        />
      </div>
      <div className="range-labels">
        <span>{fmt(dates[safeFrom])}</span>
        <span>{fmt(dates[safeTo])}</span>
      </div>
    </div>
  );
}
