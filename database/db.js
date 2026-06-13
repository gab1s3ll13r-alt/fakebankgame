// ============================================================
// database/db.js
// Connexion a la base SQLite + initialisation automatique
// (creation des tables, banque par defaut, compte admin)
// ============================================================

const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');
const bcrypt = require('bcrypt');
require('dotenv').config();

const DB_PATH = process.env.DB_PATH
  ? path.resolve(__dirname, '..', process.env.DB_PATH)
  : path.resolve(__dirname, 'banque.db');

const INIT_SQL_PATH = path.resolve(__dirname, 'init.sql');

const BCRYPT_ROUNDS = 12;

// ------------------------------------------------------------
// Ouverture / creation de la base
// ------------------------------------------------------------
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ------------------------------------------------------------
// Generation IBAN fictif unique
// Format: FRP0 BANKCODE XXXX XXXX XXXX (groupes de 4)
// ------------------------------------------------------------
function generateRandomDigits(length) {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += Math.floor(Math.random() * 10).toString();
  }
  return result;
}

function generateIban(bankCode) {
  const code = (bankCode || 'BRP0').toUpperCase().padEnd(4, '0').slice(0, 4);
  const part1 = generateRandomDigits(4);
  const part2 = generateRandomDigits(4);
  const part3 = generateRandomDigits(4);
  const part4 = generateRandomDigits(4);
  return `FRP0${code}${part1}${part2}${part3}${part4}`;
}

function generateUniqueIban(bankCode) {
  let iban;
  let exists = true;
  const checkStmt = db.prepare('SELECT 1 FROM accounts WHERE iban = ?');
  do {
    iban = generateIban(bankCode);
    exists = !!checkStmt.get(iban);
  } while (exists);
  return iban;
}

// ------------------------------------------------------------
// Initialisation du schema (execution du fichier init.sql)
// ------------------------------------------------------------
function initSchema() {
  const sql = fs.readFileSync(INIT_SQL_PATH, 'utf8');
  db.exec(sql);
}

// ------------------------------------------------------------
// Creation de la banque par defaut si elle n'existe pas
// ------------------------------------------------------------
function ensureDefaultBank() {
  const bankName = process.env.DEFAULT_BANK_NAME || 'Banque Centrale RP';
  const bankCode = (process.env.DEFAULT_BANK_CODE || 'BRP0').toUpperCase().slice(0, 4);

  const existing = db.prepare('SELECT * FROM banks WHERE code = ?').get(bankCode);
  if (existing) {
    return existing;
  }

  const insert = db.prepare('INSERT INTO banks (name, code) VALUES (?, ?)');
  const info = insert.run(bankName, bankCode);

  return db.prepare('SELECT * FROM banks WHERE id = ?').get(info.lastInsertRowid);
}

// ------------------------------------------------------------
// Creation du compte administrateur par defaut si aucun admin
// n'existe encore dans la base
// ------------------------------------------------------------
function ensureAdminUser(defaultBank) {
  const adminExists = db.prepare("SELECT 1 FROM users WHERE role = 'admin' LIMIT 1").get();
  if (adminExists) {
    return;
  }

  const username = process.env.ADMIN_USERNAME || 'admin';
  const password = process.env.ADMIN_PASSWORD || 'Admin1234!';
  const email = process.env.ADMIN_EMAIL || 'admin@banque-rp.local';

  const usernameTaken = db.prepare('SELECT 1 FROM users WHERE username = ?').get(username);
  if (usernameTaken) {
    console.warn(
      `[DB INIT] Le nom d'utilisateur admin "${username}" existe deja mais sans role admin. ` +
      `Aucun compte admin n'a ete cree automatiquement.`
    );
    return;
  }

  const passwordHash = bcrypt.hashSync(password, BCRYPT_ROUNDS);

  const insertUser = db.prepare(`
    INSERT INTO users (username, email, password_hash, display_name, role, has_tpe, is_active)
    VALUES (?, ?, ?, ?, 'admin', 0, 1)
  `);

  const userInfo = insertUser.run(username, email, passwordHash, 'Administrateur');
  const userId = userInfo.lastInsertRowid;

  const iban = generateUniqueIban(defaultBank.code);

  const insertAccount = db.prepare(`
    INSERT INTO accounts (user_id, bank_id, iban, balance, currency)
    VALUES (?, ?, ?, ?, ?)
  `);

  insertAccount.run(userId, defaultBank.id, iban, 0, process.env.CURRENCY_CODE || 'EUR');

  console.log('============================================================');
  console.log('[DB INIT] Compte administrateur cree automatiquement :');
  console.log(`  Identifiant : ${username}`);
  console.log(`  Mot de passe : ${password}`);
  console.log('  -> Pensez a changer ce mot de passe apres connexion.');
  console.log('============================================================');
}

// ------------------------------------------------------------
// Lancement de l'initialisation complete
// ------------------------------------------------------------
function initializeDatabase() {
  initSchema();
  const defaultBank = ensureDefaultBank();
  ensureAdminUser(defaultBank);
}

initializeDatabase();

// ------------------------------------------------------------
// Helpers exportes pour le reste de l'application
// ------------------------------------------------------------

/**
 * Cree un compte bancaire pour un utilisateur dans la banque par defaut.
 * Retourne la ligne du compte cree.
 */
function createAccountForUser(userId, initialBalance = 0) {
  const bankCode = (process.env.DEFAULT_BANK_CODE || 'BRP0').toUpperCase().slice(0, 4);
  let bank = db.prepare('SELECT * FROM banks WHERE code = ?').get(bankCode);

  if (!bank) {
    bank = ensureDefaultBank();
  }

  const iban = generateUniqueIban(bank.code);

  const insertAccount = db.prepare(`
    INSERT INTO accounts (user_id, bank_id, iban, balance, currency)
    VALUES (?, ?, ?, ?, ?)
  `);

  const currency = process.env.CURRENCY_CODE || 'EUR';
  const info = insertAccount.run(userId, bank.id, iban, initialBalance, currency);

  return db.prepare('SELECT * FROM accounts WHERE id = ?').get(info.lastInsertRowid);
}

/**
 * Recupere la liste de toutes les banques disponibles.
 */
function getAllBanks() {
  return db.prepare('SELECT * FROM banks ORDER BY id ASC').all();
}

/**
 * Insere une ligne dans le journal d'activite.
 */
function logActivity({ actorUserId = null, action, targetUserId = null, details = null, ipAddress = null }) {
  const stmt = db.prepare(`
    INSERT INTO activity_logs (actor_user_id, action, target_user_id, details, ip_address)
    VALUES (?, ?, ?, ?, ?)
  `);
  stmt.run(actorUserId, action, targetUserId, details ? JSON.stringify(details) : null, ipAddress);
}

module.exports = {
  db,
  generateUniqueIban,
  createAccountForUser,
  getAllBanks,
  logActivity,
};
