// ==================== СОСТОЯНИЕ ВРЕМЕНИ ====================
let timeTicker = null;
let isTimeSyncInProgress = false;

// Состояние игры из последнего ответа сервера
let currentGameTime = {
    time_state: 'pause',
    period_index: 1,
    period_duration_seconds: 300,
    seconds_until_next_period: 300
};

// Локальный счётчик для плавного обновления
let localRemainingSeconds = 0;
let lastServerSync = 0;

// ==================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ====================

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function setHUDState(state, message = '') {
    const timePlayBtn = document.getElementById('timePlayBtn');
    const timePauseBtn = document.getElementById('timePauseBtn');
    const timeNextBtn = document.getElementById('timeNextBtn');
    const hudInfo = document.getElementById('hudInfo');

    switch(state) {
        case 'play':
            if (timePlayBtn) timePlayBtn.disabled = true;
            if (timePauseBtn) timePauseBtn.disabled = false;
            if (timeNextBtn) timeNextBtn.disabled = false;
            if (hudInfo) hudInfo.classList.remove('syncing');
            break;
        case 'pause':
            if (timePlayBtn) timePlayBtn.disabled = false;
            if (timePauseBtn) timePauseBtn.disabled = true;
            if (timeNextBtn) timeNextBtn.disabled = false;
            if (hudInfo) hudInfo.classList.remove('syncing');
            break;
        case 'syncing':
            if (timePlayBtn) timePlayBtn.disabled = true;
            if (timePauseBtn) timePauseBtn.disabled = true;
            if (timeNextBtn) timeNextBtn.disabled = true;
            if (hudInfo) {
                hudInfo.classList.add('syncing');
                if (message) hudInfo.innerHTML = message;
            }
            break;
    }
}

function updateHUDDisplay() {
    const hudInfo = document.getElementById('hudInfo');
    if (!hudInfo) return;

    const remaining = currentGameTime.time_state === 'play'
        ? localRemainingSeconds
        : currentGameTime.seconds_until_next_period;

    hudInfo.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
                <strong>📅 Период:</strong> #${currentGameTime.period_index} &nbsp;|&nbsp;
                <strong>⏱️ Режим:</strong> ${currentGameTime.time_state === 'play' ? '▶️ Play' : '⏸️ Pause'}
            </div>
            <div style="font-size: 24px; font-weight: bold; font-family: monospace;">
                ${formatTime(Math.max(0, remaining))}
            </div>
        </div>
    `;

    setHUDState(currentGameTime.time_state);
}

// ==================== ОСНОВНЫЕ ФУНКЦИИ ====================

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

// ==================== ЗАГРУЗКА ФИНАНСОВЫХ ДАННЫХ ====================

async function loadFinanceOverview() {
    const scoreBoard = document.getElementById('scoreBoard');
    const liabilitiesList = document.getElementById('liabilitiesList');
    const assetsList = document.getElementById('assetsList');
    const safetyFundSpan = document.getElementById('safetyFundTotal');

    if (scoreBoard) showLoading(scoreBoard);

    const overview = await API.getOverview();
    if (!overview) {
        if (scoreBoard) scoreBoard.innerHTML = '❌ Не удалось загрузить финансовые данные';
        return;
    }

    // Обновляем глобальное состояние времени
    currentGameTime = {
        time_state: overview.time_state,
        period_index: overview.period_index,
        period_duration_seconds: overview.period_duration_seconds,
        seconds_until_next_period: overview.seconds_until_next_period
    };
    localRemainingSeconds = overview.seconds_until_next_period;
    lastServerSync = Date.now();
    updateHUDDisplay();

    // Обновляем доску счёта
    if (scoreBoard) {
        scoreBoard.innerHTML = `
            <strong>Уровень:</strong> ${overview.gamification_level}<br>
            <strong>Очки:</strong> ${overview.score}/100<br>
            <strong>Доход:</strong> ${overview.total_monthly_income.toFixed(2)} ₽<br>
            <strong>Платежи по обязательствам:</strong> ${overview.total_monthly_liabilities_payment.toFixed(2)} ₽<br>
            <strong>Обслуживание активов:</strong> ${overview.total_monthly_assets_maintenance.toFixed(2)} ₽<br>
            <strong>Чистый денежный поток:</strong> ${overview.net_monthly_cashflow.toFixed(2)} ₽<br>
            <strong>Долговая нагрузка:</strong> ${overview.liabilities_to_income_ratio.toFixed(2)}%<br>
            <strong>XP до следующего уровня:</strong> ${overview.xp_to_next_level}
        `;
    }

    if (liabilitiesList) renderLiabilities(overview.liabilities, liabilitiesList);
    if (assetsList) renderAssets(overview.assets, assetsList);
    if (safetyFundSpan && overview.safety_fund_total !== undefined) {
        safetyFundSpan.innerText = overview.safety_fund_total.toFixed(2);
    }

    // Загружаем статус периода
    if (window.loadPeriodStatus) {
        await window.loadPeriodStatus();
    }
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

// ==================== УПРАВЛЕНИЕ ВРЕМЕНЕМ ====================

async function fetchTimeStatus() {
    if (isTimeSyncInProgress) return null;

    isTimeSyncInProgress = true;
    setHUDState('syncing', '🔄 Синхронизация...');

    try {
        const result = await API.getTimeStatus();
        if (result) {
            currentGameTime = {
                time_state: result.time_state,
                period_index: result.period_index,
                period_duration_seconds: result.period_duration_seconds,
                seconds_until_next_period: result.seconds_until_next_period
            };
            localRemainingSeconds = result.seconds_until_next_period;
            lastServerSync = Date.now();
            updateHUDDisplay();
            return result;
        }
    } catch (error) {
        console.error('Failed to fetch time status:', error);
    } finally {
        isTimeSyncInProgress = false;
        setHUDState(currentGameTime.time_state);
    }
    return null;
}

async function forceSyncAndRefresh() {
    const status = await fetchTimeStatus();
    if (status) {
        showNotification(`Период #${status.period_index}`, 'info');
        await loadFinanceOverview();
    }
    return status;
}

