// ============================================================
// server.js
// Point d'entree de l'application "Banque RP".
//
// - Configure Express, les sessions (persistees en SQLite via
//   connect-sqlite3), les middlewares globaux (logger, JSON
//   parsing, securite minimale).
// - Initialise la base de donnees (via require('./database/db'),
//   qui execute son initialisation au chargement du module).
// - Monte toutes les routes API sous /api/...
// - Sert les fichiers statiques du frontend (dossier /public).
// - Gere les erreurs 404 et les erreurs globales.
//
// Application destinee a un usage local/prive (jeu de role),
// exposable via Pinggy.io pour un acces multi-joueurs.
// ============================================================

const path = require('path');
const express = require('express');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
require('dotenv').config();

// L'import de database/db declenche l'initialisation complete
// de la base (schema, banque par defaut, compte admin) au tout
// premier demarrage.
const { db } = require('./database/db');

const logger = require('./utils/logger');

const authRoutes = require('./routes/auth');
const accountRoutes = require('./routes/account');
const transactionsRoutes = require('./routes/transactions');
const usersRoutes = require('./routes/users');
const tpeRoutes = require('./routes/tpe');
const employeeRoutes = require('./routes/employee');
const adminRoutes = require('./routes/admin');

const app = express();

const PORT = parseInt(process.env.PORT, 10) || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const isProduction = NODE_ENV === 'production';

// ------------------------------------------------------------
// Pinggy / proxy inverse
// ------------------------------------------------------------
// Pinggy.io agit comme un proxy inverse devant le serveur local.
// 'trust proxy' permet a Express de lire correctement les
// en-tetes X-Forwarded-* (notamment pour req.ip, utilise dans
// le journal d'activite).
app.set('trust proxy', 1);

// ------------------------------------------------------------
// Middlewares globaux
// ------------------------------------------------------------

// Logger de requetes (methode, URL, statut, duree, IP)
app.use(logger.requestLogger());

// Parsing du corps des requetes en JSON et URL-encoded
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// En-tetes de securite minimaux (sans dependance externe type helmet)
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'same-origin');
  next();
});

// ------------------------------------------------------------
// Sessions
// ------------------------------------------------------------
// Les sessions sont persistees dans une base SQLite separee
// (database/sessions.db), pour survivre aux redemarrages du
// serveur pendant une partie de longue duree.

const sessionDbDir = path.dirname(
  path.resolve(__dirname, process.env.SESSION_DB_PATH || './database/sessions.db')
);
const sessionDbFile = path.basename(
  process.env.SESSION_DB_PATH || './database/sessions.db'
);

app.use(
  session({
    store: new SQLiteStore({
      db: sessionDbFile,
      dir: sessionDbDir,
      table: 'sessions',
    }),
    secret: process.env.SESSION_SECRET || 'change-this-secret-key',
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
      httpOnly: true,
      // 'secure' force HTTPS-only cookies. Pinggy expose le
      // tunnel en HTTPS, mais l'acces local direct (localhost)
      // se fait en HTTP. En developpement on laisse 'secure'
      // a false pour permettre les deux cas ; en production,
      // si vous n'accedez QUE via Pinggy (HTTPS), vous pouvez
      // passer NODE_ENV=production pour activer 'secure'.
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 jours
    },
  })
);

// ------------------------------------------------------------
// Routes API
// ------------------------------------------------------------
app.use('/api/auth', authRoutes);
app.use('/api/account', accountRoutes);
app.use('/api/transactions', transactionsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/tpe', tpeRoutes);
app.use('/api/employee', employeeRoutes);
app.use('/api/admin', adminRoutes);

// ------------------------------------------------------------
// Fichiers statiques (frontend)
// ------------------------------------------------------------
const publicDir = path.join(__dirname, 'public');
app.use(express.static(publicDir));

// ------------------------------------------------------------
// Fallback SPA-like : pour toute route GET non-API qui ne
// correspond pas a un fichier statique existant, on sert
// index.html (permet de naviguer directement vers une URL
// type /dashboard.html sans probleme, et de gerer un eventuel
// routage cote client futur).
// ------------------------------------------------------------
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return next();
  }
  res.sendFile(path.join(publicDir, 'index.html'), (err) => {
    if (err) {
      next(err);
    }
  });
});

// ------------------------------------------------------------
// Gestion des routes API inconnues (404 JSON)
// ------------------------------------------------------------
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Route API introuvable.' });
});

// ------------------------------------------------------------
// Gestionnaire d'erreurs global
// ------------------------------------------------------------
app.use((err, req, res, next) => {
  logger.error('Erreur non gerees', { error: err, path: req.path });

  if (res.headersSent) {
    return next(err);
  }

  res.status(500).json({ error: 'Une erreur interne est survenue.' });
});

// ------------------------------------------------------------
// Demarrage du serveur
// ------------------------------------------------------------
app.listen(PORT, () => {
  logger.info('Serveur demarre', { port: PORT, env: NODE_ENV });
  console.log('============================================================');
  console.log(`  Banque RP - serveur demarre`);
  console.log(`  Local   : http://localhost:${PORT}`);
  console.log(`  Reseau  : http://0.0.0.0:${PORT}`);
  console.log('============================================================');
  console.log('  Pour rendre ce serveur accessible aux autres joueurs via');
  console.log('  Pinggy.io, voir le fichier INSTALL.md pour la commande SSH.');
  console.log('============================================================');
});

// ------------------------------------------------------------
// Arret propre (fermeture de la base SQLite)
// ------------------------------------------------------------
function shutdown(signal) {
  logger.info(`Signal ${signal} recu, arret du serveur...`);
  try {
    db.close();
  } catch (err) {
    logger.error('Erreur lors de la fermeture de la base', { error: err });
  }
  process.exit(0);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
