const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = 'super_secret_key_12345';

const pool = mysql.createPool({
  host: 'localhost', user: 'root', password: '', database: 'fittrack', port: 3306
});

const auth = (req, res, next) => {
  const token = req.header('Authorization');
  if (!token) return res.status(401).json({ error: 'Нет токена' });
  try {
    const decoded = jwt.verify(token.replace('Bearer ', ''), JWT_SECRET);
    req.user = decoded;
    next();
  } catch (e) { res.status(400).json({ error: 'Неверный токен' }); }
};

// РЕГИСТРАЦИЯ
app.post('/api/register', async (req, res) => {
  const { name, email, password, gender } = req.body;
  try {
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) return res.status(400).json({ error: 'Email уже занят' });
    const hash = await bcrypt.hash(password, 10);
    const [result] = await pool.query('INSERT INTO users (email, password_hash, name, gender) VALUES (?, ?, ?, ?)', [email, hash, name, gender]);
    res.json({ id: result.insertId, name, email, gender });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ВХОД
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length === 0) return res.status(400).json({ error: 'Неверный email или пароль' });
    const valid = await bcrypt.compare(password, rows[0].password_hash);
    if (!valid) return res.status(400).json({ error: 'Неверный email или пароль' });
    const token = jwt.sign({ id: rows[0].id }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, user: { id: rows[0].id, name: rows[0].name, email: rows[0].email } });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ДАШБОРД
app.get('/api/data/dashboard', auth, async (req, res) => {
  try {
    const [user] = await pool.query('SELECT * FROM users WHERE id = ?', [req.user.id]);
    const [foods] = await pool.query('SELECT * FROM food_entries WHERE user_id = ? ORDER BY date DESC', [req.user.id]);
    const [workouts] = await pool.query('SELECT * FROM workouts WHERE user_id = ? ORDER BY date DESC', [req.user.id]);
    res.json({ user: user[0], foods, workouts });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ОБНОВИТЬ ПРОФИЛЬ
app.put('/api/data/profile', auth, async (req, res) => {
  const { name, age, height, weight, activity, goal } = req.body;
  try {
    await pool.query('UPDATE users SET name=?, age=?, height=?, weight=?, activity=?, goal=? WHERE id=?', [name, age, height, weight, activity, goal, req.user.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ТРЕНИРОВКИ
app.post('/api/data/workouts', auth, async (req, res) => {
  const { exercise, sets, reps, weight } = req.body;
  try {
    await pool.query('INSERT INTO workouts (user_id, date, exercise, sets, reps, weight) VALUES (?, CURDATE(), ?, ?, ?, ?)', [req.user.id, exercise, sets, reps, weight]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/data/workouts/:id', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM workouts WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ЕДА
app.get('/api/data/foods-list', auth, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM foods');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/data/foods', auth, async (req, res) => {
  const { name, meal, grams, calories, proteins, fats, carbs } = req.body;
  try {
    await pool.query('INSERT INTO food_entries (user_id, date, name, meal, grams, calories, proteins, fats, carbs) VALUES (?, CURDATE(), ?, ?, ?, ?, ?, ?, ?)', [req.user.id, name, meal, grams, calories, proteins, fats, carbs]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/data/foods/:id', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM food_entries WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.listen(5000, () => console.log('🚀 СЕРВЕР ЗАПУЩЕН НА ПОРТУ 5000'));
