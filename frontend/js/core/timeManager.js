// ==================== УПРАВЛЕНИЕ ВРЕМЕНЕМ И HUD ====================
let timeTicker = null;
let isTimeSyncInProgress = false;
let currentGameTime = {
    time_state: 'pause',
    period_index: 1,
    period_duration_seconds: 300,
    seconds_until_next_period: 300
};
let localRemainingSeconds = 0;
let lastServerSync = 0;

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function setHUDState(state, message = '') {
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

export function updateHUDDisplay() {
    const timerDisplay = document.getElementById('timerDisplay');
    const periodIndexSpan = document.getElementById('periodIndex');
    const stateIconSpan = document.getElementById('timeStateIcon');
    if (!timerDisplay) return;

    const remaining = currentGameTime.time_state === 'play'
        ? localRemainingSeconds
        : currentGameTime.seconds_until_next_period;
    timerDisplay.innerText = formatTime(Math.max(0, remaining));
    if (periodIndexSpan) periodIndexSpan.innerText = currentGameTime.period_index;
    if (stateIconSpan) {
        stateIconSpan.innerHTML = currentGameTime.time_state === 'play'
            ? '<i class="fas fa-play-circle"></i>'
            : '<i class="fas fa-pause-circle"></i>';
    }
    setHUDState(currentGameTime.time_state);
}

export async function fetchTimeStatus() {
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

export async function forceSyncAndRefresh() {
    const status = await fetchTimeStatus();
    if (status) {
        showNotification(`Период #${status.period_index}`, 'info');
        if (window.loadFinanceOverview) await window.loadFinanceOverview();
    }
    return status;
}

export async function setPlayMode() {
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

export async function setPauseMode() {
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

export async function nextPeriod() {
    if (isTimeSyncInProgress) return;
    setHUDState('syncing', '⏩ Переход к следующему периоду...');
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
        if (window.loadFinanceOverview) await window.loadFinanceOverview();
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

export function stopTimeTicker() {
    if (timeTicker) clearInterval(timeTicker);
    timeTicker = null;
}

export async function initTimeSystem() {
    const status = await fetchTimeStatus();
    if (status && status.time_state === 'play') startTimeTicker();
}