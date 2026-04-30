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
    setupAuthHandlers();
    setupFinanceHandlers();
    
    await checkTokenAndStart();
});