import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

const container = document.getElementById('root') || document.getElementById('collect-root');
if (container) {
  createRoot(container).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}
