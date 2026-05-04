// ==================== АКТИВЫ И ОБЯЗАТЕЛЬСТВА (СТАРТОВЫЙ ЭКРАН) ====================
window.tempAssets = window.tempAssets || [];
window.tempLiabilities = window.tempLiabilities || [];

export function renderAssetsList() {
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

export function startAddAsset() {
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

export function editAsset(index) {
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

export function deleteAsset(index) {
    window.tempAssets.splice(index, 1);
    renderAssetsList();
}

export function renderLiabilitiesList() {
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

export function startAddLiability() {
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

export function editLiability(index) {
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

export function deleteLiability(index) {
    window.tempLiabilities.splice(index, 1);
    renderLiabilitiesList();
}

export function resetStartupAssets() {
    window.tempAssets = [];
    window.tempLiabilities = [];
    renderAssetsList();
    renderLiabilitiesList();
}

export function collectStartupAssets() {
    return { assets: window.tempAssets, liabilities: window.tempLiabilities };
}