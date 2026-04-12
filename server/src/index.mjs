import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const PORT = Number(process.env.PORT || 8787);
const EMBED_SECRET = process.env.EMBED_SECRET;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const EMBED_USER_EMAIL = process.env.SUPABASE_EMBED_USER_EMAIL;
const EMBED_USER_PASSWORD = process.env.SUPABASE_EMBED_USER_PASSWORD;

const corsOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

/** مؤقت: DISABLE_CORS=1 يعكس أي Origin (إلغاء تقييد CORS). أعد 0 أو احذف السطر للإنتاج. */
const corsDisabled = ['1', 'true', 'yes'].includes(String(process.env.DISABLE_CORS || '').toLowerCase());

function requireEnv(name, value) {
  if (!value || String(value).trim() === '') {
    console.error(`Missing required env: ${name}`);
    process.exit(1);
  }
}

requireEnv('EMBED_SECRET', EMBED_SECRET);
requireEnv('SUPABASE_URL', SUPABASE_URL);
requireEnv('SUPABASE_ANON_KEY', SUPABASE_ANON_KEY);
requireEnv('SUPABASE_EMBED_USER_EMAIL', EMBED_USER_EMAIL);
requireEnv('SUPABASE_EMBED_USER_PASSWORD', EMBED_USER_PASSWORD);

/** Compare secrets without leaking length via timingSafeEqual on fixed-length digests. */
function verifyEmbedSecret(provided, expected) {
  if (!provided || !expected) return false;
  try {
    const hp = crypto.createHash('sha256').update(String(provided), 'utf8').digest();
    const he = crypto.createHash('sha256').update(String(expected), 'utf8').digest();
    return crypto.timingSafeEqual(hp, he);
  } catch {
    return false;
  }
}

const app = express();
app.use(helmet());
app.use(express.json({ limit: '8kb' }));
const corsOptions = {
  methods: ['POST', 'GET', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400,
};
app.use(
  cors(
    corsDisabled
      ? { ...corsOptions, origin: true }
      : { ...corsOptions, origin: corsOrigins.length ? corsOrigins : false },
  ),
);
if (corsDisabled) {
  console.warn('dashboard-api: CORS unrestricted (DISABLE_CORS is set) — revert for production');
}

const embedLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'rate_limited' },
});

function extractEmbedToken(req) {
  const auth = req.headers.authorization;
  if (auth?.startsWith('Bearer ')) return auth.slice(7).trim();
  if (req.body && typeof req.body.embed_token === 'string') return req.body.embed_token.trim();
  return null;
}

app.get('/health', (_req, res) => {
  res.status(200).json({ ok: true });
});

app.post('/api/embed/session', embedLimiter, async (req, res) => {
  const token = extractEmbedToken(req);
  if (!verifyEmbedSecret(token, EMBED_SECRET)) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase.auth.signInWithPassword({
    email: EMBED_USER_EMAIL,
    password: EMBED_USER_PASSWORD,
  });

  if (error || !data.session) {
    console.error('embed signIn:', error?.message ?? 'no session');
    return res.status(502).json({ error: 'auth_upstream' });
  }

  return res.json({
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
    expires_in: data.session.expires_in,
  });
});

app.listen(PORT, () => {
  console.log(`dashboard-api listening on http://127.0.0.1:${PORT}`);
});
