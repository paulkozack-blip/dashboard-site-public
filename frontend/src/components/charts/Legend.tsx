/**
 * @file Legend.tsx
 * Легенда и статусбар: отображает текущую дату, активные тикеры, краткие значения, индикаторы
 */
import React from 'react';
import { SeriesInfo, IndicatorData, VolumeStackPoint } from '@/types/charts';

interface LegendProps {
  series: SeriesInfo[];
  tickers: string[];
  indicatorMap: Record<string, IndicatorData>;
  colorMap: Record<string, string>;
  activeIndicators: Record<
    string,
    {
      ema?: Record<number, boolean>;
      rsi?: boolean;
      volume?: boolean;
    }
  >;
  volumeStack: VolumeStackPoint[];
}

interface EmaValue {
  period: string;
  value: number;
}

const Legend: React.FC<LegendProps> = ({
  series,
  tickers,
  indicatorMap,
  colorMap,
  activeIndicators,
  volumeStack,
}) => {
  // Вычисляем текущую дату (последняя общая)
  const allTimes = series.flatMap((s) => (s.data as any[]).map((p) => p.time));
  const latestTime = allTimes.length > 0 ? Math.max(...allTimes) : null;

  // Функция для форматирования чисел (2 знака после запятой)
  const formatNumber = (num: number | undefined | null): string => {
    if (num === undefined || num === null) return '-';
    return num.toFixed(2);
  };

  // Функция для форматирования объема (целые числа)
  const formatVolume = (volume: number | undefined | null): string => {
    if (volume === undefined || volume === null) return '-';
    return Math.round(volume).toLocaleString('ru-RU');
  };

  // Для каждого тикера — последнее значение price/volume
  function getValue(ticker: string) {
    const s = series.find((s) => s.ticker === ticker);
    if (!s) return { price: undefined, volume: undefined };
    const pts = s.data as any[];
    const last = pts[pts.length - 1];
    if (!last) return { price: undefined, volume: undefined };
    return s.type === 'line'
      ? { price: last.value, volume: last.volume }
      : { price: last.close, volume: last.volume };
  }

  // Функция для получения последнего значения индикатора
  function getLastIndicatorValue(
    ticker: string,
    type: 'ema' | 'rsi',
    period?: number
  ): number | null {
    const key = period
      ? `${ticker}_${type}_${period}`
      : Object.keys(indicatorMap).find((k) =>
          k.startsWith(`${ticker}_${type}_`)
        );

    if (!key || !indicatorMap[key]) return null;

    const indicatorData = indicatorMap[key];
    if (!indicatorData.data || indicatorData.data.length === 0) return null;

    const lastValue = indicatorData.data[indicatorData.data.length - 1]?.value;
    return lastValue !== undefined ? lastValue : null;
  }

  // Функция для получения всех активных EMA для тикера
  function getActiveEmaValues(ticker: string): EmaValue[] {
    const indicators = activeIndicators[ticker];
    if (!indicators?.ema) return [];

    const emaValues: EmaValue[] = [];

    Object.entries(indicators.ema).forEach(([period, isActive]) => {
      if (isActive) {
        const value = getLastIndicatorValue(ticker, 'ema', Number(period));
        if (value !== null) {
          emaValues.push({ period, value });
        }
      }
    });

    return emaValues;
  }

  // Функция для получения значения RSI для тикера
  function getRsiValue(ticker: string): number | null {
    const indicators = activeIndicators[ticker];
    if (!indicators?.rsi) return null;

    return getLastIndicatorValue(ticker, 'rsi');
  }

  return (
    <footer className="chart-legend" role="status">
      <span className="legend-date">
        {latestTime
          ? new Date(latestTime * 1000).toLocaleDateString('ru-RU')
          : 'Нет данных'}
      </span>

      {/* Одна строка на тикер со всей информацией */}
      {tickers.map((ticker) => {
        const v = getValue(ticker);
        const emaValues = getActiveEmaValues(ticker);
        const rsiValue = getRsiValue(ticker);

        return (
          <div key={ticker} className="legend-ticker-row">
            <span
              className="legend-ticker-name"
              style={{ color: colorMap[ticker] }}
            >
              {ticker}:
            </span>
            <span className="legend-price">${formatNumber(v.price)}</span>
            <span className="legend-volume">({formatVolume(v.volume)})</span>

            {/* EMA индикаторы */}
            {emaValues.map((ema) => (
              <span key={`ema-${ema.period}`} className="legend-ema">
                EMA{ema.period}: {formatNumber(ema.value)}
              </span>
            ))}

            {/* RSI индикатор */}
            {rsiValue !== null && (
              <span className="legend-rsi">RSI: {formatNumber(rsiValue)}</span>
            )}
          </div>
        );
      })}

      {/* Total volume (stacked) */}
      {volumeStack.length > 0 && (
        <span className="legend-volume-total">
          Общий объем:{' '}
          {formatVolume(volumeStack[volumeStack.length - 1]?.total)}
        </span>
      )}
    </footer>
  );
};

export default Legend;
