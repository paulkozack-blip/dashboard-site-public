// components/charts/IndicatorPanel.tsx 

import React from 'react';
import { IndicatorSettingsResponse } from '@/types/api';

interface IndicatorPanelProps {
  currentTicker: string | null;
  colorMap: Record<string, string>;
  indicators: IndicatorSettingsResponse | null;
  indicatorStatus: Record<string, { 
    ema: Record<number, boolean>;
    rsi: boolean; 
    volume: boolean; 
  }>;
  onToggleEmaIndicator: (period: number) => void;
  onToggleRsiIndicator: () => void;
  onToggleVolumeIndicator: () => void;
  onLoadIndicators?: (ticker: string) => void;
  isLoadingIndicators?: boolean;
  isDrawingFibonacci?: boolean;
  hasFibonacciRetracements?: boolean;
  onStartFibonacciDrawing?: () => void;
  onCancelFibonacciDrawing?: () => void;
  onClearFibonacci?: () => void;
}

const IndicatorPanel: React.FC<IndicatorPanelProps> = ({
  currentTicker,
  colorMap,
  indicators,
  indicatorStatus,
  onToggleEmaIndicator,
  onToggleRsiIndicator,
  onToggleVolumeIndicator,
  onLoadIndicators,
  isLoadingIndicators = false,
  isDrawingFibonacci = false,
  hasFibonacciRetracements = false,
  onStartFibonacciDrawing,
  onCancelFibonacciDrawing,
  onClearFibonacci,
}) => {
  const handleIndicatorToggle = async (type: 'ema' | 'rsi', period?: number) => {
    if (!currentTicker) return;

    const tickerIndicators = indicatorStatus[currentTicker];
    
    // Если индикаторы еще не загружены, загружаем их и сразу включаем
    if (!tickerIndicators && onLoadIndicators) {
      console.log(`📥 [IndicatorPanel] Загрузка и включение индикатора: ${type} ${period}`);
      await onLoadIndicators(currentTicker);
      
      // После загрузки сразу переключаем индикатор
      setTimeout(() => {
        if (type === 'ema' && period) {
          onToggleEmaIndicator(period);
        } else if (type === 'rsi') {
          onToggleRsiIndicator();
        }
      }, 100);
      return;
    }

    // Если индикаторы уже загружены, просто переключаем
    if (type === 'ema' && period) {
      onToggleEmaIndicator(period);
    } else if (type === 'rsi') {
      onToggleRsiIndicator();
    }
  };

  const handleVolumeToggle = () => {
    if (!currentTicker) return;
    onToggleVolumeIndicator();
  };

  // Обработчики для Фибоначчи
  const handleFibonacciToggle = () => {
    console.log('🔄 [Fibonacci] Toggle clicked, isDrawing:', isDrawingFibonacci);
    console.log('🔄 [Fibonacci] onCancelFibonacciDrawing:', onCancelFibonacciDrawing);
    console.log('🔄 [Fibonacci] onStartFibonacciDrawing:', onStartFibonacciDrawing);

    if (isDrawingFibonacci) {
      console.log('❌ [Fibonacci] Calling cancelDrawing');
      onCancelFibonacciDrawing?.();
    } else {
      console.log('✅ [Fibonacci] Calling startDrawing');
      onStartFibonacciDrawing?.();
    }
  };

  if (!currentTicker || !indicators) {
    return (
      <div className="indicator-panel">
        <div className="indicator-panel-label">Индикаторы</div>
        <div className="indicator-chips">
          <span className="no-ticker-message">Выберите тикер для управления индикаторами</span>
          
          <button
            className={`indicator-chip ${hasFibonacciRetracements ? 'active' : 'inactive'} ${isDrawingFibonacci ? 'drawing' : ''}`}
            onClick={handleFibonacciToggle}
            style={isDrawingFibonacci ? {
              backgroundColor: '#ff444415',
              borderColor: '#ff4444',
              color: '#ff4444'
            } : hasFibonacciRetracements ? {
              backgroundColor: '#667eea15',
              borderColor: '#667eea',
              color: '#667eea'
            } : {}}
          >
            <span className="indicator-icon">
              {isDrawingFibonacci ? '×' : 'F'}
            </span>
            <span className="indicator-text">
              {isDrawingFibonacci ? 'Отменить Фибо' : 'Фибоначчи'}
            </span>
          </button>
          
          {hasFibonacciRetracements && (
            <button
              className="indicator-chip"
              onClick={onClearFibonacci}
              title="Удалить все уровни Фибоначчи"
            >
              <span className="indicator-icon">⌫</span>
              <span className="indicator-text">Очистить Фибо</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  const tickerColor = colorMap[currentTicker] || '#3498db';
  const tickerIndicators = indicatorStatus[currentTicker] || { 
    ema: {}, 
    rsi: false, 
    volume: true 
  };

  const hasLoadedIndicators = Object.keys(tickerIndicators.ema).length > 0;

  return (
    <div className="indicator-panel">
      <div className="indicator-panel-label">
        Индикаторы для <span style={{ color: tickerColor }}>{currentTicker}</span>
        {!hasLoadedIndicators && (
          <button
            onClick={() => onLoadIndicators?.(currentTicker)}
            disabled={isLoadingIndicators}
            style={{
              marginLeft: '10px',
              padding: '4px 8px',
              fontSize: '12px',
              backgroundColor: isLoadingIndicators ? '#ccc' : '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isLoadingIndicators ? 'not-allowed' : 'pointer'
            }}
          >
            {isLoadingIndicators ? 'Загрузка...' : 'Загрузить индикаторы'}
          </button>
        )}
      </div>
      <div className="indicator-chips">
        {/* EMA индикаторы */}
        {indicators.ema_periods.map(period => (
          <button
            key={`ema-${period}`}
            className={`indicator-chip ${tickerIndicators.ema[period] ? 'active' : 'inactive'}`}
            onClick={() => handleIndicatorToggle('ema', period)}
            disabled={isLoadingIndicators}
            style={tickerIndicators.ema[period] ? {
              backgroundColor: `${tickerColor}15`,
              borderColor: tickerColor,
              color: tickerColor
            } : {}}
          >
            <span className="indicator-icon">
              {tickerIndicators.ema[period] ? '✓' : '○'}
            </span>
            <span className="indicator-text">
              EMA({period})
              {!hasLoadedIndicators && isLoadingIndicators && ' ⏳'}
            </span>
          </button>
        ))}
        
        {/* RSI индикатор */}
        <button
          className={`indicator-chip ${tickerIndicators.rsi ? 'active' : 'inactive'}`}
          onClick={() => handleIndicatorToggle('rsi')}
          disabled={isLoadingIndicators}
          style={tickerIndicators.rsi ? {
            backgroundColor: `${tickerColor}15`,
            borderColor: tickerColor,
            color: tickerColor
          } : {}}
        >
          <span className="indicator-icon">
            {tickerIndicators.rsi ? '✓' : '○'}
          </span>
          <span className="indicator-text">
            RSI({indicators.rsi_period})
            {!hasLoadedIndicators && isLoadingIndicators && ' ⏳'}
          </span>
        </button>
        
        {/* Volume индикатор */}
        <button
          className={`indicator-chip ${tickerIndicators.volume ? 'active' : 'inactive'}`}
          onClick={handleVolumeToggle}
          style={tickerIndicators.volume ? {
            backgroundColor: `${tickerColor}15`,
            borderColor: tickerColor,
            color: tickerColor
          } : {}}
        >
          <span className="indicator-icon">
            {tickerIndicators.volume ? '✓' : '○'}
          </span>
          <span className="indicator-text">Объем</span>
        </button>

        {/* Разделитель */}
        <div className="indicator-separator"></div>

        {/* Кнопка Фибоначчи */}
        <button
          className={`indicator-chip ${hasFibonacciRetracements ? 'active' : 'inactive'} ${isDrawingFibonacci ? 'drawing' : ''}`}
          onClick={handleFibonacciToggle}
          style={isDrawingFibonacci ? {
            backgroundColor: '#ff444415',
            borderColor: '#ff4444',
            color: '#ff4444'
          } : hasFibonacciRetracements ? {
            backgroundColor: '#667eea15',
            borderColor: '#667eea',
            color: '#667eea'
          } : {}}
        >
          <span className="indicator-icon">
            {isDrawingFibonacci ? '×' : 'F'}
          </span>
          <span className="indicator-text">
            {isDrawingFibonacci ? 'Отменить Фибо' : 'Фибоначчи'}
          </span>
        </button>
        
        {hasFibonacciRetracements && (
          <button
            className="indicator-chip"
            onClick={onClearFibonacci}
            title="Удалить все уровни Фибоначчи"
          >
            <span className="indicator-icon">⌫</span>
            <span className="indicator-text">Очистить Фибо</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default IndicatorPanel;