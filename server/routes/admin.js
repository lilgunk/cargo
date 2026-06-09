const express = require('express');
const db = require('../db');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();
router.use(requireAdmin);

router.get('/users', (req, res) => {
  const users = db.prepare(
    'SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC'
  ).all();
  res.json({ users });
});

router.get('/stats', (req, res) => {
  const total = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  const admins = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'admin'").get().count;
  const recent = db.prepare(
    "SELECT COUNT(*) as count FROM users WHERE created_at >= datetime('now', '-7 days')"
  ).get().count;
  const latest = db.prepare(
    'SELECT name, email, created_at FROM users ORDER BY created_at DESC LIMIT 5'
  ).all();
  res.json({ total, admins, recent, latest });
});

router.delete('/users/:id', (req, res) => {
  const id = Number(req.params.id);
  if (id === req.user.id) {
    return res.status(400).json({ error: 'Нельзя удалить себя' });
  }
  const result = db.prepare('DELETE FROM users WHERE id = ?').run(id);
  if (result.changes === 0) return res.status(404).json({ error: 'Пользователь не найден' });
  res.json({ ok: true });
});

router.patch('/users/:id/role', (req, res) => {
  const id = Number(req.params.id);
  const { role } = req.body;
  if (!['admin', 'user'].includes(role)) {
    return res.status(400).json({ error: 'Роль должна быть admin или user' });
  }
  if (id === req.user.id) {
    return res.status(400).json({ error: 'Нельзя изменить свою роль' });
  }
  const result = db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, id);
  if (result.changes === 0) return res.status(404).json({ error: 'Пользователь не найден' });
  res.json({ ok: true });
});

module.exports = router;
