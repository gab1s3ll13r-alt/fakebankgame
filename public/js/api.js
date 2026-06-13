/**
 * public/js/api.js
 * Client API centralisé (compatible express-session cookie auth)
 */

const API_BASE = '/api';

async function request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;

    const config = {
        method: options.method || 'GET',
        headers: {
            'Content-Type': 'application/json',
            ...(options.headers || {})
        },
        credentials: 'include', // 🔥 IMPORTANT (sessions backend)
    };

    if (options.body) {
        config.body = options.body;
    }

    const res = await fetch(url, config);

    let data;
    try {
        data = await res.json();
    } catch {
        throw { error: 'Réponse invalide du serveur' };
    }

    if (!res.ok) {
        throw data;
    }

    return data;
}

const api = {
    request,

    auth: {
        login: (identifier, password) =>
            request('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ identifier, password })
            }),

        register: (data) =>
            request('/auth/register', {
                method: 'POST',
                body: JSON.stringify(data)
            }),

        logout: () =>
            request('/auth/logout', { method: 'POST' }),

        me: () =>
            request('/auth/me')
    },

    users: {
        search: (q) =>
            request(`/users/search?q=${encodeURIComponent(q)}`),

        lookup: (iban) =>
            request(`/users/lookup?iban=${encodeURIComponent(iban)}`)
    },

    transactions: {
        transfer: (recipientId, amount, description) =>
            request('/transactions/transfer', {
                method: 'POST',
                body: JSON.stringify({ recipientId, amount, description })
            }),

        history: (page = 1, limit = 20) =>
            request(`/transactions/history?page=${page}&limit=${limit}`),

        get: (id) =>
            request(`/transactions/${id}`),

        summary: (days = 14) =>
            request(`/transactions/summary?days=${days}`)
    },

    tpe: {
        requestPayment: (amount, label, description) =>
            request('/tpe/request', {
                method: 'POST',
                body: JSON.stringify({ amount, label, description })
            }),

        getPayment: (uuid) =>
            request(`/tpe/pay/${uuid}`),

        pay: (uuid) =>
            request(`/tpe/pay/${uuid}`, { method: 'POST' }),

        cancel: (uuid) =>
            request(`/tpe/cancel/${uuid}`, { method: 'POST' }),

        history: (page = 1) =>
            request(`/tpe/history?page=${page}`),

        pending: () =>
            request('/tpe/pending')
    },

    account: {
        notifications: () =>
            request('/account/notifications'),

        read: (id) =>
            request(`/account/notifications/${id}/read`, { method: 'POST' }),

        readAll: () =>
            request('/account/notifications/read-all', { method: 'POST' })
    },

    admin: {
        stats: () =>
            request('/admin/stats')
    }
};

export default api;
