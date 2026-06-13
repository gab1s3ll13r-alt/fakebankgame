// ============================================================
// public/js/employee.js
// Interface employé de banque
// ============================================================

(function () {
  'use strict';

  let selectedAccount = null;
  let currentUserId = null;

  // ----------------------------------------------------------
  // Vérification accès
  // ----------------------------------------------------------
  async function checkAccess() {
    const res = await window.API.auth.me();

    if (res.error) {
      window.location.href = '/login.html';
      return null;
    }

    const user = res.data;

    if (!(user.role === 'employee' || user.role === 'admin')) {
      window.location.href = '/dashboard.html';
      return null;
    }

    return user;
  }

  // ----------------------------------------------------------
  // Recherche comptes
  // ----------------------------------------------------------
  function initSearch() {
    const input = document.getElementById('searchAccounts');
    const results = document.getElementById('accountsResults');

    let timeout = null;

    if (!input || !results) return;

    input.addEventListener('input', () => {
      clearTimeout(timeout);

      const q = input.value.trim();

      if (q.length < 2) {
        results.innerHTML = '';
        return;
      }

      timeout = setTimeout(async () => {
        const res = await window.API.employee.getAccounts({ q });

        if (res.error) return;

        results.innerHTML = '';

        res.data.accounts.forEach(acc => {
          const div = document.createElement('div');
          div.className = 'account-card';

          div.innerHTML = `
            <strong>${acc.username}</strong><br>
            <small>${acc.iban}</small><br>
            <span>${acc.balance / 100} €</span>
          `;

          div.addEventListener('click', () => {
            selectedAccount = acc;
            currentUserId = acc.userId;

            loadAccountDetails();
          });

          results.appendChild(div);
        });
      }, 300);
    });
  }

  // ----------------------------------------------------------
  // Détails compte
  // ----------------------------------------------------------
  async function loadAccountDetails() {
    if (!currentUserId) return;

    const res = await window.API.employee.getAccount(currentUserId);
    if (res.error) return;

    const acc = res.data.account;

    document.getElementById('accountInfo').innerHTML = `
      <h3>${acc.username}</h3>
      <p>IBAN: ${acc.iban}</p>
      <p>Solde: ${acc.balance / 100} €</p>
      <p>Status: ${acc.isFrozen ? 'Gelé' : 'Actif'}</p>
    `;

    loadTransactions();
  }

  // ----------------------------------------------------------
  // Transactions compte
  // ----------------------------------------------------------
  async function loadTransactions() {
    if (!currentUserId) return;

    const res = await window.API.employee.getTransactions(currentUserId, {
      limit: 20,
    });

    if (res.error) return;

    const container = document.getElementById('accountTransactions');
    if (!container) return;

    container.innerHTML = '';

    res.data.transactions.forEach(tx => {
      const div = document.createElement('div');

      div.innerHTML = `
        <div>${tx.type}</div>
        <div>${tx.amount / 100} €</div>
        <div>${new Date(tx.created_at).toLocaleString()}</div>
      `;

      container.appendChild(div);
    });
  }

  // ----------------------------------------------------------
  // Créditer compte
  // ----------------------------------------------------------
  function initCredit() {
    const form = document.getElementById('creditForm');
    if (!form) return;

    form.addEventListener('submit', async e => {
      e.preventDefault();

      if (!currentUserId) return;

      const amount = parseFloat(form.amount.value);
      const description = form.description.value;

      const res = await window.API.employee.credit(currentUserId, {
        amount: Math.round(amount * 100),
        description,
      });

      if (res.error) return alert(res.error);

      alert('Crédit effectué');
      loadAccountDetails();
    });
  }

  // ----------------------------------------------------------
  // Débiter compte
  // ----------------------------------------------------------
  function initDebit() {
    const form = document.getElementById('debitForm');
    if (!form) return;

    form.addEventListener('submit', async e => {
      e.preventDefault();

      if (!currentUserId) return;

      const amount = parseFloat(form.amount.value);
      const description = form.description.value;

      const res = await window.API.employee.debit(currentUserId, {
        amount: Math.round(amount * 100),
        description,
      });

      if (res.error) return alert(res.error);

      alert('Débit effectué');
      loadAccountDetails();
    });
  }

  // ----------------------------------------------------------
  // Init
  // ----------------------------------------------------------
  document.addEventListener('DOMContentLoaded', async () => {
    const user = await checkAccess();
    if (!user) return;

    initSearch();
    initCredit();
    initDebit();
  });
})();
