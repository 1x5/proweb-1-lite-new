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
