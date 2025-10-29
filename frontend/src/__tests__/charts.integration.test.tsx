import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ChartsPage from '@/pages/ChartsPage';
import { vi } from 'vitest';
import { lineGroupChartData, ema50Response } from './fixtures/api-responses';
import { apiService } from '@/services/api';


describe('ChartsPage integration', () => {
  beforeEach(() => {
    // Моки API для useGroups, useChartData, useIndicators
    vi.mock('@/services/api', () => ({
      apiService: {
        getAvailableGroups: () => Promise.resolve({
          test: { type: 'line', tickers: ['T1', 'T2', 'T3'] }
        }),
        getGroupChartData: () => Promise.resolve(lineGroupChartData),
        getIndicatorSettings: () => Promise.resolve({
          ema_periods: [50], rsi_period: 14, last_updated: ''
        }),
        getIndicatorData: (_t:string, indicator:string) => Promise.resolve(ema50Response),
      }
    }));
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders chart, allows toggling tickers/indicators/volume', async () => {
    render(<ChartsPage />);
    // Ждём прогрузку
    await screen.findByText(/Тикеры/);
    // Включается первый тикер, остальные выключены
    const t1Checkbox = screen.getByLabelText('Показать тикер T1') as HTMLInputElement;
    expect(t1Checkbox.checked).toBeTruthy();
    // Отключение тикера скрывает его серию и объем
    fireEvent.click(t1Checkbox);
    expect(t1Checkbox.checked).toBeFalsy();

    // Включение индикатора для T2
    const emaT2 = screen.getByLabelText('EMA для T2');
    fireEvent.click(emaT2);
    expect((emaT2 as HTMLInputElement).checked).toBeTruthy();

    // Volume по умолчанию есть, отключим
    const volCheckbox = screen.getByLabelText('Показывать объемы');
    fireEvent.click(volCheckbox);
    expect((volCheckbox as HTMLInputElement).checked).toBeFalsy();

    // Обновить
    const refreshBtn = screen.getByRole('button', { name: /Обновить/ });
    fireEvent.click(refreshBtn);
    await waitFor(() => screen.getByText(/Тикеры/));
  });

  it('shows spinner and error box', async () => {
    apiService.getAvailableGroups = vi.fn().mockImplementationOnce(
      () => new Promise((_, rej) => setTimeout(() => rej(new Error('fail')), 100))
    );
    render(<ChartsPage />);
    expect(screen.getByText(/Загрузка групп/)).toBeInTheDocument();
    // Ошибка после задержки
    await waitFor(() => screen.getByText(/Перезапросить/));
  });
});
