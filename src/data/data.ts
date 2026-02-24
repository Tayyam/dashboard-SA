import type { Pilgrim } from '../core/types';

// ─── Lookup tables ──────────────────────────────────────────────────────────

const nationalities = [
  { name: 'Saudi Arabia', weight: 970 },
  { name: 'Egypt', weight: 80 },
  { name: 'Jordan', weight: 50 },
  { name: 'Pakistan', weight: 40 },
  { name: 'Indonesia', weight: 35 },
  { name: 'Turkey', weight: 30 },
  { name: 'Morocco', weight: 25 },
  { name: 'UAE', weight: 20 },
  { name: 'Kuwait', weight: 20 },
  { name: 'Malaysia', weight: 15 },
];

const companies = [
  { name: 'Al Noor Travel', weight: 440 },
  { name: 'Zamzam Tours', weight: 280 },
  { name: 'Golden Hajj', weight: 200 },
  { name: 'Mawadda Agency', weight: 150 },
  { name: 'Rahma Services', weight: 120 },
  { name: 'Baraka Travel', weight: 95 },
  { name: 'Itqan Group', weight: 65 },
];

const packages = [
  { name: 'SV Platinum', weight: 165 },
  { name: 'SV Express', weight: 140 },
  { name: 'Public MED', weight: 130 },
  { name: 'VIP Elite', weight: 110 },
  { name: 'Economy Plus', weight: 100 },
  { name: 'Standard Pack', weight: 95 },
  { name: 'Family Comfort', weight: 90 },
  { name: 'Silver Package', weight: 85 },
  { name: 'Bronze Pack', weight: 75 },
  { name: 'Group Special', weight: 70 },
  { name: 'Youth Program', weight: 60 },
  { name: 'Senior Care', weight: 50 },
  { name: 'Budget Basics', weight: 40 },
  { name: 'Corporate Elite', weight: 35 },
  { name: 'Deluxe Suite', weight: 30 },
  { name: 'Hajj Classic', weight: 25 },
];

const arrivalCities = [
  { name: 'Madinah', weight: 780 },
  { name: 'Makkah', weight: 420 },
  { name: 'Jeddah', weight: 150 },
];

const arrivalPoints = [
  { name: 'Prince Mohammad Airport', weight: 600 },
  { name: 'King Abdulaziz Airport', weight: 400 },
  { name: 'King Fahd Airport', weight: 200 },
  { name: 'Land Border Haramain', weight: 150 },
];

const departureCities = [
  { name: 'Makkah', weight: 700 },
  { name: 'Madinah', weight: 450 },
  { name: 'Jeddah', weight: 200 },
];

const departurePoints = [
  { name: 'King Abdulaziz Airport', weight: 550 },
  { name: 'Prince Mohammad Airport', weight: 400 },
  { name: 'King Fahd Airport', weight: 250 },
  { name: 'Land Border South', weight: 150 },
];

const arrivalHotels = [
  { name: 'Anwar Al Madinah', weight: 340 },
  { name: 'Dar Al Taqwa', weight: 280 },
  { name: 'Crown Plaza Madinah', weight: 210 },
  { name: 'Swiss Makkah', weight: 200 },
  { name: 'Hilton Makkah', weight: 160 },
  { name: 'Sheraton Makkah', weight: 100 },
  { name: 'Movenpick Makkah', weight: 60 },
];

const makkahHotels = [
  { name: 'Abraj Al-Bait Towers', weight: 340 },
  { name: 'Swissotel Al Zahiyah', weight: 260 },
  { name: 'Hilton Suites Makkah', weight: 200 },
  { name: 'Pullman ZamZam Makkah', weight: 180 },
  { name: 'Le Méridien Makkah', weight: 160 },
  { name: 'Millennium Makkah', weight: 120 },
  { name: 'Mövenpick Ajyad', weight: 50 },
  { name: 'Grand Hyatt Makkah', weight: 40 },
];

const departureHotels = [
  { name: 'Swiss Makkah', weight: 310 },
  { name: 'Hilton Makkah', weight: 260 },
  { name: 'Crown Plaza Makkah', weight: 220 },
  { name: 'Anwar Al Madinah', weight: 180 },
  { name: 'Dar Al Taqwa', weight: 150 },
  { name: 'Sheraton Madinah', weight: 130 },
  { name: 'Movenpick Madinah', weight: 100 },
];

const accommodationStatuses = [
  { name: 'Confirmed', weight: 1050 },
  { name: 'Pending', weight: 180 },
  { name: 'Waitlisted', weight: 70 },
  { name: 'Cancelled', weight: 50 },
];

const roomTypes: Array<'triple' | 'double' | 'quad'> = ['triple', 'double', 'quad'];
const roomWeights = [50, 30, 20];

// ─── Arrival dates: Late May → Early June 2025 ───────────────────────────────
// Peak around 550–570 on a few days
const arrivalDateWeights: { name: string; weight: number }[] = [
  { name: '2025-05-22', weight: 20 },
  { name: '2025-05-23', weight: 30 },
  { name: '2025-05-24', weight: 50 },
  { name: '2025-05-25', weight: 65 },
  { name: '2025-05-26', weight: 80 },
  { name: '2025-05-27', weight: 100 },
  { name: '2025-05-28', weight: 130 },
  { name: '2025-05-29', weight: 190 },
  { name: '2025-05-30', weight: 250 },
  { name: '2025-05-31', weight: 330 },
  { name: '2025-06-01', weight: 420 },
  { name: '2025-06-02', weight: 560 },
  { name: '2025-06-03', weight: 570 },
  { name: '2025-06-04', weight: 490 },
  { name: '2025-06-05', weight: 380 },
  { name: '2025-06-06', weight: 270 },
  { name: '2025-06-07', weight: 180 },
  { name: '2025-06-08', weight: 110 },
  { name: '2025-06-09', weight: 70 },
  { name: '2025-06-10', weight: 40 },
];

