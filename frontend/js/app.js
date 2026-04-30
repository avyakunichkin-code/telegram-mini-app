// Главный файл приложения

// Инициализация Telegram
if (tg) {
    tg.MainButton.onClick(() => {
        const messageInput = document.getElementById('messageInput');
        if (messageInput && messageInput.value.trim()) {
            sendMessage();
        } else {
            showNotification('Сначала введите сообщение', 'info');
        }
    });
}

// Запуск приложения
document.addEventListener('DOMContentLoaded', async () => {
    // Настройка обработчиков
    setupTabs();
    setupAuthHandlers();
    setupMessagesHandlers();
    setupProfileHandlers();
    
    // Проверка токена
    await checkTokenAndStart();
});