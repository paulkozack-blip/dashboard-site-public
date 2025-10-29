/**
 * @fileoverview API типы и интерфейсы
 * @description Типы для работы с REST API
 */

/**
 * Обобщенный результат API вызова
 * @interface ApiResult
 */
export interface ApiResult<T> {
  /** Данные ответа */
  data: T;
  /** Статус запроса */
  success: boolean;
  /** Сообщение об ошибке (если есть) */
  error?: string;
  /** HTTP статус код */
  statusCode: number;
}

/**
 * Ошибка API
 * @interface ApiError
 */
export interface ApiError {
  /** Сообщение об ошибке */
  message: string;
  /** HTTP статус код */
  statusCode: number;
  /** Детали ошибки */
  details?: Record<string, unknown>;
  /** Временная метка ошибки */
  timestamp: string;
}

/**
 * Точка линейных данных из API
 * @interface ApiLineDataPoint
 */
export interface ApiLineDataPoint {
  /** Дата в ISO формате YYYY-MM-DD */
  date: string;
  /** Цена */
  price: number;
  /** Объем */
  volume: number;
}

/**
 * Точка свечных данных из API
 * @interface ApiCandlestickDataPoint
 */
export interface ApiCandlestickDataPoint {
  /** Дата в ISO формате YYYY-MM-DD */
  date: string;
  /** Цена открытия */
  open: number;
  /** Максимальная цена */
  high: number;
  /** Минимальная цена */
  low: number;
  /** Цена закрытия */
  close: number;
  /** Объем */
  volume: number;
}

/**
 * Данные тикера из API
 * @interface ApiTickerData
 */
export interface ApiTickerData {
  /** Название тикера */
  ticker: string;
  /** Название группы */
  group: string;
  /** Тип данных */
  type: 'line' | 'candlestick';
  /** Массив данных */
  data: ApiLineDataPoint[] | ApiCandlestickDataPoint[];
}

/**
 * Ответ API для данных группы графиков
 * @interface GroupChartData
 */
export interface GroupChartData {
  /** Карта тикер -> данные тикера */
  [tickerName: string]: ApiTickerData;
}

/**
 * Информация о группе
 * @interface GroupInfo  
 */
export interface GroupInfo {
  /** Тип графика группы */
  type: 'line' | 'candlestick';
  /** Список тикеров в группе */
  tickers: string[];
}

/**
 * Данные групп
 * @interface GroupsData
 */
export interface GroupsData {
  /** Карта название группы -> информация о группе */
  [groupName: string]: GroupInfo;
}

/**
 * Настройки индикаторов от API
 * @interface IndicatorSettingsResponse
 */
export interface IndicatorSettingsResponse {
  /** Периоды EMA */
  ema_periods: number[];
  /** Период RSI */
  rsi_period: number;
  /** Дата последнего обновления */
  last_updated: string;
  /** Кто обновил (опционально) */
  updated_by?: string;
}

/**
 * Данные одного индикатора от API
 * @interface IndicatorApiResponse
 */
export interface IndicatorApiResponse {
  /** Название тикера */
  ticker: string;
  /** Название индикатора */
  indicator: string;
  /** Данные индикатора */
  data: Array<{
    /** Дата в ISO формате */
    date: string;
    /** Значение */
    value: number;
  }>;
}

/**
 * Параметры запроса данных графика
 * @interface ChartDataParams
 */
export interface ChartDataParams {
  /** Название группы */
  group: string;
}

/**
 * Параметры запроса данных индикатора
 * @interface IndicatorDataParams
 */
export interface IndicatorDataParams {
  /** Название тикера */
  ticker: string;
  /** Тип индикатора */
  indicator: 'ema' | 'rsi';
  /** Период индикатора */
  period?: number;
}

/**
 * Состояние загрузки данных
 * @interface LoadingState
 */
export interface LoadingState {
  /** Загружаются ли данные */
  isLoading: boolean;
  /** Ошибка загрузки */
  error: string | null;
  /** Прогресс загрузки (0-100) */
  progress?: number;
}

/**
 * Параметры для кеширования запросов
 * @interface CacheOptions
 */
export interface CacheOptions {
  /** Время жизни кеша в миллисекундах */
  ttl: number;
  /** Ключ кеша */
  key: string;
  /** Принудительная перезагрузка */
  forceRefresh?: boolean;
}

/**
 * Контроллер для отмены запросов
 * @interface RequestController
 */
export interface RequestController {
  /** Контроллер отмены */
  abortController: AbortController;
  /** Уникальный ID запроса */
  requestId: string;
  /** Временная метка создания */
  timestamp: number;
}