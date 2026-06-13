import api from './api.js';

const auth = {
    async login(identifier, password) {
        const res = await api.auth.login(identifier, password);
        localStorage.setItem('user', JSON.stringify(res.user));
        return res.user;
    },

    async register(data) {
        const res = await api.auth.register(data);
        localStorage.setItem('user', JSON.stringify(res.user));
        return res.user;
    },

    async logout() {
        await api.auth.logout();
        localStorage.removeItem('user');
        window.location.href = '/login.html';
    },

    async me() {
        try {
            const res = await api.auth.me();
            localStorage.setItem('user', JSON.stringify(res.user));
            return res.user;
        } catch {
            localStorage.removeItem('user');
            return null;
        }
    }
};

export default auth;
