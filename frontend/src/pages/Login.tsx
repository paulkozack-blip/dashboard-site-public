import React, { useState } from 'react';
import { apiService } from '../services/api';
import './Login.css';

const Login: React.FC = () => {
  const [isLoginForm, setIsLoginForm] = useState(true);
  const [credentials, setCredentials] = useState({ 
    username: '', 
    password: '',
    inviteCode: '' // camelCase для input
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      if (isLoginForm) {
        // Логин
        const response = await apiService.login({
          username: credentials.username,
          password: credentials.password
        });
        localStorage.setItem('authToken', response.access_token);
        window.location.reload();
      } else {
        // Регистрация - преобразуем в snake_case для API
        const registerData = {
          username: credentials.username,
          password: credentials.password,
          invite_code: credentials.inviteCode // ← snake_case для бэкенда
        };
        await apiService.register(registerData);
        setMessage('Регистрация успешна! Теперь войдите в систему');
        setIsLoginForm(true);
        setCredentials({ username: '', password: '', inviteCode: '' });
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка регистрации');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleSubmit}>
        <h2>{isLoginForm ? 'Вход в систему' : 'Регистрация'}</h2>
        
        <div className="form-group">
          <label>Логин:</label>
          <input
            type="text"
            value={credentials.username}
            onChange={(e) => setCredentials({...credentials, username: e.target.value})}
            required
          />
        </div>

        <div className="form-group">
          <label>Пароль:</label>
          <input
            type="password"
            value={credentials.password}
            onChange={(e) => setCredentials({...credentials, password: e.target.value})}
            required
          />
        </div>

        {!isLoginForm && (
          <div className="form-group">
            <label>Инвайт-код:</label>
            <input
              type="text"
              value={credentials.inviteCode}
              onChange={(e) => setCredentials({...credentials, inviteCode: e.target.value})}
              required
            />
          </div>
        )}

        {error && <div className="error-message">{error}</div>}
        {message && <div className="success-message">{message}</div>}

        <button type="submit" disabled={loading}>
          {loading ? 'Загрузка...' : (isLoginForm ? 'Войти' : 'Зарегистрироваться')}
        </button>

        <div className="form-switch">
          {isLoginForm ? (
            <span>
              Нет аккаунта?{' '}
              <button 
                type="button" 
                className="link-button"
                onClick={() => setIsLoginForm(false)}
              >
                Зарегистрироваться
              </button>
            </span>
          ) : (
            <span>
              Уже есть аккаунт?{' '}
              <button 
                type="button" 
                className="link-button"
                onClick={() => setIsLoginForm(true)}
              >
                Войти
              </button>
            </span>
          )}
        </div>
      </form>
    </div>
  );
};

export default Login;