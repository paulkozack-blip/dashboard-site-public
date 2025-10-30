// services/api.ts

import axios from 'axios';

// Импортируем типы
import {
  GroupsData,
  LoginCredentials,
  RegisterData,
  User,
  ApiUser,
  TickerName,
  GroupChartData,
  IndicatorResponse,
  IndicatorSettingsResponse,
  LoginResponse,
} from '../types';

const API_BASE_URL = 'http://localhost:8000';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const apiService = {
  // АУТЕНТИФИКАЦИЯ
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    console.log(`🔐 [API] Вход пользователя: ${credentials.username}`);
    const response = await api.post('/auth/login', credentials);
    console.log(
      `✅ [API] Успешный вход для пользователя: ${credentials.username}`
    );
    return response.data;
  },

  register: async (userData: RegisterData): Promise<any> => {
    console.log(`📝 [API] Регистрация пользователя: ${userData.username}`);
    const response = await api.post('/auth/register', userData);
    console.log(
      `✅ [API] Успешная регистрация для пользователя: ${userData.username}`
    );
    return response.data;
  },

  getProfile: async (): Promise<User> => {
    console.log(`👤 [API] Получение профиля пользователя`);
    const response = await api.get('/auth/profile');
    return response.data;
  },

  getMe: async (): Promise<User> => {
    console.log(`👤 [API] Получение текущего пользователя`);
    const response = await api.get('/auth/me');
    return response.data;
  },

  // ДАННЫЕ
  uploadLinearData: async (file: File): Promise<any> => {
    console.log(`📤 [API] Загрузка линейных данных: ${file.name}`);
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/charts/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    console.log(`✅ [API] Загрузка линейных данных завершена`);
    return response.data;
  },

  uploadCandlestickData: async (file: File): Promise<any> => {
    console.log(`📤 [API] Загрузка свечных данных: ${file.name}`);
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/charts/upload-candlestick', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    console.log(`✅ [API] Загрузка свечных данных завершена`);
    return response.data;
  },

  resetData: async (ticker?: string): Promise<any> => {
    const url = ticker
      ? `/charts/reset?ticker=${encodeURIComponent(ticker)}`
      : '/charts/reset';
    console.log(
      `🗑️ [API] Сброс данных: ${ticker ? `тикер ${ticker}` : 'все данные'}`
    );
    const response = await api.post(url);
    console.log(`✅ [API] Сброс данных завершен`);
    return response.data;
  },

  // ГРУППЫ И ТИКЕРЫ
  getAvailableGroups: async (): Promise<GroupsData> => {
    console.log(`📊 [API] Получение доступных групп`);
    const response = await api.get('/charts/api/available-groups');
    console.log(
      `✅ [API] Получено групп: ${Object.keys(response.data).length}`
    );
    return response.data;
  },

  getTickers: async (): Promise<TickerName[]> => {
    console.log(`📈 [API] Получение списка тикеров`);
    const response = await api.get('/charts/api/tickers');
    console.log(`✅ [API] Получено тикеров: ${response.data.length}`);
    return response.data;
  },

  // ИСПРАВЛЕННЫЙ метод getChartData - возвращает GroupChartData
  getChartData: async (group: string): Promise<GroupChartData> => {
    console.log(`📊 [API] Запрос данных графика для группы: ${group}`);
    const response = await api.get('/charts/api/chart-data', {
      params: { group },
    });

    const tickerCount = Object.keys(response.data).length;
    console.log(
      `✅ [API] Получены данные для группы ${group}: ${tickerCount} тикеров`
    );

    // Логируем первый тикер для отладки
    const firstTickerName = Object.keys(response.data)[0];
    if (firstTickerName) {
      const firstTicker = response.data[firstTickerName];
      console.log(
        `📋 [API] Пример данных - тикер: ${firstTicker.ticker}, тип: ${firstTicker.type}, записей: ${firstTicker.data.length}`
      );
    }

    return response.data;
  },

  // ИНДИКАТОРЫ
  getIndicatorSettings: async (): Promise<IndicatorSettingsResponse> => {
    console.log(`⚙️ [API] Получение настроек индикаторов`);
    const response = await api.get('/charts/getIndicatorSettings');
    console.log(`✅ [API] Настройки индикаторов получены:`, {
      emaPeriods: response.data.ema_periods,
      rsiPeriod: response.data.rsi_period,
    });
    return response.data;
  },

  getIndicatorData: async (
    ticker: string,
    indicator: string,
    period: number
  ): Promise<IndicatorResponse> => {
    const encodedTicker = encodeURIComponent(ticker);
    console.log(
      `📈 [API] Запрос данных индикатора: ${indicator}_${period} для тикера: ${ticker}`
    );

    const response = await api.get(
      `/charts/indicators/${encodedTicker}?indicator=${indicator}&period=${period}`
    );

    console.log(
      `✅ [API] Получены данные индикатора ${indicator}_${period}: ${response.data.data.length} точек`
    );
    return response.data;
  },

  // Вспомогательные методы для индикаторов
  getEMA: async (
    ticker: string,
    period: number
  ): Promise<IndicatorResponse> => {
    return apiService.getIndicatorData(ticker, 'ema', period);
  },

  getRSI: async (
    ticker: string,
    period: number
  ): Promise<IndicatorResponse> => {
    return apiService.getIndicatorData(ticker, 'rsi', period);
  },

  // ИНВАЙТЫ
  createInvite: async (inviteData?: {
    username_for?: string;
    expires_in_days?: number;
  }): Promise<any> => {
    console.log(`🎫 [API] Создание инвайт-кода`);
    const response = await api.post('/invites/create', inviteData || {});
    console.log(`✅ [API] Инвайт-код создан: ${response.data.invite_code}`);
    return response.data;
  },

  getMyInvites: async (): Promise<any> => {
    console.log(`🎫 [API] Получение моих инвайт-кодов`);
    const response = await api.get('/invites/my');
    return response.data;
  },

  validateInvite: async (inviteCode: string): Promise<any> => {
    console.log(`🔍 [API] Проверка инвайт-кода: ${inviteCode}`);
    const response = await api.get(`/invites/validate/${inviteCode}`);
    return response.data;
  },

  deleteInvite: async (inviteId: string): Promise<any> => {
    console.log(`🗑️ [API] Удаление инвайт-кода: ${inviteId}`);
    const response = await api.delete(`/invites/${inviteId}`);
    console.log(`✅ [API] Инвайт-код удален`);
    return response.data;
  },

  // АДМИНИСТРИРОВАНИЕ
  getUsers: async (): Promise<ApiUser[]> => {
    console.log(`👥 [API] Получение списка пользователей`);
    const response = await api.get('/admin/users');
    console.log(`✅ [API] Получено пользователей:`, response.data);

    // Бэкенд возвращает { users: [], total: number }, берем поле users
    const users = response.data.users || [];
    console.log(`✅ [API] Обработано пользователей: ${users.length}`);
    return users;
  },

  deleteUser: async (userId: number): Promise<any> => {
    console.log(`🗑️ [API] Удаление пользователя: ${userId}`);
    const response = await api.delete(`/admin/users/${userId}`);
    console.log(`✅ [API] Пользователь удален`);
    return response.data;
  },

  toggleUserActive: async (userId: number): Promise<any> => {
    console.log(`🔄 [API] Переключение статуса пользователя: ${userId}`);
    const response = await api.post(`/admin/users/${userId}/activate`);
    console.log(`✅ [API] Статус пользователя изменен`);
    return response.data;
  },

  makeUserAdmin: async (userId: number): Promise<any> => {
    console.log(`👑 [API] Назначение админом пользователя: ${userId}`);
    const response = await api.post(`/admin/users/${userId}/make-admin`);
    console.log(`✅ [API] Пользователь назначен админом`);
    return response.data;
  },

  setIndicators: async (settings: any): Promise<any> => {
    console.log(`⚙️ [API] Установка настроек индикаторов`, settings);
    try {
      const response = await api.post('/charts/set-indicators', settings);
      console.log(`✅ [API] Настройки индикаторов установлены`);
      return response.data;
    } catch (error: any) {
      console.error(`❌ [API] Ошибка установки настроек:`, error);
      throw error;
    }
  },
};

// Интерцепторы для обработки ошибок и авторизации
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error(`❌ [API] Ошибка запроса:`, {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
    });
    return Promise.reject(error);
  }
);

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log(
      `🚀 [API] Запрос: ${config.method?.toUpperCase()} ${config.url}`
    );
    return config;
  },
  (error) => Promise.reject(error)
);
