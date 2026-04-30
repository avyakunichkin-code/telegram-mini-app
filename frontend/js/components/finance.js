const newGameState = {
    profile_name: '',
    mode: 'light',
    period_duration_seconds: 300
};

function showScreen(screenId) {
    document.querySelectorAll('#appPanel .screen').forEach((screen) => screen.classList.add('hidden'));
    document.getElementById(screenId).classList.remove('hidden');
}

function showGameSection(section) {
    document.querySelectorAll('.game-section').forEach((block) => block.classList.add('hidden'));
    document.getElementById(`section-${section}`).classList.remove('hidden');
    document.querySelectorAll('.nav-btn').forEach((btn) => {
        btn.classList.toggle('active', btn.dataset.section === section);
    });
}

async function loadStartMenu() {
    showScreen('startMenuScreen');
    const container = document.getElementById('gameProfilesList');
    container.classList.remove('hidden');
    const profiles = await API.getGameProfiles();
    if (!profiles || !Array.isArray(profiles) || profiles.length === 0) {
        container.innerHTML = 'Сохранений пока нет. Нажми "Новая игра".';
        return;
    }
    container.innerHTML = '<strong>Сохранения:</strong><br>';
    profiles.forEach((profile) => {
        container.innerHTML += `
            <div class="message-item">
                <div class="message-text"><strong>${escapeHtml(profile.name)}</strong> (${profile.mode})</div>
                <div class="message-time">Период: ${profile.period_index}, ${profile.time_state}</div>
                <button class="btn-secondary" data-activate-profile="${profile.id}">
                    ${profile.is_active ? 'Продолжить' : 'Загрузить'}
                </button>
            </div>
        `;
    });
}

async function openGameplay() {
    showScreen('gameScreen');
    showGameSection('dashboard');
    await loadFinanceOverview();
}

async function loadFinanceOverview() {
    const scoreBoard = document.getElementById('scoreBoard');
    const liabilitiesList = document.getElementById('liabilitiesList');
    const assetsList = document.getElementById('assetsList');
    const hudInfo = document.getElementById('hudInfo');

    showLoading(scoreBoard);
    const overview = await API.getOverview();
    if (!overview) {
        scoreBoard.innerHTML = '❌ Не удалось загрузить финансовые данные';
        hudInfo.innerHTML = '❌ Нет активной игры';
        return;
    }

    hudInfo.innerHTML = `
        <strong>Период:</strong> #${overview.period_index} | 
        <strong>Режим времени:</strong> ${overview.time_state} | 
        <strong>До перехода:</strong> ${overview.seconds_until_next_period} сек
    `;

    scoreBoard.innerHTML = `
        <strong>Уровень:</strong> ${overview.gamification_level}<br>
        <strong>Очки:</strong> ${overview.score}/100<br>
        <strong>Доход:</strong> ${overview.total_monthly_income.toFixed(2)} RUB<br>
        <strong>Платежи по обязательствам:</strong> ${overview.total_monthly_liabilities_payment.toFixed(2)} RUB<br>
        <strong>Обслуживание активов:</strong> ${overview.total_monthly_assets_maintenance.toFixed(2)} RUB<br>
        <strong>Чистый денежный поток:</strong> ${overview.net_monthly_cashflow.toFixed(2)} RUB<br>
        <strong>Долговая нагрузка:</strong> ${overview.liabilities_to_income_ratio.toFixed(2)}%<br>
        <strong>XP до следующего уровня:</strong> ${overview.xp_to_next_level}
    `;

    renderLiabilities(overview.liabilities, liabilitiesList);
    renderAssets(overview.assets, assetsList);
}

function renderLiabilities(items, target) {
    if (!items.length) {
        target.innerHTML = 'Нет обязательств';
        return;
    }
    target.innerHTML = '';
    items.forEach((item) => {
        const row = document.createElement('div');
        row.className = 'message-item';
        row.innerHTML = `
            <div class="message-text"><strong>${escapeHtml(item.title)}</strong></div>
            <div class="message-time">Долг: ${item.total_debt.toFixed(2)} | ${item.annual_rate_percent.toFixed(2)}% | Платёж: ${item.monthly_payment.toFixed(2)}</div>
            <button class="btn-secondary" data-delete-liability="${item.id}">Удалить</button>
        `;
        target.appendChild(row);
    });
}

