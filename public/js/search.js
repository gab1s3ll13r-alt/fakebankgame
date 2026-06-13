// ============================================================
// public/js/search.js
// Recherche d'utilisateurs
// ============================================================

(function () {
  'use strict';

  let timeout = null;

  // ----------------------------------------------------------
  // Recherche utilisateurs
  // ----------------------------------------------------------
  function initSearch() {
    const input = document.getElementById('searchInput');
    const results = document.getElementById('results');

    if (!input || !results) return;

    input.addEventListener('input', () => {
      clearTimeout(timeout);

      const q = input.value.trim();

      if (q.length < 2) {
        results.innerHTML = '';
        return;
      }

      timeout = setTimeout(async () => {
        const res = await window.API.users.search(q);
        if (res.error) return;

        results.innerHTML = '';

        if (!res.data.users.length) {
          results.innerHTML = '<p>Aucun résultat</p>';
          return;
        }

        res.data.users.forEach(user => {
          const div = document.createElement('div');
          div.className = 'user-card';

          div.innerHTML = `
            <div>
              <strong>${user.username}</strong><br>
              <small>${user.ibanMasked}</small>
            </div>
            <button>Envoyer</button>
          `;

          div.querySelector('button').addEventListener('click', () => {
            window.location.href = `/transfer.html?to=${user.id}`;
          });

          results.appendChild(div);
        });
      }, 400);
    });
  }

  // ----------------------------------------------------------
  // Init
  // ----------------------------------------------------------
  document.addEventListener('DOMContentLoaded', initSearch);
})();
