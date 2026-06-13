// ============================================================
// public/js/history.js
// Historique des transactions
// ============================================================

(function () {
  'use strict';

  let currentPage = 1;
  let currentType = 'all';

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
    return new Date(dateStr).toLocaleString('fr-FR');
  }

  // ----------------------------------------------------------
  // Load history
  // ----------------------------------------------------------
  async function loadHistory() {
    const res = await window.API.transactions.getHistory({
      page: currentPage,
      limit: 20,
      type: currentType === 'all' ? null : currentType,
    });

    if (res.error) return;

    const table = document.getElementById('historyTable');
    const pageInfo = document.getElementById('pageInfo');

    if (!table) return;

    table.innerHTML = '';

    res.data.transactions.forEach(tx => {
      const row = document.createElement('div');
      row.className = 'transaction-row';

      row.innerHTML = `
        <div>
          <strong>${tx.type}</strong><br>
          <small>${formatDate(tx.created_at)}</small>
        </div>
        <div>
          ${formatAmount(tx.amount)}
        </div>
      `;

      row.addEventListener('click', () => showDetails(tx.id));

      table.appendChild(row);
    });

    if (pageInfo) {
      pageInfo.textContent = `Page ${currentPage}`;
    }
  }

  // ----------------------------------------------------------
  // Détails transaction
  // ----------------------------------------------------------
  async function showDetails(id) {
    const res = await window.API.transactions.getById(id);
    if (res.error) return;

    const tx = res.data.transaction;

    alert(
      `Transaction\n\nType: ${tx.type}\nMontant: ${formatAmount(
        tx.amount
      )}\nDate: ${formatDate(tx.created_at)}`
    );
  }

  // ----------------------------------------------------------
  // Pagination
  // ----------------------------------------------------------
  function initPagination() {
    const next = document.getElementById('nextPage');
    const prev = document.getElementById('prevPage');

    if (next) {
      next.addEventListener('click', () => {
        currentPage++;
        loadHistory();
      });
    }

    if (prev) {
      prev.addEventListener('click', () => {
        if (currentPage > 1) currentPage--;
        loadHistory();
      });
    }
  }

  // ----------------------------------------------------------
  // Filters
  // ----------------------------------------------------------
  function initFilters() {
    const select = document.getElementById('typeFilter');

    if (!select) return;

    select.addEventListener('change', () => {
      currentType = select.value;
      currentPage = 1;
      loadHistory();
    });
  }

  // ----------------------------------------------------------
  // Init
  // ----------------------------------------------------------
  document.addEventListener('DOMContentLoaded', () => {
    initPagination();
    initFilters();
    loadHistory();
  });
})();
