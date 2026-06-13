/**
 * public/js/api.js
 * Interface API centralisée. 
 * STRICTEMENT ADAPTÉE AUX ENDPOINTS RÉELS FOURNIS.
 */

const API_BASE = '/api';

const api = {
    async request(endpoint, options = {}) {
        const url = `${API_BASE}${endpoint}`;
        const config = {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw data || { error: 'Une erreur est survenue' };
            }
            return data;
        } catch (error) {
            console.error(`API Error [${endpoint}]:`, error);
            throw error;
        }
    },

    // ---------------------------------------------------------
    // Users
    // ---------------------------------------------------------
    users: {
        search: (q) => api.request(`/users/search?q=${encodeURIComponent(q)}`, { method: 'GET' }),
        lookup: (iban) => api.request(`/users/lookup?iban=${encodeURIComponent(iban)}`, { method: 'GET' })
    },

    // ---------------------------------------------------------
    // Transactions
    // ---------------------------------------------------------
    transactions: {
        transfer: (data) => api.request('/transactions/transfer', { method: 'POST', body: JSON.stringify(data) }),
        history: () => api.request('/transactions/history', { method: 'GET' }),
        get: (id) => api.request(`/transactions/${id}`, { method: 'GET' }),
        summary: () => api.request('/transactions/summary', { method: 'GET' })
    },

    // ---------------------------------------------------------
    // TPE
    // ---------------------------------------------------------
    tpe: {
        request: (data) => api.request('/tpe/request', { method: 'POST', body: JSON.stringify(data) }),
        getPayment: (uuid) => api.request(`/tpe/pay/${uuid}`, { method: 'GET' }),
        pay: (uuid, data) => api.request(`/tpe/pay/${uuid}`, { method: 'POST', body: JSON.stringify(data) }),
        cancel: (uuid) => api.request(`/tpe/cancel/${uuid}`, { method: 'POST' }),
        history: () => api.request('/tpe/history', { method: 'GET' }),
        pending: () => api.request('/tpe/pending', { method: 'GET' })
    },

    // ---------------------------------------------------------
    // Auth
    // ---------------------------------------------------------
    auth: {
        login: (credentials) => api.request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
        register: (userData) => api.request('/auth/register', { method: 'POST', body: JSON.stringify(userData) }),
        logout: () => api.request('/auth/logout', { method: 'POST' }),
        me: () => api.request('/auth/me', { method: 'GET' })
    }
};

export default api;
