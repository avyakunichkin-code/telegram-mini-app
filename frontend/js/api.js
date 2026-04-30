// frontend/js/api.js

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
    
    // Токен берём из переменной, которая обновляется через setAuthToken
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
        console.log(`📡 ${endpoint} - Status: ${response.status}`);  // ← отладка
        
        if (response.status === 401) {
            console.log('🔴 401 Unauthorized, clearing token');
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