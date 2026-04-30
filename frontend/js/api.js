// API запросы
let authToken = localStorage.getItem(APP_CONFIG.TOKEN_KEY);

function setAuthToken(token) {
    authToken = token;
    if (token) {
        localStorage.setItem(APP_CONFIG.TOKEN_KEY, token);
    } else {
        localStorage.removeItem(APP_CONFIG.TOKEN_KEY);
    }
}

async function apiCall(endpoint, method = 'GET', data = null) {
    const headers = {
        'Content-Type': 'application/json',
    };
    
    if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
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

// Специализированные API методы
const API = {
    // Auth
    register: (data) => apiCall('/api/register', 'POST', data),
    login: (data) => apiCall('/api/login', 'POST', data),
    getMe: () => apiCall('/api/user/me', 'GET'),
    
    // Messages
    sendMessage: (text) => apiCall('/api/messages', 'POST', { text }),
    getMessages: (limit = APP_CONFIG.MESSAGES_LIMIT) => apiCall(`/api/messages?limit=${limit}`, 'GET'),
    deleteMessage: (id) => apiCall(`/api/messages/${id}`, 'DELETE'),
    
    // Health
    health: () => apiCall('/api/health', 'GET')
};