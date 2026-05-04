// ==================== ОСНОВНОЙ МОДУЛЬ FINANCE (управление экранами, загрузка данных) ====================
import { initTimeSystem, stopTimeTicker, setPlayMode, setPauseMode, nextPeriod } from './core/timeManager.js';
import { handleClaimSalary, handleContribute, handleWithdraw } from './components/periodActions.js';
import { resetStartupAssets, collectStartupAssets } from './components/startupAssets.js';
import { loadPeriodStatus } from './components/periodStatus.js';

// Глобальное состояние новой игры
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

export async function loadFinanceOverview() {
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

    // Обновляем балансы (HUD)
    document.getElementById('cashBalance').innerText = overview.cash_balance.toFixed(2) + ' ₽';
    document.getElementById('safetyFundBalance').innerText = overview.safety_fund_balance.toFixed(2) + ' ₽';
    document.getElementById('netCashflow').innerText = overview.net_monthly_cashflow.toFixed(2) + ' ₽';
    document.getElementById('periodIndex').innerText = overview.period_index;

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

    // Отображение списков обязательств и активов (игровой экран)
    if (liabilitiesList) {
        if (overview.liabilities.length === 0) liabilitiesList.innerHTML = 'Нет обязательств';
        else {
            liabilitiesList.innerHTML = '';
            overview.liabilities.forEach(item => {
                const row = document.createElement('div');
                row.className = 'message-item';
                row.innerHTML = `
                    <div class="message-text"><strong>${escapeHtml(item.title)}</strong></div>
                    <div class="message-time">Долг: ${item.total_debt.toFixed(2)} | ${item.annual_rate_percent.toFixed(2)}% | Платёж: ${item.monthly_payment.toFixed(2)}</div>
                    <button class="btn-secondary" data-delete-liability="${item.id}">Удалить</button>
                `;
                liabilitiesList.appendChild(row);
            });
        }
    }
    if (assetsList) {
        if (overview.assets.length === 0) assetsList.innerHTML = 'Нет активов';
        else {
            assetsList.innerHTML = '';
            overview.assets.forEach(item => {
                const row = document.createElement('div');
                row.className = 'message-item';
                row.innerHTML = `
                    <div class="message-text"><strong>${escapeHtml(item.title)}</strong></div>
                    <div class="message-time">Стоимость: ${item.asset_value.toFixed(2)} | Обслуживание: ${item.monthly_maintenance_cost.toFixed(2)}</div>
                    <button class="btn-secondary" data-delete-asset="${item.id}">Удалить</button>
                `;
                assetsList.appendChild(row);
            });
        }
    }
    if (safetyFundSpan && overview.safety_fund_total !== undefined) {
        safetyFundSpan.innerText = overview.safety_fund_total.toFixed(2);
    }

    // Загружаем статус периода (если функция определена)
    if (window.loadPeriodStatus) await loadPeriodStatus();
}

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

function openNewGameStep1() {
    resetStartupAssets();
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
    const profile_name = document.getElementById('newProfileName').value.trim();
    const mode = document.getElementById('newGameMode').value;
    const period_duration_seconds = Number(document.getElementById('newPeriodDuration').value);
    const cash_balance = Number(document.getElementById('startCashBalance').value);
    const monthly_salary = Number(document.getElementById('startMonthlySalary').value);
    const { assets, liabilities } = collectStartupAssets();

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

export function setupFinanceHandlers() {
    // Навигация
    document.getElementById('newGameBtn').onclick = openNewGameStep1;
    document.getElementById('loadGameBtn').onclick = loadStartMenu;
    document.getElementById('goToStartMenuBtn').onclick = loadStartMenu;
    document.getElementById('logoutBtnSecondary').onclick = handleLogout;
    document.getElementById('toBaseParamsBtn').onclick = toBaseParamsStep;
    document.getElementById('startGameBtn').onclick = startGame;
    document.getElementById('backToMenuBtn').onclick = loadStartMenu;
    document.getElementById('backToDifficultyBtn').onclick = openNewGameStep1;

    // Время
    document.getElementById('timePlayBtn').onclick = setPlayMode;
    document.getElementById('timePauseBtn').onclick = setPauseMode;
    document.getElementById('timeNextBtn').onclick = nextPeriod;

    // Действия периода
    document.getElementById('claimSalaryBtn').onclick = handleClaimSalary;
    document.getElementById('contributeFundBtn').onclick = handleContribute;
    document.getElementById('withdrawFundBtn').onclick = handleWithdraw;

    // Удаление активов/обязательств на игровом экране
    document.getElementById('liabilitiesList')?.addEventListener('click', handleDeleteClick);
    document.getElementById('assetsList')?.addEventListener('click', handleDeleteClick);
    document.getElementById('gameProfilesList')?.addEventListener('click', handleProfilesClick);

    // Навигационные кнопки
    document.querySelectorAll('.nav-btn').forEach((btn) => {
        btn.addEventListener('click', () => showGameSection(btn.dataset.section));
    });
}

// Экспортируем глобально для использования в других модулях (например, periodActions)
window.loadFinanceOverview = loadFinanceOverview;
window.loadStartMenu = loadStartMenu;
window.openGameplay = openGameplay;
window.setupFinanceHandlers = setupFinanceHandlers;