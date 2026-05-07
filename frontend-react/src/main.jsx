import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { syncTelegramThemeToRoot } from './syncTelegramTheme';
import '@telegram-apps/telegram-ui/dist/styles.css';
import './index.css';

syncTelegramThemeToRoot();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);