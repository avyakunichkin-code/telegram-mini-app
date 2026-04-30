// Уведомления
function showNotification(message, type = 'info') {
    if (tg && tg.showPopup) {
        const titles = {
            error: '❌ Ошибка',
            success: '✅ Успех',
            info: 'ℹ️ Информация'
        };
        tg.showPopup({
            title: titles[type] || titles.info,
            message: message,
            buttons: [{ type: 'ok' }]
        });
    } else {
        alert(message);
    }
}