import { MutableRefObject, RefObject } from 'react';
import { IChartApi, ISeriesApi } from 'lightweight-charts';
import { RectanglePlugin } from './Rectangular';

export type SignalType = 'buy' | 'sell' | 'neutral';
export type IndicatorType = 'SMA' | 'EMA' | 'RSI' | 'MACD';

export interface CandlestickData {
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    // DSS Indicators
    DSS_12H: number | null;
    DSS_2H: number | null;
    DSS_4H: number | null;
    DSS_8H: number | null;
    DSS_DAILY: number | null;
    DSS_1D?: number; // From API
    DSS_3D: number | null;
    DSS_UP: number | null;
    DSS_DOWN: number | null;
    // Buy/Sell indicators
    buy?: boolean;
    sell?: boolean;
    // Also include uppercase versions for API compatibility
    BUY?: boolean;
    SELL?: boolean;
    // Additional properties
    [key: string]: number | boolean | null | undefined;
}

export interface VolumeData {
    time: string | number;
    value: number;
    color: string;
}

export interface IndicatorData {
    time: string | number;
    value: number;
}

export interface MACDData {
    time: string;
    macd: number;
    signal: number;
    histogram: number;
}

export interface BoxAnnotation {
    xMin: number; // timestamp in ms
    xMax: number; // timestamp in ms
    yMin?: number; // price level (optional)
    yMax?: number; // price level (optional)
    backgroundColor: string;
    borderColor: string;
    borderWidth: number;
}

export interface ChartConfig {
    height?: number;
    width?: string;
    indicators?: IndicatorType[];
}

// Chart references
export interface ChartRefs {
    chartRef: MutableRefObject<IChartApi | null>;
    volumeChartRef: MutableRefObject<IChartApi | null>;
    dssChartRef: MutableRefObject<IChartApi | null>;
    candlestickSeriesRef: MutableRefObject<ISeriesApi<'Candlestick'> | null>;
    volumeSeriesRef: MutableRefObject<ISeriesApi<'Histogram'> | null>;
    dssSeriesRefs: MutableRefObject<{[key: string]: ISeriesApi<'Line'> | null}>;
    rectanglePluginRef: MutableRefObject<RectanglePlugin | null>;
}

// Chart containers
export interface ChartContainers {
    chartContainerRef: RefObject<HTMLDivElement>;
    volumeContainerRef: RefObject<HTMLDivElement>;
    dssContainerRef: RefObject<HTMLDivElement>;
}
