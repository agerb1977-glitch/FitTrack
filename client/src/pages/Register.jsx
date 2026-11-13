import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', gender: 'male' });
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/register', form);
      alert('Аккаунт создан! Теперь войдите.');
      navigate('/login');
    } catch (err) { 
      alert(err.response?.data?.error || 'Ошибка регистрации'); 
    }
  };

  return (
    <main className="auth-screen">
      <section className="auth-card">
        <div style={{textAlign:'center'}}><span className="brand-mark">F</span></div>
        <h1>Создать аккаунт</h1>
        <p className="subtitle">Начните свой путь к лучшей форме</p>
        <div className="tabs">
          <Link to="/login" className="tab">Вход</Link>
          <button className="tab active">Регистрация</button>
        </div>
        <form onSubmit={handleSubmit}>
          <label>Ваше имя</label>
          <input type="text" placeholder="Александр" onChange={e => setForm({...form, name: e.target.value})} required />
          <label>Email</label>
          <input type="email" placeholder="you@example.com" onChange={e => setForm({...form, email: e.target.value})} required />
          <label>Пароль</label>
          <input type="password" placeholder="Минимум 6 символов" onChange={e => setForm({...form, password: e.target.value})} required />
          <label>Ваш пол (для расчёта нормы)</label>
          <select onChange={e => setForm({...form, gender: e.target.value})}>
            <option value="male">Мужской</option>
            <option value="female">Женский</option>
          </select>
          <button type="submit" className="btn btn-primary" style={{marginTop: 20}}>Зарегистрироваться</button>
        </form>
      </section>
    </main>
  );
}
