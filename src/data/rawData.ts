import report from './sv_report.json';
import type { Pilgrim } from '../core/types';

// ── Seeded deterministic RNG (LCG) ───────────────────────────────────────────
function makeRng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

// ── Weighted pick from parallel arrays ───────────────────────────────────────
function pickWeighted<T>(
  weights: number[],
  values: T[],
  rng: () => number,
): T {
  const total = weights.reduce((s, w) => s + w, 0);
  let r = rng() * total;
  for (let i = 0; i < weights.length; i++) {
    r -= weights[i];
    if (r <= 0) return values[i];
  }
  return values[values.length - 1];
}

// ── Build rawData from sv_report.json ────────────────────────────────────────
export const rawData: Pilgrim[] = (() => {
  const rng = makeRng(42);

  // Nationality distribution
  const natWeights = report.nationality.map((n) => n.count);
  const natValues  = report.nationality.map((n) => n.nationality);

  // Age distribution
  const ageWeights = report.age_breakdown.map((a) => a.count);
  const ageValues  = report.age_breakdown.map((a) => a.age);

  // Package distribution
  const pkgWeights = report.package_breakdown.map((p) => p.pilgrims);
  const pkgValues  = report.package_breakdown.map((p) => p.package);

  // Gender budget from summary
  const totalMale   = (report.summary as Record<string, number>)['عدد الحجاج الذكور']  ?? 0;
  const totalFemale = (report.summary as Record<string, number>)['عدد الحجاج الاناث'] ?? 0;

  // Room type distribution (50% triple, 30% double, 20% quad)
  const roomTypes: Array<'triple' | 'double' | 'quad'> = ['triple', 'double', 'quad'];
  const roomWeights = [50, 30, 20];

  const pilgrims: Pilgrim[] = [];
  let id = 1;
  let maleCount = 0;
  let femaleCount = 0;

  for (const detail of report.packages_detail) {
    for (let i = 0; i < detail.pilgrims; i++) {
      const remaining       = (totalMale + totalFemale) - (id - 1);
      const remainingMale   = totalMale   - maleCount;
      const remainingFemale = totalFemale - femaleCount;

      let gender: 'Male' | 'Female';
      if (remainingMale <= 0)       gender = 'Female';
      else if (remainingFemale <= 0) gender = 'Male';
      else gender = rng() < remainingMale / Math.max(remaining, 1) ? 'Male' : 'Female';

      if (gender === 'Male') maleCount++;
      else femaleCount++;

      pilgrims.push({
        id,
        booking_id: `SV-2026-${String(id).padStart(5, '0')}`,
        gender,
        nationality:                   pickWeighted(natWeights, natValues, rng),
        package:                       pickWeighted(pkgWeights, pkgValues, rng),
        arrival_city:                  detail.dep_destination,
        departure_city:                detail.ret_origin,
        arrival_hotel:                 detail.first_hotel_name,
        departure_hotel:               detail.last_hotel_name,
        age:                           pickWeighted(ageWeights, ageValues, rng),
        arrival_date:                  detail.dep_arr_date,
        arrival_hotel_checkout_date:   detail.first_hotel_check_out,
        departure_city_arrival_date:   detail.last_hotel_check_in,
        departure_hotel_checkout_date: detail.last_hotel_check_out,
        departure_date:                detail.ret_date,
        makkah_room_type:       pickWeighted(roomWeights, roomTypes, rng),
        madinah_room_type:      pickWeighted(roomWeights, roomTypes, rng),
        flight_contract_type:   detail.flight_contract_type === 'B2B' ? 'B2B' : 'GDS',
      });
      id++;
    }
  }

  return pilgrims;
})();
