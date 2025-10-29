import React from 'react';
import { IndicatorData } from '@/types/charts';

interface IndicatorPaneProps {
  indicatorMap: Record<string, IndicatorData>;
  activeIndicators: Record<string, { ema: boolean; rsi: boolean; volume: boolean }>; // ← ДОБАВИТЬ
  tickers: string[];
  getRsiColor: (ticker: string) => string;
}

const IndicatorPane: React.FC<IndicatorPaneProps> = ({
  indicatorMap, activeIndicators, tickers, getRsiColor
}) => {
  return (
    <div className="indicator-pane" aria-label="RSI Pane">
      <span>RSI (активные): </span>
      {tickers.map(ticker => {
        const key = Object.keys(indicatorMap).find(k => k.startsWith(`${ticker}_rsi_`));
        if (key && activeIndicators[ticker]?.rsi && indicatorMap[key]) {
          const last = indicatorMap[key].data.slice(-1)[0];
          return (
            <span key={ticker} style={{ color: getRsiColor(ticker) }}>
              {ticker}: {last ? last.value : '-'}
            </span>
          );
        }
        return null;
      })}
    </div>
  );
};

export default IndicatorPane;
