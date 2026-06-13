// ============================================================
// public/js/dashboard.js
// Tableau de bord principal
// ============================================================

(function () {
  'use strict';

  let balancePolling = null;

  // ----------------------------------------------------------
  // Formatage
  // ----------------------------------------------------------
  function formatAmount(cents) {
    return (cents / 100).toLocaleString('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    });
  }

  function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleString('fr-FR');
  }

  // ----------------------------------------------------------
  // Auth check
  // ----------------------------------------------------------
  async function checkAuth() {
    const res = await window.API.auth.me();
    if (res.error) {
      window.location.href = '/login.html';
      return null;
    }
    return res.data;
  }

  // ----------------------------------------------------------
  // Load balance
  // ----------------------------------------------------------
  async function loadBalance() {
    const res = await window.API.account.getBalance();
    if (res.error) return;

    const el = document.getElementById('balanceAmount');
    if (el) el.textContent = formatAmount(res.data.balance);
  }

  // ----------------------------------------------------------
  // Load account info
  // ----------------------------------------------------------
  async function loadAccount() {
    const res = await window.API.account.get();
    if (res.error) return;

    const ibanEl = document.getElementById('iban');
    if (ibanEl) ibanEl.textContent = res.data.iban;
  }

  // ----------------------------------------------------------
  // Transactions
  // ----------------------------------------------------------
  async function loadTransactions() {
    const res = await window.API.transactions.getHistory({ limit: 5 });
    if (res.error) return;

    const container = document.getElementById('transactions');
    if (!container) return;

    container.innerHTML = '';

    res.data.transactions.forEach(tx => {
      const div = document.createElement('div');
      div.className = 'transaction-row';

      div.innerHTML = `
        <div>
          <strong>${tx.type}</strong><br>
          <small>${formatDate(tx.created_at)}</small>
        </div>
        <div>
          ${formatAmount(tx.amount)}
        </div>
      `;

      container.appendChild(div);
    });
  }

  // ----------------------------------------------------------
  // Notifications
  // ----------------------------------------------------------
  async function loadNotifications() {
    const res = await window.API.account.getNotifications({ unread: true });
    if (res.error) return;

    const badge = document.getElementById('notifBadge');
    if (badge) {
      badge.textContent = res.data.notifications.length;
    }
  }

  // ----------------------------------------------------------
  // Polling solde
  // ----------------------------------------------------------
  function startPolling() {
    if (balancePolling) clearInterval(balancePolling);

    balancePolling = setInterval(() => {
      loadBalance();
      loadNotifications();
    }, 30000);
  }

  // ----------------------------------------------------------
  // Init dashboard
  // ----------------------------------------------------------
  async function init() {
    const user = await checkAuth();
    if (!user) return;

    await loadAccount();
    await loadBalance();
    await loadTransactions();
    await loadNotifications();

    startPolling();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
