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

// Глобальные временные массивы для новых игр
window.tempAssets = window.tempAssets || [];
window.tempLiabilities = window.tempLiabilities || [];

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

    updateBalancesUI(overview);

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

async function updateBalancesUI(overview) {
    if (!overview) return;
    const balanceDiv = document.getElementById('balanceInfo');
    if (balanceDiv) {
        balanceDiv.innerHTML = `
            💳 Текущий баланс: <strong>${overview.cash_balance.toFixed(2)} ₽</strong><br>
            🛡️ Подушка безопасности: <strong>${overview.safety_fund_balance.toFixed(2)} ₽</strong><br>
            📉 Обязательные расходы в месяц: <strong>${overview.total_monthly_obligations.toFixed(2)} ₽</strong>
        `;
    }
    const periodSpan = document.getElementById('periodNumber');
    if (periodSpan) periodSpan.innerText = overview.period_index;
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
    if (window.completePeriod) await window.completePeriod();
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
    if (status && status.seconds_until_next_period > 0) startTimeTicker();
}

function stopTimeTicker() {
    if (timeTicker) clearInterval(timeTicker);
    timeTicker = null;
}

// ==================== ДЕЙСТВИЯ ПЕРИОДА ====================

async function handleClaimSalary() {
    const result = await API.claimSalary();
    if (result && result.status === 'success') {
        showNotification(result.message, 'success');
        await loadFinanceOverview();
    } else {
        showNotification('Не удалось получить зарплату', 'error');
    }
}

async function handleContribute() {
    const amountInput = document.getElementById('contributionAmount');
    const amount = parseFloat(amountInput.value);
    if (isNaN(amount) || amount <= 0) {
        showNotification('Введите корректную сумму для взноса', 'error');
        return;
    }
    const result = await API.contributeToSafetyFund({ amount });
    if (result && result.status === 'success') {
        showNotification(result.message, 'success');
        amountInput.value = '';
        await loadFinanceOverview();
    } else {
        showNotification('Ошибка при взносе', 'error');
    }
}

async function handleWithdraw() {
    const amountInput = document.getElementById('withdrawalAmount');
    const amount = parseFloat(amountInput.value);
    if (isNaN(amount) || amount <= 0) {
        showNotification('Введите корректную сумму для снятия', 'error');
        return;
    }
    const result = await API.withdrawFromSafetyFund({ amount });
    if (result && result.status === 'success') {
        showNotification(result.message, 'success');
        amountInput.value = '';
        await loadFinanceOverview();
    } else {
        showNotification('Ошибка при снятии', 'error');
    }
}

// ==================== УПРАВЛЕНИЕ АКТИВАМИ И ОБЯЗАТЕЛЬСТВАМИ (СТАРТОВЫЙ ЭКРАН) ====================

function renderAssetsList() {
    const container = document.getElementById('assetsListContainer');
    if (!container) return;
    const assets = window.tempAssets || [];
    container.innerHTML = '';
    assets.forEach((asset, idx) => {
        const div = document.createElement('div');
        div.className = 'asset-item';
        div.dataset.index = idx;
        div.innerHTML = `
            <span><strong>${escapeHtml(asset.title)}</strong> (${asset.asset_value.toFixed(0)} ₽ / обслуживание ${asset.monthly_maintenance_cost.toFixed(0)} ₽)</span>
            <div>
                <button class="icon-btn edit-asset" data-idx="${idx}">✏️</button>
                <button class="icon-btn danger delete-asset" data-idx="${idx}">🗑️</button>
            </div>
        `;
        container.appendChild(div);
    });
    const addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.className = 'btn-secondary';
    addBtn.textContent = '+ Добавить актив';
    addBtn.onclick = () => startAddAsset();
    container.appendChild(addBtn);
}

function startAddAsset() {
    const container = document.getElementById('assetsListContainer');
    const form = document.createElement('div');
    form.className = 'edit-form';
    form.innerHTML = `
        <input type="text" placeholder="Название" id="newAssetTitle">
        <input type="number" placeholder="Стоимость" id="newAssetValue">
        <input type="number" placeholder="Обслуживание" id="newAssetMaintenance">
        <button class="icon-btn" id="saveNewAsset">✅</button>
        <button class="icon-btn danger" id="cancelNewAsset">❌</button>
    `;
    container.appendChild(form);
    document.getElementById('saveNewAsset').onclick = () => {
        const title = document.getElementById('newAssetTitle').value.trim();
        const value = parseFloat(document.getElementById('newAssetValue').value);
        const maint = parseFloat(document.getElementById('newAssetMaintenance').value);
        if (title && !isNaN(value) && !isNaN(maint)) {
            window.tempAssets.push({ title, asset_value: value, monthly_maintenance_cost: maint });
            renderAssetsList();
        } else {
            showNotification('Заполните все поля', 'error');
        }
    };
    document.getElementById('cancelNewAsset').onclick = () => renderAssetsList();
}

