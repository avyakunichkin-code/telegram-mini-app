// Авторизация

function showLogin() {
    document.getElementById('loginPanel').classList.remove('hidden');
    document.getElementById('registerPanel').classList.add('hidden');
    document.getElementById('appPanel').classList.add('hidden');
}

function showApp() {
    document.getElementById('loginPanel').classList.add('hidden');
    document.getElementById('registerPanel').classList.add('hidden');
    document.getElementById('appPanel').classList.remove('hidden');
    updateAppInfo();
}

function updateAppInfo() {
    const infoDiv = document.getElementById('appInfo');
    if (infoDiv) {
        infoDiv.innerHTML = `
            <strong>Статус:</strong> ✅ Авторизован<br>
            <strong>Платформа:</strong> ${getTelegramPlatform()}<br>
            <strong>Тема:</strong> ${getTelegramTheme()}<br>
            <strong>База данных:</strong> PostgreSQL<br>
            <strong>Авторизация:</strong> JWT (логин/пароль)
        `;
    }
}

async function handleRegister() {
    const username = document.getElementById('regUsername').value;
    const password = document.getElementById('regPassword').value;
    const full_name = document.getElementById('regFullname').value;
    const email = document.getElementById('regEmail').value;
    
    if (!username || !password) {
        showNotification('Заполните имя пользователя и пароль', 'error');
        return;
    }
    
    const result = await API.register({ username, password, full_name, email });
    
    if (result && result.access_token) {
        setAuthToken(result.access_token);
        showApp();
        if (window.loadProfile) window.loadProfile();
        showNotification('Регистрация успешна!', 'success');
    } else {
        showNotification('Ошибка регистрации', 'error');
    }
}

async function handleLogin() {
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    
    if (!username || !password) {
        showNotification('Введите имя пользователя и пароль', 'error');
        return;
    }
    
    const result = await API.login({ username, password });
    
    console.log('Login result:', result);  // ← Отладка
    
    if (result && result.access_token) {
        // Сохраняем токен
        setAuthToken(result.access_token);
        
        // Дополнительная проверка
        console.log('Token saved:', localStorage.getItem(APP_CONFIG.TOKEN_KEY));
        console.log('Current authToken variable:', authToken);
        
        // Обновляем имя пользователя
        document.getElementById('userName').innerText = result.username;
        
        showApp();
        await loadProfile();  // ← ждём загрузки профиля
        showNotification('Вход выполнен!', 'success');
    } else {
        console.error('Login failed, no token received');
        showNotification('Неверное имя пользователя или пароль', 'error');
    }
}

function handleLogout() {
    setAuthToken(null);
    showLogin();
    showNotification('Вы вышли из аккаунта', 'info');
}

// Проверка токена при старте
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
        if (window.loadProfile) window.loadProfile();
    } else {
        showLogin();
    }
}

// Настройка обработчиков авторизации
function setupAuthHandlers() {
    document.getElementById('registerBtn').onclick = handleRegister;
    document.getElementById('loginBtn').onclick = handleLogin;
    document.getElementById('logoutBtn').onclick = handleLogout;
    document.getElementById('showRegisterBtn')?.addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('loginPanel').classList.add('hidden');
        document.getElementById('registerPanel').classList.remove('hidden');
    });
    document.getElementById('showLoginBtn')?.addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('registerPanel').classList.add('hidden');
        document.getElementById('loginPanel').classList.remove('hidden');
    });
}