// Перехватчик ошибок для отправки на сервер
window.onerror = function(message, source, lineno, colno, error) {
  fetch('/api/log-error', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: message,
      source: source,
      lineno: lineno,
      colno: colno,
      stack: error ? error.stack : 'No stack trace available',
      timestamp: new Date().toISOString()
    })
  }).catch(err => console.error('Failed to log error:', err));
  
  return false; // Позволяет стандартному обработчику ошибок работать
};

// Перехватываем непойманные Promise rejection
window.addEventListener('unhandledrejection', function(event) {
  fetch('/api/log-error', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: 'Unhandled Promise Rejection',
      reason: event.reason ? (event.reason.message || String(event.reason)) : 'Unknown',
      stack: event.reason && event.reason.stack ? event.reason.stack : 'No stack trace available',
      timestamp: new Date().toISOString()
    })
  }).catch(err => console.error('Failed to log rejection:', err));
});

console.log('Error logger initialized');