function editAsset(index) {
    const asset = window.tempAssets[index];
    const container = document.getElementById('assetsListContainer');
    const div = container.querySelector(`.asset-item[data-index="${index}"]`);
    if (!div) return;
    div.style.display = 'none';
    const form = document.createElement('div');
    form.className = 'edit-form';
    form.innerHTML = `
        <input type="text" value="${escapeHtml(asset.title)}" id="editAssetTitle">
        <input type="number" value="${asset.asset_value}" id="editAssetValue">
        <input type="number" value="${asset.monthly_maintenance_cost}" id="editAssetMaintenance">
        <button class="icon-btn" id="updateAsset">✅</button>
        <button class="icon-btn danger" id="cancelEditAsset">❌</button>
    `;
    div.insertAdjacentElement('afterend', form);
    document.getElementById('updateAsset').onclick = () => {
        const newTitle = document.getElementById('editAssetTitle').value.trim();
        const newValue = parseFloat(document.getElementById('editAssetValue').value);
        const newMaint = parseFloat(document.getElementById('editAssetMaintenance').value);
        if (newTitle && !isNaN(newValue) && !isNaN(newMaint)) {
            window.tempAssets[index] = { title: newTitle, asset_value: newValue, monthly_maintenance_cost: newMaint };
            renderAssetsList();
        } else {
            showNotification('Некорректные данные', 'error');
        }
    };
    document.getElementById('cancelEditAsset').onclick = () => renderAssetsList();
}

function deleteAsset(index) {
    window.tempAssets.splice(index, 1);
    renderAssetsList();
}

function renderLiabilitiesList() {
    const container = document.getElementById('liabilitiesListContainer');
    if (!container) return;
    const liabilities = window.tempLiabilities || [];
    container.innerHTML = '';
    liabilities.forEach((item, idx) => {
        const div = document.createElement('div');
        div.className = 'liability-item';
        div.dataset.index = idx;
        div.innerHTML = `
            <span><strong>${escapeHtml(item.title)}</strong> (долг: ${item.total_debt.toFixed(0)} ₽, ${item.annual_rate_percent}%, платёж: ${item.monthly_payment.toFixed(0)} ₽)</span>
            <div>
                <button class="icon-btn edit-liability" data-idx="${idx}">✏️</button>
                <button class="icon-btn danger delete-liability" data-idx="${idx}">🗑️</button>
            </div>
        `;
        container.appendChild(div);
    });
    const addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.className = 'btn-secondary';
    addBtn.textContent = '+ Добавить обязательство';
    addBtn.onclick = () => startAddLiability();
    container.appendChild(addBtn);
}

function startAddLiability() {
    const container = document.getElementById('liabilitiesListContainer');
    const form = document.createElement('div');
    form.className = 'edit-form';
    form.innerHTML = `
        <input type="text" placeholder="Название" id="newLiabilityTitle">
        <input type="number" placeholder="Сумма долга" id="newLiabilityDebt">
        <input type="number" placeholder="Годовой %" id="newLiabilityRate">
        <input type="number" placeholder="Платёж в месяц" id="newLiabilityPayment">
        <button class="icon-btn" id="saveNewLiability">✅</button>
        <button class="icon-btn danger" id="cancelNewLiability">❌</button>
    `;
    container.appendChild(form);
    document.getElementById('saveNewLiability').onclick = () => {
        const title = document.getElementById('newLiabilityTitle').value.trim();
        const total_debt = parseFloat(document.getElementById('newLiabilityDebt').value);
        const annual_rate_percent = parseFloat(document.getElementById('newLiabilityRate').value);
        const monthly_payment = parseFloat(document.getElementById('newLiabilityPayment').value);
        if (title && !isNaN(total_debt) && !isNaN(annual_rate_percent) && !isNaN(monthly_payment)) {
            window.tempLiabilities.push({ title, total_debt, annual_rate_percent, monthly_payment });
            renderLiabilitiesList();
        } else {
            showNotification('Заполните все поля', 'error');
        }
    };
    document.getElementById('cancelNewLiability').onclick = () => renderLiabilitiesList();
}

