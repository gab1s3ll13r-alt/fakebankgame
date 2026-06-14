// ============================================================
// public/js/tpe.js
// Logique TPE commerçant + paiement QR
// ============================================================

(function () {
  'use strict';

  // ------------------------------------------------------------
  // Vérification accès TPE (page commerçant)
  // ------------------------------------------------------------
  async function initTpePage() {
    const res = await API.auth.me();
    if (res.status !== 200) return;

    const user = res.data;

    if (!user.hasTpe && !user.role === 'admin') {
      window.location.href = '/dashboard.html';
      return;
    }

    document.getElementById('tpeLabel').textContent =
      user.tpeLabel || 'Commerce';

    loadBalance();
    loadHistory();
    setupEvents();
  }

  // ------------------------------------------------------------
  // Balance
  // ------------------------------------------------------------
  async function loadBalance() {
    const res = await API.account.getBalance();
    if (res.status === 200) {
      document.getElementById('tpeBalance').textContent =
        formatMoney(res.data.balance);
    }
  }

  // ------------------------------------------------------------
  // Génération QR
  // ------------------------------------------------------------
  function setupEvents() {
    const btn = document.getElementById('generateQrBtn');
    const cancelBtn = document.getElementById('cancelQrBtn');

    btn?.addEventListener('click', generateQr);
    cancelBtn?.addEventListener('click', cancelQr);
  }

  async function generateQr() {
    const amount = parseFloat(document.getElementById('amountInput').value);
    const label = document.getElementById('labelInput').value;

    if (!amount || amount <= 0) {
      alert('Montant invalide');
      return;
    }

    const res = await API.tpe.request({ amount, label });

    if (res.status !== 201) {
      alert(res.error || 'Erreur création QR');
      return;
    }

    const qrData = res.data;

    document.getElementById('qrCard').style.display = 'block';

    const container = document.getElementById('qrCodeContainer');
    container.innerHTML = '';

    QRCode.toCanvas(
      document.createElement('canvas'),
      qrData.url,
      function (error, canvas) {
        if (!error) container.appendChild(canvas);
      }
    );

    startPendingPolling(qrData.uuid);
  }

  // ------------------------------------------------------------
  // Annulation QR
  // ------------------------------------------------------------
  async function cancelQr() {
    const uuid = currentQr;
    if (!uuid) return;

    await API.tpe.cancel(uuid);

    document.getElementById('qrCard').style.display = 'none';
  }

  let currentQr = null;

  // ------------------------------------------------------------
  // Polling paiement
  // ------------------------------------------------------------
  function startPendingPolling(uuid) {
    currentQr = uuid;

    const interval = setInterval(async () => {
      const res = await API.tpe.getPayment(uuid);

      if (res.status !== 200) return;

      const payment = res.data;

      if (payment.status === 'paid') {
        clearInterval(interval);

        document.getElementById('paymentStatus').textContent =
          'Paiement reçu ✔';

        loadBalance();
        loadHistory();
      }
    }, 5000);
  }

  // ------------------------------------------------------------
  // Historique
  // ------------------------------------------------------------
  async function loadHistory() {
    const res = await API.tpe.getHistory({ limit: 10 });

    if (res.status !== 200) return;

    const container = document.getElementById('tpeHistoryList');
    container.innerHTML = '';

    res.data.items.forEach((t) => {
      const div = document.createElement('div');
      div.className = 'transaction-row';

      div.innerHTML = `
        <span>${t.label || 'Paiement'}</span>
        <span>${formatMoney(t.amount)}</span>
      `;

      container.appendChild(div);
    });
  }

  // ------------------------------------------------------------
  // Helpers
  // ------------------------------------------------------------
  function formatMoney(cents) {
    return (cents / 100).toFixed(2) + ' €';
  }

  // ------------------------------------------------------------
  // Init
  // ------------------------------------------------------------
  document.addEventListener('DOMContentLoaded', initTpePage);

})();
