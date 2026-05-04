// frontend/js/components/periodActions.js

export async function handleClaimSalary() {
    const result = await API.claimSalary();
    if (result && result.status === 'success') {
        showNotification(result.message, 'success');
        if (window.loadFinanceOverview) await window.loadFinanceOverview();
    } else {
        showNotification('Не удалось получить зарплату', 'error');
    }
}

export async function handleContribute() {
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
        if (window.loadFinanceOverview) await window.loadFinanceOverview();
    } else {
        showNotification('Ошибка при взносе', 'error');
    }
}

export async function handleWithdraw() {
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
        if (window.loadFinanceOverview) await window.loadFinanceOverview();
    } else {
        showNotification('Ошибка при снятии', 'error');
    }
}