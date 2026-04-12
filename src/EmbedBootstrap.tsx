import { useEffect, useState, type ReactNode } from 'react';
import { FullScreenLoader } from './components/FullScreenLoader';
import { ensureEmbedBootstrap } from './core/embedBootstrap';

type State = 'boot' | 'ready' | 'error';

function urlHasEmbedToken() {
  if (typeof window === 'undefined') return false;
  return new URLSearchParams(window.location.search).has('embed_token');
}

export function EmbedBootstrap({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(() => (urlHasEmbedToken() ? 'boot' : 'ready'));

  useEffect(() => {
    if (!urlHasEmbedToken()) return;
    let cancelled = false;
    ensureEmbedBootstrap()
      .then(() => {
        if (!cancelled) setState('ready');
      })
      .catch(() => {
        if (!cancelled) setState('error');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (state === 'boot') {
    return <FullScreenLoader variant="loading" />;
  }

  if (state === 'error') {
    return <FullScreenLoader variant="failed" />;
  }

  return <>{children}</>;
}
