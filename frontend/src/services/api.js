import axios from 'axios';
// Базовый URL API
const API_URL = '/api';

// Вспомогательная функция для проверки ответа от сервера
const handleResponse = async (response) => {
  const data = await response.json();
  
  if (!response.ok) {
    // Если ответ не успешный, генерируем ошибку с сообщением от сервера
    const error = (data && data.message) || response.statusText;
    return Promise.reject(error);
  }
  
  return data;
};

// Сервис для работы с API
const apiService = {
  // Авторизация
  login: async (username, password) => {
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    return handleResponse(response);
  },
  
  // Регистрация
  register: async (username, email, password) => {
    const response = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password })
    });
    return handleResponse(response);
  },
  
  // Получение всех мероприятий
  getEvents: async () => {
    const response = await fetch(`${API_URL}/events`);
    return handleResponse(response);
  },
  
  // Получение информации о конкретном мероприятии
  getEvent: async (eventId) => {
    const response = await fetch(`${API_URL}/events/${eventId}`);
    return handleResponse(response);
  },
  
  // Создание мероприятия (требует прав администратора)
// Создание мероприятия
createEvent: async (eventData) => {
  try {
    // Получаем токен из localStorage
    const token = localStorage.getItem('authToken') || (JSON.parse(localStorage.getItem('user')) || {}).token;
    
    const response = await axios.post(`${API_URL}/events`, eventData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Error creating event:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Ошибка при создании мероприятия'
    };
  }
},
  
  // Бронирование места на мероприятии
// Обновленная функция createBooking для api.js
// Добавляем токен авторизации в заголовки запроса

// Бронирование места на мероприятии
// Бронирование места на мероприятии
createBooking: async (bookingData) => {
  try {
    // Получаем токен из localStorage или из объекта пользователя
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const token = localStorage.getItem('authToken') || (user && user.token);
    
    // Проверяем наличие токена
    if (!token) {
      console.error('Ошибка авторизации: токен не найден');
      return { 
        success: false, 
        message: 'Необходима авторизация. Пожалуйста, войдите в систему снова.' 
      };
    }
    
    // Формируем данные для отправки
    const dataToSend = {
      user_id: bookingData.user_id,
      event_id: bookingData.event_id,
      seats: bookingData.seats
    };
    
    // Если есть данные о выбранных местах, добавляем их
    if (bookingData.seat_numbers && Array.isArray(bookingData.seat_numbers)) {
      dataToSend.seat_numbers = bookingData.seat_numbers;
    }
    
    // Отправляем запрос с токеном в заголовке
    const response = await fetch(`${API_URL}/bookings`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(dataToSend)
    });
    
    // Обработка ответа
    const data = await response.json();
    
    if (!response.ok) {
      // Если ошибка связана с авторизацией, предлагаем пользователю переавторизоваться
      if (response.status === 401) {
        console.error('Ошибка авторизации при бронировании');
        return { 
          success: false, 
          message: 'Ваша сессия истекла. Пожалуйста, войдите в систему снова.'
        };
      }
      
      return {
        success: false,
        message: data.message || 'Ошибка при создании бронирования'
      };
    }
    
    // Сохраняем информацию о забронированных местах в localStorage
    if (bookingData.seat_numbers && bookingData.seat_numbers.length > 0) {
      // Ключ вида 'venue_123' (где 123 - ID места проведения)
      const eventData = await fetch(`${API_URL}/events/${bookingData.event_id}`).then(res => res.json());
      if (eventData && eventData.venue_id) {
        const venueKey = `venue_${eventData.venue_id}`;
        const storedVenueData = localStorage.getItem(venueKey);
        let venueData = { occupiedSeats: [] };
        
        if (storedVenueData) {
          try {
            venueData = JSON.parse(storedVenueData);
          } catch (e) {
            console.error('Ошибка при чтении данных о занятых местах:', e);
          }
        }
        
        // Добавляем новые занятые места
        venueData.occupiedSeats = [
          ...(venueData.occupiedSeats || []),
          ...bookingData.seat_numbers
        ];
        
        // Сохраняем обновленные данные
        localStorage.setItem(venueKey, JSON.stringify(venueData));
      }
    }
    
    return {
      success: true,
      data: data
    };
  } catch (error) {
    console.error('Ошибка при создании бронирования:', error);
    return {
      success: false,
      message: 'Произошла ошибка при бронировании. Попробуйте позже.'
    };
  }
},

