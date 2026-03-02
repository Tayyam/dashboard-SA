/// <reference types="vite/client" />

// Virtual module resolved at build-time by the pilgrim-xlsx-loader Vite plugin.
// The actual Excel source file lives in private/data/ and is never served.
declare module 'virtual:pilgrim-data' {
  import type { Pilgrim } from './core/types';
  export const rawData: Pilgrim[];
}

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

