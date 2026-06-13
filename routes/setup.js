const express = require('express');
const bcrypt = require('bcrypt');

const { db, createAccountForUser } = require('../database/db');

const router = express.Router();

const BCRYPT_ROUNDS = 12;

// POST /api/setup/create-admin
router.post('/create-admin', (req, res) => {
  const { code, username, password, email } = req.body;

  if (code !== process.env.ADMIN_CREATION_CODE) {
    return res.status(403).json({ error: 'Code invalide.' });
  }

  const existing = db.prepare("SELECT 1 FROM users WHERE role = 'admin'").get();
  if (existing) {
    return res.status(409).json({ error: 'Un admin existe déjà.' });
  }

  const hash = bcrypt.hashSync(password, BCRYPT_ROUNDS);

  const result = db.prepare(`
    INSERT INTO users (username, email, password_hash, display_name, role, has_tpe, is_active)
    VALUES (?, ?, ?, ?, 'admin', 0, 1)
  `).run(username, email, hash, 'Administrateur');

  const userId = result.lastInsertRowid;

  createAccountForUser(userId, 0);

  res.json({ message: 'Admin créé avec succès.' });
});

module.exports = router;
