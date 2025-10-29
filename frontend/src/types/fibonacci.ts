// types/fibonacci.ts - ОБНОВЛЕННАЯ ВЕРСИЯ
export interface FibonacciPoint {
  time: number;
  price: number;
}

export interface FibonacciLevel {
  level: number;
  ratio: number;
  price: number;
  label: string;
  color: string; 
  visible: boolean; 
}

export interface FibonacciRetracement {
  id: string;
  startPoint: FibonacciPoint;
  endPoint: FibonacciPoint;
  levels: FibonacciLevel[];
  color: string; 
  visible: boolean;
}

export interface FibonacciState {
  isDrawing: boolean;
  currentPoints: {
    start: FibonacciPoint | null;
    end: FibonacciPoint | null;
  };
  retracements: FibonacciRetracement[];
}

// Конфигурация цветов как в TradingView
export const FIBONACCI_LEVELS_CONFIG = [
  { ratio: 0, label: '0.0%', color: '#787b86', visible: true },
  { ratio: 0.236, label: '23.6%', color: '#f44336', visible: true },
  { ratio: 0.382, label: '38.2%', color: '#81c784', visible: true },
  { ratio: 0.5, label: '50.0%', color: '#4caf50', visible: true },
  { ratio: 0.618, label: '61.8%', color: '#009688', visible: true },
  { ratio: 0.786, label: '78.6%', color: '#64b5f6', visible: true },
  { ratio: 1, label: '100.0%', color: '#787b86', visible: true },
  { ratio: 1.272, label: '127.2%', color: '#81c784', visible: false },
  { ratio: 1.414, label: '141.4%', color: '#f44336', visible: false },
  { ratio: 1.618, label: '161.8%', color: '#2962ff', visible: true },
  { ratio: 2.618, label: '261.8%', color: '#f44336', visible: true },
  { ratio: 3.618, label: '361.8%', color: '#9c27b0', visible: true },
  { ratio: 4.236, label: '423.6%', color: '#e91e63', visible: true },
];