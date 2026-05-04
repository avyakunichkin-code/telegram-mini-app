// ==================== ДЕЙСТВИЯ ПЕРИОДА ====================

let currentPeriodStatus = null;

async function loadPeriodStatus() {
    const periodActionsDiv = document.getElementById('periodActions');
    if (!periodActionsDiv) return;

    periodActionsDiv.innerHTML = '<div class="loading"></div> Загрузка...';

    const status = await API.getPeriodStatus();

    if (!status) {
        periodActionsDiv.innerHTML = '❌ Не удалось загрузить статус периода';
        return;
    }

    currentPeriodStatus = status;

    periodActionsDiv.innerHTML = `
        <div class="period-stats">
            <div class="period-stats-item">
                <span class="period-stats-label">📅 Период:</span>
                <span class="period-stats-value">#${status.period_index}</span>
            </div>
            <div class="period-stats-item ${status.salary_claimed ? 'completed' : 'pending'}">
                <span class="period-stats-label">💰 Зарплата:</span>
                <span class="period-stats-value">
                    ${status.salary_claimed ? '✅ Получена' : '⏳ Ожидает получения'}
                </span>
            </div>
        </div>
    `;

    // Обновляем кнопки в зависимости от состояния
    updatePeriodButtons(status);
}

function updatePeriodButtons(status) {
    const claimSalaryBtn = document.getElementById('claimSalaryBtn');
    const contributeFundBtn = document.getElementById('contributeFundBtn');

    if (claimSalaryBtn) {
        claimSalaryBtn.disabled = !status.can_claim_salary;
        claimSalaryBtn.title = status.can_claim_salary ? 'Получить зарплату' : 'Зарплата уже получена в этом периоде';
    }

    if (contributeFundBtn) {
        contributeFundBtn.disabled = false;
    }

    // Отображаем доступный доход
    const netIncomeSpan = document.getElementById('netIncomeAvailable');
    if (netIncomeSpan) {
        netIncomeSpan.innerText = status.net_income_available.toFixed(2);
    }

    // Отображаем подушку безопасности
    const safetyFundSpan = document.getElementById('safetyFundTotal');
    if (safetyFundSpan) {
        safetyFundSpan.innerText = status.safety_fund_total.toFixed(2);
    }
}

async function claimSalary() {
    const result = await API.claimSalary();
    if (result) {
        showNotification(result.message, 'success');
        await loadPeriodStatus();
        await loadFinanceOverview();
    } else {
        showNotification('Не удалось получить зарплату', 'error');
    }
}

async function contributeToSafetyFund() {
    const amountInput = document.getElementById('contributionAmount');
    const amount = parseFloat(amountInput.value);

    if (isNaN(amount) || amount <= 0) {
        showNotification('Введите корректную сумму', 'error');
        return;
    }

    if (currentPeriodStatus && amount > currentPeriodStatus.net_income_available) {
        showNotification(`Недостаточно средств. Доступно: ${currentPeriodStatus.net_income_available.toFixed(2)} ₽`, 'error');
        return;
    }

    const result = await API.contributeToSafetyFund({ amount });

    if (result) {
        amountInput.value = '';
        showNotification(result.message, 'success');
        await loadPeriodStatus();
        await loadFinanceOverview();
    } else {
        showNotification('Не удалось отложить средства', 'error');
    }
}

// ==================== ОБНОВЛЕНИЕ HUD ====================

function updateHUDWithPeriodInfo(overview, periodStatus) {
    const hudInfo = document.getElementById('hudInfo');
    if (!hudInfo) return;

    const remaining = overview.seconds_until_next_period;
    const requiredDone = periodStatus?.required_actions_completed || false;

    hudInfo.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
                <strong>📅 Период:</strong> #${overview.period_index}
                ${requiredDone ? '✅' : '⏳'}
            </div>
            <div style="font-size: 24px; font-weight: bold; font-family: monospace;">
                ${formatTime(Math.max(0, remaining))}
            </div>
        </div>
        <div style="display: flex; justify-content: space-between; margin-top: 8px;">
            <div>💰 Зарплата: ${periodStatus?.salary_claimed ? '✅' : '⬜'}</div>
            <div>💼 Подушка: ${periodStatus?.safety_fund_total?.toFixed(0) || 0} ₽</div>
        </div>
    `;
}

// ========== ОБРАБОТЧИКИ ДЕЙСТВИЙ ПЕРИОДА ==========
async function handleClaimSalary() {
    const result = await API.claimSalary();
    if (result && result.status === 'success') {
        showNotification(result.message, 'success');
        await loadFinanceOverview();  // обновит балансы и UI
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


// ==================== ЭКСПОРТ ====================

window.loadPeriodStatus = loadPeriodStatus;
window.claimSalary = claimSalary;
window.contributeToSafetyFund = contributeToSafetyFund;