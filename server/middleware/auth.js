const jwt = require('jsonwebtoken');
const db = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'cargo-planner-secret-key-2024';

function requireAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return res.status(401).json({ error: 'Не авторизован' });
  try {
    req.user = jwt.verify(auth.slice(7), JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Недействительный токен' });
  }
}

function requireAdmin(req, res, next) {
  requireAuth(req, res, () => {
    const user = db.prepare('SELECT role FROM users WHERE id = ?').get(req.user.id);
    if (user?.role !== 'admin') return res.status(403).json({ error: 'Нет доступа' });
    next();
  });
}

module.exports = { requireAuth, requireAdmin, JWT_SECRET };
