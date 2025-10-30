/**
 * @fileoverview Утилиты для работы с датами
 * @description Конвертация между ISO датами и Unix timestamps для lightweight-charts
 */

/**
 * Конвертирует ISO дату (YYYY-MM-DD) в Unix timestamp (начало дня)
 * @param isoDate - Дата в ISO формате
 * @returns Unix timestamp в секундах
 */
export const isoDateToUnixTime = (isoDate: string): number => {
  const date = new Date(isoDate + 'T00:00:00.000Z');
  return Math.floor(date.getTime() / 1000);
};

/**
 * Конвертирует Unix timestamp в ISO дату (YYYY-MM-DD)
 * @param unixTime - Unix timestamp в секундах
 * @returns Дата в ISO формате
 */
export const unixTimeToIsoDate = (unixTime: number): string => {
  const date = new Date(unixTime * 1000);
  return date.toISOString().split('T')[0] as string;
};

/**
 * Получает текущую дату в Unix timestamp (начало дня)
 * @returns Unix timestamp текущего дня
 */
export const getTodayUnixTime = (): number => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.floor(today.getTime() / 1000);
};

/**
 * Проверяет корректность ISO даты
 * @param isoDate - Дата в ISO формате
 * @returns true если дата корректна
 */
export const isValidIsoDate = (isoDate: string): boolean => {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(isoDate)) {
    return false;
  }

  const date = new Date(isoDate + 'T00:00:00.000Z');
  return !isNaN(date.getTime());
};

/**
 * Сортирует массив объектов по времени (по возрастанию)
 * @param items - Массив объектов с полем time
 * @returns Отсортированный массив
 */
export const sortByTime = <T extends { time: number }>(items: T[]): T[] => {
  return [...items].sort((a, b) => a.time - b.time);
};

/**
 * Форматирует Unix timestamp для отображения пользователю
 * @param unixTime - Unix timestamp в секундах
 * @param locale - Локаль для форматирования
 * @returns Отформатированная дата
 */
export const formatUnixTime = (
  unixTime: number,
  locale: string = 'ru-RU'
): string => {
  const date = new Date(unixTime * 1000);
  return date.toLocaleDateString(locale);
};

/**
 * Получает разницу в днях между двумя Unix timestamps
 * @param startTime - Начальное время
 * @param endTime - Конечное время
 * @returns Разница в днях
 */
export const getDaysDifference = (
  startTime: number,
  endTime: number
): number => {
  const diffMs = (endTime - startTime) * 1000;
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
};

/**
 * Создает массив Unix timestamps для периода
 * @param startDate - Начальная дата (ISO)
 * @param endDate - Конечная дата (ISO)
 * @returns Массив Unix timestamps
 */
export const createTimeRange = (
  startDate: string,
  endDate: string
): number[] => {
  const start = isoDateToUnixTime(startDate);
  const end = isoDateToUnixTime(endDate);
  const result: number[] = [];

  const oneDayInSeconds = 24 * 60 * 60;

  for (let time = start; time <= end; time += oneDayInSeconds) {
    result.push(time);
  }

  return result;
};
