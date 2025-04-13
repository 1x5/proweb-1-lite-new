#!/bin/bash

# Задаем порт и путь к проекту
PORT=3000
PROJECT_DIR="/Users/ff/proweb-1-lite-new"
LOG_FILE="$PROJECT_DIR/error_log.txt"
BROWSER_ERROR_LOG="$PROJECT_DIR/browser_errors.txt"

# Отображаем начальное сообщение
echo "===== Запуск проекта ====="
echo "Проект: $PROJECT_DIR"
echo "Порт: $PORT"
echo "Лог ошибок: $LOG_FILE"
echo "Лог ошибок браузера: $BROWSER_ERROR_LOG"
echo ""

# Создаем файл логов, если его нет
touch "$LOG_FILE"
touch "$BROWSER_ERROR_LOG"
echo "Запуск приложения $(date)" >> "$LOG_FILE"

# Проверка существования директории проекта
if [ ! -d "$PROJECT_DIR" ]; then
  echo "ОШИБКА: Директория проекта $PROJECT_DIR не существует" | tee -a "$LOG_FILE"
  exit 1
fi

# Проверяем, запущен ли процесс на порту 3000
PID=$(lsof -ti:$PORT)
if [ ! -z "$PID" ]; then
  echo "Обнаружен процесс на порту $PORT (PID: $PID)"
  echo "Останавливаем процесс..."
  kill -9 $PID
  echo "Процесс остановлен"
fi

# Переходим в директорию проекта
echo "Переходим в директорию проекта: $PROJECT_DIR"
cd "$PROJECT_DIR" || {
  echo "ОШИБКА: Не удалось перейти в директорию проекта $PROJECT_DIR" | tee -a "$LOG_FILE"
  exit 1
}

# Проверяем наличие необходимых файлов
if [ ! -f "$PROJECT_DIR/package.json" ]; then
  echo "ОШИБКА: Не найден файл package.json в $PROJECT_DIR" | tee -a "$LOG_FILE"
  exit 1
fi

# Проверяем доступность npm
if ! command -v npm &> /dev/null; then
  echo "ОШИБКА: npm не установлен" | tee -a "$LOG_FILE"
  exit 1
fi

# Проверяем папку node_modules
if [ ! -d "$PROJECT_DIR/node_modules" ]; then
  echo "Папка node_modules не найдена, устанавливаем зависимости..."
  npm install 2>&1 | tee -a "$LOG_FILE"
  if [ $? -ne 0 ]; then
    echo "ОШИБКА: Не удалось установить зависимости" | tee -a "$LOG_FILE"
    exit 1
  fi
fi

# Создаем файл для логирования ошибок с фронтенда
cat > "$PROJECT_DIR/public/error-logger.js" << 'EOL'
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
EOL

# Создаем Express сервер для логирования ошибок
cat > "$PROJECT_DIR/server.js" << 'EOL'
const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const app = express();
const PORT = 3001;

// Путь к файлу логов
const errorLogFile = path.join(__dirname, 'browser_errors.txt');

// Middleware для парсинга JSON
app.use(bodyParser.json());

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Methods', 'POST');
    return res.status(200).json({});
  }
  next();
});

// Эндпоинт для логирования ошибок
app.post('/api/log-error', (req, res) => {
  const errorData = req.body;
  const logEntry = `[${errorData.timestamp}] ${errorData.message}\n` +
                   `Source: ${errorData.source || 'N/A'}\n` +
                   `Line: ${errorData.lineno || 'N/A'}, Column: ${errorData.colno || 'N/A'}\n` +
                   `Stack: ${errorData.stack || errorData.reason || 'N/A'}\n` +
                   '----------------------------------------------\n';
  
  fs.appendFile(errorLogFile, logEntry, (err) => {
    if (err) {
      console.error('Failed to write to error log:', err);
      return res.status(500).json({ success: false });
    }
    console.log('Browser error logged');
    res.json({ success: true });
  });
});

app.listen(PORT, () => {
  console.log(`Error logger server running on port ${PORT}`);
});
EOL

# Запускаем Express сервер для логирования в фоне
echo "Запускаем сервер логирования ошибок..."
node server.js >> "$LOG_FILE" 2>&1 &
LOGGER_PID=$!
echo "Сервер логирования запущен (PID: $LOGGER_PID)"

# Создаем файл для добавления скрипта логирования в index.html
if [ -f "$PROJECT_DIR/public/index.html" ]; then
  # Проверяем, нет ли уже нашего скрипта
  if ! grep -q "error-logger.js" "$PROJECT_DIR/public/index.html"; then
    echo "Добавляем скрипт логирования в index.html..."
    sed -i.bak '/<\/head>/ i\
    <script src="/error-logger.js"></script>' "$PROJECT_DIR/public/index.html"
  fi
fi

# Запускаем проект с перенаправлением ошибок в лог-файл
echo "Запускаем проект из директории: $(pwd)..."
echo "Логирование ошибок активировано. Ошибки браузера будут сохраняться в $BROWSER_ERROR_LOG"
npm start 2>&1 | tee -a "$LOG_FILE" 