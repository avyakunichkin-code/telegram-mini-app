async function checkTokenAndStart() {
    const token = localStorage.getItem(APP_CONFIG.TOKEN_KEY);

    if (!token) {
        showLogin();
        return;
    }
    
    setAuthToken(token);
    const user = await API.getMe();

    if (user) {
        document.getElementById('userName').innerText = user.username;
        showApp();
    } else {
        setAuthToken(null);
        showLogin();
    }
}

// Инициализация
document.addEventListener('DOMContentLoaded', async () => {
    if (typeof setupAuthHandlers === 'function') setupAuthHandlers();
    if (typeof window.setupFinanceHandlers === 'function') window.setupFinanceHandlers();
    // или просто setupFinanceHandlers(), если она глобальная
    await checkTokenAndStart();
});