// Получение всех бронирований пользователя
getUserBookings: async (userId) => {
  try {
    // Получаем токен из localStorage или из объекта пользователя
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const token = localStorage.getItem('authToken') || (user && user.token);
    
    // Проверяем наличие токена
    if (!token) {
      console.error('Ошибка авторизации: токен не найден');
      return Promise.reject('Необходима авторизация. Пожалуйста, войдите в систему снова.');
    }
    
    // Отправляем запрос с токеном в заголовке
    const response = await fetch(`${API_URL}/users/${userId}/bookings`, {
      method: 'GET',
      headers: { 
        'Authorization': `Bearer ${token}`
      }
    });
    
    // Обработка ответа
    if (!response.ok) {
      if (response.status === 401) {
        console.error('Ошибка авторизации при получении бронирований');
        return Promise.reject('Ваша сессия истекла. Пожалуйста, войдите в систему снова.');
      }
      return Promise.reject('Ошибка при получении бронирований');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Ошибка при получении бронирований:', error);
    return Promise.reject(error.message || 'Произошла ошибка при получении бронирований');
  }
},
  
  // Отмена бронирования
// Обновленная функция cancelBooking для api.js
// Добавляем токен авторизации в заголовки запроса

// Отмена бронирования
cancelBooking: async (bookingId, userId) => {
  try {
    // Получаем токен из localStorage или из объекта пользователя
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const token = localStorage.getItem('authToken') || (user && user.token);
    
    // Проверяем наличие токена
    if (!token) {
      console.error('Ошибка авторизации: токен не найден');
      return {
        success: false,
        message: 'Необходима авторизация. Пожалуйста, войдите в систему снова.'
      };
    }
    
    // Отправляем запрос с токеном в заголовке
    const response = await fetch(`${API_URL}/bookings/${bookingId}/cancel`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ user_id: userId })
    });
    
    // Обработка ответа
    const data = await response.json();
    
    if (!response.ok) {
      if (response.status === 401) {
        console.error('Ошибка авторизации при отмене бронирования');
        return {
          success: false,
          message: 'Ваша сессия истекла. Пожалуйста, войдите в систему снова.'
        };
      }
      
      return {
        success: false,
        message: data.message || 'Ошибка при отмене бронирования'
      };
    }
    
    return {
      success: true,
      data: data
    };
  } catch (error) {
    console.error('Ошибка при отмене бронирования:', error);
    return {
      success: false,
      message: 'Произошла ошибка при отмене бронирования. Попробуйте позже.'
    };
  }
},
  
  // Получение всех спортивных объектов
  getVenues: async () => {
    const response = await fetch(`${API_URL}/venues`);
    return handleResponse(response);
  },

  // Добавьте эти методы в ваш существующий apiService.js

// Получение уведомлений пользователя
getUserNotifications: async () => {
  try {
    // Получаем текущего пользователя из хранилища
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || !user.id) {
      throw new Error('Пользователь не авторизован');
    }

    // Получаем токен
    const token = localStorage.getItem('authToken') || user.token;
    
    // Делаем запрос к API
    const response = await axios.get(`${API_URL}/users/${user.id}/notifications`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    // Возвращаем данные
    return response.data;
  } catch (error) {
    console.error('Ошибка при получении уведомлений:', error);
    throw error;
  }
},
// Добавьте этот метод в ваш файл services/api.js

