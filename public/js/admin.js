// ============================================================
// public/js/admin.js
// Interface administrateur complète
// ============================================================

(function () {
  'use strict';

  let currentPage = 1;

  // ----------------------------------------------------------
  // Vérification accès admin
  // ----------------------------------------------------------
  async function checkAccess() {
    const res = await window.API.auth.me();

    if (res.error) {
      window.location.href = '/login.html';
      return null;
    }

    const user = res.data;

    if (user.role !== 'admin') {
      window.location.href = '/dashboard.html';
      return null;
    }

    return user;
  }

  // ----------------------------------------------------------
  // Dashboard stats
  // ----------------------------------------------------------
  async function loadStats() {
    const res = await window.API.admin.getStats();
    if (res.error) return;

    const stats = res.data;

    const el = document.getElementById('adminStats');
    if (!el) return;

    el.innerHTML = `
      <div>Utilisateurs: ${stats.users}</div>
      <div>Transactions: ${stats.transactions}</div>
      <div>Solde total: ${stats.totalBalance / 100} €</div>
    `;
  }

  // ----------------------------------------------------------
  // Liste utilisateurs
  // ----------------------------------------------------------
  function initUsersSearch() {
    const input = document.getElementById('userSearch');
    const roleFilter = document.getElementById('roleFilter');
    const results = document.getElementById('usersTable');

    let timeout = null;

    if (!input || !results) return;

    async function loadUsers() {
      const res = await window.API.admin.getUsers({
        q: input.value,
        role: roleFilter ? roleFilter.value : '',
        page: currentPage,
      });

      if (res.error) return;

      results.innerHTML = '';

      res.data.users.forEach(u => {
        const row = document.createElement('div');
        row.className = 'user-row';

        row.innerHTML = `
          <div>${u.username}</div>
          <div>${u.email}</div>
          <div>${u.role}</div>
          <div>${u.isActive ? 'Actif' : 'Bloqué'}</div>
          <div>${u.balance / 100} €</div>
          <button data-id="${u.id}" class="deleteBtn">Supprimer</button>
        `;

        results.appendChild(row);
      });

      initDeleteButtons();
    }

    input.addEventListener('input', () => {
      clearTimeout(timeout);
      timeout = setTimeout(loadUsers, 400);
    });

    if (roleFilter) {
      roleFilter.addEventListener('change', loadUsers);
    }

    loadUsers();
  }

  // ----------------------------------------------------------
  // Supprimer utilisateur
  // ----------------------------------------------------------
  function initDeleteButtons() {
    document.querySelectorAll('.deleteBtn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;

        const confirm = window.confirm('Supprimer cet utilisateur ?');
        if (!confirm) return;

        const res = await window.API.admin.deleteUser(id);

        if (res.error) return alert(res.error);

        btn.parentElement.remove();
      });
    });
  }

  // ----------------------------------------------------------
  // Freeze / unfreeze compte
  // ----------------------------------------------------------
  async function toggleFreeze(userId, isFrozen) {
    const res = await window.API.admin.freezeAccount(userId, isFrozen);

    if (res.error) return alert(res.error);

    alert('Statut mis à jour');
  }

  // ----------------------------------------------------------
  // Ajustement solde
  // ----------------------------------------------------------
  function initAdjustBalance() {
    const form = document.getElementById('adjustForm');
    if (!form) return;

    form.addEventListener('submit', async e => {
      e.preventDefault();

      const userId = form.userId.value;
      const amount = parseFloat(form.amount.value);
      const reason = form.reason.value;

      const res = await window.API.admin.adjustBalance(userId, {
        amount: Math.round(amount * 100),
        reason,
      });

      if (res.error) return alert(res.error);

      alert('Solde ajusté');
    });
  }

  // ----------------------------------------------------------
  // Transactions admin
  // ----------------------------------------------------------
  function initTransactions() {
    const container = document.getElementById('adminTransactions');
    if (!container) return;

    async function load() {
      const res = await window.API.admin.getTransactions({
        page: currentPage,
      });

      if (res.error) return;

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

    load();
  }

  // ----------------------------------------------------------
  // Logs système
  // ----------------------------------------------------------
  function initLogs() {
    const container = document.getElementById('adminLogs');
    if (!container) return;

    async function load() {
      const res = await window.API.admin.getLogs({ page: currentPage });

      if (res.error) return;

      container.innerHTML = '';

      res.data.logs.forEach(log => {
        const div = document.createElement('div');

        div.innerHTML = `
          <div>${log.action}</div>
          <div>${log.actor_user_id}</div>
          <div>${new Date(log.created_at).toLocaleString()}</div>
        `;

        container.appendChild(div);
      });
    }

    load();
  }

  // ----------------------------------------------------------
  // Init
  // ----------------------------------------------------------
  document.addEventListener('DOMContentLoaded', async () => {
    const user = await checkAccess();
    if (!user) return;

    loadStats();
    initUsersSearch();
    initAdjustBalance();
    initTransactions();
    initLogs();
  });
})();
