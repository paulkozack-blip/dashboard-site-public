// components/charts/TickerHeader.tsx

import React from 'react';

interface TickerHeaderProps {
  tickers: string[];
  activeTickers: string[];
  colorMap: Record<string, string>;
  currentTicker: string | null;
  onToggleTicker: (ticker: string) => void;
  onSelectTicker: (ticker: string) => void;
}

const TickerHeader: React.FC<TickerHeaderProps> = ({
  tickers,
  activeTickers,
  colorMap,
  currentTicker,
  onToggleTicker,
  onSelectTicker,
}) => {
  const handleTickerClick = (ticker: string, event: React.MouseEvent) => {
    if (event.ctrlKey || event.metaKey) {
      // Ctrl+Click - переключение видимости
      onToggleTicker(ticker);
    } else {
      // Обычный клик - только выбор тикера для управления индикаторами
      onSelectTicker(ticker);
    }
  };

  const handleTickerDoubleClick = (ticker: string) => {
    // Двойной клик - переключение видимости
    onToggleTicker(ticker);
  };

  return (
    <div className="ticker-nav">
      <div className="ticker-nav-label">Тикеры</div>
      <div className="ticker-buttons">
        {tickers.map((ticker) => {
          const isActive = activeTickers.includes(ticker);
          const isCurrent = currentTicker === ticker;
          const color = colorMap[ticker] || '#666';

          return (
            <button
              key={ticker}
              className={`ticker-btn ${isActive ? 'active' : 'inactive'} ${isCurrent ? 'current' : ''}`}
              onClick={(e) => handleTickerClick(ticker, e)}
              onDoubleClick={() => handleTickerDoubleClick(ticker)}
              title={
                isActive
                  ? `Клик: выбрать ${ticker}, Двойной клик: скрыть ${ticker}, Ctrl+Клик: скрыть ${ticker}`
                  : `Клик: выбрать ${ticker}, Двойной клик: показать ${ticker}, Ctrl+Клик: показать ${ticker}`
              }
            >
              <span
                className="ticker-dot"
                style={{
                  backgroundColor: isActive ? color : '#e0e0e0',
                  transform: isActive ? 'scale(1.1)' : 'scale(1)',
                }}
              />
              <span className="ticker-name">{ticker}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default TickerHeader;
