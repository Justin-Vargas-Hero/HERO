'use client';

import { useEffect, useRef } from 'react';
import { 
  createChart, 
  ColorType,
  IChartApi,
  ISeriesApi
} from 'lightweight-charts';

interface TradingViewChartProps {
  symbol: string;
  type?: 'line' | 'candle' | 'area';
  height?: number;
  realTimePrice?: number;
  data?: any[];
  interval?: string; // Added interval prop
  timezone?: string; // User's preferred timezone
}

export default function TradingViewChart({
  symbol,
  type = 'line',
  height = 400,
  realTimePrice,
  data,
  interval = '5min',
  timezone = 'UTC'
}: TradingViewChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<any> | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Create the chart
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#ffffff' },
        textColor: '#333333',
      },
      width: chartContainerRef.current.clientWidth,
      height: height,
      grid: {
        vertLines: {
          color: '#e5e7eb',
          visible: true,
        },
        horzLines: {
          color: '#e5e7eb',
          visible: true,
        },
      },
      rightPriceScale: {
        borderColor: '#e5e7eb',
      },
      timeScale: {
        borderColor: '#e5e7eb',
        timeVisible: true,
        secondsVisible: false,
      },
    });

    chartRef.current = chart;

    // ONLY use provided data - NEVER generate random data
    const chartData = data || [];

    // If no data, show empty chart
    if (chartData.length === 0) {
      console.warn(`No data available for ${symbol} - showing empty chart`);
      // Remove the chart instance since we have no data
      chart.remove();
      return;
    }

    // Ensure data is sorted by time
    chartData.sort((a: any, b: any) => a.time - b.time);

    // Create the appropriate series
    let series: ISeriesApi<any>;
    
    if (type === 'candle') {
      // Use green/red colors matching the market page
      series = chart.addCandlestickSeries({
        upColor: '#16a34a', // green-600
        downColor: '#dc2626', // red-600
        borderVisible: false,
        wickUpColor: '#16a34a',
        wickDownColor: '#dc2626',
      });
    } else if (type === 'area') {
      series = chart.addAreaSeries({
        lineColor: '#16a34a', // green-600
        topColor: 'rgba(22, 163, 74, 0.3)',
        bottomColor: 'rgba(22, 163, 74, 0)',
        lineWidth: 2,
      });
    } else {
      series = chart.addLineSeries({
        color: '#2563eb', // blue-600
        lineWidth: 2,
      });
    }

    series.setData(chartData);
    seriesRef.current = series;
    
    // Fit content
    chart.timeScale().fitContent();

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current && chart) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [type, height, data]);

  // Update with real-time price for ALL intervals
  useEffect(() => {
    if (realTimePrice && seriesRef.current && data && data.length > 0) {
      const lastDataPoint = data[data.length - 1];

      // Always update the current candle with real-time price
      // This applies to ALL intervals - 1min, 5min, 1hour, 1day, 1week, etc.
      // The real-time price updates the CURRENT candle, not create new candles

      if (type === 'candle') {
        // Update the current candle's high/low/close with the real-time price
        seriesRef.current.update({
          time: lastDataPoint.time,
          open: lastDataPoint.open,
          high: Math.max(lastDataPoint.high, realTimePrice),
          low: Math.min(lastDataPoint.low, realTimePrice),
          close: realTimePrice,
        });
      } else {
        // For line/area charts, just update the last value
        seriesRef.current.update({
          time: lastDataPoint.time,
          value: realTimePrice,
        });
      }
    }
  }, [realTimePrice, type, data, interval]);

  // Show loading message if no data
  if (!data || data.length === 0) {
    return (
      <div
        className="w-full flex items-center justify-center text-gray-500"
        style={{ minHeight: height }}
      >
        <div className="text-center">
          <p>Loading chart data...</p>
          <p className="text-sm mt-2">Data will appear when market is active</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={chartContainerRef}
      className="w-full"
      style={{ minHeight: height }}
    />
  );
}