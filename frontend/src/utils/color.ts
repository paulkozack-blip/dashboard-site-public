/**
 * @fileoverview Утилиты для работы с цветами
 * @description Функции для генерации и модификации цветов для графиков
 */

/**
 * Базовая палитра цветов для тикеров (до 10 цветов)
 */
export const BASE_COLORS = [
  '#1E88E5', // Blue
  '#E53935', // Red
  '#43A047', // Green
  '#FB8C00', // Orange
  '#8E24AA', // Purple
  '#00ACC1', // Cyan
  '#FDD835', // Yellow
  '#6D4C41', // Brown
  '#3949AB', // Indigo
  '#00897B', // Teal
] as string[];

/**
 * Конвертирует HEX цвет в RGB компоненты
 * @param hex - Цвет в HEX формате (#RRGGBB)
 * @returns RGB компоненты
 */
export function hexToRgb(
  hex: string
): { r: number; g: number; b: number } | null {
  // #ff5544 или ff5544
  const cleaned = hex.replace(/^#/, '');
  const match = cleaned.match(/^([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (!match) return null;
  // Гарантируем, что match всегда массив с тремя строками
  const rHex = match[1] ?? '00';
  const gHex = match[2] ?? '00';
  const bHex = match[3] ?? '00';
  return {
    r: parseInt(rHex, 16),
    g: parseInt(gHex, 16),
    b: parseInt(bHex, 16),
  };
}

export function hexToRgba(hex: string, opacity: number = 1): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return `rgba(153, 153, 153, ${opacity})`; // fallback color
  const r = parseInt(result[1] ?? '00', 16);
  const g = parseInt(result[2] ?? '00', 16);
  const b = parseInt(result[3] ?? '00', 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

/**
 * Конвертирует RGB компоненты в HEX цвет
 * @param r - Красный компонент (0-255)
 * @param g - Зеленый компонент (0-255)
 * @param b - Синий компонент (0-255)
 * @returns Цвет в HEX формате
 */
export const rgbToHex = (r: number, g: number, b: number): string => {
  const toHex = (c: number): string => {
    const hex = Math.round(Math.max(0, Math.min(255, c))).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

/**
 * Осветляет цвет на заданный процент
 * @param color - Исходный цвет в HEX формате
 * @param amount - Процент осветления (0-100)
 * @returns Осветленный цвет в HEX формате
 */
export const lightenColor = (color: string, amount: number): string => {
  const rgb = hexToRgb(color);
  if (!rgb) return color;

  const factor = amount / 100;
  const r = rgb.r + (255 - rgb.r) * factor;
  const g = rgb.g + (255 - rgb.g) * factor;
  const b = rgb.b + (255 - rgb.b) * factor;

  return rgbToHex(r, g, b);
};

/**
 * Затемняет цвет на заданный процент
 * @param color - Исходный цвет в HEX формате
 * @param amount - Процент затемнения (0-100)
 * @returns Затемненный цвет в HEX формате
 */
export const darkenColor = (color: string, amount: number): string => {
  const rgb = hexToRgb(color);
  if (!rgb) return color;

  const factor = 1 - amount / 100;
  const r = rgb.r * factor;
  const g = rgb.g * factor;
  const b = rgb.b * factor;

  return rgbToHex(r, g, b);
};

/**
 * Добавляет прозрачность к цвету
 * @param color - Цвет в HEX формате
 * @param alpha - Прозрачность (0-1)
 * @returns Цвет в RGBA формате
 */
export const addAlpha = (color: string, alpha: number): string => {
  const rgb = hexToRgb(color);
  if (!rgb) return color;

  const a = Math.max(0, Math.min(1, alpha));
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${a})`;
};

/**
 * Генерирует цвет для EMA индикатора на основе базового цвета тикера
 * @param baseColor - Базовый цвет тикера
 * @param period - Период EMA
 * @param allPeriods - Все доступные периоды (отсортированные)
 * @returns Цвет для EMA линии
 */
export const generateEmaColor = (
  baseColor: string,
  period: number,
  allPeriods: number[]
): string => {
  if (allPeriods.length <= 1) return baseColor;

  const sortedPeriods = [...allPeriods].sort((a, b) => a - b);
  const index = sortedPeriods.indexOf(period);

  if (index === -1) return baseColor;

  // Короткие периоды = светлее, длинные = темнее
  const lightnessFactor = (index / (sortedPeriods.length - 1)) * 40; // 0-40%

  if (index < sortedPeriods.length / 2) {
    // Первая половина - осветляем
    return lightenColor(baseColor, 30 - lightnessFactor);
  } else {
    // Вторая половина - затемняем
    return darkenColor(baseColor, lightnessFactor - 10);
  }
};

/**
 * Генерирует цвет для RSI индикатора
 * @param baseColor - Базовый цвет тикера
 * @returns Цвет для RSI линии
 */
export const generateRsiColor = (baseColor: string): string => {
  // RSI делаем более приглушенным
  return addAlpha(baseColor, 0.8);
};

/**
 * Получает контрастный цвет (черный или белый) для заданного цвета
 * @param backgroundColor - Фоновый цвет в HEX формате
 * @returns Контрастный цвет (#000000 или #FFFFFF)
 */
export const getContrastColor = (backgroundColor: string): string => {
  const rgb = hexToRgb(backgroundColor);
  if (!rgb) return '#000000';

  // Используем формулу luminance
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;

  return luminance > 0.5 ? '#000000' : '#FFFFFF';
};

/**
 * Проверяет валидность HEX цвета
 * @param color - Строка цвета
 * @returns true если цвет валиден
 */
export const isValidHexColor = (color: string): boolean => {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
};

/**
 * Генерирует градиент между двумя цветами
 * @param startColor - Начальный цвет
 * @param endColor - Конечный цвет
 * @param steps - Количество шагов градиента
 * @returns Массив цветов градиента
 */
export const generateGradient = (
  startColor: string,
  endColor: string,
  steps: number
): string[] => {
  const startRgb = hexToRgb(startColor);
  const endRgb = hexToRgb(endColor);

  if (!startRgb || !endRgb || steps < 2) {
    return [startColor, endColor];
  }

  const colors: string[] = [];

  for (let i = 0; i < steps; i++) {
    const ratio = i / (steps - 1);

    const r = Math.round(startRgb.r + (endRgb.r - startRgb.r) * ratio);
    const g = Math.round(startRgb.g + (endRgb.g - startRgb.g) * ratio);
    const b = Math.round(startRgb.b + (endRgb.b - startRgb.b) * ratio);

    colors.push(rgbToHex(r, g, b));
  }

  return colors;
};

export const addAlphaToHex = (hex: string, alpha: number): string => {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;

  const a = Math.max(0, Math.min(1, alpha));
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${a})`;
};
