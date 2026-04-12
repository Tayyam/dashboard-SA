const DASHBOARD_EMBED_SESSION_KEY = 'dashboard_embed';

/** Call after a successful embed_token → session exchange (top-level load). */
export function markDashboardEmbedSession(): void {
  try {
    sessionStorage.setItem(DASHBOARD_EMBED_SESSION_KEY, '1');
  } catch {
    /* private / storage blocked */
  }
}

export function clearDashboardEmbedSessionFlag(): void {
  try {
    sessionStorage.removeItem(DASHBOARD_EMBED_SESSION_KEY);
  } catch {
    /* */
  }
}

/** Minimal chrome: inside an iframe, or after embed_token login in this tab. */
export function isDashboardEmbedPresentation(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    if (window.self !== window.top) return true;
    return sessionStorage.getItem(DASHBOARD_EMBED_SESSION_KEY) === '1';
  } catch {
    return false;
  }
}
