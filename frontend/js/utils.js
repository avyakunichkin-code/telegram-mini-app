// Утилиты

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleString();
}

function showLoading(element) {
    if (element) {
        element.innerHTML = '<div class="loading"></div> Загрузка...';
    }
}

function getTelegramTheme() {
    return tg ? tg.colorScheme : 'light';
}

function getTelegramPlatform() {
    return tg ? tg.platform : 'web';
}