import React, { useState, useEffect, useRef } from 'react';
import { Search, Sun, Calendar, Moon, List, LayoutGrid, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BottomNavigation from '../components/BottomNavigation';
import { getOrders, deleteOrder } from '../services/OrderService';
import { useTheme } from '../contexts/ThemeContext';

const HomePage = () => {
  const { darkMode, toggleDarkMode, theme } = useTheme();
  const [selectedFilter, setSelectedFilter] = useState('Все');
  const [orders, setOrders] = useState([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [swipedOrderId, setSwipedOrderId] = useState(null);
  const [compactMode, setCompactMode] = useState(false);
  const touchStartXRef = useRef(0);
  const touchEndXRef = useRef(0);
  const navigate = useNavigate();
  
  // Загрузка заказов при монтировании компонента
  useEffect(() => {
    const loadedOrders = getOrders();
    setOrders(loadedOrders);
    
    // Загружаем состояние компактного режима из localStorage
    const savedCompactMode = localStorage.getItem('compactMode');
    if (savedCompactMode !== null) {
      setCompactMode(savedCompactMode === 'true');
    }
  }, []);
  
  // Сохраняем состояние компактного режима в localStorage при изменении
  useEffect(() => {
    localStorage.setItem('compactMode', compactMode.toString());
  }, [compactMode]);
  
  // Фильтры для заказов
  const filters = ['Все', 'Ожидает', 'В работе', 'Выполнен'];
  
  const getStatusColor = (status) => {
    switch(status) {
      case 'Выполнен':
        return theme.green;
      case 'В работе':
        return theme.accent;
      case 'Ожидает':
        return theme.textSecondary;
      default:
        return theme.accent;
    }
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}.${month}.${year}`;
  };
  
  const handleDeleteOrder = (id) => {
    const updatedOrders = deleteOrder(id);
    setOrders(updatedOrders);
    setShowDeleteConfirm(null);
    setSwipedOrderId(null);
  };
  
  // Обработчики свайпа
  const handleTouchStart = (e, orderId) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchEndXRef.current = e.touches[0].clientX;
  };
  
  const handleTouchMove = (e, orderId) => {
    touchEndXRef.current = e.touches[0].clientX;
    
    const diff = touchStartXRef.current - touchEndXRef.current;
    
    // Если свайп влево больше 50px, показываем кнопку удаления
    if (diff > 50) {
      setSwipedOrderId(orderId);
    } else if (diff < -50) {
      // Если свайп вправо, скрываем кнопку удаления
      setSwipedOrderId(null);
    }
  };
  
  const handleTouchEnd = (e, orderId) => {
    const diff = touchStartXRef.current - touchEndXRef.current;
    
    // Если свайп влево больше 150px, показываем подтверждение удаления
    if (diff > 150) {
      setShowDeleteConfirm(orderId);
    }
  };
  
  const filteredOrders = selectedFilter === 'Все' 
    ? orders 
    : orders.filter(order => order.status === selectedFilter);
  
  // Компонент для отображения заказа в обычном режиме
  const RegularOrderCard = ({ order }) => (
    <div
      className="rounded-xl p-3 transition-transform duration-300"
      style={{ 
        backgroundColor: theme.card,
        transform: swipedOrderId === order.id ? 'translateX(-80px)' : 'translateX(0)'
      }}
      onClick={() => {
        if (swipedOrderId === order.id) {
          setSwipedOrderId(null);
        } else {
          navigate(`/order/${order.id}`);
        }
      }}
    >
      <div className="flex justify-between items-start mb-1">
        <div>
          <h2 className="text-lg font-bold" style={{ color: theme.textPrimary }}>{order.name}</h2>
          <p className="text-sm" style={{ color: theme.textSecondary }}>{order.customer}</p>
        </div>
        <span
          style={{ 
            color: '#ffffff', 
            backgroundColor: getStatusColor(order.status),
            padding: '2px 8px',
            borderRadius: '4px',
            fontSize: '0.85rem'
          }}
        >
          {order.status}
        </span>
      </div>
      
      <div className="h-px w-full my-2" style={{ backgroundColor: theme.cardBorder }}></div>
      
      <div className="flex justify-between items-center mb-1">
        <div className="flex items-center">
          <Calendar size={16} color={theme.textSecondary} className="mr-1" />
          <span style={{ color: theme.textSecondary, fontSize: '0.9rem' }}>Сдача:</span>
        </div>
        <span style={{ color: theme.textPrimary, fontSize: '0.9rem' }}>{formatDate(order.endDate)}</span>
      </div>
      
      <div className="flex justify-between items-center">
        <span style={{ color: theme.textSecondary, fontSize: '0.9rem' }}>Стоимость:</span>
        <span style={{ color: theme.textPrimary, fontSize: '0.9rem' }}>{order.price}₽</span>
      </div>
      
      <div className="flex justify-between items-center">
        <span style={{ color: theme.textSecondary, fontSize: '0.9rem' }}>Прибыль:</span>
        <div className="flex items-center">
          <span style={{ color: theme.green, fontSize: '0.9rem', marginRight: '4px' }}>
            +{order.profit}₽
          </span>
          <span 
            style={{ 
              color: order.profitPercent < 50 ? theme.red : theme.green, 
              fontSize: '0.8rem',
              backgroundColor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
              padding: '1px 4px',
              borderRadius: '2px'
            }}
          >
            {order.profitPercent}%
          </span>
        </div>
      </div>
    </div>
  );
  
  // Компонент для отображения заказа в компактном режиме
  const CompactOrderCard = ({ order }) => (
    <div
      className="rounded-xl p-2 transition-transform duration-300 mb-1"
      style={{ 
        backgroundColor: theme.card,
        transform: swipedOrderId === order.id ? 'translateX(-80px)' : 'translateX(0)'
      }}
      onClick={() => {
        if (swipedOrderId === order.id) {
          setSwipedOrderId(null);
        } else {
          navigate(`/order/${order.id}`);
        }
      }}
    >
      <div className="flex justify-between items-center">
        <div className="flex-1 mr-2">
          <h2 className="text-base font-bold truncate" style={{ color: theme.textPrimary }}>{order.name}</h2>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="flex items-center">
            <Calendar size={14} color={theme.textSecondary} className="mr-1" />
            <span style={{ color: theme.textPrimary, fontSize: '0.8rem' }}>{formatDate(order.endDate)}</span>
          </div>
          
          <div className="flex items-center">
            <span style={{ color: theme.textPrimary, fontSize: '0.8rem' }}>{order.price}₽</span>
          </div>
          
          <span
            style={{ 
              color: '#ffffff', 
              backgroundColor: getStatusColor(order.status),
              padding: '1px 6px',
              borderRadius: '4px',
              fontSize: '0.75rem',
              whiteSpace: 'nowrap'
            }}
          >
            {order.status}
          </span>
        </div>
      </div>
    </div>
  );
  
  return (
    <div className="flex flex-col h-screen" style={{ backgroundColor: theme.bg }}>
      {/* Верхняя панель с поиском */}
      <div className="p-3 flex justify-between items-center" style={{ backgroundColor: darkMode ? '#1a1a1a' : theme.bg }}>
        <div className="flex-1">
          <h1 className="text-xl font-bold" style={{ color: theme.textPrimary }}>
            Мои заказы
          </h1>
        </div>
        
        <div className="flex items-center">
          <div className="relative mr-2">
            <input
              type="text"
              placeholder="Поиск..."
              className="py-2 pl-8 pr-4 rounded-full text-sm"
              style={{ 
                backgroundColor: theme.inputBg, 
                color: theme.textPrimary,
                border: 'none',
                width: '180px'
              }}
            />
            <Search 
              size={16} 
              color={theme.textSecondary} 
              className="absolute left-3 top-1/2 transform -translate-y-1/2" 
            />
          </div>
          
          <button 
            className="rounded-full p-2 mr-2"
            style={{ backgroundColor: theme.card }}
            onClick={toggleDarkMode}
          >
            {darkMode ? <Sun size={20} color={theme.textPrimary} /> : <Moon size={20} color={theme.textPrimary} />}
          </button>
        </div>
      </div>
      
      {/* Фильтры и переключатель режима отображения */}
      <div className="px-3 pt-2 pb-3 flex items-center" style={{ backgroundColor: darkMode ? '#1a1a1a' : theme.bg }}>
        <div className="flex-1 overflow-x-auto flex space-x-2">
          {filters.map(filter => (
            <button
              key={filter}
              className={`px-3 py-1.5 rounded-full whitespace-nowrap ${selectedFilter === filter ? 'font-bold' : ''}`}
              style={{ 
                backgroundColor: selectedFilter === filter ? theme.accent : theme.card,
                color: selectedFilter === filter ? '#ffffff' : theme.textSecondary
              }}
              onClick={() => setSelectedFilter(filter)}
            >
              {filter}
            </button>
          ))}
        </div>
        
        {/* Переключатель компактного режима */}
        <button
          className="ml-2 p-2 rounded-full"
          style={{ 
            backgroundColor: theme.card,
            color: compactMode ? theme.accent : theme.textSecondary
          }}
          onClick={() => setCompactMode(!compactMode)}
        >
          {compactMode ? 
            <List size={20} color={theme.accent} /> : 
            <LayoutGrid size={20} color={theme.textSecondary} />
          }
        </button>
      </div>
      
      {/* Список заказов */}
      <div className="flex-1 p-3 overflow-auto pb-20">
        {filteredOrders.map(order => (
          <div key={order.id} className="relative mb-3 overflow-hidden rounded-xl">
            {/* Кнопка удаления (видна при свайпе) */}
            <div 
              className="absolute right-0 top-0 bottom-0 flex items-center"
              style={{ 
                transform: swipedOrderId === order.id ? 'translateX(0)' : 'translateX(100%)',
                transition: 'transform 0.3s ease',
                zIndex: 1
              }}
            >
              <button
                className="h-full px-4 flex items-center justify-center"
                style={{ backgroundColor: theme.red }}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDeleteConfirm(order.id);
                }}
              >
                <Trash2 size={20} color="#ffffff" />
              </button>
            </div>
            
            {/* Карточка заказа */}
            <div
              onTouchStart={(e) => handleTouchStart(e, order.id)}
              onTouchMove={(e) => handleTouchMove(e, order.id)}
              onTouchEnd={(e) => handleTouchEnd(e, order.id)}
              style={{ position: 'relative', zIndex: 2 }}
            >
              {compactMode ? 
                <CompactOrderCard order={order} /> : 
                <RegularOrderCard order={order} />
              }
            </div>
            
            {/* Подтверждение удаления */}
            {showDeleteConfirm === order.id && (
              <div 
                className="absolute inset-0 flex items-center justify-center rounded-xl"
                style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
                onClick={(e) => e.stopPropagation()}
              >
                <div 
                  className="p-4 rounded-lg text-center"
                  style={{ backgroundColor: theme.card, maxWidth: '80%' }}
                >
                  <p style={{ color: theme.textPrimary, marginBottom: '12px' }}>
                    Удалить заказ "{order.name}"?
                  </p>
                  <div className="flex space-x-2">
                    <button
                      className="flex-1 py-2 rounded"
                      style={{ backgroundColor: theme.red, color: '#ffffff' }}
                      onClick={() => handleDeleteOrder(order.id)}
                    >
                      Удалить
                    </button>
                    <button
                      className="flex-1 py-2 rounded"
                      style={{ backgroundColor: theme.card, color: theme.textSecondary }}
                      onClick={() => {
                        setShowDeleteConfirm(null);
                        setSwipedOrderId(null);
                      }}
                    >
                      Отмена
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
        
        {filteredOrders.length === 0 && (
          <div 
            className="flex flex-col items-center justify-center mt-10 p-4 rounded-lg"
            style={{ backgroundColor: theme.card }}
          >
            <p style={{ color: theme.textSecondary, marginBottom: '8px' }}>
              Нет заказов с выбранным статусом
            </p>
            <button
              className="px-4 py-2 rounded text-sm"
              style={{ backgroundColor: theme.accent, color: '#ffffff' }}
              onClick={() => setSelectedFilter('Все')}
            >
              Показать все заказы
            </button>
          </div>
        )}
      </div>
      
      <BottomNavigation activePage="home" />
    </div>
  );
};

export default HomePage; 