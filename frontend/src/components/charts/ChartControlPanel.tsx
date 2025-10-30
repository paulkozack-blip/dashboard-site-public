// components/charts/ChartControlPanel.tsx
import React from 'react';
import { IndicatorSettingsResponse } from '@/types/api';

interface ChartControlPanelProps {
  tickers: string[];
  activeTickers: string[];
  onToggleTicker: (ticker: string) => void;
  indicators: IndicatorSettingsResponse | null;
  indicatorStatus: Record<
    string,
    { ema: boolean; rsi: boolean; volume: boolean }
  >; // ← ДОБАВИТЬ volume
  onToggleIndicator: (ticker: string, key: 'ema' | 'rsi' | 'volume') => void; // ← ДОБАВИТЬ volume
  showVolume: boolean;
  onToggleVolume: () => void;
  onRefresh: () => void;
}

const ChartControlPanel: React.FC<ChartControlPanelProps> = ({
  tickers,
  activeTickers,
  onToggleTicker,
  indicators,
  indicatorStatus,
  onToggleIndicator,
  showVolume,
  onToggleVolume,
  onRefresh,
}) => (
  <nav
    className="chart-control-panel"
    role="toolbar"
    aria-label="управление графиком"
  >
    <fieldset>
      <legend>
        Тикеры ({activeTickers.length}/{tickers.length} активны)
      </legend>
      {tickers.map((ticker) => (
        <label key={ticker} className="ticker-checkbox">
          <input
            type="checkbox"
            checked={activeTickers.includes(ticker)}
            aria-label={`Показать тикер ${ticker}`}
            onChange={() => onToggleTicker(ticker)}
          />
          <span className="ticker-name">{ticker}</span>
        </label>
      ))}
    </fieldset>

    {indicators && (
      <fieldset>
        <legend>Индикаторы</legend>

        {/* EMA индикаторы */}
        <div className="indicator-group">
          <span className="indicator-label">EMA:</span>
          <div className="indicator-tickers">
            {tickers.map((ticker) => (
              <label key={`${ticker}-ema`} className="indicator-checkbox">
                <input
                  type="checkbox"
                  checked={!!indicatorStatus[ticker]?.ema}
                  aria-label={`EMA для ${ticker}`}
                  onChange={() => onToggleIndicator(ticker, 'ema')}
                />
                <span>{ticker}</span>
              </label>
            ))}
          </div>
        </div>

        {/* RSI индикаторы */}
        <div className="indicator-group">
          <span className="indicator-label">RSI:</span>
          <div className="indicator-tickers">
            {tickers.map((ticker) => (
              <label key={`${ticker}-rsi`} className="indicator-checkbox">
                <input
                  type="checkbox"
                  checked={!!indicatorStatus[ticker]?.rsi}
                  aria-label={`RSI для ${ticker}`}
                  onChange={() => onToggleIndicator(ticker, 'rsi')}
                />
                <span>{ticker}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Volume индикаторы - ТОЛЬКО ДЛЯ ЛИНЕЙНЫХ ГРАФИКОВ */}
        <div className="indicator-group">
          <span className="indicator-label">Объемы по тикерам:</span>
          <div className="indicator-tickers">
            {tickers.map((ticker) => (
              <label key={`${ticker}-volume`} className="indicator-checkbox">
                <input
                  type="checkbox"
                  checked={!!indicatorStatus[ticker]?.volume}
                  aria-label={`Объем для ${ticker}`}
                  onChange={() => onToggleIndicator(ticker, 'volume')}
                />
                <span>{ticker}</span>
              </label>
            ))}
          </div>
        </div>
      </fieldset>
    )}

    <div className="chart-actions">
      <label className="volume-toggle">
        <input
          type="checkbox"
          checked={showVolume}
          aria-label="Показывать объемы"
          onChange={onToggleVolume}
        />
        📊 Общий объем
      </label>

      <button
        type="button"
        onClick={onRefresh}
        aria-label="Обновить"
        className="refresh-btn"
      >
        🔄 Обновить
      </button>
    </div>
  </nav>
);

export default ChartControlPanel;
