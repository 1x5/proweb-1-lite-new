import React, { useState, useEffect, useRef } from 'react';
import { Search, Calendar, List, LayoutGrid, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BottomNavigation from '../components/BottomNavigation';
import { getOrders, deleteOrder } from '../services/OrderService';

const HomePage = () => {
  const [selectedFilter, setSelectedFilter] = useState('Все');
  const [orders, setOrders] = useState([]);
  const [swipedOrderId, setSwipedOrderId] = useState(null);
  const [compactMode, setCompactMode] = useState(false);
  const touchStartXRef = useRef(0);
  const touchEndXRef = useRef(0);
  const navigate = useNavigate();
  const ordersContainerRef = useRef(null);
  const orderRefs = useRef({});
  const touchOffset = useRef(0);
  
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
        return '#16a34a';
      case 'В работе':
        return '#333333';
      case 'Ожидает':
        return '#606060';
      default:
        return '#333333';
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
      setSwipedOrderId(orderId);
    }
  };
  
  const filteredOrders = selectedFilter === 'Все' 
    ? orders 
    : orders.filter(order => order.status === selectedFilter);
  
  // Компонент для отображения заказа в обычном режиме
  const RegularOrderCard = ({ order, onDelete, onClick }) => (
    <div
      className="rounded-xl p-3 transition-transform duration-300"
      style={{ 
        backgroundColor: '#f8f9fa',
        transform: swipedOrderId === order.id ? 'translateX(-80px)' : 'translateX(0)'
      }}
      onClick={() => {
        if (swipedOrderId === order.id) {
          setSwipedOrderId(null);
        } else {
          onClick();
        }
      }}
    >
      <div className="flex justify-between items-start mb-1">
        <div>
          <h2 className="text-lg font-bold" style={{ color: '#333333' }}>{order.name}</h2>
          <p className="text-sm" style={{ color: '#606060' }}>{order.customer}</p>
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
      
      <div className="h-px w-full my-2" style={{ backgroundColor: '#e0e0e0' }}></div>
      
      <div className="flex justify-between items-center mb-1">
        <div className="flex items-center">
          <Calendar size={16} color="#606060" className="mr-1" />
          <span style={{ color: '#606060', fontSize: '0.9rem' }}>Сдача:</span>
        </div>
        <span style={{ color: '#333333', fontSize: '0.9rem' }}>{formatDate(order.endDate)}</span>
      </div>
      
      <div className="flex justify-between items-center">
        <span style={{ color: '#606060', fontSize: '0.9rem' }}>Стоимость:</span>
        <span style={{ color: '#333333', fontSize: '0.9rem' }}>{order.price}₽</span>
      </div>
      
      <div className="flex justify-between items-center">
        <span style={{ color: '#606060', fontSize: '0.9rem' }}>Прибыль:</span>
        <div className="flex items-center">
          <span style={{ color: '#16a34a', fontSize: '0.9rem', marginRight: '4px' }}>
            +{order.profit}₽
          </span>
          <span 
            style={{ 
              color: order.profitPercent < 50 ? '#dc2626' : '#16a34a', 
              fontSize: '0.8rem',
              backgroundColor: 'rgba(0,0,0,0.05)',
              padding: '1px 4px',
              borderRadius: '2px'
            }}
          >
            {order.profitPercent}%
          </span>
        </div>
      </div>
      
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
          style={{ backgroundColor: '#dc2626' }}
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        >
          <Trash2 size={20} color="#ffffff" />
        </button>
      </div>
    </div>
  );
  
  // Компонент для отображения заказа в компактном режиме
  const CompactOrderCard = ({ order, onDelete, onClick }) => (
    <div
      className="rounded-xl p-2 transition-transform duration-300 mb-1"
      style={{ 
        backgroundColor: '#f8f9fa',
        transform: swipedOrderId === order.id ? 'translateX(-80px)' : 'translateX(0)'
      }}
      onClick={() => {
        if (swipedOrderId === order.id) {
          setSwipedOrderId(null);
        } else {
          onClick();
        }
      }}
    >
      <div className="flex justify-between items-center">
        <div className="flex-1 mr-2">
          <h2 className="text-base font-bold truncate" style={{ color: '#333333' }}>{order.name}</h2>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="flex items-center">
            <Calendar size={14} color="#606060" className="mr-1" />
            <span style={{ color: '#333333', fontSize: '0.8rem' }}>{formatDate(order.endDate)}</span>
          </div>
          
          <div className="flex items-center">
            <span style={{ color: '#333333', fontSize: '0.8rem' }}>{order.price}₽</span>
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
            style={{ backgroundColor: '#dc2626' }}
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            <Trash2 size={20} color="#ffffff" />
          </button>
        </div>
      </div>
    </div>
  );
  
  return (
    <div className="flex flex-col h-screen" style={{ backgroundColor: '#ffffff' }}>
      {/* Верхняя панель с поиском */}
      <div className="p-3 flex justify-between items-center" style={{ backgroundColor: '#ffffff' }}>
        <div className="flex-1">
          <h1 className="text-xl font-bold" style={{ color: '#333333' }}>
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
                backgroundColor: '#f0f0f0', 
                color: '#333333',
                border: 'none',
                width: '180px'
              }}
            />
            <Search 
              size={16} 
              color="#606060" 
              className="absolute left-3 top-1/2 transform -translate-y-1/2" 
            />
          </div>
        </div>
      </div>
      
      {/* Фильтры и переключатель режима отображения */}
      <div className="px-3 pt-2 pb-3 flex items-center" style={{ backgroundColor: '#ffffff' }}>
        <div className="flex-1 overflow-x-auto flex space-x-2">
          {filters.map(filter => (
            <button
              key={filter}
              className={`px-3 py-1.5 rounded-full whitespace-nowrap ${selectedFilter === filter ? 'font-bold' : ''}`}
              style={{ 
                backgroundColor: selectedFilter === filter ? '#333333' : '#f8f9fa',
                color: selectedFilter === filter ? '#ffffff' : '#606060'
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
            backgroundColor: '#f8f9fa',
            color: compactMode ? '#333333' : '#606060'
          }}
          onClick={() => setCompactMode(!compactMode)}
        >
          {compactMode ? 
            <List size={20} color="#333333" /> : 
            <LayoutGrid size={20} color="#606060" />
          }
        </button>
      </div>
      
      {/* Список заказов */}
      <div 
        className="flex-1 overflow-y-auto px-3 pb-16" 
        style={{ backgroundColor: '#ffffff' }}
        ref={ordersContainerRef}
      >
        {filteredOrders.map((order, index) => (
          <div 
            key={order.id} 
            className="mb-3"
            ref={el => orderRefs.current[index] = el}
            style={{
              transform: `translateX(${touchOffset.current}px)`,
              transition: touchOffset.current === 0 ? 'transform 0.2s ease-out' : 'none'
            }}
            onTouchStart={handleTouchStart}
            onTouchMove={(e) => handleTouchMove(e, index)}
            onTouchEnd={() => handleTouchEnd(index)}
          >
            {compactMode ? (
              <CompactOrderCard 
                order={order}
                onDelete={() => handleDeleteOrder(order.id)}
                onClick={() => navigate(`/order/${order.id}`)}
              />
            ) : (
              <RegularOrderCard 
                order={order}
                onDelete={() => handleDeleteOrder(order.id)}
                onClick={() => navigate(`/order/${order.id}`)}
              />
            )}
          </div>
        ))}
      </div>
      
      <BottomNavigation />
    </div>
  );
};

export default HomePage; 