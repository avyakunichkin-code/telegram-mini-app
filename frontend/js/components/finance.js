async function loadFinanceOverview() {
    const scoreBoard = document.getElementById('scoreBoard');
    const liabilitiesList = document.getElementById('liabilitiesList');
    const assetsList = document.getElementById('assetsList');

    showLoading(scoreBoard);
    await loadGameProfiles();
    const overview = await API.getOverview();
    if (!overview) {
        scoreBoard.innerHTML = '❌ Не удалось загрузить финансовые данные';
        scoreBoard.classList.add('status-error');
        return;
    }

    document.getElementById('salaryAmount').value = overview.salary.monthly_amount || '';
    document.getElementById('salaryReceiptsCount').value = overview.salary.monthly_receipts_count || 1;
    document.getElementById('periodDurationSeconds').value = overview.period_duration_seconds;

    scoreBoard.innerHTML = `
        <strong>Уровень:</strong> ${overview.gamification_level}<br>
        <strong>Очки:</strong> ${overview.score}/100<br>
        <strong>Период:</strong> #${overview.period_index} (${overview.time_state})<br>
        <strong>До следующего периода:</strong> ${overview.seconds_until_next_period} сек<br>
        <strong>Доход:</strong> ${overview.total_monthly_income.toFixed(2)}<br>
        <strong>Платежи по обязательствам:</strong> ${overview.total_monthly_liabilities_payment.toFixed(2)}<br>
        <strong>Обслуживание активов:</strong> ${overview.total_monthly_assets_maintenance.toFixed(2)}<br>
        <strong>Чистый денежный поток:</strong> ${overview.net_monthly_cashflow.toFixed(2)}<br>
        <strong>Долговая нагрузка:</strong> ${overview.liabilities_to_income_ratio.toFixed(2)}%<br>
        <strong>XP до следующего уровня:</strong> ${overview.xp_to_next_level}
    `;
    scoreBoard.classList.add('status-success');

    renderLiabilities(overview.liabilities, liabilitiesList);
    renderAssets(overview.assets, assetsList);
    await loadTimeStatus();
}

async function loadGameProfiles() {
    const container = document.getElementById('gameProfilesList');
    const profiles = await API.getGameProfiles();
    if (!profiles || !Array.isArray(profiles)) {
        container.innerHTML = '❌ Не удалось загрузить профили';
        return;
    }
    if (!profiles.length) {
        container.innerHTML = 'Пока нет профилей. Создай первый профиль и начни игру.';
        return;
    }
    container.innerHTML = '';
    profiles.forEach((profile) => {
        const row = document.createElement('div');
        row.className = 'message-item';
        row.innerHTML = `
            <div class="message-text"><strong>${escapeHtml(profile.name)}</strong> (${profile.mode})</div>
            <div class="message-time">Лига: ${profile.league}, уровень: ${profile.level}, XP: ${profile.xp}, streak: ${profile.streak}</div>
            <button class="btn-secondary" data-activate-profile="${profile.id}" ${profile.is_active ? 'disabled' : ''}>
                ${profile.is_active ? '✅ Активный' : 'Сделать активным'}
            </button>
        `;
        container.appendChild(row);
    });
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

async function saveSalary() {
    const monthly_amount = Number(document.getElementById('salaryAmount').value);
    const monthly_receipts_count = Number(document.getElementById('salaryReceiptsCount').value);
    if (Number.isNaN(monthly_amount) || Number.isNaN(monthly_receipts_count) || monthly_receipts_count <= 0) {
        showNotification('Введите корректные данные дохода', 'error');
        return;
    }
    const result = await API.upsertSalary({ monthly_amount, monthly_receipts_count });
    if (!result) {
        showNotification('Не удалось сохранить доход', 'error');
        return;
    }
    showNotification('Доход обновлён', 'success');
    await loadFinanceOverview();
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

async function createGameProfile() {
    const name = document.getElementById('gameProfileName').value.trim();
    const mode = document.getElementById('gameProfileMode').value;
    if (!name) {
        showNotification('Введите название профиля', 'error');
        return;
    }
    const result = await API.createGameProfile({ name, mode });
    if (!result) {
        showNotification('Не удалось создать профиль', 'error');
        return;
    }
    document.getElementById('gameProfileName').value = '';
    showNotification('Профиль создан', 'success');
    await loadFinanceOverview();
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
    showNotification('Профиль переключен', 'success');
    await loadFinanceOverview();
}

async function loadTimeStatus() {
    const container = document.getElementById('timeStatus');
    const status = await API.getTimeStatus();
    if (!status) {
        container.innerHTML = '❌ Не удалось загрузить статус времени';
        return;
    }
    container.innerHTML = `
        <strong>Состояние:</strong> ${status.time_state}<br>
        <strong>Текущий период:</strong> #${status.period_index}<br>
        <strong>Длительность периода:</strong> ${status.period_duration_seconds} сек<br>
        <strong>До следующего периода:</strong> ${status.seconds_until_next_period} сек
    `;
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
    const value = Number(document.getElementById('periodDurationSeconds').value);
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
    await loadFinanceOverview();
}

function setupFinanceHandlers() {
    document.getElementById('saveSalaryBtn').onclick = saveSalary;
    document.getElementById('addLiabilityBtn').onclick = addLiability;
    document.getElementById('addAssetBtn').onclick = addAsset;
    document.getElementById('createGameProfileBtn').onclick = createGameProfile;
    document.getElementById('timePlayBtn').onclick = setPlayMode;
    document.getElementById('timePauseBtn').onclick = setPauseMode;
    document.getElementById('timeNextBtn').onclick = nextPeriod;
    document.getElementById('applyTimeConfigBtn').onclick = applyTimeConfig;
    document.getElementById('liabilitiesList').addEventListener('click', handleDeleteClick);
    document.getElementById('assetsList').addEventListener('click', handleDeleteClick);
    document.getElementById('gameProfilesList').addEventListener('click', handleProfilesClick);
}

window.loadFinanceOverview = loadFinanceOverview;
