 // ============================================================
// public/js/admin.js
// Interface administration banque
// - Gestion utilisateurs
// - Gestion rôles
// - Activation / désactivation comptes
// - Gestion TPE
// - Statistiques simples
// ============================================================

(function () {
  'use strict';

  // ----------------------------------------------------------
  // DOM
  // ----------------------------------------------------------
  const dom = {
    usersList: document.getElementById('usersList'),
    searchInput: document.getElementById('searchUser'),

    statsBox: document.getElementById('stats'),

    roleSelect: document.getElementById('roleSelect'),
    tpeToggle: document.getElementById('tpeToggle'),
    tpeLabel: document.getElementById('tpeLabel'),

    freezeBtn: document.getElementById('freezeBtn'),
    deleteBtn: document.getElementById('deleteBtn'),
  };

  let selectedUser = null;
  let searchTimeout = null;

  // ----------------------------------------------------------
  // Utilitaire UI
  // ----------------------------------------------------------
  function renderUser(user) {
    const div = document.createElement('div');
    div.className = 'user-item';

    div.innerHTML = `
      <strong>${user.username}</strong>
      <small>${user.email}</small>
    `;

    div.addEventListener('click', () => {
      selectedUser = user;
      loadUserPanel();
    });

    return div;
  }

  function setStats(stats) {
    if (!dom.statsBox || !stats) return;

    dom.statsBox.innerHTML = `
      <div>Utilisateurs : ${stats.users}</div>
      <div>Comptes : ${stats.accounts}</div>
      <div>Transactions : ${stats.transactions}</div>
    `;
  }

  // ----------------------------------------------------------
  // Recherche utilisateurs
  // ----------------------------------------------------------
  function initSearch() {
    if (!dom.searchInput || !dom.usersList) return;

    dom.searchInput.addEventListener('input', () => {
      clearTimeout(searchTimeout);

      const q = dom.searchInput.value.trim();

      if (q.length < 2) {
        dom.usersList.innerHTML = '';
        return;
      }

      searchTimeout = setTimeout(async () => {
        const res = await window.API.admin.getUsers({ q });

        if (res.error) return;

        dom.usersList.innerHTML = '';

        (res.data.users || []).forEach((u) => {
          dom.usersList.appendChild(renderUser(u));
        });
      }, 300);
    });
  }

  // ----------------------------------------------------------
  // Charger stats admin
  // ----------------------------------------------------------
  async function loadStats() {
    const res = await window.API.admin.getStats();
    if (res.error) return;

    setStats(res.data);
  }

  // ----------------------------------------------------------
  // Panneau utilisateur sélectionné
  // ----------------------------------------------------------
  function loadUserPanel() {
    if (!selectedUser) return;

    if (dom.roleSelect) dom.roleSelect.value = selectedUser.role;
    if (dom.tpeToggle) dom.tpeToggle.checked = !!selectedUser.hasTpe;
    if (dom.tpeLabel) dom.tpeLabel.value = selectedUser.tpeLabel || '';
  }

  // ----------------------------------------------------------
  // Modifier rôle
  // ----------------------------------------------------------
  function initRoleChange() {
    if (!dom.roleSelect) return;

    dom.roleSelect.addEventListener('change', async () => {
      if (!selectedUser) return;

      const res = await window.API.admin.setRole(
        selectedUser.id,
        dom.roleSelect.value
      );

      if (res.error) return alert(res.error);

      alert('Rôle mis à jour');
    });
  }

  // ----------------------------------------------------------
  // Gestion TPE
  // ----------------------------------------------------------
  function initTpe() {
    if (!dom.tpeToggle) return;

    dom.tpeToggle.addEventListener('change', async () => {
      if (!selectedUser) return;

      const res = await window.API.admin.setTpe(
        selectedUser.id,
        dom.tpeToggle.checked,
        dom.tpeLabel?.value || ''
      );

      if (res.error) return alert(res.error);

      alert('TPE mis à jour');
    });
  }

  // ----------------------------------------------------------
  // Freeze compte
  // ----------------------------------------------------------
  function initFreeze() {
    if (!dom.freezeBtn) return;

    dom.freezeBtn.addEventListener('click', async () => {
      if (!selectedUser) return;

      const res = await window.API.admin.setStatus(
        selectedUser.id,
        !selectedUser.isActive
      );

      if (res.error) return alert(res.error);

      alert('Statut utilisateur mis à jour');
    });
  }

  // ----------------------------------------------------------
  // Init
  // ----------------------------------------------------------
  document.addEventListener('DOMContentLoaded', () => {
    initSearch();
    initRoleChange();
    initTpe();
    initFreeze();
    loadStats();
  });
})();
