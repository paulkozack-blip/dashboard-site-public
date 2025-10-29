import { renderHook } from '@testing-library/react';
import { useColors } from '@/hooks/useColors';
import { BASE_COLORS } from '@/utils/color';

describe('useColors', () => {
  it('returns deterministic color map for first 10 tickers', () => {
    const tickers = ['A','B','C','D','E','F','G','H','I','J'];
    const { result } = renderHook(() => useColors('group1', tickers));
    
    tickers.forEach((t, i) => {
      expect(result.current.colorMap[t]).toBe(BASE_COLORS[i]);
    });
  });

  it('wraps color palette for > 10 tickers', () => {
    const tickers = Array.from({length: 12}, (_, i) => `T${i+1}`);
    const { result } = renderHook(() => useColors('group2', tickers));
    
    expect(result.current.colorMap['T11']).toBe(BASE_COLORS[1]);
    expect(result.current.colorMap['T12']).toBe(BASE_COLORS[2]);
  });

  it('getBaseColor returns correct color', () => {
    const { result } = renderHook(() => useColors('g', ['A','B']));
    
    expect(result.current.getBaseColor('A')).toBe(BASE_COLORS[0]);
    expect(result.current.getBaseColor('B')).toBe(BASE_COLORS[1]);
    expect(result.current.getBaseColor('X')).toBe('#444');
  });
});