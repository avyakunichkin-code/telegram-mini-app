// frontend/js/components/periodStatus.js

let currentPeriodStatus = null;

export async function loadPeriodStatus() {
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

    const netIncomeSpan = document.getElementById('netIncomeAvailable');
    if (netIncomeSpan) {
        netIncomeSpan.innerText = status.net_income_available.toFixed(2);
    }
    const safetyFundSpan = document.getElementById('safetyFundTotal');
    if (safetyFundSpan) {
        safetyFundSpan.innerText = status.safety_fund_total.toFixed(2);
    }
}