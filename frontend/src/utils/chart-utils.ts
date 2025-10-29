// utils/chart-utils.ts - ДОБАВИТЬ НОВЫЙ ФАЙЛ
/**
 * Утилиты для работы с графиками
 */

/**
 * Рассчитывает оптимальные параметры для отображения объемов
 */
export const calculateVolumeScale = (volumeData: number[]): {
  minValue: number;
  maxValue: number;
  scaleFactor: number;
} => {
  if (volumeData.length === 0) {
    return { minValue: 0, maxValue: 100, scaleFactor: 1 };
  }

  const maxVolume = Math.max(...volumeData);
  const minVolume = Math.min(...volumeData);
  
  // Добавляем отступы для лучшего отображения
  const maxValue = maxVolume * 1.1;
  const minValue = Math.max(0, minVolume * 0.9);
  
  // Коэффициент масштабирования для нормализации
  const scaleFactor = maxValue > 0 ? 1000000 / maxValue : 1;

  return { minValue, maxValue, scaleFactor };
};

/**
 * Форматирует объемы для отображения
 */
export const formatVolume = (volume: number): string => {
  if (volume >= 1000000) {
    return `${(volume / 1000000).toFixed(1)}M`;
  } else if (volume >= 1000) {
    return `${(volume / 1000).toFixed(1)}K`;
  }
  return volume.toString();
};

/**
 * Определяет цвет объема на основе направления цены
 */
export const getVolumeColor = (
  currentPrice: number, 
  previousPrice: number, 
  baseUpColor: string = '#26a69a', 
  baseDownColor: string = '#ef5350'
): string => {
  return currentPrice >= previousPrice ? baseUpColor : baseDownColor;
};