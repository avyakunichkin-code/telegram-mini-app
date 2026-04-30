// Профиль
async function loadProfile() {
    const profileDiv = document.getElementById('profileInfo');
    showLoading(profileDiv);
    
    const user = await API.getMe();
    
    if (user) {
        document.getElementById('userName').innerText = user.username;
        profileDiv.innerHTML = `
            <strong>ID:</strong> ${user.id}<br>
            <strong>Имя пользователя:</strong> ${user.username}<br>
            <strong>Полное имя:</strong> ${user.full_name || '—'}<br>
            <strong>Email:</strong> ${user.email || '—'}<br>
            <strong>Сообщений:</strong> ${user.messages_count}<br>
            <strong>Зарегистрирован:</strong> ${formatDate(user.created_at)}
        `;
        profileDiv.classList.add('status-success');
    } else {
        profileDiv.innerHTML = '❌ Не удалось загрузить профиль';
        profileDiv.classList.add('status-error');
    }
}

function setupProfileHandlers() {
    document.getElementById('refreshProfileBtn').onclick = loadProfile;
}

// Экспортируем
window.loadProfile = loadProfile;