// ============================================================
// public/js/transfer.js
// Page de virement
// ============================================================

(function () {
  'use strict';

  let selectedUser = null;
  let searchTimeout = null;

  // ----------------------------------------------------------
  // Formatage
  // ----------------------------------------------------------
  function formatAmount(cents) {
    return (cents / 100).toLocaleString('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    });
  }

  // ----------------------------------------------------------
  // Charger solde
  // ----------------------------------------------------------
  async function loadBalance() {
    const res = await window.API.account.getBalance();
    if (res.error) return;

    const el = document.getElementById('balance');
    if (el) el.textContent = formatAmount(res.data.balance);
  }

  // ----------------------------------------------------------
  // Recherche utilisateurs (debounce)
  // ----------------------------------------------------------
  function initSearch() {
    const input = document.getElementById('searchUser');
    const results = document.getElementById('searchResults');

    if (!input || !results) return;

    input.addEventListener('input', () => {
      clearTimeout(searchTimeout);

      const q = input.value.trim();

      if (q.length < 2) {
        results.innerHTML = '';
        return;
      }

      searchTimeout = setTimeout(async () => {
        const res = await window.API.users.search(q);
        if (res.error) return;

        results.innerHTML = '';

        res.data.users.forEach(user => {
          const div = document.createElement('div');
          div.className = 'search-item';

          div.innerHTML = `
            <strong>${user.username}</strong><br>
            <small>${user.ibanMasked}</small>
          `;

          div.addEventListener('click', () => {
            selectedUser = user;

            document.getElementById('selectedUser').textContent =
              user.username;

            results.innerHTML = '';
            input.value = '';
          });

          results.appendChild(div);
        });
      }, 300);
    });
  }

  // ----------------------------------------------------------
  // Virement
  // ----------------------------------------------------------
  function initTransfer() {
    const form = document.getElementById('transferForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const amount = parseFloat(form.amount.value);
      const description = form.description.value;

      if (!selectedUser) {
        alert('Sélectionne un destinataire');
        return;
      }

      if (!amount || amount <= 0) {
        alert('Montant invalide');
        return;
      }

      const btn = form.querySelector('button');
      btn.disabled = true;

      const res = await window.API.transactions.transfer({
        toUserId: selectedUser.id,
        amount: Math.round(amount * 100),
        description,
      });

      btn.disabled = false;

      if (res.error) {
        alert(res.error);
        return;
      }

      alert('Virement effectué');
      window.location.href = '/history.html';
    });
  }

  // ----------------------------------------------------------
  // Init
  // ----------------------------------------------------------
  document.addEventListener('DOMContentLoaded', () => {
    loadBalance();
    initSearch();
    initTransfer();
  });
})();
