import { renderHook, waitFor } from '@testing-library/react';
import { useIndicators } from '@/hooks/useIndicators';
import { vi } from 'vitest';
import { apiService } from '@/services/api';
import { ema50Response, rsiResponse } from './fixtures/api-responses';

// Мокаем API
vi.mock('@/services/api', () => ({
  apiService: {
    getIndicatorSettings: vi.fn(),
    getIndicatorData: vi.fn(),
  },
}));

describe('useIndicators', () => {
  beforeEach(() => { 
    vi.clearAllMocks(); 
  });

  it('fetches settings and indicator data for tickers', async () => {
    vi.mocked(apiService.getIndicatorSettings).mockResolvedValue({
      ema_periods: [50],
      rsi_period: 14,
      last_updated: '2024-01-01T12:00:00Z'
    });

    vi.mocked(apiService.getIndicatorData)
      .mockResolvedValueOnce(ema50Response)
      .mockResolvedValueOnce(rsiResponse);

    const { result } = renderHook(() => 
      useIndicators(['Восток92'], { 'Восток92': '#1E88E5' })
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.settings?.ema_periods[0]).toBe(50);
    expect(result.current.indicatorMap['Восток92_ema_50']).toBeDefined();
    expect(result.current.indicatorMap['Восток92_rsi_14']).toBeDefined();
  });

  it('handles API error', async () => {
    vi.mocked(apiService.getIndicatorSettings).mockRejectedValue(new Error('Settings fail'));

    const { result } = renderHook(() => 
      useIndicators(['A'], { A: '#f00' })
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toContain('Settings fail');
    expect(result.current.settings).toBeNull();
  });
});