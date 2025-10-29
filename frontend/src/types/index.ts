// types/index.ts

// Типы для данных тикеров
export type TickerName = string;
export type GroupName = string;

export interface GroupsData {
  [groupName: GroupName]: GroupInfo;
}

export interface GroupInfo {
  type: 'line' | 'candlestick';
  tickers: TickerName[];
}

// Типы для мета-информации
export interface TickerMeta {
  ticker: string;
  group: string;
  type: 'line' | 'candlestick';
  last_updated: string;
  total_records: number;
}

export interface MetaData {
  [ticker: string]: TickerMeta;
}

// Типы для аутентификации
export interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'user';
  created_at: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  password: string;
  invite_code: string;
}

/**
 * Ответ сервера при успешной аутентификации
 * @interface LoginResponse
 * @property {string} access_token - JWT токен для авторизации
 * @property {string} token_type - Тип токена (обычно "Bearer")
 * @property {User} user - Данные авторизованного пользователя
 */
export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
}

// Типы для инвайтов
export interface Invite {
  id: string;
  invite_code: string;
  username_for?: string;
  invited_by: string;
  is_used: boolean;
  created_at: string;
  expires_at: string;
  used_by?: string;
  used_at?: string;
}

// Типы для ответов API
export interface ApiResponse<T> {
  data: T;
  message?: string;
  error?: string;
  status: 'success' | 'error';
}

export interface UploadStats {
  message: string;
  statistics: {
    filename: string;
    total_sheets: number;
    new_records_added: number;
    existing_records_skipped: number;
    invalid_records_skipped: number;
    sheets_processed: number;
    processing_date: string;
    tickers_details: TickerStats[];
  };
}

export interface TickerStats {
  ticker: string;
  group: string;
  new_records: number;
  existing_records: number;
  skipped_invalid: number;
  total_in_file: number;
  total_in_db_now: number;
}

// Типы для индикаторов
export interface IndicatorSettings {
  ema_periods: number[];
  rsi_period: number;
  last_updated: string;
  updated_by?: string;
}

// Типы для компонентов
export interface ChartConfig {
  ticker: string;
  group: string;
  type: 'line' | 'candlestick';
  indicators: string[];
}

export interface NavbarGroup {
  name: string;
  tickers: string[];
}

export interface ApiUser {
  id: number; // number вместо string
  username: string;
  role: string; // string вместо enum
  is_active: number;
  created_at: string;
}

// Тип для точки линейного графика
export interface LineDataPoint {
  date: string;
  price: number;
  volume: number;
}

// Тип для точки свечного графика
export interface CandlestickDataPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// Базовый интерфейс для ответа
interface BaseChartResponse {
  ticker: string;
  group: string;
}

// Discriminated Union для ответа API
export type ChartResponse =
  | (BaseChartResponse & { type: 'line'; data: LineDataPoint[] })
  | (BaseChartResponse & { type: 'candlestick'; data: CandlestickDataPoint[] });

// Тип для данных одного индикатора
export interface IndicatorSeries {
  date: string;
  value: number;
}

// Тип для ответа эндпоинта индикатора
export interface IndicatorResponse {
  ticker: string;
  indicator: string; // например "ema_50", "rsi_14"
  data: IndicatorSeries[];
}

// Тип для настроек индикаторов
export interface IndicatorSettingsResponse {
  ema_periods: number[];
  rsi_period: number;
  last_updated: string;
  updated_by?: string;
}

// ===== НОВЫЕ ТИПЫ ДЛЯ ГРАФИКОВ =====

/**
 * Данные одного тикера из ответа API chart-data
 * @interface TickerChartData
 * @property {string} ticker - Название тикера
 * @property {string} group - Название группы  
 * @property {string} type - Тип графика
 * @property {LineDataPoint[] | CandlestickDataPoint[]} data - Массив точек данных
 */
export interface TickerChartData {
  ticker: string;
  group: string;
  type: 'line' | 'candlestick';
  data: LineDataPoint[] | CandlestickDataPoint[];
}

/**
 * Полный ответ API для данных графика группы
 * @interface GroupChartData
 * @description Объект где ключ - название тикера, значение - данные тикера
 * 
 * @example
 * // Ответ для линейной группы "92"
 * {
 *   "Восток92": {
 *     "ticker": "Восток92",
 *     "group": "92",
 *     "type": "line", 
 *     "data": [{"date": "2022-01-10", "price": 51557.52, "volume": 3900}]
 *   }
 * }
 */
export interface GroupChartData {
  [tickerName: string]: TickerChartData;
}

// ===== ТИПЫ ДЛЯ НАВИГАЦИИ И UI =====

/**
 * Типы представлений в приложении
 * @type ViewType
 */
export type ViewType = 'dashboard' | 'admin';

/**
 * Типы графиков
 * @type ChartType
 */
export type ChartType = 'line' | 'candlestick';

// ===== ПРОПСЫ КОМПОНЕНТОВ =====

/**
 * Пропсы для компонента навигации  
 * @interface NavbarProps
 */
export interface NavbarProps {
  onGroupSelect?: (group: string) => void;
  selectedGroup?: string | null;
  currentUser: User | null;
  onLogout: () => void;
  onNavigateToDashboard?: () => void;
  showAdminButton?: boolean;
  showGroupSelector?: boolean; 
  currentView?: ViewType; 
  onViewChange?: (view: ViewType) => void; 
}

/**
 * Пропсы для основного компонента графика
 * @interface ChartContainerProps
 */
export interface ChartContainerProps {
  group: string;
  groupInfo: GroupInfo;
  className?: string;
}

/**
 * Пропсы для компонента линейного графика
 * @interface LineChartProps
 */
export interface LineChartProps {
  chartData: GroupChartData;
  group: string;
  className?: string;
  onIndicatorToggle?: (ticker: string, indicator: string, enabled: boolean) => void;
}

/**
 * Пропсы для компонента свечного графика
 * @interface CandlestickChartProps
 */
export interface CandlestickChartProps {
  chartData: GroupChartData;
  group: string;
  className?: string;
  onIndicatorToggle?: (ticker: string, indicator: string, enabled: boolean) => void;
}

/**
 * Состояние включенных индикаторов для тикера
 * @interface TickerIndicators
 */
export interface TickerIndicators {
  [indicatorKey: string]: boolean; // например "ema_200": true
}

/**
 * Состояние всех индикаторов по тикерам
 * @interface IndicatorsState
 */
export interface IndicatorsState {
  [ticker: string]: TickerIndicators;
}

/**
 * Данные индикатора для отображения на графике
 * @interface LoadedIndicator
 */
export interface LoadedIndicator {
  ticker: string;
  indicator: string;
  data: IndicatorSeries[];
  color?: string; // цвет линии индикатора
}
