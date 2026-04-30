// frontend/js/app.js

// Проверка токена при старте
async function checkTokenAndStart() {
    const token = localStorage.getItem(APP_CONFIG.TOKEN_KEY);
    console.log('Checking token on start:', token ? 'present' : 'not found');
    
    if (!token) {
        showLogin();
        return;
    }
    
    setAuthToken(token);
    const user = await API.getMe();
    
    if (user) {
        console.log('Token valid, user:', user.username);
        document.getElementById('userName').innerText = user.username;
        showApp();
        await loadProfile();
    } else {
        console.log('Token invalid, clearing');
        setAuthToken(null);
        showLogin();
    }
}

// Инициализация
document.addEventListener('DOMContentLoaded', async () => {
    console.log('App starting...');
    
    setupTabs();
    setupAuthHandlers();
    setupMessagesHandlers();
    setupProfileHandlers();
    
    await checkTokenAndStart();
});