function renderAssets(items, target) {
    if (!items.length) {
        target.innerHTML = 'Нет активов';
        return;
    }
    target.innerHTML = '';
    items.forEach((item) => {
        const row = document.createElement('div');
        row.className = 'message-item';
        row.innerHTML = `
            <div class="message-text"><strong>${escapeHtml(item.title)}</strong></div>
            <div class="message-time">Стоимость: ${item.asset_value.toFixed(2)} | Обслуживание: ${item.monthly_maintenance_cost.toFixed(2)}</div>
            <button class="btn-secondary" data-delete-asset="${item.id}">Удалить</button>
        `;
        target.appendChild(row);
    });
}

async function addLiability() {
    const title = document.getElementById('liabilityTitle').value.trim() || 'Обязательство';
    const total_debt = Number(document.getElementById('liabilityDebt').value);
    const annual_rate_percent = Number(document.getElementById('liabilityRate').value);
    const monthly_payment = Number(document.getElementById('liabilityPayment').value);

    if ([total_debt, annual_rate_percent, monthly_payment].some(Number.isNaN)) {
        showNotification('Заполните параметры обязательства', 'error');
        return;
    }

    const result = await API.addLiability({ title, total_debt, annual_rate_percent, monthly_payment });
    if (!result) {
        showNotification('Не удалось добавить обязательство', 'error');
        return;
    }

    document.getElementById('liabilityTitle').value = '';
    document.getElementById('liabilityDebt').value = '';
    document.getElementById('liabilityRate').value = '';
    document.getElementById('liabilityPayment').value = '';
    showNotification('Обязательство добавлено', 'success');
    await loadFinanceOverview();
}

async function addAsset() {
    const title = document.getElementById('assetTitle').value.trim() || 'Актив';
    const asset_value = Number(document.getElementById('assetValue').value);
    const monthly_maintenance_cost = Number(document.getElementById('assetMaintenance').value);

    if ([asset_value, monthly_maintenance_cost].some(Number.isNaN)) {
        showNotification('Заполните параметры актива', 'error');
        return;
    }

    const result = await API.addAsset({ title, asset_value, monthly_maintenance_cost });
    if (!result) {
        showNotification('Не удалось добавить актив', 'error');
        return;
    }

    document.getElementById('assetTitle').value = '';
    document.getElementById('assetValue').value = '';
    document.getElementById('assetMaintenance').value = '';
    showNotification('Актив добавлен', 'success');
    await loadFinanceOverview();
}

async function handleDeleteClick(event) {
    const liabilityId = event.target.dataset.deleteLiability;
    const assetId = event.target.dataset.deleteAsset;

    if (liabilityId) {
        await API.deleteLiability(liabilityId);
        await loadFinanceOverview();
    }
    if (assetId) {
        await API.deleteAsset(assetId);
        await loadFinanceOverview();
    }
}

async function handleProfilesClick(event) {
    const profileId = event.target.dataset.activateProfile;
    if (!profileId) {
        return;
    }
    const result = await API.activateGameProfile(profileId);
    if (!result) {
        showNotification('Не удалось переключить профиль', 'error');
        return;
    }
    await openGameplay();
}

async function setPlayMode() {
    const result = await API.setTimePlay();
    if (!result) {
        showNotification('Не удалось включить Play', 'error');
        return;
    }
    showNotification('Режим Play включен', 'success');
    await loadFinanceOverview();
}

async function setPauseMode() {
    const result = await API.setTimePause();
    if (!result) {
        showNotification('Не удалось включить Pause', 'error');
        return;
    }
    showNotification('Режим Pause включен', 'success');
    await loadFinanceOverview();
}

