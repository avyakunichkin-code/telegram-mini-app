let authToken = localStorage.getItem(APP_CONFIG.TOKEN_KEY);

function setAuthToken(token) {
    authToken = token;
    if (token) {
        localStorage.setItem(APP_CONFIG.TOKEN_KEY, token);
        console.log('Token saved to localStorage and variable');  // ← отладка
    } else {
        localStorage.removeItem(APP_CONFIG.TOKEN_KEY);
        console.log('Token removed');
    }
}

async function apiCall(endpoint, method = 'GET', data = null) {
    const headers = {
        'Content-Type': 'application/json',
    };

    const token = authToken || localStorage.getItem(APP_CONFIG.TOKEN_KEY);

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        console.log(`🔑 Sending request to ${endpoint} with token`);  // ← отладка
    } else {
        console.log(`🔓 No token for ${endpoint}`);
    }

    const options = {
        method: method,
        headers: headers,
    };

    if (data && (method === 'POST' || method === 'PUT')) {
        options.body = JSON.stringify(data);
    }

    try {
        const response = await fetch(`${APP_CONFIG.API_URL}${endpoint}`, options);

        if (response.status === 401) {
            setAuthToken(null);
            if (window.showLogin) window.showLogin();
            return null;
        }
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error(`API error (${endpoint}):`, error);
        return null;
    }
}

const API = {
    register(payload) {
        return apiCall('/api/register', 'POST', payload);
    },
    login(payload) {
        return apiCall('/api/login', 'POST', payload);
    },
    getGameProfiles() {
        return apiCall('/api/game/profiles');
    },
    createGameProfile(payload) {
        return apiCall('/api/game/profiles', 'POST', payload);
    },
    startNewGame(payload) {
        return apiCall('/api/game/start', 'POST', payload);
    },
    activateGameProfile(id) {
        return apiCall(`/api/game/profiles/${id}/activate`, 'POST');
    },
    getTimeStatus() {
        return apiCall('/api/game/time');
    },
    setTimePlay() {
        return apiCall('/api/game/time/play', 'POST');
    },
    setTimePause() {
        return apiCall('/api/game/time/pause', 'POST');
    },
    setTimeNext() {
        return apiCall('/api/game/time/next', 'POST');
    },
    setTimeConfig(payload) {
        return apiCall('/api/game/time/config', 'PUT', payload);
    },
    getMe() {
        return apiCall('/api/user/me');
    },
    upsertSalary(payload) {
        return apiCall('/api/finance/salary', 'PUT', payload);
    },
    getOverview() {
        return apiCall('/api/finance/overview');
    },
    addLiability(payload) {
        return apiCall('/api/finance/liabilities', 'POST', payload);
    },
    deleteLiability(id) {
        return apiCall(`/api/finance/liabilities/${id}`, 'DELETE');
    },
    addAsset(payload) {
        return apiCall('/api/finance/assets', 'POST', payload);
    },
    deleteAsset(id) {
        return apiCall(`/api/finance/assets/${id}`, 'DELETE');
    },
    getPeriodStatus() {
        return apiCall('/api/game/period/status');
    },
    claimSalary() {
        return apiCall('/api/game/period/claim-salary', 'POST');
    },
    contributeToSafetyFund(payload) {
        return apiCall('/api/game/period/contribute-to-safety-fund', 'POST', payload);
    },
    completePeriod() {
        return apiCall('/api/game/period/complete-period', 'POST');
    }
};