// components/charts/CandlestickOrLineChart.tsx

import React, { useEffect, useRef } from 'react';
import { createChart, IChartApi, ISeriesApi, Time } from 'lightweight-charts';
import { MouseEventParams } from 'lightweight-charts';
import {
  SeriesInfo,
  VolumeStackPoint,
  IndicatorData,
  LinePoint,
  CandlestickPoint,
} from '@/types/charts';
import { FibonacciState } from '@/types/fibonacci';
import { createStackedVolumeData } from '@/utils/math';
import './CandlestickOrLineChart.css';

interface CandlestickOrLineChartProps {
  series: SeriesInfo[];
  volumeStack: VolumeStackPoint[];
  indicatorMap: Record<string, IndicatorData>;
  activeIndicators: Record<
    string,
    {
      ema: Record<number, boolean>;
      rsi: boolean;
      volume: boolean;
    }
  >;
  colorMap: Record<string, string>;
  getEmaColor: (ticker: string, period: number, allPeriods: number[]) => string;
  emaPeriods: number[];
  fibonacciState: FibonacciState;
  onAddFibonacciPoint: (
    point: { time: number; price: number },
    chartData?: any[]
  ) => void;
}

const CandlestickOrLineChart: React.FC<CandlestickOrLineChartProps> = ({
  series,
  volumeStack,
  indicatorMap,
  activeIndicators,
  colorMap,
  getEmaColor,
  emaPeriods,
  fibonacciState,
  onAddFibonacciPoint,
}) => {
  const chartRef = useRef<IChartApi | null>(null);
  const rsiChartRef = useRef<IChartApi | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const rsiContainerRef = useRef<HTMLDivElement | null>(null);

  const seriesRefs = useRef<{
    price: ISeriesApi<'Line' | 'Candlestick'>[];
    indicators: ISeriesApi<'Line'>[];
    volume: ISeriesApi<'Histogram'>[];
    fibonacci: ISeriesApi<'Line'>[];
  }>({
    price: [],
    indicators: [],
    volume: [],
    fibonacci: [],
  });

  const chartType = series.length > 0 ? series[0]?.type : 'line';
  const isCandlestick = chartType === 'candlestick';
  const activeTickers = series.map((s) => s.ticker);
  const hasVolume =
    volumeStack.length > 0 &&
    Object.values(activeIndicators).some((ind) => ind.volume);
  const hasRSI = Object.values(activeIndicators).some((i) => i.rsi);

  // 1. Основная инициализация графика
  useEffect(() => {
    if (!containerRef.current) return;

    console.log(
      `📊 [Chart] Инициализация графика. Тип: ${chartType}, Серии: ${series.length}`
    );

    if (!chartRef.current) {
      const chart = createChart(containerRef.current, {
        height: hasRSI ? 420 : 520,
        layout: {
          background: { color: '#ffffff' },
          textColor: '#2c3e50',
        },
        grid: {
          vertLines: { color: '#ecf0f1' },
          horzLines: { color: '#ecf0f1' },
        },
        rightPriceScale: {
          visible: true,
          borderColor: '#bdc3c7',
          scaleMargins: {
            top: 0.1,
            bottom: hasVolume ? 0.25 : 0.1,
          },
        },
        timeScale: {
          borderColor: '#bdc3c7',
          timeVisible: true,
          secondsVisible: false,
          barSpacing: 10,
        },
        crosshair: { mode: 1 },
      });
      chartRef.current = chart;
    }

    if (hasRSI && rsiContainerRef.current && !rsiChartRef.current) {
      const rsiChart = createChart(rsiContainerRef.current, {
        height: 150,
        layout: {
          background: { color: '#fafafa' },
          textColor: '#2c3e50',
        },
        grid: {
          vertLines: { color: '#ecf0f1' },
          horzLines: { color: '#ecf0f1' },
        },
        rightPriceScale: {
          borderColor: '#bdc3c7',
          visible: true,
          scaleMargins: {
            top: 0.1,
            bottom: 0.1,
          },
          mode: 0,
        },
        timeScale: {
          visible: true,
          borderColor: '#bdc3c7',
          timeVisible: true,
          secondsVisible: false,
        },
      });

      rsiChartRef.current = rsiChart;
      console.log('✅ [RSI] RSI график создан (осциллятор 0-100)');
    }

    // Синхронизация временных шкал
    if (chartRef.current && rsiChartRef.current) {
      const mainScale = chartRef.current.timeScale();
      const rsiScale = rsiChartRef.current.timeScale();
      let syncingFromMain = false;
      let syncingFromRSI = false;

      const mainDataLength = series.reduce(
        (max, s) => Math.max(max, s.data.length),
        0
      );

      let rsiDataLength = 0;
      Object.entries(activeIndicators).forEach(([ticker, indicators]) => {
        if (!indicators.rsi) return;
        const rsiKeys = Object.keys(indicatorMap).filter(
          (key) => key.includes('_rsi_') && key.startsWith(ticker)
        );
        rsiKeys.forEach((key) => {
          const ind = indicatorMap[key];
          if (ind?.data?.length) {
            rsiDataLength = Math.max(rsiDataLength, ind.data.length);
          }
        });
      });

      const dataOffset = mainDataLength - rsiDataLength;

      const syncLogicalRange = (to: any, range: any, isFromMain: boolean) => {
        if (!range) return;
        try {
          let adjustedRange = { ...range };

          if (isFromMain && dataOffset > 0) {
            adjustedRange = {
              from: Math.max(0, range.from - dataOffset),
              to: Math.max(0, range.to - dataOffset),
            };
          } else if (!isFromMain && dataOffset > 0) {
            adjustedRange = {
              from: range.from + dataOffset,
              to: range.to + dataOffset,
            };
          }

          to.setVisibleLogicalRange(adjustedRange);
        } catch (error) {
          console.warn(
            '⚠️ [Sync] Ошибка синхронизации логического диапазона:',
            error
          );
        }
      };

      const syncTimeRange = (to: any, range: any) => {
        if (!range) return;
        try {
          to.setVisibleRange(range);
        } catch (error) {
          console.warn(
            '⚠️ [Sync] Ошибка синхронизации временного диапазона:',
            error
          );
        }
      };

      mainScale.subscribeVisibleTimeRangeChange((range) => {
        if (!syncingFromRSI && range) {
          syncingFromMain = true;
          try {
            syncTimeRange(rsiScale, range);
          } finally {
            syncingFromMain = false;
          }
        }
      });

      rsiScale.subscribeVisibleTimeRangeChange((range) => {
        if (!syncingFromMain && range) {
          syncingFromRSI = true;
          try {
            syncTimeRange(mainScale, range);
          } finally {
            syncingFromRSI = false;
          }
        }
      });

      mainScale.subscribeVisibleLogicalRangeChange((range) => {
        if (!syncingFromRSI && range) {
          syncingFromMain = true;
          try {
            syncLogicalRange(rsiScale, range, true);
          } finally {
            syncingFromMain = false;
          }
        }
      });

      rsiScale.subscribeVisibleLogicalRangeChange((range) => {
        if (!syncingFromMain && range) {
          syncingFromRSI = true;
          try {
            syncLogicalRange(mainScale, range, false);
          } finally {
            syncingFromRSI = false;
          }
        }
      });

      console.log('✅ [Sync] Двусторонняя синхронизация установлена');
    }

    return () => {
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
      if (rsiChartRef.current) {
        rsiChartRef.current.remove();
        rsiChartRef.current = null;
      }
    };
  }, []);

  // 2. Обновление данных графика
  useEffect(() => {
    if (!chartRef.current) return;

    const chart = chartRef.current;
    console.log(`🔄 [Chart] Обновление данных: ${series.length} серий`);

    const safeRemoveSeries = (seriesArray: ISeriesApi<any>[]) => {
      seriesArray.forEach((series) => {
        try {
          if (series && chartRef.current) {
            chartRef.current.removeSeries(series);
          }
        } catch (error) {
          console.warn('⚠️ [Chart] Ошибка при удалении серии:', error);
        }
      });
    };

    safeRemoveSeries(seriesRefs.current.price);
    safeRemoveSeries(seriesRefs.current.indicators);
    safeRemoveSeries(seriesRefs.current.volume);

    seriesRefs.current.price = [];
    seriesRefs.current.indicators = [];
    seriesRefs.current.volume = [];

    series.forEach((s) => {
      try {
        if (s.type === 'line') {
          const lineSeries = chart.addLineSeries({
            color: s.color ?? colorMap[s.ticker] ?? '#3498db',
            lineWidth: 2,
            title: s.ticker,
            priceScaleId: 'right',
          });

          const lineData = (s.data as LinePoint[]).map((d) => ({
            time: d.time as Time,
            value: d.value,
          }));

          lineSeries.setData(lineData);
          seriesRefs.current.price.push(lineSeries);
        } else if (s.type === 'candlestick') {
          const candlestickSeries = chart.addCandlestickSeries({
            upColor: '#26a69a',
            downColor: '#ef5350',
            wickUpColor: '#26a69a',
            wickDownColor: '#ef5350',
            borderVisible: false,
            title: s.ticker,
            priceScaleId: 'right',
          });

          const candleData = (s.data as CandlestickPoint[]).map((d) => ({
            time: d.time as Time,
            open: d.open,
            high: d.high,
            low: d.low,
            close: d.close,
          }));

          candlestickSeries.setData(candleData);
          seriesRefs.current.price.push(candlestickSeries);
        }

        console.log(`✅ [Chart] Добавлена ценовая серия: ${s.ticker}`);
      } catch (error) {
        console.error(
          `❌ [Chart] Ошибка добавления серии для ${s.ticker}:`,
          error
        );
      }
    });

    try {
      chart.timeScale().fitContent();
    } catch (error) {
      console.warn('⚠️ [Chart] Ошибка масштабирования:', error);
    }
  }, [series, colorMap]);

  // 3. Обновление индикаторов EMA
  useEffect(() => {
    if (!chartRef.current || seriesRefs.current.price.length === 0) return;

    const chart = chartRef.current;

    const safeRemoveSeries = (seriesArray: ISeriesApi<any>[]) => {
      seriesArray.forEach((series) => {
        try {
          if (series && chartRef.current) {
            chartRef.current.removeSeries(series);
          }
        } catch (error) {
          console.warn('⚠️ [Chart] Ошибка при удалении EMA серии:', error);
        }
      });
    };

    safeRemoveSeries(seriesRefs.current.indicators);
    seriesRefs.current.indicators = [];

    Object.entries(activeIndicators).forEach(([ticker, indicators]) => {
      if (!activeTickers.includes(ticker)) return;

      const emaKeys = Object.keys(indicatorMap).filter(
        (key) => key.includes('_ema_') && key.startsWith(ticker)
      );

      emaKeys.forEach((key) => {
        try {
          const ind = indicatorMap[key];
          if (!ind?.data?.length) return;

          const period = ind.period || parseInt(key.split('_ema_')[1] || '50');
          if (!indicators.ema[period]) return;

          const emaColor = getEmaColor(ticker, period, emaPeriods);
          const emaSeries = chart.addLineSeries({
            color: emaColor,
            lineWidth: 1,
            lineStyle: 2,
            title: `${ticker} EMA${period}`,
            priceScaleId: 'right',
          });

          const emaData = ind.data.map((d) => ({
            time: d.time as Time,
            value: d.value,
          }));

          emaSeries.setData(emaData);
          seriesRefs.current.indicators.push(emaSeries);
        } catch (error) {
          console.error(`❌ [Chart] Ошибка добавления EMA ${key}:`, error);
        }
      });
    });
  }, [indicatorMap, activeIndicators, activeTickers, getEmaColor, emaPeriods]);

  // 4. Обновление объемов
  useEffect(() => {
    if (!chartRef.current || !hasVolume) return;

    const chart = chartRef.current;

    const safeRemoveSeries = (seriesArray: ISeriesApi<any>[]) => {
      seriesArray.forEach((series) => {
        try {
          if (series && chartRef.current) {
            chartRef.current.removeSeries(series);
          }
        } catch (error) {
          console.warn('⚠️ [Chart] Ошибка при удалении volume серии:', error);
        }
      });
    };

    safeRemoveSeries(seriesRefs.current.volume);
    seriesRefs.current.volume = [];

    try {
      if (isCandlestick) {
        const mainCandlestickSeries = series.find(
          (s) => s.type === 'candlestick' && activeTickers.includes(s.ticker)
        );

        if (
          mainCandlestickSeries &&
          mainCandlestickSeries.type === 'candlestick'
        ) {
          const candlestickData =
            mainCandlestickSeries.data as CandlestickPoint[];
          const volumeSeries = chart.addHistogramSeries({
            priceScaleId: 'volume',
          });

          const volumeData = volumeStack.map((point) => {
            const candle = candlestickData.find((c) => c.time === point.time);
            const isUp = candle ? candle.close >= candle.open : true;

            return {
              time: point.time as Time,
              value: point.total,
              color: isUp ? '#26a69a' : '#ef5350',
            };
          });

          volumeSeries.setData(volumeData);
          seriesRefs.current.volume.push(volumeSeries);
        }
      } else {
        const stackedVolumeData = createStackedVolumeData(volumeStack);

        Object.entries(stackedVolumeData).forEach(([ticker, volumeData]) => {
          if (
            !activeTickers.includes(ticker) ||
            !activeIndicators[ticker]?.volume
          )
            return;

          const volumeSeries = chart.addHistogramSeries({
            priceScaleId: 'volume',
          });

          const data = volumeData.map((point) => ({
            time: point.time as Time,
            value: point.value,
            color: point.color,
          }));

          volumeSeries.setData(data);
          seriesRefs.current.volume.push(volumeSeries);
        });
      }

      chart.priceScale('volume').applyOptions({
        scaleMargins: { top: 0.8, bottom: 0 },
        visible: false,
      });
    } catch (error) {
      console.error('❌ [Chart] Ошибка добавления объемов:', error);
    }
  }, [volumeStack, activeIndicators, activeTickers, isCandlestick, hasVolume]);

  // 5. Обновление RSI индикаторов
  useEffect(() => {
    if (!rsiChartRef.current || !hasRSI) return;

    const rsiChart = rsiChartRef.current;

    const safeRemoveRSISeries = () => {
      try {
        const series = (rsiChart as any)._series || [];
        series.forEach((series: any) => {
          try {
            rsiChart.removeSeries(series);
          } catch (error) {
            console.warn('⚠️ [RSI] Ошибка при удалении RSI серии:', error);
          }
        });
      } catch (error) {
        console.warn('⚠️ [RSI] Ошибка при очистке RSI серий:', error);
      }
    };

    safeRemoveRSISeries();

    try {
      let earliestRSITime: Time | null = null;
      let latestRSITime: Time | null = null;

      Object.entries(activeIndicators).forEach(([ticker, indicators]) => {
        if (!indicators.rsi) return;

        const rsiKeys = Object.keys(indicatorMap).filter(
          (key) => key.includes('_rsi_') && key.startsWith(ticker)
        );

        rsiKeys.forEach((key) => {
          try {
            const ind = indicatorMap[key];
            if (!ind?.data?.length) return;

            const rsiColor = colorMap[ticker] ?? '#8e44ad';
            const rsiSeries = rsiChart.addLineSeries({
              color: rsiColor,
              lineWidth: 1,
              title: `RSI ${ticker}`,
            });

            const rsiData = ind.data.map((d) => ({
              time: d.time as Time,
              value: d.value,
            }));

            rsiSeries.setData(rsiData);

            ind.data.forEach((d) => {
              const time = d.time as Time;
              if (!earliestRSITime || time < earliestRSITime) {
                earliestRSITime = time;
              }
              if (!latestRSITime || time > latestRSITime) {
                latestRSITime = time;
              }
            });
          } catch (error) {
            console.error(`❌ [RSI] Ошибка добавления RSI ${key}:`, error);
          }
        });
      });

      if (earliestRSITime && latestRSITime) {
        const timeRange = [
          { time: earliestRSITime, value: 70 },
          { time: latestRSITime, value: 70 },
        ];

        const line70 = rsiChart.addLineSeries({
          color: '#e74c3c',
          lineWidth: 1,
          lineStyle: 2,
          title: 'RSI 70',
        });
        line70.setData(
          timeRange.map((point) => ({ time: point.time, value: 70 }))
        );

        const line30 = rsiChart.addLineSeries({
          color: '#27ae60',
          lineWidth: 1,
          lineStyle: 2,
          title: 'RSI 30',
        });
        line30.setData(
          timeRange.map((point) => ({ time: point.time, value: 30 }))
        );

        console.log('✅ [RSI] Добавлены уровни RSI 30/70');
      }
    } catch (error) {
      console.error('❌ [RSI] Ошибка при обновлении RSI:', error);
    }
  }, [indicatorMap, activeIndicators, colorMap, hasRSI]);

  // 6. Обработчик кликов для Фибоначчи
  useEffect(() => {
    if (!chartRef.current || !fibonacciState.isDrawing) return;

    const chart = chartRef.current;

    const handleClick = (param: MouseEventParams) => {
      if (!param.point || !fibonacciState.isDrawing) return;

      try {
        const time = chart.timeScale().coordinateToTime(param.point.x);
        if (!time) {
          console.warn('❌ [Fibonacci] Не удалось определить время');
          return;
        }

        const priceSeries = seriesRefs.current.price.find(
          (series) => series !== undefined
        );
        if (!priceSeries) {
          console.warn('❌ [Fibonacci] Нет доступных ценовых серий');
          return;
        }

        const price = priceSeries.coordinateToPrice(param.point.y);
        if (price === null) {
          console.warn('❌ [Fibonacci] Не удалось определить цену');
          return;
        }

        console.log(
          `🎯 [Fibonacci] Добавлена точка: time=${time}, price=${price}`
        );

        const chartData =
          series.length > 0 && series[0]?.data ? series[0].data : [];

        onAddFibonacciPoint(
          {
            time: time as number,
            price,
          },
          chartData
        );
      } catch (error) {
        console.error('❌ [Fibonacci] Ошибка при обработке клика:', error);
      }
    };

    chart.subscribeClick(handleClick);

    return () => {
      chart.unsubscribeClick(handleClick);
    };
  }, [fibonacciState.isDrawing, onAddFibonacciPoint, series]);

  // 7. Отрисовка уровней Фибоначчи 
  useEffect(() => {
    if (!chartRef.current) return;

    const chart = chartRef.current;

    // Безопасная очистка Fibonacci
    const safeRemoveSeries = (seriesArray: ISeriesApi<any>[]) => {
      seriesArray.forEach((series) => {
        try {
          if (series && chartRef.current) {
            chartRef.current.removeSeries(series);
          }
        } catch (error) {
          console.warn(
            '⚠️ [Chart] Ошибка при удалении Fibonacci серии:',
            error
          );
        }
      });
    };

    safeRemoveSeries(seriesRefs.current.fibonacci);
    seriesRefs.current.fibonacci = [];

    // Рисуем новые уровни Фибоначчи (только линии, без меток)
    fibonacciState.retracements.forEach((retr) => {
      if (!retr.visible) return;

      const startTime = retr.startPoint.time;
      const endTime = retr.endPoint.time;

      console.log(`🎯 [Fibonacci] Отрисовка уровней:`, {
        startTime: new Date(startTime * 1000).toISOString(),
        endTime: new Date(endTime * 1000).toISOString(),
      });

      // ВАЛИДАЦИЯ ДАННЫХ - проверяем что все значения корректны
      const isValidStartPoint = startTime && !isNaN(retr.startPoint.price) && retr.startPoint.price !== null;
      const isValidEndPoint = endTime && !isNaN(retr.endPoint.price) && retr.endPoint.price !== null;

      if (!isValidStartPoint || !isValidEndPoint) {
        console.warn('❌ [Fibonacci] Некорректные данные точек:', {
          startTime,
          startPrice: retr.startPoint.price,
          endTime,
          endPrice: retr.endPoint.price
        });
        return;
      }

      try {
        // Создаем серию для основной трендовой линии
        const trendLineSeries = chart.addLineSeries({
          color: retr.color,
          lineWidth: 2,
          priceScaleId: 'right',
        });

        const trendData = [
          { time: startTime as Time, value: retr.startPoint.price },
          { time: endTime as Time, value: retr.endPoint.price },
        ];

        // Дополнительная проверка данных перед установкой
        const isValidTrendData = trendData.every(point => 
          point.time && 
          point.value !== null && 
          point.value !== undefined && 
          !isNaN(point.value)
        );

        if (isValidTrendData) {
          trendLineSeries.setData(trendData);
          seriesRefs.current.fibonacci.push(trendLineSeries);
        } else {
          console.warn('❌ [Fibonacci] Некорректные данные трендовой линии:', trendData);
          chart.removeSeries(trendLineSeries);
        }

        // Создаем уровни Фибоначчи (только линии)
        retr.levels
          .filter((lvl) => lvl.visible)
          .forEach((level) => {
            try {
              // Проверяем валидность уровня
              if (!level.price || isNaN(level.price) || level.price === null) {
                console.warn('❌ [Fibonacci] Некорректная цена уровня:', level);
                return;
              }

              const fibSeries = chart.addLineSeries({
                color: level.color,
                lineWidth: 1, // Уменьшил с 3 до 1 для лучшего вида
                priceScaleId: 'right',
                lineStyle: 2, // Пунктирная линия
              });

              const fibData = [
                { time: startTime as Time, value: level.price },
                { time: endTime as Time, value: level.price },
              ];

              // Проверяем данные перед установкой
              const isValidFibData = fibData.every(point => 
                point.time && 
                point.value !== null && 
                point.value !== undefined && 
                !isNaN(point.value)
              );

              if (isValidFibData) {
                fibSeries.setData(fibData);
                seriesRefs.current.fibonacci.push(fibSeries);
              } else {
                console.warn('❌ [Fibonacci] Некорректные данные уровня:', fibData);
                chart.removeSeries(fibSeries);
              }
            } catch (error) {
              console.error('❌ [Fibonacci] Ошибка создания уровня:', error);
            }
          });
      } catch (error) {
        console.error('❌ [Fibonacci] Ошибка создания трендовой линии:', error);
      }
    });
  }, [fibonacciState.retracements]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: hasRSI ? 420 : 520,
          backgroundColor: '#fff',
          borderRadius: 8,
          border: '1px solid #e0e0e0',
        }}
      />
      {hasRSI && (
        <div
          ref={rsiContainerRef}
          style={{
            width: '100%',
            height: 150,
            backgroundColor: '#fafafa',
            borderRadius: 8,
            border: '1px solid #e0e0e0',
          }}
        />
      )}
    </div>
  );
};

export default CandlestickOrLineChart;
