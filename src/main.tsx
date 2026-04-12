import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import { EmbedBootstrap } from './EmbedBootstrap';

createRoot(document.getElementById('app')!).render(
  <StrictMode>
    <EmbedBootstrap>
      <App />
    </EmbedBootstrap>
  </StrictMode>
);
