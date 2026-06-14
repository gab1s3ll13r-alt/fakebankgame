// ============================================================
// public/js/dashboard.js
// Tableau de bord utilisateur
// - Charge utilisateur connecté
// - Affiche compte + solde
// - Affiche transactions récentes
// - Affiche notifications
// ============================================================

(function () {
  'use strict';

  // ----------------------------------------------------------
  // DOM
  // ----------------------------------------------------------
  const dom = {
    username: document.getElementById('username'),
    balance: document.getElementById('balance'),
    iban: document.getElementById('iban'),

    transactions: document.getElementById('transactions'),
    notifications: document.getElementById('notifications'),
  };

  // ----------------------------------------------------------
  // Format monnaie
  // ----------------------------------------------------------
  function formatMoney(amount) {
    return Number(amount).toLocaleString('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    });
  }

  // ----------------------------------------------------------
  // Utilisateur connecté
  // ----------------------------------------------------------
  async function loadUser() {
    const res = await window.API.auth.me();
    if (res.error) {
      window.location.href = '/login.html';
      return null;
    }

    const user = res.data.user;

    if (dom.username) dom.username.textContent = user.displayName;
    if (dom.balance) dom.balance.textContent = formatMoney(user.account?.balance || 0);
    if (dom.iban) dom.iban.textContent = user.account?.ibanFormatted || '-';

    return user;
  }

  // ----------------------------------------------------------
  // Transactions récentes
  // ----------------------------------------------------------
  async function loadTransactions() {
    const res = await window.API.transactions.getHistory({ limit: 5 });

    if (res.error || !dom.transactions) return;

    dom.transactions.innerHTML = '';

    (res.data.transactions || []).forEach((t) => {
      const div = document.createElement('div');
      div.className = 'transaction-item';

      const sign = t.type === 'credit' ? '+' : '-';

      div.innerHTML = `
        <div>
          <strong>${t.description || 'Transaction'}</strong>
          <small>${new Date(t.created_at).toLocaleString('fr-FR')}</small>
        </div>
        <div class="${t.type}">
          ${sign}${formatMoney(t.amount)}
        </div>
      `;

      dom.transactions.appendChild(div);
    });
  }

  // ----------------------------------------------------------
  // Notifications
  // ----------------------------------------------------------
  async function loadNotifications() {
    const res = await window.API.account.getNotifications({ limit: 5 });

    if (res.error || !dom.notifications) return;

    dom.notifications.innerHTML = '';

    (res.data.notifications || []).forEach((n) => {
      const div = document.createElement('div');
      div.className = 'notification-item';

      div.innerHTML = `
        <div>${n.message}</div>
        <small>${new Date(n.created_at).toLocaleString('fr-FR')}</small>
      `;

      dom.notifications.appendChild(div);
    });
  }

  // ----------------------------------------------------------
  // Init
  // ----------------------------------------------------------
  async function init() {
    const user = await loadUser();
    if (!user) return;

    await Promise.all([
      loadTransactions(),
      loadNotifications(),
    ]);
  }

  document.addEventListener('DOMContentLoaded', init);
})();
