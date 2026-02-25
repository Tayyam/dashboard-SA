import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/base.css';
import './styles/intro.css';
import './styles/auth.css';
import './styles/pending.css';
import './styles/admin.css';
import './styles/header.css';
import './styles/profile.css';
import './styles/layout.css';
import './styles/dashboard.css';
import './styles/journey.css';
import App from './App';

createRoot(document.getElementById('app')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