async function setPlayMode() {
    if (isTimeSyncInProgress || currentGameTime.time_state === 'play') return;

    setHUDState('syncing', '▶️ Запуск времени...');

    const result = await API.setTimePlay();
    if (result) {
        currentGameTime.time_state = 'play';
        localRemainingSeconds = result.seconds_until_next_period;
        lastServerSync = Date.now();
        updateHUDDisplay();
        showNotification('Время пошло!', 'success');
        startTimeTicker();
    } else {
        showNotification('Не удалось запустить время', 'error');
        setHUDState(currentGameTime.time_state);
    }
}

async function setPauseMode() {
    if (isTimeSyncInProgress || currentGameTime.time_state === 'pause') return;

    setHUDState('syncing', '⏸️ Остановка времени...');

    const result = await API.setTimePause();
    if (result) {
        currentGameTime.time_state = 'pause';
        localRemainingSeconds = result.seconds_until_next_period;
        currentGameTime.seconds_until_next_period = result.seconds_until_next_period;
        updateHUDDisplay();
        showNotification('Время остановлено', 'info');
    } else {
        showNotification('Не удалось остановить время', 'error');
        setHUDState(currentGameTime.time_state);
    }
}

async function nextPeriod() {
    if (isTimeSyncInProgress) return;

    setHUDState('syncing', '⏩ Переход к следующему периоду...');

    // Если есть функция завершения периода — вызываем
    if (window.completePeriod) {
        await window.completePeriod();
    }

    const result = await API.setTimeNext();
    if (result) {
        currentGameTime = {
            time_state: result.time_state,
            period_index: result.period_index,
            period_duration_seconds: result.period_duration_seconds,
            seconds_until_next_period: result.seconds_until_next_period
        };
        localRemainingSeconds = result.seconds_until_next_period;
        lastServerSync = Date.now();
        updateHUDDisplay();
        showNotification(`📅 Период #${result.period_index} начался!`, 'success');
        await loadFinanceOverview();
    } else {
        showNotification('Не удалось перейти к следующему периоду', 'error');
        setHUDState(currentGameTime.time_state);
    }
}

// ==================== ТИКЕР ВРЕМЕНИ ====================

