[README.md](https://github.com/user-attachments/files/34940717/README.md)
# FitTrack — Локальный трекер питания и тренировок

Полноценное веб-приложение: React (Vite) + Node.js/Express + MySQL.

## Что нужно установить

1. **Node.js LTS** — https://nodejs.org (зелёная кнопка LTS)
2. **XAMPP** — https://www.apachefriends.org (Apache + MySQL)

## Настройка базы данных

1. Запусти **XAMPP Control Panel** → Start у **Apache** и **MySQL**.
2. Нажми **Admin** напротив MySQL (откроется phpMyAdmin).
3. Слева **Создать БД** → имя `fittrack` → Создать.
4. Выбери базу `fittrack` → вкладка **Импорт** → выбери файл `fittrack.sql` → Вперёд.

## Запуск сервера (бэкенд)

```bash
cd server
npm install
node index.js
```

Должно появиться: `🚀 СЕРВЕР ЗАПУЩЕН НА ПОРТУ 5000`

Оставь окно открытым.

## Запуск фронтенда

В новом терминале:

```bash
cd client
npm install
npm run dev
```

Открой ссылку http://localhost:5173

## Важно

- В `server/index.js` пароль MySQL захардкожен пустым (стандарт XAMPP).
- Если у MySQL есть пароль — измени в `server/index.js` строку с `password: ''`.
- Файл `.env` есть, но текущий `index.js` его не использует для подключения к БД.

## Структура

- `client/` — React + Vite
- `server/` — Express API на порту 5000
- `fittrack.sql` — схема + пример продуктов

Регистрация → Вход → Дашборд (профиль, еда, тренировки).
