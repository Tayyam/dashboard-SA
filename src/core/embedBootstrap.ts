import { supabase } from './supabaseClient';
import { markDashboardEmbedSession } from './embedPresentation';

let embedBootstrapOnce: Promise<void> | null = null;

/**
 * If `?embed_token=` is present, exchanges it with the backend for a Supabase session
 * (backend validates EMBED_SECRET then signs in as the embed user via anon + password).
 * Clears the query param from the URL on success. Idempotent per page load.
 */
export function ensureEmbedBootstrap(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (embedBootstrapOnce) return embedBootstrapOnce;

  embedBootstrapOnce = (async () => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('embed_token');
    if (!token) return;

    const base = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ?? '';
    const url = base ? `${base}/api/embed/session` : '/api/embed/session';

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      throw new Error('embed_session_failed');
    }

    const body = (await res.json()) as {
      access_token?: string;
      refresh_token?: string;
    };

    if (!body.access_token || !body.refresh_token) {
      throw new Error('embed_session_invalid');
    }

    const { error } = await supabase.auth.setSession({
      access_token: body.access_token,
      refresh_token: body.refresh_token,
    });

    if (error) throw error;

    markDashboardEmbedSession();

    params.delete('embed_token');
    const next = new URL(window.location.href);
    next.search = params.toString();
    const path = next.pathname + (next.search ? next.search : '') + next.hash;
    window.history.replaceState({}, '', path);
  })();

  return embedBootstrapOnce;
}
