// ============================================================
// public/js/auth.js
// Gestion login + register + validation formulaires
// ============================================================

(function () {
  'use strict';

  // ----------------------------------------------------------
  // Helpers UI
  // ----------------------------------------------------------

  function qs(sel) {
    return document.querySelector(sel);
  }

  function setLoading(btn, state) {
    if (!btn) return;
    btn.disabled = state;
    btn.dataset.loading = state ? 'true' : 'false';
  }

  function showError(el, msg) {
    if (!el) return;
    el.textContent = msg;
    el.style.display = msg ? 'block' : 'none';
  }

  // ----------------------------------------------------------
  // Vérification session au chargement
  // ----------------------------------------------------------

  async function checkSession() {
    try {
      const res = await window.API.auth.me();
      if (res.status === 200) {
        window.location.href = '/dashboard.html';
      }
    } catch (e) {
      // ignore
    }
  }

  // ----------------------------------------------------------
  // LOGIN
  // ----------------------------------------------------------

  async function handleLogin(e) {
    e.preventDefault();

    const btn = qs('#loginBtn');
    const identifier = qs('#identifier').value.trim();
    const password = qs('#password').value;

    const errorBox = qs('#loginError');

    showError(errorBox, '');
    setLoading(btn, true);

    const res = await window.API.auth.login(identifier, password);

    setLoading(btn, false);

    if (res.status === 200) {
      window.location.href = '/dashboard.html';
      return;
    }

    showError(errorBox, res.error || 'Erreur de connexion');
  }

  // ----------------------------------------------------------
  // REGISTER
  // ----------------------------------------------------------

  function validateRegister(data) {
    if (!data.username || data.username.length < 3) {
      return 'Username trop court';
    }

    if (!data.email || !data.email.includes('@')) {
      return 'Email invalide';
    }

    if (!data.password || data.password.length < 6) {
      return 'Mot de passe trop court';
    }

    if (data.password !== data.confirmPassword) {
      return 'Les mots de passe ne correspondent pas';
    }

    return null;
  }

  async function handleRegister(e) {
    e.preventDefault();

    const btn = qs('#registerBtn');

    const data = {
      username: qs('#username').value.trim(),
      email: qs('#email').value.trim(),
      displayName: qs('#displayName').value.trim(),
      password: qs('#password').value,
      confirmPassword: qs('#confirmPassword').value,
    };

    const errorBox = qs('#registerError');

    const validationError = validateRegister(data);
    if (validationError) {
      showError(errorBox, validationError);
      return;
    }

    setLoading(btn, true);

    const res = await window.API.auth.register(data);

    setLoading(btn, false);

    if (res.status === 201) {
      window.location.href = '/dashboard.html';
      return;
    }

    showError(errorBox, res.error || 'Erreur inscription');
  }

  // ----------------------------------------------------------
  // PASSWORD STRENGTH
  // ----------------------------------------------------------

  function getStrength(password) {
    let score = 0;

    if (password.length >= 6) score++;
    if (password.length >= 10) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    return Math.min(score, 4);
  }

  function updateStrength() {
    const bar = qs('#strengthBar');
    const pwd = qs('#password').value;

    if (!bar) return;

    const strength = getStrength(pwd);
    const percent = (strength / 4) * 100;

    bar.style.width = percent + '%';

    if (percent < 40) bar.style.background = 'red';
    else if (percent < 70) bar.style.background = 'orange';
    else bar.style.background = 'green';
  }

  // ----------------------------------------------------------
  // INIT
  // ----------------------------------------------------------

  function init() {
    checkSession();

    const loginForm = qs('#loginForm');
    const registerForm = qs('#registerForm');

    if (loginForm) loginForm.addEventListener('submit', handleLogin);
    if (registerForm) registerForm.addEventListener('submit', handleRegister);

    const pwdInput = qs('#password');
    if (pwdInput) pwdInput.addEventListener('input', updateStrength);
  }

  document.addEventListener('DOMContentLoaded', init);
})();
