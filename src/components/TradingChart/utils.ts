/* eslint-disable @typescript-eslint/no-unused-vars */
import { CandlestickData, VolumeData, IndicatorData, MACDData, SignalType } from './types';
import { format } from 'date-fns';

const determineSignal = (open: number, close: number): SignalType => {
    if (close > open * 1.02) return 'buy';
    if (close < open * 0.98) return 'sell';
    return 'neutral';
};

export const generateMockData = (days: number = 100): {
    candlesticks: CandlestickData[];
    volumes: VolumeData[];
} => {
    const candlesticks: CandlestickData[] = [];
    const volumes: VolumeData[] = [];
    let time = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    let price = 70000;
    
    for (let i = 0; i < days; i++) {
        const volatility = Math.random() * 0.02; // 2% max volatility
        const open = price * (1 + (Math.random() - 0.5) * volatility);
        const high = open * (1 + Math.random() * volatility);
        const low = open * (1 - Math.random() * volatility);
        const close = (high + low) / 2;
        const volume = Math.floor(Math.random() * 10000) + 1000;
        const signal = determineSignal(open, close);
        const timeStr = format(time, 'yyyy-MM-dd HH:mm');

        candlesticks.push({ time: timeStr, open, high, low, close, volume, signal });
        volumes.push({
            time: timeStr,
            value: volume,
            color: close >= open ? 'rgba(38, 166, 154, 0.5)' : 'rgba(239, 83, 80, 0.5)'
        });

        price = close;
        time = new Date(time.getTime() + 24 * 60 * 60 * 1000);
    }

    return { candlesticks, volumes };
};

export const calculateEMA = (data: CandlestickData[], period: number): IndicatorData[] => {
    const multiplier = 2 / (period + 1);
    const emaData: IndicatorData[] = [];
    let ema = data[0].close;

    data.forEach((candle, _i) => {
        ema = (candle.close - ema) * multiplier + ema;
        emaData.push({ time: candle.time, value: ema });
    });

    return emaData;
};

export const calculateMACD = (data: CandlestickData[]): MACDData[] => {
    const fastEMA = calculateEMA(data, 12);
    const slowEMA = calculateEMA(data, 26);
    const macdLine = fastEMA.map((fast, i) => ({
        time: fast.time,
        value: fast.value - slowEMA[i].value
    }));
    
    const signalLine = calculateEMA(
        macdLine.map(m => ({ ...data[0], close: m.value, time: m.time })),
        9
    );

    return macdLine.map((macd, i) => ({
        time: macd.time,
        macd: macd.value,
        signal: signalLine[i].value,
        histogram: macd.value - signalLine[i].value
    }));
};

export const calculateRSI = (data: CandlestickData[], period: number = 14): IndicatorData[] => {
    const gains: number[] = [];
    const losses: number[] = [];
    
    for (let i = 1; i < data.length; i++) {
        const change = data[i].close - data[i-1].close;
        gains.push(change > 0 ? change : 0);
        losses.push(change < 0 ? -change : 0);
    }

    const rsiData: IndicatorData[] = [];
    let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
    let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;

    for (let i = period; i < data.length; i++) {
        avgGain = (avgGain * (period - 1) + gains[i - 1]) / period;
        avgLoss = (avgLoss * (period - 1) + losses[i - 1]) / period;
        
        const rs = avgGain / avgLoss;
        const rsi = 100 - (100 / (1 + rs));

        rsiData.push({
            time: data[i].time,
            value: rsi
        });
    }

    return rsiData;
};
