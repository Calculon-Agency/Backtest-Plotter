export type SignalType = 'buy' | 'sell' | 'neutral';
export type IndicatorType = 'SMA' | 'EMA' | 'RSI' | 'MACD';

export interface CandlestickData {
    time: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    signal: SignalType;
}

export interface VolumeData {
    time: string;
    value: number;
    color: string;
}

export interface IndicatorData {
    time: string;
    value: number;
}

export interface MACDData {
    time: string;
    macd: number;
    signal: number;
    histogram: number;
}

export interface ChartConfig {
    height?: number;
    width?: string;
    indicators?: IndicatorType[];
}
