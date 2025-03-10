import { useEffect, useRef } from 'react';
import { CandlestickData, ChartRefs } from '../types';
import { 
  formatCandlestickData, 
  formatVolumeData, 
  formatDSSData,
  createBuySellMarkers,
  addMarkersToSeries,
  createRectanglesFromData
} from '../chartUtils';
import { RectanglePlugin } from '../Rectangular';

export const useChartUpdater = (
  chartData: CandlestickData[], 
  chartRefs: ChartRefs,
  setDebugInfo: (info: string) => void
) => {
  // Local ref to track the latest debug message
  const lastDebugMessage = useRef<string>('');
  
  // Update chart data when it changes
  useEffect(() => {
    if (!chartData.length) return;
    const { 
      chartRef, 
      candlestickSeriesRef, 
      volumeSeriesRef, 
      dssSeriesRefs,
      rectanglePluginRef
    } = chartRefs;

    // Update candlestick data
    const candleData = formatCandlestickData(chartData);
    candlestickSeriesRef.current?.setData(candleData);

    // Update volume data
    const volumeData = formatVolumeData(chartData);
    volumeSeriesRef.current?.setData(volumeData);

    // Update DSS data
    const dssFields = ['DSS_UP', 'DSS_DOWN', 'DSS_2H', 'DSS_4H', 'DSS_8H', 'DSS_12H', 'DSS_DAILY', 'DSS_3D'];
    dssFields.forEach(field => {
      const data = formatDSSData(chartData, field);
      dssSeriesRefs.current[field]?.setData(data);
    });

    // Create markers and add them to the chart
    const addMarkers = () => {
      const markers = createBuySellMarkers(chartData);
      addMarkersToSeries(candlestickSeriesRef.current, markers);
    };

    // Add box annotations
    const addBoxAnnotations = () => {
      if (!chartRef.current || !candlestickSeriesRef.current) {
        console.error('Cannot add box annotations - chart not ready');
        return;
      }
      
      // Calculate price ranges
      const minPrice = Math.min(...chartData.map(d => d.low));
      const maxPrice = Math.max(...chartData.map(d => d.high));
      
      // Create rectangles
      const rectangles = createRectanglesFromData(chartData);
      
      // Create/update rectangle plugin
      if (!rectanglePluginRef.current && chartRef.current) {
        rectanglePluginRef.current = new RectanglePlugin(chartRef.current, { min: minPrice, max: maxPrice });
      }
      
      // Update price range and set rectangles
      if (rectanglePluginRef.current) {
        rectanglePluginRef.current.setPriceRange(minPrice, maxPrice);
        rectanglePluginRef.current.setRectangles(rectangles);
      }
      
      // Update debug info
      const message = "Added box annotations";
      lastDebugMessage.current = message;
      setDebugInfo(message);
    };

    // Add markers and annotations after a short delay to ensure chart is ready
    setTimeout(() => {
      addMarkers();
      addBoxAnnotations();
    }, 500);
  }, [chartData, chartRefs, setDebugInfo]);

  // Functions to expose
  const refreshMarkers = () => {
    if (!chartData.length || !chartRefs.candlestickSeriesRef.current) return;
    
    const markers = createBuySellMarkers(chartData);
    addMarkersToSeries(chartRefs.candlestickSeriesRef.current, markers);
  };

  const refreshBoxAnnotations = () => {
    if (!chartData.length || !chartRefs.chartRef.current || !chartRefs.rectanglePluginRef.current) return;
    
    // Calculate price ranges
    const minPrice = Math.min(...chartData.map(d => d.low));
    const maxPrice = Math.max(...chartData.map(d => d.high));
    
    // Create rectangles
    const rectangles = createRectanglesFromData(chartData);
    
    // Update price range and set rectangles
    chartRefs.rectanglePluginRef.current.setPriceRange(minPrice, maxPrice);
    chartRefs.rectanglePluginRef.current.setRectangles(rectangles);
    
    // Update debug info
    const message = "Refreshed box annotations";
    lastDebugMessage.current = message;
    setDebugInfo(message);
  };

  return { refreshMarkers, refreshBoxAnnotations };
}; 