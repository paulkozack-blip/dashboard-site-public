// utils/math.ts - ИСПРАВЛЕННАЯ ВЕРСИЯ

/**
 * @fileoverview Утилиты для агрегации и математических операций на графике
 */

import { VolumeStackPoint } from '@/types/charts';
import { addAlphaToHex } from './color';

/**
 * Суммирует объемы для всех тикеров по каждой дате и разбивает по тикерам
 * @param volumeData - Map ticker -> Array<{time, volume, color}>
 * @returns Array<VolumeStackPoint>
 */
export const aggregateVolumeStack = (
  volumeData: Record<string, Array<{ time: number; volume: number; color: string }>>
): VolumeStackPoint[] => {
  const timeMap: Record<string, VolumeStackPoint> = {};

  Object.entries(volumeData).forEach(([ticker, points]) => {
    points.forEach(({ time, volume, color }) => {
      if (!timeMap[time]) {
        timeMap[time] = {
          time,
          total: 0,
          parts: [],
        };
      }
      timeMap[time].total += volume;
      timeMap[time].parts.push({ 
        ticker, 
        volume, 
        color 
      });
    });
  });

  return Object.values(timeMap).sort((a, b) => a.time - b.time);
};

/**
 * Сортирует части объемов по убыванию для корректного stacked отображения
 */
export const sortVolumeParts = (parts: Array<{ ticker: string; volume: number; color: string }>) => {
  return [...parts].sort((a, b) => b.volume - a.volume);
};

/**
 * Рассчитывает прозрачность для каждого объема на основе его доли
 */
export const calculateVolumeAlpha = (volume: number, totalVolume: number): number => {
  if (totalVolume === 0) return 0.7;
  const ratio = volume / totalVolume;
  // Базовая прозрачность + коррекция для малых объемов
  return Math.max(0.3, Math.min(0.9, 0.5 + ratio * 0.4));
};

/**
 * Создает stacked volume данные с сортировкой и прозрачностью
 */
export const createStackedVolumeData = (
  volumeStack: VolumeStackPoint[]
): Record<string, Array<{ time: number; value: number; color: string }>> => {
  const result: Record<string, Array<{ time: number; value: number; color: string }>> = {};
  
  volumeStack.forEach(point => {
    const sortedParts = sortVolumeParts(point.parts);
    
    sortedParts.forEach(part => {
      const tickerKey = part.ticker;
      if (!result[tickerKey]) {
        result[tickerKey] = [];
      }
      
      const alpha = calculateVolumeAlpha(part.volume, point.total);
      const colorWithAlpha = addAlphaToHex(part.color, alpha);
      
      result[tickerKey]!.push({
        time: point.time,
        value: part.volume,
        color: colorWithAlpha
      });
    });
  });
  
  return result;
};

/**
 * Суммирует объем по тикеру
 * @param series - Array с volume
 * @returns общий объем
 */
export const sumVolumes = (
  series: Array<{ volume?: number }>
): number => {
  return series.reduce((acc, cur) => acc + (cur.volume || 0), 0);
};

/**
 * Находит максимальный объем среди всех тикеров
 * @param volumeStack - Массив VolumeStackPoint
 * @returns максимальный общий объем
 */
export const getMaxTotalVolume = (
  volumeStack: VolumeStackPoint[]
): number => {
  return volumeStack.reduce((max, point) => Math.max(max, point.total), 0);
};

/**
 * Простое округление числа
 * @param value - входное число
 * @param precision - количество знаков
 * @returns округленное число
 */
export const roundValue = (value: number, precision: number = 2): number => {
  const mult = 10 ** precision;
  return Math.round(value * mult) / mult;
};

/**
 * Безопасное деление
 * @param numerator - числитель
 * @param denominator - знаменатель
 * @returns результат деления или 0 если знаменатель == 0
 */
export const safeDivide = (
  numerator: number,
  denominator: number
): number => {
  return denominator !== 0 ? numerator / denominator : 0;
};