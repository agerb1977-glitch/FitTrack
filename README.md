# FitTrack

Веб-приложение для фитнеса с трекером тренировок и расчётом КБЖУ.

## Стек
- Frontend: React + Vite
- Backend: Node.js + Express
- Database: MySQL (XAMPP)

## Как запустить

1. Установи Node.js (LTS) и XAMPP
2. Запусти Apache + MySQL в XAMPP
3. Создай базу `fittrack` и импортируй `fittrack.sql`
4. В папке `server`:
   ```bash
   npm install
   node index.js
   ```
5. В папке `client`:
   ```bash
   npm install
   npm run dev
   ```
6. Открой http://localhost:5173

## Структура
- `client/` — React-фронтенд
- `server/` — Express-бэкенд
- `fittrack.sql` — схема базы данных
