const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { JWT_SECRET } = require('../middleware/auth');

const router = express.Router();
const ADMIN_EMAIL = 'admin@loadopti.com';

router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Все поля обязательны' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Пароль минимум 6 символов' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    return res.status(409).json({ error: 'Email уже зарегистрирован' });
  }

  const hashed = await bcrypt.hash(password, 10);
  const role = email === ADMIN_EMAIL ? 'admin' : 'user';
  const result = db.prepare(
    'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)'
  ).run(name, email, hashed, role);

  const token = jwt.sign(
    { id: result.lastInsertRowid, email, name, role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
  res.status(201).json({ token, user: { id: result.lastInsertRowid, name, email, role } });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Введите email и пароль' });
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user) {
    return res.status(401).json({ error: 'Неверный email или пароль' });
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return res.status(401).json({ error: 'Неверный email или пароль' });
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, name: user.name, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

router.get('/me', (req, res) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Не авторизован' });
  }
  try {
    const payload = jwt.verify(auth.slice(7), JWT_SECRET);
    const user = db.prepare('SELECT id, name, email, role FROM users WHERE id = ?').get(payload.id);
    if (!user) return res.status(401).json({ error: 'Пользователь не найден' });
    res.json({ user });
  } catch {
    res.status(401).json({ error: 'Недействительный токен' });
  }
});

module.exports = router;