function startTimeTicker() {
    if (timeTicker) clearInterval(timeTicker);

    timeTicker = setInterval(() => {
        if (currentGameTime.time_state !== 'play') return;

        const now = Date.now();
        const elapsedSeconds = Math.floor((now - lastServerSync) / 1000);
        const remaining = currentGameTime.seconds_until_next_period - elapsedSeconds;

        if (remaining <= 0) {
            handlePeriodEnd();
        } else {
            localRemainingSeconds = remaining;
            updateHUDDisplay();
        }
    }, 200);
}

async function handlePeriodEnd() {
    if (timeTicker) clearInterval(timeTicker);
    timeTicker = null;

    setHUDState('syncing', '🔄 Конец периода, загрузка...');
    showNotification('⏰ Период завершён! Загружаем новый период...', 'info');

    const status = await forceSyncAndRefresh();

    if (status && status.seconds_until_next_period > 0) {
        startTimeTicker();
    }
}

function stopTimeTicker() {
    if (timeTicker) {
        clearInterval(timeTicker);
        timeTicker = null;
    }
}

// ==================== ФИНАНСОВЫЕ ДЕЙСТВИЯ ====================

async function addLiability() {
    const title = document.getElementById('liabilityTitle')?.value.trim() || 'Обязательство';
    const total_debt = Number(document.getElementById('liabilityDebt')?.value);
    const annual_rate_percent = Number(document.getElementById('liabilityRate')?.value);
    const monthly_payment = Number(document.getElementById('liabilityPayment')?.value);

    if ([total_debt, annual_rate_percent, monthly_payment].some(Number.isNaN)) {
        showNotification('Заполните параметры обязательства', 'error');
        return;
    }

    const result = await API.addLiability({ title, total_debt, annual_rate_percent, monthly_payment });
    if (!result) {
        showNotification('Не удалось добавить обязательство', 'error');
        return;
    }

    if (document.getElementById('liabilityTitle')) document.getElementById('liabilityTitle').value = '';
    if (document.getElementById('liabilityDebt')) document.getElementById('liabilityDebt').value = '';
    if (document.getElementById('liabilityRate')) document.getElementById('liabilityRate').value = '';
    if (document.getElementById('liabilityPayment')) document.getElementById('liabilityPayment').value = '';

    showNotification('Обязательство добавлено', 'success');
    await loadFinanceOverview();
}

async function addAsset() {
    const title = document.getElementById('assetTitle')?.value.trim() || 'Актив';
    const asset_value = Number(document.getElementById('assetValue')?.value);
    const monthly_maintenance_cost = Number(document.getElementById('assetMaintenance')?.value);

    if ([asset_value, monthly_maintenance_cost].some(Number.isNaN)) {
        showNotification('Заполните параметры актива', 'error');
        return;
    }

    const result = await API.addAsset({ title, asset_value, monthly_maintenance_cost });
    if (!result) {
        showNotification('Не удалось добавить актив', 'error');
        return;
    }

    if (document.getElementById('assetTitle')) document.getElementById('assetTitle').value = '';
    if (document.getElementById('assetValue')) document.getElementById('assetValue').value = '';
    if (document.getElementById('assetMaintenance')) document.getElementById('assetMaintenance').value = '';

    showNotification('Актив добавлен', 'success');
    await loadFinanceOverview();
}

// ==================== ЗАГРУЗКА МЕНЮ ====================

