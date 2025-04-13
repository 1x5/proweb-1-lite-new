import React from 'react';
import { Home, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';

const BottomNavigation = ({ activePage }) => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  
  return (
    <div className="fixed bottom-0 left-0 w-full flex justify-around items-center py-3 border-t" 
         style={{ backgroundColor: theme.navBg, borderColor: theme.cardBorder }}>
      <button 
        className="flex-1 p-3 flex flex-col items-center"
        onClick={() => navigate('/')}
      >
        <Home 
          size={24} 
          color={activePage === 'home' ? theme.accent : theme.textSecondary} 
        />
        <span 
          className="text-xs mt-1" 
          style={{ color: activePage === 'home' ? theme.accent : theme.textSecondary }}
        >
          Все заказы
        </span>
      </button>
      
      {/* Центральная кнопка добавления */}
      <button 
        className="rounded-full w-16 h-16 flex items-center justify-center mx-4 -mt-6 shadow-lg"
        style={{ backgroundColor: theme.accent }}
        onClick={() => navigate('/order/new')}
      >
        <Plus size={28} color="#ffffff" />
      </button>
      
      {/* Кнопка отладки в правой части */}
      <button 
        className="flex-1 p-3 flex flex-col items-center"
        onClick={() => navigate('/debug')}
      >
        <span 
          className="text-xs mt-1" 
          style={{ color: activePage === 'debug' ? theme.accent : theme.textSecondary }}
        >
          Отладка
        </span>
      </button>
    </div>
  );
};

export default BottomNavigation; 