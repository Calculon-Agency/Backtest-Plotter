/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { CandlestickData } from '../types';

export const useChartData = (selectedCoin: string) => {
  const [chartData, setChartData] = useState<CandlestickData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
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
      } catch (error: any) {
        console.error('Error loading data:', error);
        setError(`Failed to load data from API: ${error.message}. Please try another symbol or try again later.`);
        setChartData([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [selectedCoin]);

  return { chartData, error, debugInfo, isLoading, setDebugInfo };
}; 