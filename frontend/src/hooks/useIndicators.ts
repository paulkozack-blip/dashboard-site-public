// hooks/useIndicators.ts
import { useCallback, useState, useEffect } from 'react';
import { IndicatorSettingsResponse, IndicatorApiResponse } from '@/types/api';
import { IndicatorData } from '@/types/charts';
import { apiService } from '@/services/api';
import { adaptIndicatorResponse } from '@/services/adapter';
import { generateEmaColor, generateRsiColor } from '@/utils/color';

type IndicatorKey = string;

export function useIndicators(
  tickers: string[],
  colorMap: Record<string, string>
) {
  const [settings, setSettings] = useState<IndicatorSettingsResponse | null>(
    null
  );
  const [indicatorMap, setIndicatorMap] = useState<
    Record<IndicatorKey, IndicatorData>
  >({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadedTickers, setLoadedTickers] = useState<Set<string>>(new Set());

  const fetchSettings = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const resp = await apiService.getIndicatorSettings();
      setSettings(resp);
      setIsLoading(false);
      return resp;
    } catch (e) {
      setError((e as Error).message || 'Error');
      setIsLoading(false);
      throw e;
    }
  }, []);

  // Загрузка индикаторов для конкретного тикера
  const loadTickerIndicators = useCallback(
    async (ticker: string) => {
      if (!settings || loadedTickers.has(ticker)) {
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const newIndicators: Record<IndicatorKey, IndicatorData> = {};

        // === EMA ===
        for (const period of settings.ema_periods ?? []) {
          const key = `${ticker}_ema_${period}`;
          try {
            const resp: IndicatorApiResponse =
              await apiService.getIndicatorData(ticker, 'ema', period);
            const color = colorMap[ticker]
              ? generateEmaColor(colorMap[ticker], period, settings.ema_periods)
              : '#000';
            const ind = adaptIndicatorResponse(resp, color, 'ema', period);
            newIndicators[key] = ind;
          } catch (e) {
            console.warn(`Failed to load EMA ${period} for ${ticker}:`, e);
          }
        }

        // === RSI ===
        const rsiKey = `${ticker}_rsi_${settings.rsi_period}`;
        try {
          const resp: IndicatorApiResponse = await apiService.getIndicatorData(
            ticker,
            'rsi',
            settings.rsi_period
          );
          const color = colorMap[ticker]
            ? generateRsiColor(colorMap[ticker])
            : '#888';
          const ind = adaptIndicatorResponse(
            resp,
            color,
            'rsi',
            settings.rsi_period
          );
          newIndicators[rsiKey] = ind;
        } catch (e) {
          console.warn(`Failed to load RSI for ${ticker}:`, e);
        }

        // Обновляем состояние
        setIndicatorMap((prev) => ({ ...prev, ...newIndicators }));
        setLoadedTickers((prev) => new Set([...prev, ticker]));
        setIsLoading(false);
      } catch (e) {
        setError((e as Error).message);
        setIsLoading(false);
      }
    },
    [settings, colorMap, loadedTickers]
  );

  // Загрузка индикаторов для нескольких тикеров
  const loadIndicators = useCallback(
    async (tickersToLoad: string[]) => {
      if (!settings) {
        await fetchSettings();
      }

      for (const ticker of tickersToLoad) {
        if (!loadedTickers.has(ticker)) {
          await loadTickerIndicators(ticker);
        }
      }
    },
    [settings, fetchSettings, loadTickerIndicators, loadedTickers]
  );

  // Загрузка всех индикаторов (старое поведение)
  const loadAllIndicators = useCallback(async () => {
    if (!settings) await fetchSettings();
    if (!settings) return;

    setIsLoading(true);
    setError(null);
    const out: Record<IndicatorKey, IndicatorData> = {};

    try {
      for (const t of tickers) {
        // === EMA ===
        for (const period of settings.ema_periods ?? []) {
          const key = `${t}_ema_${period}`;
          try {
            const resp: IndicatorApiResponse =
              await apiService.getIndicatorData(t, 'ema', period);
            const color = colorMap[t]
              ? generateEmaColor(colorMap[t], period, settings.ema_periods)
              : '#000';
            const ind = adaptIndicatorResponse(resp, color, 'ema', period);
            out[key] = ind;
          } catch (e) {
            console.warn(`Failed to load EMA ${period} for ${t}:`, e);
          }
        }

        // === RSI ===
        const rsiKey = `${t}_rsi_${settings.rsi_period}`;
        try {
          const resp: IndicatorApiResponse = await apiService.getIndicatorData(
            t,
            'rsi',
            settings.rsi_period
          );
          const color = colorMap[t] ? generateRsiColor(colorMap[t]) : '#888';
          const ind = adaptIndicatorResponse(
            resp,
            color,
            'rsi',
            settings.rsi_period
          );
          out[rsiKey] = ind;
        } catch (e) {
          console.warn(`Failed to load RSI for ${t}:`, e);
        }
      }

      setIndicatorMap(out);
      setLoadedTickers(new Set(tickers));
      setIsLoading(false);
    } catch (e) {
      setError((e as Error).message);
      setIsLoading(false);
    }
  }, [tickers, colorMap, settings, fetchSettings]);

  // Инициализация настроек
  useEffect(() => {
    if (!settings) fetchSettings();
  }, [fetchSettings, settings]);

  const refresh = useCallback(() => {
    setSettings(null);
    setIndicatorMap({});
    setLoadedTickers(new Set());
    setIsLoading(false);
    setError(null);
    fetchSettings();
  }, [fetchSettings]);

  return {
    settings,
    indicatorMap,
    isLoading,
    error,
    refresh,
    loadTickerIndicators,
    loadIndicators,
    loadAllIndicators,
    loadedTickers: Array.from(loadedTickers),
  };
}
