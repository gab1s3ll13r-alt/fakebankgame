// ============================================================
// routes/requests.js
// Gestion des demandes bancaires utilisateurs
// - Création de demande (crédit, TPE, support, autre)
// - Consultation des demandes de l'utilisateur connecté
// ============================================================

const express = require('express');
const { body, validationResult } = require('express-validator');

const { db, logActivity } = require('../database/db');
const { requireAuth } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// ------------------------------------------------------------
// POST /api/requests
// Création d'une demande utilisateur
// ------------------------------------------------------------
router.post(
  '/',
  requireAuth,
  [
    body('type')
      .isIn(['credit_request', 'tpe_request', 'support', 'other'])
      .withMessage('Type de demande invalide.'),
    body('subject')
      .trim()
      .isLength({ min: 3, max: 200 })
      .withMessage('Sujet requis (3 à 200 caractères).'),
    body('message')
      .trim()
      .isLength({ min: 5, max: 1000 })
      .withMessage('Message requis (5 à 1000 caractères).'),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation échouée.', details: errors.array() });
    }

    const { type, subject, message } = req.body;
    const userId = req.user.id;

    try {
      const result = db.prepare(`
        INSERT INTO bank_requests (user_id, type, subject, message, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, 'open', datetime('now'), datetime('now'))
      `).run(userId, type, subject, message);

      logActivity({
        actorUserId:  userId,
        action:       'request_created',
        targetUserId: userId,
        details:      { type, subject },
        ipAddress:    req.ip,
      });

      logger.info('Nouvelle demande utilisateur', { userId, type, subject });

      return res.status(201).json({
        message:   'Demande envoyée avec succès.',
        requestId: result.lastInsertRowid,
      });
    } catch (err) {
      logger.error('Erreur création demande', { error: err, userId });
      return res.status(500).json({ error: 'Erreur interne lors de la création de la demande.' });
    }
  }
);

// ------------------------------------------------------------
// GET /api/requests/mine
// Liste des demandes de l'utilisateur connecté
// ------------------------------------------------------------
router.get('/mine', requireAuth, (req, res) => {
  const userId = req.user.id;

  try {
    const requests = db.prepare(`
      SELECT id, type, subject, message, status, response, created_at, updated_at
      FROM bank_requests
      WHERE user_id = ?
      ORDER BY created_at DESC
    `).all(userId);

    return res.json({
      requests: requests.map((r) => ({
        id:        r.id,
        type:      r.type,
        subject:   r.subject,
        message:   r.message,
        status:    r.status,
        response:  r.response,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      })),
    });
  } catch (err) {
    logger.error('Erreur récupération demandes', { error: err, userId });
    return res.status(500).json({ error: 'Erreur lors de la récupération des demandes.' });
  }
});
