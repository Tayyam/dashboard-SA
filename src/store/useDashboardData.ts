import { useMemo } from 'react';
import { rawData } from '../data/rawData';
import { applyFilters } from '../core/filterEngine';
import { groupBy, aggregate, toChartData, toSortedChartData } from '../core/aggregationEngine';
import { useFilters } from './useFilters';
import { DIMENSIONS } from '../core/dimensions';

const ZERO_ROOMS = { triple: 0, double: 0, quad: 0 };

export function useDashboardData() {
  const filters = useFilters((s) => s.filters);

  const filteredData = useMemo(() => applyFilters(rawData, filters), [filters]);

  // ── KPI ──────────────────────────────────────────────────────────────────
  const totalPilgrims = filteredData.length;

  const makkahRooms  = ZERO_ROOMS;
  const madinahRooms = ZERO_ROOMS;

  const contractData = useMemo(() => {
    const agg = aggregate(groupBy(filteredData, DIMENSIONS.FLIGHT_CONTRACT_TYPE as never), 'count');
    return toChartData(agg, filters.chart_contract_type);
  }, [filteredData, filters.chart_contract_type]);

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
    const agg   = aggregate(groupBy(filteredData, DIMENSIONS.NATIONALITY as never), 'count');
    const total = Object.values(agg).reduce((s, v) => s + v, 0);
    const threshold = total * 0.05;

    const major: Record<string, number> = {};
    let otherCount = 0;
    for (const [key, val] of Object.entries(agg).sort((a, b) => b[1] - a[1])) {
      if (val >= threshold) major[key] = val;
      else otherCount += val;
    }
    if (otherCount > 0) major['أخرى'] = otherCount;

    const selected = filters.chart_nationality;
    const effectiveSelected =
      selected && !(selected in major) ? 'أخرى' : selected;

    return toChartData(major, effectiveSelected);
  }, [filteredData, filters.chart_nationality]);

  const packageData = useMemo(() => {
    const agg = aggregate(groupBy(filteredData, DIMENSIONS.PACKAGE as never), 'count');
    return toChartData(agg, filters.chart_package);
  }, [filteredData, filters.chart_package]);

  const ageData = useMemo(() => {
    const agg = aggregate(groupBy(filteredData, DIMENSIONS.AGE_BUCKET as never), 'count');
    return toSortedChartData(agg, filters.chart_age_bucket, 'label');
  }, [filteredData, filters.chart_age_bucket]);

  return {
    filteredData,
    totalPilgrims,
    makkahRooms,
    madinahRooms,
    contractData,
    genderData,
    arrivalCityData,
    arrivalDateData,
    departureDateData,
    arrivalHotelData,
    departureHotelData,
    nationalityData,
    packageData,
    ageData,
  };
}
