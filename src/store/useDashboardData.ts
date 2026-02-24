import { useMemo } from 'react';
import { rawData } from '../data/data';
import { applyFilters } from '../core/filterEngine';
import { groupBy, aggregate, toChartData, toSortedChartData } from '../core/aggregationEngine';
import { useFilters } from './useFilters';
import { DIMENSIONS } from '../core/dimensions';

function toRoomBreakdown(counts: Record<string, number>) {
  const triplePilgrims = counts['triple'] ?? 0;
  const doublePilgrims = counts['double'] ?? 0;
  const quadPilgrims = counts['quad'] ?? 0;

  return {
    // Convert pilgrim counts to actual room counts by capacity.
    triple: Math.ceil(triplePilgrims / 3),
    double: Math.ceil(doublePilgrims / 2),
    quad: Math.ceil(quadPilgrims / 4),
  };
}

export function useDashboardData() {
  const filters = useFilters((s) => s.filters);

  // Single source of truth: all charts derive from this
  const filteredData = useMemo(() => applyFilters(rawData, filters), [filters]);

  // ── KPI ──────────────────────────────────────────────────────────────────
  const totalPilgrims = filteredData.length;

  const makkahRooms = useMemo(() => {
    const grouped = groupBy(filteredData, DIMENSIONS.MAKKAH_ROOM_TYPE as never);
    const counts = aggregate(grouped, 'count');
    return toRoomBreakdown(counts);
  }, [filteredData]);

  const madinahRooms = useMemo(() => {
    const grouped = groupBy(filteredData, DIMENSIONS.MADINAH_ROOM_TYPE as never);
    const counts = aggregate(grouped, 'count');
    return toRoomBreakdown(counts);
  }, [filteredData]);

  // ── Chart Datasets ────────────────────────────────────────────────────────
  const genderData = useMemo(() => {
    const agg = aggregate(groupBy(filteredData, DIMENSIONS.GENDER as never), 'count');
    return toChartData(agg, filters.chart_gender, false);
  }, [filteredData, filters.chart_gender]);

  const arrivalCityData = useMemo(() => {
    const agg = aggregate(groupBy(filteredData, DIMENSIONS.ARRIVAL_CITY as never), 'count');
    return toChartData(agg, filters.chart_arrival_city);
  }, [filteredData, filters.chart_arrival_city]);

  const arrivalDateData = useMemo(() => {
    const agg = aggregate(groupBy(filteredData, DIMENSIONS.ARRIVAL_DATE as never), 'count');
    return toSortedChartData(agg, filters.chart_arrival_date, 'label');
  }, [filteredData, filters.chart_arrival_date]);

  const departureDateData = useMemo(() => {
    const agg = aggregate(groupBy(filteredData, DIMENSIONS.DEPARTURE_DATE as never), 'count');
    return toSortedChartData(agg, filters.chart_departure_date, 'label');
  }, [filteredData, filters.chart_departure_date]);

  const arrivalHotelData = useMemo(() => {
    const agg = aggregate(groupBy(filteredData, DIMENSIONS.ARRIVAL_HOTEL as never), 'count');
    return toChartData(agg, filters.chart_arrival_hotel);
  }, [filteredData, filters.chart_arrival_hotel]);

  const departureHotelData = useMemo(() => {
    const agg = aggregate(groupBy(filteredData, DIMENSIONS.DEPARTURE_HOTEL as never), 'count');
    return toChartData(agg, filters.chart_departure_hotel);
  }, [filteredData, filters.chart_departure_hotel]);

  const nationalityData = useMemo(() => {
    const agg = aggregate(groupBy(filteredData, DIMENSIONS.NATIONALITY as never), 'count');
    return toChartData(agg, filters.chart_nationality);
  }, [filteredData, filters.chart_nationality]);

  const accommodationStatusData = useMemo(() => {
    const agg = aggregate(groupBy(filteredData, DIMENSIONS.ACCOMMODATION_STATUS as never), 'count');
    return toChartData(agg, filters.chart_accommodation_status);
  }, [filteredData, filters.chart_accommodation_status]);

  const packageData = useMemo(() => {
    const agg = aggregate(groupBy(filteredData, DIMENSIONS.PACKAGE as never), 'count');
    return toChartData(agg, filters.chart_package);
  }, [filteredData, filters.chart_package]);

  const companyData = useMemo(() => {
    const agg = aggregate(groupBy(filteredData, DIMENSIONS.COMPANY as never), 'count');
    return toChartData(agg, filters.chart_company);
  }, [filteredData, filters.chart_company]);

  const ageData = useMemo(() => {
    const agg = aggregate(groupBy(filteredData, DIMENSIONS.AGE_BUCKET as never), 'count');
    return toSortedChartData(agg, filters.chart_age_bucket, 'label');
  }, [filteredData, filters.chart_age_bucket]);

  return {
    filteredData,
    totalPilgrims,
    makkahRooms,
    madinahRooms,
    genderData,
    arrivalCityData,
    arrivalDateData,
    departureDateData,
    arrivalHotelData,
    departureHotelData,
    nationalityData,
    accommodationStatusData,
    packageData,
    companyData,
    ageData,
  };
}
