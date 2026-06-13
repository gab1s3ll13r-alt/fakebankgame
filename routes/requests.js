// ============================================================
// routes/requests.js
// Gestion des demandes bancaires utilisateur
// ============================================================

const express = require('express');
const router = express.Router();
const { db } = require('../database/db');
const { requireAuth } = require('../middleware/auth');
const { logActivity } = require('../database/db');

// ------------------------------------------------------------
// Créer une demande
// POST /api/requests
// ------------------------------------------------------------
router.post('/', requireAuth, (req, res) => {
  const userId = req.user.id;
  const { type, message } = req.body;

  if (!type || !message) {
    return res.status(400).json({ error: 'Type et message requis' });
  }

  try {
    const stmt = db.prepare(`
      INSERT INTO bank_requests (user_id, type, message, status, created_at)
      VALUES (?, ?, ?, 'pending', datetime('now'))
    `);

    const result = stmt.run(userId, type, message);

    logActivity({
      actorUserId: userId,
      action: 'request_created',
      targetUserId: null,
      details: { type, message },
      ipAddress: req.ip,
    });

    res.status(201).json({
      success: true,
      requestId: result.lastInsertRowid,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ------------------------------------------------------------
// Voir ses propres demandes
// GET /api/requests/mine
// ------------------------------------------------------------
router.get('/mine', requireAuth, (req, res) => {
  const userId = req.user.id;

  try {
    const requests = db
      .prepare(`
        SELECT id, type, message, status, created_at
        FROM bank_requests
        WHERE user_id = ?
        ORDER BY created_at DESC
      `)
      .all(userId);

    res.json({ requests });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ------------------------------------------------------------
// (option admin) voir toutes les demandes
// GET /api/requests/all
// ------------------------------------------------------------
router.get('/all', requireAuth, (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'employee') {
    return res.status(403).json({ error: 'Accès refusé' });
  }

  try {
    const requests = db.prepare(`
      SELECT br.*, u.username
      FROM bank_requests br
      JOIN users u ON u.id = br.user_id
      ORDER BY br.created_at DESC
    `).all();

    res.json({ requests });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ------------------------------------------------------------
// Mettre à jour une demande (employee/admin)
// PUT /api/requests/:id
// ------------------------------------------------------------
router.put('/:id', requireAuth, (req, res) => {
  if (!['admin', 'employee'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Accès refusé' });
  }

  const { id } = req.params;
  const { status, response } = req.body;

  if (!status) {
    return res.status(400).json({ error: 'Statut requis' });
  }

  try {
    db.prepare(`
      UPDATE bank_requests
      SET status = ?, response = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(status, response || null, id);

    logActivity({
      actorUserId: req.user.id,
      action: 'request_updated',
      targetUserId: null,
      details: { id, status },
      ipAddress: req.ip,
    });

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
