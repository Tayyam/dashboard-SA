import { useEffect, useMemo, useState } from 'react';
import type { Pilgrim } from '../core/types';
import {
  HOLY_CITY_MADINAH_LABEL,
  HOLY_CITY_MAKKAH_LABEL,
} from '../core/holyCityPresence';
import {
  calendarDateRangeForPresenceChart,
  defaultPresenceCalendarDate,
  formatPresenceBucketDdMm,
  mergePresenceDaysWithSameCounts,
} from '../core/pilgrimDailyPresence';
import { ChartWrapper } from '../charts/ChartWrapper';
import { BarChart } from '../charts/BarChart';
import { useFilters } from '../store/useFilters';

export function HolyCityPresenceChart({ filteredData }: { filteredData: Pilgrim[] }) {
  const toggleHolyCityPresence = useFilters((s) => s.toggleHolyCityPresenceFilter);
  const setHolyCityPresence = useFilters((s) => s.setHolyCityPresenceFilter);
  const chartHolyCity = useFilters((s) => s.filters.chart_holy_city);
  const chartHolyCityDate = useFilters((s) => s.filters.chart_holy_city_date);
  const chartHolyCityDateEnd = useFilters((s) => s.filters.chart_holy_city_date_end);

  const dateOptions = useMemo(
    () => calendarDateRangeForPresenceChart(filteredData),
    [filteredData],
  );

  const buckets = useMemo(
    () => mergePresenceDaysWithSameCounts(dateOptions, filteredData),
    [dateOptions, filteredData],
  );

  const defaultBucketStart = useMemo(() => {
    if (buckets.length === 0) return '';
    const di = defaultPresenceCalendarDate(dateOptions);
    if (!di) return buckets[0].start;
    const b = buckets.find((x) => x.start <= di && x.end >= di);
    return b?.start ?? buckets[0].start;
  }, [buckets, dateOptions]);

  const [selectedBucketStart, setSelectedBucketStart] = useState<string | null>(null);

  const effectiveBucketStart = useMemo(() => {
    if (selectedBucketStart && buckets.some((b) => b.start === selectedBucketStart)) {
      return selectedBucketStart;
    }
    return defaultBucketStart;
  }, [buckets, selectedBucketStart, defaultBucketStart]);

  const selectedBucket = useMemo(
    () => buckets.find((b) => b.start === effectiveBucketStart) ?? null,
    [buckets, effectiveBucketStart],
  );

  useEffect(() => {
    if (!chartHolyCity || !selectedBucket) return;
    const end = selectedBucket.end;
    if (
      chartHolyCityDate !== selectedBucket.start ||
      chartHolyCityDateEnd !== end
    ) {
      setHolyCityPresence(chartHolyCity, selectedBucket.start, end);
    }
  }, [
    selectedBucket,
    chartHolyCity,
    chartHolyCityDate,
    chartHolyCityDateEnd,
    setHolyCityPresence,
  ]);

  const holyCityData = useMemo(() => {
    if (!selectedBucket) {
      return [
        { label: HOLY_CITY_MAKKAH_LABEL, value: 0, isSelected: true },
        { label: HOLY_CITY_MADINAH_LABEL, value: 0, isSelected: true },
      ];
    }
    const sel = chartHolyCity;
    return [
      {
        label: HOLY_CITY_MAKKAH_LABEL,
        value: selectedBucket.makkah,
        isSelected: sel === HOLY_CITY_MAKKAH_LABEL || !sel,
      },
      {
        label: HOLY_CITY_MADINAH_LABEL,
        value: selectedBucket.madinah,
        isSelected: sel === HOLY_CITY_MADINAH_LABEL || !sel,
      },
    ];
  }, [selectedBucket, chartHolyCity]);

  const title = selectedBucket
    ? `تواجد الحجاج — ${formatPresenceBucketDdMm(selectedBucket)}`
    : 'تواجد الحجاج حسب اليوم';

  return (
    <ChartWrapper
      title={title}
      height={280}
      headerRight={
        <label className="flex min-w-[6.5rem] max-w-[10rem] shrink-0 flex-col gap-0.5">
          <span className="text-[9px] font-bold tracking-wide text-fg-secondary uppercase">
            اليوم
          </span>
          <select
            className="w-full cursor-pointer rounded-lg border border-border bg-white px-1.5 py-1 text-center text-[11px] font-bold tabular-nums text-fg shadow-sm outline-none transition-colors hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20"
            value={buckets.length && effectiveBucketStart ? effectiveBucketStart : ''}
            onChange={(e) => setSelectedBucketStart(e.target.value || null)}
            disabled={buckets.length === 0}
            aria-label="اختيار فترة الأيام (يوم/شهر)"
          >
            {buckets.length === 0 ? (
              <option value="">—</option>
            ) : (
              buckets.map((b) => (
                <option key={b.start} value={b.start}>
                  {formatPresenceBucketDdMm(b)}
                </option>
              ))
            )}
          </select>
        </label>
      }
    >
      <BarChart
        data={holyCityData}
        onSegmentClick={(v) => {
          if (!selectedBucket) return;
          toggleHolyCityPresence(v, selectedBucket.start, selectedBucket.end);
        }}
        layout="vertical"
        maxLabelLen={22}
      />
    </ChartWrapper>
  );
}
