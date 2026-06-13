/**
 * public/js/auth.js
 * Gestion de l'authentification côté client.
 * Compatible avec les endpoints /api/auth/*
 */

import api from './api.js';

const STORAGE_KEY = 'bank_user';

const auth = {
    /**
     * Connexion utilisateur
     * POST /api/auth/login
     */
    async login(username, password) {
        const data = await api.auth.login({ username, password });

        // Sauvegarde session côté frontend
        if (data && data.user) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data.user));
        }

        return data;
    },

    /**
     * Inscription utilisateur
     * POST /api/auth/register
     */
    async register(userData) {
        return await api.auth.register(userData);
    },

    /**
     * Déconnexion utilisateur
     * POST /api/auth/logout
     */
    async logout() {
        try {
            await api.auth.logout();
        } finally {
            localStorage.removeItem(STORAGE_KEY);
            window.location.href = '/login.html';
        }
    },

    /**
     * Récupère l'utilisateur connecté depuis le backend
     * GET /api/auth/me
     */
    async getMe() {
        try {
            const data = await api.auth.me();

            // Synchronise localStorage avec backend
            if (data) {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
            }

            return data;
        } catch (error) {
            localStorage.removeItem(STORAGE_KEY);
            return null;
        }
    },

    /**
     * Récupère l'utilisateur depuis localStorage (rapide, non fiable)
     */
    getLocalUser() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY));
        } catch {
            return null;
        }
    },

    /**
     * Vérifie si l'utilisateur est connecté (côté frontend uniquement)
     */
    isAuthenticated() {
        return !!localStorage.getItem(STORAGE_KEY);
    }
};

export default auth;
