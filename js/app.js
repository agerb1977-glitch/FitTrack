/* ============================================================
   ЭТО ГЛАВНЫЙ ФАЙЛ ЛОГИКИ ПРИЛОЖЕНИЯ (JavaScript)
   Здесь происходит ВСЁ: вход, сохранение данных, расчёты, показ экранов.

   ВАЖНО: сейчас данные хранятся в localStorage браузера
   (это как "мини-база данных" прямо в браузере).
   В настоящей версии (с Node.js + MySQL) эти же действия
   делались бы через запросы к серверу.
   ============================================================ */


/* ============================================================
   1. ХРАНИЛИЩЕ ДАННЫХ (имитация базы данных)
   ============================================================ */

function loadData(key) {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
}

function saveData(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

function getCurrentUser() {
    const raw = localStorage.getItem("currentUser");
    return raw ? JSON.parse(raw) : null;
}

function setCurrentUser(user) {
    localStorage.setItem("currentUser", JSON.stringify(user));
}

function clearCurrentUser() {
    localStorage.removeItem("currentUser");
}


/* ============================================================
   2. РАСЧЁТ КБЖУ (формула Миффлина–Сан Жеора)
   ============================================================ */

function calculateNorm(user) {
    const weight = Number(user.weight) || 70;
    const height = Number(user.height) || 170;
    const age = Number(user.age) || 25;
    const activity = Number(user.activity) || 1.2;
    const gender = user.gender || "female";

    let bmr;
    if (gender === "male") {
        bmr = 10 * weight + 6.25 * height - 5 * age + 5;
    } else {
        bmr = 10 * weight + 6.25 * height - 5 * age - 161;
    }

    let tdee = bmr * activity;

    if (user.goal === "lose") {
        tdee = tdee - 300;
    } else if (user.goal === "gain") {
        tdee = tdee + 300;
    }

    const proteins = Math.round((tdee * 0.30) / 4);
    const fats = Math.round((tdee * 0.25) / 9);
    const carbs = Math.round((tdee * 0.45) / 4);

    return {
        calories: Math.round(tdee),
        proteins: proteins,
        fats: fats,
        carbs: carbs
    };
}


/* ============================================================
   3. ПОКАЗ / СКРЫТИЕ ЭКРАНОВ И СТРАНИЦ
   ============================================================ */

function showAuth() {
    document.getElementById("screen-auth").classList.remove("hidden");
    document.getElementById("screen-app").classList.add("hidden");
}

function showApp() {
    document.getElementById("screen-auth").classList.add("hidden");
    document.getElementById("screen-app").classList.remove("hidden");
    updateDashboard();
    fillProfileForm();
}

function showPage(pageName) {
    document.querySelectorAll(".page").forEach(function(page) {
        page.classList.add("hidden");
    });
    document.getElementById("page-" + pageName).classList.remove("hidden");

    document.querySelectorAll(".nav-btn").forEach(function(btn) {
        btn.classList.remove("active");
        if (btn.dataset.page === pageName) {
            btn.classList.add("active");
        }
    });

    if (pageName === "workouts") renderWorkouts();
    if (pageName === "nutrition") renderFoods();
    if (pageName === "dashboard") updateDashboard();
}


/* ============================================================
   4. РЕГИСТРАЦИЯ И ВХОД
   ============================================================ */

document.getElementById("form-register").addEventListener("submit", function(event) {
    event.preventDefault();

    const name = document.getElementById("reg-name").value.trim();
    const email = document.getElementById("reg-email").value.trim().toLowerCase();
    const password = document.getElementById("reg-password").value;
    const gender = document.getElementById("reg-gender").value;

    const users = loadData("users");
    const exists = users.find(function(u) { return u.email === email; });
    if (exists) {
        alert("Такой email уже зарегистрирован");
        return;
    }

    const newUser = {
        id: Date.now(),
        name: name,
        email: email,
        password: password,
        gender: gender,
        age: 25,
        height: 170,
        weight: 65,
        activity: 1.2,
        goal: "maintain"
    };

    users.push(newUser);
    saveData("users", users);

    setCurrentUser(newUser);
    showApp();
});

document.getElementById("form-login").addEventListener("submit", function(event) {
    event.preventDefault();

    const email = document.getElementById("login-email").value.trim().toLowerCase();
    const password = document.getElementById("login-password").value;

    const users = loadData("users");
    const user = users.find(function(u) {
        return u.email === email && u.password === password;
    });

    if (!user) {
        alert("Неверный email или пароль");
        return;
    }

    setCurrentUser(user);
    showApp();
});

document.querySelectorAll(".tab").forEach(function(tab) {
    tab.addEventListener("click", function() {
        document.querySelectorAll(".tab").forEach(function(t) { t.classList.remove("active"); });
        tab.classList.add("active");

        if (tab.dataset.tab === "login") {
            document.getElementById("form-login").classList.remove("hidden");
            document.getElementById("form-register").classList.add("hidden");
        } else {
            document.getElementById("form-login").classList.add("hidden");
            document.getElementById("form-register").classList.remove("hidden");
        }
    });
});

document.getElementById("btn-logout").addEventListener("click", function() {
    clearCurrentUser();
    showAuth();
});


/* ============================================================
   5. НАВИГАЦИЯ ПО СТРАНИЦАМ
   ============================================================ */

document.querySelectorAll(".nav-btn, .quick-actions .btn").forEach(function(btn) {
    btn.addEventListener("click", function() {
        const page = btn.dataset.page;
        if (page) showPage(page);
    });
});


/* ============================================================
   6. ГЛАВНАЯ СТРАНИЦА (DASHBOARD) — ПРОГРЕСС КБЖУ
   ============================================================ */

function updateDashboard() {
    const user = getCurrentUser();
    if (!user) return;

    document.getElementById("greeting").textContent = "Привет, " + (user.name || "пользователь") + "!";

    const norm = calculateNorm(user);

    const today = new Date().toISOString().slice(0, 10);
    const allFoods = loadData("foods_" + user.id) || [];
    const todayFoods = allFoods.filter(function(f) { return f.date === today; });

    let cal = 0, prot = 0, fat = 0, carb = 0;
    todayFoods.forEach(function(f) {
        cal += f.calories;
        prot += f.proteins;
        fat += f.fats;
        carb += f.carbs;
    });

    cal = Math.round(cal);
    prot = Math.round(prot);
    fat = Math.round(fat);
    carb = Math.round(carb);

    document.getElementById("cal-current").textContent = cal;
    document.getElementById("cal-target").textContent = norm.calories;
    document.getElementById("prot-current").textContent = prot;
    document.getElementById("prot-target").textContent = norm.proteins;
    document.getElementById("fat-current").textContent = fat;
    document.getElementById("fat-target").textContent = norm.fats;
    document.getElementById("carb-current").textContent = carb;
    document.getElementById("carb-target").textContent = norm.carbs;

    document.getElementById("cal-bar").style.width = Math.min(100, (cal / norm.calories) * 100) + "%";
    document.getElementById("prot-bar").style.width = Math.min(100, (prot / norm.proteins) * 100) + "%";
    document.getElementById("fat-bar").style.width = Math.min(100, (fat / norm.fats) * 100) + "%";
    document.getElementById("carb-bar").style.width = Math.min(100, (carb / norm.carbs) * 100) + "%";
}


/* ============================================================
   7. ТРЕНИРОВКИ
   ============================================================ */

document.getElementById("btn-add-workout").addEventListener("click", function() {
    document.getElementById("workout-form").classList.remove("hidden");
    document.getElementById("workout-date").value = new Date().toISOString().slice(0, 10);
});

document.getElementById("btn-cancel-workout").addEventListener("click", function() {
    document.getElementById("workout-form").classList.add("hidden");
});

document.getElementById("btn-save-workout").addEventListener("click", function() {
    const user = getCurrentUser();
    if (!user) return;

    const workout = {
        id: Date.now(),
        date: document.getElementById("workout-date").value,
        exercise: document.getElementById("workout-exercise").value,
        sets: document.getElementById("workout-sets").value,
        reps: document.getElementById("workout-reps").value,
        weight: document.getElementById("workout-weight").value
    };

    const key = "workouts_" + user.id;
    const list = loadData(key);
    list.push(workout);
    saveData(key, list);

    document.getElementById("workout-form").classList.add("hidden");
    renderWorkouts();
});

function renderWorkouts() {
    const user = getCurrentUser();
    if (!user) return;

    const list = loadData("workouts_" + user.id);
    const container = document.getElementById("workout-list");
    container.innerHTML = "";

    if (list.length === 0) {
        container.innerHTML = "<p style='color:#64748b'>Пока нет тренировок. Нажми «+ Добавить»</p>";
        return;
    }

    list.slice().reverse().forEach(function(w) {
        const div = document.createElement("div");
        div.className = "list-item";
        div.innerHTML = `
            <div class="info">
                <div class="title">${w.exercise}</div>
                <div class="meta">${w.date} · ${w.sets}×${w.reps} · ${w.weight} кг</div>
            </div>
        `;
        container.appendChild(div);
    });
}


/* ============================================================
   8. ПИТАНИЕ
   ============================================================ */

document.getElementById("btn-add-food").addEventListener("click", function() {
    document.getElementById("food-form").classList.remove("hidden");
});

document.getElementById("btn-cancel-food").addEventListener("click", function() {
    document.getElementById("food-form").classList.add("hidden");
});

document.getElementById("btn-save-food").addEventListener("click", function() {
    const user = getCurrentUser();
    if (!user) return;

    const raw = document.getElementById("food-select").value;
    const parts = raw.split("|");
    const name = parts[0];
    const cal100 = Number(parts[1]);
    const prot100 = Number(parts[2]);
    const fat100 = Number(parts[3]);
    const carb100 = Number(parts[4]);

    const grams = Number(document.getElementById("food-grams").value) || 100;
    const meal = document.getElementById("food-meal").value;

    const factor = grams / 100;

    const item = {
        id: Date.now(),
        date: new Date().toISOString().slice(0, 10),
        name: name,
        meal: meal,
        grams: grams,
        calories: cal100 * factor,
        proteins: prot100 * factor,
        fats: fat100 * factor,
        carbs: carb100 * factor
    };

    const key = "foods_" + user.id;
    const list = loadData(key);
    list.push(item);
    saveData(key, list);

    document.getElementById("food-form").classList.add("hidden");
    renderFoods();
    updateDashboard();
});

function renderFoods() {
    const user = getCurrentUser();
    if (!user) return;

    const today = new Date().toISOString().slice(0, 10);
    const list = (loadData("foods_" + user.id) || []).filter(function(f) {
        return f.date === today;
    });

    const container = document.getElementById("food-list");
    container.innerHTML = "";

    if (list.length === 0) {
        container.innerHTML = "<p style='color:#64748b'>Сегодня ещё ничего не добавлено</p>";
        return;
    }

    list.slice().reverse().forEach(function(f) {
        const div = document.createElement("div");
        div.className = "list-item";
        div.innerHTML = `
            <div class="info">
                <div class="title">${f.name}</div>
                <div class="meta">${f.meal} · ${f.grams} г</div>
            </div>
            <div class="kcal">${Math.round(f.calories)} ккал</div>
        `;
        container.appendChild(div);
    });
}


/* ============================================================
   9. ПРОФИЛЬ
   ============================================================ */

function fillProfileForm() {
    const user = getCurrentUser();
    if (!user) return;

    document.getElementById("profile-name").value = user.name || "";
    document.getElementById("profile-gender").value = user.gender || "female";
    document.getElementById("profile-age").value = user.age || 25;
    document.getElementById("profile-height").value = user.height || 170;
    document.getElementById("profile-weight").value = user.weight || 65;
    document.getElementById("profile-activity").value = user.activity || 1.2;
    document.getElementById("profile-goal").value = user.goal || "maintain";
}

document.getElementById("btn-save-profile").addEventListener("click", function() {
    const user = getCurrentUser();
    if (!user) return;

    user.name = document.getElementById("profile-name").value.trim();
    user.gender = document.getElementById("profile-gender").value;
    user.age = Number(document.getElementById("profile-age").value);
    user.height = Number(document.getElementById("profile-height").value);
    user.weight = Number(document.getElementById("profile-weight").value);
    user.activity = Number(document.getElementById("profile-activity").value);
    user.goal = document.getElementById("profile-goal").value;

    const users = loadData("users");
    const index = users.findIndex(function(u) { return u.id === user.id; });
    if (index !== -1) {
        users[index] = user;
        saveData("users", users);
    }

    setCurrentUser(user);

    const norm = calculateNorm(user);
    document.getElementById("norm-result").classList.remove("hidden");
    document.getElementById("norm-text").innerHTML =
        norm.calories + " ккал · Белки " + norm.proteins + " г · Жиры " +
        norm.fats + " г · Углеводы " + norm.carbs + " г";

    updateDashboard();
    alert("Профиль сохранён!");
});


/* ============================================================
   10. СТАРТ ПРИЛОЖЕНИЯ
   ============================================================ */

document.addEventListener("DOMContentLoaded", function() {
    const user = getCurrentUser();
    if (user) {
        showApp();
    } else {
        showAuth();
    }
});
