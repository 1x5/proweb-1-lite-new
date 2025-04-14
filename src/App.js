import React, { useState, useEffect } from 'react';
import { 
  createBrowserRouter, 
  RouterProvider, 
  createRoutesFromElements, 
  Route,
  useNavigate,
  useLocation
} from 'react-router-dom';
import HomePage from './pages/HomePage';
import OrderDetailsPage from './pages/OrderDetailsPage';
import { ThemeProvider } from './contexts/ThemeContext';

// Компонент для страницы отладки
const DebugPage = () => {
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  useEffect(() => {
    // Получаем ошибки из localStorage
    const storedErrors = JSON.parse(localStorage.getItem('jsErrors') || '[]');
    setErrors(storedErrors);
    setLoading(false);
    
    // Также попробуем получить ошибки с сервера
    fetch('http://localhost:3001/api/errors')
      .then(response => response.json())
      .then(serverErrors => {
        // Объединяем с локальными ошибками, избегая дубликатов
        if (Array.isArray(serverErrors) && serverErrors.length > 0) {
          const mergedErrors = [...storedErrors];
          
          serverErrors.forEach(serverError => {
            // Проверяем, нет ли уже такой ошибки
            const isDuplicate = storedErrors.some(
              e => e.timestamp === serverError.timestamp && e.message === serverError.message
            );
            
            if (!isDuplicate) {
              mergedErrors.push(serverError);
            }
          });
          
          // Сортируем по времени
          mergedErrors.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
          
          setErrors(mergedErrors);
        }
      })
      .catch(err => {
        console.error('Failed to fetch errors from server:', err);
      });
  }, []);
  
  const clearErrors = () => {
    if (window.errorLogs && window.errorLogs.clearErrors) {
      window.errorLogs.clearErrors();
    } else {
      localStorage.setItem('jsErrors', '[]');
    }
    
    // Очищаем ошибки на сервере
    fetch('http://localhost:3001/api/errors', { method: 'DELETE' })
      .catch(err => console.error('Failed to clear errors on server:', err));
      
    setErrors([]);
  };
  
  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ margin: 0 }}>Панель отладки</h1>
        <div>
          <button 
            onClick={() => navigate(-1)}
            style={{ 
              padding: '8px 16px', 
              backgroundColor: '#f0f0f0', 
              border: 'none', 
              borderRadius: '4px',
              cursor: 'pointer',
              marginRight: '10px'
            }}
          >
            Назад
          </button>
          
          <button 
            onClick={clearErrors}
            style={{ 
              padding: '8px 16px', 
              backgroundColor: '#dc3545', 
              color: 'white',
              border: 'none', 
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Очистить ошибки
          </button>
        </div>
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <h2>JavaScript Ошибки</h2>
        {loading ? (
          <p>Загрузка...</p>
        ) : errors.length === 0 ? (
          <p>Ошибок не обнаружено</p>
        ) : (
          <div>
            {errors.map((error, index) => (
              <div 
                key={error.id || error.timestamp + index} 
                style={{ 
                  backgroundColor: '#f8d7da', 
                  border: '1px solid #f5c6cb',
                  borderRadius: '4px',
                  padding: '15px',
                  marginBottom: '10px'
                }}
              >
                <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                  {error.timestamp && new Date(error.timestamp).toLocaleString()} - {error.message}
                </div>
                {error.source && <div>Источник: {error.source}</div>}
                {error.url && <div>URL: {error.url}</div>}
                {(error.lineno || error.colno) && (
                  <div>Строка: {error.lineno || 'N/A'}, Колонка: {error.colno || 'N/A'}</div>
                )}
                {(error.stack || error.reason) && (
                  <div style={{ marginTop: '10px' }}>
                    <details>
                      <summary>Stack Trace</summary>
                      <pre style={{ 
                        backgroundColor: '#f8f9fa', 
                        padding: '10px', 
                        overflow: 'auto',
                        fontSize: '12px',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word'
                      }}>
                        {error.stack || error.reason || 'N/A'}
                      </pre>
                    </details>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div>
        <h2>Системная информация</h2>
        <div style={{ backgroundColor: '#e9ecef', padding: '15px', borderRadius: '4px' }}>
          <div><strong>User Agent:</strong> {navigator.userAgent}</div>
          <div><strong>URL:</strong> {window.location.href}</div>
          <div><strong>Время загрузки страницы:</strong> {document.readyState === 'complete' ? 'Загружена' : 'Загружается'}</div>
        </div>
      </div>
    </div>
  );
};

function App() {
  const router = createBrowserRouter(
    createRoutesFromElements(
      <>
        <Route path="/" element={<HomePage />} />
        <Route path="/order/:id" element={<OrderDetailsPage />} />
        <Route path="/debug" element={<DebugPage />} />
      </>
    )
  );

  return (
    <ThemeProvider>
      <RouterProvider router={router} />
    </ThemeProvider>
  );
}

export default App; 