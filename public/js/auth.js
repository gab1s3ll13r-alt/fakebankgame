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
  }

  function showError(el, msg) {
    if (!el) return;
    el.textContent = msg || '';
    el.style.display = msg ? 'block' : 'none';
  }

  // ----------------------------------------------------------
  // Vérification session au chargement
  // Redirige vers le dashboard si déjà connecté.
  // ----------------------------------------------------------
  async function checkSession() {
    try {
      const res = await window.API.auth.me();
      if (res.status === 200) {
        window.location.href = '/dashboard.html';
      }
    } catch (e) {
      // ignore — page accessible sans session
    }
  }

  // ----------------------------------------------------------
  // LOGIN
  // ----------------------------------------------------------
  async function handleLogin(e) {
    e.preventDefault();

    // login.html utilise input[name="identifier"] et input[name="password"]
    // (pas d'id="loginBtn" dans le HTML — on récupère le bouton submit)
    const form       = e.target;
    const btn        = form.querySelector('button[type="submit"]');
    const identifier = (form.identifier || qs('#identifier') || {}).value || '';
    const password   = (form.password   || qs('#password')   || {}).value || '';
    const errorBox   = qs('#loginError');

    showError(errorBox, '');
    setLoading(btn, true);

    const res = await window.API.auth.login(identifier.trim(), password);

    setLoading(btn, false);

    if (res.status === 200) {
      window.location.href = '/dashboard.html';
      return;
    }

    showError(errorBox, res.error || 'Erreur de connexion.');
  }

  // ----------------------------------------------------------
  // REGISTER
  // ----------------------------------------------------------
  function validateRegister(data) {
    if (!data.username || data.username.length < 3) {
      return 'Le nom d\'utilisateur doit faire au moins 3 caractères.';
    }
    if (!data.email || !data.email.includes('@')) {
      return 'Adresse email invalide.';
    }
    if (!data.displayName || data.displayName.length < 2) {
      return 'Le nom affiché doit faire au moins 2 caractères.';
    }
    if (!data.password || data.password.length < 8) {
      return 'Le mot de passe doit faire au moins 8 caractères.';
    }
    if (!/[A-Za-z]/.test(data.password)) {
      return 'Le mot de passe doit contenir au moins une lettre.';
    }
    if (!/[0-9]/.test(data.password)) {
      return 'Le mot de passe doit contenir au moins un chiffre.';
    }
    if (data.password !== data.confirmPassword) {
      return 'Les mots de passe ne correspondent pas.';
    }
    return null;
  }

  async function handleRegister(e) {
    if (e && e.preventDefault) e.preventDefault();

    const data = {
      username:        (qs('#username')        || {}).value?.trim()  || '',
      email:           (qs('#email')           || {}).value?.trim()  || '',
      displayName:     (qs('#displayName')     || {}).value?.trim()  || '',
      password:        (qs('#password')        || {}).value          || '',
      confirmPassword: (qs('#confirmPassword') || {}).value          || '',
    };

    const errorEl = qs('#error') || qs('#registerError');

    const validationError = validateRegister(data);
    if (validationError) {
      showError(errorEl, validationError);
      return;
    }

    showError(errorEl, '');

    const registerBtn = qs('#registerBtn') || qs('button[onclick="register()"]');
    setLoading(registerBtn, true);

    const res = await window.API.auth.register(data);

    setLoading(registerBtn, false);

    if (res.status === 201) {
      window.location.href = '/dashboard.html';
      return;
    }

    showError(errorEl, res.error || 'Erreur lors de l\'inscription.');
  }

  // Exposée globalement pour le bouton onclick="register()" de register.html
  window.register = handleRegister;

  // ----------------------------------------------------------
  // TOGGLE MOT DE PASSE
  // ----------------------------------------------------------
  window.togglePassword = function () {
    var pwd = qs('#password');
    if (!pwd) return;
    pwd.type = pwd.type === 'password' ? 'text' : 'password';
  };

  // ----------------------------------------------------------
  // PASSWORD STRENGTH
  // ----------------------------------------------------------
  function getStrength(password) {
    let score = 0;
    if (password.length >= 8)          score++;
    if (password.length >= 12)         score++;
    if (/[A-Z]/.test(password))        score++;
    if (/[0-9]/.test(password))        score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return Math.min(score, 4);
  }

  function updateStrength() {
    const bar = qs('#strengthBar');
    const pwd = qs('#password');
    if (!bar || !pwd) return;

    const strength = getStrength(pwd.value);
    const percent  = (strength / 4) * 100;
    bar.style.width = percent + '%';

    if (percent < 40)      bar.style.background = '#dc2626'; // rouge
    else if (percent < 70) bar.style.background = '#d97706'; // orange
    else                   bar.style.background = '#16a34a'; // vert
  }

  // ----------------------------------------------------------
  // INIT
  // ----------------------------------------------------------
  function init() {
    // Vérifier la session sur les pages login/register
    const loginForm    = qs('#loginForm');
    const registerForm = qs('#registerForm');

    if (loginForm || registerForm) {
      checkSession();
    }

    if (loginForm) {
      loginForm.addEventListener('submit', handleLogin);
    }

    if (registerForm) {
      registerForm.addEventListener('submit', handleRegister);
    }

    const pwdInput = qs('#password');
    if (pwdInput) {
      pwdInput.addEventListener('input', updateStrength);
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
