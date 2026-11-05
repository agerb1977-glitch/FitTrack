-- ============================================================
-- ЭТО ФАЙЛ ДЛЯ СОЗДАНИЯ БАЗЫ ДАННЫХ
-- Его нужно выполнить в программе MySQL (или phpMyAdmin)
-- ============================================================

CREATE DATABASE IF NOT EXISTS fittrack;
USE fittrack;

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100),
    gender ENUM('male', 'female') NOT NULL,
    birth_date DATE,
    height DECIMAL(5,1),
    weight DECIMAL(5,1),
    activity_level DECIMAL(3,2) DEFAULT 1.2,
    goal ENUM('lose', 'maintain', 'gain') DEFAULT 'maintain'
);

CREATE TABLE exercises (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    muscle_group VARCHAR(100),
    type ENUM('strength', 'cardio') DEFAULT 'strength'
);

CREATE TABLE workouts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    date DATE NOT NULL,
    duration INT,
    notes TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE workout_exercises (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workout_id INT NOT NULL,
    exercise_id INT NOT NULL,
    sets INT,
    reps INT,
    weight DECIMAL(6,2),
    FOREIGN KEY (workout_id) REFERENCES workouts(id) ON DELETE CASCADE,
    FOREIGN KEY (exercise_id) REFERENCES exercises(id)
);

CREATE TABLE foods (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    calories DECIMAL(8,2),
    proteins DECIMAL(8,2),
    fats DECIMAL(8,2),
    carbs DECIMAL(8,2)
);

CREATE TABLE meals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    date DATE NOT NULL,
    meal_type ENUM('breakfast', 'lunch', 'dinner', 'snack') NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE meal_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    meal_id INT NOT NULL,
    food_id INT NOT NULL,
    quantity DECIMAL(8,2) NOT NULL,
    FOREIGN KEY (meal_id) REFERENCES meals(id) ON DELETE CASCADE,
    FOREIGN KEY (food_id) REFERENCES foods(id)
);

INSERT INTO foods (name, calories, proteins, fats, carbs) VALUES
('Куриная грудь', 165, 31, 3.6, 0),
('Гречка', 132, 4.5, 1.1, 25),
('Яйцо куриное', 155, 13, 11, 1.1),
('Творог 5%', 121, 17, 5, 1.8),
('Банан', 89, 1.1, 0.3, 23),
('Овсянка', 68, 2.4, 1.4, 12),
('Рис', 130, 2.7, 0.3, 28),
('Яблоко', 52, 0.3, 0.2, 14);

INSERT INTO exercises (name, muscle_group, type) VALUES
('Приседания', 'Ноги', 'strength'),
('Жим лёжа', 'Грудь', 'strength'),
('Подтягивания', 'Спина', 'strength'),
('Бег', 'Кардио', 'cardio'),
('Планка', 'Кор', 'strength');
