import { create } from 'zustand';
import type { Pilgrim } from '../core/types';
import { supabase } from '../core/supabaseClient';
import { pilgrimFromRow } from '../core/pilgrimFromRow';

interface PilgrimsDataState {
  data: Pilgrim[];
  loading: boolean;
  loaded: boolean;
  error: string | null;
  fetchData: () => Promise<void>;
  refresh: () => Promise<void>;
}

function normalizePilgrim(row: Record<string, unknown>, index: number): Pilgrim {
  return pilgrimFromRow(row, index);
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

