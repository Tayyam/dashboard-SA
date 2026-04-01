import { useMemo } from 'react';
import { applyJourneyFilters, type JourneyFilters } from '../core/journeyFilterEngine';
import { groupBy, aggregate } from '../core/aggregationEngine';
import { useJourneyFilters } from './useJourneyFilters';
import type { ChartDataPoint } from '../core/types';
import { usePilgrimsData } from './usePilgrimsData';

function toJourneyPoints(
  agg: Record<string, number>,
  selected: string | null,
  sortByLabel = false
): ChartDataPoint[] {
  const points: ChartDataPoint[] = Object.entries(agg).map(([label, value]) => ({
    label,
    value,
    isSelected: selected === null || label === selected,
  }));
  return sortByLabel
    ? points.sort((a, b) => a.label.localeCompare(b.label))
    : points.sort((a, b) => b.value - a.value);
}

export function useJourneyData() {
  const filters = useJourneyFilters((s) => s.filters);
  const data = usePilgrimsData((s) => s.data);
  const withoutNodeFilter = (key: keyof JourneyFilters) =>
    applyJourneyFilters(data, { ...filters, [key]: null });

  const filteredData = useMemo(
    () => applyJourneyFilters(data, filters),
    [data, filters]
  );

  const totalPilgrims = filteredData.length;

  const packageData = useMemo(() => {
    const stageData = withoutNodeFilter('node_package');
    const agg = aggregate(groupBy(stageData, 'package'), 'count');
    return toJourneyPoints(agg, filters.node_package);
  }, [filters, data]);

  const arrivalDateData = useMemo(() => {
    const stageData = withoutNodeFilter('node_arrival_date');
    const agg = aggregate(groupBy(stageData, 'arrival_date'), 'count');
    return toJourneyPoints(agg, filters.node_arrival_date, true);
  }, [filters, data]);

  const arrivalCityData = useMemo(() => {
    const stageData = withoutNodeFilter('node_arrival_city');
    const agg = aggregate(groupBy(stageData, 'arrival_city'), 'count');
    return toJourneyPoints(agg, filters.node_arrival_city);
  }, [filters, data]);

  const firstStopNameData = useMemo(() => {
    const stageData = withoutNodeFilter('node_first_stop_name');
    const agg = aggregate(groupBy(stageData, 'first_stop_name'), 'count');
    return toJourneyPoints(agg, filters.node_first_stop_name);
  }, [filters, data]);

  const firstStopCheckOutData = useMemo(() => {
    const stageData = withoutNodeFilter('node_first_stop_check_out');
    const agg = aggregate(groupBy(stageData, 'first_stop_check_out'), 'count');
    return toJourneyPoints(agg, filters.node_first_stop_check_out, true);
  }, [filters, data]);

  const secondStopNameData = useMemo(() => {
    const stageData = withoutNodeFilter('node_second_stop_name');
    const agg = aggregate(groupBy(stageData, 'second_stop_name'), 'count');
    return toJourneyPoints(agg, filters.node_second_stop_name);
  }, [filters, data]);

  const secondStopCheckOutData = useMemo(() => {
    const stageData = withoutNodeFilter('node_second_stop_check_out');
    const agg = aggregate(groupBy(stageData, 'second_stop_check_out'), 'count');
    return toJourneyPoints(agg, filters.node_second_stop_check_out, true);
  }, [filters, data]);

  const thirdStopNameData = useMemo(() => {
    const stageData = withoutNodeFilter('node_third_stop_name');
    const agg = aggregate(groupBy(stageData, 'third_stop_name'), 'count');
    return toJourneyPoints(agg, filters.node_third_stop_name);
  }, [filters, data]);

  const thirdStopCheckOutData = useMemo(() => {
    const stageData = withoutNodeFilter('node_third_stop_check_out');
    const agg = aggregate(groupBy(stageData, 'third_stop_check_out'), 'count');
    return toJourneyPoints(agg, filters.node_third_stop_check_out, true);
  }, [filters, data]);

  const departureCityData = useMemo(() => {
    const stageData = withoutNodeFilter('node_departure_city');
    const agg = aggregate(groupBy(stageData, 'departure_city'), 'count');
    return toJourneyPoints(agg, filters.node_departure_city);
  }, [filters, data]);

  const departureDateData = useMemo(() => {
    const stageData = withoutNodeFilter('node_departure_date');
    const agg = aggregate(groupBy(stageData, 'departure_date'), 'count');
    return toJourneyPoints(agg, filters.node_departure_date, true);
  }, [filters, data]);

  return {
    filteredData,
    totalPilgrims,
    packageData,
    arrivalDateData,
    arrivalCityData,
    firstStopNameData,
    firstStopCheckOutData,
    secondStopNameData,
    secondStopCheckOutData,
    thirdStopNameData,
    thirdStopCheckOutData,
    departureCityData,
    departureDateData,
  };
}
