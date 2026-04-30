// Конфигурация приложения
const APP_CONFIG = {
    API_URL: "https://telegram-mini-app-zwfs.onrender.com",
    TOKEN_KEY: "tg_miniapp_token",
    MESSAGES_LIMIT: 50
};

// Инициализация Telegram Web App
const tg = window.Telegram.WebApp;
if (tg) {
    tg.expand();
    tg.MainButton.setText("✅ Готово");
    tg.MainButton.show();
}