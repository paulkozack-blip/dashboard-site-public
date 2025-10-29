/**
 * useChartData - получение данных графика группы, нормализация, refresh/abort
 * @param group string - название группы
 * @returns { series, volumeStack, isLoading, error, refresh }
 */

import { useRef, useState, useCallback, useEffect } from 'react';
import { GroupChartData } from '@/types/api';
import { SeriesInfo, VolumeStackPoint } from '@/types/charts';
import { apiService } from '@/services/api';
import { adaptGroupChartData } from '@/services/adapter';
import { aggregateVolumeStack } from '@/utils/math';
import { BASE_COLORS } from '@/utils/color';

export function useChartData(group: string) {
  const abortRef = useRef<AbortController | null>(null);
  const seqRef = useRef<number>(0);

  const [series, setSeries] = useState<SeriesInfo[]>([]);
  const [volumeStack, setVolumeStack] = useState<VolumeStackPoint[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (seqToken: number) => {
    setIsLoading(true);
    setError(null);
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    try {
      console.log(`📊 [useChartData] Загрузка данных для группы: ${group}`);
      const data: GroupChartData = await apiService.getChartData(group);

      if (seqRef.current !== seqToken) {
        console.log(`🔄 [useChartData] Пропускаем устаревший результат для группы: ${group}`);
        return; // ignore stale result
      }

      console.log(`✅ [useChartData] Данные получены, адаптация...`);
      
      // Адаптируем данные графика
      const seriesInfo = adaptGroupChartData(data);
      setSeries(seriesInfo);

      // Подготавливаем данные для агрегации объемов с цветами
      const volumeData: Record<string, Array<{ time: number; volume: number; color: string }>> = {};
      
      seriesInfo.forEach((s, index) => {
        // Гарантируем, что цвет всегда строка
        const color = BASE_COLORS[index % BASE_COLORS.length] as string;
        
        volumeData[s.ticker] = (s.data as any[]).map(d => ({
          time: d.time,
          volume: d.volume ?? 0,
          color: color,
        }));
      });

      console.log(`📈 [useChartData] Агрегация объемов для ${Object.keys(volumeData).length} тикеров`);
      
      // Агрегируем объемы с улучшенной структурой
      const aggregatedVolumeStack = aggregateVolumeStack(volumeData);
      
      // Дополнительно сортируем части в каждом баре по убыванию объема
      const sortedVolumeStack = aggregatedVolumeStack.map(point => ({
        ...point,
        parts: [...point.parts].sort((a, b) => b.volume - a.volume)
      }));

      setVolumeStack(sortedVolumeStack);
      
      console.log(`✅ [useChartData] Данные готовы:`, {
        series: seriesInfo.length,
        volumePoints: sortedVolumeStack.length,
        tickers: seriesInfo.map(s => s.ticker)
      });
      
      setIsLoading(false);
      
    } catch (e: any) {
      if (e.name === 'CanceledError' || e.name === 'AbortError') {
        console.log(`⏹️ [useChartData] Запрос отменен для группы: ${group}`);
        return;
      }
      
      console.error(`❌ [useChartData] Ошибка загрузки данных для группы ${group}:`, e);
      setError(e.message || 'Неизвестная ошибка при загрузке данных');
      setIsLoading(false);
    }
  }, [group]);

  useEffect(() => {
    seqRef.current += 1;
    const currentSeq = seqRef.current;
    
    console.log(`🎯 [useChartData] Запуск эффекта для группы: ${group}, seq: ${currentSeq}`);
    fetchData(currentSeq);
    
    return () => {
      // Очистка при размонтировании или смене группы
      console.log(`🧹 [useChartData] Очистка для группы: ${group}`);
      abortRef.current?.abort();
      setSeries([]); // Очищаем серии
      setVolumeStack([]); // Очищаем объемы
    };
  }, [group, fetchData]);

  const refresh = useCallback(() => {
    console.log(`🔄 [useChartData] Принудительное обновление для группы: ${group}`);
    seqRef.current += 1;
    fetchData(seqRef.current);
  }, [fetchData, group]);

  return { series, volumeStack, isLoading, error, refresh };
}