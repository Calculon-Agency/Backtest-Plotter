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
  createSeriesMarkers,
  PriceScaleMode
} from 'lightweight-charts';
import { RectanglePlugin, Rectangle, RectangleOptions } from './Rectangular';

const DEFAULT_HEIGHT = 800;
// Use the symbol list fetched from the API
const DEFAULT_SYMBOLS = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'ADAUSDT', 'XRPUSDT', 'LTCUSDT', 'EOSUSDT', 'NEOUSDT', 'QTUMUSDT'];

// Box annotation interface
interface BoxAnnotation {
  xMin: number; // timestamp in ms
  xMax: number; // timestamp in ms
  yMin?: number; // price level (optional)
  yMax?: number; // price level (optional)
  backgroundColor: string;
  borderColor: string;
  borderWidth: number;
}

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
  DSS_DAILY: number | null;
  DSS_1D?: number; // From API
  DSS_3D: number | null;
  DSS_UP: number | null;
  DSS_DOWN: number | null;
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
  const [boxAnnotations, setBoxAnnotations] = useState<BoxAnnotation[]>([]);
  const [availableSymbols, setAvailableSymbols] = useState<string[]>(DEFAULT_SYMBOLS);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  
  // Filter symbols based on search term
  const filteredSymbols = availableSymbols.filter(symbol => 
    symbol.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const volumeContainerRef = useRef<HTMLDivElement>(null);
  const dssContainerRef = useRef<HTMLDivElement>(null);
  
  const chartRef = useRef<IChartApi | null>(null);
  const volumeChartRef = useRef<IChartApi | null>(null);
  const dssChartRef = useRef<IChartApi | null>(null);
  
  const candlestickSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const dssSeriesRefs = useRef<{[key: string]: ISeriesApi<'Line'> | null}>({});
  
  // Reference to the rectangle plugin
  const rectanglePluginRef = useRef<RectanglePlugin | null>(null);

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
    
    
    // Set the markers on the candlestick series
    if (markers.length > 0 && candlestickSeriesRef.current) {
      try {
        // Use createSeriesMarkers instead of setMarkers
        createSeriesMarkers(candlestickSeriesRef.current, markers);
      } catch (err) {
        console.error('Error setting markers:', err);
      }
    }
  };

  // Function to add box annotations to the chart
  const addBoxAnnotations = () => {
    console.log('Adding box annotations');
    if (!chartRef.current || !candlestickSeriesRef.current || !chartData.length) {
      console.error('Cannot add box annotations - chart or data not ready');
      return;
    }
    
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
    
    console.log(`Using time range from data: ${new Date(startTime).toISOString()} to ${new Date(endTime).toISOString()}`);
    
    // Calculate price ranges from visible data
    const minPrice = Math.min(...sortedData.slice(startIdx).map(d => d.low));
    const maxPrice = Math.max(...sortedData.slice(startIdx).map(d => d.high));
    const midPrice = (minPrice + maxPrice) / 2;
    
    console.log(`Price range in visible data: ${minPrice} - ${maxPrice}`);
    
    // Create Rectangle objects for our plugin
    const rectangles: Rectangle[] = [
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
    
    // Create a new RectanglePlugin if it doesn't exist yet
    if (!rectanglePluginRef.current && chartRef.current) {
      rectanglePluginRef.current = new RectanglePlugin(chartRef.current, { min: minPrice, max: maxPrice });
    }
    
    // Update price range and set rectangles
    if (rectanglePluginRef.current) {
      rectanglePluginRef.current.setPriceRange(minPrice, maxPrice);
      rectanglePluginRef.current.setRectangles(rectangles);
      console.log('Added rectangles to the chart:', rectangles.length);
    }
    
    // Add a message to the debug info
    setDebugInfo(prevInfo => `${prevInfo} | Added box annotations`);
  };
  
  // Function to fetch available symbols from the API
  useEffect(() => {
    const fetchSymbols = async () => {
      try {
        const response = await fetch('https://api.coinchart.fun/symbol_list');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const symbolData = await response.json();
        // Extract unique symbols from the binance exchange
        const binanceSymbols = symbolData
          .filter((item: any) => item.exchange === 'binance')
          .map((item: any) => item.symbol);
        
        // Only update if we have symbols
        if (binanceSymbols.length > 0) {
          setAvailableSymbols(binanceSymbols);
          // Set default selected coin if current selection is not available
          if (!binanceSymbols.includes(selectedCoin)) {
            setSelectedCoin(binanceSymbols[0]);
          }
        }
      } catch (error) {
        console.error('Error fetching symbols:', error);
        // Keep using default symbols if API fails
      }
    };
    
    fetchSymbols();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setDebugInfo('Fetching data...');
        
        // Extract symbol without USDT suffix for the API
        const symbol = selectedCoin.replace('USDT', '').toLowerCase();
        const apiUrl = `https://api.coinchart.fun/candle_data/${symbol}`;
        
        console.log(`Fetching data from: ${apiUrl}`);
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Normalize data structure if needed
        const normalizedData = data.map((d: any) => ({
          time: d.time,
          open: d.open,
          high: d.high,
          low: d.low,
          close: d.close,
          volume: d.volume,
          // Map DSS fields, ensuring API naming differences are handled
          DSS_UP: d.DSS_UP !== undefined ? d.DSS_UP : 80,
          DSS_DOWN: d.DSS_DOWN !== undefined ? d.DSS_DOWN : 20,
          DSS_12H: d.DSS_12H,
          DSS_2H: d.DSS_2H,
          DSS_4H: d.DSS_4H,
          DSS_8H: d.DSS_8H,
          DSS_DAILY: d.DSS_1D || d.DSS_DAILY,
          DSS_3D: d.DSS_3D,
          // Buy/Sell signals
          BUY: d.BUY === true,
          SELL: d.SELL === true,
          // Include all other properties
          ...d
        }));
        
        // Check for buy/sell signals in data
        const buySignals = normalizedData.filter((d: any) => d.BUY === true).length;
        const sellSignals = normalizedData.filter((d: any) => d.SELL === true).length;
        setDebugInfo(`Loaded from API: ${buySignals} buy signals and ${sellSignals} sell signals`);
        
        setChartData(normalizedData);
        setError(null);
      } catch (error) {
        console.error('Error loading data:', error);
        setError(`Failed to load data from API: ${error.message}. Please try another symbol or try again later.`);
        setChartData([]);
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
      if (rectanglePluginRef.current) {
        rectanglePluginRef.current.destroy();
      }
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
        .filter(d => d[field as keyof CandlestickData] !== null && d[field as keyof CandlestickData] !== undefined)
        .map(d => ({
          time: d.time / 1000 as Time,
          value: d[field as keyof CandlestickData] as number,
        }));
      dssSeriesRefs.current[field]?.setData(data);
    });

    // Add markers after a short delay to ensure chart is ready
    setTimeout(() => {
      addBuySellMarkers();
      addBoxAnnotations(); // Add box annotations
    }, 500);

  }, [chartData]);

  // Function to fetch rectangles from API (for future implementation)
  const fetchRectanglesFromAPI = async () => {
    try {
      // This is a placeholder for future rectangle API integration
      // In the future, you would fetch data from your rectangle API here
      
      // Example of what the API response might look like:
      /*
      const response = await fetch('your-rectangle-api-endpoint');
      const data = await response.json();
      
      if (rectanglePluginRef.current && chartRef.current && data.rectangles) {
        // Get price range for better positioning
        const minPrice = Math.min(...chartData.map(d => d.low));
        const maxPrice = Math.max(...chartData.map(d => d.high));
        
        rectanglePluginRef.current.setPriceRange(minPrice, maxPrice);
        rectanglePluginRef.current.setRectangles(data.rectangles);
      }
      */
      
      console.log('Rectangle API fetch placeholder - using default rectangles for now');
      
      // For now, just trigger the default box annotations
      addBoxAnnotations();
    } catch (error) {
      console.error('Error fetching rectangles:', error);
    }
  };

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
        <div style={{ position: 'relative', minWidth: '200px' }}>
          <div 
            style={{
              backgroundColor: '#2A2E39',
              color: '#d1d4dc',
              padding: '8px',
              border: '1px solid #485c7b',
              borderRadius: '4px',
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            <span>{selectedCoin}</span>
            <span style={{ marginLeft: '8px' }}>▼</span>
          </div>
          
          {isDropdownOpen && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              width: '100%',
              backgroundColor: '#2A2E39',
              border: '1px solid #485c7b',
              borderRadius: '0 0 4px 4px',
              zIndex: 10,
              maxHeight: '300px',
              overflowY: 'auto'
            }}>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search coins..."
                style={{
                  width: '100%',
                  padding: '8px',
                  backgroundColor: '#1E222D',
                  color: '#d1d4dc',
                  border: 'none',
                  borderBottom: '1px solid #485c7b',
                  fontSize: '14px',
                  outline: 'none'
                }}
                onClick={(e) => e.stopPropagation()}
              />
              
              <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
                {filteredSymbols.length > 0 ? (
                  filteredSymbols.map(coin => (
                    <div
                      key={coin}
                      style={{
                        padding: '8px',
                        cursor: 'pointer',
                        backgroundColor: selectedCoin === coin ? '#364156' : 'transparent',
                        color: '#d1d4dc',
                        borderBottom: '1px solid #343a45',
                        fontSize: '14px'
                      }}
                      onClick={() => {
                        setSelectedCoin(coin);
                        setIsDropdownOpen(false);
                        setSearchTerm('');
                      }}
                    >
                      {coin}
                    </div>
                  ))
                ) : (
                  <div style={{ padding: '8px', color: '#758696', fontSize: '14px' }}>
                    No coins found
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
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
        <button 
          onClick={addBoxAnnotations}
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
          Add Box Annotations
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
