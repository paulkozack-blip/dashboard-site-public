import { GroupChartData, ApiTickerData, IndicatorApiResponse } from '@/types/api';
import { SeriesInfo, CandlestickPoint, LinePoint, IndicatorData } from '@/types/charts';
import { isoDateToUnixTime } from '@/utils/date';



// Преобразование ISO даты к unix seconds
// export function isoDateToUnixTime(isoDate: string): number {
//   const date = new Date(isoDate + 'T00:00:00Z');
//   return Math.floor(date.getTime() / 1000);
// }

/**
 * Преобразует GroupChartData в массив SeriesInfo для отрисовки
 */
export function adaptGroupChartData(groupChartData: GroupChartData): SeriesInfo[] {
  return Object.values(groupChartData).map((tickerData: ApiTickerData) => {
    const { ticker, group, type, data } = tickerData;
    if (type === 'line') {
      const linePoints: LinePoint[] = (data as any[]).map(point => ({
        time: isoDateToUnixTime(point.date),
        value: point.price,
        volume: point.volume,
      }));
      return {
        id: `${group}-${ticker}-line`,
        ticker,
        group,
        type,
        data: linePoints,
      };
    }
    if (type === 'candlestick') {
      const candlePoints: CandlestickPoint[] = (data as any[]).map(point => ({
        time: isoDateToUnixTime(point.date),
        open: point.open,
        high: point.high,
        low: point.low,
        close: point.close,
        volume: point.volume,
      }));
      return {
        id: `${group}-${ticker}-candlestick`,
        ticker,
        group,
        type,
        data: candlePoints,
      };
    }
    throw new Error(`Unknown type: ${type}`);
  });
}

/**
 * Преобразует IndicatorApiResponse в IndicatorData
 */
export function adaptIndicatorResponse(
  response: IndicatorApiResponse,
  baseColor: string,
  indicator: string,
  period: number
): IndicatorData {
  const { ticker, data } = response;
  const linePoints: LinePoint[] = data.map(point => ({
    time: isoDateToUnixTime(point.date),
    value: point.value === null ? NaN : Number(point.value),
    // value: point.value,
  }));
  return {
    ticker,
    indicator,
    period,
    data: linePoints,
    color: baseColor
  };
}
