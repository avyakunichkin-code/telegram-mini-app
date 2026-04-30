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
    if (window.loadFinanceOverview) {
        window.loadFinanceOverview();
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
        document.getElementById('userName').innerText = result.username;
        showApp();
        if (window.loadFinanceOverview) window.loadFinanceOverview();
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
    
    if (result && result.access_token) {
        setAuthToken(result.access_token);
        document.getElementById('userName').innerText = result.username;
        showApp();
        if (window.loadFinanceOverview) {
            await window.loadFinanceOverview();
        }
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