async function nextPeriod() {
    const result = await API.setTimeNext();
    if (!result) {
        showNotification('Не удалось перейти к следующему периоду', 'error');
        return;
    }
    showNotification('Перешли к следующему периоду', 'success');
    await loadFinanceOverview();
}

async function applyTimeConfig() {
    const value = Number(document.getElementById('newPeriodDuration').value);
    if (Number.isNaN(value) || value < 10) {
        showNotification('Введите длительность периода не меньше 10 секунд', 'error');
        return;
    }
    const result = await API.setTimeConfig({ period_duration_seconds: value });
    if (!result) {
        showNotification('Не удалось применить длительность периода', 'error');
        return;
    }
    showNotification('Длительность периода обновлена', 'success');
}

function openNewGameStep1() {
    showScreen('difficultyScreen');
}

function toBaseParamsStep() {
    const profile_name = document.getElementById('newProfileName').value.trim();
    const mode = document.getElementById('newGameMode').value;
    const period_duration_seconds = Number(document.getElementById('newPeriodDuration').value);
    if (!profile_name || Number.isNaN(period_duration_seconds) || period_duration_seconds < 10) {
        showNotification('Заполни название и корректную длительность периода', 'error');
        return;
    }
    newGameState.profile_name = profile_name;
    newGameState.mode = mode;
    newGameState.period_duration_seconds = period_duration_seconds;
    showScreen('baseParamsScreen');
}

async function startGame() {
    const monthly_amount = Number(document.getElementById('startSalaryAmount').value);
    const monthly_receipts_count = Number(document.getElementById('startSalaryReceipts').value);
    if (Number.isNaN(monthly_amount) || Number.isNaN(monthly_receipts_count) || monthly_receipts_count <= 0) {
        showNotification('Введи корректные базовые параметры', 'error');
        return;
    }
    const result = await API.startNewGame({
        profile_name: newGameState.profile_name,
        mode: newGameState.mode,
        period_duration_seconds: newGameState.period_duration_seconds,
        monthly_amount,
        monthly_receipts_count
    });
    if (!result) {
        showNotification('Не удалось запустить новую игру', 'error');
        return;
    }
    showNotification('Игра запущена. Базовые параметры зафиксированы.', 'success');
    await openGameplay();
}

function setupFinanceHandlers() {
    document.getElementById('newGameBtn').onclick = openNewGameStep1;
    document.getElementById('loadGameBtn').onclick = loadStartMenu;
    document.getElementById('settingsBtn').onclick = () => showNotification('Настройки появятся в следующей итерации', 'info');
    document.getElementById('goToStartMenuBtn').onclick = loadStartMenu;
    document.getElementById('logoutBtnSecondary').onclick = handleLogout;
    document.getElementById('toBaseParamsBtn').onclick = toBaseParamsStep;
    document.getElementById('startGameBtn').onclick = startGame;
    document.getElementById('backToMenuBtn').onclick = loadStartMenu;
    document.getElementById('backToDifficultyBtn').onclick = openNewGameStep1;
    document.getElementById('applyTimeConfigBtn').onclick = applyTimeConfig;
    document.getElementById('addLiabilityBtn').onclick = addLiability;
    document.getElementById('addAssetBtn').onclick = addAsset;
    document.getElementById('timePlayBtn').onclick = setPlayMode;
    document.getElementById('timePauseBtn').onclick = setPauseMode;
    document.getElementById('timeNextBtn').onclick = nextPeriod;
    document.getElementById('liabilitiesList').addEventListener('click', handleDeleteClick);
    document.getElementById('assetsList').addEventListener('click', handleDeleteClick);
    document.getElementById('gameProfilesList').addEventListener('click', handleProfilesClick);
    document.querySelectorAll('.nav-btn').forEach((btn) => {
        btn.addEventListener('click', () => showGameSection(btn.dataset.section));
    });
}

window.loadFinanceOverview = loadFinanceOverview;
window.loadStartMenu = loadStartMenu;
