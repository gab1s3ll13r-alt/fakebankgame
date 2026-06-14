// ============================================================
// public/js/dashboard.js
// Tableau de bord utilisateur :
// - Charge l'utilisateur connecté + solde + IBAN
// - Stats (reçu / envoyé / nb transactions)
// - Graphique 14 jours
// - Dernières transactions
// ============================================================

(function () {
  'use strict';

  // ----------------------------------------------------------
  // Formatage
  // ----------------------------------------------------------
  function formatMoney(cents) {
    return (cents / 100).toLocaleString('fr-FR', {
      style:    'currency',
      currency: 'EUR',
    });
  }

  function formatDate(dateStr) {
    return new Date(dateStr).toLocaleString('fr-FR', {
      day:    '2-digit',
      month:  '2-digit',
      year:   'numeric',
      hour:   '2-digit',
      minute: '2-digit',
    });
  }

  // ----------------------------------------------------------
  // Charger utilisateur + solde
  // ----------------------------------------------------------
  async function loadUser() {
    const res = await window.API.auth.me();

    if (res.error || !res.data) {
      window.location.href = '/login.html';
      return null;
    }

    const user    = res.data.user;
    const account = user.account;

    // Adapter la sidebar (masquer liens selon rôle)
    adaptSidebar(user);

    // Afficher solde et IBAN dans la balance-card
    const balEl = document.getElementById('balanceAmount');
    if (balEl && account) {
      balEl.textContent = formatMoney(account.balance || 0);
    }

    const ibanEl = document.getElementById('iban');
    if (ibanEl && account) {
      ibanEl.textContent = account.ibanFormatted || '-';
    }

    return user;
  }

  // ----------------------------------------------------------
  // Adapter la sidebar selon le rôle
  // ----------------------------------------------------------
  function adaptSidebar(user) {
    const tpeLink      = document.getElementById('tpeLink');
    const employeeLink = document.getElementById('employeeLink');
    const adminLink    = document.getElementById('adminLink');

    if (tpeLink)      tpeLink.style.display      = user.hasTpe || user.role === 'admin' ? '' : 'none';
    if (employeeLink) employeeLink.style.display  = (user.role === 'employee' || user.role === 'admin') ? '' : 'none';
    if (adminLink)    adminLink.style.display     = user.role === 'admin' ? '' : 'none';
  }

  // ----------------------------------------------------------
  // Charger stats (summary)
  // ----------------------------------------------------------
  async function loadSummary() {
    const res = await window.API.transactions.getSummary(14);
    if (res.error || !res.data) return;

    // Calculer totaux
    let totalIn  = 0;
    let totalOut = 0;

    const days = res.data.days || [];
    days.forEach((d) => {
      totalIn  += d.totalIn  || 0;
      totalOut += d.totalOut || 0;
    });

    const recEl  = document.getElementById('received');
    const sentEl = document.getElementById('sent');

    if (recEl)  recEl.textContent  = formatMoney(totalIn);
    if (sentEl) sentEl.textContent = formatMoney(totalOut);

    // Graphique
    drawChart(days);
  }

  // ----------------------------------------------------------
  // Graphique (Chart.js)
  // ----------------------------------------------------------
  function drawChart(days) {
    const canvas = document.getElementById('chart');
    if (!canvas || typeof Chart === 'undefined') return;

    const labels  = days.map((d) => d.date);
    const dataIn  = days.map((d) => (d.totalIn  / 100));
    const dataOut = days.map((d) => (d.totalOut / 100));

    new Chart(canvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label:           'Reçus (€)',
            data:            dataIn,
            backgroundColor: 'rgba(22, 163, 74, 0.6)',
            borderColor:     '#16a34a',
            borderWidth:     1,
          },
          {
            label:           'Envoyés (€)',
            data:            dataOut,
            backgroundColor: 'rgba(220, 38, 38, 0.6)',
            borderColor:     '#dc2626',
            borderWidth:     1,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'top' },
        },
        scales: {
          y: { beginAtZero: true },
        },
      },
    });
  }

  // ----------------------------------------------------------
  // Dernières transactions
  // ----------------------------------------------------------
  async function loadLastTransactions(userId) {
    const res = await window.API.transactions.getHistory({ limit: 5 });
    if (res.error || !res.data) return;

    const container = document.getElementById('lastTransactions');
    const txCountEl = document.getElementById('txCount');

    if (txCountEl) txCountEl.textContent = res.data.pagination?.total || 0;
    if (!container) return;

    const txs = res.data.transactions || [];

    if (txs.length === 0) {
      container.innerHTML = '<p style="color: var(--color-text-muted); text-align:center;">Aucune transaction</p>';
      return;
    }

    container.innerHTML = txs.map((tx) => {
      const isIn  = tx.direction === 'incoming';
      const color = isIn ? 'var(--color-success)' : 'var(--color-error)';
      const sign  = isIn ? '+' : '-';

      const other = isIn ? tx.from : tx.to;
      const label = other ? other.displayName : tx.description || tx.type;

      return `
        <div style="
          display:flex; justify-content:space-between; align-items:center;
          padding: 10px 0; border-bottom: 1px solid var(--color-border);
        ">
          <div>
            <div style="font-weight:600; color: var(--color-text);">${escHtml(label || tx.type)}</div>
            <div style="font-size:0.8rem; color: var(--color-text-muted);">${formatDate(tx.createdAt)}</div>
          </div>
          <div style="font-weight:700; color:${color};">
            ${sign}${formatMoney(tx.amount)}
          </div>
        </div>
      `;
    }).join('');
  }

  function escHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // ----------------------------------------------------------
  // Init
  // ----------------------------------------------------------
  async function init() {
    const user = await loadUser();
    if (!user) return;

    await Promise.all([
      loadSummary(),
      loadLastTransactions(user.id),
    ]);
  }

  document.addEventListener('DOMContentLoaded', init);
})();
