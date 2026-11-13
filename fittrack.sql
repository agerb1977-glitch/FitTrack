CREATE DATABASE IF NOT EXISTS fittrack CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE fittrack;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  gender ENUM('male', 'female') DEFAULT 'male',
  age INT DEFAULT 25,
  height DECIMAL(5,1) DEFAULT 170,
  weight DECIMAL(5,1) DEFAULT 65,
  activity DECIMAL(3,2) DEFAULT 1.2,
  goal VARCHAR(50) DEFAULT 'maintain',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS foods (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  calories DECIMAL(8,2) NOT NULL,
  proteins DECIMAL(8,2) NOT NULL,
  fats DECIMAL(8,2) NOT NULL,
  carbs DECIMAL(8,2) NOT NULL
);

CREATE TABLE IF NOT EXISTS food_entries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  date DATE NOT NULL,
  name VARCHAR(100) NOT NULL,
  meal VARCHAR(50) NOT NULL,
  grams DECIMAL(8,2) NOT NULL,
  calories DECIMAL(8,2) NOT NULL,
  proteins DECIMAL(8,2) NOT NULL,
  fats DECIMAL(8,2) NOT NULL,
  carbs DECIMAL(8,2) NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS workouts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  date DATE NOT NULL,
  exercise VARCHAR(100) NOT NULL,
  sets INT NOT NULL,
  reps INT NOT NULL,
  weight DECIMAL(8,2) DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

INSERT INTO foods (name, calories, proteins, fats, carbs) VALUES
('Куриная грудка', 165, 31, 3.6, 0),
('Рис варёный', 130, 2.7, 0.3, 28),
('Яйцо куриное', 155, 13, 11, 1.1),
('Овсянка', 68, 2.4, 1.4, 12),
('Банан', 89, 1.1, 0.3, 23),
('Творог 5%', 121, 17, 5, 1.8),
('Гречка', 110, 4.2, 1.1, 21),
('Лосось', 208, 20, 13, 0),
('Брокколи', 34, 2.8, 0.4, 7),
('Авокадо', 160, 2, 15, 9),
('Хлеб цельнозерновой', 247, 13, 3.4, 41),
('Молоко 2.5%', 52, 2.8, 2.5, 4.7),
('Яблоко', 52, 0.3, 0.2, 14),
('Тунец', 132, 28, 1, 0),
('Картофель варёный', 87, 1.9, 0.1, 20);