async function loadStartMenu() {
    showScreen('startMenuScreen');
    const container = document.getElementById('gameProfilesList');
    if (!container) return;

    container.classList.remove('hidden');
    const profiles = await API.getGameProfiles();

    if (!profiles || !Array.isArray(profiles) || profiles.length === 0) {
        container.innerHTML = 'Сохранений пока нет. Нажми "Новая игра".';
        return;
    }

    container.innerHTML = '<strong>📁 Сохранения:</strong><br>';
    profiles.forEach((profile) => {
        container.innerHTML += `
            <div class="message-item">
                <div class="message-text"><strong>${escapeHtml(profile.name)}</strong> (${profile.mode})</div>
                <div class="message-time">Период: ${profile.period_index}</div>
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
    await initTimeSystem();
    await loadFinanceOverview();
}

async function initTimeSystem() {
    const status = await fetchTimeStatus();
    if (status && status.time_state === 'play') {
        startTimeTicker();
    }
}

// ==================== ОБРАБОТЧИКИ СОБЫТИЙ ====================

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
    if (!profileId) return;

    const result = await API.activateGameProfile(profileId);
    if (!result) {
        showNotification('Не удалось переключить профиль', 'error');
        return;
    }
    await openGameplay();
}

function openNewGameStep1() {
    showScreen('difficultyScreen');
}

function toBaseParamsStep() {
    const profile_name = document.getElementById('newProfileName')?.value.trim();
    const mode = document.getElementById('newGameMode')?.value;
    const period_duration_seconds = Number(document.getElementById('newPeriodDuration')?.value);

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
    const monthly_amount = Number(document.getElementById('startSalaryAmount')?.value);
    const monthly_receipts_count = Number(document.getElementById('startSalaryReceipts')?.value);

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

// ==================== НАСТРОЙКА ОБРАБОТЧИКОВ ====================

function setupFinanceHandlers() {
    // Навигация
    const newGameBtn = document.getElementById('newGameBtn');
    const loadGameBtn = document.getElementById('loadGameBtn');
    const goToStartMenuBtn = document.getElementById('goToStartMenuBtn');
    const logoutBtnSecondary = document.getElementById('logoutBtnSecondary');
    const toBaseParamsBtn = document.getElementById('toBaseParamsBtn');
    const startGameBtn = document.getElementById('startGameBtn');
    const backToMenuBtn = document.getElementById('backToMenuBtn');
    const backToDifficultyBtn = document.getElementById('backToDifficultyBtn');

    if (newGameBtn) newGameBtn.onclick = openNewGameStep1;
    if (loadGameBtn) loadGameBtn.onclick = loadStartMenu;
    if (goToStartMenuBtn) goToStartMenuBtn.onclick = loadStartMenu;
    if (logoutBtnSecondary) logoutBtnSecondary.onclick = handleLogout;
    if (toBaseParamsBtn) toBaseParamsBtn.onclick = toBaseParamsStep;
    if (startGameBtn) startGameBtn.onclick = startGame;
    if (backToMenuBtn) backToMenuBtn.onclick = loadStartMenu;
    if (backToDifficultyBtn) backToDifficultyBtn.onclick = openNewGameStep1;

    // Время
    const timePlayBtn = document.getElementById('timePlayBtn');
    const timePauseBtn = document.getElementById('timePauseBtn');
    const timeNextBtn = document.getElementById('timeNextBtn');

    if (timePlayBtn) timePlayBtn.onclick = setPlayMode;
    if (timePauseBtn) timePauseBtn.onclick = setPauseMode;
    if (timeNextBtn) timeNextBtn.onclick = nextPeriod;

    // Финансы
    const addLiabilityBtn = document.getElementById('addLiabilityBtn');
    const addAssetBtn = document.getElementById('addAssetBtn');

    if (addLiabilityBtn) addLiabilityBtn.onclick = addLiability;
    if (addAssetBtn) addAssetBtn.onclick = addAsset;

    // События
    const liabilitiesList = document.getElementById('liabilitiesList');
    const assetsList = document.getElementById('assetsList');
    const gameProfilesList = document.getElementById('gameProfilesList');

    if (liabilitiesList) liabilitiesList.addEventListener('click', handleDeleteClick);
    if (assetsList) assetsList.addEventListener('click', handleDeleteClick);
    if (gameProfilesList) gameProfilesList.addEventListener('click', handleProfilesClick);

    // Навигационные кнопки
    document.querySelectorAll('.nav-btn').forEach((btn) => {
        btn.addEventListener('click', () => showGameSection(btn.dataset.section));
    });
}

// ==================== ЭКСПОРТ ====================

window.loadFinanceOverview = loadFinanceOverview;
window.loadStartMenu = loadStartMenu;
window.openGameplay = openGameplay;
window.initTimeSystem = initTimeSystem;
window.stopTimeTicker = stopTimeTicker;
window.forceSyncAndRefresh = forceSyncAndRefresh;