/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState } from 'react';
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
import { CandlestickController, CandlestickElement } from 'chartjs-chart-financial';
import zoomPlugin from 'chartjs-plugin-zoom';
import 'chartjs-adapter-date-fns';
import { enUS } from 'date-fns/locale';
import annotationPlugin from 'chartjs-plugin-annotation';

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
  zoomPlugin,
  annotationPlugin
);

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
}

const TradingChart = () => {
  const [selectedCoin, setSelectedCoin] = useState('BTCUSDT');
  const [chartData, setChartData] = useState<CandlestickData[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const priceChartRef = useRef<ChartJS>(null);
  const dssChartRef = useRef<ChartJS>(null);
  const volumeChartRef = useRef<ChartJS>(null);

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
        
        // Process the data to ensure timestamps are correctly formatted
        const processedData = data.map(item => ({
          ...item,
          // Ensure timestamp is a number that Chart.js can use
          time: Number(item.time)
        }));
        
        setChartData(processedData);
        setError(null);
      } catch (error) {
        console.error('Error loading data:', error);
        setError(`Failed to load data: ${error.message}`);
      }
    };
    
    fetchData();
  }, [selectedCoin]);

  // Update price data with styling
  const priceData: ChartData = {
    datasets: [{
      label: selectedCoin,
      type: 'candlestick' as const,
      data: chartData.map(d => ({
        x: d.time,
        o: d.open,
        h: d.high,
        l: d.low,
        c: d.close
      })),
      borderColor: '#378658',
      borderWidth: 2,
      backgroundColor: 'rgba(55, 134, 88, 0.4)',
    }]
  };

  const volumeData: ChartData = {
    datasets: [{
      label: 'Volume',
      data: chartData.map(d => ({
        x: d.time,
        y: d.volume
      })),
      type: 'bar',
      backgroundColor: chartData.map(d => d.close >= d.open ? 'rgba(75, 192, 192, 0.6)' : 'rgba(255, 99, 132, 0.6)'),
    }],
  };

  const dssData: ChartData = {
    datasets: [
      {
        label: 'DSS_UP',
        data: chartData.map(d => ({
          x: d.time,
          y: d.DSS_UP
        })),
        borderColor: '#4CAF50', // Green
        tension: 0.1,
        borderWidth: 1.5,
      },
      {
        label: 'DSS_DOWN',
        data: chartData.map(d => ({
          x: d.time,
          y: d.DSS_DOWN
        })),
        borderColor: '#FF5252', // Red
        tension: 0.1,
        borderWidth: 1.5,
      },
      {
        label: 'DSS_2H',
        data: chartData.map(d => ({
          x: d.time,
          y: d.DSS_2H
        })),
        borderColor: '#9C27B0', // Purple
        tension: 0.1,
        borderWidth: 1.5,
      },
      {
        label: 'DSS_4H',
        data: chartData.map(d => ({
          x: d.time,
          y: d.DSS_4H
        })),
        borderColor: '#009688', // Teal
        tension: 0.1,
        borderWidth: 1.5,
      },
      {
        label: 'DSS_8H',
        data: chartData.map(d => ({
          x: d.time,
          y: d.DSS_8H
        })),
        borderColor: '#FF9800', // Orange
        tension: 0.1,
        borderWidth: 1.5,
      },
      {
        label: 'DSS_12H',
        data: chartData.map(d => ({
          x: d.time,
          y: d.DSS_12H
        })),
        borderColor: '#FFEB3B', // Yellow
        tension: 0.1,
        borderWidth: 1.5,
      },
      {
        label: 'DSS_DAILY',
        data: chartData.map(d => ({
          x: d.time,
          y: d.DSS_DAILY
        })),
        borderColor: '#E91E63', // Magenta
        tension: 0.1,
        borderWidth: 1.5,
      },
      {
        label: 'DSS_3D',
        data: chartData.map(d => ({
          x: d.time,
          y: d.DSS_3D
        })),
        borderColor: '#00BCD4', // Cyan
        tension: 0.1,
        borderWidth: 1.5,
      },
    ],
  };

  // Base options for all charts
  const baseOptions: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    scales: {
      x: {
        type: 'time',
        time: {
          unit: 'day',
          displayFormats: {
            day: 'MMM d',
          },
          round: 'day'
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
          maxRotation: 0,
          source: 'data'
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
        },
        zoom: {
          wheel: {
            enabled: true,
            speed: 0.1,
          },
          pinch: {
            enabled: true
          },
          mode: 'x',
        }
      },
      legend: {
        position: 'top' as const,
        labels: {
          color: '#d1d4dc',
          usePointStyle: true,
          pointStyle: 'circle',
        }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(42, 46, 57, 0.95)',
        titleColor: '#d1d4dc',
        bodyColor: '#d1d4dc',
        borderColor: '#485c7b',
        borderWidth: 1,
      }
    }
  };

  // Update synchronization
  useEffect(() => {
    const charts = [priceChartRef.current, dssChartRef.current, volumeChartRef.current].filter(Boolean);
    
    if (charts.length === 3) {
      charts.forEach(chart => {
        chart.options.plugins.zoom.zoom.onZoomComplete = ({ chart: activeChart }) => {
          const { min, max } = activeChart.scales.x;
          charts.forEach(subChart => {
            if (subChart !== activeChart) {
              subChart.scales.x.options.min = min;
              subChart.scales.x.options.max = max;
              subChart.update('none');
            }
          });
        };

        chart.options.plugins.zoom.pan.onPanComplete = ({ chart: activeChart }) => {
          const { min, max } = activeChart.scales.x;
          charts.forEach(subChart => {
            if (subChart !== activeChart) {
              subChart.scales.x.options.min = min;
              subChart.scales.x.options.max = max;
              subChart.update('none');
            }
          });
        };
      });
    }
  }, [chartData]);

  const resetZoom = () => {
    const charts = [priceChartRef.current, dssChartRef.current, volumeChartRef.current].filter(Boolean);
    charts.forEach(chart => {
      if (chart) {
        chart.resetZoom();
        chart.update();
      }
    });
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
    <div style={{ width: '100%', height: '100%', backgroundColor: '#131722', overflow: 'hidden' }}>
      <div style={{ padding: '10px', backgroundColor: '#131722', borderBottom: '1px solid #485c7b', display: 'flex', alignItems: 'center' }}>
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
        <button 
          onClick={resetZoom}
          style={{
            marginLeft: 'auto',
            backgroundColor: '#2A2E39',
            color: '#d1d4dc',
            padding: '8px 12px',
            border: '1px solid #485c7b',
            borderRadius: '4px',
            fontSize: '14px',
            cursor: 'pointer'
          }}
        >
          Reset Zoom
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
        <div style={{ flex: '2 0 66%', padding: '10px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ height: '70%', marginBottom: '10px', position: 'relative' }}>
            <Chart ref={priceChartRef} type="candlestick" data={priceData} options={{
              ...baseOptions,
              maintainAspectRatio: false,
              responsive: true
            }} />
          </div>
          <div style={{ height: '30%', position: 'relative' }}>
            <Chart ref={volumeChartRef} type="bar" data={volumeData} options={{
              ...baseOptions,
              maintainAspectRatio: false,
              responsive: true,
              scales: {
                ...baseOptions.scales,
                y: {
                  ...baseOptions.scales.y,
                  suggestedMin: 0
                }
              }
            }} />
          </div>
        </div>
        <div style={{ flex: '1 0 33%', padding: '10px', position: 'relative', overflow: 'hidden' }}>
          <Chart ref={dssChartRef} type="line" data={dssData} options={{
            ...baseOptions,
            maintainAspectRatio: false,
            responsive: true
          }} />
        </div>
      </div>
    </div>
  );
};

export default TradingChart;