function editLiability(index) {
    const liability = window.tempLiabilities[index];
    const container = document.getElementById('liabilitiesListContainer');
    const div = container.querySelector(`.liability-item[data-index="${index}"]`);
    if (!div) return;
    div.style.display = 'none';
    const form = document.createElement('div');
    form.className = 'edit-form';
    form.innerHTML = `
        <input type="text" value="${escapeHtml(liability.title)}" id="editLiabilityTitle">
        <input type="number" value="${liability.total_debt}" id="editLiabilityDebt">
        <input type="number" value="${liability.annual_rate_percent}" id="editLiabilityRate">
        <input type="number" value="${liability.monthly_payment}" id="editLiabilityPayment">
        <button class="icon-btn" id="updateLiability">✅</button>
        <button class="icon-btn danger" id="cancelEditLiability">❌</button>
    `;
    div.insertAdjacentElement('afterend', form);
    document.getElementById('updateLiability').onclick = () => {
        const newTitle = document.getElementById('editLiabilityTitle').value.trim();
        const newDebt = parseFloat(document.getElementById('editLiabilityDebt').value);
        const newRate = parseFloat(document.getElementById('editLiabilityRate').value);
        const newPayment = parseFloat(document.getElementById('editLiabilityPayment').value);
        if (newTitle && !isNaN(newDebt) && !isNaN(newRate) && !isNaN(newPayment)) {
            window.tempLiabilities[index] = { title: newTitle, total_debt: newDebt, annual_rate_percent: newRate, monthly_payment: newPayment };
            renderLiabilitiesList();
        } else {
            showNotification('Некорректные данные', 'error');
        }
    };
    document.getElementById('cancelEditLiability').onclick = () => renderLiabilitiesList();
}

function deleteLiability(index) {
    window.tempLiabilities.splice(index, 1);
    renderLiabilitiesList();
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
    if (status && status.time_state === 'play') startTimeTicker();
}

function openNewGameStep1() {
    window.tempAssets = [];
    window.tempLiabilities = [];
    renderAssetsList();
    renderLiabilitiesList();
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
    window.tempAssets = window.tempAssets || [];
    window.tempLiabilities = window.tempLiabilities || [];
    renderAssetsList();
    renderLiabilitiesList();
    showScreen('baseParamsScreen');
}

async function startGame() {
    const profile_name = document.getElementById('newProfileName').value.trim();
    const mode = document.getElementById('newGameMode').value;
    const period_duration_seconds = Number(document.getElementById('newPeriodDuration').value);
    const cash_balance = Number(document.getElementById('startCashBalance').value);
    const monthly_salary = Number(document.getElementById('startMonthlySalary').value);
    const assets = window.tempAssets || [];
    const liabilities = window.tempLiabilities || [];

    if (!profile_name || period_duration_seconds < 10) {
        showNotification('Заполните название и корректную длительность периода', 'error');
        return;
    }
    if (isNaN(cash_balance) || isNaN(monthly_salary)) {
        showNotification('Укажите корректный баланс и зарплату', 'error');
        return;
    }

    const result = await API.startNewGame({
        profile_name,
        mode,
        period_duration_seconds,
        cash_balance,
        monthly_salary,
        assets,
        liabilities
    });

    if (result) {
        showNotification(result.message, 'success');
        await openGameplay();
    } else {
        showNotification('Не удалось запустить игру', 'error');
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

    // Действия периода
    const claimBtn = document.getElementById('claimSalaryBtn');
    const contributeBtn = document.getElementById('contributeFundBtn');
    const withdrawBtn = document.getElementById('withdrawFundBtn');
    if (claimBtn) claimBtn.addEventListener('click', handleClaimSalary);
    if (contributeBtn) contributeBtn.addEventListener('click', handleContribute);
    if (withdrawBtn) withdrawBtn.addEventListener('click', handleWithdraw);

    // Делегирование для редактирования/удаления активов и обязательств на стартовом экране
    document.getElementById('assetsListContainer')?.addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;
        const idx = btn.dataset.idx;
        if (btn.classList.contains('edit-asset') && idx !== undefined) {
            editAsset(parseInt(idx));
        } else if (btn.classList.contains('delete-asset') && idx !== undefined) {
            deleteAsset(parseInt(idx));
        }
    });
    document.getElementById('liabilitiesListContainer')?.addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;
        const idx = btn.dataset.idx;
        if (btn.classList.contains('edit-liability') && idx !== undefined) {
            editLiability(parseInt(idx));
        } else if (btn.classList.contains('delete-liability') && idx !== undefined) {
            deleteLiability(parseInt(idx));
        }
    });
}

// ==================== ЭКСПОРТ ====================
window.loadFinanceOverview = loadFinanceOverview;
window.loadStartMenu = loadStartMenu;
window.openGameplay = openGameplay;
window.initTimeSystem = initTimeSystem;
window.stopTimeTicker = stopTimeTicker;
window.forceSyncAndRefresh = forceSyncAndRefresh;
window.updateBalancesUI = updateBalancesUI;
window.setupFinanceHandlers = setupFinanceHandlers;