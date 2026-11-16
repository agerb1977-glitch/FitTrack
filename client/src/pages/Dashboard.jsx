import { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../api/axios';

export default function Dashboard() {
  const { user, logout } = useContext(AuthContext);
  const [data, setData] = useState(null);
  const [foodsList, setFoodsList] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [toast, setToast] = useState(''); // Уведомления
  const navigate = useNavigate();

  const [workout, setWorkout] = useState({ exercise: 'Приседания', sets: 3, reps: 10, weight: 0 });
  const [food, setFood] = useState({ name: '', meal: 'Завтрак', grams: 100 });
  const [profile, setProfile] = useState({ name: '', age: 25, height: 170, weight: 65, activity: 1.2, goal: 'maintain' });

  useEffect(() => {
    if (!user) return navigate('/login');
    loadData();
    api.get('/data/foods-list').then(res => setFoodsList(res.data));
  }, [user, navigate]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const loadData = () => {
    api.get('/data/dashboard').then(res => {
      setData(res.data);
      setProfile({
        name: res.data.user.name || '', age: res.data.user.age || 25,
        height: res.data.user.height || 170, weight: res.data.user.weight || 65,
        activity: res.data.user.activity || 1.2, goal: res.data.user.goal || 'maintain'
      });
    }).catch(() => navigate('/login'));
  };

  const updateProfile = async (e) => {
    e.preventDefault();
    await api.put('/data/profile', profile);
    loadData();
    showToast('✅ Профиль обновлен!');
  };

  const addWorkout = async (e) => {
    e.preventDefault();
    await api.post('/data/workouts', workout);
    loadData();
    showToast('🏋️‍♂️ Тренировка сохранена!');
  };

  const addFood = async (e) => {
    e.preventDefault();
    if(!food.name) return showToast('❌ Выберите продукт');
    const selectedFood = foodsList.find(f => f.name === food.name);
    if (!selectedFood) return;
    const factor = food.grams / 100;
    await api.post('/data/foods', {
      name: food.name, meal: food.meal, grams: food.grams,
      calories: selectedFood.calories * factor, proteins: selectedFood.proteins * factor,
      fats: selectedFood.fats * factor, carbs: selectedFood.carbs * factor,
    });
    loadData();
    showToast('🍏 Продукт добавлен в дневник!');
  };

  const deleteFood = async (id) => {
    if(window.confirm('Удалить запись?')) {
      await api.delete('/data/foods/' + id);
      loadData();
      showToast('🗑️ Удалено');
    }
  };

  const deleteWorkout = async (id) => {
    if(window.confirm('Удалить тренировку?')) {
      await api.delete('/data/workouts/' + id);
      loadData();
      showToast('🗑️ Удалено');
    }
  };

  if (!data) return <p style={{textAlign: 'center', marginTop: 50}}>Загрузка...</p>;

  // Время суток
  const hour = new Date().getHours();
  let greeting = 'Добрый вечер';
  if (hour < 12) greeting = 'Доброе утро';
  else if (hour < 18) greeting = 'Добрый день';

  // --- ИСПРАВЛЕННЫЙ РАСЧЕТ КБЖУ ---
  const weight = Number(data.user.weight) || 65;
  const height = Number(data.user.height) || 170;
  const age = Number(data.user.age) || 25;
  const activity = Number(data.user.activity) || 1.2;
  const gender = data.user.gender || 'male';
  const goal = data.user.goal || 'maintain';

  const base = gender === 'male' 
    ? 10 * weight + 6.25 * height - 5 * age + 5 
    : 10 * weight + 6.25 * height - 5 * age - 161;
    
  let targetCalories = base * activity;
  if (goal === 'lose') targetCalories -= 300;
  if (goal === 'gain') targetCalories += 300;
  targetCalories = Math.max(1000, Math.round(targetCalories));
  
  const targets = { 
    cal: targetCalories, 
    prot: Math.round((targetCalories * 0.30) / 4), 
    fat: Math.round((targetCalories * 0.25) / 9), 
    carb: Math.round((targetCalories * 0.45) / 4) 
  };
  
  // Фикс дат: приводим дату из базы к формату YYYY-MM-DD
  const today = new Date().toISOString().slice(0, 10);
  
  const todayFoods = data.foods.filter(f => {
    if (!f.date) return false;
    return f.date.toString().slice(0, 10) === today;
  });

  const eaten = todayFoods.reduce((acc, f) => ({ 
    cal: acc.cal + (Number(f.calories) || 0), 
    prot: acc.prot + (Number(f.proteins) || 0), 
    fat: acc.fat + (Number(f.fats) || 0), 
    carb: acc.carb + (Number(f.carbs) || 0) 
  }), { cal: 0, prot: 0, fat: 0, carb: 0 });
  // ----------------------------------

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      
      {/* УВЕДОМЛЕНИЕ */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 30, right: 30, background: '#10b981', color: 'white',
          padding: '16px 24px', borderRadius: 12, fontWeight: 600, zIndex: 1000,
          boxShadow: '0 10px 25px rgba(16, 185, 129, 0.4)', animation: 'slideUp 0.3s ease'
        }}>
          {toast}
        </div>
      )}

      <header className="topbar">
        <a className="brand" href="#" onClick={(e) => { e.preventDefault(); setActiveTab('dashboard'); }}>
          <span className="brand-mark">F</span> FitTrack
        </a>
        <nav className="nav-links">
          <button className={`nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>Обзор</button>
          <button className={`nav-btn ${activeTab === 'workouts' ? 'active' : ''}`} onClick={() => setActiveTab('workouts')}>Тренировки</button>
          <button className={`nav-btn ${activeTab === 'nutrition' ? 'active' : ''}`} onClick={() => setActiveTab('nutrition')}>Питание</button>
          <button className={`nav-btn ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>Профиль</button>
        </nav>
        <button className="btn-quiet" onClick={() => { logout(); navigate('/login'); }}>Выйти</button>
      </header>

      <main className="app-main">
        {/* ОБЗОР */}
        {activeTab === 'dashboard' && (
          <section>
            <div style={{ marginBottom: 30 }}>
              <p className="eyebrow">ВАШ ДЕНЬ</p>
              <h1 className="page-title">{greeting}, {data.user.name}!</h1>
            </div>

            <div style={{ marginBottom: 20 }}>
              <p className="eyebrow">ПИТАНИЕ СЕГОДНЯ</p>
              <h2 style={{ margin: 0, fontSize: 24 }}>Баланс дня</h2>
            </div>

            <div className="progress-grid">
              <article className="progress-card">
                <div className="progress-title">Калории</div>
                <div className="progress-value"><span>{Math.round(eaten.cal)}</span><small> / {targets.cal} ккал</small></div>
                <div className="progress-bar"><div className="progress-fill" style={{width: `${Math.min(100, (eaten.cal/targets.cal)*100)}%`}}></div></div>
              </article>
              <article className="progress-card">
                <div className="progress-title">Белки</div>
                <div className="progress-value"><span>{Math.round(eaten.prot)}</span><small> / {targets.prot} г</small></div>
                <div className="progress-bar"><div className="progress-fill proteins" style={{width: `${Math.min(100, (eaten.prot/targets.prot)*100)}%`}}></div></div>
              </article>
              <article className="progress-card">
                <div className="progress-title">Жиры</div>
                <div className="progress-value"><span>{Math.round(eaten.fat)}</span><small> / {targets.fat} г</small></div>
                <div className="progress-bar"><div className="progress-fill fats" style={{width: `${Math.min(100, (eaten.fat/targets.fat)*100)}%`}}></div></div>
              </article>
              <article className="progress-card">
                <div className="progress-title">Углеводы</div>
                <div className="progress-value"><span>{Math.round(eaten.carb)}</span><small> / {targets.carb} г</small></div>
                <div className="progress-bar"><div className="progress-fill carbs" style={{width: `${Math.min(100, (eaten.carb/targets.carb)*100)}%`}}></div></div>
              </article>
            </div>

            <div style={{ display: 'flex', gap: 15, marginBottom: 40 }}>
              <button className="btn btn-primary" style={{ width: 'auto' }} onClick={() => setActiveTab('workouts')}>＋ Записать тренировку</button>
              <button className="btn btn-secondary" onClick={() => setActiveTab('nutrition')}>＋ Добавить еду</button>
            </div>

            <div style={{ marginBottom: 15 }}>
              <p className="eyebrow">ПОСЛЕДНИЕ ТРЕНИРОВКИ</p>
            </div>
            <div className="list">
              {data.workouts.length === 0 ? <p style={{ color: 'var(--text-muted)' }}>Пока нет записей.</p> : 
                data.workouts.slice(0, 3).map(w => (
                  <article className="list-item" key={w.id}>
                    <span className="item-icon">🔥</span>
                    <div className="info">
                      <div className="title">{w.exercise}</div>
                      <div className="meta">{w.date} · {w.sets} подхода × {w.reps} · {w.weight} кг</div>
                    </div>
                  </article>
                ))
              }
            </div>
          </section>
        )}

        {/* ТРЕНИРОВКИ */}
        {activeTab === 'workouts' && (
          <section>
            <h1 className="page-title">Тренировки</h1>
            <form className="card" onSubmit={addWorkout} style={{ marginBottom: 30 }}>
              <h3 style={{ marginTop: 0, marginBottom: 20 }}>Добавить тренировку</h3>
              <div className="form-grid">
                <div>
                  <label>Упражнение</label>
                  <select value={workout.exercise} onChange={e => setWorkout({...workout, exercise: e.target.value})}>
                    <option value="Приседания">Приседания</option>
                    <option value="Жим лёжа">Жим лёжа</option>
                    <option value="Подтягивания">Подтягивания</option>
                    <option value="Бег">Бег</option>
                  </select>
                </div>
                <div><label>Подходы</label><input type="number" value={workout.sets} onChange={e => setWorkout({...workout, sets: e.target.value})} /></div>
                <div><label>Повторения</label><input type="number" value={workout.reps} onChange={e => setWorkout({...workout, reps: e.target.value})} /></div>
                <div><label>Вес (кг)</label><input type="number" value={workout.weight} onChange={e => setWorkout({...workout, weight: e.target.value})} /></div>
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: 'auto', marginTop: 10 }}>Сохранить тренировку</button>
            </form>

            <h2 style={{ marginBottom: 15 }}>Вся история занятий</h2>
            <div className="list">
              {data.workouts.map(w => (
                <article className="list-item" key={w.id}>
                  <span className="item-icon">🔥</span>
                  <div className="info">
                    <div className="title">{w.exercise}</div>
                    <div className="meta">{w.date} · {w.sets} подхода × {w.reps} · {w.weight} кг</div>
                  </div>
                  <button className="delete-btn" onClick={() => deleteWorkout(w.id)}>Удалить</button>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* ПИТАНИЕ */}
        {activeTab === 'nutrition' && (
          <section>
            <h1 className="page-title">Питание</h1>
            <form className="card" onSubmit={addFood} style={{ marginBottom: 30 }}>
              <h3 style={{ marginTop: 0, marginBottom: 20 }}>Добавить продукт</h3>
              <div className="form-grid">
                <div>
                  <label>Продукт</label>
                  <select value={food.name} onChange={e => setFood({...food, name: e.target.value})} required>
                    <option value="">Выберите продукт</option>
                    {foodsList.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}
                  </select>
                </div>
                <div><label>Количество (грамм)</label><input type="number" value={food.grams} onChange={e => setFood({...food, grams: e.target.value})} /></div>
                <div>
                  <label>Приём пищи</label>
                  <select value={food.meal} onChange={e => setFood({...food, meal: e.target.value})}>
                    <option value="Завтрак">Завтрак</option>
                    <option value="Обед">Обед</option>
                    <option value="Ужин">Ужин</option>
                    <option value="Перекус">Перекус</option>
                  </select>
                </div>
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: 'auto', marginTop: 10 }}>Добавить в дневник</button>
            </form>

            <h2 style={{ marginBottom: 15 }}>Вся история питания</h2>
            <div className="list">
              {data.foods.map(f => (
                <article className="list-item" key={f.id}>
                  <span className="item-icon food">🍎</span>
                  <div className="info">
                    <div className="title">{f.name} <span style={{color: 'var(--primary)'}}>({f.grams}г)</span></div>
                    <div className="meta">{f.date} · {f.meal} · Б {Math.round(f.proteins)} / Ж {Math.round(f.fats)} / У {Math.round(f.carbs)}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
                    <span style={{ fontWeight: 800, color: 'var(--primary)' }}>{Math.round(f.calories)} ккал</span>
                    <button className="delete-btn" onClick={() => deleteFood(f.id)}>Удалить</button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* ПРОФИЛЬ */}
        {activeTab === 'profile' && (
          <section>
            <h1 className="page-title">Мой профиль</h1>
            <form className="card" onSubmit={updateProfile} style={{ maxWidth: 700 }}>
              <h3 style={{ marginTop: 0, marginBottom: 20 }}>Личные данные</h3>
              <div className="form-grid">
                <div><label>Имя</label><input type="text" value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} required /></div>
                <div><label>Возраст (лет)</label><input type="number" value={profile.age} onChange={e => setProfile({...profile, age: e.target.value})} required /></div>
                <div><label>Рост (см)</label><input type="number" value={profile.height} onChange={e => setProfile({...profile, height: e.target.value})} required /></div>
                <div><label>Вес (кг)</label><input type="number" value={profile.weight} onChange={e => setProfile({...profile, weight: e.target.value})} required /></div>
                <div>
                  <label>Уровень активности</label>
                  <select value={profile.activity} onChange={e => setProfile({...profile, activity: e.target.value})}>
                    <option value="1.2">Сидячий</option>
                    <option value="1.375">Лёгкая (1–3 тренировки)</option>
                    <option value="1.55">Средняя (3–5 тренировок)</option>
                    <option value="1.725">Высокая</option>
                  </select>
                </div>
                <div>
                  <label>Цель</label>
                  <select value={profile.goal} onChange={e => setProfile({...profile, goal: e.target.value})}>
                    <option value="lose">Снижение веса</option>
                    <option value="maintain">Поддержание</option>
                    <option value="gain">Набор массы</option>
                  </select>
                </div>
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: 'auto', marginTop: 20 }}>Сохранить в базу данных</button>
            </form>
          </section>
        )}
      </main>
    </div>
  );
}