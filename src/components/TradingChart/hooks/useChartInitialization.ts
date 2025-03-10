import { useRef, useEffect } from 'react';
import {
  createChart,
  IChartApi,
  ISeriesApi,
  CandlestickSeries,
  HistogramSeries,
  LineSeries
} from 'lightweight-charts';
import { getChartOptions, DEFAULT_HEIGHT } from '../chartUtils';
import { RectanglePlugin } from '../Rectangular';
import { ChartRefs, ChartContainers } from '../types';

export const useChartInitialization = (): [ChartRefs, ChartContainers] => {
  // Chart container refs
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const volumeContainerRef = useRef<HTMLDivElement>(null);
  const dssContainerRef = useRef<HTMLDivElement>(null);
  
  // Chart refs
  const chartRef = useRef<IChartApi | null>(null);
  const volumeChartRef = useRef<IChartApi | null>(null);
  const dssChartRef = useRef<IChartApi | null>(null);
  
  // Series refs
  const candlestickSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const dssSeriesRefs = useRef<{[key: string]: ISeriesApi<'Line'> | null}>({});
  
  // Rectangle plugin ref
  const rectanglePluginRef = useRef<RectanglePlugin | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current || !volumeContainerRef.current || !dssContainerRef.current) return;

    // Common chart options
    const chartOptions = getChartOptions();

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

  const chartRefs = {
    chartRef,
    volumeChartRef,
    dssChartRef,
    candlestickSeriesRef,
    volumeSeriesRef,
    dssSeriesRefs,
    rectanglePluginRef
  };

  const containers = {
    chartContainerRef,
    volumeContainerRef,
    dssContainerRef
  };

  return [chartRefs, containers];
}; 