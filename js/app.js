/* FitTrack: клиентский демонстрационный прототип на localStorage. */
'use strict';

const STORAGE_KEYS = { users: 'users', currentUser: 'currentUser' };
const FOOD_FIELDS = ['calories', 'proteins', 'fats', 'carbs'];

function loadData(key, fallback = []) {
    try {
        const value = JSON.parse(localStorage.getItem(key));
        return value ?? fallback;
    } catch (error) {
        console.warn(`Не удалось прочитать данные ${key}`, error);
        return fallback;
    }
}

function saveData(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch (error) {
        alert('Не удалось сохранить данные. Проверьте свободное место в браузере и настройки приватности.');
        console.error(error);
        return false;
    }
}

function getCurrentUser() {
    return loadData(STORAGE_KEYS.currentUser, null);
}

function setCurrentUser(user) {
    return saveData(STORAGE_KEYS.currentUser, user);
}

function localDate(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function makeId() {
    return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function calculateNorm(user) {
    const weight = Number(user.weight);
    const height = Number(user.height);
    const age = Number(user.age);
    const activity = Number(user.activity);
    const base = user.gender === 'male'
        ? 10 * weight + 6.25 * height - 5 * age + 5
        : 10 * weight + 6.25 * height - 5 * age - 161;
    let calories = base * activity;
    if (user.goal === 'lose') calories -= 300;
    if (user.goal === 'gain') calories += 300;
    calories = Math.max(1000, calories);
    return {
        calories: Math.round(calories),
        proteins: Math.round((calories * 0.30) / 4),
        fats: Math.round((calories * 0.25) / 9),
        carbs: Math.round((calories * 0.45) / 4)
    };
}

function formatDate(value) {
    if (!value) return '';
    const date = new Date(`${value}T00:00:00`);
    return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
}

function showAuth() {
    document.getElementById('screen-auth').classList.remove('hidden');
    document.getElementById('screen-app').classList.add('hidden');
}

function showApp() {
    document.getElementById('screen-auth').classList.add('hidden');
    document.getElementById('screen-app').classList.remove('hidden');
    fillProfileForm();
    showPage('dashboard');
}

function showPage(name) {
    document.querySelectorAll('.page').forEach(page => page.classList.add('hidden'));
    const page = document.getElementById(`page-${name}`);
    if (!page) return;
    page.classList.remove('hidden');
    document.querySelectorAll('.nav-btn').forEach(button => {
        const active = button.dataset.page === name;
        button.classList.toggle('active', active);
        if (active) button.setAttribute('aria-current', 'page');
        else button.removeAttribute('aria-current');
    });
    if (name === 'dashboard') updateDashboard();
    if (name === 'workouts') renderWorkouts();
    if (name === 'nutrition') renderFoods();
}

function userKey(type, user = getCurrentUser()) {
    return user ? `${type}_${user.id}` : '';
}

function updateDashboard() {
    const user = getCurrentUser();
    if (!user) return;
    const today = localDate();
    document.getElementById('greeting').textContent = `Добро пожаловать, ${user.name || 'пользователь'}!`;
    document.getElementById('today-label').textContent = new Intl.DateTimeFormat('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date()).toLocaleUpperCase('ru-RU');
    const norm = calculateNorm(user);
    const foods = loadData(userKey('foods')).filter(item => item.date === today);
    const totals = Object.fromEntries(FOOD_FIELDS.map(field => [field, foods.reduce((sum, item) => sum + (Number(item[field]) || 0), 0)]));
    const entries = [
        ['cal', totals.calories, norm.calories],
        ['prot', totals.proteins, norm.proteins],
        ['fat', totals.fats, norm.fats],
        ['carb', totals.carbs, norm.carbs]
    ];
    entries.forEach(([prefix, current, target]) => {
        document.getElementById(`${prefix}-current`).textContent = Math.round(current);
        document.getElementById(`${prefix}-target`).textContent = target;
        document.getElementById(`${prefix}-bar`).style.width = `${Math.min(100, target ? current / target * 100 : 0)}%`;
    });
    renderDashboardWorkouts(today);
}

function emptyState(message) {
    const element = document.createElement('p');
    element.className = 'empty-state';
    element.textContent = message;
    return element;
}

function createEntry({ icon, title, meta, side, onDelete, food = false }) {
    const item = document.createElement('article');
    item.className = 'list-item';
    const badge = document.createElement('span');
    badge.className = `item-icon${food ? ' food' : ''}`;
    badge.setAttribute('aria-hidden', 'true');
    badge.textContent = icon;
    const info = document.createElement('div');
    info.className = 'info';
    const heading = document.createElement('div');
    heading.className = 'title';
    heading.textContent = title;
    const detail = document.createElement('div');
    detail.className = 'meta';
    detail.textContent = meta;
    info.append(heading, detail);
    item.append(badge, info);
    if (side || onDelete) {
        const actions = document.createElement('div');
        actions.className = 'item-side';
        if (side) {
            const sideText = document.createElement('span');
            sideText.className = 'kcal';
            sideText.textContent = side;
            actions.append(sideText);
        }
        if (onDelete) {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'delete-btn';
            button.textContent = 'Удалить';
            button.setAttribute('aria-label', `Удалить запись: ${title}`);
            button.addEventListener('click', onDelete);
            actions.append(button);
        }
        item.append(actions);
    }
    return item;
}

function renderDashboardWorkouts(today) {
    const user = getCurrentUser();
    const container = document.getElementById('dashboard-workouts');
    container.replaceChildren();
    const workouts = loadData(userKey('workouts', user)).filter(item => item.date === today);
    if (!workouts.length) {
        container.append(emptyState('На сегодня тренировок пока нет. Если занимались — добавьте запись в дневник.'));
        return;
    }
    workouts.slice().reverse().forEach(workout => {
        container.append(createEntry({ icon: '↗', title: workout.exercise, meta: `${workout.sets} подхода × ${workout.reps} · ${workout.weight} кг`, side: 'Сегодня' }));
    });
}

function renderWorkouts() {
    const user = getCurrentUser();
    if (!user) return;
    const container = document.getElementById('workout-list');
    container.replaceChildren();
    const workouts = loadData(userKey('workouts', user)).slice().sort((a, b) => b.date.localeCompare(a.date));
    if (!workouts.length) {
        container.append(emptyState('Здесь появятся ваши занятия. Нажмите «Добавить», чтобы записать первую тренировку.'));
        return;
    }
    workouts.forEach(workout => container.append(createEntry({
        icon: '↗', title: workout.exercise,
        meta: `${formatDate(workout.date)} · ${workout.sets} подхода × ${workout.reps}`,
        side: `${workout.weight} кг`,
        onDelete: () => deleteEntry('workouts', workout.id, renderWorkouts)
    })));
}

function renderFoods() {
    const user = getCurrentUser();
    if (!user) return;
    const container = document.getElementById('food-list');
    container.replaceChildren();
    const foods = loadData(userKey('foods', user)).filter(item => item.date === localDate()).slice().reverse();
    if (!foods.length) {
        container.append(emptyState('Сегодня записей пока нет. Добавьте продукт, чтобы начать вести дневник.'));
        return;
    }
    foods.forEach(food => container.append(createEntry({
        icon: '✳', title: food.name,
        meta: `${food.meal} · ${food.grams} г · Б ${Math.round(food.proteins)} г / Ж ${Math.round(food.fats)} г / У ${Math.round(food.carbs)} г`,
        side: `${Math.round(food.calories)} ккал`, food: true,
        onDelete: () => deleteEntry('foods', food.id, renderFoods)
    })));
}

function deleteEntry(type, id, callback) {
    if (!confirm('Удалить эту запись?')) return;
    const key = userKey(type);
    const updated = loadData(key).filter(item => String(item.id) !== String(id));
    if (saveData(key, updated)) {
        callback();
        updateDashboard();
    }
}

function fillProfileForm() {
    const user = getCurrentUser();
    if (!user) return;
    document.getElementById('profile-name').value = user.name || '';
    document.getElementById('profile-gender').value = user.gender || 'female';
    document.getElementById('profile-age').value = user.age || 25;
    document.getElementById('profile-height').value = user.height || 170;
    document.getElementById('profile-weight').value = user.weight || 65;
    document.getElementById('profile-activity').value = user.activity || 1.2;
    document.getElementById('profile-goal').value = user.goal || 'maintain';
    showNorm(calculateNorm(user));
}

function showNorm(norm) {
    document.getElementById('norm-text').textContent = `${norm.calories} ккал · Белки ${norm.proteins} г · Жиры ${norm.fats} г · Углеводы ${norm.carbs} г`;
    document.getElementById('norm-result').classList.remove('hidden');
}

function persistUser(user) {
    const users = loadData(STORAGE_KEYS.users);
    const index = users.findIndex(item => String(item.id) === String(user.id));
    if (index >= 0) users[index] = user;
    else users.push(user);
    return saveData(STORAGE_KEYS.users, users) && setCurrentUser(user);
}

document.getElementById('form-register').addEventListener('submit', event => {
    event.preventDefault();
    const name = document.getElementById('reg-name').value.trim();
    const email = document.getElementById('reg-email').value.trim().toLowerCase();
    const password = document.getElementById('reg-password').value;
    const gender = document.getElementById('reg-gender').value;
    const users = loadData(STORAGE_KEYS.users);
    if (users.some(user => user.email === email)) {
        alert('Этот email уже зарегистрирован. Войдите или используйте другой адрес.');
        return;
    }
    const user = { id: makeId(), name, email, password, gender, age: 25, height: 170, weight: 65, activity: 1.2, goal: 'maintain' };
    if (persistUser(user)) showApp();
});

document.getElementById('form-login').addEventListener('submit', event => {
    event.preventDefault();
    const email = document.getElementById('login-email').value.trim().toLowerCase();
    const password = document.getElementById('login-password').value;
    const user = loadData(STORAGE_KEYS.users).find(item => item.email === email && item.password === password);
    if (!user) {
        alert('Не удалось войти. Проверьте email и пароль.');
        return;
    }
    if (setCurrentUser(user)) showApp();
});

document.querySelectorAll('.tab').forEach(tab => tab.addEventListener('click', () => {
    const register = tab.dataset.tab === 'register';
    document.querySelectorAll('.tab').forEach(button => {
        const active = button === tab;
        button.classList.toggle('active', active);
        button.setAttribute('aria-selected', String(active));
    });
    document.getElementById('form-login').classList.toggle('hidden', register);
    document.getElementById('form-register').classList.toggle('hidden', !register);
}));

document.getElementById('btn-logout').addEventListener('click', () => {
    localStorage.removeItem(STORAGE_KEYS.currentUser);
    document.getElementById('form-login').reset();
    showAuth();
});

document.addEventListener('click', event => {
    const button = event.target.closest('[data-page]');
    if (button) showPage(button.dataset.page);
});

document.getElementById('btn-add-workout').addEventListener('click', () => {
    document.getElementById('workout-form').classList.remove('hidden');
    document.getElementById('workout-date').value = localDate();
});
document.getElementById('btn-cancel-workout').addEventListener('click', () => {
    document.getElementById('workout-form').reset();
    document.getElementById('workout-form').classList.add('hidden');
});
document.getElementById('workout-form').addEventListener('submit', event => {
    event.preventDefault();
    const user = getCurrentUser();
    if (!user) return;
    const workout = {
        id: makeId(), date: document.getElementById('workout-date').value,
        exercise: document.getElementById('workout-exercise').value,
        sets: Number(document.getElementById('workout-sets').value),
        reps: Number(document.getElementById('workout-reps').value),
        weight: Number(document.getElementById('workout-weight').value)
    };
    const key = userKey('workouts', user);
    const workouts = loadData(key);
    workouts.push(workout);
    if (saveData(key, workouts)) {
        event.currentTarget.reset();
        event.currentTarget.classList.add('hidden');
        renderWorkouts();
        updateDashboard();
    }
});

document.getElementById('btn-add-food').addEventListener('click', () => document.getElementById('food-form').classList.remove('hidden'));
document.getElementById('btn-cancel-food').addEventListener('click', () => {
    document.getElementById('food-form').reset();
    document.getElementById('food-form').classList.add('hidden');
});
document.getElementById('food-form').addEventListener('submit', event => {
    event.preventDefault();
    const user = getCurrentUser();
    if (!user) return;
    const [name, calories, proteins, fats, carbs] = document.getElementById('food-select').value.split('|').map((value, index) => index ? Number(value) : value);
    const grams = Number(document.getElementById('food-grams').value);
    const factor = grams / 100;
    const food = {
        id: makeId(), date: localDate(), name,
        meal: document.getElementById('food-meal').value, grams,
        calories: calories * factor, proteins: proteins * factor,
        fats: fats * factor, carbs: carbs * factor
    };
    const key = userKey('foods', user);
    const foods = loadData(key);
    foods.push(food);
    if (saveData(key, foods)) {
        event.currentTarget.reset();
        event.currentTarget.classList.add('hidden');
        renderFoods();
        updateDashboard();
    }
});

document.getElementById('profile-form').addEventListener('submit', event => {
    event.preventDefault();
    const user = getCurrentUser();
    if (!user) return;
    Object.assign(user, {
        name: document.getElementById('profile-name').value.trim(),
        gender: document.getElementById('profile-gender').value,
        age: Number(document.getElementById('profile-age').value),
        height: Number(document.getElementById('profile-height').value),
        weight: Number(document.getElementById('profile-weight').value),
        activity: Number(document.getElementById('profile-activity').value),
        goal: document.getElementById('profile-goal').value
    });
    if (!persistUser(user)) return;
    const norm = calculateNorm(user);
    showNorm(norm);
    updateDashboard();
    alert('Профиль сохранён. Дневная цель обновлена.');
});

document.addEventListener('DOMContentLoaded', () => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
        showAuth();
        return;
    }
    const latestUser = loadData(STORAGE_KEYS.users).find(user => String(user.id) === String(currentUser.id));
    if (latestUser) setCurrentUser(latestUser);
    showApp();
});
