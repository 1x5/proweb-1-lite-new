import React from 'react';
import { Home, Plus, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const BottomNavigation = () => {
  const navigate = useNavigate();
  
  return (
    <div 
      className="fixed bottom-0 left-0 right-0 h-16 flex items-center justify-around px-4"
      style={{ 
        backgroundColor: '#f0f0f0',
        borderTop: '1px solid #e0e0e0'
      }}
    >
      <button
        className="flex flex-col items-center"
        onClick={() => navigate('/')}
      >
        <Home size={24} color="#333333" />
        <span style={{ color: '#333333', fontSize: '0.75rem', marginTop: '2px' }}>Главная</span>
      </button>
      
      <button
        className="flex flex-col items-center"
        onClick={() => navigate('/order/new')}
      >
        <div 
          className="w-12 h-12 rounded-full flex items-center justify-center"
          style={{ backgroundColor: '#333333' }}
        >
          <Plus size={24} color="#ffffff" />
        </div>
      </button>
      
      <button
        className="flex flex-col items-center"
        onClick={() => navigate('/settings')}
      >
        <Settings size={24} color="#333333" />
        <span style={{ color: '#333333', fontSize: '0.75rem', marginTop: '2px' }}>Настройки</span>
      </button>
    </div>
  );
};

export default BottomNavigation; 