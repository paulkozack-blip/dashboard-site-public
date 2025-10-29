import { describe, it, expect } from 'vitest';
import { adaptGroupChartData, adaptIndicatorResponse } from '@/services/adapter';
import { lineGroupChartData, candleGroupChartData, ema50Response, rsiResponse } from './fixtures/api-responses';

describe('adaptGroupChartData', () => {
  it('преобразует линейные данные в SeriesInfo', () => {
    const result = adaptGroupChartData(lineGroupChartData);
    expect(result.length).toBe(2);
    expect(result[0]?.type).toBe('line');
    
    const dp = result[0]?.data[0];
    if (dp && 'value' in dp) {
      expect(dp.value).toBe(51557.52);
      expect(dp.volume).toBe(3900);
    }
  });

  it('преобразует свечные данные', () => {
    const result = adaptGroupChartData(candleGroupChartData);
    expect(result.length).toBe(1);
    expect(result[0]?.type).toBe('candlestick');
    
    const dp = result[0]?.data[0];
    if (dp && 'open' in dp) {
      expect(dp.open).toBe(60000);
      expect(dp.volume).toBe(2100);
    }
  });
});

describe('adaptIndicatorResponse', () => {
  it('преобразует ema indicator response', () => {
    const result = adaptIndicatorResponse(ema50Response, '#1E88E5', 'ema', 50);
    expect(result.ticker).toBe('Восток92');
    expect(result.indicator).toBe('ema');
    expect(result.period).toBe(50);
    expect(result.color).toBe('#1E88E5');
    expect(result.data[0]?.value).toBe(51600);
  });

  it('преобразует rsi indicator response', () => {
    const result = adaptIndicatorResponse(rsiResponse, '#E53935', 'rsi', 14);
    expect(result.ticker).toBe('Лукойл92');
    expect(result.indicator).toBe('rsi');
    expect(result.period).toBe(14);
    expect(result.data[0]?.value).toBe(51);
  });
});