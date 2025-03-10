import { DeepPartial, ChartOptions, Time, SeriesMarker, createSeriesMarkers, LineStyle, ISeriesApi } from 'lightweight-charts';
import { CandlestickData } from './types';
import { Rectangle } from './Rectangular';

// Default chart height
export const DEFAULT_HEIGHT = 800;

// Default chart options
export const getChartOptions = (): DeepPartial<ChartOptions> => ({
  layout: {
    background: { color: '#131722' },
    textColor: '#d1d4dc',
  },
  grid: {
    vertLines: { color: '#242832' },
    horzLines: { color: '#242832' },
  },
  timeScale: {
    borderColor: '#485c7b',
    timeVisible: true,
    secondsVisible: false,
  },
  rightPriceScale: {
    borderColor: '#485c7b',
    scaleMargins: {
      top: 0.1,
      bottom: 0.1,
    },
  },
  crosshair: {
    mode: 1,
    vertLine: {
      width: 1 as const,
      color: '#758696',
      style: LineStyle.Dashed,
    },
    horzLine: {
      width: 1 as const,
      color: '#758696',
      style: LineStyle.Dashed,
    },
  },
});

// Function to create buy/sell markers
export const createBuySellMarkers = (chartData: CandlestickData[]): SeriesMarker<Time>[] => {
  const markers: SeriesMarker<Time>[] = [];
  
  chartData.forEach(d => {
    // Check both lowercase and uppercase versions of the property
    if (d.buy === true || d.BUY === true) {
      markers.push({
        time: d.time / 1000 as Time,
        position: 'belowBar',
        color: '#4CAF50',
        shape: 'arrowUp',
        text: 'BUY',
        size: 3,
      });
    }
    if (d.sell === true || d.SELL === true) {
      markers.push({
        time: d.time / 1000 as Time,
        position: 'aboveBar',
        color: '#FF5252',
        shape: 'arrowDown',
        text: 'SELL',
        size: 3,
      });
    }
  });

  return markers;
};

// Function to add markers to a series
export const addMarkersToSeries = (series: ISeriesApi<'Candlestick'> | null, markers: SeriesMarker<Time>[]): void => {
  if (markers.length > 0 && series) {
    try {
      createSeriesMarkers(series, markers);
    } catch (err) {
      console.error('Error setting markers:', err);
    }
  }
};

// Function to create rectangles for annotation
export const createRectanglesFromData = (chartData: CandlestickData[]): Rectangle[] => {
  if (!chartData.length) return [];
  
  // Find current visible data to determine appropriate dates
  // Use the most recent 30% of the dataset for annotations
  const sortedData = [...chartData].sort((a, b) => a.time - b.time);
  const startIdx = Math.floor(sortedData.length * 0.6);
  const midIdx = Math.floor(sortedData.length * 0.75);
  const endIdx = sortedData.length - 1;
  
  // Get actual timestamps from data
  const startTime = sortedData[startIdx]?.time || Date.now();
  const midTime = sortedData[midIdx]?.time || Date.now();
  const endTime = sortedData[endIdx]?.time || Date.now();
  
  // Calculate price ranges from visible data
  const minPrice = Math.min(...sortedData.slice(startIdx).map(d => d.low));
  const maxPrice = Math.max(...sortedData.slice(startIdx).map(d => d.high));
  const midPrice = (minPrice + maxPrice) / 2;
  
  // Create Rectangle objects
  return [
    {
      xMin: startTime,
      xMax: midTime,
      yMin: minPrice,
      yMax: midPrice,
      options: {
        fillColor: '#FF0000',
        fillOpacity: 0.3,
        borderColor: '#FF0000',
        borderWidth: 2,
        borderStyle: LineStyle.Solid,
        borderVisible: true,
      }
    },
    {
      xMin: midTime,
      xMax: endTime,
      yMin: midPrice,
      yMax: maxPrice,
      options: {
        fillColor: '#0000FF',
        fillOpacity: 0.3,
        borderColor: '#0000FF',
        borderWidth: 2,
        borderStyle: LineStyle.Dashed,
        borderVisible: true,
      }
    }
  ];
};

// Function to format data for candlestick chart
export const formatCandlestickData = (data: CandlestickData[]) => {
  return data.map(d => ({
    time: d.time / 1000 as Time, // Convert to seconds
    open: d.open,
    high: d.high,
    low: d.low,
    close: d.close,
  }));
};

// Function to format data for volume chart
export const formatVolumeData = (data: CandlestickData[]) => {
  return data.map(d => ({
    time: d.time / 1000 as Time,
    value: d.volume,
    color: d.close >= d.open ? '#26a69a80' : '#ef535080',
  }));
};

// Function to format DSS indicator data
export const formatDSSData = (data: CandlestickData[], field: string) => {
  return data
    .filter(d => d[field] !== null && d[field] !== undefined)
    .map(d => ({
      time: d.time / 1000 as Time,
      value: d[field] as number,
    }));
}; 