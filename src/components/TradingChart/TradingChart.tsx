/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState } from 'react';
import {
  createChart, 
  ColorType, 
  IChartApi, 
  ISeriesApi, 
  Time, 
  LineStyle, 
  DeepPartial, 
  ChartOptions,
  CandlestickSeries,
  HistogramSeries,
  LineSeries,
  MouseEventParams,
  SeriesMarker,
  createSeriesMarkers
} from 'lightweight-charts';

const DEFAULT_HEIGHT = 800;
const AVAILABLE_COINS = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'ADAUSDT', 'XRPUSDT', 'LTCUSDT', 'EOSUSDT', 'NEOUSDT', 'QTUMUSDT'];

interface CandlestickData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  DSS_12H: number | null;
  DSS_2H: number | null;
  DSS_4H: number | null;
  DSS_8H: number | null;
  DSS_DAILY: number;
  DSS_3D: number;
  DSS_UP: number;
  DSS_DOWN: number;
  buy?: boolean;
  sell?: boolean;
  // Also include uppercase versions for API compatibility
  BUY?: boolean;
  SELL?: boolean;
  // Additional properties would be here
  [key: string]: any; // Allow any other properties
}

const TradingChart = () => {
  const [selectedCoin, setSelectedCoin] = useState('BTCUSDT');
  const [chartData, setChartData] = useState<CandlestickData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string>('');
  
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const volumeContainerRef = useRef<HTMLDivElement>(null);
  const dssContainerRef = useRef<HTMLDivElement>(null);
  
  const chartRef = useRef<IChartApi | null>(null);
  const volumeChartRef = useRef<IChartApi | null>(null);
  const dssChartRef = useRef<IChartApi | null>(null);
  
  const candlestickSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const dssSeriesRefs = useRef<{[key: string]: ISeriesApi<'Line'> | null}>({});

  // Function to manually add buy/sell markers to the chart
  const addBuySellMarkers = () => {
    if (!chartData.length || !candlestickSeriesRef.current) return;
    
    // Create markers for buy and sell signals
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
    
    console.log(`Created ${markers.length} markers for buy/sell signals`);
    
    // Set the markers on the candlestick series
    if (markers.length > 0 && candlestickSeriesRef.current) {
      try {
        // Use createSeriesMarkers instead of setMarkers
        createSeriesMarkers(candlestickSeriesRef.current, markers);
        console.log('Markers set successfully');
      } catch (err) {
        console.error('Error setting markers:', err);
      }
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('Fetching data for:', selectedCoin);
        const response = await fetch(`./assets/samples/${selectedCoin}.json`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log('Data sample:', data[0]);
        console.log('Data loaded:', data.length, 'records');
        
        // Check for buy/sell signals in data
        const buySignals = data.filter((d: any) => d.BUY === true).length;
        const sellSignals = data.filter((d: any) => d.SELL === true).length;
        console.log(`Found ${buySignals} buy signals and ${sellSignals} sell signals`);
        setDebugInfo(`Found ${buySignals} buy signals and ${sellSignals} sell signals`);
        
        setChartData(data);
        setError(null);
      } catch (error) {
        console.error('Error loading data:', error);
        setError(`Failed to load data: ${error.message}`);
      }
    };
    
    fetchData();
  }, [selectedCoin]);

  useEffect(() => {
    if (!chartContainerRef.current || !volumeContainerRef.current || !dssContainerRef.current) return;

    // Common chart options
    const chartOptions: DeepPartial<ChartOptions> = {
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
    };

    // Create main chart
    const mainChart = createChart(chartContainerRef.current, {
      ...chartOptions,
      height: Math.floor(DEFAULT_HEIGHT * 0.45),
      width: chartContainerRef.current.clientWidth,
    });
    chartRef.current = mainChart;

    // Create volume chart
    const volumeChart = createChart(volumeContainerRef.current, {
      ...chartOptions,
      height: Math.floor(DEFAULT_HEIGHT * 0.2),
      width: volumeContainerRef.current.clientWidth,
    });
    volumeChartRef.current = volumeChart;

    // Create DSS chart
    const dssChart = createChart(dssContainerRef.current, {
      ...chartOptions,
      height: Math.floor(DEFAULT_HEIGHT * 0.35),
      width: dssContainerRef.current.clientWidth,
    });
    dssChartRef.current = dssChart;

    // Add series to main chart
    candlestickSeriesRef.current = mainChart.addSeries(CandlestickSeries, {
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderVisible: false,
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
    });

    // Add volume series
    volumeSeriesRef.current = volumeChart.addSeries(HistogramSeries, {
      color: '#26a69a',
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: '',
    });

    // Add DSS series
    const dssColors = {
      'DSS_UP': '#4CAF50',
      'DSS_DOWN': '#FF5252',
      'DSS_2H': '#9C27B0',
      'DSS_4H': '#009688',
      'DSS_8H': '#FF9800',
      'DSS_12H': '#FFEB3B',
      'DSS_DAILY': '#E91E63',
      'DSS_3D': '#00BCD4',
    };

    Object.entries(dssColors).forEach(([key, color]) => {
      dssSeriesRefs.current[key] = dssChart.addSeries(LineSeries, {
        color: color,
        lineWidth: 2 as const,
      });
    });

    // Sync charts
    const syncCharts = () => {
      if (volumeChart && dssChart && mainChart) {
        const mainTimeScale = mainChart.timeScale();
        volumeChart.timeScale().subscribeVisibleLogicalRangeChange(() => {
          const range = volumeChart.timeScale().getVisibleLogicalRange();
          if (range) {
            mainTimeScale.setVisibleLogicalRange(range);
            dssChart.timeScale().setVisibleLogicalRange(range);
          }
        });
        mainTimeScale.subscribeVisibleLogicalRangeChange(() => {
          const range = mainTimeScale.getVisibleLogicalRange();
          if (range) {
            volumeChart.timeScale().setVisibleLogicalRange(range);
            dssChart.timeScale().setVisibleLogicalRange(range);
          }
        });
        dssChart.timeScale().subscribeVisibleLogicalRangeChange(() => {
          const range = dssChart.timeScale().getVisibleLogicalRange();
          if (range) {
            mainTimeScale.setVisibleLogicalRange(range);
            volumeChart.timeScale().setVisibleLogicalRange(range);
          }
        });
      }
    };

    syncCharts();

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current && volumeContainerRef.current && dssContainerRef.current) {
        mainChart.applyOptions({ width: chartContainerRef.current.clientWidth });
        volumeChart.applyOptions({ width: volumeContainerRef.current.clientWidth });
        dssChart.applyOptions({ width: dssContainerRef.current.clientWidth });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      mainChart.remove();
      volumeChart.remove();
      dssChart.remove();
    };
  }, []);

  // Update chart data and add markers
  useEffect(() => {
    if (!chartData.length) return;

    // Update candlestick data
    const candleData = chartData.map(d => ({
      time: d.time / 1000 as Time, // Convert to seconds
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close,
    }));
    candlestickSeriesRef.current?.setData(candleData);

    // Update volume data
    const volumeData = chartData.map(d => ({
      time: d.time / 1000 as Time,
      value: d.volume,
      color: d.close >= d.open ? '#26a69a80' : '#ef535080',
    }));
    volumeSeriesRef.current?.setData(volumeData);

    // Update DSS data
    const dssFields = ['DSS_UP', 'DSS_DOWN', 'DSS_2H', 'DSS_4H', 'DSS_8H', 'DSS_12H', 'DSS_DAILY', 'DSS_3D'];
    dssFields.forEach(field => {
      const data = chartData
        .filter(d => d[field as keyof CandlestickData] !== null)
        .map(d => ({
          time: d.time / 1000 as Time,
          value: d[field as keyof CandlestickData] as number,
        }));
      dssSeriesRefs.current[field]?.setData(data);
    });

    // Add markers after a short delay to ensure chart is ready
    setTimeout(() => {
      addBuySellMarkers();
    }, 500);

  }, [chartData]);

  if (error) {
    return (
      <div style={{ 
        padding: '20px', 
        color: '#FF5252', 
        backgroundColor: '#131722',
        border: '1px solid #485c7b',
        borderRadius: '4px',
        margin: '10px'
      }}>
        {error}
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100%', backgroundColor: '#131722', overflow: 'hidden', position: 'relative' }}>
      <div style={{ padding: '10px', backgroundColor: '#131722', borderBottom: '1px solid #485c7b', display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
        <select 
          value={selectedCoin}
          onChange={(e) => setSelectedCoin(e.target.value)}
          style={{
            backgroundColor: '#2A2E39',
            color: '#d1d4dc',
            padding: '8px',
            border: '1px solid #485c7b',
            borderRadius: '4px',
            fontSize: '14px'
          }}
        >
          {AVAILABLE_COINS.map(coin => (
            <option key={coin} value={coin}>{coin}</option>
          ))}
        </select>
        <span style={{ marginLeft: '10px', color: '#d1d4dc' }}>
          {chartData.length > 0 ? `Loaded ${chartData.length} records` : 'Loading...'}
        </span>
        
        <span style={{ marginLeft: '10px', color: '#4CAF50' }}>
          {debugInfo}
        </span>
        <button 
          onClick={addBuySellMarkers}
          style={{
            marginLeft: '10px',
            backgroundColor: '#2A2E39',
            color: '#d1d4dc',
            padding: '8px',
            border: '1px solid #485c7b',
            borderRadius: '4px',
            fontSize: '14px',
            cursor: 'pointer'
          }}
        >
          Refresh Markers
        </button>
      </div>
      <div style={{
        width: '100%',
        height: `${DEFAULT_HEIGHT}px`,
        maxHeight: `${DEFAULT_HEIGHT}px`, 
        backgroundColor: '#131722',
        border: '1px solid #485c7b',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        <div ref={chartContainerRef} style={{ width: '100%' }} />
        <div ref={volumeContainerRef} style={{ width: '100%' }} />
        <div ref={dssContainerRef} style={{ width: '100%' }} />
      </div>
    </div>
  );
};

export default TradingChart;
