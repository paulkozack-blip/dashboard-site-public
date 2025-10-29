import { useMemo } from 'react';
import { BASE_COLORS, generateEmaColor, generateRsiColor } from '@/utils/color';

export function useColors(group: string, tickers: string[]) {
  // Гарантированно всегда выдаём string, даже если тикеров больше, чем цветов → .padEnd
  const colorMap = useMemo(() => {
    const map: Record<string, string> = {};
    tickers.forEach((ticker, idx) => {
      const color = BASE_COLORS[idx % BASE_COLORS.length] || '#000';
      map[ticker] = color;
    });
    return map;
  }, [group, tickers.join(',')]);

  function getEmaColor(ticker: string, period: number, allPeriods: number[]) {
    const base = colorMap[ticker] || '#000';
    return generateEmaColor(base, period, allPeriods);
  }

  function getRsiColor(ticker: string) {
    const base = colorMap[ticker] || '#AAA';
    return generateRsiColor(base);
  }

  function getBaseColor(ticker: string) {
    return colorMap[ticker] || '#444';
  }

  return { colorMap, getBaseColor, getEmaColor, getRsiColor };
}
