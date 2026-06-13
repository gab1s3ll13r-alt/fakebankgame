// ============================================================
// public/js/auth.js
// Logique login / register
// ============================================================

(function () {
  'use strict';

  // ----------------------------------------------------------
  // Helpers UI
  // ----------------------------------------------------------
  function showError(el, msg) {
    if (!el) return;
    el.textContent = msg;
    el.style.display = 'block';
  }

  function clearError(el) {
    if (!el) return;
    el.textContent = '';
    el.style.display = 'none';
  }

  function setLoading(btn, state) {
    if (!btn) return;
    btn.disabled = state;
    btn.textContent = state ? 'Chargement...' : btn.dataset.originalText;
  }

  // ----------------------------------------------------------
  // Init login
  // ----------------------------------------------------------
  async function initLogin() {
    const form = document.getElementById('loginForm');
    if (!form) return;

    const errorBox = document.getElementById('loginError');
    const btn = form.querySelector('button');

    if (btn) btn.dataset.originalText = btn.textContent;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      clearError(errorBox);
      setLoading(btn, true);

      const identifier = form.identifier.value.trim();
      const password = form.password.value;

      if (!identifier || !password) {
        showError(errorBox, 'Tous les champs sont obligatoires');
        setLoading(btn, false);
        return;
      }

      const res = await window.API.auth.login(identifier, password);

      if (res.error) {
        showError(errorBox, res.error);
        setLoading(btn, false);
        return;
      }

      window.location.href = '/dashboard.html';
    });
  }

  // ----------------------------------------------------------
  // Init register
  // ----------------------------------------------------------
  async function initRegister() {
    const form = document.getElementById('registerForm');
    if (!form) return;

    const errorBox = document.getElementById('registerError');
    const btn = form.querySelector('button');

    if (btn) btn.dataset.originalText = btn.textContent;

    function validate() {
      const username = form.username.value.trim();
      const email = form.email.value.trim();
      const password = form.password.value;
      const confirm = form.confirmPassword.value;

      if (username.length < 3) return 'Username trop court';
      if (!email.includes('@')) return 'Email invalide';
      if (password.length < 6) return 'Mot de passe trop court';
      if (password !== confirm) return 'Les mots de passe ne correspondent pas';

      return null;
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      clearError(errorBox);

      const validationError = validate();
      if (validationError) {
        showError(errorBox, validationError);
        return;
      }

      setLoading(btn, true);

      const data = {
        username: form.username.value.trim(),
        email: form.email.value.trim(),
        displayName: form.displayName.value.trim(),
        password: form.password.value,
      };

      const res = await window.API.auth.register(data);

      if (res.error) {
        showError(errorBox, res.error);
        setLoading(btn, false);
        return;
      }

      window.location.href = '/dashboard.html';
    });
  }

  // ----------------------------------------------------------
  // Password strength (simple)
  // ----------------------------------------------------------
  function initPasswordStrength() {
    const input = document.getElementById('password');
    const bar = document.getElementById('passwordStrength');

    if (!input || !bar) return;

    input.addEventListener('input', () => {
      const val = input.value;
      let score = 0;

      if (val.length >= 6) score++;
      if (val.length >= 10) score++;
      if (/[A-Z]/.test(val)) score++;
      if (/[0-9]/.test(val)) score++;

      const percent = (score / 4) * 100;
      bar.style.width = percent + '%';

      if (percent < 40) bar.style.background = 'red';
      else if (percent < 70) bar.style.background = 'orange';
      else bar.style.background = 'green';
    });
  }

  // ----------------------------------------------------------
  // Init global
  // ----------------------------------------------------------
  document.addEventListener('DOMContentLoaded', () => {
    initLogin();
    initRegister();
    initPasswordStrength();
  });
})();
