import { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) { 
      alert(err.response?.data?.error || 'Ошибка входа. Проверь email и пароль.'); 
    }
  };

  return (
    <main className="auth-screen">
      <section className="auth-card">
        <div style={{textAlign:'center'}}><span className="brand-mark">F</span></div>
        <h1>С возвращением!</h1>
        <p className="subtitle">Войдите в свой аккаунт FitTrack</p>
        <div className="tabs">
          <button className="tab active">Вход</button>
          <Link to="/register" className="tab">Регистрация</Link>
        </div>
        <form onSubmit={handleSubmit}>
          <label>Email</label>
          <input type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
          <label>Пароль</label>
          <input type="password" placeholder="Введите пароль" value={password} onChange={e => setPassword(e.target.value)} required />
          <button type="submit" className="btn btn-primary" style={{marginTop: 20}}>Войти в систему</button>
        </form>
      </section>
    </main>
  );
}
