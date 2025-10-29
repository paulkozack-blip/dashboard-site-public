import { renderHook, waitFor } from '@testing-library/react';
import { useChartData } from '@/hooks/useChartData';
import { vi } from 'vitest';
import { apiService } from '@/services/api';
import { lineGroupChartData } from './fixtures/api-responses';

// Мокаем API
vi.mock('@/services/api', () => ({
  apiService: {
    getChartData: vi.fn(),
  },
}));

describe('useChartData', () => {
  beforeEach(() => {
    vi.mocked(apiService.getChartData).mockReset();
  });

  it('loads and adapts data, aggregates volume', async () => {
    vi.mocked(apiService.getChartData).mockResolvedValue(lineGroupChartData);

    const { result } = renderHook(() => useChartData('testGroup'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.series.length).toBeGreaterThan(0);
    expect(Array.isArray(result.current.volumeStack)).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('handles API error', async () => {
    vi.mocked(apiService.getChartData).mockRejectedValue(new Error('API fail'));

    const { result } = renderHook(() => useChartData('errorGroup'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toContain('API fail');
    expect(result.current.series).toEqual([]);
  });
});