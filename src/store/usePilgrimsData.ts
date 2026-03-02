import { create } from 'zustand';
import type { Pilgrim } from '../core/types';
import { supabase } from '../core/supabaseClient';

interface PilgrimsDataState {
  data: Pilgrim[];
  loading: boolean;
  loaded: boolean;
  error: string | null;
  fetchData: () => Promise<void>;
  refresh: () => Promise<void>;
}

function normalizePilgrim(row: Record<string, unknown>, index: number): Pilgrim {
  const toText = (v: unknown) => (v == null ? '' : String(v).trim());
  const toNum = (v: unknown) => {
    const n = Number(v ?? 0);
    return Number.isFinite(n) ? n : 0;
  };
  const toBool = (v: unknown) => {
    if (typeof v === 'boolean') return v;
    const t = toText(v).toLowerCase();
    return t === 'true' || t === '1' || t === 'yes' || t === 'نعم';
  };
  const genderRaw = toText(row.gender);
  const contractRaw = toText(row.flight_contract_type).toUpperCase();
  const makkahType = toText(row.makkah_room_type);
  const madinahType = toText(row.madinah_room_type);

  const groupIdRaw =
    row.group_id ??
    row.groupId ??
    row.groupid ??
    row['group id'] ??
    '';

  return {
    id: toNum(row.id) || toNum(row.nusuk_id) || toNum(row.booking_id) || index + 1,
    group_id: toText(groupIdRaw),
    booking_id: toText(row.booking_id),
    gender: genderRaw === 'Male' ? 'Male' : 'Female',
    name: toText(row.name),
    birth_date: toText(row.birth_date),
    age: toNum(row.age),
    guide_name: toText(row.guide_name),
    residence_country: toText(row.residence_country),
    nationality: toText(row.nationality),
    package_id: toText(row.package_id),
    package: toText(row.package),
    arrival_city: toText(row.arrival_city),
    departure_city: toText(row.departure_city),
    arrival_hotel: toText(row.arrival_hotel),
    arrival_hotel_location: toText(row.arrival_hotel_location),
    departure_hotel: toText(row.departure_hotel),
    departure_hotel_location: toText(row.departure_hotel_location),
    arrival_date: toText(row.arrival_date),
    arrival_hotel_checkout_date: toText(row.arrival_hotel_checkout_date),
    departure_city_arrival_date: toText(row.departure_city_arrival_date),
    departure_hotel_checkout_date: toText(row.departure_hotel_checkout_date),
    departure_date: toText(row.departure_date),
    visa_status: toText(row.visa_status),
    inside_kingdom: toBool(row.inside_kingdom),
    makkah_room_type: makkahType === 'double' || makkahType === 'quad' ? (makkahType as 'double' | 'quad') : 'triple',
    madinah_room_type:
      madinahType === 'double' || madinahType === 'quad' ? (madinahType as 'double' | 'quad') : 'triple',
    flight_contract_type: contractRaw === 'B2B' ? 'B2B' : 'GDS',
  };
}

async function fetchAllPilgrimsFromView(): Promise<Pilgrim[]> {
  const db = supabase.schema('publicsv');
  const pageSize = 1000;
  let from = 0;
  let allRows: Record<string, unknown>[] = [];

  while (true) {
    const to = from + pageSize - 1;
    const { data, error } = await db.from('pilgrims_app').select('*').order('id', { ascending: true }).range(from, to);
    if (error) throw error;
    const rows = (data ?? []) as Record<string, unknown>[];
    allRows = allRows.concat(rows);
    if (rows.length < pageSize) break;
    from += pageSize;
  }

  return allRows.map(normalizePilgrim);
}

export const usePilgrimsData = create<PilgrimsDataState>((set, get) => ({
  data: [],
  loading: false,
  loaded: false,
  error: null,

  fetchData: async () => {
    const { loading, loaded } = get();
    if (loading || loaded) return;

    set({ loading: true, error: null });
    try {
      const data = await fetchAllPilgrimsFromView();
      set({ data, loading: false, loaded: true, error: null });
    } catch (err) {
      set({
        loading: false,
        loaded: false,
        error: err instanceof Error ? err.message : 'فشل تحميل بيانات الحجاج من Supabase',
      });
    }
  },

  refresh: async () => {
    set({ loading: true, error: null });
    try {
      const data = await fetchAllPilgrimsFromView();
      set({ data, loading: false, loaded: true, error: null });
    } catch (err) {
      set({
        loading: false,
        loaded: false,
        error: err instanceof Error ? err.message : 'فشل تحديث بيانات الحجاج من Supabase',
      });
    }
  },
}));

