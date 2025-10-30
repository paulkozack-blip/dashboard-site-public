/**
 * @fileoverview Типы для компонентов графиков и данных
 * @description Строго типизированные интерфейсы для работы с финансовыми графиками
 */

/**
 * Точка данных для свечного графика
 * @interface CandlestickPoint
 */
export interface CandlestickPoint {
  /** Unix timestamp в секундах (начало дня) */
  time: number;
  /** Цена открытия */
  open: number;
  /** Максимальная цена */
  high: number;
  /** Минимальная цена */
  low: number;
  /** Цена закрытия */
  close: number;
  /** Объем торгов (опционально) */
  volume?: number;
}

/**
 * Точка данных для линейного графика
 * @interface LinePoint
 */
export interface LinePoint {
  /** Unix timestamp в секундах (начало дня) */
  time: number;
  /** Значение цены */
  value: number;
  /** Объем торгов (опционально) */
  volume?: number;
}

/**
 * Информация о серии данных для графика
 * @interface SeriesInfo
 */
export interface SeriesInfo {
  /** Уникальный идентификатор серии */
  id: string;
  /** Название тикера */
  ticker: string;
  /** Название группы */
  group: string;
  /** Тип графика */
  type: 'line' | 'candlestick';
  /** Данные точек */
  data: CandlestickPoint[] | LinePoint[];
  /** Цвет серии (опционально) */
  color?: string;
}

/**
 * Точка данных для стекованной гистограммы объемов
 * @interface VolumeStackPoint
 */
export interface VolumeStackPoint {
  /** Unix timestamp в секундах */
  time: number;
  /** Общий объем */
  total: number;
  /** Разбивка по тикерам */
  parts: Array<{
    /** Название тикера */
    ticker: string;
    /** Объем тикера */
    volume: number;
    /** Цвет тикера */
    color: string;
    alpha?: number;
  }>;
}

/**
 * Настройки индикаторов от сервера
 * @interface IndicatorSettings
 */
export interface IndicatorSettings {
  /** Периоды для EMA */
  ema_periods: number[];
  /** Период для RSI */
  rsi_period: number;
  /** Дата последнего обновления */
  last_updated: string;
  /** Кто обновил (опционально) */
  updated_by?: string;
}

/**
 * Ответ сервера с данными индикатора
 * @interface IndicatorResponse
 */
export interface IndicatorResponse {
  /** Название тикера */
  ticker: string;
  /** Название индикатора (например, "ema_50", "rsi_14") */
  indicator: string;
  /** Массив данных индикатора */
  data: Array<{
    /** Дата в ISO формате */
    date: string;
    /** Значение индикатора */
    value: number;
  }>;
}

/**
 * Данные индикатора для отображения
 * @interface IndicatorData
 */
export interface IndicatorData {
  /** Название тикера */
  ticker: string;
  /** Название индикатора */
  indicator: string;
  /** Период индикатора */
  period: number;
  /** Данные для отображения */
  data: LinePoint[];
  /** Цвет линии индикатора */
  color: string;
}

/**
 * Состояние активных индикаторов для тикера
 * @interface TickerIndicatorState
 */
export interface TickerIndicatorState {
  ema?: boolean;
  rsi?: boolean;
  volume?: boolean; // ← ДОБАВИТЬ
}

/**
 * Глобальное состояние индикаторов
 * @interface IndicatorsState
 */
export interface IndicatorsState {
  /** Карта тикер -> состояние его индикаторов */
  [ticker: string]: TickerIndicatorState;
}

/**
 * Настройки отображения графика
 * @interface ChartDisplaySettings
 */
export interface ChartDisplaySettings {
  /** Показывать ли объемы */
  showVolume: boolean;
  /** Активные тикеры */
  activeTickers: string[];
  /** Активные индикаторы */
  activeIndicators: IndicatorsState;
}

/**
 * Данные tooltip при наведении
 * @interface TooltipData
 */
export interface TooltipData {
  /** Время (timestamp) */
  time: number;
  /** Данные по тикерам */
  tickers: Array<{
    ticker: string;
    color: string;
    price?: number;
    open?: number;
    high?: number;
    low?: number;
    close?: number;
    volume?: number;
  }>;
  /** Данные по индикаторам */
  indicators: Array<{
    ticker: string;
    indicator: string;
    value: number;
    color: string;
  }>;
  /** Общий объем */
  totalVolume: number;
  /** Разбивка объемов */
  volumeBreakdown: Array<{
    ticker: string;
    volume: number;
    color: string;
  }>;
}

/**
 * Конфигурация цветов для группы
 * @interface GroupColorConfig
 */
export interface GroupColorConfig {
  /** Базовые цвета тикеров */
  tickerColors: Record<string, string>;
  /** Цвета индикаторов */
  indicatorColors: Record<string, Record<string, string>>;
}

/**
 * Параметры для генерации цветов индикаторов
 * @interface IndicatorColorParams
 */
export interface IndicatorColorParams {
  /** Базовый цвет тикера */
  baseColor: string;
  /** Тип индикатора */
  indicatorType: 'ema' | 'rsi';
  /** Период индикатора */
  period: number;
  /** Все периоды для этого типа индикатора */
  allPeriods: number[];
}
