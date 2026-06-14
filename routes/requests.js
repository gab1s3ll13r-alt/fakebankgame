// ============================================================
// routes/requests.js
// Gestion des demandes bancaires utilisateur (bank_requests)
// ============================================================

const express = require('express');
const router = express.Router();

const { db } = require('../database/db');
const { requireAuth } = require('../middleware/auth');

// ------------------------------------------------------------
// CREATE request (utilisateur connecté)
// POST /api/requests
// ------------------------------------------------------------
router.post('/', requireAuth, (req, res) => {
  try {
    const userId = req.user.id;
    const { type, title, message } = req.body;

    if (!type || !title) {
      return res.status(400).json({ error: 'Champs obligatoires manquants' });
    }

    const stmt = db.prepare(`
      INSERT INTO bank_requests (user_id, type, title, message, status, created_at)
      VALUES (?, ?, ?, ?, 'open', datetime('now'))
    `);

    const result = stmt.run(
      userId,
      type,
      title,
      message || null
    );

    res.status(201).json({
      message: 'Demande créée',
      requestId: result.lastInsertRowid,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ------------------------------------------------------------
// GET my requests
// GET /api/requests/mine
// ------------------------------------------------------------
router.get('/mine', requireAuth, (req, res) => {
  try {
    const userId = req.user.id;

    const rows = db.prepare(`
      SELECT *
      FROM bank_requests
      WHERE user_id = ?
      ORDER BY created_at DESC
    `).all(userId);

    res.json({ requests: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ------------------------------------------------------------
// GET single request (optional)
// GET /api/requests/:id
// ------------------------------------------------------------
router.get('/:id', requireAuth, (req, res) => {
  try {
    const userId = req.user.id;
    const id = req.params.id;

    const request = db.prepare(`
      SELECT *
      FROM bank_requests
      WHERE id = ? AND user_id = ?
    `).get(id, userId);

    if (!request) {
      return res.status(404).json({ error: 'Demande introuvable' });
    }

    res.json({ request });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
