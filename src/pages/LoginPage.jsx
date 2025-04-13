import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';

const LoginPage = ({ onLogin }) => {
  const { theme } = useTheme();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  
  const handleLogin = (e) => {
    e.preventDefault();
    
    // Проверяем учетные данные
    if ((username === 'admin' && password === 'password') || 
        (username === localStorage.getItem('userEmail') && password === localStorage.getItem('userPassword'))) {
      
      // Сохраняем информацию о входе и пользователе в localStorage
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('userEmail', username);
      localStorage.setItem('userPassword', password);
      
      // Вызываем функцию обратного вызова для обновления состояния в родительском компоненте
      onLogin();
      
      // Перенаправляем на главную страницу
      navigate('/');
    } else {
      setError('Неверное имя пользователя или пароль');
    }
  };
  
  return (
    <div className="flex flex-col items-center justify-center h-screen" style={{ backgroundColor: theme.bg }}>
      <div 
        className="w-full max-w-md p-6 rounded-xl"
        style={{ backgroundColor: theme.card }}
      >
        <h1 
          className="text-2xl font-bold mb-6 text-center"
          style={{ color: theme.textPrimary }}
        >
          Вход в систему
        </h1>
        
        {error && (
          <div 
            className="mb-4 p-3 rounded text-center"
            style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#ef4444' }}
          >
            {error}
          </div>
        )}
        
        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label 
              className="block mb-2"
              style={{ color: theme.textSecondary }}
            >
              Email
            </label>
            <input 
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-3 rounded"
              style={{ 
                backgroundColor: theme.inputBg, 
                color: theme.textPrimary,
                border: 'none'
              }}
              required
            />
          </div>
          
          <div className="mb-6">
            <label 
              className="block mb-2"
              style={{ color: theme.textSecondary }}
            >
              Пароль
            </label>
            <input 
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 rounded"
              style={{ 
                backgroundColor: theme.inputBg, 
                color: theme.textPrimary,
                border: 'none'
              }}
              required
            />
          </div>
          
          <button 
            type="submit"
            className="w-full py-3 rounded font-bold"
            style={{ backgroundColor: theme.accent, color: '#ffffff' }}
          >
            Войти
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage; 