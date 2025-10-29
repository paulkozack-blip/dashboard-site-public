import { GroupChartData } from '@/types/api';
export {} // чтобы файл был модулем

// Пример ответа для линейного графика
export const lineGroupChartData: GroupChartData = {
  'Восток92': {
    ticker: 'Восток92',
    group: '92',
    type: 'line', // литерал!
    data: [
      { date: '2022-01-10', price: 51557.52, volume: 3900 },
      { date: '2022-01-11', price: 51320.00, volume: 3850 },
    ],
  },
  'Лукойл92': {
    ticker: 'Лукойл92',
    group: '92',
    type: 'line', // литерал!
    data: [
      { date: '2022-01-10', price: 50400.00, volume: 4120 },
    ],
  },
};

export const candleGroupChartData: GroupChartData = {
  'Газпром': {
    ticker: 'Газпром',
    group: 'Gazprom',
    type: 'candlestick', // литерал!
    data: [
      { date: '2022-01-10', open: 60000, high: 60500, low: 59500, close: 60300, volume: 2100 },
      { date: '2022-01-11', open: 60300, high: 60700, low: 59980, close: 60400, volume: 1950 },
    ],
  },
};

// Пример ответа индикатора
export const ema50Response = {
  ticker: "Восток92",
  indicator: "ema_50",
  data: [
    { date: "2022-01-10", value: 51600 },
    { date: "2022-01-11", value: 51540 }
  ]
};

export const rsiResponse = {
  ticker: "Лукойл92",
  indicator: "rsi_14",
  data: [
    { date: "2022-01-10", value: 51 },
    { date: "2022-01-11", value: 50 }
  ]
};
