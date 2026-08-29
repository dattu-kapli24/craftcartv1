import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import OrderSpotCollectPage from '../app/collect/page';
import './index.css';

const container = document.getElementById('collect-root') || document.getElementById('root');
if (container) {
  createRoot(container).render(
    <StrictMode>
      <OrderSpotCollectPage />
    </StrictMode>
  );
}
