import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronLeft, Edit2, ExternalLink, Check, Move, Paperclip, Clock, Plus, X, Trash2, Camera } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import BottomNavigation from '../components/BottomNavigation';
import { getOrderById, saveOrder, deleteOrder } from '../services/OrderService';

const OrderDetailsPage = () => {
  const [editMode, setEditMode] = useState(false);
  const [product, setProduct] = useState(null);
  const [newExpense, setNewExpense] = useState({ name: '', cost: '' });
  const [saveMessage, setSaveMessage] = useState('');
  const [photos, setPhotos] = useState([]);
  const [uploadProgress, setUploadProgress] = useState({});
  const [previewPhoto, setPreviewPhoto] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isNewOrder, setIsNewOrder] = useState(false);
  
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const { id } = useParams();
  
  // Определяем, является ли устройство мобильным
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);
  
  // Загрузка данных заказа по ID
  useEffect(() => {
    if (id === 'new') {
      // Создаем новый заказ
      setIsNewOrder(true);
      setProduct({
        name: 'Новый заказ',
        customer: '',
        cost: 0,
        price: 0,
        profit: 0,
        profitPercent: 0,
        status: 'Ожидает',
        duration: 7,
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        expenses: [],
        notes: '',
        photos: []
      });
      setEditMode(true);
    } else {
      // Загружаем существующий заказ
      setIsNewOrder(false);
      const orderData = getOrderById(id);
      if (orderData) {
        setProduct(orderData);
        // Загружаем фотографии, если они есть
        if (orderData.photos && orderData.photos.length > 0) {
          setPhotos(orderData.photos);
        }
      } else {
        navigate('/');
      }
    }
  }, [id, navigate]);
  
  // Функция сохранения заказа
  const handleSaveOrder = useCallback((shouldNavigateHome = false) => {
    if (!product) return;
    
    // Пересчитываем прибыль и процент прибыли
    const totalCost = product.expenses.reduce((sum, expense) => sum + parseFloat(expense.cost || 0), 0);
    const price = parseFloat(product.price || 0);
    const profit = price - totalCost;
    const profitPercent = price > 0 ? Math.round((profit / price) * 100 * 10) / 10 : 0;
    
    const updatedProduct = {
      ...product,
      cost: totalCost,
      profit: profit,
      profitPercent: profitPercent,
      photos: photos
    };
    
    // Сохраняем изменения
    const savedOrder = saveOrder(updatedProduct);
    
    // Если это был новый заказ, обновляем URL
    if (isNewOrder) {
      setIsNewOrder(false);
      navigate(`/order/${savedOrder.id}`, { replace: true });
    }
    
    setProduct(savedOrder);
    setSaveMessage('Изменения сохранены');
    
    if (shouldNavigateHome) {
      // Если нужно перейти на главную страницу
      setTimeout(() => {
        navigate('/');
      }, 500); // Небольшая задержка, чтобы пользователь увидел сообщение о сохранении
    } else {
      // Просто скрываем сообщение через 2 секунды
      setTimeout(() => setSaveMessage(''), 2000);
    }
    
    return savedOrder;
  }, [product, navigate, photos, isNewOrder]);
  
  // Расчет длительности при изменении дат
  const calculateDuration = (startDate, endDate) => {
    if (!startDate || !endDate) return 0;
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Разница в миллисекундах
    const diffTime = Math.abs(end - start);
    // Разница в днях
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };
  
  // Обработчик изменения даты начала
  const handleStartDateChange = (e) => {
    const newStartDate = e.target.value;
    const newDuration = calculateDuration(newStartDate, product.endDate);
    
    setProduct({
      ...product, 
      startDate: newStartDate,
      duration: newDuration
    });
  };
  
  // Обработчик изменения даты окончания
  const handleEndDateChange = (e) => {
    const newEndDate = e.target.value;
    const newDuration = calculateDuration(product.startDate, newEndDate);
    
    setProduct({
      ...product, 
      endDate: newEndDate,
      duration: newDuration
    });
  };
  
  // Обработчик загрузки файлов
  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    
    files.forEach(file => {
      // Проверяем, что файл - изображение
      if (!file.type.startsWith('image/')) {
        alert('Пожалуйста, загружайте только изображения');
        return;
      }
      
      const fileId = Date.now() + '_' + file.name;
      
      // Создаем объект для отслеживания прогресса загрузки
      setUploadProgress(prev => ({
        ...prev,
        [fileId]: 0
      }));
      
      // Эмулируем процесс загрузки (в реальном приложении здесь был бы запрос к серверу)
      const simulateUpload = () => {
        let progress = 0;
        const interval = setInterval(() => {
          progress += Math.floor(Math.random() * 10) + 1;
          if (progress >= 100) {
            progress = 100;
            clearInterval(interval);
            
            // Создаем URL для предпросмотра изображения
            const reader = new FileReader();
            reader.onload = (e) => {
              const newPhoto = {
                id: fileId,
                name: file.name,
                type: file.type,
                size: file.size,
                url: e.target.result,
                date: new Date().toISOString()
              };
              
              setPhotos(prevPhotos => [...prevPhotos, newPhoto]);
              
              // Удаляем прогресс загрузки через 1 секунду
              setTimeout(() => {
                setUploadProgress(prev => {
                  const newProgress = {...prev};
                  delete newProgress[fileId];
                  return newProgress;
                });
              }, 1000);
            };
            reader.readAsDataURL(file);
          } else {
            setUploadProgress(prev => ({
              ...prev,
              [fileId]: progress
            }));
          }
        }, 200);
      };
      
      simulateUpload();
    });
    
    // Очищаем input, чтобы можно было загрузить тот же файл повторно
    e.target.value = '';
  };
  
  // Удаление фотографии
  const handleDeletePhoto = (photoId) => {
    setPhotos(prevPhotos => prevPhotos.filter(photo => photo.id !== photoId));
    if (previewPhoto && previewPhoto.id === photoId) {
      setPreviewPhoto(null);
    }
  };
  
  // Открытие предпросмотра фотографии
  const handleOpenPreview = (photo) => {
    setPreviewPhoto(photo);
  };
  
  // Закрытие предпросмотра фотографии
  const handleClosePreview = () => {
    setPreviewPhoto(null);
  };
  
  const toggleEditMode = () => {
    if (editMode) {
      // Сохраняем изменения при выходе из режима редактирования
      handleSaveOrder(false); // Передаем false, чтобы остаться на текущей странице
    }
    setEditMode(!editMode);
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}.${month}.${year}`;
  };
  
  const handleAddExpense = () => {
    if (newExpense.name && newExpense.cost) {
      const maxId = product.expenses.length > 0 
        ? Math.max(...product.expenses.map(e => e.id)) 
        : 0;
      
      const updatedExpenses = [
        ...product.expenses,
        {
          id: maxId + 1,
          name: newExpense.name,
          cost: parseFloat(newExpense.cost)
        }
      ];
      
      setProduct({...product, expenses: updatedExpenses});
      setNewExpense({ name: '', cost: '' });
    }
  };
  
  const handleRemoveExpense = (expenseId) => {
    const updatedExpenses = product.expenses.filter(expense => expense.id !== expenseId);
    setProduct({...product, expenses: updatedExpenses});
  };
  
  // Функция удаления заказа
  const handleDeleteOrder = () => {
    if (!product) return;
    
    deleteOrder(product.id);
    setSaveMessage('Заказ удален');
    
    // Перенаправляем на главную страницу
    setTimeout(() => {
      navigate('/');
    }, 500);
  };
  
  // Если данные еще не загружены
  if (!product) {
    return (
      <div className="flex items-center justify-center h-screen" style={{ backgroundColor: '#ffffff' }}>
        <div style={{ color: '#333333' }}>Загрузка...</div>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col h-screen" style={{ backgroundColor: '#ffffff' }}>
      {/* Верхняя панель */}
      <div className="p-3 flex justify-between items-center" style={{ backgroundColor: '#ffffff' }}>
        <div className="flex items-center">
          <ChevronLeft 
            size={24} 
            color="#333333" 
            className="mr-2 cursor-pointer" 
            onClick={() => navigate('/')}
          />
          <h1 className="text-xl font-bold" style={{ color: '#333333' }}>
            {editMode ? (
              <input 
                type="text" 
                value={product?.name || ''}
                onChange={(e) => setProduct({...product, name: e.target.value})}
                className="p-1 rounded"
                style={{ 
                  backgroundColor: '#f0f0f0', 
                  color: '#333333', 
                  border: 'none',
                  fontSize: '1.25rem',
                  fontWeight: 'bold',
                  width: '200px'
                }}
              />
            ) : (
              product?.name || 'Детали заказа'
            )}
          </h1>
        </div>
        
        <div className="flex items-center">
          {!isMobile && id !== 'new' && !isNewOrder && (
            <button 
              className="rounded-full p-2 mr-2"
              style={{ backgroundColor: '#dc2626' }}
              onClick={() => setShowDeleteConfirm(true)}
            >
              <Trash2 size={20} color="#ffffff" />
            </button>
          )}
          
          <button 
            className="rounded-full p-2"
            style={{ backgroundColor: '#f0f0f0' }}
            onClick={toggleEditMode}
          >
            {editMode ? 
              <Check size={20} color="#333333" /> : 
              <Edit2 size={20} color="#333333" />
            }
          </button>
        </div>
      </div>
      
      {/* Основное содержимое */}
      <div className="flex-1 overflow-auto px-3 pb-20">
        {/* Блок цены и прибыли */}
        <div className="mb-3 rounded-xl p-3" style={{ backgroundColor: '#f8f9fa' }}>
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-bold" style={{ color: '#333333' }}>Финансы</h2>
          </div>
          
          <div className="h-px w-full mb-3" style={{ backgroundColor: '#e0e0e0' }}></div>
          
          <div className="grid grid-cols-2 gap-3 mb-2">
            <div>
              <div className="text-sm mb-1" style={{ color: '#606060' }}>Стоимость заказа:</div>
              {editMode ? (
                <input 
                  type="number" 
                  value={product.price || ''}
                  onChange={(e) => setProduct({...product, price: parseFloat(e.target.value) || 0})}
                  className="w-full p-2 rounded"
                  style={{ backgroundColor: '#f0f0f0', color: '#333333', border: 'none' }}
                />
              ) : (
                <div style={{ color: '#333333' }}>{product.price}₽</div>
              )}
            </div>
            
            <div>
              <div className="text-sm mb-1" style={{ color: '#606060' }}>Себестоимость:</div>
              <div style={{ color: '#333333' }}>{product.cost}₽</div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-sm mb-1" style={{ color: '#606060' }}>Прибыль:</div>
              <div style={{ color: '#16a34a' }}>{product.profit}₽</div>
            </div>
            
            <div>
              <div className="text-sm mb-1" style={{ color: '#606060' }}>Рентабельность:</div>
              <div style={{ 
                color: product.profitPercent < 50 ? '#dc2626' : '#16a34a'
              }}>
                {product.profitPercent}%
              </div>
            </div>
          </div>
        </div>
        
        {/* Блок расходов */}
        <div className="mb-3 rounded-xl p-3" style={{ backgroundColor: '#f8f9fa' }}>
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-bold" style={{ color: '#333333' }}>Расходы: {product.cost}₽</h2>
          </div>
          
          <div className="h-px w-full mb-3" style={{ backgroundColor: '#e0e0e0' }}></div>
          
          <div className="rounded-lg p-2" style={{ backgroundColor: '#ffffff' }}>
            {/* Список расходов */}
            {product.expenses.length > 0 ? (
              product.expenses.map((expense, index) => (
                <div 
                  key={expense.id} 
                  className="mb-2 last:mb-0"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      {editMode && (
                        <div className="mr-1 cursor-move">
                          <Move size={14} color="#606060" />
                        </div>
                      )}
                      
                      {editMode ? (
                        <input 
                          type="text" 
                          value={expense.name}
                          onChange={(e) => {
                            const updatedExpenses = [...product.expenses];
                            updatedExpenses[index].name = e.target.value;
                            setProduct({...product, expenses: updatedExpenses});
                          }}
                          className="p-1 rounded"
                          style={{ 
                            backgroundColor: '#f0f0f0', 
                            color: '#333333', 
                            border: 'none',
                            fontSize: '0.9rem',
                            width: '150px'
                          }}
                        />
                      ) : (
                        <span style={{ color: '#333333', fontSize: '0.9rem' }}>{expense.name}</span>
                      )}
                      
                      {/* Иконка ссылки */}
                      {expense.link ? (
                        <div className="flex items-center">
                          <a 
                            href={expense.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-1"
                            style={{ color: '#333333' }}
                          >
                            <ExternalLink size={14} />
                          </a>
                          {editMode && (
                            <button 
                              className="ml-1"
                              onClick={() => {
                                const updatedExpenses = [...product.expenses];
                                updatedExpenses[index] = {
                                  ...updatedExpenses[index],
                                  showLinkInput: true
                                };
                                setProduct({...product, expenses: updatedExpenses});
                              }}
                              style={{ color: '#333333' }}
                            >
                              <Edit2 size={14} />
                            </button>
                          )}
                        </div>
                      ) : (
                        editMode && (
                          <button 
                            className="ml-1"
                            onClick={() => {
                              const updatedExpenses = [...product.expenses];
                              updatedExpenses[index] = {
                                ...updatedExpenses[index],
                                showLinkInput: true
                              };
                              setProduct({...product, expenses: updatedExpenses});
                            }}
                            style={{ color: '#606060' }}
                          >
                            <Paperclip size={14} />
                          </button>
                        )
                      )}
                    </div>
                    
                    <div className="flex items-center">
                      {editMode ? (
                        <>
                          <input 
                            type="number" 
                            value={expense.cost}
                            onChange={(e) => {
                              const updatedExpenses = [...product.expenses];
                              updatedExpenses[index].cost = parseFloat(e.target.value) || 0;
                              setProduct({...product, expenses: updatedExpenses});
                            }}
                            className="p-1 rounded w-20 text-right mr-2"
                            style={{ 
                              backgroundColor: '#f0f0f0', 
                              color: '#333333', 
                              border: 'none',
                              fontSize: '0.9rem'
                            }}
                          />
                          <button 
                            onClick={() => handleRemoveExpense(expense.id)}
                            className="p-1 rounded-full"
                            style={{ backgroundColor: 'rgba(255,0,0,0.1)' }}
                          >
                            <Trash2 size={14} color="#dc2626" />
                          </button>
                        </>
                      ) : (
                        <span style={{ color: '#333333', fontSize: '0.9rem' }}>{expense.cost}₽</span>
                      )}
                    </div>
                  </div>
                  
                  {/* Поле для ввода ссылки */}
                  {editMode && expense.showLinkInput && (
                    <div className="mt-1 mb-2 pl-2">
                      <div className="flex items-center space-x-2">
                        <input 
                          type="text" 
                          value={expense.newLinkUrl || expense.link || ''}
                          onChange={(e) => {
                            const updatedExpenses = [...product.expenses];
                            updatedExpenses[index] = {
                              ...updatedExpenses[index],
                              newLinkUrl: e.target.value
                            };
                            setProduct({...product, expenses: updatedExpenses});
                          }}
                          placeholder="https://..." 
                          className="flex-1 p-1.5 text-xs rounded"
                          style={{ backgroundColor: '#f0f0f0', color: '#333333', border: 'none' }}
                        />
                        <button 
                          className="rounded-full w-6 h-6 flex items-center justify-center"
                          style={{ backgroundColor: '#333333' }}
                          onClick={() => {
                            const updatedExpenses = [...product.expenses];
                            updatedExpenses[index] = {
                              ...updatedExpenses[index],
                              link: updatedExpenses[index].newLinkUrl,
                              showLinkInput: false,
                              newLinkUrl: undefined
                            };
                            setProduct({...product, expenses: updatedExpenses});
                          }}
                        >
                          <Check size={14} color="#ffffff" />
                        </button>
                        <button 
                          className="rounded-full w-6 h-6 flex items-center justify-center"
                          style={{ backgroundColor: '#f0f0f0' }}
                          onClick={() => {
                            const updatedExpenses = [...product.expenses];
                            updatedExpenses[index] = {
                              ...updatedExpenses[index],
                              showLinkInput: false,
                              newLinkUrl: undefined
                            };
                            setProduct({...product, expenses: updatedExpenses});
                          }}
                        >
                          <X size={14} color="#606060" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-2" style={{ color: '#606060' }}>
                Нет расходов
              </div>
            )}
            
            {/* Форма добавления нового расхода */}
            {editMode && (
              <div className="mt-3 pt-3 border-t" style={{ borderColor: '#e0e0e0' }}>
                <div className="flex items-center space-x-2">
                  <input 
                    type="text" 
                    value={newExpense.name}
                    onChange={(e) => setNewExpense({...newExpense, name: e.target.value})}
                    placeholder="Название" 
                    className="flex-1 p-2 rounded"
                    style={{ backgroundColor: '#f0f0f0', color: '#333333', border: 'none' }}
                  />
                  <input 
                    type="number" 
                    value={newExpense.cost}
                    onChange={(e) => setNewExpense({...newExpense, cost: e.target.value})}
                    placeholder="Сумма" 
                    className="w-24 p-2 rounded"
                    style={{ backgroundColor: '#f0f0f0', color: '#333333', border: 'none' }}
                  />
                  <button 
                    className="rounded-full w-8 h-8 flex items-center justify-center"
                    style={{ backgroundColor: '#333333' }}
                    onClick={handleAddExpense}
                  >
                    <Plus size={20} color="#ffffff" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Блок примечаний */}
        <div className="mb-3 rounded-xl p-3" style={{ backgroundColor: '#f8f9fa' }}>
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-bold" style={{ color: '#333333' }}>Примечания</h2>
          </div>
          
          <div className="h-px w-full mb-3" style={{ backgroundColor: '#e0e0e0' }}></div>
          
          {editMode ? (
            <textarea 
              value={product.notes || ''}
              onChange={(e) => setProduct({...product, notes: e.target.value})}
              className="w-full p-2 rounded min-h-24"
              style={{ 
                backgroundColor: '#ffffff', 
                color: '#333333', 
                border: 'none',
                resize: 'vertical'
              }}
              placeholder="Добавьте примечания к заказу..."
            />
          ) : (
            <div 
              className="p-2 rounded"
              style={{ backgroundColor: '#ffffff' }}
            >
              {product.notes ? (
                <p style={{ color: '#333333' }}>{product.notes}</p>
              ) : (
                <p style={{ color: '#606060' }}>Нет примечаний</p>
              )}
            </div>
          )}
        </div>
        
        {/* Блок сроков */}
        <div className="mb-3 rounded-xl p-3" style={{ backgroundColor: '#f8f9fa' }}>
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-bold" style={{ color: '#333333' }}>Сроки</h2>
          </div>
          
          <div className="h-px w-full mb-3" style={{ backgroundColor: '#e0e0e0' }}></div>
          
          <div className="flex items-center mb-3">
            <div className="flex items-center mr-4">
              <Clock size={16} color="#606060" className="mr-1" />
              <span style={{ color: '#606060' }}>Длительность:</span>
            </div>
            <div className="flex items-center">
              {editMode ? (
                <input 
                  type="number" 
                  value={product.duration}
                  onChange={(e) => setProduct({...product, duration: parseInt(e.target.value, 10) || 0})}
                  className="w-12 p-1 text-center rounded"
                  style={{ backgroundColor: '#f0f0f0', color: '#333333', border: 'none' }}
                  readOnly
                />
              ) : (
                <span style={{ color: '#333333' }}>{product.duration}</span>
              )}
              <span style={{ color: '#606060', marginLeft: '4px' }}>дней</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-sm mb-1" style={{ color: '#606060' }}>Дата начала:</div>
              {editMode ? (
                <input 
                  type="date" 
                  value={product.startDate}
                  onChange={handleStartDateChange}
                  className="w-full p-2 rounded"
                  style={{ backgroundColor: '#f0f0f0', color: '#333333', border: 'none' }}
                />
              ) : (
                <div style={{ color: '#333333' }}>{formatDate(product.startDate)}</div>
              )}
            </div>
            
            <div>
              <div className="text-sm mb-1" style={{ color: '#606060' }}>Дата окончания:</div>
              {editMode ? (
                <input 
                  type="date" 
                  value={product.endDate}
                  onChange={handleEndDateChange}
                  className="w-full p-2 rounded"
                  style={{ backgroundColor: '#f0f0f0', color: '#333333', border: 'none' }}
                />
              ) : (
                <div style={{ color: '#333333' }}>{formatDate(product.endDate)}</div>
              )}
            </div>
          </div>
        </div>
        
        {/* Блок фотографий */}
        <div className="mb-3 rounded-xl p-3" style={{ backgroundColor: '#f8f9fa' }}>
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-bold" style={{ color: '#333333' }}>Фотографии</h2>
          </div>
          
          <div className="h-px w-full mb-3" style={{ backgroundColor: '#e0e0e0' }}></div>
          
          {/* Загрузка фотографий */}
          {editMode && (
            <div className="mb-3">
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/*"
                multiple
                className="hidden"
              />
              <button 
                className="w-full p-3 rounded flex items-center justify-center"
                style={{ 
                  backgroundColor: '#ffffff', 
                  color: '#333333',
                  border: '1px dashed #e0e0e0'
                }}
                onClick={() => fileInputRef.current.click()}
              >
                <Camera size={20} className="mr-2" />
                Загрузить фотографии
              </button>
            </div>
          )}
          
          {/* Индикаторы прогресса загрузки */}
          {Object.keys(uploadProgress).length > 0 && (
            <div className="mb-3">
              {Object.entries(uploadProgress).map(([fileId, progress]) => (
                <div key={fileId} className="mb-2">
                  <div className="flex justify-between mb-1">
                    <span style={{ color: '#606060', fontSize: '0.8rem' }}>
                      Загрузка: {fileId.split('_')[1]}
                    </span>
                    <span style={{ color: '#333333', fontSize: '0.8rem' }}>
                      {progress}%
                    </span>
                  </div>
                  <div 
                    className="h-1.5 rounded-full overflow-hidden"
                    style={{ backgroundColor: '#f0f0f0' }}
                  >
                    <div 
                      className="h-full rounded-full"
                      style={{ 
                        backgroundColor: '#333333',
                        width: `${progress}%`,
                        transition: 'width 0.2s ease-out'
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Галерея фотографий */}
          {photos.length > 0 ? (
            <div className="grid grid-cols-3 gap-2">
              {photos.map(photo => (
                <div 
                  key={photo.id} 
                  className="relative aspect-square rounded overflow-hidden"
                  onClick={() => handleOpenPreview(photo)}
                >
                  <img 
                    src={photo.url} 
                    alt={photo.name}
                    className="w-full h-full object-cover"
                  />
                  {editMode && (
                    <button 
                      className="absolute top-1 right-1 rounded-full p-1"
                      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeletePhoto(photo.id);
                      }}
                    >
                      <X size={16} color="#ffffff" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4" style={{ color: '#606060' }}>
              Нет фотографий
            </div>
          )}
        </div>
      </div>
      
      {/* Модальное окно предпросмотра фотографии */}
      {previewPhoto && (
        <div 
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{ backgroundColor: 'rgba(0,0,0,0.9)' }}
          onClick={handleClosePreview}
        >
          <div className="relative max-w-full max-h-full p-2">
            <img 
              src={previewPhoto.url} 
              alt={previewPhoto.name}
              className="max-w-full max-h-[90vh] object-contain"
            />
            <button 
              className="absolute top-2 right-2 rounded-full p-2"
              style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
              onClick={handleClosePreview}
            >
              <X size={24} color="#ffffff" />
            </button>
          </div>
        </div>
      )}
      
      {/* Модальное окно подтверждения удаления */}
      {showDeleteConfirm && (
        <div 
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
        >
          <div 
            className="p-4 rounded-lg text-center"
            style={{ backgroundColor: '#ffffff', maxWidth: '80%', width: '300px' }}
          >
            <h3 
              className="text-lg font-bold mb-3" 
              style={{ color: '#333333' }}
            >
              Удалить заказ?
            </h3>
            <p 
              className="mb-4" 
              style={{ color: '#606060' }}
            >
              Вы уверены, что хотите удалить заказ "{product?.name}"? Это действие нельзя отменить.
            </p>
            <div className="flex space-x-2">
              <button
                className="flex-1 py-2 rounded"
                style={{ backgroundColor: '#ffffff', color: '#333333' }}
                onClick={() => setShowDeleteConfirm(false)}
              >
                Отмена
              </button>
              <button
                className="flex-1 py-2 rounded"
                style={{ backgroundColor: '#dc2626', color: '#ffffff' }}
                onClick={handleDeleteOrder}
              >
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Сообщение о сохранении */}
      {saveMessage && (
        <div 
          className="fixed bottom-20 left-0 right-0 mx-auto w-64 p-3 rounded-lg text-center"
          style={{ 
            backgroundColor: '#16a34a', 
            color: '#ffffff',
            zIndex: 1000,
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
          }}
        >
          {saveMessage}
        </div>
      )}
      
      <BottomNavigation activePage="none" />
    </div>
  );
};

export default OrderDetailsPage; 