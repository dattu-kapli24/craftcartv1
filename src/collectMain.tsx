import React from 'react';
import { createRoot } from 'react-dom/client';
import { StrictMode } from 'react';
import OrderSpotCollectPage from '../app/collect/page';
import './index.css';

/**
 * OrderSpot Collect Direct Landing Page
 * Provides immediate open access to the dashboard for live demos and customer previews.
 * (Admin authentication gate can be toggled on post-demo onboardings)
 */
function CollectApp() {
  return <OrderSpotCollectPage />;
}

createRoot(document.getElementById('collect-root')!).render(
  <StrictMode>
    <CollectApp />
  </StrictMode>
);