// Отправка уведомления пользователю
sendNotification: async (notificationData) => {
  try {
    const token = localStorage.getItem('authToken') || (JSON.parse(localStorage.getItem('user')) || {}).token;
    
    const response = await axios.post(`${API_URL}/notifications`, notificationData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Error sending notification:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Ошибка при отправке уведомления'
    };
  }
},

// Получение уведомлений пользователя
getUserNotifications: async () => {
  try {
    // Получаем текущего пользователя из хранилища
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || !user.id) {
      throw new Error('Пользователь не авторизован');
    }

    // Получаем токен
    const token = localStorage.getItem('authToken') || user.token;
    
    // Запрос с указанием ID пользователя
    const response = await axios.get(`${API_URL}/users/${user.id}/notifications`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    // Проверяем, содержит ли ответ поле notifications
    if (response.data && response.data.notifications) {
      return response.data.notifications;
    } else if (Array.isArray(response.data)) {
      return response.data;
    }
    
    return [];
  } catch (error) {
    console.error('Ошибка при получении уведомлений:', error);
    throw error;
  }
},


// Получение всех уведомлений (для админ-панели)
getAllNotifications: async () => {
  try {
    const token = localStorage.getItem('authToken') || (JSON.parse(localStorage.getItem('user')) || {}).token;
    
    const response = await axios.get(`${API_URL}/admin/notifications`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Error fetching all notifications:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Ошибка при получении уведомлений'
    };
  }
},
  // Получение количества непрочитанных уведомлений
  getUnreadNotificationsCount: async (userId) => {
    try {
      // Получаем токен из localStorage
      const token = localStorage.getItem('authToken') || (JSON.parse(localStorage.getItem('user')) || {}).token;
      
      const response = await axios.get(`/api/users/${userId}/notifications/unread-count`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      return {
        success: true,
        count: response.data.count
      };
    } catch (error) {
      console.error('Error fetching unread count:', error);
      
      return {
        success: false,
        count: 0
      };
    }
  },

  // Отметить уведомление как прочитанное
  markNotificationAsRead: async (notificationId) => {
    try {
      // Получаем токен
      const user = JSON.parse(localStorage.getItem('user'));
      const token = localStorage.getItem('authToken') || (user || {}).token;
      
      // Отправляем запрос на обновление статуса
      const response = await axios.patch(`${API_URL}/notifications/${notificationId}/read`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Ошибка при отметке уведомления как прочитанного:', error);
      throw error;
    }
  },

  // Отметить все уведомления пользователя как прочитанные
  markAllNotificationsAsRead: async () => {
    try {
      // Получаем текущего пользователя
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user || !user.id) {
        throw new Error('Пользователь не авторизован');
      }
      
      // Получаем токен
      const token = localStorage.getItem('authToken') || user.token;
      
      // Отправляем запрос на обновление статуса всех уведомлений
      const response = await axios.patch(`${API_URL}/users/${user.id}/notifications/mark-all-read`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Ошибка при отметке всех уведомлений как прочитанных:', error);
      throw error;
    }
  }   ,

  // Удаление уведомления
  deleteAdminNotification: async (notificationId) => {
    try {
      const token = localStorage.getItem('authToken') || (JSON.parse(localStorage.getItem('user')) || {}).token;
      
      const response = await axios.delete(`${API_URL}/admin/notifications/${notificationId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error deleting notification:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Ошибка при удалении уведомления'
      };
    }
  },

  // Получение статистики по бронированиям для админ-панели
// Получение статистики по бронированиям для админ-панели
getAdminBookingStats: async () => {
  try {
    const token = localStorage.getItem('authToken') || (JSON.parse(localStorage.getItem('user')) || {}).token;
    
    const response = await axios.get(`${API_URL}/admin/stats/bookings`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error fetching booking stats:', error);
    throw error;
  }
},

// Получение статистики по мероприятиям для админ-панели
getAdminEventStats: async () => {
  try {
    const token = localStorage.getItem('authToken') || (JSON.parse(localStorage.getItem('user')) || {}).token;
    
    const response = await axios.get(`${API_URL}/admin/stats/events`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error fetching event stats:', error);
    throw error;
  }
},

// Получение статистики по пользователям для админ-панели
getAdminUserStats: async () => {
  try {
    const token = localStorage.getItem('authToken') || (JSON.parse(localStorage.getItem('user')) || {}).token;
    
    const response = await axios.get(`${API_URL}/admin/stats/users`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error fetching user stats:', error);
    throw error;
  }
},

// Получение всех пользователей (для админ-панели)
getAllUsers: async () => {
  try {
    // Получаем токен из localStorage
    const token = localStorage.getItem('authToken') || (JSON.parse(localStorage.getItem('user')) || {}).token;
    
    const response = await axios.get(`${API_URL}/admin/users`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error fetching all users:', error);
    throw error;
  }
},

// Обновление роли пользователя (для админ-панели)
updateUserRole: async (userId, role) => {
  try {
    const token = localStorage.getItem('authToken') || (JSON.parse(localStorage.getItem('user')) || {}).token;
    
    const response = await axios.put(`${API_URL}/admin/users/${userId}/role`, 
      { role },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Error updating user role:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Ошибка при обновлении роли пользователя'
    };
  }
},

// Удаление пользователя (добавьте этот метод и соответствующий эндпоинт на сервере)
deleteUser: async (userId) => {
  try {
    const token = localStorage.getItem('authToken') || (JSON.parse(localStorage.getItem('user')) || {}).token;
    
    const response = await axios.delete(`${API_URL}/admin/users/${userId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Error deleting user:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Ошибка при удалении пользователя'
    };
  }
},

// Обновление мероприятия
// Обновление мероприятия
updateEvent: async (eventId, eventData) => {
  try {
    const token = localStorage.getItem('authToken') || (JSON.parse(localStorage.getItem('user')) || {}).token;
    
    const response = await axios.put(`${API_URL}/events/${eventId}`, eventData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Error updating event:', error);
    return {
      success: false, 
      message: error.response?.data?.message || 'Ошибка при обновлении мероприятия'
    };
  }
},

// Удаление мероприятия
deleteEvent: async (eventId) => {
  try {
    const token = localStorage.getItem('authToken') || (JSON.parse(localStorage.getItem('user')) || {}).token;
    
    const response = await axios.delete(`${API_URL}/events/${eventId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Error deleting event:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Ошибка при удалении мероприятия'
    };
  }
},

// Создание места проведения
createVenue: async (venueData) => {
  try {
    // Получаем токен из localStorage
    const token = localStorage.getItem('authToken') || (JSON.parse(localStorage.getItem('user')) || {}).token;
    
    const response = await axios.post(`${API_URL}/venues`, venueData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Error creating venue:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Ошибка при создании места проведения'
    };
  }
},

// Обновление места проведения
updateVenue: async (venueId, venueData) => {
  try {
    const token = localStorage.getItem('authToken') || (JSON.parse(localStorage.getItem('user')) || {}).token;
    
    const response = await axios.put(`${API_URL}/venues/${venueId}`, venueData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Error updating venue:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Ошибка при обновлении места проведения'
    };
  }
},

// Удаление уведомления
deleteNotification: async (notificationId) => {
  try {
    // Получаем текущего пользователя
    const user = JSON.parse(localStorage.getItem('user'));
    const token = localStorage.getItem('authToken') || (user || {}).token;
    
    const response = await axios.delete(`${API_URL}/notifications/${notificationId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Ошибка при удалении уведомления:', error);
    throw error;
  }
},

// Удаление места проведения
deleteVenue: async (venueId) => {
  try {
    const token = localStorage.getItem('authToken') || (JSON.parse(localStorage.getItem('user')) || {}).token;
    
    const response = await axios.delete(`${API_URL}/venues/${venueId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Error deleting venue:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Ошибка при удалении места проведения'
    };
  }
}
  };



  


export default apiService;