import { useMemo } from 'react';
import { rawData } from '../data/data';
import { applyJourneyFilters, type JourneyFilters } from '../core/journeyFilterEngine';
import { groupBy, aggregate } from '../core/aggregationEngine';
import { useJourneyFilters } from './useJourneyFilters';
import type { ChartDataPoint } from '../core/types';

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
  const withoutNodeFilter = (key: keyof JourneyFilters) =>
    applyJourneyFilters(rawData, { ...filters, [key]: null });

  const filteredData = useMemo(
    () => applyJourneyFilters(rawData, filters),
    [filters]
  );

  const totalPilgrims = filteredData.length;

  const arrivalDateData = useMemo(() => {
    const stageData = withoutNodeFilter('node_arrival_date');
    const agg = aggregate(groupBy(stageData, 'arrival_date'), 'count');
    return toJourneyPoints(agg, filters.node_arrival_date, true);
  }, [filters]);

  const arrivalCityData = useMemo(() => {
    const stageData = withoutNodeFilter('node_arrival_city');
    const agg = aggregate(groupBy(stageData, 'arrival_city'), 'count');
    return toJourneyPoints(agg, filters.node_arrival_city);
  }, [filters]);

  const arrivalHotelData = useMemo(() => {
    const stageData = withoutNodeFilter('node_arrival_hotel');
    const agg = aggregate(groupBy(stageData, 'arrival_hotel'), 'count');
    return toJourneyPoints(agg, filters.node_arrival_hotel);
  }, [filters]);

  const arrivalHotelCheckoutDateData = useMemo(() => {
    const stageData = withoutNodeFilter('node_arrival_hotel_checkout_date');
    const agg = aggregate(groupBy(stageData, 'arrival_hotel_checkout_date'), 'count');
    return toJourneyPoints(agg, filters.node_arrival_hotel_checkout_date, true);
  }, [filters]);

  const departureCityData = useMemo(() => {
    const stageData = withoutNodeFilter('node_departure_city');
    const agg = aggregate(groupBy(stageData, 'departure_city'), 'count');
    return toJourneyPoints(agg, filters.node_departure_city);
  }, [filters]);

  const departureCityArrivalDateData = useMemo(() => {
    const stageData = withoutNodeFilter('node_departure_city_arrival_date');
    const agg = aggregate(groupBy(stageData, 'departure_city_arrival_date'), 'count');
    return toJourneyPoints(agg, filters.node_departure_city_arrival_date, true);
  }, [filters]);

  const departureHotelData = useMemo(() => {
    const stageData = withoutNodeFilter('node_departure_hotel');
    const agg = aggregate(groupBy(stageData, 'departure_hotel'), 'count');
    return toJourneyPoints(agg, filters.node_departure_hotel);
  }, [filters]);

  const departureHotelCheckoutDateData = useMemo(() => {
    const stageData = withoutNodeFilter('node_departure_hotel_checkout_date');
    const agg = aggregate(groupBy(stageData, 'departure_hotel_checkout_date'), 'count');
    return toJourneyPoints(agg, filters.node_departure_hotel_checkout_date, true);
  }, [filters]);

  const departureDateData = useMemo(() => {
    const stageData = withoutNodeFilter('node_departure_date');
    const agg = aggregate(groupBy(stageData, 'departure_date'), 'count');
    return toJourneyPoints(agg, filters.node_departure_date, true);
  }, [filters]);

  return {
    filteredData,
    totalPilgrims,
    arrivalDateData,
    arrivalCityData,
    arrivalHotelData,
    arrivalHotelCheckoutDateData,
    departureCityData,
    departureCityArrivalDateData,
    departureHotelData,
    departureHotelCheckoutDateData,
    departureDateData,
  };
}
