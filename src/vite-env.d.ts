/// <reference types="vite/client" />

// Allow importing .xlsx files via the pilgrim-xlsx-loader Vite plugin
declare module '*.xlsx' {
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

