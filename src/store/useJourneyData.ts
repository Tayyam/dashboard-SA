import { useMemo } from 'react';
import { rawData } from '../data/data';
import { applyJourneyFilters } from '../core/journeyFilterEngine';
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

  const filteredData = useMemo(
    () => applyJourneyFilters(rawData, filters),
    [filters]
  );

  const totalPilgrims = filteredData.length;

  const arrivalDateData = useMemo(() => {
    const agg = aggregate(groupBy(filteredData, 'arrival_date'), 'count');
    return toJourneyPoints(agg, filters.node_arrival_date, true);
  }, [filteredData, filters.node_arrival_date]);

  const arrivalCityData = useMemo(() => {
    const agg = aggregate(groupBy(filteredData, 'arrival_city'), 'count');
    return toJourneyPoints(agg, filters.node_arrival_city);
  }, [filteredData, filters.node_arrival_city]);

  const arrivalHotelData = useMemo(() => {
    const agg = aggregate(groupBy(filteredData, 'arrival_hotel'), 'count');
    return toJourneyPoints(agg, filters.node_arrival_hotel);
  }, [filteredData, filters.node_arrival_hotel]);

  const arrivalHotelCheckoutDateData = useMemo(() => {
    const agg = aggregate(groupBy(filteredData, 'arrival_hotel_checkout_date'), 'count');
    return toJourneyPoints(agg, filters.node_arrival_hotel_checkout_date, true);
  }, [filteredData, filters.node_arrival_hotel_checkout_date]);

  const departureCityData = useMemo(() => {
    const agg = aggregate(groupBy(filteredData, 'departure_city'), 'count');
    return toJourneyPoints(agg, filters.node_departure_city);
  }, [filteredData, filters.node_departure_city]);

  const departureCityArrivalDateData = useMemo(() => {
    const agg = aggregate(groupBy(filteredData, 'departure_city_arrival_date'), 'count');
    return toJourneyPoints(agg, filters.node_departure_city_arrival_date, true);
  }, [filteredData, filters.node_departure_city_arrival_date]);

  const departureHotelData = useMemo(() => {
    const agg = aggregate(groupBy(filteredData, 'departure_hotel'), 'count');
    return toJourneyPoints(agg, filters.node_departure_hotel);
  }, [filteredData, filters.node_departure_hotel]);

  const departureHotelCheckoutDateData = useMemo(() => {
    const agg = aggregate(groupBy(filteredData, 'departure_hotel_checkout_date'), 'count');
    return toJourneyPoints(agg, filters.node_departure_hotel_checkout_date, true);
  }, [filteredData, filters.node_departure_hotel_checkout_date]);

  const departureDateData = useMemo(() => {
    const agg = aggregate(groupBy(filteredData, 'departure_date'), 'count');
    return toJourneyPoints(agg, filters.node_departure_date, true);
  }, [filteredData, filters.node_departure_date]);

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
