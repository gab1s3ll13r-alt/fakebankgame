// ============================================================
// public/js/api.js
// Module central de communication avec l'API backend.
// Toutes les pages JS importent ce fichier via <script>.
// Expose un objet global window.API avec toutes les methodes.
// ============================================================

(function () {
  'use strict';

  // ----------------------------------------------------------
  // Utilitaires internes
  // ----------------------------------------------------------

  /**
   * Construit une query string a partir d'un objet de parametres.
   * Ignore les valeurs null/undefined/vide.
   *
   * @param {object} params
   * @returns {string} "?key=value&key2=value2" ou ""
   */
  function buildQuery(params) {
    if (!params || typeof params !== 'object') return '';
    const entries = Object.entries(params).filter(
      ([, v]) => v !== null && v !== undefined && v !== ''
    );
    if (entries.length === 0) return '';
    return '?' + entries.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&');
  }

  /**
   * Wrapper fetch central.
   * - Envoie/recoit du JSON.
   * - Detecte les erreurs 401 -> redirect login.
   * - Retourne toujours { data, error, status }.
   *
   * @param {string} method - GET | POST | PUT | DELETE
   * @param {string} url
   * @param {object|null} body
   * @returns {Promise<{data: any, error: string|null, status: number}>}
   */
  async function request(method, url, body = null) {
    const options = {
      method,
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
    };

    if (body !== null && method !== 'GET') {
      options.body = JSON.stringify(body);
    }

    let response;
    try {
      response = await fetch(url, options);
    } catch (networkError) {
      return {
        data: null,
        error: 'Erreur reseau : impossible de joindre le serveur.',
        status: 0,
      };
    }

    // Redirect automatique si session expiree ou non connecte,
    // sauf si on est deja sur une page d'auth (evite les boucles)
    if (response.status === 401) {
      const currentPage = window.location.pathname;
      const authPages = ['/login.html', '/register.html', '/index.html', '/'];
      if (!authPages.some((p) => currentPage.endsWith(p))) {
        const redirect = encodeURIComponent(window.location.pathname + window.location.search);
        window.location.href = `/login.html?redirect=${redirect}`;
        return { data: null, error: 'Session expiree.', status: 401 };
      }
    }

    let data = null;
    try {
      data = await response.json();
    } catch {
      data = null;
    }

    if (!response.ok) {
      const errorMsg =
        (data && data.error) ||
        (data && data.message) ||
        `Erreur ${response.status}`;
      return { data: null, error: errorMsg, status: response.status };
    }

    return { data, error: null, status: response.status };
  }

  // ----------------------------------------------------------
  // Namespace public
  // ----------------------------------------------------------
  const API = {};

  // ----------------------------------------------------------
  // Authentification
  // ----------------------------------------------------------
  API.auth = {
    me() {
      return request('GET', '/api/auth/me');
    },
    login(identifier, password) {
      return request('POST', '/api/auth/login', { identifier, password });
    },
    register(data) {
      return request('POST', '/api/auth/register', data);
    },
    logout() {
      return request('POST', '/api/auth/logout');
    },
    changePassword(currentPassword, newPassword, confirmNewPassword) {
      return request('POST', '/api/auth/change-password', {
        currentPassword,
        newPassword,
        confirmNewPassword,
      });
    },
  };

  // ----------------------------------------------------------
  // Compte bancaire
  // ----------------------------------------------------------
  API.account = {
    get() {
      return request('GET', '/api/account');
    },
    getBalance() {
      return request('GET', '/api/account/balance');
    },
    getProfile() {
      return request('GET', '/api/account/profile');
    },
    updateProfile(data) {
      return request('PUT', '/api/account/profile', data);
    },
    getNotifications(params) {
      return request('GET', `/api/account/notifications${buildQuery(params)}`);
    },
    markNotificationRead(id) {
      return request('POST', `/api/account/notifications/${id}/read`);
    },
    markAllRead() {
      return request('POST', '/api/account/notifications/read-all');
    },
  };

  // ----------------------------------------------------------
  // Transactions
  // ----------------------------------------------------------
  API.transactions = {
    transfer(data) {
      return request('POST', '/api/transactions/transfer', data);
    },
    getHistory(params) {
      return request('GET', `/api/transactions/history${buildQuery(params)}`);
    },
    getSummary(days) {
      return request('GET', `/api/transactions/summary${buildQuery({ days })}`);
    },
    getById(id) {
      return request('GET', `/api/transactions/${id}`);
    },
  };

  // ----------------------------------------------------------
  // Recherche d'utilisateurs
  // ----------------------------------------------------------
  API.users = {
    search(q) {
      return request('GET', `/api/users/search${buildQuery({ q })}`);
    },
    lookup(iban) {
      return request('GET', `/api/users/lookup${buildQuery({ iban })}`);
    },
  };

  // ----------------------------------------------------------
  // TPE
  // ----------------------------------------------------------
  API.tpe = {
    request(data) {
      return request('POST', '/api/tpe/request', data);
    },
    getPayment(qrCodeUuid) {
      return request('GET', `/api/tpe/pay/${qrCodeUuid}`);
    },
    pay(qrCodeUuid) {
      return request('POST', `/api/tpe/pay/${qrCodeUuid}`);
    },
    cancel(qrCodeUuid) {
      return request('POST', `/api/tpe/cancel/${qrCodeUuid}`);
    },
    getHistory(params) {
      return request('GET', `/api/tpe/history${buildQuery(params)}`);
    },
    getPending() {
      return request('GET', '/api/tpe/pending');
    },
  };

  // ----------------------------------------------------------
  // Employe de banque
  // ----------------------------------------------------------
  API.employee = {
    getAccounts(params) {
      return request('GET', `/api/employee/accounts${buildQuery(params)}`);
    },
    getAccount(userId) {
      return request('GET', `/api/employee/accounts/${userId}`);
    },
    getTransactions(userId, params) {
      return request('GET', `/api/employee/accounts/${userId}/transactions${buildQuery(params)}`);
    },
    credit(userId, data) {
      return request('POST', `/api/employee/accounts/${userId}/credit`, data);
    },
    debit(userId, data) {
      return request('POST', `/api/employee/accounts/${userId}/debit`, data);
    },
    getRequests(params) {
      return request('GET', `/api/employee/requests${buildQuery(params)}`);
    },
    updateRequest(id, data) {
      return request('PUT', `/api/employee/requests/${id}`, data);
    },
  };

  // ----------------------------------------------------------
  // Demandes bancaires (profil utilisateur)
  // ----------------------------------------------------------
  API.requests = {
    create(data) {
      return request('POST', '/api/requests', data);
    },
    getMine() {
      return request('GET', '/api/requests/mine');
    },
  };

  // ----------------------------------------------------------
  // Administration
  // ----------------------------------------------------------
  API.admin = {
    // Utilisateurs
    getUsers(params) {
      return request('GET', `/api/admin/users${buildQuery(params)}`);
    },
    getUser(id) {
      return request('GET', `/api/admin/users/${id}`);
    },
    createUser(data) {
      return request('POST', '/api/admin/users', data);
    },
    deleteUser(id) {
      return request('DELETE', `/api/admin/users/${id}`);
    },
    setRole(id, role) {
      return request('PUT', `/api/admin/users/${id}/role`, { role });
    },
    setTpe(id, hasTpe, tpeLabel) {
      return request('PUT', `/api/admin/users/${id}/tpe`, { hasTpe, tpeLabel });
    },
    setStatus(id, isActive) {
      return request('PUT', `/api/admin/users/${id}/status`, { isActive });
    },

    // Comptes
    freezeAccount(userId, isFrozen) {
      return request('PUT', `/api/admin/accounts/${userId}/freeze`, { isFrozen });
    },
    adjustBalance(userId, data) {
      return request('POST', `/api/admin/accounts/${userId}/adjust`, data);
    },

    // Transactions
    getTransactions(params) {
      return request('GET', `/api/admin/transactions${buildQuery(params)}`);
    },

    // Journaux
    getLogs(params) {
      return request('GET', `/api/admin/logs${buildQuery(params)}`);
    },

    // Banques
    getBanks() {
      return request('GET', '/api/admin/banks');
    },
    createBank(data) {
      return request('POST', '/api/admin/banks', data);
    },

    // Statistiques
    getStats() {
      return request('GET', '/api/admin/stats');
    },
  };

  // ----------------------------------------------------------
  // Exposition globale
  // ----------------------------------------------------------
  window.API = API;
})();
