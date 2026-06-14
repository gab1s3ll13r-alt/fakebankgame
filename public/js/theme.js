// ============================================================
// public/js/theme.js
// Gestion du thème clair / sombre.
// Doit être chargé AVANT les autres scripts (dans <head>)
// pour éviter le flash de contenu non stylisé.
// ============================================================

(function () {
  'use strict';

  var STORAGE_KEY = 'banque-rp-theme';

  function getStoredTheme() {
    try {
      return localStorage.getItem(STORAGE_KEY) || null;
    } catch (e) {
      return null;
    }
  }

  function setStoredTheme(theme) {
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch (e) {}
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
  }

  // Applique le thème immédiatement (avant le rendu)
  var stored = getStoredTheme();
  var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  var initial = stored || (prefersDark ? 'dark' : 'light');
  applyTheme(initial);

  // Exposée globalement pour les boutons de toggle
  window.toggleTheme = function () {
    var current = document.documentElement.getAttribute('data-theme') || 'light';
    var next = current === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    setStoredTheme(next);
  };

  // Exposée globalement pour forcer un thème
  window.setTheme = function (theme) {
    applyTheme(theme);
    setStoredTheme(theme);
  };
})();
