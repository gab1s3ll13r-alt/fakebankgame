// ============================================================
// public/js/dashboard.js
// Dashboard utilisateur principal
// - Charge les infos utilisateur
// - Affiche le compte bancaire
// - Gère les actions rapides (balance, profil, etc.)
// ============================================================

(function () {
  'use strict';

  // ----------------------------------------------------------
  // Éléments DOM
  // ----------------------------------------------------------
  const dom = {
    username: document.querySelector('#username'),
    displayName: document.querySelector('#displayName'),
    email: document.querySelector('#email'),

    iban: document.querySelector('#iban'),
    balance: document.querySelector('#balance'),
    bankName: document.querySelector('#bankName'),

    accountStatus: document.querySelector('#accountStatus'),

    logoutBtn: document.querySelector('#logoutBtn'),
  };

  // ----------------------------------------------------------
  // État local
  // ----------------------------------------------------------
  let currentUser = null;

  // ----------------------------------------------------------
  // UI helpers
  // ----------------------------------------------------------
  function setText(el, value) {
    if (!el) return;
    el.textContent = value ?? '-';
  }

  function formatBalance(amount, currency = 'EUR') {
    try {
      return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency,
      }).format(amount || 0);
    } catch {
      return `${amount} ${currency}`;
    }
  }

  function setLoadingState(isLoading) {
    if (isLoading) {
      setText(dom.balance, 'Chargement...');
      setText(dom.iban, '...');
    }
  }

  // ----------------------------------------------------------
  // Chargement utilisateur
  // ----------------------------------------------------------
  async function loadUser() {
    setLoadingState(true);

    const res = await window.API.auth.me();

    if (res.error || !res.data?.user) {
      window.location.href = '/login.html';
      return;
    }

    currentUser = res.data.user;
    renderUser(currentUser);
  }

  // ----------------------------------------------------------
  // Rendu UI
  // ----------------------------------------------------------
  function renderUser(user) {
    setText(dom.username, user.username);
    setText(dom.displayName, user.displayName);
    setText(dom.email, user.email);

    const account = user.account;

    if (!account) {
      setText(dom.iban, 'Aucun compte');
      setText(dom.balance, '-');
      setText(dom.bankName, '-');
      return;
    }

    setText(dom.iban, account.ibanFormatted || account.iban);
    setText(dom.balance, formatBalance(account.balance, account.currency));
    setText(dom.bankName, account.bankName);

    if (account.isFrozen) {
      setText(dom.accountStatus, '❄️ Compte gelé');
      dom.accountStatus.classList?.add('status-frozen');
    } else {
      setText(dom.accountStatus, 'Actif');
      dom.accountStatus.classList?.remove('status-frozen');
    }
  }

  // ----------------------------------------------------------
  // Logout
  // ----------------------------------------------------------
  async function logout() {
    const res = await window.API.auth.logout();

    // Même si erreur, on force la sortie session côté client
    window.location.href = '/login.html';
  }

  // ----------------------------------------------------------
  // Refresh manuel (optionnel bouton UI)
  // ----------------------------------------------------------
  async function refresh() {
    await loadUser();
  }

  // ----------------------------------------------------------
  // Init
  // ----------------------------------------------------------
  function init() {
    if (dom.logoutBtn) {
      dom.logoutBtn.addEventListener('click', logout);
    }

    loadUser();

    // refresh auto léger (optionnel)
    setInterval(loadUser, 60000);
  }

  document.addEventListener('DOMContentLoaded', init);
})();
