/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartData,
  ChartOptions,
  TimeScale,
} from 'chart.js';
import { Chart } from 'react-chartjs-2';
import { generateMockData, calculateRSI, calculateMACD } from './utils';
import { CandlestickData } from './types';
import { CandlestickController, CandlestickElement } from 'chartjs-chart-financial';
import zoomPlugin from 'chartjs-plugin-zoom';
import 'chartjs-adapter-date-fns';
import { enUS } from 'date-fns/locale';


// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  TimeScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  CandlestickController,
  CandlestickElement,
  zoomPlugin
);

const DEFAULT_HEIGHT = 800;

const TradingChart = () => {
  const priceChartRef = useRef<ChartJS>(null);
  const volumeChartRef = useRef<ChartJS>(null);
  const rsiChartRef = useRef<ChartJS>(null);
  const macdChartRef = useRef<ChartJS>(null);

  // Generate mock data
  const { candlesticks, volumes } = generateMockData(100);
  const rsiData = calculateRSI(candlesticks);
  const macdData = calculateMACD(candlesticks);

  // Update price data with styling
  const priceData: ChartData = {
    datasets: [{
      label: 'BTC/USD',
      type: 'candlestick' as const,
      data: candlesticks.map(d => ({
        x: new Date(d.time).getTime(),
        o: d.open,
        h: d.high,
        l: d.low,
        c: d.close
      }))
    }]
  };

  const volumeData: ChartData = {
    labels: volumes.map(d => d.time),
    datasets: [{
      label: 'Volume',
      data: volumes.map(d => d.value),
      type: 'bar',
      backgroundColor: volumes.map(d => d.color),
    }],
  };

  const rsiChartData: ChartData = {
    labels: rsiData.map(d => d.time),
    datasets: [{
      label: 'RSI',
      data: rsiData.map(d => d.value),
      borderColor: '#B71C1C',
      tension: 0.1,
    }],
  };

  const macdChartData: ChartData = {
    labels: macdData.map(d => d.time),
    datasets: [
      {
        label: 'MACD',
        data: macdData.map(d => d.macd),
        borderColor: '#2196F3',
        tension: 0.1,
      },
      {
        label: 'Signal',
        data: macdData.map(d => d.signal),
        borderColor: '#FFA726',
        tension: 0.1,
      },
      {
        label: 'Histogram',
        data: macdData.map(d => d.histogram),
        type: 'bar',
        backgroundColor: (context: any) => {
          const hist = macdData[context.dataIndex].histogram;
          return hist >= 0 ? 'rgba(38, 166, 154, 0.5)' : 'rgba(239, 83, 80, 0.5)';
        },
      },
    ],
  };

  // Update base options
  const baseOptions: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    scales: {
      x: {
        type: 'time',
        time: {
          unit: 'day'
        },
        adapters: {
          date: {
            locale: enUS
          }
        },
        grid: {
          color: '#242832',
        },
        ticks: {
          color: '#d1d4dc',
        }
      },
      y: {
        type: 'linear',
        position: 'right',
        grid: {
          color: '#242832',
        },
        ticks: {
          color: '#d1d4dc',
        }
      }
    },
    plugins: {
      zoom: {
        limits: {
          x: { min: 'original', max: 'original' },
        },
        pan: {
          enabled: true,
          mode: 'x',
          threshold: 10,
        },
        zoom: {
          wheel: {
            enabled: true,
            speed: 0.1,
          },
          pinch: {
            enabled: true,
          },
          mode: 'x',
        },
      },
      legend: {
        labels: {
          color: '#d1d4dc',
        }
      }
    }
  };

  // Update synchronization
  useEffect(() => {
    const charts = [priceChartRef.current, volumeChartRef.current, rsiChartRef.current, macdChartRef.current].filter(Boolean);
    
    if (charts.length === 4) {
      charts.forEach(chart => {
        chart!.options.plugins!.zoom!.zoom!.onZoomComplete = ({ chart: activeChart }) => {
          const { min, max } = activeChart.scales.x;
          charts.forEach(subChart => {
            if (subChart !== activeChart) {
              subChart!.scales.x.options.min = min;
              subChart!.scales.x.options.max = max;
              subChart!.update('none');
            }
          });
        };

        chart!.options.plugins!.zoom!.pan!.onPanComplete = ({ chart: activeChart }) => {
          const { min, max } = activeChart.scales.x;
          charts.forEach(subChart => {
            if (subChart !== activeChart) {
              subChart!.scales.x.options.min = min;
              subChart!.scales.x.options.max = max;
              subChart!.update('none');
            }
          });
        };
      });
    }
  }, []);

  return (
    <div style={{
      width: '100%',
      height: DEFAULT_HEIGHT,
      backgroundColor: '#131722',
      border: '1px solid #485c7b',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <div style={{ flex: 3, padding: '10px' }}>
        <Chart ref={priceChartRef} type="candlestick" data={priceData} options={baseOptions} />
      </div>
      <div style={{ flex: 1, padding: '10px' }}>
        <Chart ref={volumeChartRef} type="bar" data={volumeData} options={baseOptions} />
      </div>
      <div style={{ flex: 1, padding: '10px' }}>
        <Chart ref={rsiChartRef} type="line" data={rsiChartData} options={baseOptions} />
      </div>
      <div style={{ flex: 1, padding: '10px' }}>
        <Chart ref={macdChartRef} type="bar" data={macdChartData} options={baseOptions} />
      </div>
    </div>
  );
};

export default TradingChart;
