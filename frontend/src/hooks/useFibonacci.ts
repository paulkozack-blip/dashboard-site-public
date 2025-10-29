// hooks/useFibonacci.ts - ИСПРАВЛЕННАЯ ВЕРСИЯ
import { useState, useCallback } from 'react';
import { 
  FibonacciState, 
  FibonacciPoint, 
  FibonacciRetracement,
  FIBONACCI_LEVELS_CONFIG 
} from '@/types/fibonacci';

export const useFibonacci = () => {
  const [fibonacciState, setFibonacciState] = useState<FibonacciState>({
    isDrawing: false,
    currentPoints: {
      start: null,
      end: null
    },
    retracements: []
  });

  // Функция нормализации времени
  const normalizeTime = useCallback((timestamp: number, chartData?: Array<{ time: any }>): number => {
    if (!chartData || chartData.length === 0) {
      return timestamp;
    }

    // Определяем формат времени из данных графика
    const sampleTime = chartData[0]?.time;
    
    if (typeof sampleTime === 'string') {
      // Если график использует строковый формат, конвертируем timestamp в строку
      // Но поскольку мы работаем с числами, просто возвращаем timestamp
      // Конвертацию в строку будем делать на уровне отрисовки
      console.log('📅 График использует строковый формат времени, но точки Фибоначчи используют числа');
    } else if (typeof sampleTime === 'number') {
      // Если график использует числовой формат, проверяем масштаб
      const chartTimeScale = sampleTime > 10000000000 ? 1 : 1000; // UNIX в секундах или миллисекундах
      const inputTimeScale = timestamp > 10000000000 ? 1 : 1000;
      
      if (chartTimeScale !== inputTimeScale) {
        // Конвертируем в тот же масштаб, что и график
        return chartTimeScale === 1 ? Math.floor(timestamp / 1000) : timestamp * 1000;
      }
    }
    
    return timestamp;
  }, []);

  // Начать рисование Фибоначчи
  const startDrawing = useCallback(() => {
    console.log('🎯 [useFibonacci] startDrawing called');
    setFibonacciState(prev => {
      const newState = {
        ...prev,
        isDrawing: true,
        currentPoints: { start: null, end: null }
      };
      console.log('🎯 [useFibonacci] New state after startDrawing:', newState);
      return newState;
    });
  }, []);

  // Отменить рисование
  const cancelDrawing = useCallback(() => {
    console.log('🎯 [useFibonacci] cancelDrawing called');
    setFibonacciState(prev => {
      const newState = {
        ...prev,
        isDrawing: false,
        currentPoints: { start: null, end: null }
      };
      console.log('🎯 [useFibonacci] New state after cancelDrawing:', newState);
      return newState;
    });
  }, []);

  // Добавить точку (начало или конец) с нормализацией времени
  const addPoint = useCallback((point: FibonacciPoint, chartData?: Array<{ time: any }>) => {
    setFibonacciState(prev => {
      if (!prev.isDrawing) return prev;

      const { start, end } = prev.currentPoints;
      
      // Нормализуем время точки используя chartData
      const normalizedPoint = {
        ...point,
        time: normalizeTime(point.time, chartData)
      };
      
      if (!start) {
        return {
          ...prev,
          currentPoints: { ...prev.currentPoints, start: normalizedPoint }
        };
      } else if (!end) {
        const newRetracement = createFibonacciRetracement(start, normalizedPoint);
        return {
          isDrawing: false,
          currentPoints: { start: null, end: null },
          retracements: [...prev.retracements, newRetracement]
        };
      }
      
      return prev;
    });
  }, [normalizeTime]);

  // Удалить все уровни Фибоначчи
  const clearAll = useCallback(() => {
    setFibonacciState({
      isDrawing: false,
      currentPoints: { start: null, end: null },
      retracements: []
    });
  }, []);

  // Удалить конкретный уровень
  const removeRetracement = useCallback((id: string) => {
    setFibonacciState(prev => ({
      ...prev,
      retracements: prev.retracements.filter(r => r.id !== id)
    }));
  }, []);

  // Функция для генерации случайного цвета
  const generateRandomColor = (): string => {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
      '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
      '#F8C471', '#82E0AA', '#F1948A', '#85C1E9', '#D7BDE2',
      '#F9E79F', '#A9DFBF', '#F5B7B1', '#AED6F1', '#D2B4DE'
    ];
    const randomIndex = Math.floor(Math.random() * colors.length);
    return colors[randomIndex] || '#FF6B6B';
  };

  // Функция для генерации уникального ID
  const generateUniqueId = (): string => {
    return `fib-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  };

  const createFibonacciRetracement = (start: FibonacciPoint, end: FibonacciPoint): FibonacciRetracement => {
    const isUptrend = end.price > start.price;
    const lowPoint = isUptrend ? start : end;
    const highPoint = isUptrend ? end : start;
    const priceDiff = highPoint.price - lowPoint.price;

    console.log(`📊 [Fibonacci] Расчет:`, {
      lowPrice: lowPoint.price,
      highPrice: highPoint.price,
      diff: priceDiff,
      isUptrend,
      startTime: new Date(start.time * 1000).toISOString(),
      endTime: new Date(end.time * 1000).toISOString()
    });

    const levels = FIBONACCI_LEVELS_CONFIG.filter(level => level.visible).map((config, index) => {
      const price = isUptrend
        ? lowPoint.price + priceDiff * config.ratio
        : highPoint.price - priceDiff * config.ratio;

      console.log(`📊 [Fibonacci] Уровень ${config.label}: ${isUptrend ? lowPoint.price : highPoint.price} ${isUptrend ? '+' : '-'} ${priceDiff} * ${config.ratio} = ${price}`);

      return {
        level: index,
        ratio: config.ratio,
        price: price,
        label: config.label,
        color: config.color,
        visible: true
      };
    });

    return {
      id: generateUniqueId(),
      startPoint: start,
      endPoint: end,
      levels,
      color: generateRandomColor(),
      visible: true
    };
  };

  // Функция для получения данных для отрисовки на графике
  const getFibonacciSeriesData = useCallback((retracement: FibonacciRetracement, chartData?: Array<{ time: any }>) => {
    const data = [];
    
    // Нормализуем время точек для графика
    const startTime = normalizeTime(retracement.startPoint.time, chartData);
    const endTime = normalizeTime(retracement.endPoint.time, chartData);
    
    // Добавляем основную линию тренда
    data.push(
      { time: startTime, value: retracement.startPoint.price },
      { time: endTime, value: retracement.endPoint.price }
    );
    
    // Добавляем уровни Фибоначчи
    retracement.levels.forEach(level => {
      data.push(
        { time: startTime, value: level.price },
        { time: endTime, value: level.price }
      );
    });
    
    return data;
  }, [normalizeTime]);

  return {
    fibonacciState,
    startDrawing,
    cancelDrawing,
    addPoint,
    clearAll,
    removeRetracement,
    getFibonacciSeriesData,
    normalizeTime
  };
};