const departureDateWeights: { name: string; weight: number }[] = [
  { name: '2025-06-08', weight: 40 },
  { name: '2025-06-09', weight: 70 },
  { name: '2025-06-10', weight: 120 },
  { name: '2025-06-11', weight: 200 },
  { name: '2025-06-12', weight: 310 },
  { name: '2025-06-13', weight: 430 },
  { name: '2025-06-14', weight: 560 },
  { name: '2025-06-15', weight: 500 },
  { name: '2025-06-16', weight: 390 },
  { name: '2025-06-17', weight: 280 },
  { name: '2025-06-18', weight: 180 },
  { name: '2025-06-19', weight: 110 },
  { name: '2025-06-20', weight: 70 },
  { name: '2025-06-21', weight: 40 },
  { name: '2025-06-22', weight: 20 },
];

// ─── Weighted random picker ───────────────────────────────────────────────────
function pickWeighted<T>(items: { name: T; weight: number }[], rng: () => number): T {
  const total = items.reduce((s, i) => s + i.weight, 0);
  let r = rng() * total;
  for (const item of items) {
    r -= item.weight;
    if (r <= 0) return item.name;
  }
  return items[items.length - 1].name;
}

function pickIndexWeighted(weights: number[], rng: () => number): number {
  const total = weights.reduce((s, w) => s + w, 0);
  let r = rng() * total;
  for (let i = 0; i < weights.length; i++) {
    r -= weights[i];
    if (r <= 0) return i;
  }
  return weights.length - 1;
}

// ─── Deterministic seeded pseudo-random (LCG) ────────────────────────────────
function makeRng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

// ─── Bell-curve age generator (mean=46, sd≈10) ───────────────────────────────
function gaussianAge(rng: () => number): number {
  // Box-Muller
  const u1 = rng();
  const u2 = rng();
  const z = Math.sqrt(-2 * Math.log(u1 + 1e-10)) * Math.cos(2 * Math.PI * u2);
  return Math.round(46 + z * 10);
}

function toUtcDate(dateIso: string): Date {
  return new Date(`${dateIso}T00:00:00Z`);
}

function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function addDaysIso(dateIso: string, days: number): string {
  const d = toUtcDate(dateIso);
  d.setUTCDate(d.getUTCDate() + days);
  return toIsoDate(d);
}

function dayDiff(aIso: string, bIso: string): number {
  const a = toUtcDate(aIso).getTime();
  const b = toUtcDate(bIso).getTime();
  return Math.round((b - a) / (24 * 60 * 60 * 1000));
}

// ─── Generate dataset ─────────────────────────────────────────────────────────
const TOTAL = 1350;

export const rawData: Pilgrim[] = (() => {
  const rng = makeRng(42);
  const pilgrims: Pilgrim[] = [];

  for (let i = 1; i <= TOTAL; i++) {
    let age = gaussianAge(rng);
    if (age < 18) age = 18;
    if (age > 80) age = 80;

    const roomIdx = pickIndexWeighted(roomWeights, rng);

    const arrivalDate = pickWeighted(arrivalDateWeights, rng);
    const sampledDepartureDate = pickWeighted(departureDateWeights, rng);
    const minDepartureDate = addDaysIso(arrivalDate, 4);
    const departureDate = sampledDepartureDate < minDepartureDate ? minDepartureDate : sampledDepartureDate;

    const totalDays = dayDiff(arrivalDate, departureDate);
    const arrivalHotelCheckoutOffset = Math.min(Math.max(1, 1 + Math.floor(rng() * 3)), Math.max(1, totalDays - 2));
    const departureCityArrivalOffset = Math.min(
      Math.max(arrivalHotelCheckoutOffset + 1, arrivalHotelCheckoutOffset + Math.floor(rng() * 2)),
      Math.max(arrivalHotelCheckoutOffset + 1, totalDays - 1)
    );
    const departureHotelCheckoutOffset = Math.max(departureCityArrivalOffset, totalDays - 1);

    pilgrims.push({
      id: i,
      booking_id: `HJ-2025-${String(i).padStart(5, '0')}`,
      gender: rng() < 0.52 ? 'Male' : 'Female',
      nationality: pickWeighted(nationalities, rng),
      company: pickWeighted(companies, rng),
      package: pickWeighted(packages, rng),
      arrival_city: pickWeighted(arrivalCities, rng),
      arrival_point: pickWeighted(arrivalPoints, rng),
      departure_city: pickWeighted(departureCities, rng),
      departure_point: pickWeighted(departurePoints, rng),
      arrival_hotel: pickWeighted(arrivalHotels, rng),
      makkah_hotel: pickWeighted(makkahHotels, rng),
      departure_hotel: pickWeighted(departureHotels, rng),
      accommodation_status: pickWeighted(accommodationStatuses, rng),
      age,
      arrival_date: arrivalDate,
      arrival_hotel_checkout_date: addDaysIso(arrivalDate, arrivalHotelCheckoutOffset),
      departure_city_arrival_date: addDaysIso(arrivalDate, departureCityArrivalOffset),
      departure_hotel_checkout_date: addDaysIso(arrivalDate, departureHotelCheckoutOffset),
      departure_date: departureDate,
      makkah_room_type: roomTypes[roomIdx],
      madinah_room_type: roomTypes[pickIndexWeighted(roomWeights, rng)],
    });
  }

  return pilgrims;
})();
