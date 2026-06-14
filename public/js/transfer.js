// ============================================================
// public/js/transfer.js
// Page de virement entre utilisateurs
// ============================================================

(function () {
  'use strict';

  let selectedRecipient = null;
  let searchTimeout     = null;

  // ----------------------------------------------------------
  // Formatage
  // ----------------------------------------------------------
  function formatMoney(cents) {
    return (cents / 100).toLocaleString('fr-FR', {
      style:    'currency',
      currency: 'EUR',
    });
  }

  function escHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  // ----------------------------------------------------------
  // Charger solde courant
  // ----------------------------------------------------------
  async function loadBalance() {
    const res = await window.API.account.getBalance();
    if (res.error) return;

    const el = document.getElementById('currentBalance');
    if (el) el.textContent = formatMoney(res.data.balance || 0);
  }

  // ----------------------------------------------------------
  // Recherche de destinataire (debounce 300 ms)
  // ----------------------------------------------------------
  function initSearch() {
    const input   = document.getElementById('recipientSearch');
    const results = document.getElementById('searchResults');

    if (!input || !results) return;

    input.addEventListener('input', () => {
      clearTimeout(searchTimeout);

      const q = input.value.trim();

      results.innerHTML = '';

      if (q.length < 2) return;

      searchTimeout = setTimeout(async () => {
        const res = await window.API.users.search(q);
        if (res.error || !res.data) return;

        const users = res.data.results || [];

        if (users.length === 0) {
          results.innerHTML = '<div style="padding:8px; color:var(--color-text-muted);">Aucun résultat</div>';
          return;
        }

        users.forEach((user) => {
          const div = document.createElement('div');
          div.className = 'search-result-item';
          div.style.cssText = 'padding:10px; cursor:pointer; border-bottom:1px solid var(--color-border);';
          div.innerHTML = `
            <strong>${escHtml(user.displayName)}</strong>
            <span style="color:var(--color-text-muted); margin-left:8px;">@${escHtml(user.username)}</span>
            <div style="font-size:0.8rem; color:var(--color-text-muted);">${escHtml(user.ibanMasked || '')}</div>
          `;

          div.addEventListener('click', () => {
            selectRecipient(user);
            results.innerHTML = '';
            input.value = '';
          });

          div.addEventListener('mouseenter', () => {
            div.style.background = 'var(--color-bg-subtle)';
          });
          div.addEventListener('mouseleave', () => {
            div.style.background = '';
          });

          results.appendChild(div);
        });
      }, 300);
    });
  }

  // ----------------------------------------------------------
  // Sélectionner un destinataire
  // ----------------------------------------------------------
  function selectRecipient(user) {
    selectedRecipient = user;

    const card = document.getElementById('recipientCard');
    const info = document.getElementById('recipientInfo');

    if (card) card.style.display = '';
    if (info) {
      info.innerHTML = `
        <strong>${escHtml(user.displayName)}</strong>
        <span style="color:var(--color-text-muted);"> @${escHtml(user.username)}</span>
        <div style="font-size:0.8rem; color:var(--color-text-muted);">${escHtml(user.ibanMasked || '')}</div>
      `;
    }

    updatePreview();
  }

  // Exposée globalement pour le bouton "Retirer"
  window.clearRecipient = function () {
    selectedRecipient = null;
    const card = document.getElementById('recipientCard');
    if (card) card.style.display = 'none';
    updatePreview();
  };

  // ----------------------------------------------------------
  // Aperçu du virement
  // ----------------------------------------------------------
  function updatePreview() {
    const preview   = document.getElementById('preview');
    const amountEl  = document.getElementById('amount');

    if (!preview) return;

    const amount = parseFloat((amountEl || {}).value);

    if (!selectedRecipient || !amount || amount <= 0) {
      preview.innerHTML = '';
      return;
    }

    preview.innerHTML = `
      <div style="padding:12px; background:var(--color-bg-subtle); border-radius:8px; border:1px solid var(--color-border);">
        <p style="margin:0 0 4px;"><strong>Virement vers :</strong> ${escHtml(selectedRecipient.displayName)}</p>
        <p style="margin:0; font-size:1.2rem; font-weight:700; color:var(--color-primary);">${formatMoney(Math.round(amount * 100))}</p>
      </div>
    `;
  }

  // ----------------------------------------------------------
  // Confirmation du virement
  // ----------------------------------------------------------
  function initTransfer() {
    const btn = document.getElementById('confirmTransferBtn');
    const amountEl      = document.getElementById('amount');
    const descriptionEl = document.getElementById('description');

    if (!btn) return;

    // Mettre à jour l'aperçu quand le montant change
    if (amountEl) amountEl.addEventListener('input', updatePreview);

    btn.addEventListener('click', async () => {
      if (!selectedRecipient) {
        alert('Veuillez sélectionner un destinataire.');
        return;
      }

      const amount = parseFloat((amountEl || {}).value);
      if (!amount || amount <= 0) {
        alert('Veuillez entrer un montant valide.');
        return;
      }

      const description = ((descriptionEl || {}).value || '').trim();
      const amountCents = Math.round(amount * 100);

      btn.disabled = true;
      btn.textContent = 'Traitement...';

      // L'API attend recipientId (pas toUserId)
      const res = await window.API.transactions.transfer({
        recipientId: selectedRecipient.id,
        amount:      amount,  // en euros (le backend fait la conversion)
        description: description || undefined,
      });

      btn.disabled = false;
      btn.textContent = 'Confirmer le virement';

      if (res.error) {
        alert(res.error);
        return;
      }

      alert(`Virement de ${formatMoney(amountCents)} effectué vers ${selectedRecipient.displayName}.`);
      window.location.href = '/history.html';
    });
  }

  // ----------------------------------------------------------
  // Pré-sélection via URL (?to=userId)
  // ----------------------------------------------------------
  async function preselectFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const toId   = parseInt(params.get('to'), 10);

    if (!toId) return;

    // On cherche l'utilisateur via la recherche (on n'a pas de route GET user public)
    // On laisse l'utilisateur le sélectionner manuellement
  }

  // ----------------------------------------------------------
  // Adaptation sidebar selon rôle
  // ----------------------------------------------------------
  async function adaptSidebar() {
    const res = await window.API.auth.me();
    if (res.error || !res.data) {
      window.location.href = '/login.html';
      return;
    }

    const user = res.data.user;
    const tpeLink      = document.getElementById('tpeLink');
    const employeeLink = document.getElementById('employeeLink');
    const adminLink    = document.getElementById('adminLink');

    if (tpeLink)      tpeLink.style.display      = user.hasTpe || user.role === 'admin' ? '' : 'none';
    if (employeeLink) employeeLink.style.display  = (user.role === 'employee' || user.role === 'admin') ? '' : 'none';
    if (adminLink)    adminLink.style.display     = user.role === 'admin' ? '' : 'none';
  }

  // ----------------------------------------------------------
  // Init
  // ----------------------------------------------------------
  document.addEventListener('DOMContentLoaded', async () => {
    await adaptSidebar();
    await loadBalance();
    initSearch();
    initTransfer();
    preselectFromUrl();
  });
})();
