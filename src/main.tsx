import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Suppress ResizeObserver loop completed with undelivered notifications error
const resizeObserverError = "ResizeObserver loop completed with undelivered notifications.";
const resizeObserverErrorTwo = "ResizeObserver loop limit exceeded";

window.addEventListener("error", (e) => {
  if (e.message === resizeObserverError || e.message === resizeObserverErrorTwo) {
    e.stopImmediatePropagation();
  }
});

// Register service worker for offline support
registerSW({
  onNeedRefresh() {
    console.log('New content available, please refresh.');
  },
  onOfflineReady() {
    console.log('App ready to work offline');
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
