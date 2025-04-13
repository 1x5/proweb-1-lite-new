import React, { createContext, useState, useContext } from 'react';

// Создаем контекст темы
const ThemeContext = createContext();

// Хук для использования темы в компонентах
export const useTheme = () => useContext(ThemeContext);

// Провайдер темы
export const ThemeProvider = ({ children }) => {
  // Получаем сохраненное значение темы из localStorage или используем темную тему по умолчанию
  const [darkMode, setDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('darkMode');
    return savedTheme !== null ? savedTheme === 'true' : true;
  });
  
  // Функция для переключения темы
  const toggleDarkMode = () => {
    setDarkMode(prevMode => {
      const newMode = !prevMode;
      localStorage.setItem('darkMode', newMode.toString());
      return newMode;
    });
  };
  
  // Объект с цветами темы
  const theme = {
    bg: darkMode ? '#121212' : '#ffffff',
    card: darkMode ? '#252525' : '#f8f9fa',
    innerCard: darkMode ? '#333333' : '#ffffff',
    cardBorder: darkMode ? '#333333' : '#e0e0e0',
    textPrimary: darkMode ? '#e0e0e0' : '#333333',
    textSecondary: darkMode ? '#808080' : '#606060',
    accent: darkMode ? '#7c3aed' : '#333333',
    green: darkMode ? '#4ade80' : '#16a34a',
    red: darkMode ? '#ef4444' : '#dc2626',
    navBg: darkMode ? '#1a1a1a' : '#f0f0f0',
    inputBg: darkMode ? '#444444' : '#f0f0f0'
  };
  
  return (
    <ThemeContext.Provider value={{ darkMode, toggleDarkMode, theme }}>
      {children}
    </ThemeContext.Provider>
  );
}; 