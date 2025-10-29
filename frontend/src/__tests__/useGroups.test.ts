import { renderHook, waitFor } from '@testing-library/react';
import { useGroups } from '@/hooks/useGroups';
import { vi } from 'vitest';
import { apiService } from '@/services/api';

const mockGroups = {
  groupA: { type: 'line' as const, tickers: ['A', 'B'] },
  groupB: { type: 'candlestick' as const, tickers: ['C'] },
};

// Мокаем API
vi.mock('@/services/api', () => ({
  apiService: {
    getAvailableGroups: vi.fn(),
  },
}));

describe('useGroups', () => {
  beforeEach(() => {
    vi.mocked(apiService.getAvailableGroups).mockReset();
  });

  it('loads groups from API and caches them', async () => {
    vi.mocked(apiService.getAvailableGroups).mockResolvedValue(mockGroups);

    const { result } = renderHook(() => useGroups());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    
    expect(result.current.groups).toEqual(mockGroups);
    expect(result.current.error).toBeNull();
  });

  it('handles api error', async () => {
    vi.mocked(apiService.getAvailableGroups).mockRejectedValue(new Error('API fail'));

    const { result } = renderHook(() => useGroups());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    
    expect(result.current.error).toContain('API fail');
    expect(result.current.groups).toBeNull();
  });

  it('refresh reloads data', async () => {
    vi.mocked(apiService.getAvailableGroups).mockResolvedValue(mockGroups);

    const { result } = renderHook(() => useGroups());

    await waitFor(() => {
      expect(result.current.groups).toEqual(mockGroups);
    });

    // Вызываем refresh
    result.current.refresh();

    await waitFor(() => {
      expect(apiService.getAvailableGroups).toHaveBeenCalledTimes(2);
    });
  });
});