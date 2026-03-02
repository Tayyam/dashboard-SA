import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import * as XLSX from 'xlsx';
import { readFileSync } from 'fs';

// ── Helper: convert Excel date serial OR date string → YYYY-MM-DD ─────────────
function toISODate(val: unknown): string {
  if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}/.test(val)) return val.slice(0, 10);
  if (typeof val === 'number') {
    // Excel epoch: days since 1899-12-30
    const ms = Math.round((val - 25569) * 86400_000);
    return new Date(ms).toISOString().slice(0, 10);
  }
  return '';
}

// ── Vite plugin: transforms dataSV.xlsx → { rawData: Pilgrim[] } ──────────────
function pilgrimXlsxPlugin(): Plugin {
  const XLSX_SUFFIX = 'dataSV.xlsx';

  return {
    name: 'pilgrim-xlsx-loader',
    enforce: 'pre',

    load(id) {
      if (!id.endsWith(XLSX_SUFFIX)) return null;

      const wb = XLSX.read(readFileSync(id), { type: 'buffer' });
      const ws = wb.Sheets['main'];
      if (!ws) throw new Error('[pilgrim-xlsx-loader] Sheet "main" not found in dataSV.xlsx');

      type Row = Record<string, unknown>;
      const dataRows = XLSX.utils.sheet_to_json<Row>(ws, { defval: null });

      const toText = (val: unknown): string => (val == null ? '' : String(val).trim());

      const pilgrims = dataRows.map((row, idx) => {
        const contractRaw = toText(row['Flight_contract_type']).toUpperCase();
        const genderRaw   = toText(row['gender']).toLowerCase();

        return {
          id:                            idx + 1,
          booking_id:                    toText(row['nusuk_id']) || toText(row['Booking_ID']) || `SV-${idx + 1}`,
          gender:                        genderRaw === 'male' ? 'Male' : 'Female',
          name:                          toText(row['name']),
          birth_date:                    toISODate(row['birth_date']),
          age:                           Number(row['Age'] ?? 0),
          guide_name:                    toText(row['guide_name']),
          residence_country:             toText(row['residence_country']),
          nationality:                   toText(row['nationality']),
          package_id:                    toText(row['package_id']),
          package:                       toText(row['package_name']),
          arrival_city:                  toText(row['Dep_Destination']),
          departure_city:                toText(row['Ret_Origin']),
          arrival_hotel:                 toText(row['packages.first_hotel_name']),
          departure_hotel:               toText(row['last_hotel_name']),
          arrival_date:                  toISODate(row['Dep_Arr_Date']),
          arrival_hotel_checkout_date:   toISODate(row['packages.first_hotel_check_out']),
          departure_city_arrival_date:   toISODate(row['last_hotel_check_in']),
          departure_hotel_checkout_date: toISODate(row['last_hotel_check_out']),
          departure_date:                toISODate(row['Ret_Date']),
          makkah_room_type:              'triple',
          madinah_room_type:             'triple',
          flight_contract_type:          contractRaw === 'B2B' ? 'B2B' : 'GDS',
        };
      });

      return `export const rawData = ${JSON.stringify(pilgrims)};`;
    },
  };
}

export default defineConfig({
  plugins: [pilgrimXlsxPlugin(), react()],
});
