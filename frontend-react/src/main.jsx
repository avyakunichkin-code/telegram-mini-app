import { ensureHashRouterEntry, isLandingPathname } from './utils/hashRouterBoot';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { syncTelegramThemeToRoot } from './syncTelegramTheme';
import '@telegram-apps/telegram-ui/dist/styles.css';
import './index.css';

ensureHashRouterEntry();
syncTelegramThemeToRoot();

if (import.meta.env.PROD && 'serviceWorker' in navigator && !isLandingPathname()) {
  import('virtual:pwa-register').then(({ registerSW }) => {
    registerSW({ immediate: true });
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);