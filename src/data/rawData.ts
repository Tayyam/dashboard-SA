// Data is loaded and transformed at build time by the pilgrim-xlsx-loader
// Vite plugin (vite.config.ts). The source Excel file lives in private/data/
// and is never exposed to the browser or served by the dev server.
export { rawData } from 'virtual:pilgrim-data';
