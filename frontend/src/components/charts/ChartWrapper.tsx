// components/charts/ChartWrapper.tsx - ИСПРАВЛЕННАЯ ВЕРСИЯ

import React, { useMemo, useState, useEffect, useCallback } from 'react';
import TickerHeader from './TickerHeader';
import IndicatorPanel from './IndicatorPanel';
import CandlestickOrLineChart from './CandlestickOrLineChart';
import Legend from './Legend';

import { useChartData } from '@/hooks/useChartData';
import { useIndicators } from '@/hooks/useIndicators';
import { useColors } from '@/hooks/useColors';
import { useFibonacci } from '@/hooks/useFibonacci';
import { VolumeStackPoint } from '@/types/charts';
import './ChartWrapper.css';

interface ChartWrapperProps {
  group: string;
}

// тип для индикаторов с раздельными EMA
interface TickerIndicators {
  ema: Record<number, boolean>;
  rsi: boolean;
  volume: boolean;
}

const ChartWrapper: React.FC<ChartWrapperProps> = ({ group }) => {
  const { series, volumeStack, isLoading, error, refresh } =
    useChartData(group);
  const tickers = useMemo(
    () => Array.from(new Set(series.map((s) => s.ticker))),
    [series]
  );
  const { colorMap, getEmaColor } = useColors(group, tickers);

  // Хук Фибоначчи
  const { fibonacciState, startDrawing, cancelDrawing, addPoint, clearAll } =
    useFibonacci();

  const [activeTickers, setActiveTickers] = useState<string[]>([]);
  const [currentTicker, setCurrentTicker] = useState<string | null>(null);

  const [activeIndicators, setActiveIndicators] = useState<
    Record<string, TickerIndicators>
  >({});

  // Используем хук с ленивой загрузкой
  const indicatorsHook = useIndicators(tickers, colorMap);

  useEffect(() => {
    if (tickers.length > 0) {
      console.log(
        `✅ [ChartWrapper] Включаем все тикеры для группы ${group}:`,
        tickers
      );
      setActiveTickers(tickers);
      const firstTicker = tickers[0];
      if (firstTicker) {
        setCurrentTicker(firstTicker);
      }

      // Инициализация индикаторов с раздельными EMA (но не загружаем данные)
      const defaultIndicators: Record<string, TickerIndicators> = {};
      const emaPeriods = indicatorsHook.settings?.ema_periods || [50, 200];

      tickers.forEach((ticker) => {
        const emaStates: Record<number, boolean> = {};
        emaPeriods.forEach((period) => {
          emaStates[period] = false;
        });

        defaultIndicators[ticker] = {
          ema: emaStates,
          rsi: false,
          volume: true,
        };
      });
      setActiveIndicators(defaultIndicators);
    }
  }, [tickers, group, indicatorsHook.settings]);

  // Функция для загрузки индикаторов тикера по требованию
  const handleLoadIndicators = useCallback(
    async (ticker: string) => {
      console.log(
        `📥 [ChartWrapper] Загрузка индикаторов для тикера: ${ticker}`
      );

      if (!activeTickers.includes(ticker)) {
        console.warn(
          `⚠️ Нельзя загрузить индикаторы для неактивного тикера: ${ticker}`
        );
        return;
      }

      try {
        await indicatorsHook.loadTickerIndicators(ticker);

        // Инициализируем состояние индикаторов после загрузки (если еще не инициализированы)
        setActiveIndicators((prev) => {
          const current = prev[ticker];
          if (current && Object.keys(current.ema).length > 0) {
            return prev; // Уже инициализированы
          }

          const emaPeriods = indicatorsHook.settings?.ema_periods || [50, 200];
          const emaStates: Record<number, boolean> = {};
          emaPeriods.forEach((period) => {
            emaStates[period] = false;
          });

          return {
            ...prev,
            [ticker]: {
              ema: emaStates,
              rsi: false,
              volume: true,
            },
          };
        });

        console.log(
          `✅ [ChartWrapper] Индикаторы для ${ticker} успешно загружены`
        );
      } catch (error) {
        console.error(
          `❌ [ChartWrapper] Ошибка загрузки индикаторов для ${ticker}:`,
          error
        );
      }
    },
    [indicatorsHook, activeTickers]
  );

  const chartKey = useMemo(() => {
    const activeTickersKey = activeTickers.sort().join('-');
    const indicatorsKey = Object.keys(activeIndicators)
      .sort()
      .map((ticker) => {
        const indicators = activeIndicators[ticker];
        if (!indicators) return '';
        const emaKeys = Object.keys(indicators.ema)
          .filter((period) => indicators.ema[Number(period)])
          .join('');
        return `${ticker}-${emaKeys}${indicators.rsi ? 'R' : ''}${indicators.volume ? 'V' : ''}`;
      })
      .join('_');

    return `${group}-${activeTickersKey}-${indicatorsKey}`;
  }, [group, activeTickers, activeIndicators]);

  // Переключение видимости тикера
  const toggleTicker = (ticker: string) => {
    setActiveTickers((prev) => {
      const isCurrentlyActive = prev.includes(ticker);
      const newActiveTickers = isCurrentlyActive
        ? prev.filter((t) => t !== ticker)
        : [...prev, ticker];

      if (isCurrentlyActive) {
        // Отключаем все индикаторы при скрытии тикера
        setActiveIndicators((prevIndicators) => {
          const currentIndicators = prevIndicators[ticker];
          if (!currentIndicators) return prevIndicators;

          const disabledEma: Record<number, boolean> = {};
          Object.keys(currentIndicators.ema).forEach((period) => {
            disabledEma[Number(period)] = false;
          });

          return {
            ...prevIndicators,
            [ticker]: {
              ...currentIndicators,
              ema: disabledEma,
              rsi: false,
              volume: false,
            },
          };
        });
      } else {
        // Включаем volume по умолчанию при показе тикера
        setActiveIndicators((prevIndicators) => ({
          ...prevIndicators,
          [ticker]: {
            ema: prevIndicators[ticker]?.ema || {},
            rsi: prevIndicators[ticker]?.rsi || false,
            volume: true,
          },
        }));
      }

      return newActiveTickers;
    });
  };

  // Выбор тикера для управления индикаторами
  const selectTicker = (ticker: string) => {
    setCurrentTicker(ticker);
  };

  // Переключение EMA индикатора для текущего тикера
  const toggleEmaIndicator = async (period: number) => {
    if (!currentTicker) return;

    if (!activeTickers.includes(currentTicker)) {
      console.warn(
        `⚠️ Нельзя включить индикатор для неактивного тикера: ${currentTicker}`
      );
      return;
    }

    // Проверяем, загружены ли индикаторы для этого тикера
    const hasLoadedIndicators =
      indicatorsHook.loadedTickers.includes(currentTicker);
    if (!hasLoadedIndicators) {
      console.log(
        `🔄 [ChartWrapper] Автоматическая загрузка индикаторов для ${currentTicker}`
      );
      await handleLoadIndicators(currentTicker);
    }

    setActiveIndicators((prev) => {
      const currentTickerIndicators = prev[currentTicker] || {
        ema: {},
        rsi: false,
        volume: true,
      };

      return {
        ...prev,
        [currentTicker]: {
          ...currentTickerIndicators,
          ema: {
            ...currentTickerIndicators.ema,
            [period]: !currentTickerIndicators.ema[period],
          },
        },
      };
    });
  };

  // Переключение RSI индикатора для текущего тикера
  const toggleRsiIndicator = async () => {
    if (!currentTicker) return;

    if (!activeTickers.includes(currentTicker)) {
      console.warn(
        `⚠️ Нельзя включить индикатор для неактивного тикера: ${currentTicker}`
      );
      return;
    }

    // Проверяем, загружены ли индикаторы для этого тикера
    const hasLoadedIndicators =
      indicatorsHook.loadedTickers.includes(currentTicker);
    if (!hasLoadedIndicators) {
      console.log(
        `🔄 [ChartWrapper] Автоматическая загрузка индикаторов для ${currentTicker}`
      );
      await handleLoadIndicators(currentTicker);
    }

    setActiveIndicators((prev) => {
      const currentTickerIndicators = prev[currentTicker] || {
        ema: {},
        rsi: false,
        volume: true,
      };

      return {
        ...prev,
        [currentTicker]: {
          ...currentTickerIndicators,
          rsi: !currentTickerIndicators.rsi,
        },
      };
    });
  };

  // Переключение Volume индикатора для текущего тикера
  const toggleVolumeIndicator = () => {
    if (!currentTicker) return;

    if (!activeTickers.includes(currentTicker)) {
      console.warn(
        `⚠️ Нельзя включить индикатор для неактивного тикера: ${currentTicker}`
      );
      return;
    }

    setActiveIndicators((prev) => {
      const currentTickerIndicators = prev[currentTicker] || {
        ema: {},
        rsi: false,
        volume: true,
      };

      return {
        ...prev,
        [currentTicker]: {
          ...currentTickerIndicators,
          volume: !currentTickerIndicators.volume,
        },
      };
    });
  };

  // Фильтруем volumeStack по активным объемам
  const filteredVolumeStack = useMemo(() => {
    return volumeStack
      .map((point: VolumeStackPoint) => ({
        ...point,
        parts: point.parts.filter((part) => {
          const isTickerActive = activeTickers.includes(part.ticker);
          const isVolumeActive =
            activeIndicators[part.ticker]?.volume !== false;
          return isTickerActive && isVolumeActive;
        }),
      }))
      .filter((point) => point.parts.length > 0);
  }, [volumeStack, activeTickers, activeIndicators]);

  // Фильтруем indicatorMap для отображения только активных индикаторов активных тикеров
  const filteredIndicatorMap = useMemo(() => {
    const filtered: Record<string, any> = {};

    Object.entries(indicatorsHook.indicatorMap).forEach(
      ([key, indicatorData]) => {
        const ticker = indicatorData.ticker;

        if (activeTickers.includes(ticker)) {
          const tickerIndicators = activeIndicators[ticker];
          if (tickerIndicators) {
            // Проверяем EMA индикаторы
            const isEmaActive = key.includes('_ema_');
            if (isEmaActive) {
              const periodMatch = key.split('_ema_')[1];
              if (periodMatch) {
                const period = parseInt(periodMatch);
                if (tickerIndicators.ema[period]) {
                  filtered[key] = indicatorData;
                }
              }
            }

            // Проверяем RSI индикаторы
            const isRsiActive = key.includes('_rsi_') && tickerIndicators.rsi;
            if (isRsiActive) {
              filtered[key] = indicatorData;
            }
          }
        }
      }
    );

    return filtered;
  }, [indicatorsHook.indicatorMap, activeTickers, activeIndicators]);

  // Функция для принудительной перезагрузки всех данных
  const handleRefresh = useCallback(() => {
    console.log(`🔄 [ChartWrapper] Принудительное обновление данных`);
    refresh();
    indicatorsHook.refresh();
  }, [refresh, indicatorsHook]);

  // Обработчик добавления точки Фибоначчи
  const handleAddFibonacciPoint = useCallback(
    (point: { time: number; price: number }) => {
      addPoint(point);
    },
    [addPoint]
  );

  console.log('🚨 DEBUG ChartWrapper State:', {
    currentTicker,
    hasIndicators: !!indicatorsHook.settings,
    indicatorsSettings: indicatorsHook.settings,
    tickers: tickers,
    activeTickers: activeTickers,
    loadedTickers: indicatorsHook.loadedTickers,
    isLoadingIndicators: indicatorsHook.isLoading,
    errorIndicators: indicatorsHook.error,
    fibonacciState: fibonacciState,
  });

  // обработчики Фибоначчи:
  const handleStartDrawing = useCallback(() => {
    startDrawing();
  }, [startDrawing]);

  const handleCancelDrawing = useCallback(() => {
    cancelDrawing();
  }, [cancelDrawing]);

  return (
    <div
      className={`chart-wrapper ${fibonacciState.isDrawing ? 'drawing-fibonacci' : ''}`}
    >
      {/* Верхняя панель тикеров */}
      <TickerHeader
        tickers={tickers}
        activeTickers={activeTickers}
        colorMap={colorMap}
        currentTicker={currentTicker}
        onToggleTicker={toggleTicker}
        onSelectTicker={selectTicker}
      />

      {/* Нижняя панель индикаторов с поддержкой ленивой загрузки */}
      <IndicatorPanel
        currentTicker={currentTicker}
        colorMap={colorMap}
        indicators={indicatorsHook.settings}
        indicatorStatus={activeIndicators}
        onToggleEmaIndicator={toggleEmaIndicator}
        onToggleRsiIndicator={toggleRsiIndicator}
        onToggleVolumeIndicator={toggleVolumeIndicator}
        onLoadIndicators={handleLoadIndicators}
        isLoadingIndicators={indicatorsHook.isLoading}
        isDrawingFibonacci={fibonacciState.isDrawing}
        hasFibonacciRetracements={fibonacciState.retracements.length > 0}
        onStartFibonacciDrawing={handleStartDrawing}
        onCancelFibonacciDrawing={handleCancelDrawing}
        onClearFibonacci={clearAll}
      />

      {fibonacciState.isDrawing && (
        <div className="fibonacci-drawing-hint">
          🎯 Режим рисования Фибоначчи: кликните по графику чтобы добавить точки
          (2 точки)
        </div>
      )}

      {/* Кнопка обновления */}
      <div className="chart-actions">
        <button
          type="button"
          onClick={handleRefresh}
          className="refresh-btn"
          disabled={isLoading || indicatorsHook.isLoading}
        >
          <span className="refresh-icon">↻</span>
          {isLoading || indicatorsHook.isLoading ? 'Загрузка...' : 'Обновить'}
        </button>
      </div>

      {isLoading && (
        <div className="chart-loading">
          <div className="loading-spinner"></div>
          <p>Загрузка данных графика...</p>
        </div>
      )}

      {error && (
        <div className="error-box">
          <span className="error-message">Ошибка: {error}</span>
          <button onClick={handleRefresh}>Повторить</button>
        </div>
      )}

      {!isLoading &&
        !error &&
        tickers.length > 0 &&
        activeTickers.length > 0 && (
          <CandlestickOrLineChart
            key={chartKey}
            series={series.filter((s) => activeTickers.includes(s.ticker))}
            volumeStack={filteredVolumeStack}
            indicatorMap={filteredIndicatorMap}
            activeIndicators={activeIndicators}
            colorMap={colorMap}
            getEmaColor={getEmaColor}
            emaPeriods={indicatorsHook.settings?.ema_periods || []}
            fibonacciState={fibonacciState}
            onAddFibonacciPoint={handleAddFibonacciPoint}
          />
        )}

      {!isLoading &&
        !error &&
        (tickers.length === 0 || activeTickers.length === 0) && (
          <div className="no-data-message">
            <p>
              {tickers.length === 0
                ? 'Нет данных для отображения'
                : 'Нет активных тикеров'}
            </p>
          </div>
        )}

      <Legend
        series={series}
        tickers={activeTickers}
        indicatorMap={filteredIndicatorMap}
        colorMap={colorMap}
        activeIndicators={activeIndicators}
        volumeStack={filteredVolumeStack}
      />
    </div>
  );
};

export default ChartWrapper;
